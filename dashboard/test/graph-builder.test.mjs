import { test } from "node:test";
import assert from "node:assert/strict";
import { join } from "node:path";
import { buildGraph } from "../graph-builder.mjs";
import { readSpine } from "../spine-reader.mjs";

// Commit shas (40 hex). shortSha is the first 7.
const A = "c0ffee0" + "0".repeat(33); // HEAD,   2026-06-13
const B = "abc1234" + "0".repeat(33); //         2026-06-10
const C = "deadbee" + "0".repeat(33); // root,   2026-06-09

const GIT = {
  available: true,
  commits: [
    { sha: A, shortSha: "c0ffee0", parents: [B], subject: "ship exporter", body: "the body", author: "A", date: "2026-06-13T10:00:00+00:00" },
    { sha: B, shortSha: "abc1234", parents: [C], subject: "add pg", body: "", author: "A", date: "2026-06-10T10:00:00+00:00" },
    { sha: C, shortSha: "deadbee", parents: [], subject: "init", body: "", author: "A", date: "2026-06-09T10:00:00+00:00" },
  ],
};

const SPINE = {
  exists: true,
  context: "# ctx",
  conventions: "# conv",
  journal: [
    "# Journal",
    "## Current focus",
    "Building the exporter.",
    "## History",
    "- 2026-06-13 — shipped the exporter (commit `c0ffee0`)",
  ].join("\n"),
  decisions: [
    // references a SHA → attaches by SHA
    { id: "0001-use-postgres", title: "0001. Use Postgres", markdown: "# 0001. Use Postgres\n- **Date:** 2026-06-10\n## Decision\nUse pg. Decided in commit `abc1234`.\n" },
    // no SHA → attaches to nearest commit by date; supersedes 0001
    { id: "0002-stream-csv", title: "0002. Stream CSV", markdown: "# 0002. Stream CSV\n- **Date:** 2026-06-12\n## Decision\nStream it. This supersedes [[0001-use-postgres]].\n" },
  ],
};

const node = (g, id) => g.nodes.find((n) => n.id === id);
const hasEdge = (g, source, target, rel) => g.edges.some((e) => e.source === source && e.target === target && e.rel === rel);

test("one commit node per commit, with shortSha/time/body", () => {
  const g = buildGraph(SPINE, "/repo", { git: GIT });
  const commits = g.nodes.filter((n) => n.type === "commit");
  assert.equal(commits.length, 3);
  const head = node(g, `commit:${A}`);
  assert.equal(head.shortSha, "c0ffee0");
  assert.equal(head.label, "ship exporter");
  assert.equal(head.body, "the body");
  assert.equal(head.time, "2026-06-13T10:00:00+00:00");
});

test("parent edges form the git DAG", () => {
  const g = buildGraph(SPINE, "/repo", { git: GIT });
  assert.ok(hasEdge(g, `commit:${A}`, `commit:${B}`, "parent"));
  assert.ok(hasEdge(g, `commit:${B}`, `commit:${C}`, "parent"));
  // root has no parent edge
  assert.ok(!g.edges.some((e) => e.source === `commit:${C}` && e.rel === "parent"));
});

test("ADR attaches to its commit by SHA", () => {
  const g = buildGraph(SPINE, "/repo", { git: GIT });
  assert.ok(hasEdge(g, "adr:0001-use-postgres", `commit:${B}`, "decides"));
});

test("ADR with no SHA attaches to nearest commit by date", () => {
  const g = buildGraph(SPINE, "/repo", { git: GIT });
  // 0002 dated 06-12 → nearest is HEAD (06-13), not B (06-10)
  assert.ok(hasEdge(g, "adr:0002-stream-csv", `commit:${A}`, "decides"));
});

test("supersedes edge between ADRs", () => {
  const g = buildGraph(SPINE, "/repo", { git: GIT });
  assert.ok(hasEdge(g, "adr:0002-stream-csv", "adr:0001-use-postgres", "supersedes"));
});

test("focus node pins to HEAD via a focuses edge", () => {
  const g = buildGraph(SPINE, "/repo", { git: GIT });
  assert.ok(node(g, "focus"));
  assert.ok(hasEdge(g, "focus", `commit:${A}`, "focuses"));
});

test("commit cited in journal History gets a milestone annotation", () => {
  const g = buildGraph(SPINE, "/repo", { git: GIT });
  const head = node(g, `commit:${A}`);
  assert.match(head.milestone, /shipped the exporter/);
  // a non-cited commit has none
  assert.equal(node(g, `commit:${B}`).milestone, undefined);
});

test("no git → Spine-only timeline (decisions + focus, no commits), never throws", () => {
  const g = buildGraph(SPINE, "/repo", { git: { available: false, commits: [] } });
  assert.ok(!g.nodes.some((n) => n.type === "commit"), "no commit nodes");
  assert.equal(g.nodes.filter((n) => n.type === "decision").length, 2);
  assert.ok(node(g, "focus"));
  // supersedes still derivable without git
  assert.ok(hasEdge(g, "adr:0002-stream-csv", "adr:0001-use-postgres", "supersedes"));
});

test("missing spine returns an empty graph", () => {
  assert.deepEqual(buildGraph(readSpine(join(import.meta.dirname, "fixture", "nope"))), { nodes: [], edges: [] });
});
