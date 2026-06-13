import { test } from "node:test";
import assert from "node:assert/strict";
import { readGitHistory } from "../git-reader.mjs";

// Field/record separators must match git-reader's pretty-format (US / RS).
const US = "\x1f";
const RS = "\x1e";
const rec = (fields) => fields.join(US) + RS;

// A canned `git log` payload: a merge commit (two parents), a normal commit,
// and a root commit (no parents). Records 2+ carry a leading newline, exactly
// as real `git log` emits between commits — the reader must tolerate it.
const FAKE_LOG = [
  rec(["aaaaaaaaaaaaaaaaaaa1", "bbbbbbbbbbbbbbbbbbb2 ccccccccccccccccccc3", "Ann", "2026-06-13T10:00:00+00:00", "merge feature", "merge body"]),
  rec(["bbbbbbbbbbbbbbbbbbb2", "ccccccccccccccccccc3", "Bob", "2026-06-12T09:00:00+00:00", "add feature", ""]),
  rec(["ccccccccccccccccccc3", "", "Cara", "2026-06-11T08:00:00+00:00", "initial commit", ""]),
].join("\n");

test("parses sha, shortSha, parents, author, date, subject, body", () => {
  const { available, commits } = readGitHistory("/repo", { run: () => FAKE_LOG });
  assert.equal(available, true);
  assert.equal(commits.length, 3);

  const c0 = commits[0];
  assert.equal(c0.sha, "aaaaaaaaaaaaaaaaaaa1");
  assert.equal(c0.shortSha, "aaaaaaa");
  assert.deepEqual(c0.parents, ["bbbbbbbbbbbbbbbbbbb2", "ccccccccccccccccccc3"]);
  assert.equal(c0.author, "Ann");
  assert.equal(c0.date, "2026-06-13T10:00:00+00:00");
  assert.equal(c0.subject, "merge feature");
  assert.equal(c0.body, "merge body");
});

test("root commit has no parents; empty body is empty string", () => {
  const { commits } = readGitHistory("/repo", { run: () => FAKE_LOG });
  assert.deepEqual(commits[2].parents, []);
  assert.equal(commits[1].body, "");
});

test("passes a log command for the given repo dir to run()", () => {
  let seenArgs, seenDir;
  readGitHistory("/some/repo", {
    run: (args, dir) => {
      seenArgs = args;
      seenDir = dir;
      return FAKE_LOG;
    },
  });
  assert.equal(seenDir, "/some/repo");
  assert.ok(seenArgs.includes("log"), "git is invoked with `log`");
});

test("git unavailable / not a repo → available:false, no commits", () => {
  const { available, commits } = readGitHistory("/repo", {
    run: () => {
      throw new Error("fatal: not a git repository");
    },
  });
  assert.equal(available, false);
  assert.deepEqual(commits, []);
});

test("empty history (empty stdout) → available:false", () => {
  const r = readGitHistory("/repo", { run: () => "" });
  assert.equal(r.available, false);
  assert.deepEqual(r.commits, []);
});
