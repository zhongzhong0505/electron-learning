# 附录A：调试技巧与常见问题排查（FAQ）

> 本文档整理了 Electron 开发中常见的问题和解决方案。

## A.1 开发环境问题

### 问题：`electron` 命令找不到

**原因**：Electron 未正确安装或 PATH 未配置。

**解决方案**：

```bash
# Reinstall
npm install electron --save-dev

# Use npx
npx electron .

# Or use node_modules/.bin
./node_modules/.bin/electron .
```

---

### 问题：native 模块编译失败

**原因**：native 模块需要针对 Electron 的 Node.js 版本重新编译。

**解决方案**：

```bash
# Install electron-rebuild
npm install @electron/rebuild --save-dev

# Rebuild all native modules
npx electron-rebuild

# Or rebuild specific module
npx electron-rebuild -f -w better-sqlite3
```

---

### 问题：macOS 上 `App can't be opened because it is from an unidentified developer`

**原因**：应用未签名。

**解决方案（开发阶段）**：

```bash
# Remove quarantine attribute
xattr -cr /path/to/MyApp.app
```

---

### 问题：白屏（加载页面失败）

**原因**：文件路径错误或 CSP 阻止了脚本加载。

**解决方案**：

```typescript
// Check the path
console.log('Loading:', path.join(__dirname, '../renderer/index.html'))

// Ensure correct CSP
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; script-src 'self'" />
```

## A.2 调试技巧

### 主进程调试

```bash
# Start with inspector
electron --inspect=5858 .

# Or break at first line
electron --inspect-brk=5858 .
```

VS Code launch.json：

```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Main",
  "runtimeExecutable": "${workspaceFolder}/node_modules/.bin/electron",
  "args": ["."],
  "sourceMaps": true,
  "outFiles": ["${workspaceFolder}/dist/**/*.js"]
}
```

### 渲染进程调试

```typescript
// Open DevTools programmatically
mainWindow.webContents.openDevTools({ mode: 'detach' })

// Only in development
if (process.env.NODE_ENV === 'development') {
  mainWindow.webContents.openDevTools()
}
```

### IPC 调试

```typescript
// Log all IPC messages in main process
const { ipcMain } = require('electron')

// Debug: log all incoming IPC calls
const originalHandle = ipcMain.handle.bind(ipcMain)
ipcMain.handle = (channel: string, handler: any) => {
  return originalHandle(channel, async (event: any, ...args: any[]) => {
    console.log(`[IPC] ${channel}`, args)
    const result = await handler(event, ...args)
    console.log(`[IPC] ${channel} →`, result)
    return result
  })
}
```

## A.3 常见运行时错误

### `contextBridge` API 限制

```typescript
// ❌ Cannot expose functions that return non-cloneable values
contextBridge.exposeInMainWorld('api', {
  getWindow: () => remote.getCurrentWindow(), // Not cloneable!
})

// ✅ Expose simple data and IPC calls
contextBridge.exposeInMainWorld('api', {
  minimize: () => ipcRenderer.send('window:minimize'),
})
```

### 内存泄漏

```typescript
// ❌ Not cleaning up listeners
useEffect(() => {
  window.electronAPI.onUpdate((data) => setData(data))
  // Missing cleanup!
}, [])

// ✅ Always cleanup
useEffect(() => {
  window.electronAPI.onUpdate((data) => setData(data))
  return () => {
    window.electronAPI.removeAllListeners('update')
  }
}, [])
```

## A.4 性能诊断

```typescript
// Monitor renderer performance
mainWindow.webContents.on('console-message', (_event, level, message) => {
  if (level === 2) { // Warning
    console.warn('[Renderer]', message)
  }
})

// Check memory usage
setInterval(() => {
  const usage = process.memoryUsage()
  console.log('Memory:', {
    rss: `${(usage.rss / 1024 / 1024).toFixed(1)}MB`,
    heap: `${(usage.heapUsed / 1024 / 1024).toFixed(1)}MB`,
  })
}, 30000)
```
