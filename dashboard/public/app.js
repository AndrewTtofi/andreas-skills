const $ = (s) => document.querySelector(s);

const TYPE = {
  commit: { color: "#7fd4ff", label: "commits" },
  decision: { color: "#ffce6a", label: "decisions" },
  focus: { color: "#9af5c4", label: "current focus" },
};
const REL = { parent: "sequence", decides: "decides", supersedes: "supersedes", focuses: "focus" };
const DOCS = [
  ["architecture", "Architecture"],
  ["conventions", "Conventions"],
  ["journal", "Journal"],
  ["decisions", "Decisions"],
];

// Timeline geometry (model coordinates). Commits run down a central spine,
// newest at top; decisions sit in a lane to the right; focus floats up-left.
const ROW = 92;
const LANE = 300;

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
    focusTop();
  }
  if (m === "docs") renderDoc(docActive);
}

// Compute a deterministic vertical-timeline position for every node.
function layoutPositions() {
  const commits = graph.nodes
    .filter((n) => n.type === "commit")
    .sort((a, b) => (a.time < b.time ? 1 : a.time > b.time ? -1 : 0)); // newest first
  const yOf = {};
  commits.forEach((n, i) => (yOf[n.id] = i * ROW));

  const decideTarget = {};
  graph.edges.filter((e) => e.rel === "decides").forEach((e) => (decideTarget[e.source] = e.target));

  const pos = {};
  for (const n of commits) pos[n.id] = { x: 0, y: yOf[n.id] };

  const stack = {}; // stack multiple ADRs sharing a commit row
  for (const n of graph.nodes.filter((n) => n.type === "decision")) {
    const tgt = decideTarget[n.id];
    const baseY = tgt != null && yOf[tgt] != null ? yOf[tgt] : 0;
    const k = stack[baseY] || 0;
    pos[n.id] = { x: LANE, y: baseY + k * (ROW * 0.62) };
    stack[baseY] = k + 1;
  }

  const focus = graph.nodes.find((n) => n.type === "focus");
  if (focus) pos[focus.id] = { x: -LANE * 0.7, y: -ROW * 1.1 };

  return pos;
}

function renderGraph() {
  const pos = layoutPositions();
  const elements = [
    ...graph.nodes.map((n) => ({
      data: { id: n.id, label: n.label, type: n.type, milestone: n.milestone ? 1 : 0, sha: n.shortSha || "" },
      position: pos[n.id] || { x: 0, y: 0 },
    })),
    ...graph.edges.map((e, i) => ({ data: { id: "e" + i, source: e.source, target: e.target, rel: e.rel } })),
  ];

  cy = cytoscape({
    container: $("#cy"),
    elements,
    layout: { name: "preset" },
    minZoom: 0.25,
    maxZoom: 2.5,
    wheelSensitivity: 0.3,
    style: [
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
      // commits: dots on the spine, label to the left
      {
        selector: 'node[type="commit"]',
        style: {
          width: 13,
          height: 13,
          shape: "ellipse",
          "background-color": TYPE.commit.color,
          "text-valign": "center",
          "text-halign": "left",
          "text-margin-x": -12,
          "text-max-width": 230,
          "text-wrap": "ellipsis",
        },
      },
      // milestones: brighter, amber ring
      {
        selector: 'node[type="commit"][milestone = 1]',
        style: {
          width: 19,
          height: 19,
          "border-width": 4,
          "border-color": TYPE.decision.color,
          "border-opacity": 0.7,
          "font-weight": 600,
        },
      },
      // decisions: amber cards in the right lane
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
          padding: 10,
          "text-valign": "center",
          "text-halign": "center",
          "text-max-width": 190,
          "text-wrap": "wrap",
          "font-size": 11,
        },
      },
      // focus: mint star, up-left
      {
        selector: 'node[type="focus"]',
        style: {
          shape: "star",
          width: 30,
          height: 30,
          "background-color": TYPE.focus.color,
          "text-valign": "center",
          "text-halign": "left",
          "text-margin-x": -12,
          color: TYPE.focus.color,
          "font-weight": 600,
        },
      },
      {
        selector: "edge",
        style: { "curve-style": "straight", width: 1.4, opacity: 0.55, "line-color": "#4a5878" },
      },
      // the commit spine
      {
        selector: 'edge[rel="parent"]',
        style: { "line-color": "rgba(127,212,255,0.55)", width: 2.4, opacity: 0.8, "curve-style": "bezier" },
      },
      {
        selector: 'edge[rel="decides"]',
        style: { "line-color": TYPE.decision.color, "line-style": "dashed", opacity: 0.6, "curve-style": "bezier" },
      },
      {
        selector: 'edge[rel="supersedes"]',
        style: { "line-color": "#c8a8ff", "line-style": "dotted", width: 1.8, opacity: 0.8 },
      },
      {
        selector: 'edge[rel="focuses"]',
        style: { "line-color": TYPE.focus.color, "line-style": "dashed", opacity: 0.6, "curve-style": "bezier" },
      },
      { selector: ".dim", style: { opacity: 0.07, "text-opacity": 0 } },
      { selector: "node:selected", style: { "border-width": 4, "border-color": "#e7ecf7", "border-opacity": 0.5 } },
      { selector: "node.hot", style: { "text-opacity": 1 } },
      { selector: "edge.hot", style: { opacity: 1, width: 2.6, "line-color": "#aebfe4" } },
    ],
  });

  focusTop();
  cy.on("tap", "node", (evt) => openPanel(evt.target));
  cy.on("tap", (evt) => {
    if (evt.target === cy) closePanel();
  });
  cy.on("mouseover", "node", (evt) => highlight(evt.target));
  cy.on("mouseout", "node", clearHighlight);
}

// Park the viewport at the top of the timeline (newest commits + focus),
// readable at 1:1, so history scrolls downward from there.
function focusTop() {
  cy.zoom(1);
  cy.pan({ x: cy.width() / 2, y: ROW * 1.6 });
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
  let kicker = type;
  let html = "";

  if (type === "commit") {
    const n = graph.nodes.find((x) => x.id === id) || {};
    kicker = "commit";
    const meta = [n.shortSha, n.author, fmtDate(n.time)].filter(Boolean).join(" · ");
    const body = n.body ? `<pre class="commit-body">${esc(n.body)}</pre>` : "";
    const mile = n.milestone ? `<p class="milestone">★ ${esc(n.milestone)}</p>` : "";
    html = `<h1>${esc(n.label)}</h1><p class="muted mono">${esc(meta)}</p>${mile}${body}`;
  } else if (type === "decision") {
    const adrId = id.replace(/^adr:/, "");
    const d = spine.decisions.find((x) => x.id === adrId);
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
  const types = Object.entries(TYPE)
    .map(([, v]) => `<span class="leg"><i style="background:${v.color}"></i>${v.label}</span>`)
    .join("");
  $("#legend").innerHTML = types;
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
