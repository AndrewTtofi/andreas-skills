import { test } from "node:test";
import assert from "node:assert/strict";
import { renderMarkdown } from "../markdown.mjs";

test("headings", () => assert.equal(renderMarkdown("# Hi"), "<h1>Hi</h1>"));
test("bold and inline code", () =>
  assert.match(renderMarkdown("a **b** `c`"), /<strong>b<\/strong>.*<code>c<\/code>/));
test("unordered list", () =>
  assert.equal(renderMarkdown("- a\n- b"), "<ul>\n<li>a</li>\n<li>b</li>\n</ul>"));
test("escapes html", () => assert.match(renderMarkdown("<script>"), /&lt;script&gt;/));
test("links", () =>
  assert.match(renderMarkdown("[x](http://y)"), /<a href="http:\/\/y"[^>]*>x<\/a>/));
test("table", () => {
  const h = renderMarkdown("| a | b |\n|---|---|\n| 1 | 2 |");
  assert.match(h, /<th>a<\/th>/);
  assert.match(h, /<td>1<\/td>/);
});
test("code fence escapes content", () => {
  const h = renderMarkdown("```\n<x>\n```");
  assert.match(h, /<pre><code>&lt;x&gt;<\/code><\/pre>/);
});
