# 第四章：主进程开发 — Node.js 后端与数据

## 4.1 主进程服务设计模式

在 Electron 中，主进程承担"后端"角色。推荐将业务逻辑组织为独立的 Service 类，通过 IPC handler 暴露给渲染进程。

### Service 设计原则

1. **单一职责**：每个 Service 负责一个领域（如 NoteService、FileService）
2. **生命周期管理**：Service 随应用启动/关闭进行初始化/清理
3. **IPC 解耦**：Service 本身不依赖 IPC，通过外部注册 handler
4. **错误处理**：统一使用 try-catch，将错误信息传递给渲染进程

### Service 基础模式

```typescript
// src/main/services/base-service.ts
export abstract class BaseService {
  abstract init(): Promise<void>
  abstract destroy(): Promise<void>
}

// src/main/services/note-service.ts
import { BaseService } from './base-service'
import Database from 'better-sqlite3'
import path from 'path'
import { app } from 'electron'

export interface Note {
  id: number
  title: string
  content: string
  createdAt: string
  updatedAt: string
}

export class NoteService extends BaseService {
  private db!: Database.Database

  async init(): Promise<void> {
    const dbPath = path.join(app.getPath('userData'), 'notes.db')
    this.db = new Database(dbPath)
    
    // Create table if not exists
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS notes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        content TEXT DEFAULT '',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)
  }

  async destroy(): Promise<void> {
    this.db?.close()
  }

  getAll(): Note[] {
    const stmt = this.db.prepare(
      'SELECT id, title, content, created_at as createdAt, updated_at as updatedAt FROM notes ORDER BY updated_at DESC'
    )
    return stmt.all() as Note[]
  }

  getById(id: number): Note | undefined {
    const stmt = this.db.prepare(
      'SELECT id, title, content, created_at as createdAt, updated_at as updatedAt FROM notes WHERE id = ?'
    )
    return stmt.get(id) as Note | undefined
  }

  create(title: string, content: string = ''): Note {
    const stmt = this.db.prepare(
      'INSERT INTO notes (title, content) VALUES (?, ?)'
    )
    const result = stmt.run(title, content)
    return this.getById(Number(result.lastInsertRowid))!
  }

  update(id: number, title: string, content: string): Note {
    const stmt = this.db.prepare(
      'UPDATE notes SET title = ?, content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    )
    stmt.run(title, content, id)
    return this.getById(id)!
  }

  delete(id: number): void {
    const stmt = this.db.prepare('DELETE FROM notes WHERE id = ?')
    stmt.run(id)
  }
}
```

### 注册 IPC Handlers

```typescript
// src/main/ipc/note-handlers.ts
import { ipcMain } from 'electron'
import { NoteService } from '../services/note-service'

export function registerNoteHandlers(noteService: NoteService): void {
  ipcMain.handle('note:getAll', async () => {
    return noteService.getAll()
  })

  ipcMain.handle('note:getById', async (_event, id: number) => {
    const note = noteService.getById(id)
    if (!note) {
      throw new Error(`Note with id ${id} not found`)
    }
    return note
  })

  ipcMain.handle('note:create', async (_event, title: string, content: string) => {
    if (!title.trim()) {
      throw new Error('Title cannot be empty')
    }
    return noteService.create(title, content)
  })

  ipcMain.handle('note:update', async (_event, id: number, title: string, content: string) => {
    return noteService.update(id, title, content)
  })

  ipcMain.handle('note:delete', async (_event, id: number) => {
    noteService.delete(id)
  })
}
```

### 在主进程启动时初始化

```typescript
// src/main/main.ts
import { app, BrowserWindow } from 'electron'
import { NoteService } from './services/note-service'
import { registerNoteHandlers } from './ipc/note-handlers'

let noteService: NoteService

app.whenReady().then(async () => {
  // Initialize services
  noteService = new NoteService()
  await noteService.init()

  // Register IPC handlers
  registerNoteHandlers(noteService)

  // Create window
  createWindow()
})

app.on('before-quit', async () => {
  await noteService.destroy()
})
```

## 4.2 数据库集成（better-sqlite3）

### 为什么选择 better-sqlite3？

| 特性 | better-sqlite3 | sqlite3(node) |
|------|---------------|---------------|
| 同步 API | ✅ | ❌（异步回调） |
| 性能 | 极高 | 较慢 |
| 简单性 | 非常简单 | 较复杂 |
| Electron 兼容 | 需要 rebuild | 需要 rebuild |

### 安装与 Electron rebuild

```bash
# Install
npm install better-sqlite3
npm install @types/better-sqlite3 --save-dev

# Rebuild for Electron (important!)
npx electron-rebuild -f -w better-sqlite3
```

### 完整 CRUD 示例

```typescript
import Database from 'better-sqlite3'

const db = new Database('./app.db')

// Enable WAL mode for better concurrent performance
db.pragma('journal_mode = WAL')

// Create
const insert = db.prepare('INSERT INTO notes (title, content) VALUES (?, ?)')
const result = insert.run('My Note', 'Content here')
console.log(result.lastInsertRowid) // New record ID

// Read
const getAll = db.prepare('SELECT * FROM notes ORDER BY updated_at DESC')
const notes = getAll.all()

// Update
const update = db.prepare('UPDATE notes SET title = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
update.run('Updated Title', 1)

// Delete
const remove = db.prepare('DELETE FROM notes WHERE id = ?')
remove.run(1)

// Transaction (for batch operations)
const insertMany = db.transaction((notes: Array<{title: string, content: string}>) => {
  for (const note of notes) {
    insert.run(note.title, note.content)
  }
})
insertMany([
  { title: 'Note 1', content: 'Content 1' },
  { title: 'Note 2', content: 'Content 2' },
])
```

## 4.3 文件系统操作

```typescript
// src/main/services/file-service.ts
import fs from 'fs/promises'
import path from 'path'
import { app } from 'electron'

export class FileService extends BaseService {
  private baseDir: string

  constructor() {
    super()
    this.baseDir = path.join(app.getPath('userData'), 'files')
  }

  async init(): Promise<void> {
    await fs.mkdir(this.baseDir, { recursive: true })
  }

  async destroy(): Promise<void> {}

  async readFile(filename: string): Promise<string> {
    const filePath = path.join(this.baseDir, path.basename(filename))
    return fs.readFile(filePath, 'utf-8')
  }

  async writeFile(filename: string, content: string): Promise<void> {
    const filePath = path.join(this.baseDir, path.basename(filename))
    await fs.writeFile(filePath, content, 'utf-8')
  }

  async listFiles(): Promise<string[]> {
    const entries = await fs.readdir(this.baseDir, { withFileTypes: true })
    return entries
      .filter((entry) => entry.isFile())
      .map((entry) => entry.name)
  }

  async deleteFile(filename: string): Promise<void> {
    const filePath = path.join(this.baseDir, path.basename(filename))
    await fs.unlink(filePath)
  }

  async fileExists(filename: string): Promise<boolean> {
    const filePath = path.join(this.baseDir, path.basename(filename))
    try {
      await fs.access(filePath)
      return true
    } catch {
      return false
    }
  }
}
```

## 4.4 Electron Store（持久化配置）

使用 `electron-store` 进行简单的键值存储：

```bash
npm install electron-store
```

```typescript
// src/main/services/config-service.ts
import Store from 'electron-store'

interface AppConfig {
  theme: 'light' | 'dark'
  fontSize: number
  autoSave: boolean
  lastOpenedFile: string | null
  windowBounds: { x: number; y: number; width: number; height: number }
}

export class ConfigService {
  private store: Store<AppConfig>

  constructor() {
    this.store = new Store<AppConfig>({
      defaults: {
        theme: 'light',
        fontSize: 14,
        autoSave: true,
        lastOpenedFile: null,
        windowBounds: { x: 100, y: 100, width: 1024, height: 768 },
      },
    })
  }

  get<K extends keyof AppConfig>(key: K): AppConfig[K] {
    return this.store.get(key)
  }

  set<K extends keyof AppConfig>(key: K, value: AppConfig[K]): void {
    this.store.set(key, value)
  }

  getAll(): AppConfig {
    return this.store.store
  }
}
```

## 4.5 后台任务与 Worker

### 使用 Utility Process（Electron 28+）

```typescript
// src/main/workers/heavy-task.ts (utility process)
process.parentPort?.on('message', async (event) => {
  const { type, data } = event.data

  switch (type) {
    case 'compute': {
      // Heavy computation that won't block main process
      const result = performHeavyComputation(data)
      process.parentPort?.postMessage({ type: 'result', data: result })
      break
    }
  }
})

function performHeavyComputation(data: any): any {
  // CPU-intensive work...
  return processedData
}
```

```typescript
// src/main/main.ts - Spawn utility process
import { utilityProcess } from 'electron'
import path from 'path'

const worker = utilityProcess.fork(
  path.join(__dirname, 'workers/heavy-task.js')
)

worker.on('message', (msg) => {
  console.log('Worker result:', msg)
  // Forward to renderer if needed
  mainWindow.webContents.send('computation-result', msg.data)
})

// Send task to worker
worker.postMessage({ type: 'compute', data: largeDataSet })
```

### 使用定时器推送数据

```typescript
// Periodically push data to renderer
class MonitorService {
  private intervalId: NodeJS.Timeout | null = null
  private mainWindow: BrowserWindow | null = null

  start(window: BrowserWindow): void {
    this.mainWindow = window
    this.intervalId = setInterval(() => {
      const metrics = this.collectMetrics()
      this.mainWindow?.webContents.send('metrics-update', metrics)
    }, 1000)
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
  }

  private collectMetrics() {
    const memUsage = process.memoryUsage()
    return {
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal,
      uptime: process.uptime(),
      timestamp: Date.now(),
    }
  }
}
```

## 4.6 错误处理策略

### 主进程错误处理

```typescript
// Unified error handling for IPC handlers
function createHandler<T>(
  handler: (...args: any[]) => T | Promise<T>
) {
  return async (_event: Electron.IpcMainInvokeEvent, ...args: any[]): Promise<T> => {
    try {
      return await handler(...args)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      console.error(`[IPC Error] ${message}`, error)
      throw new Error(message) // Re-throw for renderer to catch
    }
  }
}

// Usage
ipcMain.handle('note:getById', createHandler((id: number) => {
  const note = noteService.getById(id)
  if (!note) throw new Error(`Note with id ${id} not found`)
  return note
}))
```

### 渲染进程错误处理

```typescript
// React hook with error handling
async function safeInvoke<T>(fn: () => Promise<T>): Promise<[T, null] | [null, string]> {
  try {
    const result = await fn()
    return [result, null]
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return [null, message]
  }
}

// Usage in component
const [note, error] = await safeInvoke(() => window.electronAPI.noteGetById(id))
if (error) {
  showToast({ type: 'error', message: error })
}
```

## 4.7 本章 Demo：笔记本应用

本章 Demo 是一个完整的笔记本应用，演示了：

- better-sqlite3 数据库集成
- 完整的 CRUD 操作
- Service 模式组织代码
- 文件系统读写
- electron-store 配置持久化
- 统一错误处理

→ 查看 Demo 代码：[demos/04-notebook/](../demos/04-notebook/)

## 4.8 本章小结

本章你学到了：
- Service 设计模式和生命周期管理
- better-sqlite3 数据库集成与 CRUD
- 文件系统操作（fs/promises）
- electron-store 配置持久化
- Utility Process 后台任务
- 定时器数据推送
- 前后端统一错误处理策略

---

**上一章**：[第三章：前端集成 — React + TypeScript](./03-frontend-integration.md)  
**下一章**：[第五章：系统能力 — 原生功能调用](./05-native-features.md)
