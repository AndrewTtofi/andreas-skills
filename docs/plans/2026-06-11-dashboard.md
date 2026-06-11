# spine dashboard Implementation Plan

> **For agentic workers:** Implement task-by-task. Steps use checkbox (`- [ ]`) syntax. Tests use Node's built-in runner (`node --test`), zero dependencies.

**Goal:** A zero-dependency local web app (`dashboard/`) that renders the current repo's `.spine/` as a read-only dashboard (Layout A: sidebar + content), runnable via `node dashboard/server.mjs` and publishable as `npx spine-dashboard`.

**Architecture:** `spine-reader.mjs` reads `.spine/` → raw data. `markdown.mjs` renders markdown → HTML. `server.mjs` composes them (renders markdown server-side) and serves a static shell + `GET /api/spine`. `public/` is the Layout-A client. Deep modules, single responsibilities.

**Tech Stack:** Node 26 (ESM, `node:http`, `node --test`). No third-party deps.

**Working dir:** `/Users/andreasttofi/Desktop/ttofis/skills-for-me/spine`, branch `dashboard`.

---

## File Structure

| Path | Responsibility |
|---|---|
| `dashboard/package.json` | name `spine-dashboard`, bin, ESM, node engine |
| `dashboard/spine-reader.mjs` | `readSpine(dir)` → raw structured data |
| `dashboard/markdown.mjs` | `renderMarkdown(md)` → HTML (minimal, zero-dep) |
| `dashboard/server.mjs` | `createDashboardServer(spineDir)` + bin entrypoint |
| `dashboard/public/index.html` | Layout-A shell |
| `dashboard/public/app.js` | fetch `/api/spine`, render sections + ADR list/detail |
| `dashboard/public/styles.css` | light theme, purple accent |
| `dashboard/test/spine-reader.test.mjs` | reader unit tests |
| `dashboard/test/markdown.test.mjs` | renderer unit tests |
| `dashboard/test/server.test.mjs` | server smoke test |
| `dashboard/test/fixture/.spine/*` | test fixture Spine |
| `skills/init/SKILL.md` | add closing pointer to `npx spine-dashboard` |
| `README.md` | document the dashboard |

---

## Task 1: Fixture + `spine-reader` (TDD)

**Files:**
- Create: `dashboard/test/fixture/.spine/context.md`, `conventions.md`, `journal.md`, `decisions/0001-use-postgres.md`, `decisions/0002-stream-csv.md`
- Create: `dashboard/test/spine-reader.test.mjs`
- Create: `dashboard/spine-reader.mjs`

- [ ] **Step 1: Create the fixture Spine**

`dashboard/test/fixture/.spine/context.md`:
```markdown
# Project Context

## Architecture map

- **api** — HTTP layer
- **core** — domain logic
```

`dashboard/test/fixture/.spine/conventions.md`:
```markdown
# Conventions

## Commands

- Test: `npm test`
```

`dashboard/test/fixture/.spine/journal.md`:
```markdown
# Journal

## Current focus

CSV export for invoices.

## Next step

Wire the download button.
```

`dashboard/test/fixture/.spine/decisions/0001-use-postgres.md`:
```markdown
# 1. Use Postgres for the data store

- **Status:** accepted

## Context

We need relational integrity.
```

`dashboard/test/fixture/.spine/decisions/0002-stream-csv.md`:
```markdown
# 2. Stream CSV export

- **Status:** accepted

## Context

Large exports must not buffer in memory.
```

- [ ] **Step 2: Write the failing test** — `dashboard/test/spine-reader.test.mjs`:
```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { join } from "node:path";
import { readSpine } from "../spine-reader.mjs";

const fixture = join(import.meta.dirname, "fixture", ".spine");

test("reads a populated spine", () => {
  const s = readSpine(fixture);
  assert.equal(s.exists, true);
  assert.match(s.context, /Architecture map/);
  assert.match(s.journal, /Current focus/);
  assert.equal(s.decisions.length, 2);
});

test("orders decisions by filename and extracts titles", () => {
  const s = readSpine(fixture);
  assert.deepEqual(
    s.decisions.map((d) => d.id),
    ["0001-use-postgres", "0002-stream-csv"]
  );
  assert.equal(s.decisions[0].title, "1. Use Postgres for the data store");
});

test("missing spine returns exists:false", () => {
  const s = readSpine(join(import.meta.dirname, "fixture", "does-not-exist"));
  assert.equal(s.exists, false);
  assert.deepEqual(s.decisions, []);
});
```

- [ ] **Step 3: Run it, expect failure**

Run: `node --test dashboard/test/spine-reader.test.mjs`
Expected: FAIL (cannot find `../spine-reader.mjs`).

- [ ] **Step 4: Implement** — `dashboard/spine-reader.mjs`:
```js
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

// Reads a .spine/ memory store into raw structured data. Pure: no rendering.
export function readSpine(dir = ".spine") {
  if (!existsSync(dir)) {
    return { exists: false, context: null, conventions: null, journal: null, decisions: [] };
  }
  const read = (f) => {
    const p = join(dir, f);
    return existsSync(p) ? readFileSync(p, "utf8") : null;
  };
  const decisionsDir = join(dir, "decisions");
  let decisions = [];
  if (existsSync(decisionsDir)) {
    decisions = readdirSync(decisionsDir)
      .filter((f) => f.endsWith(".md"))
      .sort()
      .map((f) => {
        const markdown = readFileSync(join(decisionsDir, f), "utf8");
        return { id: f.replace(/\.md$/, ""), title: titleOf(markdown, f), markdown };
      });
  }
  return { exists: true, context: read("context.md"), conventions: read("conventions.md"), journal: read("journal.md"), decisions };
}

function titleOf(markdown, filename) {
  const h1 = markdown.match(/^#\s+(.+)$/m);
  return h1 ? h1[1].trim() : filename.replace(/\.md$/, "");
}
```

- [ ] **Step 5: Run tests, expect pass**

Run: `node --test dashboard/test/spine-reader.test.mjs`
Expected: PASS (3 tests).

- [ ] **Step 6: Commit**
```bash
git add dashboard/spine-reader.mjs dashboard/test
git commit -m "feat(dashboard): spine-reader + fixture"
```

---

## Task 2: `markdown` renderer (TDD)

**Files:**
- Create: `dashboard/test/markdown.test.mjs`
- Create: `dashboard/markdown.mjs`

- [ ] **Step 1: Write the failing test** — `dashboard/test/markdown.test.mjs`:
```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { renderMarkdown } from "../markdown.mjs";

test("headings", () => assert.equal(renderMarkdown("# Hi"), "<h1>Hi</h1>"));
test("bold and inline code", () =>
  assert.match(renderMarkdown("a **b** `c`"), /<strong>b<\/strong>.*<code>c<\/code>/));
test("unordered list", () =>
  assert.equal(renderMarkdown("- a\n- b"), "<ul>\n<li>a</li>\n<li>b</li>\n</ul>"));
test("escapes html", () => assert.match(renderMarkdown("<script>"), /&lt;script&gt;/));
test("links", () =>
  assert.match(renderMarkdown("[x](http://y)"), /<a href="http:\/\/y"[^>]*>x<\/a>/));
test("table", () => {
  const h = renderMarkdown("| a | b |\n|---|---|\n| 1 | 2 |");
  assert.match(h, /<th>a<\/th>/);
  assert.match(h, /<td>1<\/td>/);
});
test("code fence escapes content", () => {
  const h = renderMarkdown("```\n<x>\n```");
  assert.match(h, /<pre><code>&lt;x&gt;<\/code><\/pre>/);
});
```

- [ ] **Step 2: Run it, expect failure**

Run: `node --test dashboard/test/markdown.test.mjs`
Expected: FAIL (cannot find `../markdown.mjs`).

- [ ] **Step 3: Implement** — `dashboard/markdown.mjs`:
```js
// Minimal, zero-dependency markdown -> HTML for the Spine's controlled content.
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function inline(s) {
  let t = esc(s);
  t = t.replace(/`([^`]+)`/g, (_, c) => `<code>${c}</code>`);
  t = t.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  t = t.replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>");
  t = t.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    (_, txt, url) => `<a href="${url}" target="_blank" rel="noopener">${txt}</a>`
  );
  return t;
}

const splitRow = (line) =>
  line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());

const SPECIAL = /^(#{1,6}\s|```|>\s?|\s*[-*]\s+|\s*\d+\.\s+)/;

export function renderMarkdown(md) {
  const lines = (md ?? "").replace(/\r\n/g, "\n").split("\n");
  const out = [];
  let i = 0;
  let listType = null;
  const closeList = () => {
    if (listType) { out.push(`</${listType}>`); listType = null; }
  };

  while (i < lines.length) {
    const line = lines[i];

    if (/^```/.test(line)) {
      closeList();
      const buf = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i])) { buf.push(lines[i]); i++; }
      i++;
      out.push(`<pre><code>${esc(buf.join("\n"))}</code></pre>`);
      continue;
    }

    if (/^\s*\|.*\|\s*$/.test(line) && i + 1 < lines.length && /^\s*\|[\s:|-]+\|\s*$/.test(lines[i + 1])) {
      closeList();
      const header = splitRow(line);
      i += 2;
      const rows = [];
      while (i < lines.length && /^\s*\|.*\|\s*$/.test(lines[i])) { rows.push(splitRow(lines[i])); i++; }
      let html = "<table><thead><tr>" + header.map((h) => `<th>${inline(h)}</th>`).join("") + "</tr></thead><tbody>";
      for (const r of rows) html += "<tr>" + r.map((c) => `<td>${inline(c)}</td>`).join("") + "</tr>";
      out.push(html + "</tbody></table>");
      continue;
    }

    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) { closeList(); out.push(`<h${h[1].length}>${inline(h[2])}</h${h[1].length}>`); i++; continue; }

    if (/^>\s?/.test(line)) {
      closeList();
      const quote = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) { quote.push(lines[i].replace(/^>\s?/, "")); i++; }
      out.push(`<blockquote>${inline(quote.join(" "))}</blockquote>`);
      continue;
    }

    if (/^\s*[-*]\s+/.test(line)) {
      if (listType !== "ul") { closeList(); out.push("<ul>"); listType = "ul"; }
      out.push(`<li>${inline(line.replace(/^\s*[-*]\s+/, ""))}</li>`);
      i++; continue;
    }
    if (/^\s*\d+\.\s+/.test(line)) {
      if (listType !== "ol") { closeList(); out.push("<ol>"); listType = "ol"; }
      out.push(`<li>${inline(line.replace(/^\s*\d+\.\s+/, ""))}</li>`);
      i++; continue;
    }

    if (/^\s*$/.test(line)) { closeList(); i++; continue; }

    closeList();
    const para = [line];
    i++;
    while (i < lines.length && !/^\s*$/.test(lines[i]) && !SPECIAL.test(lines[i]) && !/^\s*\|.*\|\s*$/.test(lines[i])) {
      para.push(lines[i]); i++;
    }
    out.push(`<p>${inline(para.join(" "))}</p>`);
  }
  closeList();
  return out.join("\n");
}
```

- [ ] **Step 4: Run tests, expect pass**

Run: `node --test dashboard/test/markdown.test.mjs`
Expected: PASS (7 tests).

- [ ] **Step 5: Commit**
```bash
git add dashboard/markdown.mjs dashboard/test/markdown.test.mjs
git commit -m "feat(dashboard): minimal markdown renderer"
```

---

## Task 3: `server` (compose + smoke test)

**Files:**
- Create: `dashboard/test/server.test.mjs`
- Create: `dashboard/server.mjs`

- [ ] **Step 1: Write the failing smoke test** — `dashboard/test/server.test.mjs`:
```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { join } from "node:path";
import { createDashboardServer } from "../server.mjs";

const fixture = join(import.meta.dirname, "fixture", ".spine");

test("serves rendered spine JSON and the shell", async () => {
  const server = createDashboardServer(fixture);
  await new Promise((r) => server.listen(0, r));
  const port = server.address().port;
  try {
    const api = await fetch(`http://localhost:${port}/api/spine`).then((r) => r.json());
    assert.equal(api.exists, true);
    assert.equal(api.decisions.length, 2);
    assert.match(api.context, /<h1>Project Context<\/h1>/);
    assert.match(api.decisions[0].html, /<h1>/);

    const html = await fetch(`http://localhost:${port}/`).then((r) => r.text());
    assert.match(html, /<!DOCTYPE html>/i);

    const missing = await fetch(`http://localhost:${port}/nope.js`);
    assert.equal(missing.status, 404);
  } finally {
    await new Promise((r) => server.close(r));
  }
});
```

- [ ] **Step 2: Run it, expect failure**

Run: `node --test dashboard/test/server.test.mjs`
Expected: FAIL (cannot find `../server.mjs`).

- [ ] **Step 3: Implement** — `dashboard/server.mjs`:
```js
#!/usr/bin/env node
import { createServer } from "node:http";
import { readFileSync, existsSync } from "node:fs";
import { join, extname } from "node:path";
import { readSpine } from "./spine-reader.mjs";
import { renderMarkdown } from "./markdown.mjs";

const publicDir = join(import.meta.dirname, "public");
const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json" };

// Composes the reader + renderer into a JSON payload of pre-rendered HTML.
function renderedSpine(spineDir) {
  const s = readSpine(spineDir);
  const r = (md) => (md == null ? null : renderMarkdown(md));
  return {
    exists: s.exists,
    context: r(s.context),
    conventions: r(s.conventions),
    journal: r(s.journal),
    decisions: s.decisions.map((d) => ({ id: d.id, title: d.title, html: renderMarkdown(d.markdown) })),
  };
}

export function createDashboardServer(spineDir = join(process.cwd(), ".spine")) {
  return createServer((req, res) => {
    if (req.url === "/api/spine") {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify(renderedSpine(spineDir)));
      return;
    }
    const path = req.url === "/" ? "/index.html" : req.url.split("?")[0];
    const file = join(publicDir, path);
    if (!file.startsWith(publicDir) || !existsSync(file)) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }
    res.writeHead(200, { "content-type": MIME[extname(file)] ?? "text/plain" });
    res.end(readFileSync(file));
  });
}

function listenWithFallback(server, port, attempts = 12) {
  server.once("error", (e) => {
    if (e.code === "EADDRINUSE" && attempts > 0) listenWithFallback(server, port + 1, attempts - 1);
    else throw e;
  });
  server.listen(port, () => {
    const p = server.address().port;
    console.log(`\n  spine dashboard → http://localhost:${p}`);
    console.log(`  reading ${join(process.cwd(), ".spine")} — Ctrl+C to stop\n`);
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  listenWithFallback(createDashboardServer(), Number(process.env.PORT) || 4317);
}
```

- [ ] **Step 4: Run tests, expect pass**

Run: `node --test dashboard/test/server.test.mjs`
Expected: PASS. (Server reads the fixture; markdown rendered into the payload.)

- [ ] **Step 5: Commit**
```bash
git add dashboard/server.mjs dashboard/test/server.test.mjs
git commit -m "feat(dashboard): http server composing reader + renderer"
```

---

## Task 4: Frontend (Layout A)

**Files:**
- Create: `dashboard/public/index.html`, `dashboard/public/app.js`, `dashboard/public/styles.css`

- [ ] **Step 1: Create `dashboard/public/index.html`**
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>spine</title>
  <link rel="stylesheet" href="/styles.css" />
</head>
<body>
  <div id="app">
    <aside class="sidebar">
      <div class="brand"><span class="dot"></span> spine</div>
      <nav id="nav"></nav>
      <div class="foot">read-only · reflects <code>.spine/</code></div>
    </aside>
    <main id="main"></main>
  </div>
  <script src="/app.js"></script>
</body>
</html>
```

- [ ] **Step 2: Create `dashboard/public/app.js`**
```js
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
```

- [ ] **Step 3: Create `dashboard/public/styles.css`**
```css
:root {
  --bg: #f8fafc;
  --panel: #ffffff;
  --ink: #0f172a;
  --muted: #64748b;
  --line: #e2e8f0;
  --accent: #7c3aed;
  --accent-soft: #ede9fe;
}
* { box-sizing: border-box; }
body { margin: 0; font: 15px/1.6 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: var(--ink); background: var(--bg); }
#app { display: grid; grid-template-columns: 248px 1fr; min-height: 100vh; }
.sidebar { background: var(--panel); border-right: 1px solid var(--line); padding: 22px 16px; display: flex; flex-direction: column; position: sticky; top: 0; height: 100vh; }
.brand { font-weight: 700; font-size: 18px; letter-spacing: -0.02em; display: flex; align-items: center; gap: 9px; margin-bottom: 26px; }
.dot { width: 11px; height: 11px; border-radius: 50%; background: var(--accent); box-shadow: 0 0 0 4px var(--accent-soft); }
nav { display: flex; flex-direction: column; gap: 2px; }
.nav-item { text-align: left; border: 0; background: none; font: inherit; color: var(--muted); padding: 9px 12px; border-radius: 8px; cursor: pointer; transition: 0.12s; }
.nav-item:hover { background: var(--bg); color: var(--ink); }
.nav-item.active { background: var(--accent-soft); color: var(--accent); font-weight: 600; }
.foot { margin-top: auto; color: var(--muted); font-size: 12px; }
main { padding: 40px 48px; max-width: 920px; }
.content { animation: fade 0.2s ease; }
@keyframes fade { from { opacity: 0; transform: translateY(4px); } }
.overview-grid { display: flex; gap: 14px; margin-bottom: 28px; }
.stat { background: var(--panel); border: 1px solid var(--line); border-radius: 12px; padding: 16px 20px; min-width: 120px; }
.stat-label { color: var(--muted); font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; }
.stat-value { font-size: 28px; font-weight: 700; color: var(--accent); }
.decisions { display: grid; grid-template-columns: 260px 1fr; gap: 24px; }
.adr-list { display: flex; flex-direction: column; gap: 4px; }
.adr-item { display: flex; gap: 10px; align-items: baseline; text-align: left; border: 1px solid var(--line); background: var(--panel); border-radius: 9px; padding: 10px 12px; cursor: pointer; font: inherit; }
.adr-item:hover { border-color: var(--accent); }
.adr-item.active { border-color: var(--accent); background: var(--accent-soft); }
.adr-id { font-variant-numeric: tabular-nums; color: var(--accent); font-weight: 700; font-size: 13px; }
.adr-title { color: var(--ink); font-size: 13px; }
.adr-detail { background: var(--panel); border: 1px solid var(--line); border-radius: 12px; padding: 8px 28px; }
.empty { text-align: center; margin-top: 14vh; color: var(--muted); }
.empty h1 { color: var(--ink); }
.muted { color: var(--muted); }
.md h1 { font-size: 26px; letter-spacing: -0.02em; }
.md h2 { font-size: 20px; margin-top: 1.6em; border-bottom: 1px solid var(--line); padding-bottom: 0.3em; }
.md h3 { font-size: 16px; margin-top: 1.4em; }
.md code { background: var(--accent-soft); color: var(--accent); padding: 0.1em 0.4em; border-radius: 5px; font-size: 0.9em; }
.md pre { background: #0f172a; color: #e2e8f0; padding: 16px; border-radius: 10px; overflow: auto; }
.md pre code { background: none; color: inherit; padding: 0; }
.md a { color: var(--accent); }
.md table { border-collapse: collapse; width: 100%; }
.md th, .md td { border: 1px solid var(--line); padding: 8px 12px; text-align: left; }
.md th { background: var(--bg); }
.md blockquote { border-left: 3px solid var(--accent); margin: 1em 0; padding: 0.2em 1em; color: var(--muted); }
@media (max-width: 760px) {
  #app { grid-template-columns: 1fr; }
  .sidebar { position: static; height: auto; }
  .decisions { grid-template-columns: 1fr; }
  main { padding: 24px; }
}
```

- [ ] **Step 4: Manual verification (server serves the shell + assets)**

Run: `node --test dashboard/test/server.test.mjs` (still green — shell served).
Then manually: `node dashboard/server.mjs` from a repo with a `.spine/` (or temporarily point it at the fixture), open the printed URL, confirm the five sidebar sections render and the ADR list/detail works. Ctrl+C to stop.

- [ ] **Step 5: Commit**
```bash
git add dashboard/public
git commit -m "feat(dashboard): Layout A frontend (sidebar + content)"
```

---

## Task 5: package.json, init pointer, README, full test run

**Files:**
- Create: `dashboard/package.json`
- Modify: `skills/init/SKILL.md`
- Modify: `README.md`

- [ ] **Step 1: Create `dashboard/package.json`**
```json
{
  "name": "spine-dashboard",
  "version": "0.1.0",
  "description": "Read-only local dashboard for a project's .spine/ memory store.",
  "type": "module",
  "bin": { "spine-dashboard": "./server.mjs" },
  "files": ["server.mjs", "spine-reader.mjs", "markdown.mjs", "public/"],
  "engines": { "node": ">=20" },
  "scripts": { "test": "node --test", "start": "node server.mjs" },
  "license": "MIT"
}
```

- [ ] **Step 2: Add the pointer to `skills/init/SKILL.md`**

Find the line:
```
5. **Suggest committing** `.spine/` so the memory is shared with the team.
```
Replace with:
```
5. **Suggest committing** `.spine/` so the memory is shared with the team.
6. **Point to the dashboard.** Tell the user they can view the Spine anytime in
   a browser with `npx spine-dashboard` (read-only).
```

- [ ] **Step 3: Add a Dashboard section to `README.md`**

Find:
```
## Philosophy
```
Insert immediately BEFORE it:
```
## Dashboard

See your Spine in a browser — a read-only local dashboard that renders
`.spine/` (architecture map, journal timeline, and browsable ADRs):

```bash
npx spine-dashboard
```

Run it from any repo that has a `.spine/`. Zero dependencies, nothing copied
into your project. Source lives in [`dashboard/`](./dashboard).

```

- [ ] **Step 4: Run the FULL dashboard test suite**

Run: `node --test dashboard/`
Expected: all tests pass (reader 3, markdown 7, server 1 = 11 tests, 0 fail).

- [ ] **Step 5: Commit**
```bash
git add dashboard/package.json skills/init/SKILL.md README.md
git commit -m "feat(dashboard): package metadata, init pointer, README docs"
```

---

## Self-Review

**Spec coverage** (vs `docs/specs/2026-06-11-dashboard-design.md`):
- Read-only viewer; reads `.spine/` fresh per request → server `renderedSpine` per request. ✓
- Zero-dep: only `node:` builtins + `node --test`. ✓
- Modules: spine-reader / markdown / server / public → Tasks 1–4. ✓
- Layout A (Overview/Architecture/Conventions/Journal/Decisions, ADR list+detail) → app.js. ✓
- Empty state when no `.spine/` → reader `exists:false` + app.js empty panel. ✓
- Light theme + purple accent (#7c3aed); dark mode deferred → styles.css. ✓
- Distribution `npx spine-dashboard` + bin; init pointer; README → Task 5. ✓
- Testing via `node --test` (reader fixture, markdown, server smoke) → Tasks 1–3, full run Task 5. ✓
- Non-goals respected (no edit, no watch, no dark mode, no auth). ✓
- Open questions resolved: default port 4317 with EADDRINUSE fallback (server.mjs); npm-name verification is a publish-time step (deferred, noted in spec). ✓

**Placeholder scan:** No TBD/placeholders. Fixture `<x>`/`<script>` strings are intentional test inputs.

**Type/name consistency:** `readSpine` returns `{exists, context, conventions, journal, decisions:[{id,title,markdown}]}`; server's `renderedSpine` maps `markdown`→`html` and the client reads `{exists, context(html), conventions, journal, decisions:[{id,title,html}]}`. Consistent across reader → server → app.js. `createDashboardServer(spineDir)` signature matches the smoke test. Test counts (3+7+1) match the full-run expectation.
