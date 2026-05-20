# 附录C：跨平台适配指南

## C.1 平台差异概览

| 特性 | macOS | Windows | Linux |
|------|-------|---------|-------|
| 窗口关闭行为 | 隐藏到 Dock | 退出应用 | 退出应用 |
| 应用菜单 | 顶部菜单栏 | 窗口内菜单 | 窗口内菜单 |
| 系统托盘 | 菜单栏图标 | 通知区域 | 系统托盘 |
| 原生主题 | Aqua | Win32/WinUI | GTK/Qt |
| 文件路径分隔符 | `/` | `\` | `/` |
| 快捷键修饰符 | Cmd | Ctrl | Ctrl |

## C.2 平台检测

```typescript
// Main process
const isMac = process.platform === 'darwin'
const isWindows = process.platform === 'win32'
const isLinux = process.platform === 'linux'

// Renderer process (via preload)
contextBridge.exposeInMainWorld('platform', {
  isMac: process.platform === 'darwin',
  isWindows: process.platform === 'win32',
  isLinux: process.platform === 'linux',
  platform: process.platform,
})
```

## C.3 窗口行为适配

```typescript
// macOS: hide instead of quit on window close
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// macOS: re-create window on dock click
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

// Window title bar
const windowOptions: BrowserWindowConstructorOptions = {
  ...(process.platform === 'darwin' ? {
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 15, y: 10 },
  } : {
    // Windows/Linux: custom title bar or default
  }),
}
```

## C.4 菜单适配

```typescript
// macOS has app-level menu, others have window-level
const template: MenuItemConstructorOptions[] = [
  ...(isMac ? [{
    label: app.name,
    submenu: [
      { role: 'about' as const },
      { type: 'separator' as const },
      { role: 'quit' as const },
    ],
  }] : []),
  // ... other menus
]
```

## C.5 路径处理

```typescript
import path from 'path'

// Always use path.join for cross-platform paths
const configPath = path.join(app.getPath('userData'), 'config.json')

// Platform-specific directories
const appData = app.getPath('appData')     // ~/Library/App Support (mac), %APPDATA% (win)
const userData = app.getPath('userData')   // appData + app name
const home = app.getPath('home')           // ~ (mac/linux), %USERPROFILE% (win)
const temp = app.getPath('temp')           // OS temp directory
```

## C.6 快捷键适配

```typescript
// Use 'CmdOrCtrl' for cross-platform shortcuts
const accelerator = 'CmdOrCtrl+S' // Cmd+S on Mac, Ctrl+S on Win/Linux

// Platform-specific shortcuts
const shortcuts = {
  save: process.platform === 'darwin' ? 'Cmd+S' : 'Ctrl+S',
  preferences: process.platform === 'darwin' ? 'Cmd+,' : 'Ctrl+,',
  quit: process.platform === 'darwin' ? 'Cmd+Q' : 'Alt+F4',
}
```

## C.7 外观适配

```typescript
import { nativeTheme } from 'electron'

// Detect system theme
const isDark = nativeTheme.shouldUseDarkColors

// Listen for theme changes
nativeTheme.on('updated', () => {
  const isDark = nativeTheme.shouldUseDarkColors
  mainWindow.webContents.send('theme:changed', isDark ? 'dark' : 'light')
})
```

```css
/* CSS: respect system preference */
@media (prefers-color-scheme: dark) {
  :root {
    --bg-primary: #1e1e1e;
    --text-primary: #d4d4d4;
  }
}
```
