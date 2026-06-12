import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

// Reads a .spine/ memory store into raw structured data. Pure: no rendering.
export function readSpine(dir = ".spine") {
  if (!existsSync(dir)) {
    return { exists: false, context: null, conventions: null, journal: null, decisions: [] };
  }
  const read = (f) => {
    const p = join(dir, f);
    return existsSync(p) ? readFileSync(p, "utf8") : null;
  };
  const decisionsDir = join(dir, "decisions");
  let decisions = [];
  if (existsSync(decisionsDir)) {
    decisions = readdirSync(decisionsDir)
      .filter((f) => f.endsWith(".md"))
      .sort()
      .map((f) => {
        const markdown = readFileSync(join(decisionsDir, f), "utf8");
        return { id: f.replace(/\.md$/, ""), title: titleOf(markdown, f), markdown };
      });
  }
  return {
    exists: true,
    context: read("context.md"),
    conventions: read("conventions.md"),
    journal: read("journal.md"),
    decisions,
  };
}

function titleOf(markdown, filename) {
  const h1 = markdown.match(/^#\s+(.+)$/m);
  return h1 ? h1[1].trim() : filename.replace(/\.md$/, "");
}
