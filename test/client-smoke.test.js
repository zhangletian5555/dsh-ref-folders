import test from "node:test";
import assert from "node:assert/strict";

test("the client bundle registers and applies without a browser", async () => {
  const registered = {};
  const slots = {};

  globalThis.window = {
    __ModuleLoader__: {
      load(spec) {
        registered.spec = spec;
      }
    }
  };

  try {
    await import("../client.js");
    assert.equal(registered.spec.id, "dsh-ref-folder");

    const React = {
      Fragment: Symbol("Fragment"),
      createElement: () => null,
      useEffect: () => {},
      useRef: (value) => ({ current: value }),
      useState: (value) => [value, () => {}]
    };
    const plugin = registered.spec.factory(() => React);
    assert.deepEqual(plugin.inject, ["slots", "uiWorkspace"]);

    plugin.apply({
      uiWorkspace: {},
      slots: {
        inject: (name, callback) => {
          assert.equal(name, "conversation.input.left");
          callback();
        },
        register: (definition, render) => {
          slots.definition = definition;
          slots.render = render;
          return () => {};
        }
      }
    });

    assert.equal(slots.definition.id, "ref-folder");
    assert.equal(slots.definition.name, "conversation.input.left");
    assert.equal(typeof slots.render, "function");
  } finally {
    delete globalThis.window;
  }
});
