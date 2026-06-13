import { test } from "node:test";
import assert from "node:assert/strict";
import { validateManifest, validateMarketplace } from "./manifest-schema.mjs";

// Helpers: a valid base, then targeted mutations. Hermetic — plain objects.
const validPlugin = () => ({
  name: "spine",
  description: "A lifecycle skill system.",
  version: "1.1.0",
  author: { name: "Andreas Ttofi" },
  license: "MIT",
  skills: ["./skills/init"],
});

const hasErr = (res, needle) =>
  res.errors.some((e) => e.toLowerCase().includes(needle.toLowerCase()));
const hasWarn = (res, needle) =>
  res.warnings.some((w) => w.toLowerCase().includes(needle.toLowerCase()));

// ── validateManifest (plugin.json) ──────────────────────────────────────────

test("valid plugin manifest → no errors", () => {
  assert.deepEqual(validateManifest(validPlugin()).errors, []);
});

test("author as a bare string → error (the install-blocker)", () => {
  const p = validPlugin();
  p.author = "Andreas Ttofi";
  const res = validateManifest(p);
  assert.ok(hasErr(res, "author"));
  assert.ok(hasErr(res, "object"));
});

test("author object missing name → error", () => {
  const p = validPlugin();
  p.author = { email: "x@y.z" };
  assert.ok(hasErr(validateManifest(p), "author"));
});

test("missing name → error", () => {
  const p = validPlugin();
  delete p.name;
  assert.ok(hasErr(validateManifest(p), "name"));
});

test("non-kebab-case name → error", () => {
  for (const bad of ["Spine", "my plugin", "spine_plugin", "-spine", "spine-"]) {
    const p = validPlugin();
    p.name = bad;
    assert.ok(hasErr(validateManifest(p), "kebab"), `expected kebab error for ${bad}`);
  }
});

test("valid kebab names pass the name check", () => {
  for (const good of ["spine", "my-plugin", "a1-b2-c3"]) {
    const p = validPlugin();
    p.name = good;
    assert.ok(!hasErr(validateManifest(p), "kebab"), `unexpected kebab error for ${good}`);
  }
});

test("missing description or version → error (repo convention)", () => {
  const noDesc = validPlugin();
  delete noDesc.description;
  assert.ok(hasErr(validateManifest(noDesc), "description"));
  const noVer = validPlugin();
  delete noVer.version;
  assert.ok(hasErr(validateManifest(noVer), "version"));
});

test("keywords as a string → error; as an array → ok", () => {
  const bad = validPlugin();
  bad.keywords = "a, b";
  assert.ok(hasErr(validateManifest(bad), "keywords"));
  const good = validPlugin();
  good.keywords = ["a", "b"];
  assert.ok(!hasErr(validateManifest(good), "keywords"));
});

test("missing license → warning, not error", () => {
  const p = validPlugin();
  delete p.license;
  const res = validateManifest(p);
  assert.ok(hasWarn(res, "license"));
  assert.ok(!hasErr(res, "license"));
});
