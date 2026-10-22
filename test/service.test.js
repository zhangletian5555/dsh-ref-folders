import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { RefFolders } from "../src/service.js";

const WORKSPACE = "C:\\ws";
const DIRS = new Set(["C:\\ws", "C:\\ws\\sub", "C:\\ref", "C:\\ref\\child", "C:\\other"]);

function norm(value) {
  return path.win32.resolve(value).toLowerCase();
}

function contains(parent, child) {
  const parentPath = typeof parent === "string" ? parent : parent.displayPath;
  const childPath = typeof child === "string" ? child : child.displayPath;
  const relative = path.win32.relative(norm(parentPath), norm(childPath));
  return relative === "" || (!relative.startsWith("..") && !path.win32.isAbsolute(relative));
}

function makeCtx() {
  const store = new Map();
  const table = {
    get: (key) => store.get(key),
    entries: () => store.entries(),
    put: async (key, value) => { store.set(key, value); },
    delete: async (key) => store.delete(key)
  };
  const captured = {};
  const ctx = {
    logger: { error: () => {}, warn: () => {}, info: () => {} },
    storageDomain: {
      open: async () => ({ table: () => table, close: async () => {} })
    },
    fs: {
      resolve: async (requested, options = {}) => {
        const displayPath = path.win32.resolve(options.cwd ?? WORKSPACE, requested);
        return { targetKey: norm(displayPath), displayPath };
      },
      stat: async (target) => (DIRS.has(target.displayPath) ? { type: "directory", version: "v" } : undefined),
      processPath: (target) => target.displayPath,
      contains
    },
    sandboxPolicy: {
      resolve: () => ({ mode: "workspace-write", workspaceRoot: WORKSPACE })
    },
    workingDirectory: {
      get: () => WORKSPACE
    },
    systemPrompt: {
      context: (definition) => { captured.context = definition; return () => {}; }
    },
    tools: {
      guard: (guard) => { captured.guard = guard; return () => {}; }
    },
    effect: (factory) => factory(),
    inject: (names, callback) => {
      if (!names.includes("commands")) return;
      const commandCtx = {
        commands: {
          register: (definition) => { captured.command = definition; return () => {}; }
        },
        effect: (factory) => factory()
      };
      callback(commandCtx);
    }
  };
  return { ctx, captured };
}

const agent = { session: { id: "s1", header: { cwd: WORKSPACE } } };

test("service add/list/duplicate/remove/update and context/guard", async () => {
  const { ctx, captured } = makeCtx();
  const service = new RefFolders(ctx);
  await service._ready;

  const first = await service.add(agent, { path: "C:\\ref", alias: "specs" });
  assert.equal(first.alias, "specs");
  assert.equal(first.path, "C:\\ref");
  assert.equal(service.list(agent).length, 1);

  const duplicate = await service.add(agent, { path: "C:\\ref", description: "hello" });
  assert.equal(duplicate.id, first.id);
  assert.equal(service.list(agent)[0].description, "hello");

  await assert.rejects(() => service.add(agent, { path: "C:\\ref\\child", alias: "child" }), /overlaps/);
  await assert.rejects(() => service.add(agent, { path: "C:\\ws\\sub", alias: "inside" }), /overlaps the session workspace/);
  await assert.rejects(() => service.add(agent, { path: "C:\\other", alias: "specs" }), /alias already in use/);
  await assert.rejects(() => service.add(agent, { path: "C:\\ref\\missing", alias: "missing" }), /does not exist/);

  assert.match(service.preview(agent), /\[specs\] C:\\ref — hello/);
  assert.match(captured.context.text({ agent }), /\[specs\] C:\\ref — hello/);

  const denied = captured.guard({ name: "write", arguments: { file_path: "C:\\ref\\a.txt" }, agent });
  assert.match(denied, /\[specs\]/);
  assert.equal(captured.guard({ name: "read", arguments: { file_path: "C:\\ref\\a.txt" }, agent }), undefined);
  assert.equal(captured.guard({ name: "write", arguments: { file_path: "C:\\ws\\ok.txt" }, agent }), undefined);

  const updated = await service.update(agent, "specs", { description: "changed" });
  assert.equal(updated.description, "changed");
  const removed = await service.remove(agent, "specs");
  assert.equal(removed.alias, "specs");
  assert.equal(service.list(agent).length, 0);
  assert.equal(captured.context.text({ agent }), "");
});

test("service rejects aliases that cannot be derived and preserves other sessions", async () => {
  const { ctx } = makeCtx();
  const service = new RefFolders(ctx);
  await service._ready;

  await assert.rejects(
    () => service.add(agent, { path: "C:\\ref", alias: "" }),
    /alias must match/
  );
  const other = { session: { id: "s2", header: { cwd: WORKSPACE } } };
  await service.add(other, { path: "C:\\ref", alias: "refs" });
  assert.equal(service.list(agent).length, 0);
  assert.equal(service.list(other).length, 1);
});
