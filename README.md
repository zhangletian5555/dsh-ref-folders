# dsh-ref-folder

给 DSH 会话添加**只读参考目录**：模型可以读取，但不能写入；不改变工作区，也不改变沙箱。

## 功能

- 在 composer 的权限按钮旁提供“引用目录”入口。
- 选择目录、起一个别名、写一句描述，保存前可看到实际注入的 prompt。
- 模型能读这些目录；指向它们的 `write` / `edit` 会被拒绝。
- 引用是**会话级**的，不污染其他会话。
- 没有引用时，prompt 增量为零。

## 要求

- DeepSeek Harness `0.2.1-rc.2`（`engines.dsh: ^0.2.1-rc.2`）
- DSH Web GUI（按钮和面板在 Web composer 中）

## 安装

### 从 npm（发布后）

```text
plugin_manager install_bundle
  target: dsh-ref-folder@0.3.0
```

### 从 GitHub

```text
plugin_manager install_bundle
  target: github:zhangletian5555/dsh-ref-folder
```

### 本地开发

```text
plugin_manager install_bundle
  target: D:\Programming Project\dsh-ref-folders
```

安装后到 **Plugins** 页面确认 `dsh-ref-folder` 已启用；如果提示需要重启，重启 DSH 后再打开会话。

## 使用

### 界面

composer 工具行会出现 **引用目录**，位置在权限按钮右侧（DSH 没有提供 `+` 与权限按钮之间的 slot）。

1. 点“引用目录”。
2. 点“选择”挑目录。
3. 别名可留空自动生成；中文/纯符号目录名需要手动填别名。
4. 描述可留空，会使用默认只读说明。
5. 点“添加”。

已引用条目可以点行编辑描述，或点 `×` 移除。面板会显示当前的只读强度：

- `read-only` / `workspace-write`：沙箱写入边界生效；
- `danger-full-access`：只有 `write` / `edit` 有路径拦截，其他工具仍可能写入。

### 命令

```text
/ref list
/ref add "D:\api-specs" specs
/ref desc specs 只读契约/文档参考目录
/ref remove specs
```

- 别名留空时按目录名生成；生成不了会要求显式填写。
- 同一 canonical 路径重复添加不会产生第二条，只更新描述。
- 与当前 workspace 重叠、或与已有引用嵌套的目录会被拒绝。

## 只读边界

- `read`、`grep`、`glob`、shell 读取不受限制。
- 指向引用目录的 `write` / `edit` 会被拒绝，并返回带别名的错误。
- DSH 沙箱仍是主要边界；`read-only` / `workspace-write` 下引用目录在 workspace 外时会由沙箱兜底。
- `danger-full-access` 下 guard 只是提示层：shell、MCP、`cordis_run`、office 脚本、子代理都不在路径检查内。
- 子代理和 fork 不继承引用列表。

## PDF / Office

`read` 只读 UTF-8 文本，`read_image` 只读图片；PDF/Office 通常需要 office 渲染器生成页图。

渲染输出请放在 workspace 或 temp，**不要写进引用目录**。`read-only` 模式下沙箱会阻止所有派生写；此时只能抽取文本到 stdout，或由用户切换权限/批准一次性升级。插件本身不解析 PDF，也不会为了渲染放宽引用目录。

## 数据

`~/.dsh/storages/ref_folders.json`，按 session id 存储。它是插件私有存储：不进入 session log，不随 fork 复制，也不随会话导出。

## 注意

UI 的读写走本地同源 `POST /ref-folder-api`；它没有额外认证，只适合本机使用。远程访问 DSH Web 时请先评估这个路由的暴露面。

## 开发

```powershell
node --test test/core.test.js test/service.test.js
```

- `src/core.js`：纯函数（alias、兜底、渲染、包含判断）
- `src/service.js`：存储、context、guard、命令装配
- `src/commands.js`：`/ref` 命令
- `src/http.js`：UI 的同源桥
- `client.js`：composer 按钮和面板

## License

MIT
