#!/usr/bin/env node
// Validates that every skill listed in plugin.json is structurally sound,
// wired into the README and skill index, and that plugin metadata is present.
import { readFileSync, existsSync } from "node:fs";
import { join, basename } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const errors = [];
const ok = (m) => console.log(`  ok  ${m}`);

const pluginPath = join(root, ".claude-plugin/plugin.json");
if (!existsSync(pluginPath)) {
  console.error("FAIL: .claude-plugin/plugin.json missing");
  process.exit(1);
}
const plugin = JSON.parse(readFileSync(pluginPath, "utf8"));
if (!Array.isArray(plugin.skills) || plugin.skills.length === 0) {
  errors.push("plugin.json has no skills[]");
}

// plugin.json must carry discovery metadata
for (const field of ["name", "description", "version", "author"]) {
  if (!plugin[field]) errors.push(`plugin.json missing "${field}"`);
}

for (const rel of plugin.skills ?? []) {
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

// Every skill must be wired into both the README and the skill index.
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
  for (const rel of plugin.skills ?? []) {
    const name = basename(rel);
    if (!text.includes(`${name}/SKILL.md`)) {
      errors.push(`${label} does not reference ${name}/SKILL.md`);
    }
  }
}

if (errors.length) {
  console.error("\nVALIDATION FAILED:");
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log(`\nAll ${plugin.skills.length} skills valid.`);
