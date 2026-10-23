import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { SLUG_VECTORS } from "./slug-vectors.js";

/**
 * The Client bundle cannot import src/core.js, so it carries a copy of
 * slugAlias. Extract that copy and compare it against the shared table so the
 * two implementations cannot silently drift.
 */
function clientSlugAlias() {
  const source = readFileSync(fileURLToPath(new URL("../client.js", import.meta.url)), "utf8");
  const start = source.indexOf("function slugAlias(name) {");
  const end = source.indexOf("function messageOf", start);
  assert.notEqual(start, -1, "client slugAlias is missing");
  assert.notEqual(end, -1, "client messageOf marker is missing");
  return new Function(`return (${source.slice(start, end)})`)();
}

test("client slugAlias agrees with the shared vectors", () => {
  const slugAlias = clientSlugAlias();
  for (const [input, expected] of SLUG_VECTORS) {
    assert.equal(slugAlias(input), expected, `client slugAlias(${JSON.stringify(input)})`);
  }
});
