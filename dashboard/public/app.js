const SECTIONS = [
  ["overview", "Overview"],
  ["architecture", "Architecture"],
  ["conventions", "Conventions"],
  ["journal", "Journal"],
  ["decisions", "Decisions"],
];

let spine = null;
let active = "overview";
let activeAdr = 0;

const nav = document.getElementById("nav");
const main = document.getElementById("main");

async function load() {
  try {
    spine = await fetch("/api/spine").then((r) => r.json());
  } catch {
    main.innerHTML = `<div class="empty"><h1>Couldn't reach the server.</h1></div>`;
    return;
  }
  renderNav();
  render();
}

function renderNav() {
  nav.innerHTML = SECTIONS.map(
    ([id, label]) =>
      `<button class="nav-item${id === active ? " active" : ""}" data-id="${id}">${label}</button>`
  ).join("");
  nav.querySelectorAll(".nav-item").forEach((b) =>
    b.addEventListener("click", () => {
      active = b.dataset.id;
      renderNav();
      render();
    })
  );
}

function render() {
  if (!spine || !spine.exists) {
    main.innerHTML = `<div class="empty">
      <h1>No Spine here yet</h1>
      <p>Run <code>init</code> in this repo to create a <code>.spine/</code> store, then reload.</p>
    </div>`;
    return;
  }
  if (active === "overview") return renderOverview();
  if (active === "decisions") return renderDecisions();
  const map = { architecture: spine.context, conventions: spine.conventions, journal: spine.journal };
  main.innerHTML = `<div class="content"><div class="md">${map[active] ?? emptyNote(active)}</div></div>`;
}

function renderOverview() {
  main.innerHTML = `
    <div class="content">
      <div class="overview-grid">
        <div class="stat"><div class="stat-label">Decisions</div><div class="stat-value">${spine.decisions.length}</div></div>
        <div class="stat"><div class="stat-label">Sections</div><div class="stat-value">4</div></div>
      </div>
      <div class="md">${spine.journal ?? emptyNote("journal")}</div>
    </div>`;
}

function renderDecisions() {
  if (!spine.decisions.length) {
    main.innerHTML = `<div class="content"><div class="md">${emptyNote("decisions")}</div></div>`;
    return;
  }
  if (activeAdr >= spine.decisions.length) activeAdr = 0;
  const list = spine.decisions
    .map(
      (d, i) =>
        `<button class="adr-item${i === activeAdr ? " active" : ""}" data-i="${i}">
           <span class="adr-id">${escapeText(d.id.split("-")[0])}</span>
           <span class="adr-title">${escapeText(stripNum(d.title))}</span>
         </button>`
    )
    .join("");
  main.innerHTML = `
    <div class="content decisions">
      <div class="adr-list">${list}</div>
      <div class="adr-detail md">${spine.decisions[activeAdr].html}</div>
    </div>`;
  main.querySelectorAll(".adr-item").forEach((b) =>
    b.addEventListener("click", () => {
      activeAdr = Number(b.dataset.i);
      renderDecisions();
    })
  );
}

function emptyNote(id) {
  const file = id === "architecture" ? "context.md" : `${id}.md`;
  return `<p class="muted">Nothing in <code>${file}</code> yet.</p>`;
}
function stripNum(t) {
  return t.replace(/^\d+\.\s*/, "");
}
function escapeText(s) {
  const d = document.createElement("div");
  d.textContent = s;
  return d.innerHTML;
}

load();
