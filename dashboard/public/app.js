const $ = (s) => document.querySelector(s);

// Stripe-grade light palette (.spine/decisions/0008): navy ink + one blurple accent.
const ACCENT = "#635bff";
const DOT = "#8792a2";
const INK = "#0a2540";
const SLATE = "#52607a";
const LINE = "#d4dae3";
const HUB = "#aab4c4";
const LEGEND = [
  { c: ACCENT, label: "pull requests" },
  { c: HUB, label: "modules" },
  { c: "#b9c2cf", label: "decisions" },
  { c: "#8a83ff", label: "concepts" },
  { c: DOT, label: "commits" },
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

let spine = null;
let graph = null;
let cy = null;
let expanded = new Set(); // cluster ids expanded to show their commits
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
    $(".search").hidden = true;
    $("#cy").innerHTML = `<div class="floatmsg"><div class="kicker">no spine</div><h1>Nothing recorded here yet</h1><p>Run <code>init</code> to create a <code>.spine/</code> store, then refresh.</p></div>`;
    return;
  }
  renderGraph();
  renderLegend();
  renderDocsNav();
  setupSearch();
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
    cy.fit(undefined, 60);
  }
  if (m === "docs") renderDoc(docActive);
}

/* ---------- the brain: force-directed knowledge graph ---------- */

const nodeById = (id) => graph.nodes.find((n) => n.id === id);
const isGroup = (n) => n && (n.type === "pr" || n.type === "segment");

// Commits hide inside collapsed clusters; every other node is always present.
function isVisible(n) {
  if (n.type === "focus") return false; // the current-focus star was removed
  return n.type !== "commit" || expanded.has(n.group);
}
function resolve(id) {
  const n = nodeById(id);
  if (n && n.type === "commit" && n.group && !expanded.has(n.group)) return n.group;
  return id;
}

function nodeData(n) {
  const deg = degreeOf(n.id);
  if (isGroup(n)) {
    const open = expanded.has(n.id);
    return { id: n.id, type: n.type, label: `${open ? "▾" : "▸"}  ${n.label}   ·${n.count}`, deg };
  }
  if (n.type === "module") return { id: n.id, type: "module", label: n.label, size: 16 + Math.min(n.count, 8) * 4, deg };
  if (n.type === "concept") return { id: n.id, type: "concept", label: n.label, deg };
  return { id: n.id, type: n.type, label: n.label, milestone: n.milestone ? 1 : 0, deg };
}

let _deg = null;
function degreeOf(id) {
  if (!_deg) {
    _deg = {};
    for (const e of graph.edges) {
      const s = resolve(e.source);
      const t = resolve(e.target);
      _deg[s] = (_deg[s] || 0) + 1;
      _deg[t] = (_deg[t] || 0) + 1;
    }
  }
  return _deg[id] || 0;
}

function computeElements() {
  _deg = null; // recompute per collapse-state
  const visible = graph.nodes.filter(isVisible);
  const present = new Set(visible.map((n) => n.id));
  const seen = new Set();
  const edges = [];
  for (const e of graph.edges) {
    const s = resolve(e.source);
    const t = resolve(e.target);
    if (s === t || !present.has(s) || !present.has(t)) continue;
    const key = `${s}>${t}:${e.rel}`;
    if (seen.has(key)) continue;
    seen.add(key);
    edges.push({ data: { id: `e${edges.length}`, source: s, target: t, rel: e.rel } });
  }
  // Anchor an expanded cluster's commits to it so they sprout nearby, not adrift.
  for (const n of visible) {
    if (isGroup(n) && expanded.has(n.id)) {
      for (const c of graph.nodes) {
        if (c.type === "commit" && c.group === n.id) {
          edges.push({ data: { id: `e${edges.length}`, source: n.id, target: c.id, rel: "contains" } });
        }
      }
    }
  }
  return [...visible.map((n) => ({ data: nodeData(n) })), ...edges];
}

function renderGraph() {
  cy = cytoscape({
    container: $("#cy"),
    elements: computeElements(),
    minZoom: 0.15,
    maxZoom: 3,
    wheelSensitivity: 0.3,
    style: graphStyle(),
  });
  runLayout();
  cy.on("tap", 'node[type="pr"], node[type="segment"]', (evt) => toggleGroup(evt.target.id()));
  cy.on("tap", 'node[type="commit"], node[type="decision"], node[type="focus"], node[type="module"], node[type="concept"]', (evt) => openPanel(evt.target));
  cy.on("tap", (evt) => {
    if (evt.target === cy) {
      closePanel();
      cy.elements().removeClass("faded");
    }
  });
  cy.on("mouseover", "node", (evt) => highlight(evt.target));
  cy.on("mouseout", "node", clearHighlight);
}

function runLayout(randomize = true) {
  const opts = {
    name: "fcose",
    quality: "default",
    animate: true,
    animationDuration: 600,
    randomize,
    fit: true,
    padding: 60,
    nodeSeparation: 130,
    idealEdgeLength: 95,
    nodeRepulsion: 7000,
    gravity: 0.22,
    gravityRange: 3.2,
    numIter: 1800,
  };
  try {
    cy.layout(opts).run();
  } catch {
    cy.layout({ name: "cose", animate: true, fit: true, padding: 60, nodeRepulsion: 12000, idealEdgeLength: 95 }).run();
  }
}

// Expand/collapse a cluster WITHOUT reshuffling the rest of the brain. Existing
// nodes keep their exact positions; on expand the cluster's commits are placed in
// a tidy ring around it, and the view focuses on the cluster + everything related
// to it (its commits, the modules it touched, the ADRs) so nothing overlaps.
function toggleGroup(id) {
  const opening = !expanded.has(id);
  const prev = {};
  cy.nodes().forEach((n) => (prev[n.id()] = { ...n.position() }));
  opening ? expanded.add(id) : expanded.delete(id);

  cy.elements().remove();
  cy.add(computeElements());
  cy.nodes().forEach((n) => prev[n.id()] && n.position(prev[n.id()]));

  if (opening) {
    placeCommitsRing(id, prev[id] || { x: 0, y: 0 });
    focusCluster(id);
  } else {
    cy.elements().removeClass("faded");
  }
}

// Place a cluster's commits evenly on a ring around it (radius grows with count),
// so they never overlap each other.
function placeCommitsRing(id, anchor) {
  const members = graph.nodes.filter((n) => n.type === "commit" && n.group === id);
  const r = 70 + members.length * 13;
  members.forEach((c, i) => {
    const a = (i / Math.max(members.length, 1)) * 2 * Math.PI - Math.PI / 2;
    const el = cy.getElementById(c.id);
    if (el.length) el.position({ x: anchor.x + Math.cos(a) * r, y: anchor.y + Math.sin(a) * r });
  });
}

// Fade everything unrelated and fit the view to the cluster + its neighbourhood.
function focusCluster(id) {
  let core = cy.getElementById(id);
  for (const c of graph.nodes.filter((n) => n.type === "commit" && n.group === id)) {
    const el = cy.getElementById(c.id);
    if (el.length) core = core.union(el);
  }
  const related = core.closedNeighborhood();
  cy.elements().removeClass("faded");
  cy.elements().difference(related).addClass("faded");
  cy.animate({ fit: { eles: related, padding: 70 } }, { duration: 420 });
}

function graphStyle() {
  return [
    {
      selector: "node",
      style: {
        label: "data(label)",
        color: SLATE,
        "font-family": "Inter, system-ui, sans-serif",
        "font-size": 11,
        "text-outline-color": "#f6f9fc",
        "text-outline-width": 2.5,
        "min-zoomed-font-size": 9,
      },
    },
    {
      selector: 'node[type="pr"], node[type="segment"]',
      style: {
        shape: "round-rectangle",
        "background-color": "#ffffff",
        "border-width": 1.5,
        "border-color": ACCENT,
        color: INK,
        width: "label",
        height: "label",
        padding: 11,
        "text-valign": "center",
        "text-halign": "center",
        "text-max-width": 250,
        "text-wrap": "ellipsis",
        "font-weight": 600,
        "font-size": 12,
        "text-outline-width": 0,
      },
    },
    {
      selector: 'node[type="module"]',
      style: {
        shape: "round-rectangle",
        "background-color": "#eef1f6",
        "border-width": 1,
        "border-color": "#c8d0da",
        width: "data(size)",
        height: "data(size)",
        label: "data(label)",
        color: "#5b6675",
        "font-family": "IBM Plex Mono, monospace",
        "font-size": 10,
        "text-valign": "bottom",
        "text-margin-y": 4,
        "text-max-width": 150,
        "text-wrap": "ellipsis",
      },
    },
    {
      selector: 'node[type="concept"]',
      style: {
        shape: "round-rectangle",
        "background-color": "rgba(99,91,255,0.08)",
        "border-width": 1,
        "border-color": ACCENT,
        color: "#5249e0",
        width: "label",
        height: "label",
        padding: 8,
        "text-valign": "center",
        "text-halign": "center",
        "font-size": 11,
        "font-weight": 500,
        "text-outline-width": 0,
      },
    },
    {
      selector: 'node[type="decision"]',
      style: {
        shape: "round-rectangle",
        "background-color": "#ffffff",
        "border-width": 1,
        "border-color": LINE,
        color: SLATE,
        width: "label",
        height: "label",
        padding: 9,
        "text-valign": "center",
        "text-halign": "center",
        "text-max-width": 180,
        "text-wrap": "ellipsis",
        "font-size": 11,
        "text-outline-width": 0,
      },
    },
    {
      selector: 'node[type="commit"]',
      style: {
        width: 8,
        height: 8,
        shape: "ellipse",
        "background-color": DOT,
        color: "#697386",
        "text-max-width": 170,
        "text-wrap": "ellipsis",
        "font-size": 10,
      },
    },
    { selector: 'node[type="commit"][milestone = 1]', style: { width: 12, height: 12, "border-width": 2.5, "border-color": ACCENT, color: INK } },
    {
      selector: 'node[type="focus"]',
      style: { shape: "star", width: 22, height: 22, "background-color": ACCENT, color: ACCENT, "font-weight": 600 },
    },
    { selector: "edge", style: { "curve-style": "bezier", width: 1, opacity: 0.85, "line-color": LINE } },
    { selector: 'edge[rel="parent"]', style: { "line-color": "#c2cad6", width: 1.6 } },
    { selector: 'edge[rel="touches"]', style: { "line-color": "#dfe4ea", width: 1 } },
    { selector: 'edge[rel="contains"]', style: { "line-color": "#e7ebf0", width: 1, opacity: 0.7 } },
    { selector: 'edge[rel="decides"]', style: { "line-color": LINE, "line-style": "dashed" } },
    { selector: 'edge[rel="references"]', style: { "line-color": ACCENT, "line-style": "dashed", opacity: 0.5 } },
    { selector: 'edge[rel="supersedes"]', style: { "line-color": ACCENT, "line-style": "dotted", width: 1.6, opacity: 0.7 } },
    { selector: 'edge[rel="mentions"]', style: { "line-color": "#cdd0f5", "line-style": "dashed", opacity: 0.7 } },
    { selector: 'edge[rel="focuses"]', style: { "line-color": ACCENT, "line-style": "dashed", opacity: 0.6 } },
    { selector: ".dim", style: { opacity: 0.1, "text-opacity": 0.15 } },
    { selector: ".faded", style: { opacity: 0.07, "text-opacity": 0 } },
    { selector: "node:selected", style: { "border-width": 2.5, "border-color": ACCENT } },
    { selector: "node.hot", style: { "text-opacity": 1, "z-index": 99 } },
    { selector: "edge.hot", style: { opacity: 1, width: 2.2, "line-color": ACCENT } },
    { selector: "node.search-hit", style: { "border-width": 3, "border-color": ACCENT, "text-opacity": 1 } },
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

/* ---------- search: jump to any node ---------- */
function setupSearch() {
  const input = $("#q");
  input.addEventListener("input", () => runSearch(input.value));
  input.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      input.value = "";
      runSearch("");
      input.blur();
    }
  });
}
function runSearch(raw) {
  const q = raw.trim().toLowerCase();
  cy.elements().removeClass("dim hot search-hit faded");
  if (!q) {
    cy.fit(undefined, 60);
    return;
  }
  const matched = graph.nodes.filter((n) => (n.label || "").toLowerCase().includes(q) || n.id.toLowerCase().includes(q));
  // expand clusters that contain matching commits, so they're navigable
  let changed = false;
  for (const n of matched) {
    if (n.type === "commit" && n.group && !expanded.has(n.group)) {
      expanded.add(n.group);
      changed = true;
    }
  }
  if (changed) {
    cy.elements().remove();
    cy.add(computeElements());
    runLayout(false);
  }
  const ids = new Set(matched.map((n) => resolve(n.id)));
  const hits = cy.nodes().filter((n) => ids.has(n.id()));
  if (!hits.length) return;
  cy.elements().addClass("dim");
  hits.removeClass("dim").addClass("search-hit");
  hits.neighborhood().removeClass("dim");
  cy.animate({ fit: { eles: hits, padding: 140 } }, { duration: 320 });
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
  } else if (type === "module") {
    kicker = "module";
    const touched = node.connectedEdges('[rel="touches"]').connectedNodes('[type="pr"], [type="segment"]');
    const list = touched.map((c) => `<li>${esc((c.data("label") || "").replace(/^[▸▾]\s*/, ""))}</li>`).join("");
    html = `<h1>${esc(node.data("label"))}</h1><p class="muted">Touched by ${touched.length} clusters:</p><ul>${list}</ul>`;
  } else if (type === "concept") {
    kicker = "concept";
    html = `<h1>${esc(node.data("label"))}</h1><p class="muted">A shared-language term. See it referenced across the decisions it links.</p>`;
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
