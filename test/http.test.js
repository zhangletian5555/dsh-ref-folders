import test from "node:test";
import assert from "node:assert/strict";
import { registerRefFolderHttp } from "../src/http.js";

const ORIGIN = "http://127.0.0.1:3000";
const SESSION = { id: "s1", header: { cwd: "C:\\ws" } };

function makeHarness(overrides = {}) {
  const captured = {};
  const service = {
    list: () => [{ id: "f1", path: "C:\\ref", alias: "refs", description: "", addedAt: 1 }],
    add: async (_agent, input) => ({ id: "f2", path: input.path, alias: "new", description: "", addedAt: 2 }),
    remove: async (_agent, alias) => ({ id: "f1", path: "C:\\ref", alias, description: "", addedAt: 1 }),
    update: async (_agent, alias, patch) => ({ id: "f1", path: "C:\\ref", alias, description: patch.description, addedAt: 1 }),
    preview: () => "preview",
    enforcement: () => ({ mode: "workspace-write", level: "sandbox", note: "" }),
    ...overrides
  };
  const ctx = {
    webServer: {
      getOrigin: () => ORIGIN,
      register: (route) => { captured.route = route; return () => {}; }
    },
    agents: {
      get: (sessionId) => (sessionId === SESSION.id ? { session: SESSION } : undefined)
    },
    effect: (factory) => factory()
  };
  registerRefFolderHttp(ctx, service);
  return { captured, service };
}

function makeRequest(method, headers = {}, body) {
  return {
    method,
    headers,
    async *[Symbol.asyncIterator]() {
      if (body !== undefined) yield Buffer.from(JSON.stringify(body));
    }
  };
}

function makeResponse() {
  return {
    statusCode: 0,
    headers: {},
    body: "",
    writeHead(status, headers) {
      this.statusCode = status;
      this.headers = headers;
    },
    end(chunk = "") {
      this.body = String(chunk);
    },
    json() {
      return JSON.parse(this.body);
    }
  };
}

async function call(handler, request) {
  const response = makeResponse();
  await handler(request, response);
  return response;
}

test("bridge exposes the registered prefix route", () => {
  const { captured } = makeHarness();
  assert.equal(captured.route.kind, "prefix");
  assert.equal(captured.route.path, "/ref-folder-api");
});

test("bridge returns a list for a live session", async () => {
  const { captured } = makeHarness();
  const response = await call(captured.route.handler, makeRequest("POST", {
    "x-ref-folder": "1",
    origin: ORIGIN
  }, { sessionId: SESSION.id, action: "list" }));

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.json(), {
    ok: true,
    value: [{ id: "f1", path: "C:\\ref", alias: "refs", description: "", addedAt: 1 }]
  });
});

test("bridge rejects missing header", async () => {
  const { captured } = makeHarness();
  const response = await call(captured.route.handler, makeRequest("POST", { origin: ORIGIN }, {
    sessionId: SESSION.id,
    action: "list"
  }));
  assert.equal(response.statusCode, 403);
  assert.equal(response.json().error, "missing bridge header");
});

test("bridge rejects a foreign origin", async () => {
  const { captured } = makeHarness();
  const response = await call(captured.route.handler, makeRequest("POST", {
    "x-ref-folder": "1",
    origin: "http://evil.example:3000"
  }, { sessionId: SESSION.id, action: "list" }));
  assert.equal(response.statusCode, 403);
  assert.equal(response.json().error, "foreign origin");
});

test("bridge rejects non-POST methods", async () => {
  const { captured } = makeHarness();
  const response = await call(captured.route.handler, makeRequest("GET", {
    "x-ref-folder": "1",
    origin: ORIGIN
  }));
  assert.equal(response.statusCode, 405);
  assert.equal(response.json().error, "POST required");
});

test("bridge rejects an unknown action", async () => {
  const { captured } = makeHarness();
  const response = await call(captured.route.handler, makeRequest("POST", {
    "x-ref-folder": "1",
    origin: ORIGIN
  }, { sessionId: SESSION.id, action: "nope" }));
  assert.equal(response.statusCode, 400);
  assert.equal(response.json().error, "unknown action");
});

test("bridge rejects a session that is not live", async () => {
  const { captured } = makeHarness();
  const response = await call(captured.route.handler, makeRequest("POST", {
    "x-ref-folder": "1",
    origin: ORIGIN
  }, { sessionId: "gone", action: "list" }));
  assert.equal(response.statusCode, 404);
  assert.equal(response.json().error, "session is not live");
});

test("bridge reports a malformed JSON body as 400", async () => {
  const { captured } = makeHarness();
  const response = await call(captured.route.handler, {
    method: "POST",
    headers: { "x-ref-folder": "1", origin: ORIGIN },
    async *[Symbol.asyncIterator]() {
      yield Buffer.from("{not json");
    }
  });
  assert.equal(response.statusCode, 400);
  assert.equal(response.json().ok, false);
});
