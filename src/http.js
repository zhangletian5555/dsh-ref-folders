/**
 * Same-origin HTTP bridge for the composer UI.
 *
 * DSH's `api-remotes` client is a generated assembly of shipped Host
 * capabilities, so a third-party service cannot appear as `ctx.remote.*`
 * without rebuilding that package. A same-origin route is the smallest bridge
 * that keeps the UI off the command log. It accepts POST only, requires a
 * custom header (which a cross-origin form cannot set), and rejects a foreign
 * Origin when the browser sends one.
 */

const ROUTE = "/ref-folder-api";
const HEADER = "x-ref-folder";
const MAX_BODY_BYTES = 1024 * 1024;

function send(response, status, payload) {
  response.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store"
  });
  response.end(JSON.stringify(payload));
}

async function readJson(request) {
  const chunks = [];
  let bytes = 0;
  for await (const chunk of request) {
    bytes += chunk.length;
    if (bytes > MAX_BODY_BYTES) throw new Error("request body is too large");
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function messageOf(error) {
  if (error instanceof Error) return error.message;
  if (error !== null && typeof error === "object" && typeof error.message === "string") return error.message;
  return String(error);
}

const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]", "::1"]);

function isAllowedOrigin(requestOrigin, expectedOrigin) {
  if (requestOrigin === undefined) return true;
  if (requestOrigin === expectedOrigin) return true;
  try {
    const requestUrl = new URL(requestOrigin);
    const expectedUrl = new URL(expectedOrigin);
    return requestUrl.protocol === expectedUrl.protocol
      && requestUrl.port === expectedUrl.port
      && (LOOPBACK_HOSTS.has(requestUrl.hostname) || requestUrl.hostname === expectedUrl.hostname);
  } catch {
    return false;
  }
}

export function registerRefFolderHttp(ctx, service) {
  const origin = ctx.webServer.getOrigin();
  ctx.effect(() => ctx.webServer.register({
    kind: "prefix",
    path: ROUTE,
    handler: async (request, response) => {
      if (request.method !== "POST") {
        send(response, 405, { ok: false, error: "POST required" });
        return;
      }
      if (request.headers[HEADER] !== "1") {
        send(response, 403, { ok: false, error: "missing bridge header" });
        return;
      }
      if (!isAllowedOrigin(request.headers.origin, origin)) {
        send(response, 403, { ok: false, error: "foreign origin" });
        return;
      }

      let body;
      try {
        body = await readJson(request);
      } catch (error) {
        send(response, 400, { ok: false, error: messageOf(error) });
        return;
      }

      const agent = ctx.agents.get(body?.sessionId);
      if (agent === undefined) {
        send(response, 404, { ok: false, error: "session is not live" });
        return;
      }

      try {
        switch (body.action) {
          case "list":
            send(response, 200, { ok: true, value: service.list(agent) });
            return;
          case "add":
            send(response, 200, { ok: true, value: await service.add(agent, body.input ?? {}) });
            return;
          case "remove":
            send(response, 200, { ok: true, value: await service.remove(agent, String(body.alias ?? "")) });
            return;
          case "update":
            send(response, 200, {
              ok: true,
              value: await service.update(agent, String(body.alias ?? ""), body.patch ?? {})
            });
            return;
          case "preview":
            send(response, 200, { ok: true, value: service.preview(agent, body.input ?? {}) });
            return;
          case "enforcement":
            send(response, 200, { ok: true, value: service.enforcement(agent) });
            return;
          default:
            send(response, 400, { ok: false, error: "unknown action" });
        }
      } catch (error) {
        send(response, 200, { ok: false, error: messageOf(error) });
      }
    }
  }));
}
