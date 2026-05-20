# 附录G：日志系统完整方案

## G.1 日志需求分析

桌面应用日志系统需要：
- 分级输出（debug/info/warn/error）
- 文件持久化（用户反馈问题时可提交日志）
- 控制台输出（开发调试）
- 日志轮转（避免文件无限增长）
- 渲染进程日志收集

## G.2 使用 electron-log

```bash
npm install electron-log
```

### 完整配置

```typescript
// src/main/logger.ts
import log from 'electron-log'
import path from 'path'
import { app } from 'electron'

// File transport
log.transports.file.level = 'info'
log.transports.file.maxSize = 10 * 1024 * 1024 // 10MB
log.transports.file.format = '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] [{processType}] {text}'
log.transports.file.resolvePathFn = () => {
  return path.join(app.getPath('logs'), 'app.log')
}

// Console transport
log.transports.console.level = process.env.NODE_ENV === 'development' ? 'debug' : 'warn'
log.transports.console.format = '{h}:{i}:{s} [{level}] {text}'

// Error handler
log.errorHandler.startCatching({
  showDialog: false,
  onError: ({ error }) => {
    log.error('Uncaught error:', error)
  },
})

export default log
```

### 主进程使用

```typescript
import log from './logger'

log.info('Application started', { version: app.getVersion() })
log.debug('Debug info', { detail: 'something' })
log.warn('Warning message')
log.error('Error occurred', new Error('Something failed'))
```

### 渲染进程日志收集

```typescript
// Preload
contextBridge.exposeInMainWorld('log', {
  debug: (...args: any[]) => ipcRenderer.send('log', 'debug', ...args),
  info: (...args: any[]) => ipcRenderer.send('log', 'info', ...args),
  warn: (...args: any[]) => ipcRenderer.send('log', 'warn', ...args),
  error: (...args: any[]) => ipcRenderer.send('log', 'error', ...args),
})

// Main
ipcMain.on('log', (_event, level: string, ...args: any[]) => {
  (log as any)[level]('[Renderer]', ...args)
})
```

## G.3 日志文件位置

```typescript
// Get log file path
const logPath = log.transports.file.getFile().path
console.log('Log file:', logPath)

// Expose to renderer for "Open Log File" feature
ipcMain.handle('log:getPath', () => {
  return log.transports.file.getFile().path
})

ipcMain.handle('log:openFolder', () => {
  const logDir = path.dirname(log.transports.file.getFile().path)
  shell.openPath(logDir)
})
```

## G.4 结构化日志

```typescript
// Custom structured logging
function createLogger(module: string) {
  return {
    info: (msg: string, meta?: object) => log.info(`[${module}] ${msg}`, meta),
    warn: (msg: string, meta?: object) => log.warn(`[${module}] ${msg}`, meta),
    error: (msg: string, error?: Error, meta?: object) => {
      log.error(`[${module}] ${msg}`, { error: error?.message, stack: error?.stack, ...meta })
    },
  }
}

// Usage
const logger = createLogger('NoteService')
logger.info('Note created', { id: 1, title: 'My Note' })
logger.error('Failed to save', error, { noteId: 1 })
```
