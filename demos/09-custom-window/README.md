# Demo 09: Custom Window

自定义无边框窗口，演示：

- Frameless window（`frame: false`）
- macOS `titleBarStyle: 'hiddenInset'`
- CSS `-webkit-app-region: drag` 拖拽区域
- 自定义窗口控制按钮（关闭/最小化/最大化）
- 平台适配（macOS traffic lights vs Windows/Linux buttons）

## 运行

```bash
npm install
npm run dev
```

## 核心知识点

- `BrowserWindow` 的 `frame`、`titleBarStyle`、`titleBarOverlay` 选项
- CSS drag region 实现窗口拖拽
- IPC 实现自定义窗口控制
- 平台检测与 UI 适配
