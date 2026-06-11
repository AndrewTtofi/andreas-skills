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
    main.innerHTML = `<section class="empty"><h1>Couldn't reach the server.</h1></section>`;
    return;
  }
  renderNav();
  render();
}

function renderNav() {
  nav.innerHTML = SECTIONS.map(
    ([id, label], i) =>
      `<button class="nav-item${id === active ? " active" : ""}" data-id="${id}" style="--i:${i}">
         <span class="vert"></span><span class="nav-label">${label}</span>
       </button>`
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
    main.innerHTML = `<section class="empty">
      <div class="kicker">no spine</div>
      <h1>Nothing recorded here yet</h1>
      <p>Run <code>init</code> to create a <code>.spine/</code> store, then refresh.</p>
    </section>`;
    return;
  }
  if (active === "overview") return renderOverview();
  if (active === "decisions") return renderDecisions();
  const map = { architecture: spine.context, conventions: spine.conventions, journal: spine.journal };
  main.innerHTML = `<section class="content">
    <div class="kicker">${labelFor(active)}</div>
    <article class="md">${map[active] ?? emptyNote(active)}</article>
  </section>`;
}

function renderOverview() {
  main.innerHTML = `
    <section class="content">
      <div class="kicker">Overview</div>
      <div class="readout">
        <div class="tile"><div class="tile-num">${spine.decisions.length}</div><div class="tile-label">decisions</div></div>
        <div class="tile"><div class="tile-num">4</div><div class="tile-label">memory files</div></div>
      </div>
      <article class="md">${spine.journal ?? emptyNote("journal")}</article>
    </section>`;
}

function renderDecisions() {
  if (!spine.decisions.length) {
    main.innerHTML = `<section class="content"><div class="kicker">Decisions</div><article class="md">${emptyNote("decisions")}</article></section>`;
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
    <section class="content">
      <div class="kicker">Decisions</div>
      <div class="decisions">
        <div class="adr-list">${list}</div>
        <article class="adr-detail md">${spine.decisions[activeAdr].html}</article>
      </div>
    </section>`;
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
function labelFor(id) {
  return SECTIONS.find(([s]) => s === id)[1];
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
