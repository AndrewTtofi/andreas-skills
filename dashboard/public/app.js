const $ = (s) => document.querySelector(s);

// Refined-dark palette (.spine/decisions/0007): slate ramp + one indigo accent.
const ACCENT = "#6e7bf2";
const DOT = "#aab2c5";
const SLATE = "#c9cfdb";
const LINE = "rgba(170,178,197,0.22)";
const LEGEND = [
  { c: ACCENT, label: "clusters" },
  { c: DOT, label: "commits" },
  { c: SLATE, label: "decisions" },
  { c: ACCENT, label: "current focus" },
];
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

// Timeline geometry. The spine (clusters) runs down x=0, newest at top; an
// expanded cluster reveals its commits (indented) and its decisions (further
// right) within its own block. Focus sits atop the spine.
const ROW = 92;
const MEMROW = 56;
const DECROW = 88; // decision cards are taller than commit dots
const MEM_X = 175;
const DEC_X = 470;

let spine = null;
let graph = null;
let cy = null;
let expanded = new Set(); // cluster ids currently expanded (default: all collapsed)
let docActive = "architecture";

async function boot() {
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
  indexDecisions();
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

/* ---------- graph: clustered timeline with collapse/expand ---------- */

const nodeById = (id) => graph.nodes.find((n) => n.id === id);
const isGroup = (n) => n && (n.type === "pr" || n.type === "segment");
const byTimeDesc = (a, b) => (a.time < b.time ? 1 : a.time > b.time ? -1 : 0);

// Map each decision to the cluster of the commit it decides (so it nests there).
let decisionClusterOf = {};
let clusterDecisionCount = {};
function indexDecisions() {
  decisionClusterOf = {};
  clusterDecisionCount = {};
  const target = {};
  graph.edges.filter((e) => e.rel === "decides").forEach((e) => (target[e.source] = e.target));
  for (const d of graph.nodes.filter((n) => n.type === "decision")) {
    const c = nodeById(target[d.id]);
    const cl = c && c.group ? c.group : null;
    decisionClusterOf[d.id] = cl;
    if (cl) clusterDecisionCount[cl] = (clusterDecisionCount[cl] || 0) + 1;
  }
}

function isVisible(n) {
  if (n.type === "commit") return !n.group || expanded.has(n.group);
  if (n.type === "decision") {
    const cl = decisionClusterOf[n.id];
    return !cl || expanded.has(cl);
  }
  return true; // clusters, focus
}
// A commit/decision in a collapsed cluster resolves to the cluster node.
function resolve(id) {
  const n = nodeById(id);
  if (!n) return id;
  if (n.type === "commit" && n.group && !expanded.has(n.group)) return n.group;
  if (n.type === "decision") {
    const cl = decisionClusterOf[id];
    if (cl && !expanded.has(cl)) return cl;
  }
  return id;
}

function layoutTimeline(visible) {
  const pos = {};
  const focus = visible.find((n) => n.type === "focus");
  if (focus) pos[focus.id] = { x: 0, y: -ROW * 1.15 };

  const spineItems = visible.filter(isGroup).sort(byTimeDesc);
  let y = 0;
  for (const item of spineItems) {
    pos[item.id] = { x: 0, y };
    y += ROW;
    if (expanded.has(item.id)) {
      const top = y;
      const members = visible.filter((n) => n.type === "commit" && n.group === item.id).sort(byTimeDesc);
      for (const mc of members) {
        pos[mc.id] = { x: MEM_X, y };
        y += MEMROW;
      }
      let dy = top;
      for (const d of visible.filter((n) => n.type === "decision" && decisionClusterOf[n.id] === item.id)) {
        pos[d.id] = { x: DEC_X, y: dy };
        dy += DECROW;
      }
      y = Math.max(y, dy) + ROW * 0.3;
    }
  }
  return pos;
}

function nodeData(n) {
  if (isGroup(n)) {
    const open = expanded.has(n.id);
    const dec = clusterDecisionCount[n.id] ? `   ◆${clusterDecisionCount[n.id]}` : "";
    return { id: n.id, type: n.type, label: `${open ? "▾" : "▸"}  ${n.label}   ·${n.count}${dec}` };
  }
  return { id: n.id, type: n.type, label: n.label, milestone: n.milestone ? 1 : 0 };
}

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
  return [...visible.map((n) => ({ data: nodeData(n), position: pos[n.id] || { x: 0, y: 0 } })), ...edges];
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
  cy.on("tap", 'node[type="pr"], node[type="segment"]', (evt) => toggleGroup(evt.target.id()));
  cy.on("tap", 'node[type="commit"], node[type="decision"], node[type="focus"]', (evt) => openPanel(evt.target));
  cy.on("tap", (evt) => {
    if (evt.target === cy) closePanel();
  });
  cy.on("mouseover", "node", (evt) => highlight(evt.target));
  cy.on("mouseout", "node", clearHighlight);
}

function toggleGroup(id) {
  expanded.has(id) ? expanded.delete(id) : expanded.add(id);
  const pan = cy.pan();
  const zoom = cy.zoom();
  cy.elements().remove();
  cy.add(computeElements());
  cy.layout({ name: "preset" }).run();
  cy.pan(pan);
  cy.zoom(zoom);
}

function focusTop() {
  cy.zoom(1);
  cy.pan({ x: cy.width() / 2, y: ROW * 1.8 });
}

function graphStyle() {
  return [
    {
      selector: "node",
      style: {
        label: "data(label)",
        color: SLATE,
        "font-family": "IBM Plex Sans, system-ui, sans-serif",
        "font-size": 12,
        "text-outline-color": "#0d0f14",
        "text-outline-width": 2,
        "min-zoomed-font-size": 8,
      },
    },
    // clusters (PR + segment): accent-outlined chips on the spine
    {
      selector: 'node[type="pr"], node[type="segment"]',
      style: {
        shape: "round-rectangle",
        "background-color": "rgba(110,123,242,0.10)",
        "border-width": 1.5,
        "border-color": ACCENT,
        color: "#e6e8ee",
        width: "label",
        height: "label",
        padding: 11,
        "text-valign": "center",
        "text-halign": "center",
        "text-max-width": 330,
        "text-wrap": "ellipsis",
        "font-weight": 600,
      },
    },
    {
      selector: 'node[type="commit"]',
      style: {
        width: 10,
        height: 10,
        shape: "ellipse",
        "background-color": DOT,
        "text-valign": "center",
        "text-halign": "right",
        "text-margin-x": 9,
        "text-max-width": 250,
        "text-wrap": "ellipsis",
        color: "#9aa0ad",
        "font-size": 11,
      },
    },
    {
      selector: 'node[type="commit"][milestone = 1]',
      style: { width: 14, height: 14, "border-width": 3, "border-color": ACCENT, "border-opacity": 0.8, color: SLATE },
    },
    {
      selector: 'node[type="decision"]',
      style: {
        shape: "round-rectangle",
        "background-color": "rgba(201,207,219,0.05)",
        "border-width": 1,
        "border-color": LINE,
        color: SLATE,
        width: "label",
        height: "label",
        padding: 9,
        "text-valign": "center",
        "text-halign": "center",
        "text-max-width": 210,
        "text-wrap": "wrap",
        "font-size": 11,
      },
    },
    {
      selector: 'node[type="focus"]',
      style: {
        shape: "star",
        width: 26,
        height: 26,
        "background-color": ACCENT,
        "text-valign": "center",
        "text-halign": "right",
        "text-margin-x": 10,
        color: "#aab4f6",
        "font-weight": 600,
      },
    },
    { selector: "edge", style: { "curve-style": "bezier", width: 1.3, opacity: 0.5, "line-color": LINE } },
    { selector: 'edge[rel="parent"]', style: { "line-color": "rgba(170,178,197,0.4)", width: 2, opacity: 0.7 } },
    { selector: 'edge[rel="decides"]', style: { "line-color": LINE, "line-style": "dashed", opacity: 0.6 } },
    { selector: 'edge[rel="supersedes"]', style: { "line-color": ACCENT, "line-style": "dotted", width: 1.6, opacity: 0.7 } },
    { selector: 'edge[rel="focuses"]', style: { "line-color": ACCENT, "line-style": "dashed", opacity: 0.5 } },
    { selector: ".dim", style: { opacity: 0.06, "text-opacity": 0 } },
    { selector: "node:selected", style: { "border-width": 2.5, "border-color": ACCENT, "border-opacity": 0.9 } },
    { selector: "node.hot", style: { "text-opacity": 1 } },
    { selector: "edge.hot", style: { opacity: 1, width: 2.4, "line-color": ACCENT } },
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
  $("#legend").innerHTML = LEGEND.map((v) => `<span class="leg"><i style="background:${v.c}"></i>${v.label}</span>`).join("");
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

boot();
