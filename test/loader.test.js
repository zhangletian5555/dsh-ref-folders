import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { Context } from "@deepseek-ai/cordis";
import * as plugin from "../src/service.js";

const WORKSPACE = "C:\\ws";

function norm(value) {
  return path.win32.resolve(value).toLowerCase();
}

function contains(parent, child) {
  const left = norm(typeof parent === "string" ? parent : parent.displayPath);
  const right = norm(typeof child === "string" ? child : child.displayPath);
  const relative = path.win32.relative(left, right);
  return relative === "" || (!relative.startsWith("..") && !path.win32.isAbsolute(relative));
}

/**
 * Build a real Cordis root Context with the services this plugin declares.
 * The storage `open` hook is injectable so the readiness window is testable.
 */
function makeCordis(open) {
  const store = new Map();
  const table = {
    entries: () => store.entries(),
    put: async (key, value) => { store.set(key, value); },
    delete: async (key) => { store.delete(key); }
  };
  const domain = { table: () => table, close: async () => {} };
  const captured = {};
  const ctx = new Context();

  ctx.provide("storageDomain", {
    open: open ?? (async () => domain)
  });
  ctx.provide("agents", { get: () => undefined });
  ctx.provide("fs", {
    resolve: async (requested, options = {}) => {
      const displayPath = path.win32.resolve(options.cwd ?? WORKSPACE, requested);
      return { targetKey: norm(displayPath), displayPath };
    },
    stat: async (target) => (contains(WORKSPACE, target) ? { type: "directory" } : { type: "directory" }),
    processPath: (target) => target.displayPath,
    contains
  });
  ctx.provide("sandboxPolicy", {
    resolve: () => ({ mode: "workspace-write", workspaceRoot: WORKSPACE })
  });
  ctx.provide("workingDirectory", { get: () => WORKSPACE });
  ctx.provide("systemPrompt", {
    context: (definition) => { captured.context = definition; return () => {}; }
  });
  ctx.provide("tools", {
    guard: (guard) => { captured.guard = guard; return () => {}; }
  });
  ctx.provide("webServer", {
    getOrigin: () => "http://127.0.0.1:3000",
    register: (route) => { captured.route = route; return () => {}; }
  });
  ctx.provide("commands", {
    register: (definition) => { captured.command = definition; return () => {}; }
  });

  return { ctx, captured };
}

test("a real Cordis root loads the plugin and exposes every contribution", async () => {
  const { ctx, captured } = makeCordis();
  const fiber = ctx.plugin({ apply: plugin.apply, inject: plugin.inject });
  await fiber;

  assert.equal(fiber.state, 2);
  assert.equal(typeof ctx.refFolders.list, "function");
  assert.equal(captured.route.path, "/ref-folder-api");
  assert.equal(typeof captured.context.text, "function");
  assert.equal(typeof captured.guard, "function");
  assert.equal(captured.command.name, "ref");

  await fiber.dispose();
});

test("Cordis does not expose the service before storage is ready", async () => {
  let release;
  const gate = new Promise((resolve) => { release = resolve; });
  const { ctx } = makeCordis(async () => {
    await gate;
    const store = new Map();
    return {
      table: () => ({ entries: () => store.entries(), put: async () => {}, delete: async () => {} }),
      close: async () => {}
    };
  });

  const fiber = ctx.plugin({ apply: plugin.apply, inject: plugin.inject });
  await Promise.resolve();
  assert.equal(ctx.refFolders, undefined);

  release();
  await fiber;
  assert.equal(fiber.state, 2);
  assert.equal(typeof ctx.refFolders.list, "function");
  await fiber.dispose();
});
