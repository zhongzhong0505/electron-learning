# 第九章：Session 与网络请求拦截

## 9.1 Session 概述

`session` 模块管理浏览器会话、Cookie、缓存、代理等网络层面的功能。每个 `BrowserWindow` 可以使用默认 session 或独立 session。

### Session 的核心能力

| API | 用途 |
|-----|------|
| `session.defaultSession` | 获取默认会话 |
| `ses.cookies` | Cookie 的增删改查 |
| `ses.webRequest` | 拦截/修改 HTTP 请求和响应 |
| `ses.setProxy()` | 设置代理 |
| `ses.clearCache()` | 清除缓存 |
| `ses.clearStorageData()` | 清除 localStorage 等存储数据 |

## 9.2 Cookie 管理

```typescript
import { session } from 'electron'

const ses = session.defaultSession

// Get all cookies
const cookies = await ses.cookies.get({})

// Get cookies for a specific domain
const domainCookies = await ses.cookies.get({ domain: '.github.com' })

// Set a cookie
await ses.cookies.set({
  url: 'https://example.com',
  name: 'my-token',
  value: 'abc123',
  expirationDate: Math.floor(Date.now() / 1000) + 86400, // 1 day
})

// Remove a cookie
await ses.cookies.remove('https://example.com', 'my-token')

// Listen for cookie changes
ses.cookies.on('changed', (_event, cookie, cause, removed) => {
  console.log(`Cookie ${cookie.name} ${removed ? 'removed' : 'set'}: ${cause}`)
})
```

## 9.3 WebRequest 拦截器

`webRequest` 可以在请求生命周期的各个阶段进行拦截：

```
onBeforeRequest → onBeforeSendHeaders → onSendHeaders →
onHeadersReceived → onResponseStarted → onCompleted/onErrorOccurred
```

### 拦截并修改请求头

```typescript
// Add custom header to all requests
ses.webRequest.onBeforeSendHeaders((details, callback) => {
  details.requestHeaders['X-Custom-Header'] = 'my-value'
  callback({ requestHeaders: details.requestHeaders })
})
```

### 拦截响应头（如 CORS）

```typescript
// Remove CORS restrictions for development
ses.webRequest.onHeadersReceived((details, callback) => {
  const headers = { ...details.responseHeaders }
  headers['access-control-allow-origin'] = ['*']
  headers['access-control-allow-headers'] = ['*']
  callback({ responseHeaders: headers })
})
```

### 屏蔽特定 URL

```typescript
// Block tracking scripts
ses.webRequest.onBeforeRequest({ urls: ['*://*.analytics.com/*'] }, (details, callback) => {
  callback({ cancel: true })
})
```

## 9.4 代理设置

```typescript
// Set HTTP proxy
await ses.setProxy({ proxyRules: 'http://proxy.example.com:8080' })

// Set SOCKS5 proxy
await ses.setProxy({ proxyRules: 'socks5://127.0.0.1:1080' })

// Proxy with bypass rules
await ses.setProxy({
  proxyRules: 'http://proxy.example.com:8080',
  proxyBypassRules: 'localhost,127.0.0.1,*.internal.com',
})

// Remove proxy
await ses.setProxy({ proxyRules: '' })
```

## 9.5 缓存与存储管理

```typescript
// Clear HTTP cache
await ses.clearCache()

// Clear all storage data
await ses.clearStorageData()

// Clear specific types
await ses.clearStorageData({
  storages: ['cookies', 'localstorage', 'indexdb'],
})

// Get cache size
const cacheSize = await ses.getCacheSize()
console.log(`Cache size: ${(cacheSize / 1024 / 1024).toFixed(1)} MB`)
```

## 9.6 本章 Demo：网络请求监控

本章 Demo 演示了完整的 session 功能：

- 查看/管理 Cookie
- 实时拦截并显示所有网络请求
- 修改请求/响应头
- URL 过滤屏蔽
- 代理设置

→ 查看 Demo 代码：[demos/13-session-network/](../demos/13-session-network/)

## 9.7 本章小结

本章你学到了：
- Session 的概念和作用域
- Cookie 的完整 CRUD 操作
- webRequest 拦截器（拦截请求、修改头部、屏蔽 URL）
- 代理配置
- 缓存和存储数据管理

---

**上一章**：[第八章：实战项目 — Markdown 编辑器](./08-real-project.md)  
**下一章**：[第十章：自定义协议与安全存储](./19-protocol-storage.md)
