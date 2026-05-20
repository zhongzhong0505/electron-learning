# 附录I：系统通知/拖放/快捷键/Deep Link/自动更新/i18n

## I.1 系统通知

```typescript
import { Notification, nativeImage } from 'electron'

// Basic notification
function showNotification(title: string, body: string): void {
  new Notification({ title, body }).show()
}

// Rich notification
function showRichNotification(options: {
  title: string
  body: string
  icon?: string
  actions?: Array<{ type: 'button'; text: string }>
}): void {
  const notification = new Notification({
    title: options.title,
    body: options.body,
    icon: options.icon ? nativeImage.createFromPath(options.icon) : undefined,
    actions: options.actions,
  })

  notification.on('click', () => {
    // Show app window
    BrowserWindow.getAllWindows()[0]?.show()
  })

  notification.on('action', (_event, index) => {
    console.log('Action clicked:', index)
  })

  notification.show()
}
```

## I.2 拖放文件

### 接收文件拖放（渲染进程）

```typescript
// Renderer: Handle file drop
document.addEventListener('dragover', (e) => {
  e.preventDefault()
  e.stopPropagation()
})

document.addEventListener('drop', async (e) => {
  e.preventDefault()
  e.stopPropagation()

  const files = Array.from(e.dataTransfer?.files || [])
  for (const file of files) {
    console.log('Dropped file:', file.path) // Electron provides file.path
    const content = await window.electronAPI.readFile(file.path)
    // Process file content
  }
})
```

### 从应用拖出文件

```typescript
// Renderer: Start drag from app
element.addEventListener('dragstart', (e) => {
  e.preventDefault()
  window.electronAPI.startDrag(filePath)
})

// Preload
contextBridge.exposeInMainWorld('electronAPI', {
  startDrag: (filePath: string) => {
    ipcRenderer.send('ondragstart', filePath)
  },
})

// Main process
ipcMain.on('ondragstart', (event, filePath: string) => {
  event.sender.startDrag({
    file: filePath,
    icon: nativeImage.createFromPath('/path/to/icon.png'),
  })
})
```

## I.3 全局快捷键

```typescript
import { globalShortcut, BrowserWindow } from 'electron'

// Register after app is ready
app.whenReady().then(() => {
  // Toggle window visibility
  globalShortcut.register('CommandOrControl+Shift+Space', () => {
    const win = BrowserWindow.getAllWindows()[0]
    if (!win) return
    win.isVisible() ? win.hide() : win.show()
  })

  // Quick capture
  globalShortcut.register('CommandOrControl+Shift+C', () => {
    // Open quick capture window
  })
})

// Unregister on quit
app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})
```

## I.4 Deep Link（自定义协议）

```typescript
// Register protocol handler
if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient('myapp', process.execPath, [path.resolve(process.argv[1])])
  }
} else {
  app.setAsDefaultProtocolClient('myapp')
}

// Handle protocol URL on macOS
app.on('open-url', (event, url) => {
  event.preventDefault()
  handleDeepLink(url)
})

// Handle on Windows/Linux (single instance)
app.on('second-instance', (_event, argv) => {
  const url = argv.find((arg) => arg.startsWith('myapp://'))
  if (url) handleDeepLink(url)
})

function handleDeepLink(url: string): void {
  // Parse: myapp://open?file=/path/to/file
  const parsed = new URL(url)
  console.log('Deep link:', parsed.hostname, parsed.searchParams)
  
  const mainWindow = BrowserWindow.getAllWindows()[0]
  mainWindow?.webContents.send('deep-link', { host: parsed.hostname, params: Object.fromEntries(parsed.searchParams) })
}
```

## I.5 自动更新

```typescript
import { autoUpdater } from 'electron-updater'
import log from 'electron-log'

export function setupAutoUpdater(mainWindow: BrowserWindow): void {
  autoUpdater.logger = log
  autoUpdater.autoDownload = false

  autoUpdater.on('update-available', (info) => {
    mainWindow.webContents.send('update:available', info)
  })

  autoUpdater.on('download-progress', (progress) => {
    mainWindow.webContents.send('update:progress', progress)
  })

  autoUpdater.on('update-downloaded', (info) => {
    mainWindow.webContents.send('update:ready', info)
  })

  // Check every 4 hours
  setInterval(() => {
    autoUpdater.checkForUpdates()
  }, 4 * 60 * 60 * 1000)

  // Initial check
  autoUpdater.checkForUpdates()
}

// IPC handlers
ipcMain.handle('update:download', () => autoUpdater.downloadUpdate())
ipcMain.handle('update:install', () => autoUpdater.quitAndInstall())
```

## I.6 国际化（i18n）

```typescript
// src/main/i18n.ts
import path from 'path'
import fs from 'fs'
import { app } from 'electron'

class I18n {
  private translations: Record<string, Record<string, string>> = {}
  private currentLocale: string

  constructor() {
    this.currentLocale = app.getLocale().split('-')[0] || 'en'
    this.loadTranslations()
  }

  private loadTranslations(): void {
    const localesDir = path.join(__dirname, '../locales')
    const files = fs.readdirSync(localesDir)
    
    for (const file of files) {
      const locale = path.basename(file, '.json')
      const content = fs.readFileSync(path.join(localesDir, file), 'utf-8')
      this.translations[locale] = JSON.parse(content)
    }
  }

  t(key: string, params?: Record<string, string>): string {
    let text = this.translations[this.currentLocale]?.[key]
      || this.translations['en']?.[key]
      || key

    if (params) {
      for (const [k, v] of Object.entries(params)) {
        text = text.replace(`{${k}}`, v)
      }
    }

    return text
  }

  setLocale(locale: string): void {
    this.currentLocale = locale
  }

  getLocale(): string {
    return this.currentLocale
  }
}

export const i18n = new I18n()
```

```json
// locales/en.json
{
  "app.title": "My App",
  "file.new": "New File",
  "file.open": "Open",
  "file.save": "Save",
  "greeting": "Hello, {name}!"
}

// locales/zh.json
{
  "app.title": "我的应用",
  "file.new": "新建文件",
  "file.open": "打开",
  "file.save": "保存",
  "greeting": "你好，{name}！"
}
```
