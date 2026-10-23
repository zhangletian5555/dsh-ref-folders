/**
 * Shared alias vectors. Both src/core.js and client.js must agree with these;
 * client-slug.test.js extracts the client copy and runs the same table.
 */
export const SLUG_VECTORS = [
  ["My Specs", "my-specs"],
  ["API Docs", "api-docs"],
  ["123", "123"],
  ["123abc", "123abc"],
  ["A_B", "a_b"],
  ["a b_c", "a-b_c"],
  ["--foo__bar--", "foo__bar"],
  ["__a__", "a"],
  ["-foo", "foo"],
  ["a---b", "a-b"],
  ["é", "e"],
  ["a".repeat(40), "a".repeat(32)],
  ["中文目录", ""],
  ["...", ""],
  ["---", ""],
  ["", ""],
  [undefined, ""],
  [null, ""]
];
