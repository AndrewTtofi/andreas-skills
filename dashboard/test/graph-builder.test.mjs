import { test } from "node:test";
import assert from "node:assert/strict";
import { join } from "node:path";
import { buildGraph } from "../graph-builder.mjs";
import { readSpine } from "../spine-reader.mjs";

const fixture = join(import.meta.dirname, "fixture", ".spine");

test("builds nodes for modules, decisions, conventions, and focus", () => {
  const g = buildGraph(fixture);
  const ids = g.nodes.map((n) => n.id);
  for (const id of ["mod:api", "mod:core", "mod:exporter", "adr:0001-use-postgres", "adr:0002-stream-csv", "conventions", "focus"]) {
    assert.ok(ids.includes(id), `missing node ${id}`);
  }
});

test("links ADRs to the modules they mention", () => {
  const g = buildGraph(fixture);
  assert.ok(
    g.edges.some((e) => e.source === "adr:0001-use-postgres" && e.target === "mod:core" && e.rel === "affects")
  );
  assert.ok(g.edges.some((e) => e.source === "adr:0002-stream-csv" && e.target === "mod:exporter"));
  assert.ok(g.edges.some((e) => e.source === "adr:0002-stream-csv" && e.target === "mod:api"));
});

test("conventions govern, and focus links, mentioned modules", () => {
  const g = buildGraph(fixture);
  assert.ok(g.edges.some((e) => e.source === "conventions" && e.target === "mod:api" && e.rel === "governs"));
  assert.ok(g.edges.some((e) => e.source === "focus" && e.target === "mod:exporter" && e.rel === "focuses"));
});

test("missing spine returns an empty graph", () => {
  assert.deepEqual(buildGraph(readSpine(join(import.meta.dirname, "fixture", "nope"))), { nodes: [], edges: [] });
});
