import { dirname } from "node:path";
import { readSpine } from "./spine-reader.mjs";
import { readGitHistory } from "./git-reader.mjs";

// Builds a sequenced, dependency-connected graph { nodes, edges } from a repo:
// git commits are the backbone; the Spine (ADRs, focus) overlays meaning onto
// them. See .spine/decisions/0001-0003.
//
//   nodes: commit | decision | focus     (each carries `type` and `time`)
//   edges: parent | decides | supersedes | focuses
//
// `opts.git` injects history for tests; otherwise it's read from `repoDir`
// (defaults to the parent of a string `spineDir`).
export function buildGraph(spineOrDir, repoDir, opts = {}) {
  const s = typeof spineOrDir === "string" ? readSpine(spineOrDir) : spineOrDir;
  if (!s || !s.exists) return { nodes: [], edges: [] };

  if (repoDir === undefined && typeof spineOrDir === "string") repoDir = dirname(spineOrDir);
  const git = opts.git ?? readGitHistory(repoDir);

  const nodes = [];
  const edges = [];

  const decisions = (s.decisions ?? []).map((d) => ({
    id: d.id,
    nodeId: `adr:${d.id}`,
    label: shortTitle(d.title),
    date: adrDate(d.markdown),
    markdown: d.markdown,
  }));
  const focus = s.journal ? extractFocus(s.journal) : null;

  if (git.available && git.commits.length) {
    const commits = git.commits; // newest-first
    const shaSet = new Set(commits.map((c) => c.sha));
    const milestones = extractHistoryMilestones(s.journal);
    const { groupNodes, groupOf } = clusterCommits(commits);

    for (const c of commits) {
      const milestone = matchMilestone(c, milestones);
      const group = groupOf.get(c.sha);
      nodes.push({
        id: `commit:${c.sha}`,
        type: "commit",
        label: c.subject,
        shortSha: c.shortSha,
        time: c.date,
        author: c.author,
        body: c.body,
        ...(milestone ? { milestone } : {}),
        ...(group ? { group } : {}),
      });
      for (const p of c.parents) {
        if (shaSet.has(p)) edges.push({ source: `commit:${c.sha}`, target: `commit:${p}`, rel: "parent" });
      }
    }
    for (const gn of groupNodes) nodes.push(gn);

    for (const d of decisions) {
      nodes.push({ id: d.nodeId, type: "decision", label: d.label, time: d.date });
      const target = commitForDecision(d, commits);
      if (target) edges.push({ source: d.nodeId, target: `commit:${target.sha}`, rel: "decides" });
    }

    if (focus !== null) {
      nodes.push({ id: "focus", type: "focus", label: "Current focus", time: commits[0].date });
      edges.push({ source: "focus", target: `commit:${commits[0].sha}`, rel: "focuses" });
    }
  } else {
    // No git available: degrade to a Spine-only timeline. Never crash.
    for (const d of decisions) {
      nodes.push({ id: d.nodeId, type: "decision", label: d.label, time: d.date });
    }
    if (focus !== null) nodes.push({ id: "focus", type: "focus", label: "Current focus", time: null });
  }

  // ADR → ADR supersedes edges (git-independent).
  for (const d of decisions) {
    for (const targetId of supersededIds(d.markdown)) {
      const match = decisions.find((x) => x.id !== d.id && (x.id === targetId || x.id.startsWith(`${targetId}-`)));
      if (match) edges.push({ source: d.nodeId, target: match.nodeId, rel: "supersedes" });
    }
  }

  return { nodes, edges };
}

// Partition every commit into a group so nothing is loose (.spine/decisions/0004,
// 0006): `Merge pull request #N` commits become `pr` clusters (merge + branch
// commits); each maximal run of non-merge mainline commits becomes a `segment`
// cluster (the newest run = "Current branch"; older = "Direct to main").
// Returns { groupNodes, groupOf: Map<sha, "pr:N"|"seg:x"> }.
function clusterCommits(commits) {
  const bySha = new Map(commits.map((c) => [c.sha, c]));
  const reachable = (start) => {
    const seen = new Set();
    const stack = [start];
    while (stack.length) {
      const s = stack.pop();
      if (!s || seen.has(s) || !bySha.has(s)) continue;
      seen.add(s);
      for (const p of bySha.get(s).parents) stack.push(p);
    }
    return seen;
  };
  const isPrMerge = (c) => c.parents.length >= 2 && /^Merge pull request #(\d+)/.test(c.subject);

  const groupNodes = [];
  const groupOf = new Map();

  // 1. PR clusters: merge + its branch commits.
  for (const c of commits) {
    if (!isPrMerge(c)) continue;
    const number = Number(c.subject.match(/^Merge pull request #(\d+)/)[1]);
    const [mainParent, branchTip] = c.parents;
    const base = reachable(mainParent);
    const branch = [];
    const seen = new Set();
    const stack = [branchTip];
    while (stack.length) {
      const s = stack.pop();
      if (!s || seen.has(s) || base.has(s) || !bySha.has(s)) continue;
      seen.add(s);
      if (!groupOf.has(s)) branch.push(s);
      for (const p of bySha.get(s).parents) stack.push(p);
    }
    const id = `pr:${number}`;
    groupOf.set(c.sha, id);
    for (const s of branch) groupOf.set(s, id);
    groupNodes.push({ id, type: "pr", label: `#${number} · ${prTitle(c)}`, number, count: branch.length, time: c.date });
  }

  // 2. Segment clusters: runs of non-merge commits along the first-parent chain.
  const headSha = commits[0] && commits[0].sha;
  const mainline = [];
  const guard = new Set();
  let cur = headSha;
  while (cur && bySha.has(cur) && !guard.has(cur)) {
    guard.add(cur);
    mainline.push(bySha.get(cur));
    cur = bySha.get(cur).parents[0];
  }
  let run = [];
  const flush = () => {
    if (!run.length) return;
    const first = run[0]; // newest commit in the run
    const id = `seg:${first.shortSha}`;
    const isHead = run.some((c) => c.sha === headSha);
    const label = isHead ? "Current branch" : `Direct to main · ${(first.date || "").slice(0, 10)}`;
    groupNodes.push({ id, type: "segment", label, count: run.length, time: first.date });
    for (const c of run) groupOf.set(c.sha, id);
    run = [];
  };
  for (const c of mainline) {
    if (isPrMerge(c) || groupOf.has(c.sha)) flush();
    else run.push(c);
  }
  flush();

  return { groupNodes, groupOf };
}

function prTitle(mergeCommit) {
  const body = (mergeCommit.body || "").trim();
  if (body) return body.split("\n")[0].trim();
  const m = mergeCommit.subject.match(/from \S+?\/(\S+)/);
  return m ? m[1] : `pull request`;
}

const SHA_RE = /\b([0-9a-f]{7,40})\b/g;

function shortTitle(title) {
  return (title || "").replace(/^\d+\.\s*/, "").trim();
}

function adrDate(md) {
  const m = (md || "").match(/\*\*Date:\*\*\s*(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : null;
}

function extractFocus(journal) {
  const m = journal.match(/##\s*Current focus\s*\n+([\s\S]*?)(?:\n##|$)/i);
  return m ? m[1].trim() : null;
}

// Journal History lines that cite a commit SHA → milestone annotations.
function extractHistoryMilestones(journal) {
  if (!journal) return [];
  const sec = journal.match(/##\s*History\s*\n+([\s\S]*?)(?:\n##|$)/i);
  if (!sec) return [];
  const out = [];
  for (const line of sec[1].split("\n")) {
    const text = line.replace(/^[-*]\s*/, "").trim();
    if (!text) continue;
    for (const m of text.matchAll(SHA_RE)) out.push({ sha: m[1], text });
  }
  return out;
}

function matchMilestone(commit, milestones) {
  for (const ms of milestones) {
    if (commit.sha.startsWith(ms.sha) || commit.shortSha.startsWith(ms.sha)) return ms.text;
  }
  return null;
}

function commitForDecision(d, commits) {
  for (const m of (d.markdown || "").matchAll(SHA_RE)) {
    const c = commits.find((c) => c.sha.startsWith(m[1]));
    if (c) return c;
  }
  if (!d.date) return null;
  const adr = Date.parse(`${d.date}T00:00:00Z`);
  let best = null;
  let bestDiff = Infinity;
  for (const c of commits) {
    const t = Date.parse(c.date);
    if (Number.isNaN(t)) continue;
    const diff = Math.abs(t - adr);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = c;
    }
  }
  return best;
}

// ADR ids referenced on lines that mention "supersede".
function supersededIds(md) {
  if (!md) return [];
  const ids = new Set();
  for (const line of md.split("\n")) {
    if (!/supersed/i.test(line)) continue;
    for (const m of line.matchAll(/\[\[(\d{4})[^\]]*\]\]/g)) ids.add(m[1]);
    for (const m of line.matchAll(/\b(\d{4})\b/g)) ids.add(m[1]);
  }
  return [...ids];
}
