# Demo 05: File Manager

简易文件管理器，演示 Electron 原生系统能力：

- 文件选择/保存对话框（dialog API）
- 应用菜单（Menu）和快捷键
- 右键上下文菜单
- 系统托盘（Tray）
- 文件/目录读写
- 剪贴板操作

## 运行

```bash
npm install
npm run dev
```

## 核心知识点

- `dialog.showOpenDialog` / `dialog.showSaveDialog`
- `Menu.buildFromTemplate`
- `Tray` 系统托盘
- `globalShortcut` 全局快捷键
- `clipboard` 剪贴板 API
