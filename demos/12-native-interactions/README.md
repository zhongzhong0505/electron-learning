# Demo 12: Native Interactions

原生交互综合演示：

- 文件拖放（Drag & Drop）
- 全局快捷键
- Deep Link（自定义协议 `myapp://`）
- 系统通知（Notification API）
- 右键菜单
- Shell 集成（打开外部链接、文件夹）

## 运行

```bash
npm install
npm run dev
```

## 核心知识点

- HTML5 Drag & Drop + Electron `file.path`
- `globalShortcut.register`
- `app.setAsDefaultProtocolClient`
- `Notification` API
- `shell.openExternal` / `shell.showItemInFolder`
- `Menu.popup` 上下文菜单
