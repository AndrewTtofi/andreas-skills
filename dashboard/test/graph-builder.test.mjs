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

// --- PR clustering (ADR-0004) ---
// History (newest first):
//   D  direct-on-main commit  (loose)        parents [M]
//   M  Merge pull request #1  (PR group)     parents [m1, b2]
//   m1 mainline commit        (loose)        parents [m0]
//   b2 branch work 2          (PR #1)        parents [b1]
//   b1 branch work 1          (PR #1)        parents [m0]
//   m0 init                   (loose, base)  parents []
const sha = (p) => p + "0".repeat(40 - p.length);
const D = sha("d11"), M = sha("merge1"), M1 = sha("a11"), B2 = sha("b22"), B1 = sha("b11"), M0 = sha("0000");
const PR_GIT = {
  available: true,
  commits: [
    { sha: D, shortSha: "d11", parents: [M], subject: "direct fix on main", body: "", author: "A", date: "2026-06-13T12:00:00+00:00", files: ["dashboard/graph-builder.mjs", "README.md"] },
    { sha: M, shortSha: "merge1", parents: [M1, B2], subject: "Merge pull request #1 from me/feat", body: "Add the feature", author: "A", date: "2026-06-13T11:00:00+00:00", files: [] },
    { sha: M1, shortSha: "a11", parents: [M0], subject: "earlier mainline", body: "", author: "A", date: "2026-06-11T10:00:00+00:00", files: ["README.md"] },
    { sha: B2, shortSha: "b22", parents: [B1], subject: "branch work 2", body: "", author: "A", date: "2026-06-12T10:00:00+00:00", files: ["dashboard/graph-builder.mjs"] },
    { sha: B1, shortSha: "b11", parents: [M0], subject: "branch work 1", body: "", author: "A", date: "2026-06-12T09:00:00+00:00", files: ["dashboard/app.js"] },
    { sha: M0, shortSha: "0000", parents: [], subject: "init", body: "", author: "A", date: "2026-06-09T10:00:00+00:00", files: ["README.md"] },
  ],
};

// Brain fixtures: ADRs that reference each other + a shared concept term.
const BRAIN_SPINE = {
  exists: true,
  context: "# ctx\n## Language\n\n**Backbone**: the git commit history.\n",
  conventions: "",
  journal: "# J\n## Current focus\nx\n",
  decisions: [
    { id: "0001-foo", title: "0001. Foo", markdown: "# 0001. Foo\n- **Date:** 2026-06-10\nThe Backbone matters here.\n" },
    { id: "0002-bar", title: "0002. Bar", markdown: "# 0002. Bar\n- **Date:** 2026-06-12\nSee [[0001-foo]]. The Backbone again.\n" },
  ],
};
const MINI_SPINE = { exists: true, context: "", conventions: "", journal: "# J\n## Current focus\nx\n", decisions: [] };
const groupOf = (g, commitSha) => (g.nodes.find((n) => n.id === `commit:${commitSha}`) || {}).group;

test("a Merge-pull-request commit becomes a pr group node", () => {
  const g = buildGraph(MINI_SPINE, "/repo", { git: PR_GIT });
  const pr = g.nodes.find((n) => n.type === "pr");
  assert.ok(pr, "pr node exists");
  assert.equal(pr.id, "pr:1");
  assert.equal(pr.number, 1);
  assert.match(pr.label, /#1 · Add the feature/);
  assert.equal(pr.count, 2); // the two branch commits
});

test("branch commits + the merge are tagged with the pr group", () => {
  const g = buildGraph(MINI_SPINE, "/repo", { git: PR_GIT });
  assert.equal(groupOf(g, B1), "pr:1");
  assert.equal(groupOf(g, B2), "pr:1");
  assert.equal(groupOf(g, M), "pr:1"); // the merge hides into its group
});

test("every commit is grouped — non-PR mainline commits fall into segments", () => {
  const g = buildGraph(MINI_SPINE, "/repo", { git: PR_GIT });
  assert.match(groupOf(g, D), /^seg:/); // direct-on-main HEAD
  assert.match(groupOf(g, M1), /^seg:/); // mainline
  assert.match(groupOf(g, M0), /^seg:/); // root
  assert.ok(g.nodes.filter((n) => n.type === "commit").every((n) => n.group), "no loose commits");
});

test("the newest non-merge run is the 'Current branch' segment", () => {
  const g = buildGraph(MINI_SPINE, "/repo", { git: PR_GIT });
  const cur = g.nodes.find((n) => n.type === "segment" && n.label === "Current branch");
  assert.ok(cur, "current-branch segment exists");
  assert.equal(groupOf(g, D), cur.id); // the unmerged HEAD commit
  assert.equal(cur.count, 1);
});

test("older non-merge runs are 'Direct to main' segments", () => {
  const g = buildGraph(MINI_SPINE, "/repo", { git: PR_GIT });
  const direct = g.nodes.find((n) => n.type === "segment" && /^Direct to main/.test(n.label));
  assert.ok(direct);
  assert.equal(groupOf(g, M1), direct.id);
  assert.equal(groupOf(g, M0), direct.id);
});

// --- brain: module hubs + non-sequential edges (ADR-0009) ---
test("a file touched by ≥2 clusters becomes a module hub with touches edges", () => {
  const g = buildGraph(MINI_SPINE, "/repo", { git: PR_GIT });
  const hub = g.nodes.find((n) => n.type === "module" && n.id === "mod:dashboard/graph-builder.mjs");
  assert.ok(hub, "module hub exists"); // touched by PR #1 (b22) and Current branch (d11)
  assert.equal(hub.count, 2);
  assert.ok(g.edges.some((e) => e.rel === "touches" && e.source === "pr:1" && e.target === hub.id));
  const curSeg = g.nodes.find((n) => n.type === "segment" && n.label === "Current branch");
  assert.ok(g.edges.some((e) => e.rel === "touches" && e.source === curSeg.id && e.target === hub.id));
});

test("a file touched by only one cluster is NOT a hub", () => {
  const g = buildGraph(MINI_SPINE, "/repo", { git: PR_GIT });
  assert.ok(!g.nodes.some((n) => n.id === "mod:dashboard/app.js")); // only PR #1
});

test("meta/doc files are excluded from hubs even when shared by ≥2 clusters", () => {
  const g = buildGraph(MINI_SPINE, "/repo", { git: PR_GIT });
  // README.md is touched by Current-branch (d11) and Direct-to-main (a11/0000) —
  // shared, but it's a doc, so it must not become a hub (keeps the brain code-focused).
  assert.ok(!g.nodes.some((n) => n.id === "mod:README.md"));
});

test("ADR [[wikilinks]] become references edges", () => {
  const g = buildGraph(BRAIN_SPINE, "/repo", { git: { available: false, commits: [] } });
  assert.ok(g.edges.some((e) => e.rel === "references" && e.source === "adr:0002-bar" && e.target === "adr:0001-foo"));
});

test("a Language term named by ≥2 ADRs becomes a concept node with mentions", () => {
  const g = buildGraph(BRAIN_SPINE, "/repo", { git: { available: false, commits: [] } });
  const concept = g.nodes.find((n) => n.type === "concept" && n.label === "Backbone");
  assert.ok(concept, "concept node exists");
  assert.equal(g.edges.filter((e) => e.rel === "mentions" && e.source === concept.id).length, 2);
});

test("history with no PR merges produces no pr nodes (backstop)", () => {
  const g = buildGraph(MINI_SPINE, "/repo", { git: GIT }); // GIT has no merge-PR subjects
  assert.ok(!g.nodes.some((n) => n.type === "pr"));
});
