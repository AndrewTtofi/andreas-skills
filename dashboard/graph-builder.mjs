import { readSpine } from "./spine-reader.mjs";

// Builds a knowledge graph { nodes, edges } from a .spine/ store by matching
// the architecture-map module names against mentions in ADRs, conventions,
// and the journal's current focus.
export function buildGraph(spineOrDir) {
  const s = typeof spineOrDir === "string" ? readSpine(spineOrDir) : spineOrDir;
  if (!s || !s.exists) return { nodes: [], edges: [] };

  const nodes = [];
  const edges = [];

  const modules = extractModules(s.context);
  for (const m of modules) nodes.push({ id: m.id, label: m.name, type: "module" });
  for (const d of s.decisions) {
    nodes.push({ id: `adr:${d.id}`, label: shortTitle(d.title), type: "decision" });
  }
  if (s.conventions) nodes.push({ id: "conventions", label: "Conventions", type: "conventions" });

  const focus = s.journal ? extractFocus(s.journal) : null;
  if (focus !== null) nodes.push({ id: "focus", label: "Current focus", type: "focus" });

  const mentions = (text, name) =>
    new RegExp(`\\b${escapeRe(name)}\\b`, "i").test(text || "");

  for (const d of s.decisions) {
    for (const m of modules) {
      if (mentions(d.markdown, m.name)) edges.push({ source: `adr:${d.id}`, target: m.id, rel: "affects" });
    }
  }
  if (s.conventions) {
    for (const m of modules) {
      if (mentions(s.conventions, m.name)) edges.push({ source: "conventions", target: m.id, rel: "governs" });
    }
  }
  if (focus !== null) {
    for (const m of modules) {
      if (mentions(focus, m.name)) edges.push({ source: "focus", target: m.id, rel: "focuses" });
    }
  }

  return { nodes, edges };
}

function extractModules(context) {
  if (!context) return [];
  const out = [];
  const re = /^\s*[-*]\s+\*\*([^*]+)\*\*/gm;
  let m;
  while ((m = re.exec(context))) {
    const name = m[1].trim();
    out.push({ id: `mod:${name.toLowerCase()}`, name });
  }
  return out;
}

function extractFocus(journal) {
  const m = journal.match(/##\s*Current focus\s*\n+([\s\S]*?)(?:\n##|$)/i);
  return m ? m[1].trim() : null;
}

function shortTitle(title) {
  return title.replace(/^\d+\.\s*/, "");
}

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
