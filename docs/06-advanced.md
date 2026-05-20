# 第六章：高级特性 — 进阶开发

## 6.1 复杂 IPC 通信模式

### 请求-响应 + 进度报告

```typescript
// Main process: Long-running task with progress
ipcMain.handle('task:start', async (event, taskName: string) => {
  const sender = event.sender
  const totalSteps = 100

  for (let i = 0; i <= totalSteps; i += 10) {
    await new Promise((resolve) => setTimeout(resolve, 500))
    
    // Report progress to renderer
    sender.send('task:progress', {
      taskName,
      progress: i,
      status: i < 100 ? 'running' : 'completed',
    })
  }

  return { taskName, result: 'Task completed successfully' }
})
```

```typescript
// Renderer: Listen for progress + await result
async function startTask(name: string) {
  // Listen for progress updates
  window.electronAPI.onTaskProgress((data) => {
    setProgress(data.progress)
    setStatus(data.status)
  })

  // Await final result
  const result = await window.electronAPI.startTask(name)
  console.log('Task done:', result)
}
```

### 发布-订阅模式（广播到所有窗口）

```typescript
// Main process: Broadcast to all renderer windows
function broadcastToAll(channel: string, data: any): void {
  const windows = BrowserWindow.getAllWindows()
  for (const window of windows) {
    if (!window.isDestroyed()) {
      window.webContents.send(channel, data)
    }
  }
}

// Usage: broadcast notification to all windows
ipcMain.on('broadcast:notification', (_event, message: string) => {
  broadcastToAll('notification:received', {
    message,
    timestamp: Date.now(),
  })
})
```

### 流式数据传输

```typescript
// Main process: Stream large file content
ipcMain.handle('file:readStream', async (event, filePath: string) => {
  const stream = fs.createReadStream(filePath, { encoding: 'utf-8', highWaterMark: 64 * 1024 })
  const sender = event.sender
  let chunkIndex = 0

  return new Promise((resolve, reject) => {
    stream.on('data', (chunk) => {
      sender.send('file:chunk', { index: chunkIndex++, data: chunk })
    })
    stream.on('end', () => {
      sender.send('file:complete', { totalChunks: chunkIndex })
      resolve({ totalChunks: chunkIndex })
    })
    stream.on('error', reject)
  })
})
```

## 6.2 进程间共享状态

### 使用主进程作为状态中心

```typescript
// src/main/services/state-service.ts
import { BrowserWindow } from 'electron'

class StateService {
  private state: Map<string, any> = new Map()
  private subscribers: Map<string, Set<BrowserWindow>> = new Map()

  get<T>(key: string): T | undefined {
    return this.state.get(key) as T
  }

  set(key: string, value: any): void {
    this.state.set(key, value)
    // Notify all subscribed windows
    this.notifySubscribers(key, value)
  }

  subscribe(key: string, window: BrowserWindow): void {
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set())
    }
    this.subscribers.get(key)!.add(window)

    // Clean up when window is closed
    window.on('closed', () => {
      this.subscribers.get(key)?.delete(window)
    })
  }

  private notifySubscribers(key: string, value: any): void {
    const windows = this.subscribers.get(key)
    if (windows) {
      for (const window of windows) {
        if (!window.isDestroyed()) {
          window.webContents.send('state:changed', { key, value })
        }
      }
    }
  }
}

export const stateService = new StateService()
```

## 6.3 性能优化

### 减少 IPC 调用次数

```typescript
// ❌ Bad: Multiple small calls
const name = await window.electronAPI.getUserName()
const email = await window.electronAPI.getUserEmail()
const avatar = await window.electronAPI.getUserAvatar()

// ✅ Good: Batch into single call
const profile = await window.electronAPI.getUserProfile()
// { name, email, avatar }
```

### 大数据传输优化

```typescript
// Main process: Pagination
ipcMain.handle('data:getPage', async (_event, page: number, pageSize: number) => {
  const offset = (page - 1) * pageSize
  const items = db.prepare('SELECT * FROM items LIMIT ? OFFSET ?').all(pageSize, offset)
  const total = db.prepare('SELECT COUNT(*) as count FROM items').get() as { count: number }

  return {
    items,
    total: total.count,
    page,
    pageSize,
    totalPages: Math.ceil(total.count / pageSize),
  }
})

// For binary data: Use ArrayBuffer for efficiency
ipcMain.handle('file:readBinary', async (_event, filePath: string) => {
  const buffer = await fs.readFile(filePath)
  return buffer.buffer // Transfer as ArrayBuffer (zero-copy in some cases)
})
```

### 避免主进程阻塞

```typescript
// ❌ Bad: Blocking main process
ipcMain.handle('compute:heavy', (_event, data) => {
  // This blocks the entire UI!
  return heavyComputation(data)
})

// ✅ Good: Use utility process for CPU-intensive work
import { utilityProcess } from 'electron'

const worker = utilityProcess.fork(path.join(__dirname, 'workers/compute.js'))

ipcMain.handle('compute:heavy', (event, data) => {
  return new Promise((resolve) => {
    worker.once('message', (result) => resolve(result))
    worker.postMessage(data)
  })
})
```

## 6.4 日志系统

### 使用 electron-log

```bash
npm install electron-log
```

```typescript
// src/main/logger.ts
import log from 'electron-log'

// Configure
log.transports.file.level = 'info'
log.transports.file.maxSize = 10 * 1024 * 1024 // 10MB
log.transports.console.level = 'debug'

// Custom format
log.transports.file.format = '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] {text}'

// Usage
log.info('Application started')
log.warn('Something might be wrong', { detail: 'info' })
log.error('An error occurred', new Error('Something failed'))

// Replace console in production
if (process.env.NODE_ENV === 'production') {
  Object.assign(console, log.functions)
}

export default log
```

### 渲染进程日志

```typescript
// Preload: expose log methods
contextBridge.exposeInMainWorld('log', {
  info: (...args: any[]) => ipcRenderer.send('log:info', ...args),
  warn: (...args: any[]) => ipcRenderer.send('log:warn', ...args),
  error: (...args: any[]) => ipcRenderer.send('log:error', ...args),
})

// Main process: handle renderer logs
ipcMain.on('log:info', (_event, ...args) => log.info('[Renderer]', ...args))
ipcMain.on('log:warn', (_event, ...args) => log.warn('[Renderer]', ...args))
ipcMain.on('log:error', (_event, ...args) => log.error('[Renderer]', ...args))
```

## 6.5 错误处理与崩溃报告

### 全局错误捕获

```typescript
// Main process: uncaught exceptions
process.on('uncaughtException', (error) => {
  log.error('Uncaught Exception:', error)
  dialog.showErrorBox('Unexpected Error', error.message)
})

process.on('unhandledRejection', (reason) => {
  log.error('Unhandled Rejection:', reason)
})

// Renderer crash detection
mainWindow.webContents.on('render-process-gone', (_event, details) => {
  log.error('Renderer process gone:', details)
  
  dialog.showMessageBox({
    type: 'error',
    title: 'Application Error',
    message: 'The application has encountered an error. Would you like to restart?',
    buttons: ['Restart', 'Quit'],
  }).then((result) => {
    if (result.response === 0) {
      app.relaunch()
    }
    app.quit()
  })
})
```

### crashReporter

```typescript
import { crashReporter } from 'electron'

crashReporter.start({
  productName: 'MyApp',
  submitURL: 'https://your-crash-server.com/submit',
  uploadToServer: true,
})
```

## 6.6 本章 Demo：系统监控面板

本章 Demo 是一个系统监控面板，演示了：

- 实时数据推送（CPU、内存使用率）
- 复杂 IPC 通信模式
- Utility Process 后台计算
- 性能优化技巧
- 日志系统集成

→ 查看 Demo 代码：[demos/06-system-monitor/](../demos/06-system-monitor/)

## 6.7 本章小结

本章你学到了：
- 复杂 IPC 通信模式（进度报告、广播、流式传输）
- 进程间共享状态管理
- 性能优化（减少 IPC、分页、避免主进程阻塞）
- electron-log 日志系统
- 全局错误捕获与崩溃报告

---

**上一章**：[第五章：系统能力 — 原生功能调用](./05-native-features.md)  
**下一章**：[第七章：构建与发布 — 打包部署](./07-build-and-deploy.md)
