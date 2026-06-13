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

// ── validateMarketplace (marketplace.json) ──────────────────────────────────

const validMarketplace = () => ({
  name: "spine",
  owner: { name: "Andreas Ttofi" },
  plugins: [
    {
      name: "spine",
      source: "./",
      description: "x",
      version: "1.1.0",
      author: { name: "Andreas Ttofi" },
      license: "MIT",
      keywords: ["lifecycle"],
    },
  ],
});

test("valid marketplace manifest → no errors", () => {
  assert.deepEqual(validateMarketplace(validMarketplace()).errors, []);
});

test("owner as a bare string → error", () => {
  const m = validMarketplace();
  m.owner = "Andreas Ttofi";
  const res = validateMarketplace(m);
  assert.ok(hasErr(res, "owner"));
  assert.ok(hasErr(res, "object"));
});

test("owner object missing name → error", () => {
  const m = validMarketplace();
  m.owner = {};
  assert.ok(hasErr(validateMarketplace(m), "owner"));
});

test("missing or non-kebab marketplace name → error", () => {
  const missing = validMarketplace();
  delete missing.name;
  assert.ok(hasErr(validateMarketplace(missing), "name"));
  const bad = validMarketplace();
  bad.name = "My Marketplace";
  assert.ok(hasErr(validateMarketplace(bad), "kebab"));
});

test("plugins missing / not array / empty → error", () => {
  const missing = validMarketplace();
  delete missing.plugins;
  assert.ok(hasErr(validateMarketplace(missing), "plugins"));
  const notArr = validMarketplace();
  notArr.plugins = { name: "spine" };
  assert.ok(hasErr(validateMarketplace(notArr), "plugins"));
  const empty = validMarketplace();
  empty.plugins = [];
  assert.ok(hasErr(validateMarketplace(empty), "plugins"));
});

test("plugins[] entry missing/non-kebab name → error", () => {
  const noName = validMarketplace();
  delete noName.plugins[0].name;
  assert.ok(hasErr(validateMarketplace(noName), "name"));
  const badName = validMarketplace();
  badName.plugins[0].name = "Spine";
  assert.ok(hasErr(validateMarketplace(badName), "kebab"));
});

test("plugins[] entry missing source → error", () => {
  const m = validMarketplace();
  delete m.plugins[0].source;
  assert.ok(hasErr(validateMarketplace(m), "source"));
});

test("string source must be ./-prefixed; object source is allowed", () => {
  const bad = validMarketplace();
  bad.plugins[0].source = "plugins/spine";
  assert.ok(hasErr(validateMarketplace(bad), "source"));

  const okRel = validMarketplace();
  okRel.plugins[0].source = "./plugins/spine";
  assert.ok(!hasErr(validateMarketplace(okRel), "source"));

  const okObj = validMarketplace();
  okObj.plugins[0].source = { source: "github", repo: "AndrewTtofi/spine" };
  assert.ok(!hasErr(validateMarketplace(okObj), "source"));
});

test("plugins[] entry author as a string → error", () => {
  const m = validMarketplace();
  m.plugins[0].author = "Andreas";
  assert.ok(hasErr(validateMarketplace(m), "author"));
});

test("plugins[] entry missing license/keywords → warnings, not errors", () => {
  const m = validMarketplace();
  delete m.plugins[0].license;
  delete m.plugins[0].keywords;
  const res = validateMarketplace(m);
  assert.ok(hasWarn(res, "license"));
  assert.ok(hasWarn(res, "keywords"));
  assert.ok(!hasErr(res, "license"));
});
