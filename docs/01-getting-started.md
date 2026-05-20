
# 第一章：认识 Electron — 入门与环境搭建

## 1.1 什么是 Electron？

Electron 是一个使用 JavaScript、HTML 和 CSS 构建跨平台桌面应用的框架。它由 GitHub 开发并维护，将 Chromium 渲染引擎和 Node.js 运行时结合在一起，让 Web 开发者可以用熟悉的技术栈开发原生桌面应用。

### 核心理念

- **Web 技术**：使用 HTML/CSS/JS 构建 UI，前端开发者无缝上手
- **Node.js 能力**：主进程可以访问完整的 Node.js API 和 npm 生态
- **跨平台**：一次编写，打包为 macOS、Windows、Linux 三端应用
- **原生能力**：通过 Electron API 访问系统功能（菜单、托盘、通知等）

### 与 Wails 的对比

| 特性 | Electron | Wails v3 |
|------|----------|----------|
| 应用体积 | ~150MB+ | ~8MB |
| 内存占用 | ~100MB+ | ~30MB |
| 启动速度 | 较慢 | 极快 |
| 后端语言 | Node.js | Go |
| 渲染引擎 | Chromium（自带） | 系统 WebView |
| 跨平台一致性 | 极高（自带渲染引擎） | 依赖系统 WebView |
| npm 生态 | 完整支持 | 不支持 |
| 社区和成熟度 | 非常成熟 | 较新 |
| 知名应用 | VS Code, Slack, Discord | — |

### Electron 的优势

1. **一致性**：Chromium 内核确保在所有平台上渲染表现完全一致
2. **生态丰富**：npm 百万级包可直接使用
3. **DevTools**：内置 Chrome DevTools，调试体验极佳
4. **社区成熟**：大量开源项目和最佳实践参考
5. **企业级应用**：VS Code、Slack、Discord、Notion 等成功案例

## 1.2 环境准备

### 安装 Node.js

```bash
# macOS (Homebrew)
brew install node

# Or use nvm (recommended for version management)
nvm install 20
nvm use 20

# Verify
node --version
# Expected: v20.x.x

npm --version
# Expected: 10.x.x
```

### 安装开发工具

```bash
# TypeScript (global, optional)
npm install -g typescript

# Verify
tsc --version
# Expected: Version 5.x.x
```

### macOS 额外依赖

macOS 上需要 Xcode Command Line Tools（用于 native 模块编译）：

```bash
xcode-select --install
```

## 1.3 创建第一个项目

### 手动创建

```bash
# Create project directory
mkdir hello-world && cd hello-world

# Initialize npm project
npm init -y

# Install Electron
npm install electron --save-dev

# Install TypeScript and build tools
npm install typescript @types/node --save-dev
```

### 项目结构解析

```
hello-world/
├── src/
│   ├── main/                # Main process (Node.js)
│   │   ├── main.ts          # Application entry point
│   │   └── preload.ts       # Preload script (bridge)
│   └── renderer/            # Renderer process (Web)
│       ├── index.html       # HTML entry
│       ├── renderer.ts      # Frontend logic
│       └── style.css        # Styles
├── package.json             # Project configuration
├── tsconfig.json            # TypeScript configuration
└── electron-builder.json    # Build configuration (optional)
```

### 关键文件说明

**package.json** — 项目配置：

```json
{
  "name": "hello-world",
  "version": "1.0.0",
  "description": "My first Electron app",
  "main": "dist/main/main.js",
  "scripts": {
    "build": "tsc",
    "dev": "tsc && electron .",
    "start": "electron ."
  },
  "devDependencies": {
    "electron": "^33.0.0",
    "typescript": "^5.5.0",
    "@types/node": "^20.0.0"
  }
}
```

**src/main/main.ts** — 主进程入口：

```typescript
import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'path'

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,   // Security: isolate renderer context
      nodeIntegration: false,   // Security: disable Node in renderer
    },
  })

  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
}

// App lifecycle
app.whenReady().then(() => {
  createWindow()

  // macOS: re-create window when dock icon is clicked
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

// Quit when all windows are closed (except macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// IPC handler example
ipcMain.handle('greet', async (_event, name: string) => {
  return `Hello ${name}, welcome to Electron!`
})
```

**src/main/preload.ts** — 预加载脚本（安全桥梁）：

```typescript
import { contextBridge, ipcRenderer } from 'electron'

// Expose protected methods to renderer process via contextBridge
contextBridge.exposeInMainWorld('electronAPI', {
  greet: (name: string): Promise<string> => {
    return ipcRenderer.invoke('greet', name)
  },
})
```

**src/renderer/index.html** — 前端页面：

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Security-Policy" 
        content="default-src 'self'; script-src 'self'" />
  <title>Hello World - Electron</title>
  <link rel="stylesheet" href="style.css" />
</head>
<body>
  <h1>Hello Electron!</h1>
  <div>
    <input id="name-input" type="text" placeholder="Enter your name" />
    <button id="greet-btn">Greet</button>
  </div>
  <p id="greeting"></p>
  <script src="renderer.js"></script>
</body>
</html>
```

**src/renderer/renderer.ts** — 渲染进程逻辑：

```typescript
// Type declaration for exposed API
declare global {
  interface Window {
    electronAPI: {
      greet(name: string): Promise<string>
    }
  }
}

const nameInput = document.getElementById('name-input') as HTMLInputElement
const greetBtn = document.getElementById('greet-btn') as HTMLButtonElement
const greetingEl = document.getElementById('greeting') as HTMLParagraphElement

greetBtn.addEventListener('click', async () => {
  const name = nameInput.value || 'World'
  const greeting = await window.electronAPI.greet(name)
  greetingEl.textContent = greeting
})

export {}
```

## 1.4 开发模式

### npm run dev

开发模式提供：
- TypeScript 编译
- 快速启动 Electron 窗口
- 内置 Chrome DevTools
- 主进程 Console 日志输出到终端

```bash
# Start dev mode
npm run dev

# With auto-reload (using electron-reload or similar)
npm install electron-reload --save-dev
```

### 调试技巧

1. **渲染进程调试**：`Ctrl+Shift+I`（Windows/Linux）或 `Cmd+Option+I`（macOS）打开 DevTools
2. **主进程调试**：使用 VS Code 的 Node.js 调试器，或 `--inspect` 标志
3. **日志输出**：主进程的 `console.log` 输出到终端，渲染进程的输出在 DevTools Console

```bash
# Start with debugger attached
electron --inspect=5858 .
```

### VS Code 调试配置

```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Main Process",
      "type": "node",
      "request": "launch",
      "cwd": "${workspaceFolder}",
      "runtimeExecutable": "${workspaceFolder}/node_modules/.bin/electron",
      "args": ["."],
      "sourceMaps": true,
      "outFiles": ["${workspaceFolder}/dist/**/*.js"]
    }
  ]
}
```

## 1.5 构建生产版本

```bash
# Install electron-builder
npm install electron-builder --save-dev

# Build for current platform
npx electron-builder

# The output will be in dist/ directory
```

## 1.6 本章小结

本章你学到了：
- Electron 的核心理念和优势
- Electron 与 Wails 的区别和适用场景
- 环境搭建和工具安装
- 创建并运行第一个 Electron 项目
- 项目结构和关键文件的作用（主进程、预加载脚本、渲染进程）
- 开发模式和调试方法

---

**下一章**：[第二章：核心原理 — 进程架构与 IPC 通信](./02-architecture.md)
