#!/usr/bin/env node
import { createServer } from "node:http";
import { readFileSync, existsSync } from "node:fs";
import { join, extname } from "node:path";
import { readSpine } from "./spine-reader.mjs";
import { renderMarkdown } from "./markdown.mjs";

const publicDir = join(import.meta.dirname, "public");
const MIME = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
};

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
