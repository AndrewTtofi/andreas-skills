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

    for (const c of commits) {
      const milestone = matchMilestone(c, milestones);
      nodes.push({
        id: `commit:${c.sha}`,
        type: "commit",
        label: c.subject,
        shortSha: c.shortSha,
        time: c.date,
        author: c.author,
        body: c.body,
        ...(milestone ? { milestone } : {}),
      });
      for (const p of c.parents) {
        if (shaSet.has(p)) edges.push({ source: `commit:${c.sha}`, target: `commit:${p}`, rel: "parent" });
      }
    }

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
