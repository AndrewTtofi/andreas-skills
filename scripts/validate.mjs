#!/usr/bin/env node
// Validates that every skill listed in plugin.json is structurally sound.
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

const readmePath = join(root, "README.md");
if (existsSync(readmePath)) {
  const readme = readFileSync(readmePath, "utf8");
  for (const rel of plugin.skills ?? []) {
    const name = basename(rel);
    if (!readme.includes(`skills/${name}/SKILL.md`)) {
      errors.push(`README.md does not reference skills/${name}/SKILL.md`);
    }
  }
} else {
  errors.push("README.md missing");
}

if (errors.length) {
  console.error("\nVALIDATION FAILED:");
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log(`\nAll ${plugin.skills.length} skills valid.`);
