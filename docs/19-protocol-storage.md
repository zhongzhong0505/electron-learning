# 第十章：自定义协议与安全存储

## 10.1 自定义协议（protocol）

`protocol` 模块允许注册自定义 URL scheme，用于安全加载本地资源或拦截标准协议。

### 注册自定义协议

```typescript
import { protocol, app } from 'electron'
import path from 'path'
import fs from 'fs'

// Must register scheme before app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true, supportFetchAPI: true } }
])

app.whenReady().then(() => {
  // Handle app:// URLs by serving local files
  protocol.handle('app', (request) => {
    const url = new URL(request.url)
    const filePath = path.join(__dirname, 'resources', url.pathname)
    return new Response(fs.readFileSync(filePath))
  })
})
```

### 拦截 file:// 协议

```typescript
protocol.handle('file', (request) => {
  const url = new URL(request.url)
  // Add security checks before serving files
  const allowed = url.pathname.startsWith('/safe/directory/')
  if (!allowed) {
    return new Response('Forbidden', { status: 403 })
  }
  return new Response(fs.readFileSync(url.pathname))
})
```

## 10.2 安全存储（safeStorage）

`safeStorage` 使用操作系统提供的加密机制（macOS Keychain, Windows DPAPI, Linux Secret Service）安全存储敏感数据。

```typescript
import { safeStorage } from 'electron'

// Check if encryption is available
if (safeStorage.isEncryptionAvailable()) {
  // Encrypt
  const encrypted = safeStorage.encryptString('my-secret-token')
  // encrypted is a Buffer, store it to file

  // Decrypt
  const decrypted = safeStorage.decryptString(encrypted)
  // decrypted === 'my-secret-token'
}
```

### 实际应用：安全存储 API Token

```typescript
import { safeStorage } from 'electron'
import fs from 'fs'
import path from 'path'

class SecureStore {
  private filePath: string

  constructor(filename: string) {
    this.filePath = path.join(app.getPath('userData'), filename)
  }

  set(key: string, value: string): void {
    const data = this.readAll()
    const encrypted = safeStorage.encryptString(value)
    data[key] = encrypted.toString('base64')
    fs.writeFileSync(this.filePath, JSON.stringify(data))
  }

  get(key: string): string | null {
    const data = this.readAll()
    if (!data[key]) return null
    const buffer = Buffer.from(data[key], 'base64')
    return safeStorage.decryptString(buffer)
  }

  delete(key: string): void {
    const data = this.readAll()
    delete data[key]
    fs.writeFileSync(this.filePath, JSON.stringify(data))
  }

  private readAll(): Record<string, string> {
    try {
      return JSON.parse(fs.readFileSync(this.filePath, 'utf-8'))
    } catch {
      return {}
    }
  }
}
```

## 10.3 本章 Demo

本章 Demo 演示了：
- 注册 `app://` 自定义协议加载本地资源
- 使用 safeStorage 加密存储敏感数据
- 安全存储的增删改查界面

→ 查看 Demo 代码：[demos/14-protocol-storage/](../demos/14-protocol-storage/)

---

**上一章**：[第九章：Session 与网络请求拦截](./18-session-network.md)  
**下一章**：[第十一章：屏幕与电源管理](./20-screen-power.md)
