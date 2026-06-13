import { execFileSync } from "node:child_process";

// Reads git commit history (incl. files touched) into structured data. The
// backbone the dashboard graph is built from. Pure aside from the injectable
// `run`. See .spine/decisions/0001, 0009.

const RS = "\x1e"; // record separator (leads each commit)
const US = "\x1f"; // field separator
// Trailing US separates %b from the file list that `--name-only` appends.
const FORMAT = RS + ["%H", "%P", "%an", "%aI", "%s", "%b"].join(US) + US;

function defaultRun(args, repoDir) {
  return execFileSync("git", args, {
    cwd: repoDir,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
    stdio: ["ignore", "pipe", "ignore"],
  });
}

export function readGitHistory(repoDir, { run = defaultRun } = {}) {
  let out;
  try {
    out = run(["log", "--name-only", `--pretty=format:${FORMAT}`], repoDir);
  } catch {
    return { available: false, commits: [] };
  }
  if (!out || !out.trim()) return { available: false, commits: [] };

  const commits = out
    .split(RS)
    .filter((r) => r.trim())
    .map(parseRecord)
    .filter(Boolean);

  if (!commits.length) return { available: false, commits: [] };
  return { available: true, commits };
}

function parseRecord(record) {
  const p = record.split(US);
  const sha = (p[0] || "").trim();
  if (!sha) return null;
  return {
    sha,
    shortSha: sha.slice(0, 7),
    parents: p[1] ? p[1].split(" ").filter(Boolean) : [],
    author: (p[2] || "").trim(),
    date: (p[3] || "").trim(),
    subject: (p[4] || "").trim(),
    body: (p[5] || "").trim(),
    files: (p[6] || "")
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean),
  };
}
