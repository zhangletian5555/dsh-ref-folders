# Publishing dsh-ref-folder

面向维护者的最短发布步骤。发布前确认你拥有 npm 包名和 GitHub 仓库。

## 0. 先定三件事

1. **License**：当前为 MIT；版权人已填 `zhangletian5555`（GitHub 用户名作为署名）。如果要用真实姓名或公司主体，替换 `LICENSE` 和 `package.json` 的 `author`。
2. **npm 包名**：当前 `dsh-ref-folder`。发布前再查一次：
   ```powershell
   npm view dsh-ref-folder version
   ```
   如果已被占用，改成 scope 包名，例如 `@your-name/dsh-ref-folder`，并同步更新 README 安装命令。
3. **GitHub 仓库地址**：已按 `https://github.com/zhangletian5555/dsh-ref-folder` 填好 `repository` / `homepage` / `bugs`；如果实际仓库名不同，改这三处和 README 的安装命令。

## 1. 发布前检查

```powershell
node --check index.js
node --check client.js
node --check src/service.js
node --check src/commands.js
node --check src/http.js
node --test test/core.test.js test/service.test.js
```

确认 `package.json`：

- 没有 `"private": true`；
- `license` 为 MIT；
- `engines.dsh` 覆盖目标 DSH；
- `files` 包含 `client.js`、`src/*.js`、`cordis.patch.yml`、locale、icon、LICENSE；
- `dsh.bundle.patch` 和 `dsh.client` 都存在。

## 2. 检查实际打包内容

```powershell
npm pack --dry-run
```

应包含：`index.js`、`client.js`、`src/*.js`、`cordis.patch.yml`、`locale/*.json`、`icon.svg`、`package.json`、`README.md`、`LICENSE`。不应包含 `node_modules`、测试或临时文件。

## 3. 发布到 npm

```powershell
npm login
npm publish --access public
npm view dsh-ref-folder version
```

- 第一次发布用 `0.3.0`；后续改动先升版本，再 `npm publish`。
- 开了 2FA 时按提示完成。
- 发布后 npm 页面应能看到 README、LICENSE 和仓库链接。

## 4. 干净安装验证

在另一个 DSH profile，或先移除本地链接版本：

```text
plugin_manager
  action: install_bundle
  target: dsh-ref-folder@0.3.0
```

然后：

1. 确认 Plugins 页面出现 `dsh-ref-folder` 并启用；
2. 按提示重启 DSH；
3. 打开一个会话，确认“引用目录”按钮出现；
4. 添加一个目录，确认下一轮 prompt 出现、`write` 被拒；
5. 打开 `http://localhost:<port>` 和 `http://127.0.0.1:<port>` 各试一次，确认 UI 桥都能用；
6. `/ref list` 正常；
7. 卸载后 `ref_folders.json` 不再被使用。

这一步能暴露“本地 link 能用、npm 包缺文件”的问题。

## 5. 发布 GitHub 版本

1. 仓库根目录就是包根目录（`package.json` 在根）。
2. 推送到 GitHub，打 tag `v0.3.0`，创建 Release。
3. 用户可以用：

```text
plugin_manager
  action: install_bundle
  target: github:zhangletian5555/dsh-ref-folder
```

管理器会先做 `git ls-remote` 检查，再交给 pnpm。仓库不需要构建；客户端是纯 JS。

## 6. 关于 DeepSeek 官方插件市场

发布到 npm 或 GitHub **不会自动进入** DSH 的官方市场/on-demand 目录。官方目录是应用内置的官方条目；第三方包只能由用户通过安装 spec 手动安装。

如果想要官方下载渠道，需要走 DeepSeek 的收录/审核流程；在得到收录前，README 里应以 npm/GitHub 手动安装为准。

## 7. 版本与兼容

- 插件使用了 DSH 的 `webServer`、`storageDomain`、`tools.guard`、`systemPrompt.context` 和 Web composer slot；DSH 升级后优先回归这些点。
- `engines.dsh` 当前为 `^0.2.1-rc.2`；每次 DSH 大版本升级都重新测一次，必要时收紧或放宽。
- 客户端 bundle 有缓存：发布新版本后，用户通常需要重启 DSH 或按提示重载。

## 8. 回滚

- npm：72 小时内可 `npm unpublish dsh-ref-folder@<version>`；超过后用 `npm deprecate` 并发布修复版本。
- GitHub：回退 tag / Release，保留旧版本供用户安装。
- 若只是 UI 文案或桥接小问题，优先发 patch 版本，不要依赖用户手动改文件。

## 已知发布口径

- HTTP 桥没有额外认证，只适合同源本地使用；README 已写明。
- 引用目录在 `danger-full-access` 下不是强制的，shell/MCP/子代理可以绕过；这是产品边界，发布说明不要写成“绝对只读”。
