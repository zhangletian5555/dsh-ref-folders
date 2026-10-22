import path from "node:path";

/** Alias grammar from the product spec. */
export const ALIAS_RE = /^[a-z0-9][a-z0-9-_]{0,31}$/u;

/** One one-line description cap, to keep the prompt bounded and the template single-line. */
export const DESCRIPTION_MAX = 200;

const FALLBACK_GROUPS = [
  {
    tokens: new Set([
      "spec", "specs", "specification", "specifications",
      "api", "apis",
      "doc", "docs", "documentation",
      "contract", "contracts"
    ]),
    text: "只读契约/文档参考目录，用于理解接口与规范，禁止写入或修改。"
  },
  {
    tokens: new Set([
      "lib", "libs", "library", "libraries",
      "shared",
      "sdk", "sdks",
      "dep", "deps", "dependency", "dependencies"
    ]),
    text: "只读依赖库源码，用于理解外部接口与实现，禁止写入或修改。"
  },
  {
    tokens: new Set([
      "design", "designs",
      "token", "tokens",
      "style", "styles",
      "theme", "themes"
    ]),
    text: "只读设计参考目录，用于理解样式与规范，禁止写入或修改。"
  }
];

const GENERIC_FALLBACK = "只读参考目录，仅用于跨目录理解上下文与检索，禁止写入、编辑或执行任何修改操作。";

/**
 * Deterministic fallback for an empty description. Matches whole tokens, not
 * substrings, so aliases such as "rapid" or "docker" do not match api/doc.
 * @param {string} alias - normalized alias.
 * @returns {string} fallback description.
 */
export function fallbackDescription(alias) {
  const tokens = String(alias).toLowerCase().split(/[-_]+/u).filter(Boolean);
  for (const group of FALLBACK_GROUPS) {
    if (tokens.some((token) => group.tokens.has(token))) return group.text;
  }
  return GENERIC_FALLBACK;
}

/**
 * Derive an ASCII alias from a folder name. Returns "" when the name has no
 * ASCII alphanumeric content (e.g. a fully Chinese folder name), so the caller
 * can require an explicit alias instead of inventing a suffix.
 * @param {string} name - folder basename.
 * @returns {string} valid alias or "".
 */
export function slugAlias(name) {
  let value = String(name ?? "")
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/gu, "-")
    .replace(/-+/gu, "-")
    .replace(/^[-_]+|[-_]+$/gu, "");
  if (value.length === 0) return "";
  if (!/^[a-z0-9]/u.test(value)) value = `ref-${value}`;
  value = value.slice(0, 32).replace(/[-_]+$/u, "");
  return ALIAS_RE.test(value) ? value : "";
}

/** Validate an explicit alias. */
export function normalizeAlias(value) {
  const alias = String(value ?? "").trim();
  if (!ALIAS_RE.test(alias)) {
    throw new Error("alias must match ^[a-z0-9][a-z0-9-_]{0,31}$");
  }
  return alias;
}

/**
 * Normalize an optional description: one line, trimmed, bounded.
 * @param {unknown} value - caller input; undefined means "not supplied".
 * @returns {string | undefined} normalized description.
 */
export function normalizeDescription(value) {
  if (value === undefined) return undefined;
  const text = String(value).replace(/[\r\n]+/gu, " ").trim();
  if (text.length > DESCRIPTION_MAX) {
    throw new Error(`description must be at most ${DESCRIPTION_MAX} characters`);
  }
  return text;
}

/** Validate and freeze one stored array of folders. */
export function normalizeStored(value) {
  if (!Array.isArray(value)) throw new Error("stored ref folders must be an array");
  return value.map((entry) => {
    if (entry === null || typeof entry !== "object") {
      throw new Error("stored ref folder must be an object");
    }
    const { id, path: folderPath, key, alias, description, addedAt } = entry;
    if (typeof id !== "string" || id.length === 0) throw new Error("stored ref folder id is invalid");
    if (typeof folderPath !== "string" || !path.isAbsolute(folderPath)) {
      throw new Error("stored ref folder path must be absolute");
    }
    if (typeof key !== "string" || key.length === 0) throw new Error("stored ref folder key is invalid");
    if (!ALIAS_RE.test(alias)) throw new Error("stored ref folder alias is invalid");
    if (typeof description !== "string" || /[\r\n]/u.test(description) || description.length > DESCRIPTION_MAX) {
      throw new Error("stored ref folder description is invalid");
    }
    if (typeof addedAt !== "number" || !Number.isFinite(addedAt)) {
      throw new Error("stored ref folder addedAt is invalid");
    }
    return Object.freeze({ id, path: folderPath, key, alias, description, addedAt });
  });
}

/**
 * Render the model-facing block. An empty list renders "" so the runtime
 * context contributes zero characters.
 * @param {ReadonlyArray<{id:string,path:string,alias:string,description:string,addedAt:number}>} folders
 * @returns {string}
 */
export function renderBlock(folders) {
  if (!Array.isArray(folders) || folders.length === 0) return "";
  const sorted = [...folders].sort((left, right) => {
    if (left.addedAt !== right.addedAt) return left.addedAt - right.addedAt;
    return left.id < right.id ? -1 : left.id > right.id ? 1 : 0;
  });
  const lines = sorted.map((folder) => {
    const description = folder.description.length > 0
      ? folder.description
      : fallbackDescription(folder.alias);
    return `- [${folder.alias}] ${folder.path} — ${description}`;
  });
  return [
    "## Referenced Read-Only Folders",
    ...lines,
    "",
    "Read-only: never create, modify, or delete files inside these folders. Write derived files (renders, extracts, caches) to the workspace or temp instead."
  ].join("\n");
}

/**
 * Lexical containment used by the synchronous tool guard. Canonical
 * containment is the sandbox's job; this fast path catches ordinary paths.
 * Windows comparison is case-insensitive.
 * @param {string} root - canonical referenced folder.
 * @param {string} target - resolved tool path.
 * @returns {boolean} true when target is root or below it.
 */
export function isInsideLexical(root, target) {
  const normalize = (value) => (process.platform === "win32" ? value.toLowerCase() : value);
  const relative = path.relative(normalize(path.resolve(root)), normalize(path.resolve(target)));
  return relative === "" || (relative !== ".." && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative));
}

/** Split a command line into arguments, honoring double quotes. */
export function splitArgs(input) {
  const out = [];
  let current = "";
  let quoted = false;
  let started = false;
  for (const char of String(input ?? "")) {
    if (char === "\"") {
      quoted = !quoted;
      started = true;
      continue;
    }
    if (!quoted && /\s/u.test(char)) {
      if (started) {
        out.push(current);
        current = "";
        started = false;
      }
      continue;
    }
    current += char;
    started = true;
  }
  if (started) out.push(current);
  return out;
}
