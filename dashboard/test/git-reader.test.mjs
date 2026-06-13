import { test } from "node:test";
import assert from "node:assert/strict";
import { readGitHistory } from "../git-reader.mjs";

// Field/record separators must match git-reader's pretty-format. Each record is
// led by RS; after the trailing US, `--name-only` appends the file list.
const US = "\x1f";
const RS = "\x1e";
const rec = (fields, files = []) => RS + fields.join(US) + US + (files.length ? "\n" + files.join("\n") + "\n" : "");

const FAKE_LOG =
  rec(["aaaaaaaaaaaaaaaaaaa1", "bbbbbbbbbbbbbbbbbbb2 ccccccccccccccccccc3", "Ann", "2026-06-13T10:00:00+00:00", "merge feature", "merge body"], []) +
  rec(["bbbbbbbbbbbbbbbbbbb2", "ccccccccccccccccccc3", "Bob", "2026-06-12T09:00:00+00:00", "add feature", ""], ["src/a.js", "src/b.js"]) +
  rec(["ccccccccccccccccccc3", "", "Cara", "2026-06-11T08:00:00+00:00", "initial commit", ""], ["README.md"]);

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

test("parses files touched per commit (from --name-only)", () => {
  const { commits } = readGitHistory("/repo", { run: () => FAKE_LOG });
  assert.deepEqual(commits[1].files, ["src/a.js", "src/b.js"]);
  assert.deepEqual(commits[2].files, ["README.md"]);
  assert.deepEqual(commits[0].files, []); // merge shows no files
});

test("root commit has no parents; empty body is empty string", () => {
  const { commits } = readGitHistory("/repo", { run: () => FAKE_LOG });
  assert.deepEqual(commits[2].parents, []);
  assert.equal(commits[1].body, "");
});

test("invokes git log --name-only for the given repo dir", () => {
  let seenArgs, seenDir;
  readGitHistory("/some/repo", {
    run: (args, dir) => {
      seenArgs = args;
      seenDir = dir;
      return FAKE_LOG;
    },
  });
  assert.equal(seenDir, "/some/repo");
  assert.ok(seenArgs.includes("log"));
  assert.ok(seenArgs.includes("--name-only"));
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
