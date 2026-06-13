const $ = (s) => document.querySelector(s);

const TYPE = {
  pr: { color: "#cdd8f0", label: "pull requests" },
  commit: { color: "#7fd4ff", label: "commits" },
  decision: { color: "#ffce6a", label: "decisions" },
  focus: { color: "#9af5c4", label: "current focus" },
};
const DOCS = [
  ["architecture", "Architecture"],
  ["conventions", "Conventions"],
  ["journal", "Journal"],
  ["decisions", "Decisions"],
];
const DOC_SECTIONS = [
  { title: "Overview", items: ["architecture", "conventions", "journal"] },
  { title: "Knowledge", items: ["decisions"] },
];
const docLabel = (id) => (DOCS.find((d) => d[0] === id) || [id, id])[1];

// Timeline geometry (model coordinates). The spine (PR groups + loose commits)
// runs down x=0, newest at top; expanded commits indent right; decisions sit in
// a far-right lane; focus floats up-left.
const ROW = 96; // spine row height
const MEMROW = 60; // expanded member row height
const MEM_X = 165; // indent for expanded commits
const DEC_X = 410; // decision lane

let spine = null;
let graph = null;
let cy = null;
let expanded = new Set(); // pr ids currently expanded (default: all collapsed)
let docActive = "architecture";

async function boot() {
  makeStars();
  try {
    [spine, graph] = await Promise.all([
      fetch("/api/spine").then((r) => r.json()),
      fetch("/api/graph").then((r) => r.json()),
    ]);
  } catch {
    $("#cy").innerHTML = `<div class="floatmsg">Couldn't reach the server.</div>`;
    return;
  }
  setupModes();
  if (!spine.exists) {
    $("#hint").hidden = true;
    $("#legend").hidden = true;
    $("#cy").innerHTML = `<div class="floatmsg"><div class="kicker">no spine</div><h1>Nothing recorded here yet</h1><p>Run <code>init</code> to create a <code>.spine/</code> store, then refresh.</p></div>`;
    return;
  }
  renderGraph();
  renderLegend();
  renderDocsNav();
}

function setupModes() {
  document.querySelectorAll(".mode").forEach((b) =>
    b.addEventListener("click", () => switchMode(b.dataset.mode))
  );
}
function switchMode(m) {
  document.querySelectorAll(".mode").forEach((b) => b.classList.toggle("active", b.dataset.mode === m));
  $("#graph-view").hidden = m !== "graph";
  $("#docs-view").hidden = m !== "docs";
  if (m === "graph" && cy) {
    cy.resize();
    focusTop();
  }
  if (m === "docs") renderDoc(docActive);
}

/* ---------- graph: PR-clustered timeline with collapse/expand ---------- */

const nodeById = (id) => graph.nodes.find((n) => n.id === id);

// A commit in a collapsed group resolves to its group node; everything else is itself.
function resolve(id) {
  const n = nodeById(id);
  if (n && n.type === "commit" && n.group && !expanded.has(n.group)) return n.group;
  return id;
}
function isVisible(n) {
  if (n.type === "commit") return !n.group || expanded.has(n.group);
  return true; // pr, decision, focus
}

const byTimeDesc = (a, b) => (a.time < b.time ? 1 : a.time > b.time ? -1 : 0);

// Position visible nodes as a vertical timeline for the current collapse state.
function layoutTimeline(visible) {
  const pos = {};
  const yOf = {};
  const spineItems = visible
    .filter((n) => n.type === "pr" || (n.type === "commit" && !n.group))
    .sort(byTimeDesc);

  let y = 0;
  for (const item of spineItems) {
    pos[item.id] = { x: 0, y };
    yOf[item.id] = y;
    y += ROW;
    if (item.type === "pr" && expanded.has(item.id)) {
      const members = visible.filter((n) => n.type === "commit" && n.group === item.id).sort(byTimeDesc);
      for (const mc of members) {
        pos[mc.id] = { x: MEM_X, y };
        yOf[mc.id] = y;
        y += MEMROW;
      }
      y += ROW * 0.25;
    }
  }

  // decisions → right lane, near the y of their (resolved) target
  const decideTarget = {};
  graph.edges.filter((e) => e.rel === "decides").forEach((e) => (decideTarget[e.source] = resolve(e.target)));
  const stackAt = {};
  for (const n of visible.filter((n) => n.type === "decision")) {
    const tgt = decideTarget[n.id];
    const baseY = tgt != null && yOf[tgt] != null ? yOf[tgt] : 0;
    const k = stackAt[baseY] || 0;
    pos[n.id] = { x: DEC_X, y: baseY + k * MEMROW };
    stackAt[baseY] = k + 1;
  }

  const focus = visible.find((n) => n.type === "focus");
  if (focus) pos[focus.id] = { x: -210, y: -ROW * 1.1 };
  return pos;
}

function nodeData(n) {
  if (n.type === "pr") {
    const open = expanded.has(n.id);
    return { id: n.id, type: "pr", label: `${open ? "▾" : "▸"}  ${n.label}   ·${n.count}` };
  }
  return { id: n.id, type: n.type, label: n.label, milestone: n.milestone ? 1 : 0 };
}

// Build cytoscape elements for the current collapse state, re-pointing any edge
// that crosses into a collapsed group to the group node (and dropping internal ones).
function computeElements() {
  const visible = graph.nodes.filter(isVisible);
  const pos = layoutTimeline(visible);

  const seen = new Set();
  const edges = [];
  for (const e of graph.edges) {
    const s = resolve(e.source);
    const t = resolve(e.target);
    if (s === t) continue;
    const key = `${s}>${t}:${e.rel}`;
    if (seen.has(key)) continue;
    seen.add(key);
    edges.push({ data: { id: `e${edges.length}`, source: s, target: t, rel: e.rel } });
  }

  return [
    ...visible.map((n) => ({ data: nodeData(n), position: pos[n.id] || { x: 0, y: 0 } })),
    ...edges,
  ];
}

function renderGraph() {
  cy = cytoscape({
    container: $("#cy"),
    elements: computeElements(),
    layout: { name: "preset" },
    minZoom: 0.25,
    maxZoom: 2.5,
    wheelSensitivity: 0.3,
    style: graphStyle(),
  });

  focusTop();
  cy.on("tap", 'node[type="pr"]', (evt) => togglePr(evt.target.id()));
  cy.on("tap", 'node[type="commit"], node[type="decision"], node[type="focus"]', (evt) => openPanel(evt.target));
  cy.on("tap", (evt) => {
    if (evt.target === cy) closePanel();
  });
  cy.on("mouseover", "node", (evt) => highlight(evt.target));
  cy.on("mouseout", "node", clearHighlight);
}

function togglePr(id) {
  expanded.has(id) ? expanded.delete(id) : expanded.add(id);
  const pan = cy.pan();
  const zoom = cy.zoom();
  cy.elements().remove();
  cy.add(computeElements());
  cy.layout({ name: "preset" }).run();
  cy.pan(pan);
  cy.zoom(zoom);
}

// Park the viewport at the top of the timeline (newest), readable at 1:1.
function focusTop() {
  cy.zoom(1);
  cy.pan({ x: cy.width() / 2, y: ROW * 1.6 });
}

function graphStyle() {
  return [
    {
      selector: "node",
      style: {
        label: "data(label)",
        color: "#c9d4ec",
        "font-family": "IBM Plex Sans, system-ui, sans-serif",
        "font-size": 12,
        "text-outline-color": "#05060a",
        "text-outline-width": 2,
        "min-zoomed-font-size": 8,
      },
    },
    // PR group: a chip on the spine, label inside, click to expand
    {
      selector: 'node[type="pr"]',
      style: {
        shape: "round-rectangle",
        "background-color": "rgba(205,216,240,0.10)",
        "border-width": 1.5,
        "border-color": TYPE.pr.color,
        color: "#e7ecf7",
        width: "label",
        height: "label",
        padding: 11,
        "text-valign": "center",
        "text-halign": "center",
        "text-max-width": 320,
        "text-wrap": "ellipsis",
        "font-weight": 600,
      },
    },
    {
      selector: 'node[type="commit"]',
      style: {
        width: 11,
        height: 11,
        shape: "ellipse",
        "background-color": TYPE.commit.color,
        "text-valign": "center",
        "text-halign": "right",
        "text-margin-x": 9,
        "text-max-width": 240,
        "text-wrap": "ellipsis",
        "font-size": 11,
      },
    },
    {
      selector: 'node[type="commit"][milestone = 1]',
      style: { width: 16, height: 16, "border-width": 3, "border-color": TYPE.decision.color, "border-opacity": 0.7 },
    },
    {
      selector: 'node[type="decision"]',
      style: {
        shape: "round-rectangle",
        "background-color": "rgba(255,206,106,0.14)",
        "border-width": 1.5,
        "border-color": TYPE.decision.color,
        color: TYPE.decision.color,
        width: "label",
        height: "label",
        padding: 9,
        "text-valign": "center",
        "text-halign": "center",
        "text-max-width": 200,
        "text-wrap": "wrap",
        "font-size": 11,
      },
    },
    {
      selector: 'node[type="focus"]',
      style: {
        shape: "star",
        width: 28,
        height: 28,
        "background-color": TYPE.focus.color,
        "text-valign": "center",
        "text-halign": "left",
        "text-margin-x": -12,
        color: TYPE.focus.color,
        "font-weight": 600,
      },
    },
    { selector: "edge", style: { "curve-style": "bezier", width: 1.4, opacity: 0.55, "line-color": "#4a5878" } },
    { selector: 'edge[rel="parent"]', style: { "line-color": "rgba(127,212,255,0.55)", width: 2.2, opacity: 0.8 } },
    { selector: 'edge[rel="decides"]', style: { "line-color": TYPE.decision.color, "line-style": "dashed", opacity: 0.55 } },
    { selector: 'edge[rel="supersedes"]', style: { "line-color": "#c8a8ff", "line-style": "dotted", width: 1.8, opacity: 0.8 } },
    { selector: 'edge[rel="focuses"]', style: { "line-color": TYPE.focus.color, "line-style": "dashed", opacity: 0.55 } },
    { selector: ".dim", style: { opacity: 0.07, "text-opacity": 0 } },
    { selector: "node:selected", style: { "border-width": 4, "border-color": "#e7ecf7", "border-opacity": 0.5 } },
    { selector: "node.hot", style: { "text-opacity": 1 } },
    { selector: "edge.hot", style: { opacity: 1, width: 2.6, "line-color": "#aebfe4" } },
  ];
}

function highlight(node) {
  const hood = node.closedNeighborhood();
  cy.elements().addClass("dim");
  hood.removeClass("dim").addClass("hot");
}
function clearHighlight() {
  cy.elements().removeClass("dim hot");
}

function openPanel(node) {
  const id = node.id();
  const type = node.data("type");
  let kicker = type;
  let html = "";

  if (type === "commit") {
    const n = nodeById(id) || {};
    kicker = "commit";
    const meta = [n.shortSha, n.author, fmtDate(n.time)].filter(Boolean).join(" · ");
    const body = n.body ? `<pre class="commit-body">${esc(n.body)}</pre>` : "";
    const mile = n.milestone ? `<p class="milestone">★ ${esc(n.milestone)}</p>` : "";
    html = `<h1>${esc(n.label)}</h1><p class="muted mono">${esc(meta)}</p>${mile}${body}`;
  } else if (type === "decision") {
    const d = spine.decisions.find((x) => x.id === id.replace(/^adr:/, ""));
    kicker = "decision";
    html = d ? d.html : "";
  } else if (type === "focus") {
    kicker = "current focus";
    html = spine.journal ?? "";
  }

  const panel = $("#panel");
  panel.innerHTML = `
    <button class="panel-close" aria-label="Close">×</button>
    <div class="kicker">${kicker}</div>
    <article class="md">${html || '<p class="muted">No detail recorded.</p>'}</article>`;
  panel.hidden = false;
  requestAnimationFrame(() => panel.classList.add("open"));
  panel.querySelector(".panel-close").onclick = closePanel;
  cy.$(":selected").unselect();
  node.select();
}
function closePanel() {
  const p = $("#panel");
  p.classList.remove("open");
  setTimeout(() => (p.hidden = true), 220);
  if (cy) cy.$(":selected").unselect();
}

function fmtDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(+d) ? iso : d.toISOString().slice(0, 10);
}
function esc(s) {
  return String(s).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
}

function renderLegend() {
  $("#legend").innerHTML = Object.entries(TYPE)
    .map(([, v]) => `<span class="leg"><i style="background:${v.color}"></i>${v.label}</span>`)
    .join("");
}

/* ---------- docs mode: three-pane (sidebar · content · TOC) ---------- */
function renderDocsNav() {
  const badge = (id) => (id === "decisions" ? `<span class="badge">${spine.decisions.length}</span>` : "");
  $("#nav").innerHTML = DOC_SECTIONS.map(
    (sec) => `<div class="nav-section"><div class="nav-title">${sec.title}</div>${sec.items
      .map((id) => `<button class="nav-item" data-id="${id}"><span>${docLabel(id)}</span>${badge(id)}</button>`)
      .join("")}</div>`
  ).join("");
  $("#nav").querySelectorAll(".nav-item").forEach((b) =>
    b.addEventListener("click", () => {
      docActive = b.dataset.id;
      renderDoc(docActive);
    })
  );
}
function renderDoc(id) {
  $("#nav").querySelectorAll(".nav-item").forEach((b) => b.classList.toggle("active", b.dataset.id === id));
  let body;
  if (id === "decisions") {
    body = spine.decisions.length
      ? spine.decisions.map((d) => `<article class="md">${d.html}</article>`).join('<hr class="rule" />')
      : '<p class="muted">No decisions yet.</p>';
  } else {
    const map = { architecture: spine.context, conventions: spine.conventions, journal: spine.journal };
    body = `<article class="md">${map[id] ?? '<p class="muted">Empty.</p>'}</article>`;
  }
  $("#main").innerHTML = `<div class="content"><header class="doc-head"><div class="kicker">${docLabel(id)}</div></header>${body}</div>`;
  $("#main").scrollTop = 0;
  buildToc(id);
}

// Generate the on-this-page rail from the rendered headings (ADR-0005).
function buildToc(id) {
  const toc = $("#toc");
  const sel = id === "decisions" ? "article h1" : "article h2, article h3";
  const heads = [...$("#main").querySelectorAll(sel)];
  if (heads.length < 3) {
    toc.hidden = true;
    toc.innerHTML = "";
    return;
  }
  const used = new Set();
  const items = heads.map((h) => {
    let slug = (h.textContent || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "h";
    while (used.has(slug)) slug += "-x";
    used.add(slug);
    h.id = slug;
    return { slug, text: h.textContent, level: h.tagName === "H3" ? "h3" : "h2" };
  });
  toc.hidden = false;
  toc.innerHTML = `<div class="toc-title">On this page</div><div class="toc-list">${items
    .map((it) => `<a class="toc-link ${it.level}" data-slug="${it.slug}">${esc(it.text)}</a>`)
    .join("")}</div>`;
  toc.querySelectorAll(".toc-link").forEach((a) =>
    a.addEventListener("click", () => {
      const el = document.getElementById(a.dataset.slug);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    })
  );
}

/* ---------- starfield ---------- */
function makeStars() {
  const layer = document.createElement("div");
  layer.className = "star-dots";
  const shadows = [];
  for (let i = 0; i < 170; i++) {
    const x = Math.floor(Math.random() * 2600);
    const y = Math.floor(Math.random() * 1700);
    const a = (0.2 + Math.random() * 0.75).toFixed(2);
    shadows.push(`${x}px ${y}px rgba(255,255,255,${a})`);
  }
  layer.style.boxShadow = shadows.join(",");
  $(".stars").appendChild(layer);
}

boot();
