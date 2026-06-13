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

    // The graph overlays the Spine onto git history. Tests run inside this
    // git repo (cwd), so the commit backbone is present.
    const graph = await fetch(`http://localhost:${port}/api/graph`).then((r) => r.json());
    assert.ok(graph.nodes.some((n) => n.type === "commit"), "has commit nodes");
    assert.equal(graph.nodes.filter((n) => n.type === "decision").length, 2, "fixture's 2 ADRs");
    assert.ok(graph.edges.some((e) => e.rel === "parent"), "has parent (git DAG) edges");

    const html = await fetch(`http://localhost:${port}/`).then((r) => r.text());
    assert.match(html, /<!DOCTYPE html>/i);

    const missing = await fetch(`http://localhost:${port}/nope.js`);
    assert.equal(missing.status, 404);
  } finally {
    await new Promise((r) => server.close(r));
  }
});
