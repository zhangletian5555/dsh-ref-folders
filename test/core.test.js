import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import {
  fallbackDescription,
  isInsideLexical,
  normalizeDescription,
  renderBlock,
  slugAlias,
  splitArgs
} from "../src/core.js";

test("fallback matches whole alias tokens, not substrings", () => {
  assert.match(fallbackDescription("api-specs"), /契约\/文档/);
  assert.match(fallbackDescription("shared-lib"), /依赖库/);
  assert.match(fallbackDescription("design-tokens"), /设计参考/);
  assert.match(fallbackDescription("rapid"), /只读参考目录/);
  assert.match(fallbackDescription("docker"), /只读参考目录/);
  assert.match(fallbackDescription("stylesheet"), /只读参考目录/);
});

test("slugAlias produces the documented grammar or an empty string", () => {
  assert.equal(slugAlias("My Specs"), "my-specs");
  assert.equal(slugAlias("API Docs"), "api-docs");
  assert.equal(slugAlias("123"), "123");
  assert.equal(slugAlias("中文目录"), "");
  assert.equal(slugAlias("..."), "");
});

test("normalizeDescription flattens newlines and bounds length", () => {
  assert.equal(normalizeDescription("  a\nb  "), "a b");
  assert.equal(normalizeDescription(undefined), undefined);
  assert.throws(() => normalizeDescription("x".repeat(201)), /at most 200/);
});

test("renderBlock is empty with no folders and uses fallback with an empty description", () => {
  assert.equal(renderBlock([]), "");
  const block = renderBlock([{
    id: "1",
    path: "D:\\api-specs",
    key: "k",
    alias: "api-specs",
    description: "",
    addedAt: 1
  }]);
  assert.match(block, /^## Referenced Read-Only Folders/m);
  assert.match(block, /- \[api-specs\] D:\\api-specs — 只读契约\/文档参考目录/);
  assert.match(block, /never create, modify, or delete files inside these folders/);
});

test("lexical containment is root-or-below and case-insensitive on Windows", () => {
  const root = path.resolve("ref-root");
  assert.equal(isInsideLexical(root, root), true);
  assert.equal(isInsideLexical(root, path.join(root, "child", "file.txt")), true);
  assert.equal(isInsideLexical(root, path.resolve("other-root", "file.txt")), false);
  assert.equal(isInsideLexical(root, path.dirname(root)), false);
});

test("splitArgs honors double quotes", () => {
  assert.deepEqual(splitArgs('add "D:\\my specs" specs'), ["add", "D:\\my specs", "specs"]);
  assert.deepEqual(splitArgs("  list  "), ["list"]);
  assert.deepEqual(splitArgs(""), []);
});
