const $ = (s) => document.querySelector(s);

const TYPE = {
  module: { color: "#7fd4ff", shape: "ellipse", label: "modules" },
  decision: { color: "#ffce6a", shape: "round-diamond", label: "decisions" },
  conventions: { color: "#c8a8ff", shape: "round-rectangle", label: "conventions" },
  focus: { color: "#9af5c4", shape: "star", label: "current focus" },
};
const DOCS = [
  ["architecture", "Architecture"],
  ["conventions", "Conventions"],
  ["journal", "Journal"],
  ["decisions", "Decisions"],
];

let spine = null;
let graph = null;
let cy = null;
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
    cy.fit(undefined, 64);
  }
  if (m === "docs") renderDoc(docActive);
}

function renderGraph() {
  // Obsidian-style: node size scales with how connected a node is (its degree).
  const deg = {};
  graph.nodes.forEach((n) => (deg[n.id] = 0));
  graph.edges.forEach((e) => {
    deg[e.source] = (deg[e.source] ?? 0) + 1;
    deg[e.target] = (deg[e.target] ?? 0) + 1;
  });
  const nodeSize = (e) => 18 + Math.sqrt(e.data("deg")) * 11;

  const elements = [
    ...graph.nodes.map((n) => ({ data: { id: n.id, label: n.label, type: n.type, deg: deg[n.id] || 0 } })),
    ...graph.edges.map((e, i) => ({ data: { id: "e" + i, source: e.source, target: e.target, rel: e.rel } })),
  ];
  cy = cytoscape({
    container: $("#cy"),
    elements,
    minZoom: 0.2,
    maxZoom: 3,
    wheelSensitivity: 0.25,
    style: [
      {
        selector: "node",
        style: {
          "background-color": (e) => TYPE[e.data("type")].color,
          "background-opacity": 0.95,
          shape: "ellipse",
          width: nodeSize,
          height: nodeSize,
          label: "data(label)",
          color: "#c9d4ec",
          "font-family": "IBM Plex Sans, system-ui, sans-serif",
          "font-size": 12,
          "font-weight": 500,
          "text-valign": "bottom",
          "text-halign": "center",
          "text-margin-y": 7,
          "text-outline-color": "#05060a",
          "text-outline-width": 2,
          "min-zoomed-font-size": 9,
          "border-width": 8,
          "border-color": (e) => TYPE[e.data("type")].color,
          "border-opacity": 0.14,
          "transition-property": "border-opacity, background-opacity",
          "transition-duration": "160ms",
        },
      },
      {
        selector: "edge",
        style: {
          width: 1.1,
          "line-color": "#4a5878",
          opacity: 0.4,
          "curve-style": "bezier",
          label: "data(rel)",
          "font-family": "IBM Plex Mono, monospace",
          "font-size": 9,
          color: "#9fb0d4",
          "text-opacity": 0,
          "text-rotation": "autorotate",
          "text-background-color": "#05060a",
          "text-background-opacity": 0.75,
          "text-background-padding": 3,
        },
      },
      { selector: "node:selected", style: { "border-opacity": 0.6, "background-opacity": 1 } },
      { selector: ".dim", style: { opacity: 0.08, "text-opacity": 0 } },
      { selector: "node.hot", style: { "border-opacity": 0.5 } },
      { selector: "edge.hot", style: { opacity: 0.95, "text-opacity": 0.95, "line-color": "#aebfe4", width: 1.8 } },
    ],
  });

  runForceLayout();

  cy.on("tap", "node", (evt) => openPanel(evt.target));
  cy.on("tap", (evt) => {
    if (evt.target === cy) closePanel();
  });
  cy.on("mouseover", "node", (evt) => highlight(evt.target));
  cy.on("mouseout", "node", clearHighlight);
}

// Obsidian-like organic spread. Prefer fcose (high-quality force layout);
// fall back to the built-in cose if the fcose CDN script didn't load.
function runForceLayout() {
  const fcose = {
    name: "fcose",
    quality: "proof",
    animate: true,
    animationDuration: 900,
    randomize: true,
    fit: true,
    padding: 90,
    nodeSeparation: 150,
    idealEdgeLength: 130,
    nodeRepulsion: 9000,
    gravity: 0.18,
    gravityRange: 3.6,
    numIter: 2500,
  };
  const cose = {
    name: "cose",
    animate: true,
    animationDuration: 900,
    fit: true,
    padding: 90,
    idealEdgeLength: 130,
    nodeRepulsion: 14000,
    gravity: 0.2,
    componentSpacing: 180,
    nodeOverlap: 28,
  };
  try {
    cy.layout(fcose).run();
  } catch {
    cy.layout(cose).run();
  }
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
  const type = node.data("type");
  const id = node.id();
  let html = "";
  if (type === "decision") {
    const adrId = id.replace(/^adr:/, "");
    const d = spine.decisions.find((x) => x.id === adrId);
    html = d ? d.html : "";
  } else if (type === "conventions") html = spine.conventions ?? "";
  else if (type === "focus") html = spine.journal ?? "";
  else if (type === "module") html = spine.context ?? "";

  const kicker = { module: "module", decision: "decision", conventions: "conventions", focus: "current focus" }[type];
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

function renderLegend() {
  $("#legend").innerHTML = Object.entries(TYPE)
    .map(([t, v]) => `<span class="leg"><i style="background:${v.color}"></i>${v.label}</span>`)
    .join("");
}

/* ---------- docs mode ---------- */
function renderDocsNav() {
  $("#nav").innerHTML = DOCS.map(([id, l]) => `<button class="nav-item" data-id="${id}">${l}</button>`).join("");
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
  const label = DOCS.find((d) => d[0] === id)[1];
  $("#main").innerHTML = `<div class="content"><div class="kicker">${label}</div>${body}</div>`;
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
