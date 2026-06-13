import { execFileSync } from "node:child_process";

// Reads git commit history into structured data. The commit backbone of the
// dashboard graph. Pure aside from the `run` it shells out through — which is
// injectable so tests need no real repo. See .spine/decisions/0001.

const US = "\x1f"; // field separator
const RS = "\x1e"; // record separator
const FORMAT = ["%H", "%P", "%an", "%aI", "%s", "%b"].join(US) + RS;

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
    out = run(["log", `--pretty=format:${FORMAT}`], repoDir);
  } catch {
    // Not a git repo, git not installed, or no commits yet.
    return { available: false, commits: [] };
  }
  if (!out || !out.trim()) return { available: false, commits: [] };

  const commits = out
    .split(RS)
    .map((r) => r.trim())
    .filter(Boolean)
    .map(parseRecord)
    .filter(Boolean);

  if (!commits.length) return { available: false, commits: [] };
  return { available: true, commits };
}

function parseRecord(record) {
  const [sha, parents, author, date, subject, ...rest] = record.split(US);
  if (!sha) return null;
  return {
    sha,
    shortSha: sha.slice(0, 7),
    parents: parents ? parents.split(" ").filter(Boolean) : [],
    author: author ?? "",
    date: date ?? "",
    subject: subject ?? "",
    body: rest.join(US).trim(),
  };
}
