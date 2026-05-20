# 附录D：安全性最佳实践

## D.1 Electron 安全模型

Electron 应用面临独特的安全挑战：它同时运行 Web 内容和拥有完整系统权限的 Node.js 代码。安全配置不当可能导致远程代码执行（RCE）。

## D.2 必须遵守的安全规则

### 规则 1：启用 Context Isolation

```typescript
// ✅ ALWAYS
new BrowserWindow({
  webPreferences: {
    contextIsolation: true,
    nodeIntegration: false,
    sandbox: true,
  },
})
```

### 规则 2：使用 contextBridge 暴露最小 API

```typescript
// ❌ Bad: 暴露太多权限
contextBridge.exposeInMainWorld('api', {
  exec: (cmd: string) => require('child_process').execSync(cmd),
  readFile: (path: string) => require('fs').readFileSync(path),
})

// ✅ Good: 只暴露必要的、经过验证的操作
contextBridge.exposeInMainWorld('api', {
  loadNote: (id: number) => ipcRenderer.invoke('note:load', id),
  saveNote: (id: number, content: string) => ipcRenderer.invoke('note:save', id, content),
})
```

### 规则 3：验证 IPC 输入

```typescript
// Main process: Always validate inputs
ipcMain.handle('file:read', async (_event, filePath: string) => {
  // Validate: prevent path traversal
  const resolved = path.resolve(filePath)
  const allowed = path.resolve(app.getPath('userData'))
  
  if (!resolved.startsWith(allowed)) {
    throw new Error('Access denied: path outside allowed directory')
  }
  
  return fs.readFile(resolved, 'utf-8')
})
```

### 规则 4：设置 Content Security Policy

```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self'; 
               style-src 'self' 'unsafe-inline';
               img-src 'self' data:;
               font-src 'self';" />
```

### 规则 5：不要加载远程内容（除非必要）

```typescript
// ❌ Dangerous: Loading untrusted remote content
mainWindow.loadURL('https://some-external-site.com')

// ✅ Safe: Load local files
mainWindow.loadFile(path.join(__dirname, 'index.html'))

// If you must load remote content, use session permissions
session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
  const allowedPermissions = ['clipboard-read', 'notifications']
  callback(allowedPermissions.includes(permission))
})
```

### 规则 6：禁用不必要的功能

```typescript
new BrowserWindow({
  webPreferences: {
    nodeIntegration: false,
    contextIsolation: true,
    sandbox: true,
    enableRemoteModule: false,
    allowRunningInsecureContent: false,
    webSecurity: true,
  },
})
```

## D.3 安全检查清单

- [ ] `contextIsolation: true`
- [ ] `nodeIntegration: false`
- [ ] `sandbox: true`（如果可能）
- [ ] CSP header 已配置
- [ ] IPC handler 验证所有输入
- [ ] 文件路径操作有边界检查
- [ ] 不加载不信任的远程内容
- [ ] 禁用了 `allowRunningInsecureContent`
- [ ] 使用最新版本的 Electron
