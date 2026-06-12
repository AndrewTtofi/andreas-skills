import { test } from "node:test";
import assert from "node:assert/strict";
import { join } from "node:path";
import { readSpine } from "../spine-reader.mjs";

const fixture = join(import.meta.dirname, "fixture", ".spine");

test("reads a populated spine", () => {
  const s = readSpine(fixture);
  assert.equal(s.exists, true);
  assert.match(s.context, /Architecture map/);
  assert.match(s.journal, /Current focus/);
  assert.equal(s.decisions.length, 2);
});

test("orders decisions by filename and extracts titles", () => {
  const s = readSpine(fixture);
  assert.deepEqual(
    s.decisions.map((d) => d.id),
    ["0001-use-postgres", "0002-stream-csv"]
  );
  assert.equal(s.decisions[0].title, "1. Use Postgres for the data store");
});

test("missing spine returns exists:false", () => {
  const s = readSpine(join(import.meta.dirname, "fixture", "does-not-exist"));
  assert.equal(s.exists, false);
  assert.deepEqual(s.decisions, []);
});
