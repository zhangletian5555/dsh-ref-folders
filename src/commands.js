import { fallbackDescription, splitArgs } from "./core.js";

const USAGE = "用法：/ref list | add <path> [alias] | remove <alias> | desc <alias> <text>";

function formatList(service, agent) {
  const folders = service.list(agent);
  const enforcement = service.enforcement(agent);
  const modeLine = `模式：${enforcement.mode}（${enforcement.level}）`;
  if (folders.length === 0) return `没有引用目录\n${modeLine}`;
  const lines = folders.map((folder) => {
    const description = folder.description.length > 0
      ? folder.description
      : fallbackDescription(folder.alias);
    return `[${folder.alias}] ${folder.path} — ${description}`;
  });
  lines.push("", modeLine);
  if (enforcement.level === "advisory") {
    lines.push("提示：当前模式下只有 write/edit 被拦截，其他工具仍可能写入。");
  }
  return lines.join("\n");
}

/**
 * Register the v1 /ref command. The command is only an adapter over the
 * RefFolders service; the future UI calls the same methods.
 */
export function registerRefCommands(service, ctx) {
  ctx.inject(["commands"], (commandCtx) => {
    commandCtx.effect(() => commandCtx.commands.register({
      name: "ref",
      description: "管理当前会话的只读引用目录",
      input: {
        hint: "list | add <path> [alias] | remove <alias> | desc <alias> <text>"
      },
      async handler({ agent, rawInput, signal }) {
        if (agent === undefined) return { kind: "error", text: "这个命令需要一个会话。" };
        const [sub, ...rest] = splitArgs(rawInput);
        try {
          switch (sub) {
            case "list":
              return { kind: "success", text: formatList(service, agent) };
            case "add": {
              const [folderPath, alias] = rest;
              if (folderPath === undefined) return { kind: "error", text: USAGE };
              const view = await service.add(agent, { path: folderPath, alias }, signal);
              return { kind: "success", text: `已添加 [${view.alias}] ${view.path}` };
            }
            case "remove": {
              const [alias] = rest;
              if (alias === undefined) return { kind: "error", text: USAGE };
              const view = await service.remove(agent, alias, signal);
              return { kind: "success", text: `已移除 [${view.alias}] ${view.path}` };
            }
            case "desc": {
              const [alias, ...words] = rest;
              if (alias === undefined || words.length === 0) return { kind: "error", text: USAGE };
              const view = await service.update(agent, alias, { description: words.join(" ") }, signal);
              return { kind: "success", text: `已更新 [${view.alias}] 的描述` };
            }
            default:
              return { kind: "error", text: USAGE };
          }
        } catch (error) {
          return { kind: "error", text: error instanceof Error ? error.message : String(error) };
        }
      }
    }));
  });
}
