import path from "node:path";
import { randomUUID } from "node:crypto";
import {
  isInsideLexical,
  normalizeAlias,
  normalizeDescription,
  normalizeStored,
  renderBlock,
  slugAlias
} from "./core.js";
import { registerRefCommands } from "./commands.js";
import { registerRefFolderHttp } from "./http.js";

/**
 * The domain spec is structurally the storage-domain contract (name, version,
 * tables, and a valueSchema with parse). Keeping it local avoids a dependency
 * on the storage package while still using the documented service.
 */
const DOMAIN_SPEC = {
  name: "ref_folders",
  version: 1,
  invalidRecords: "backup-and-skip",
  tables: {
    folders: {
      valueSchema: {
        parse(value) {
          return normalizeStored(value);
        }
      }
    }
  }
};

const MUTATING_TOOLS = new Set(["write", "edit"]);

function toView(record) {
  return Object.freeze({
    id: record.id,
    path: record.path,
    alias: record.alias,
    description: record.description,
    addedAt: record.addedAt
  });
}

function compareViews(left, right) {
  if (left.addedAt !== right.addedAt) return left.addedAt - right.addedAt;
  return left.id < right.id ? -1 : left.id > right.id ? 1 : 0;
}

/**
 * Session-scoped read-only referenced folders.
 *
 * The service owns the durable store, the runtime-context contribution, the
 * write guard, and the /ref command. The UI (later) is expected to call these
 * same methods through the plugin's client half.
 */
export const inject = [
  "agents",
  "fs",
  "sandboxPolicy",
  "storageDomain",
  "systemPrompt",
  "tools",
  "webServer",
  "workingDirectory"
];

export class RefFolders {
  constructor(ctx) {
    this.ctx = ctx;
    this._domain = undefined;
    this._folders = new Map();
    this._chains = new Map();
    this._started = false;
    this._ready = this._load();
    this._ready.catch((error) => {
      ctx.logger.error(`ref-folders: cannot open storage: ${error instanceof Error ? error.message : String(error)}`);
    });

    ctx.effect(() => async () => {
      await this._ready.catch(() => {});
      if (this._domain !== undefined) await this._domain.close().catch(() => {});
    });
  }

  /**
   * Wait for storage, then expose every contribution. Registering only after
   * the load closes the window where the UI or /ref sees an empty list.
   */
  async activate() {
    await this._ready;
    if (this._started) return;
    this._started = true;
    this._registerPrompt();
    this._registerGuard();
    registerRefCommands(this, this.ctx);
  }

  async _load() {
    const domain = await this.ctx.storageDomain.open(DOMAIN_SPEC);
    this._domain = domain;
    for (const [sessionId, value] of domain.table("folders").entries()) {
      this._folders.set(String(sessionId), normalizeStored(value));
    }
  }

  _requireDomain() {
    if (this._domain === undefined) throw new Error("ref-folders storage is unavailable");
    return this._domain;
  }

  _list(sessionId) {
    return this._folders.get(sessionId) ?? [];
  }

  /** Serialize read-modify-write operations per session. */
  _serial(sessionId, operation) {
    const previous = this._chains.get(sessionId) ?? Promise.resolve();
    const run = previous.catch(() => {}).then(operation);
    this._chains.set(sessionId, run);
    return run.finally(() => {
      if (this._chains.get(sessionId) === run) this._chains.delete(sessionId);
    });
  }

  async _persist(sessionId, next) {
    const table = this._requireDomain().table("folders");
    if (next.length === 0) await table.delete(sessionId);
    else await table.put(sessionId, next);
    this._folders.set(sessionId, next);
  }

  _registerPrompt() {
    this.ctx.systemPrompt.context({
      name: "ref-folders:current",
      order: 105,
      interpolate: false,
      text: (context) => {
        const session = context.agent?.session;
        if (session === undefined) return "";
        return renderBlock(this._list(session.id));
      }
    });
  }

  _registerGuard() {
    this.ctx.tools.guard((exec) => {
      if (!MUTATING_TOOLS.has(exec.name)) return;
      const filePath = exec.arguments?.file_path;
      if (typeof filePath !== "string" || filePath.length === 0) return;
      const agent = exec.agent;
      if (agent === undefined) return;
      const folders = this._list(agent.session.id);
      if (folders.length === 0) return;

      let target;
      try {
        target = path.resolve(this.ctx.workingDirectory.get(agent.session), filePath);
      } catch {
        return;
      }
      for (const folder of folders) {
        if (isInsideLexical(folder.path, target)) {
          return `path is inside a read-only referenced folder [${folder.alias}]: ${target}. Write operations are not permitted.`;
        }
      }
    });
  }

  /** Public list of this session's folders, oldest first. */
  list(agent) {
    return this._list(agent.session.id).map(toView).sort(compareViews);
  }

  /** Add one folder, or update the description of an identical canonical path. */
  async add(agent, input = {}, signal) {
    await this._ready;
    const sessionId = agent.session.id;
    return this._serial(sessionId, async () => {
      const requestedPath = String(input.path ?? "").trim();
      if (requestedPath.length === 0) throw new Error("path must not be empty");
      const requestedAlias = input.alias === undefined ? undefined : normalizeAlias(input.alias);

      const target = await this.ctx.fs.resolve(requestedPath, {
        cwd: this.ctx.workingDirectory.get(agent.session),
        signal
      });
      const info = await this.ctx.fs.stat(target, signal);
      if (info === undefined) throw new Error(`directory does not exist: ${target.displayPath}`);
      if (info.type !== "directory") throw new Error(`not a directory: ${target.displayPath}`);
      const canonical = this.ctx.fs.processPath(target);

      const existing = this._list(sessionId);
      const workspaceTarget = await this.ctx.fs.resolve(
        this.ctx.sandboxPolicy.resolve({ session: agent.session }).workspaceRoot,
        { signal }
      );
      if (this.ctx.fs.contains(target, workspaceTarget) || this.ctx.fs.contains(workspaceTarget, target)) {
        throw new Error("the referenced folder overlaps the session workspace");
      }

      for (const folder of existing) {
        const folderTarget = await this.ctx.fs.resolve(folder.path, { signal });
        if (folderTarget.targetKey === target.targetKey) {
          if (requestedAlias !== undefined && requestedAlias !== folder.alias) {
            throw new Error(`path is already referenced as [${folder.alias}]; remove it first to change the alias`);
          }
          if (input.description === undefined) return toView(folder);
          const description = normalizeDescription(input.description);
          const next = existing.map((entry) => entry.id === folder.id
            ? Object.freeze({ ...entry, description })
            : entry);
          await this._persist(sessionId, next);
          return toView(next.find((entry) => entry.id === folder.id));
        }
        if (this.ctx.fs.contains(folderTarget, target) || this.ctx.fs.contains(target, folderTarget)) {
          throw new Error(`the referenced folder overlaps [${folder.alias}]`);
        }
      }

      const alias = requestedAlias ?? slugAlias(path.basename(canonical));
      if (alias.length === 0) {
        throw new Error("cannot derive a valid alias from the folder name; provide an alias");
      }
      if (existing.some((folder) => folder.alias === alias)) {
        throw new Error(`alias already in use: ${alias}`);
      }

      const record = Object.freeze({
        id: randomUUID(),
        path: canonical,
        key: target.targetKey,
        alias,
        description: normalizeDescription(input.description) ?? "",
        addedAt: Date.now()
      });
      await this._persist(sessionId, [...existing, record]);
      return toView(record);
    });
  }

  /** Remove by alias (or id), returning the removed view for undo. */
  async remove(agent, alias, signal) {
    await this._ready;
    const sessionId = agent.session.id;
    return this._serial(sessionId, async () => {
      const existing = [...this._list(sessionId)];
      const index = existing.findIndex((folder) => folder.alias === alias || folder.id === alias);
      if (index < 0) throw new Error(`referenced folder not found: ${alias}`);
      const [removed] = existing.slice(index, index + 1);
      await this._persist(sessionId, existing.filter((_, position) => position !== index));
      return toView(removed);
    });
  }

  /** Update the description of one folder. */
  async update(agent, alias, patch = {}, signal) {
    await this._ready;
    const sessionId = agent.session.id;
    return this._serial(sessionId, async () => {
      const existing = this._list(sessionId);
      const index = existing.findIndex((folder) => folder.alias === alias || folder.id === alias);
      if (index < 0) throw new Error(`referenced folder not found: ${alias}`);
      const description = normalizeDescription(patch.description);
      if (description === undefined) throw new Error("description is required");
      const record = Object.freeze({ ...existing[index], description });
      const next = existing.map((entry, position) => (position === index ? record : entry));
      await this._persist(sessionId, next);
      return toView(record);
    });
  }

  /**
   * Pure preview for the UI and tests. With an alias it renders one candidate
   * entry; without input it renders the session's current block.
   */
  preview(agent, input) {
    if (input !== undefined && input.alias !== undefined) {
      return renderBlock([{
        id: "preview",
        path: String(input.path ?? ""),
        key: "preview",
        alias: normalizeAlias(input.alias),
        description: normalizeDescription(input.description) ?? "",
        addedAt: 0
      }]);
    }
    return renderBlock(this._list(agent.session.id));
  }

  /** Current enforcement level, for the UI and /ref list. */
  enforcement(agent) {
    const mode = this.ctx.sandboxPolicy.resolve({ session: agent.session }).mode;
    if (mode === "danger-full-access") {
      return Object.freeze({
        mode,
        level: "advisory",
        note: "Only write/edit are guarded in this mode; other tools can write."
      });
    }
    return Object.freeze({
      mode,
      level: "sandbox",
      note: "The sandbox fences writes outside the session workspace."
    });
  }
}

/** Function-plugin entry: own the service in this plugin's fiber. */
export async function apply(ctx) {
  const service = new RefFolders(ctx);
  await service.activate();
  ctx.provide("refFolders", service);
  registerRefFolderHttp(ctx, service);
}
