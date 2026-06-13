#!/usr/bin/env node
// Validates that every skill listed in plugin.json is structurally sound and
// wired into the README and skill index, and that both manifests obey the
// Claude Code install schema (delegated to manifest-schema.mjs). Two-tier
// report: errors fail the build (exit 1); warnings inform.
import { readFileSync, existsSync } from "node:fs";
import { join, basename } from "node:path";
import { validateManifest, validateMarketplace } from "./manifest-schema.mjs";

const root = new URL("..", import.meta.url).pathname;
const errors = [];
const warnings = [];
const ok = (m) => console.log(`  ok  ${m}`);

// Read + parse a JSON manifest with clean errors (no raw stack traces).
// Records an error and returns undefined on missing/malformed.
function readJson(path, label) {
  if (!existsSync(path)) {
    errors.push(`${label} missing`);
    return undefined;
  }
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (e) {
    errors.push(`invalid JSON in ${label}: ${e.message}`);
    return undefined;
  }
}

const collect = (res) => {
  errors.push(...res.errors);
  warnings.push(...res.warnings);
};

// ── Manifests ───────────────────────────────────────────────────────────────
const plugin = readJson(join(root, ".claude-plugin/plugin.json"), "plugin.json");
if (plugin) {
  collect(validateManifest(plugin));
  if (!Array.isArray(plugin.skills) || plugin.skills.length === 0) {
    errors.push("plugin.json has no skills[]");
  }
}

const marketplace = readJson(
  join(root, ".claude-plugin/marketplace.json"),
  "marketplace.json",
);
if (marketplace) collect(validateMarketplace(marketplace));

// Cross-manifest consistency (warnings) is added in build slice 4.

// ── Skills: each listed skill exists, has valid frontmatter (name == folder) ──
for (const rel of plugin?.skills ?? []) {
  const dir = join(root, rel);
  const skillFile = join(dir, "SKILL.md");
  if (!existsSync(skillFile)) {
    errors.push(`${rel}: SKILL.md missing`);
    continue;
  }
  const src = readFileSync(skillFile, "utf8");
  const fm = src.match(/^---\n([\s\S]*?)\n---/);
  if (!fm) {
    errors.push(`${rel}: missing YAML frontmatter`);
    continue;
  }
  const name = fm[1].match(/^name:\s*(.+)$/m)?.[1]?.trim();
  const desc = fm[1].match(/^description:\s*(.+)$/m)?.[1]?.trim();
  if (!name) errors.push(`${rel}: frontmatter missing name`);
  if (!desc) errors.push(`${rel}: frontmatter missing description`);
  if (name && name !== basename(rel)) {
    errors.push(`${rel}: name "${name}" != folder "${basename(rel)}"`);
  }
  if (name && desc) ok(`${rel} (${name})`);
}

// ── Wiring: every skill referenced in the README and the skill index ──────────
const wiring = [
  ["README.md", join(root, "README.md")],
  ["skills/README.md", join(root, "skills/README.md")],
];
for (const [label, path] of wiring) {
  if (!existsSync(path)) {
    errors.push(`${label} missing`);
    continue;
  }
  const text = readFileSync(path, "utf8");
  for (const rel of plugin?.skills ?? []) {
    const name = basename(rel);
    if (!text.includes(`${name}/SKILL.md`)) {
      errors.push(`${label} does not reference ${name}/SKILL.md`);
    }
  }
}

// ── Two-tier report ───────────────────────────────────────────────────────────
if (warnings.length) {
  console.warn("\nWARNINGS:");
  for (const w of warnings) console.warn(`  ! ${w}`);
}
if (errors.length) {
  console.error("\nVALIDATION FAILED:");
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log(`\nAll ${plugin.skills.length} skills valid.`);
