import test from "node:test";
import assert from "node:assert/strict";
import { registerRefCommands } from "../src/commands.js";

function harness() {
  const calls = [];
  const service = {
    list: () => [{ id: "f1", path: "C:\\ref", alias: "refs", description: "", addedAt: 1 }],
    enforcement: () => ({ mode: "workspace-write", level: "sandbox", note: "" }),
    add: async (_agent, input) => {
      calls.push(["add", input]);
      return { id: "f2", path: input.path, alias: input.alias ?? "auto", description: "", addedAt: 2 };
    },
    remove: async (_agent, alias) => {
      calls.push(["remove", alias]);
      return { id: "f1", path: "C:\\ref", alias, description: "", addedAt: 1 };
    },
    update: async (_agent, alias, patch) => {
      calls.push(["update", alias, patch]);
      return { id: "f1", path: "C:\\ref", alias, description: patch.description, addedAt: 1 };
    }
  };
  const captured = {};
  const ctx = {
    inject: (names, callback) => {
      assert.deepEqual(names, ["commands"]);
      callback({
        commands: {
          register: (definition) => { captured.command = definition; return () => {}; }
        },
        effect: (factory) => factory()
      });
    }
  };
  registerRefCommands(service, ctx);
  return { command: captured.command, calls };
}

const agent = { session: { id: "s1" } };

async function run(command, rawInput, currentAgent = agent) {
  return command.handler({ agent: currentAgent, rawInput, signal: undefined });
}

test("registers the /ref command with its input hint", () => {
  const { command } = harness();
  assert.equal(command.name, "ref");
  assert.match(command.description, /引用目录/);
  assert.match(command.input.hint, /add <path>/);
});

test("/ref list renders entries and the sandbox mode", async () => {
  const { command } = harness();
  const result = await run(command, "list");
  assert.equal(result.kind, "success");
  assert.match(result.text, /\[refs\] C:\\ref/);
  assert.match(result.text, /模式：workspace-write（sandbox）/);
});

test("/ref add dispatches path and alias", async () => {
  const { command, calls } = harness();
  const result = await run(command, 'add "C:\\ref" refs');
  assert.equal(result.kind, "success");
  assert.match(result.text, /已添加 \[refs\] C:\\ref/);
  assert.deepEqual(calls.at(-1), ["add", { path: "C:\\ref", alias: "refs" }]);
});

test("/ref remove dispatches the alias", async () => {
  const { command, calls } = harness();
  const result = await run(command, "remove refs");
  assert.equal(result.kind, "success");
  assert.match(result.text, /已移除 \[refs\]/);
  assert.deepEqual(calls.at(-1), ["remove", "refs"]);
});

test("/ref desc dispatches the description", async () => {
  const { command, calls } = harness();
  const result = await run(command, "desc refs new description");
  assert.equal(result.kind, "success");
  assert.match(result.text, /已更新 \[refs\] 的描述/);
  assert.deepEqual(calls.at(-1), ["update", "refs", { description: "new description" }]);
});

test("/ref returns usage for missing arguments", async () => {
  const { command } = harness();
  const missingAdd = await run(command, "add");
  const unknown = await run(command, "wat");
  assert.equal(missingAdd.kind, "error");
  assert.match(missingAdd.text, /用法：/);
  assert.equal(unknown.kind, "error");
  assert.match(unknown.text, /用法：/);
});

test("/ref rejects a call without an agent", async () => {
  const { command } = harness();
  const result = await command.handler({ agent: undefined, rawInput: "list", signal: undefined });
  assert.equal(result.kind, "error");
  assert.match(result.text, /需要一个会话/);
});
