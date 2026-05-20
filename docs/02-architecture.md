
# 第二章：核心原理 — 进程架构与 IPC 通信

## 2.1 整体架构

Electron 采用多进程架构设计，核心分为主进程（Main Process）和渲染进程（Renderer Process）：

```
┌─────────────────────────────────────────────────────┐
│                 Electron Application                  │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌──────────────────┐    ┌────────────────────────┐ │
│  │  Main Process    │    │  Renderer Process(es)  │ │
│  │  (Node.js)       │    │  (Chromium)            │ │
│  │                  │    │                        │ │
│  │  • App Lifecycle │◄──►│  • UI (HTML/CSS)       │ │
│  │  • Window Mgmt   │    │  • JS/TS Logic         │ │
│  │  • System Access  │    │  • Framework           │ │
│  │  • Native Menus  │    │    (React/Vue)         │ │
│  │  • File I/O      │    │  • Web APIs            │ │
│  │  • IPC Handlers  │    │                        │ │
│  └──────────────────┘    └────────────────────────┘ │
│           │                        │                 │
│           ▼                        ▼                 │
│  ┌──────────────────────────────────────────────┐   │
│  │            Preload Script                     │   │
│  │  (contextBridge + ipcRenderer)               │   │
│  │  Secure bridge between Main & Renderer       │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │            Chromium + Node.js Runtime         │   │
│  │  • V8 JavaScript Engine                      │   │
│  │  • Blink Rendering Engine                    │   │
│  │  • libuv Event Loop                          │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
└─────────────────────────────────────────────────────┘
```

### 核心组件

1. **Main Process（主进程）** — 应用的大脑，管理生命周期、创建窗口、处理系统级操作
2. **Renderer Process（渲染进程）** — 每个窗口一个进程，负责 UI 渲染
3. **Preload Script（预加载脚本）** — 安全桥梁，在渲染进程上下文中运行但可访问部分 Node.js API
4. **IPC（进程间通信）** — 主进程与渲染进程之间的消息通道
5. **Utility Process（工具进程）** — Electron 28+ 新增，用于 CPU 密集型任务

### 进程模型图

```
┌─────────────────────────────────────────┐
│           Main Process (1个)             │
│  ┌─────┐  ┌─────┐  ┌─────┐            │
│  │Win 1│  │Win 2│  │Win N│  ...        │
│  └──┬──┘  └──┬──┘  └──┬──┘            │
└─────┼────────┼────────┼────────────────┘
      │        │        │
      ▼        ▼        ▼
┌─────────┐ ┌─────────┐ ┌─────────┐
│Renderer │ │Renderer │ │Renderer │
│Process 1│ │Process 2│ │Process N│
└─────────┘ └─────────┘ └─────────┘
```

## 2.2 应用生命周期

```
app.whenReady()
       │
       ▼
   ready event        // App is ready, create windows
       │
       ├── createWindow()
       │
       ├── activate (macOS)  // Dock icon clicked
       │
       ├── Running...        // Application running (event loop)
       │
       ├── window-all-closed // All windows closed
       │       │
       │       ├── (macOS) stay running
       │       └── (others) app.quit()
       │
       ├── before-quit       // About to quit
       │
       ▼
   will-quit / quit          // Application exits
```

### 生命周期事件

```typescript
import { app, BrowserWindow } from 'electron'

// App is ready - create windows here
app.whenReady().then(() => {
  console.log('App is ready!')
  createWindow()
})

// All windows closed
app.on('window-all-closed', () => {
  // On macOS, apps typically stay active until Cmd+Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// macOS: dock icon clicked with no windows open
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

// About to quit
app.on('before-quit', () => {
  console.log('App is about to quit')
  // Cleanup resources
})

// Second instance detection (single instance lock)
const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', (_event, argv) => {
    // Focus existing window when second instance is launched
    const mainWindow = BrowserWindow.getAllWindows()[0]
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })
}
```

## 2.3 IPC 通信机制（核心）

Electron 的进程间通信（IPC）是最核心的概念。现代 Electron 推荐使用 **contextBridge + ipcRenderer.invoke** 模式。

### 通信模式概览

| 模式 | 方向 | API | 用途 |
|------|------|-----|------|
| invoke/handle | Renderer → Main | `ipcRenderer.invoke` / `ipcMain.handle` | 请求-响应（推荐） |
| send/on | Renderer → Main | `ipcRenderer.send` / `ipcMain.on` | 单向消息 |
| send (to renderer) | Main → Renderer | `webContents.send` | 主动推送 |

### 模式一：invoke/handle（推荐）

这是最常用的模式，类似于 RPC 调用：

```
┌─────────────┐         ┌──────────────────┐         ┌─────────────┐
│  Renderer   │  ──►    │  Preload Script  │  ──►    │    Main     │
│  (invoke)   │         │  (contextBridge) │         │  (handle)   │
│             │  ◄──    │                  │  ◄──    │  (return)   │
│  Promise    │         │                  │         │             │
└─────────────┘         └──────────────────┘         └─────────────┘
```

**主进程（注册 handler）**：

```typescript
import { ipcMain } from 'electron'

// Handle async request from renderer
ipcMain.handle('read-file', async (_event, filePath: string) => {
  const fs = await import('fs/promises')
  const content = await fs.readFile(filePath, 'utf-8')
  return content
})

// Handle with error
ipcMain.handle('divide', async (_event, a: number, b: number) => {
  if (b === 0) {
    throw new Error('Cannot divide by zero')
  }
  return a / b
})
```

**预加载脚本（暴露 API）**：

```typescript
import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  readFile: (filePath: string): Promise<string> => {
    return ipcRenderer.invoke('read-file', filePath)
  },
  divide: (a: number, b: number): Promise<number> => {
    return ipcRenderer.invoke('divide', a, b)
  },
})
```

**渲染进程（调用）**：

```typescript
// Call main process - returns Promise
const content = await window.electronAPI.readFile('/path/to/file')

// Error handling
try {
  const result = await window.electronAPI.divide(10, 0)
} catch (error) {
  console.error(error.message) // "Cannot divide by zero"
}
```

### 模式二：send/on（单向消息）

适用于不需要返回值的场景：

**渲染进程 → 主进程**：

```typescript
// Preload
contextBridge.exposeInMainWorld('electronAPI', {
  sendNotification: (title: string, body: string) => {
    ipcRenderer.send('show-notification', title, body)
  },
})

// Main process
ipcMain.on('show-notification', (_event, title: string, body: string) => {
  new Notification({ title, body }).show()
})
```

### 模式三：主进程主动推送

主进程向渲染进程发送消息（如实时数据推送）：

**主进程**：

```typescript
// Send to specific window
mainWindow.webContents.send('data-updated', { cpu: 45.2, memory: 67.8 })

// Periodically push data
setInterval(() => {
  const data = getSystemMetrics()
  mainWindow.webContents.send('system-metrics', data)
}, 1000)
```

**预加载脚本**：

```typescript
contextBridge.exposeInMainWorld('electronAPI', {
  onDataUpdated: (callback: (data: any) => void) => {
    ipcRenderer.on('data-updated', (_event, data) => callback(data))
  },
  onSystemMetrics: (callback: (data: any) => void) => {
    ipcRenderer.on('system-metrics', (_event, data) => callback(data))
  },
  // Important: provide cleanup method
  removeAllListeners: (channel: string) => {
    ipcRenderer.removeAllListeners(channel)
  },
})
```

**渲染进程**：

```typescript
// Listen for pushes from main process
window.electronAPI.onSystemMetrics((data) => {
  console.log('CPU:', data.cpu, 'Memory:', data.memory)
  updateUI(data)
})
```

## 2.4 Context Isolation 与安全模型

### 为什么需要 Context Isolation？

```
                    WITHOUT Context Isolation (危险!)
┌──────────────────────────────────────────────────────┐
│  Renderer Process                                     │
│  ┌─────────────────────────────────────────────────┐ │
│  │  Same JavaScript Context                         │ │
│  │  • Web page code (potentially unsafe)           │ │
│  │  • Node.js APIs (full system access!)           │ │
│  │  ⚠️ XSS attack = full system compromise         │ │
│  └─────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────┘

                    WITH Context Isolation (安全!)
┌──────────────────────────────────────────────────────┐
│  Renderer Process                                     │
│  ┌────────────────────┐  ┌───────────────────────┐  │
│  │  Main World        │  │  Isolated World       │  │
│  │  (Web page code)   │  │  (Preload script)     │  │
│  │                    │  │                       │  │
│  │  Only sees what    │  │  Has access to        │  │
│  │  contextBridge     │  │  ipcRenderer,         │  │
│  │  exposes           │  │  contextBridge        │  │
│  └────────────────────┘  └───────────────────────┘  │
│           │                        │                  │
│           └──── contextBridge ─────┘                  │
│                 (controlled API surface)               │
└──────────────────────────────────────────────────────┘
```

### 安全配置要点

```typescript
const mainWindow = new BrowserWindow({
  webPreferences: {
    // ✅ MUST: Enable context isolation
    contextIsolation: true,
    
    // ✅ MUST: Disable node integration in renderer
    nodeIntegration: false,
    
    // ✅ MUST: Use preload script for IPC
    preload: path.join(__dirname, 'preload.js'),
    
    // ✅ RECOMMENDED: Disable remote module
    enableRemoteModule: false,
    
    // ✅ RECOMMENDED: Enable sandbox
    sandbox: true,
  },
})
```

## 2.5 窗口系统

Electron 原生支持多窗口：

```typescript
import { BrowserWindow } from 'electron'

// Create main window
const mainWindow = new BrowserWindow({
  width: 1024,
  height: 768,
  title: 'Main Window',
  webPreferences: {
    preload: path.join(__dirname, 'preload.js'),
    contextIsolation: true,
    nodeIntegration: false,
  },
})
mainWindow.loadFile('index.html')

// Create secondary window
const settingsWindow = new BrowserWindow({
  width: 600,
  height: 400,
  title: 'Settings',
  parent: mainWindow,    // Optional: make it a child window
  modal: false,
  show: false,           // Start hidden
  webPreferences: {
    preload: path.join(__dirname, 'preload.js'),
    contextIsolation: true,
    nodeIntegration: false,
  },
})
settingsWindow.loadFile('settings.html')

// Show/hide windows programmatically
settingsWindow.show()
settingsWindow.hide()

// Window events
mainWindow.on('close', (event) => {
  // Prevent close, hide instead
  event.preventDefault()
  mainWindow.hide()
})

mainWindow.on('closed', () => {
  // Window is destroyed, clean up references
})
```

## 2.6 数据类型与序列化

IPC 通信中的数据会经过结构化克隆算法（Structured Clone Algorithm）序列化：

| 支持的类型 | 说明 |
|-----------|------|
| `string`, `number`, `boolean` | 基本类型 |
| `null`, `undefined` | 空值 |
| `Array`, `Object` | 数组和对象 |
| `Date` | 日期 |
| `ArrayBuffer`, `TypedArray` | 二进制数据 |
| `Map`, `Set` | 集合类型 |
| `Error` | 错误对象 |

| 不支持的类型 | 替代方案 |
|-------------|---------|
| `Function` | 不能传递函数 |
| `DOM 元素` | 序列化为数据再传递 |
| `Symbol` | 使用字符串替代 |
| 类实例（自定义 class） | 转换为普通对象 |

## 2.7 本章 Demo：IPC 通信演练

本章 Demo 演示了 IPC 通信的完整用法。

→ 查看 Demo 代码：[demos/02-ipc-events/](../demos/02-ipc-events/)

### Demo 功能

1. invoke/handle 请求-响应调用
2. 带参数和返回值的 IPC 调用
3. 错误处理
4. 主进程主动推送事件
5. 实时数据流（定时器 + webContents.send）

## 2.8 本章小结

本章你学到了：
- Electron 的多进程架构设计
- 主进程与渲染进程的职责划分
- 应用生命周期和事件
- IPC 通信三种模式（invoke/handle、send/on、主动推送）
- Context Isolation 安全模型
- preload 脚本和 contextBridge 的作用
- 多窗口管理
- IPC 数据序列化规则

---

**上一章**：[第一章：认识 Electron](./01-getting-started.md)  
**下一章**：[第三章：前端集成 — React + TypeScript](./03-frontend-integration.md)
