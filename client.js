window.__ModuleLoader__.load({
  id: "dsh-ref-folder",
  factory(require) {
    const React = require("react");
    const h = React.createElement;
    const { useEffect, useRef, useState } = React;

    function FolderIcon({ size = 14 }) {
      return h("svg", {
        width: size, height: size, viewBox: "0 0 24 24", fill: "none",
        "aria-hidden": true, style: { flex: "0 0 auto" }
      },
      h("path", {
        d: "M3 7.5A2.5 2.5 0 0 1 5.5 5H9l2 2h7.5A2.5 2.5 0 0 1 21 9.5v7A2.5 2.5 0 0 1 18.5 19h-13A2.5 2.5 0 0 1 3 16.5v-9Z",
        stroke: "currentColor", strokeWidth: "1.6", strokeLinejoin: "round"
      }));
    }

    function ShieldIcon({ size = 12 }) {
      return h("svg", {
        width: size, height: size, viewBox: "0 0 24 24", fill: "none",
        "aria-hidden": true, style: { flex: "0 0 auto" }
      },
      h("path", {
        d: "M12 3.5 19 6v5.4c0 4.2-2.7 7.4-7 9.1-4.3-1.7-7-4.9-7-9.1V6l7-2.5Z",
        stroke: "currentColor", strokeWidth: "1.6", strokeLinejoin: "round"
      }),
      h("path", {
        d: "m9.2 12.1 1.9 1.9 3.8-3.8",
        stroke: "currentColor", strokeWidth: "1.6", strokeLinecap: "round", strokeLinejoin: "round"
      }));
    }

    function ChevronIcon({ size = 12 }) {
      return h("svg", {
        width: size, height: size, viewBox: "0 0 24 24", fill: "none",
        "aria-hidden": true, style: { flex: "0 0 auto" }
      },
      h("path", {
        d: "m7 9.5 5 5 5-5",
        stroke: "currentColor", strokeWidth: "1.7", strokeLinecap: "round", strokeLinejoin: "round"
      }));
    }

    function CloseIcon({ size = 14 }) {
      return h("svg", {
        width: size, height: size, viewBox: "0 0 24 24", fill: "none",
        "aria-hidden": true
      },
      h("path", {
        d: "m6 6 12 12M18 6 6 18",
        stroke: "currentColor", strokeWidth: "1.7", strokeLinecap: "round"
      }));
    }

    const triggerBase = {
      display: "inline-flex",
      alignItems: "center",
      gap: 4,
      minWidth: 0,
      maxWidth: 220,
      height: 28,
      padding: "0 4px 0 8px",
      border: "none",
      borderRadius: "var(--dsw-radius-sm)",
      background: "transparent",
      color: "var(--dsw-alias-label-secondary)",
      font: "inherit",
      fontSize: 13,
      fontWeight: 500,
      lineHeight: "20px",
      whiteSpace: "nowrap",
      cursor: "pointer",
      transition: "background-color 120ms ease"
    };

    const backdropStyle = {
      position: "fixed",
      inset: 0,
      zIndex: 2000,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
      background: "rgba(0, 0, 0, 0.6)"
    };

    const panelStyle = {
      width: 440,
      maxWidth: "calc(100vw - 32px)",
      maxHeight: "calc(100vh - 48px)",
      overflow: "auto",
      boxSizing: "border-box",
      padding: 18,
      border: "1px solid var(--dsw-alias-border-l1)",
      borderRadius: 14,
      background: "var(--dsw-alias-bg-layer-1)",
      boxShadow: "0 16px 48px rgba(0, 0, 0, 0.28)",
      color: "var(--dsw-alias-label-primary)",
      fontFamily: "inherit"
    };

    /**
     * A modal <dialog> uses the browser top layer, so the panel cannot be
     * clipped by an ancestor with transform/overflow. The native modal also
     * supplies Esc handling, focus containment, and inert background content.
     */
    const dialogStyle = {
      ...backdropStyle,
      width: "100vw",
      height: "100vh",
      maxWidth: "none",
      maxHeight: "none",
      margin: 0,
      border: "none",
      boxSizing: "border-box",
      color: "inherit",
      fontFamily: "inherit"
    };

    const iconButtonStyle = {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: 26,
      height: 26,
      padding: 0,
      border: "none",
      borderRadius: 6,
      background: "transparent",
      color: "var(--dsw-alias-label-secondary)",
      cursor: "pointer"
    };

    const fieldLabelStyle = {
      display: "block",
      margin: "12px 0 6px",
      color: "var(--dsw-alias-label-secondary)",
      fontSize: 12
    };

    const inputStyle = {
      width: "100%",
      boxSizing: "border-box",
      height: 34,
      padding: "0 10px",
      border: "1px solid var(--dsw-alias-border-l1)",
      borderRadius: 8,
      outline: "none",
      background: "var(--dsw-alias-bg-base)",
      color: "var(--dsw-alias-label-primary)",
      font: "inherit",
      fontSize: 13
    };

    const readonlyChipStyle = {
      display: "inline-flex",
      alignItems: "center",
      gap: 5,
      height: 22,
      padding: "0 8px",
      borderRadius: 6,
      background: "var(--dsw-alias-bg-layer-2)",
      color: "var(--dsw-alias-state-success-primary)",
      fontSize: 11,
      fontWeight: 600
    };

    const previewStyle = {
      margin: 0,
      maxHeight: 150,
      overflow: "auto",
      padding: 10,
      border: "1px solid var(--dsw-alias-border-l1)",
      borderRadius: 8,
      background: "var(--dsw-alias-bg-base)",
      color: "var(--dsw-alias-label-secondary)",
      fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
      fontSize: 11,
      lineHeight: 1.55,
      whiteSpace: "pre-wrap"
    };

    const footerStyle = {
      display: "flex",
      justifyContent: "flex-end",
      gap: 8,
      marginTop: 16
    };

    const ghostButtonStyle = {
      height: 30,
      padding: "0 12px",
      border: "1px solid var(--dsw-alias-border-l1)",
      borderRadius: 8,
      background: "transparent",
      color: "var(--dsw-alias-label-primary)",
      font: "inherit",
      fontSize: 12,
      cursor: "pointer"
    };

    const primaryButtonStyle = {
      height: 30,
      padding: "0 12px",
      border: "1px solid transparent",
      borderRadius: 8,
      background: "var(--dsw-alias-label-primary)",
      color: "var(--dsw-alias-bg-base)",
      font: "inherit",
      fontSize: 12,
      fontWeight: 600,
      cursor: "pointer"
    };

    function basename(value) {
      const text = String(value ?? "").replace(/[\\/]+$/u, "");
      const index = Math.max(text.lastIndexOf("/"), text.lastIndexOf("\\"));
      return index >= 0 ? text.slice(index + 1) : text;
    }

    function slugAlias(name) {
      // Keep this in sync with src/core.js; test/slug-vectors.js is shared.
      let value = String(name ?? "")
        .normalize("NFKD")
        .toLowerCase()
        .replace(/[^a-z0-9-_]+/gu, "-")
        .replace(/-+/gu, "-")
        .replace(/^[-_]+|[-_]+$/gu, "");
      if (value.length === 0) return "";
      if (!/^[a-z0-9]/u.test(value)) value = `ref-${value}`;
      value = value.slice(0, 32).replace(/[-_]+$/u, "");
      return /^[a-z0-9][a-z0-9-_]{0,31}$/u.test(value) ? value : "";
    }

    function messageOf(error) {
      if (error instanceof Error) return error.message;
      if (error !== null && typeof error === "object" && typeof error.message === "string") return error.message;
      return String(error);
    }

    async function post(body) {
      const response = await fetch("/ref-folder-api", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-ref-folder": "1"
        },
        body: JSON.stringify(body)
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || payload === null || payload.ok !== true) {
        const message = payload !== null && typeof payload.error === "string"
          ? payload.error
          : `HTTP ${response.status}`;
        throw new Error(message);
      }
      return payload.value;
    }

    function FolderRow({ folder, onEdit, onRemove }) {
      return h("div", {
        style: {
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "4px 6px",
          border: "1px solid var(--dsw-alias-border-l1)",
          borderRadius: 6,
          background: "var(--dsw-alias-bg-base)",
          fontSize: 11
        }
      },
      h("button", {
        type: "button",
        onClick: () => onEdit(folder),
        title: "编辑描述",
        style: {
          display: "flex",
          alignItems: "center",
          gap: 6,
          flex: 1,
          minWidth: 0,
          padding: 0,
          border: "none",
          background: "transparent",
          color: "var(--dsw-alias-label-secondary)",
          font: "inherit",
          fontSize: 11,
          textAlign: "left",
          cursor: "pointer"
        }
      },
      h("span", {
        style: { color: "var(--dsw-alias-label-primary)", fontWeight: 600, flex: "0 0 auto" }
      }, `[${folder.alias}]`),
      h("span", {
        style: {
          minWidth: 0,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap"
        }
      }, folder.path)),
      h("button", {
        type: "button",
        onClick: () => onRemove(folder),
        "aria-label": `移除 ${folder.alias}`,
        style: {
          flex: "0 0 auto",
          width: 20,
          height: 20,
          padding: 0,
          border: "none",
          borderRadius: 4,
          background: "transparent",
          color: "var(--dsw-alias-label-secondary)",
          font: "inherit",
          fontSize: 14,
          lineHeight: 1,
          cursor: "pointer"
        }
      }, "×"));
    }

    function RefFolderEntry({ sessionId, uiWorkspace }) {
      const [open, setOpen] = useState(false);
      const [hover, setHover] = useState(false);
      const [folders, setFolders] = useState([]);
      const [enforcement, setEnforcement] = useState(null);
      const [status, setStatus] = useState("idle");
      const [error, setError] = useState("");
      const [path, setPath] = useState("");
      const [alias, setAlias] = useState("");
      const [description, setDescription] = useState("");
      const [editing, setEditing] = useState(null);
      const [preview, setPreview] = useState("");
      const [busy, setBusy] = useState(false);
      const triggerRef = useRef(null);
      const dialogRef = useRef(null);
      const wasOpen = useRef(false);

      const call = (action, payload = {}) => post({ sessionId, action, ...payload });

      const resetForm = () => {
        setPath("");
        setAlias("");
        setDescription("");
        setEditing(null);
        setPreview("");
        setError("");
      };

      const closePanel = () => {
        setOpen(false);
        resetForm();
      };

      useEffect(() => {
        if (!open) {
          if (wasOpen.current) {
            wasOpen.current = false;
            triggerRef.current?.focus();
          }
          return;
        }
        wasOpen.current = true;
        const dialog = dialogRef.current;
        if (dialog !== null && !dialog.open) {
          if (typeof dialog.showModal === "function") dialog.showModal();
          else dialog.setAttribute("open", "");
        }
        return () => {
          if (dialog?.open) dialog.close();
        };
      }, [open]);

      const load = async () => {
        setStatus("loading");
        setError("");
        try {
          const next = await call("list");
          setFolders(next);
          setStatus("ready");
          try {
            setEnforcement(await call("enforcement"));
          } catch {
            setEnforcement(null);
          }
        } catch (failure) {
          setStatus("error");
          setError(messageOf(failure));
        }
      };

      useEffect(() => {
        if (!open) return;
        let active = true;
        setStatus("loading");
        setError("");
        (async () => {
          try {
            const next = await call("list");
            if (!active) return;
            setFolders(next);
            setStatus("ready");
            try {
              const level = await call("enforcement");
              if (active) setEnforcement(level);
            } catch {
              if (active) setEnforcement(null);
            }
          } catch (failure) {
            if (!active) return;
            setStatus("error");
            setError(messageOf(failure));
          }
        })();
        return () => {
          active = false;
        };
      }, [open, sessionId]);

      useEffect(() => {
        if (!open) return;
        const trimmed = path.trim();
        if (trimmed.length === 0) {
          setPreview("");
          return;
        }
        const previewAlias = alias.trim() || slugAlias(basename(trimmed)) || "alias";
        const handle = setTimeout(() => {
          call("preview", { input: { path: trimmed, alias: previewAlias, description } })
            .then((text) => setPreview(text))
            .catch(() => setPreview(""));
        }, 150);
        return () => clearTimeout(handle);
      }, [open, path, alias, description, sessionId]);

      const chooseDirectory = async () => {
        setError("");
        try {
          const selected = await uiWorkspace.pickDirectory();
          if (selected === null) return;
          setPath(selected);
          if (alias.trim().length === 0) setAlias(slugAlias(basename(selected)));
          if (editing !== null) setEditing(null);
        } catch (failure) {
          setError(messageOf(failure));
        }
      };

      const startEdit = (folder) => {
        setEditing(folder.alias);
        setPath(folder.path);
        setAlias(folder.alias);
        setDescription(folder.description);
        setError("");
      };

      const submit = async () => {
        if (busy) return;
        setBusy(true);
        setError("");
        try {
          if (editing !== null) {
            await call("update", { alias: editing, patch: { description } });
          } else {
            if (path.trim().length === 0) throw new Error("请选择要引用的目录");
            await call("add", {
              input: {
                path: path.trim(),
                alias: alias.trim() || undefined,
                description
              }
            });
          }
          closePanel();
        } catch (failure) {
          setError(messageOf(failure));
        } finally {
          setBusy(false);
        }
      };

      const remove = async (folder) => {
        if (busy) return;
        setBusy(true);
        setError("");
        try {
          await call("remove", { alias: folder.alias });
          if (editing === folder.alias) resetForm();
          await load();
        } catch (failure) {
          setError(messageOf(failure));
        } finally {
          setBusy(false);
        }
      };

      const countText = status === "loading"
        ? "正在加载…"
        : folders.length === 0
          ? "还没有引用目录"
          : `已引用 ${folders.length} 个目录`;

      return h(React.Fragment, null,
        h("button", {
          ref: triggerRef,
          type: "button",
          title: "引用目录",
          onClick: () => {
            resetForm();
            setOpen(true);
          },
          onMouseEnter: () => setHover(true),
          onMouseLeave: () => setHover(false),
          style: {
            ...triggerBase,
            background: hover ? "var(--dsw-alias-interactive-bg-hover)" : "transparent"
          }
        },
        h(FolderIcon),
        h("span", null, "引用目录"),
        h("span", { style: { display: "inline-flex", color: "var(--dsw-alias-label-caption)" } }, h(ChevronIcon))),

        open
          ? h("dialog", {
              ref: dialogRef,
              style: dialogStyle,
              "aria-label": "只读参考目录",
              onCancel: (event) => {
                event.preventDefault();
                closePanel();
              },
              onKeyDown: (event) => {
                if (event.key === "Escape") {
                  event.preventDefault();
                  closePanel();
                }
              },
              onClose: () => {
                if (open) {
                  setOpen(false);
                  resetForm();
                }
              },
              onMouseDown: (event) => {
                if (event.target === event.currentTarget) closePanel();
              }
            },
            h("div", {
              style: panelStyle,
              onMouseDown: (event) => event.stopPropagation()
            },
            h("div", { style: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 14 } },
              h("div", null,
                h("div", { style: { fontSize: 16, fontWeight: 600 } }, "只读参考目录"),
                h("div", { style: { marginTop: 4, color: "var(--dsw-alias-label-secondary)", fontSize: 12, lineHeight: 1.5 } },
                  "会话级只读引用；模型可以读取，但不能改写。")),
              h("button", { type: "button", onClick: closePanel, style: iconButtonStyle, "aria-label": "关闭" }, h(CloseIcon))),

            h("div", { style: { marginBottom: 8, color: "var(--dsw-alias-label-secondary)", fontSize: 12 } }, countText),
            enforcement !== null
              ? h("div", {
                  style: {
                    marginBottom: 10,
                    color: enforcement.level === "advisory"
                      ? "var(--dsw-alias-state-warn-primary)"
                      : "var(--dsw-alias-label-secondary)",
                    fontSize: 11
                  }
                }, enforcement.level === "advisory"
                  ? `${enforcement.mode} · 仅 write/edit 有路径拦截，其他工具仍可能写入`
                  : `${enforcement.mode} · 沙箱写入边界生效`)
              : null,
            error.length > 0
              ? h("div", {
                  style: {
                    marginBottom: 10,
                    color: "var(--dsw-alias-state-error-primary)",
                    fontSize: 12,
                    lineHeight: 1.5
                  }
                }, error)
              : null,

            folders.length > 0
              ? h("div", { style: { display: "flex", flexDirection: "column", gap: 6, marginBottom: 10 } },
                  folders.map((folder) => h(FolderRow, {
                    key: folder.id,
                    folder,
                    onEdit: startEdit,
                    onRemove: remove
                  })))
              : null,

            h("label", { style: fieldLabelStyle }, "目录"),
            h("div", { style: { display: "flex", gap: 6 } },
              h("input", {
                value: path,
                onChange: (event) => setPath(event.target.value),
                style: { ...inputStyle, flex: 1 },
                placeholder: "D:\\path\\to\\folder",
                disabled: editing !== null
              }),
              h("button", {
                type: "button",
                onClick: chooseDirectory,
                style: { ...ghostButtonStyle, flex: "0 0 auto" },
                disabled: editing !== null || busy
              }, "选择")),

            h("label", { style: fieldLabelStyle }, "别名"),
            h("input", {
              value: alias,
              onChange: (event) => setAlias(event.target.value),
              style: inputStyle,
              placeholder: "留空自动生成",
              disabled: editing !== null
            }),
            h("div", { style: { marginTop: 4, color: "var(--dsw-alias-label-secondary)", fontSize: 11 } },
              "小写字母、数字、-、_；会话内唯一"),

            h("label", { style: fieldLabelStyle }, "描述"),
            h("input", {
              value: description,
              onChange: (event) => setDescription(event.target.value),
              style: inputStyle,
              placeholder: "留空使用默认说明"
            }),

            h("div", { style: { display: "flex", alignItems: "center", gap: 8, marginTop: 12 } },
              h("span", { style: readonlyChipStyle }, h(ShieldIcon), "只读"),
              h("span", { style: { color: "var(--dsw-alias-label-secondary)", fontSize: 11 } },
                "只读标记固定开启，不可关闭")),

            h("div", { style: { margin: "14px 0 6px", color: "var(--dsw-alias-label-secondary)", fontSize: 12 } }, "注入预览"),
            h("pre", { style: previewStyle }, preview.length > 0
              ? preview
              : path.trim().length > 0 ? "正在生成预览…" : "选择目录后显示注入预览"),

            h("div", { style: footerStyle },
              editing !== null
                ? h("button", {
                    type: "button",
                    onClick: () => {
                      setEditing(null);
                      resetForm();
                    },
                    style: ghostButtonStyle
                  }, "取消编辑")
                : null,
              h("button", { type: "button", onClick: closePanel, style: ghostButtonStyle }, "取消"),
              h("button", {
                type: "button",
                onClick: submit,
                style: primaryButtonStyle,
                disabled: busy
              }, editing !== null ? "保存描述" : "添加"))))
          : null);
    }

    return {
      inject: ["slots", "uiWorkspace"],
      apply(ctx) {
        const uiWorkspace = ctx.uiWorkspace;
        ctx.slots.inject("conversation.input.left", () => ctx.slots.register({
          name: "conversation.input.left",
          id: "ref-folder",
          order: 5
        }, (props) => h(RefFolderEntry, { ...props, uiWorkspace })));
      }
    };
  }
});
