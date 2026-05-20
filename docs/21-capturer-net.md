# 第十二章：屏幕录制与网络模块

## 12.1 desktopCapturer — 屏幕截图与录制

`desktopCapturer` 模块用于获取可用的屏幕/窗口源，配合 Web API `getUserMedia` 实现截屏和录屏。

```typescript
import { desktopCapturer } from 'electron'

// Get available sources (screens and windows)
const sources = await desktopCapturer.getSources({
  types: ['screen', 'window'],
  thumbnailSize: { width: 320, height: 180 },
})

// Each source has:
// - id: source ID for getUserMedia
// - name: display/window name
// - thumbnail: NativeImage (preview)
// - display_id: associated display ID
```

### 在渲染进程中截屏

```typescript
// Main process: get sources
ipcMain.handle('capturer:getSources', async () => {
  const sources = await desktopCapturer.getSources({
    types: ['screen', 'window'],
    thumbnailSize: { width: 320, height: 180 },
  })
  return sources.map((s) => ({
    id: s.id,
    name: s.name,
    thumbnail: s.thumbnail.toDataURL(),
  }))
})

// Renderer: capture a source
async function captureSource(sourceId: string): Promise<string> {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: false,
    video: {
      mandatory: {
        chromeMediaSource: 'desktop',
        chromeMediaSourceId: sourceId,
      },
    } as any,
  })

  const video = document.createElement('video')
  video.srcObject = stream
  await video.play()

  const canvas = document.createElement('canvas')
  canvas.width = video.videoWidth
  canvas.height = video.videoHeight
  canvas.getContext('2d')!.drawImage(video, 0, 0)

  stream.getTracks().forEach((t) => t.stop())
  return canvas.toDataURL('image/png')
}
```

## 12.2 net 模块 — 主进程 HTTP 客户端

`net` 模块在主进程中发送 HTTP 请求，支持系统代理、自定义证书等。

```typescript
import { net } from 'electron'

// Simple GET request
const response = await net.fetch('https://api.example.com/data')
const json = await response.json()

// POST with body
const response = await net.fetch('https://api.example.com/submit', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ key: 'value' }),
})

// net.fetch respects system proxy settings automatically
// It also handles certificate validation correctly
```

### net vs fetch

| 特性 | `net.fetch` | Node.js `fetch` |
|------|------------|----------------|
| 系统代理 | ✅ 自动 | ❌ 需手动配置 |
| 证书验证 | 系统级 | Node.js 级 |
| Cookie | 共享 session | 独立 |
| 适用场景 | 需要代理/证书的请求 | 简单请求 |

## 12.3 本章 Demo

本章 Demo 演示了：
- 获取屏幕/窗口源列表（含缩略图）
- 截取指定屏幕/窗口的截图
- 使用 net.fetch 发送 HTTP 请求

→ 查看 Demo 代码：[demos/16-desktop-capturer/](../demos/16-desktop-capturer/)

---

**上一章**：[第十一章：屏幕与电源管理](./20-screen-power.md)
