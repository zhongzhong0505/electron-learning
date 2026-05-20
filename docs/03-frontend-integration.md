# 第三章：前端集成 — React + TypeScript

## 3.1 概述

Electron 的渲染进程本质就是一个 Chromium 浏览器窗口，因此可以使用任何前端框架。本教程统一使用 **React + TypeScript + Vite** 作为前端技术栈。

### 为什么选择 React + TypeScript + Vite？

- **类型安全**：TypeScript 确保 IPC API 调用的类型正确性
- **生态丰富**：React 拥有最大的组件库和工具链生态
- **开发体验**：Vite 提供极速 HMR，配合 Electron 开发效率极高
- **构建速度**：Vite 基于 esbuild，构建速度远超 webpack

## 3.2 项目结构（使用 Vite）

```
my-electron-app/
├── src/
│   ├── main/                    # Main process
│   │   ├── main.ts             # Entry point
│   │   └── preload.ts          # Preload script
│   └── renderer/                # Renderer process (React)
│       ├── src/
│       │   ├── main.tsx        # React entry
│       │   ├── App.tsx         # Root component
│       │   ├── components/     # Reusable components
│       │   │   ├── TodoItem.tsx
│       │   │   └── TodoFilter.tsx
│       │   ├── hooks/          # Custom hooks
│       │   │   └── useElectronAPI.ts
│       │   ├── types/          # TypeScript type definitions
│       │   │   └── electron.d.ts
│       │   └── styles/         # CSS files
│       │       └── global.css
│       ├── index.html          # HTML entry
│       └── vite.config.ts      # Vite configuration
├── package.json
├── tsconfig.json               # TypeScript config for main
├── tsconfig.renderer.json      # TypeScript config for renderer
└── electron-builder.json
```

## 3.3 使用 electron-vite 搭建项目

推荐使用 `electron-vite` 来整合 Electron + Vite + React：

```bash
# Create project with electron-vite
npm create @quick-start/electron@latest my-app -- --template react-ts

# Or manually set up
npm init -y
npm install electron --save-dev
npm install electron-vite vite react react-dom --save-dev
npm install @types/react @types/react-dom typescript --save-dev
```

### electron-vite 配置

```typescript
// electron.vite.config.ts
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
  },
  renderer: {
    plugins: [react()],
  },
})
```

## 3.4 IPC API 的 TypeScript 类型声明

### 定义完整的类型

```typescript
// src/renderer/src/types/electron.d.ts

interface Todo {
  id: number
  title: string
  completed: boolean
  createdAt: string
}

interface TodoStats {
  total: number
  completed: number
  active: number
}

// Define the API exposed by preload script
interface ElectronAPI {
  // Todo operations
  todoGetAll(): Promise<Todo[]>
  todoAdd(title: string): Promise<Todo>
  todoToggle(id: number): Promise<Todo>
  todoDelete(id: number): Promise<void>
  todoUpdate(id: number, title: string): Promise<Todo>
  todoClearCompleted(): Promise<void>
  todoGetStats(): Promise<TodoStats>

  // Event listeners
  onTodoUpdated(callback: (todos: Todo[]) => void): void
  removeAllListeners(channel: string): void
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}

export {}
```

### 预加载脚本实现

```typescript
// src/main/preload.ts
import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  // Todo operations
  todoGetAll: (): Promise<any[]> => ipcRenderer.invoke('todo:getAll'),
  todoAdd: (title: string) => ipcRenderer.invoke('todo:add', title),
  todoToggle: (id: number) => ipcRenderer.invoke('todo:toggle', id),
  todoDelete: (id: number) => ipcRenderer.invoke('todo:delete', id),
  todoUpdate: (id: number, title: string) => ipcRenderer.invoke('todo:update', id, title),
  todoClearCompleted: () => ipcRenderer.invoke('todo:clearCompleted'),
  todoGetStats: () => ipcRenderer.invoke('todo:getStats'),

  // Event listeners
  onTodoUpdated: (callback: (todos: any[]) => void) => {
    ipcRenderer.on('todo:updated', (_event, todos) => callback(todos))
  },
  removeAllListeners: (channel: string) => {
    ipcRenderer.removeAllListeners(channel)
  },
})
```

## 3.5 自定义 Hooks 封装

封装 Electron IPC 调用为 React Hooks：

```typescript
// src/renderer/src/hooks/useTodoService.ts
import { useState, useCallback, useEffect } from 'react'

interface Todo {
  id: number
  title: string
  completed: boolean
  createdAt: string
}

export function useTodoService() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchTodos = useCallback(async () => {
    setLoading(true)
    try {
      const result = await window.electronAPI.todoGetAll()
      setTodos(result || [])
      setError(null)
    } catch (err) {
      setError(String(err))
    } finally {
      setLoading(false)
    }
  }, [])

  const addTodo = useCallback(async (title: string) => {
    try {
      await window.electronAPI.todoAdd(title)
      await fetchTodos()
    } catch (err) {
      setError(String(err))
    }
  }, [fetchTodos])

  const toggleTodo = useCallback(async (id: number) => {
    try {
      await window.electronAPI.todoToggle(id)
      await fetchTodos()
    } catch (err) {
      setError(String(err))
    }
  }, [fetchTodos])

  const deleteTodo = useCallback(async (id: number) => {
    try {
      await window.electronAPI.todoDelete(id)
      await fetchTodos()
    } catch (err) {
      setError(String(err))
    }
  }, [fetchTodos])

  // Listen for real-time updates from main process
  useEffect(() => {
    window.electronAPI.onTodoUpdated((updatedTodos) => {
      setTodos(updatedTodos)
    })
    return () => {
      window.electronAPI.removeAllListeners('todo:updated')
    }
  }, [])

  // Initial fetch
  useEffect(() => {
    fetchTodos()
  }, [fetchTodos])

  return { todos, loading, error, addTodo, toggleTodo, deleteTodo, fetchTodos }
}
```

## 3.6 Vite 配置详解

```typescript
// vite.config.ts (renderer)
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  base: './',  // Important for Electron file:// protocol
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    // Ensure relative paths for Electron
    rollupOptions: {
      output: {
        format: 'es',
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
  },
})
```

### 开发模式 vs 生产模式加载

```typescript
// main.ts - Load renderer differently in dev vs production
function createWindow(): void {
  const mainWindow = new BrowserWindow({ /* ... */ })

  // In development: load from Vite dev server
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    // In production: load built files
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }
}
```

## 3.7 静态资源管理

### 资源目录约定

```
src/renderer/
├── public/               # Copied as-is to build output
│   ├── favicon.ico
│   └── logo.png
└── src/
    └── assets/           # Processed by Vite (hashed filenames)
        ├── icon.svg
        └── fonts/
            └── custom.woff2
```

### 在 React 中使用

```tsx
// Import processed assets (gets hashed filename)
import iconSvg from '@/assets/icon.svg'

function Logo() {
  return <img src={iconSvg} alt="Icon" />
}

// Reference public assets (direct path)
function AppIcon() {
  return <img src="./logo.png" alt="Logo" />
}
```

## 3.8 HMR 热重载开发流程

使用 electron-vite 的开发流程：

```bash
# Start development mode
npx electron-vite dev
```

开发模式下的工作流：

1. electron-vite 启动 Vite dev server（前端 HMR）
2. 主进程代码通过 esbuild 编译
3. Electron 窗口加载 `http://localhost:5173`
4. 修改前端代码 → Vite HMR 即时更新（无需重启）
5. 修改主进程代码 → 自动重启 Electron

## 3.9 本章 Demo：Todo App

本章 Demo 是一个完整的 Todo 应用，演示了：

- React + TypeScript + Vite 项目结构
- 完整的 IPC 类型声明
- 自定义 Hooks 封装 IPC 调用
- 状态管理与 UI 交互
- 类型安全的进程间通信
- 列表渲染、条件渲染、事件处理

→ 查看 Demo 代码：[demos/03-todo-app/](../demos/03-todo-app/)

## 3.10 本章小结

本章你学到了：
- React + TypeScript + Vite 在 Electron 中的项目结构
- 如何为 IPC API 声明完整 TypeScript 类型
- 自定义 Hooks 封装 IPC 调用
- electron-vite 配置与使用
- 开发模式 vs 生产模式的资源加载
- 静态资源管理
- HMR 热重载开发流程

---

**上一章**：[第二章：核心原理 — 进程架构与 IPC 通信](./02-architecture.md)  
**下一章**：[第四章：主进程开发 — Node.js 后端与数据](./04-backend-development.md)
