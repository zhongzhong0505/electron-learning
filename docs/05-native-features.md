# 第五章：系统能力 — 原生功能调用

## 5.1 对话框（Dialogs）

Electron 提供了丰富的原生对话框 API：

### 文件选择对话框

```typescript
import { dialog, BrowserWindow } from 'electron'

// Open file dialog
ipcMain.handle('dialog:openFile', async (event) => {
  const window = BrowserWindow.fromWebContents(event.sender)!
  
  const result = await dialog.showOpenDialog(window, {
    title: 'Select a file',
    filters: [
      { name: 'Text Files', extensions: ['txt', 'md'] },
      { name: 'All Files', extensions: ['*'] },
    ],
    properties: ['openFile'],
  })

  if (result.canceled) return null
  return result.filePaths[0]
})

// Open multiple files
ipcMain.handle('dialog:openMultipleFiles', async (event) => {
  const window = BrowserWindow.fromWebContents(event.sender)!
  
  const result = await dialog.showOpenDialog(window, {
    title: 'Select files',
    filters: [
      { name: 'Images', extensions: ['png', 'jpg', 'gif', 'webp'] },
    ],
    properties: ['openFile', 'multiSelections'],
  })

  if (result.canceled) return []
  return result.filePaths
})

// Open directory
ipcMain.handle('dialog:openDirectory', async (event) => {
  const window = BrowserWindow.fromWebContents(event.sender)!
  
  const result = await dialog.showOpenDialog(window, {
    title: 'Select a folder',
    properties: ['openDirectory', 'createDirectory'],
  })

  if (result.canceled) return null
  return result.filePaths[0]
})
```

### 保存文件对话框

```typescript
ipcMain.handle('dialog:saveFile', async (event, defaultName: string) => {
  const window = BrowserWindow.fromWebContents(event.sender)!
  
  const result = await dialog.showSaveDialog(window, {
    title: 'Save file',
    defaultPath: defaultName,
    filters: [
      { name: 'Text Files', extensions: ['txt'] },
      { name: 'Markdown', extensions: ['md'] },
    ],
  })

  if (result.canceled) return null
  return result.filePath
})
```

### 消息对话框

```typescript
import { dialog } from 'electron'

// Information dialog
ipcMain.handle('dialog:info', async (event, title: string, message: string) => {
  const window = BrowserWindow.fromWebContents(event.sender)!
  await dialog.showMessageBox(window, {
    type: 'info',
    title,
    message,
    buttons: ['OK'],
  })
})

// Confirm dialog
ipcMain.handle('dialog:confirm', async (event, title: string, message: string) => {
  const window = BrowserWindow.fromWebContents(event.sender)!
  const result = await dialog.showMessageBox(window, {
    type: 'question',
    title,
    message,
    buttons: ['Cancel', 'Confirm'],
    defaultId: 0,
    cancelId: 0,
  })
  return result.response === 1 // true if "Confirm" was clicked
})

// Error dialog
ipcMain.handle('dialog:error', async (event, title: string, message: string) => {
  const window = BrowserWindow.fromWebContents(event.sender)!
  await dialog.showMessageBox(window, {
    type: 'error',
    title,
    message,
    buttons: ['OK'],
  })
})
```

## 5.2 菜单系统

### 应用菜单

```typescript
import { Menu, app, BrowserWindow } from 'electron'

function createApplicationMenu(mainWindow: BrowserWindow): void {
  const template: Electron.MenuItemConstructorOptions[] = [
    // macOS app menu
    ...(process.platform === 'darwin' ? [{
      label: app.name,
      submenu: [
        { role: 'about' as const },
        { type: 'separator' as const },
        { role: 'services' as const },
        { type: 'separator' as const },
        { role: 'hide' as const },
        { role: 'hideOthers' as const },
        { role: 'unhide' as const },
        { type: 'separator' as const },
        { role: 'quit' as const },
      ],
    }] : []),

    // File menu
    {
      label: 'File',
      submenu: [
        {
          label: 'New File',
          accelerator: 'CmdOrCtrl+N',
          click: () => mainWindow.webContents.send('menu:newFile'),
        },
        {
          label: 'Open...',
          accelerator: 'CmdOrCtrl+O',
          click: () => mainWindow.webContents.send('menu:openFile'),
        },
        {
          label: 'Save',
          accelerator: 'CmdOrCtrl+S',
          click: () => mainWindow.webContents.send('menu:save'),
        },
        {
          label: 'Save As...',
          accelerator: 'CmdOrCtrl+Shift+S',
          click: () => mainWindow.webContents.send('menu:saveAs'),
        },
        { type: 'separator' },
        process.platform === 'darwin'
          ? { role: 'close' }
          : { role: 'quit' },
      ],
    },

    // Edit menu
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
      ],
    },

    // View menu
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}
```

### 右键菜单（Context Menu）

```typescript
import { Menu, ipcMain, BrowserWindow } from 'electron'

ipcMain.on('show-context-menu', (event, menuItems: string[]) => {
  const window = BrowserWindow.fromWebContents(event.sender)!
  
  const template: Electron.MenuItemConstructorOptions[] = menuItems.map((item) => {
    if (item === '---') {
      return { type: 'separator' as const }
    }
    return {
      label: item,
      click: () => {
        event.sender.send('context-menu-command', item)
      },
    }
  })

  const menu = Menu.buildFromTemplate(template)
  menu.popup({ window })
})
```

## 5.3 系统托盘

```typescript
import { Tray, Menu, nativeImage, app, BrowserWindow } from 'electron'
import path from 'path'

let tray: Tray | null = null

function createTray(mainWindow: BrowserWindow): void {
  // Create tray icon
  const iconPath = path.join(__dirname, '../assets/tray-icon.png')
  const icon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 })
  
  tray = new Tray(icon)
  tray.setToolTip('My Electron App')

  // Tray context menu
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show Window',
      click: () => {
        mainWindow.show()
        mainWindow.focus()
      },
    },
    {
      label: 'Hide Window',
      click: () => mainWindow.hide(),
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        app.quit()
      },
    },
  ])

  tray.setContextMenu(contextMenu)

  // Click handler (show window)
  tray.on('click', () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide()
    } else {
      mainWindow.show()
      mainWindow.focus()
    }
  })
}
```

## 5.4 窗口控制

### 多窗口管理

```typescript
import { BrowserWindow } from 'electron'

class WindowManager {
  private windows: Map<string, BrowserWindow> = new Map()

  createWindow(id: string, options: Electron.BrowserWindowConstructorOptions, url: string): BrowserWindow {
    const window = new BrowserWindow(options)
    
    if (url.startsWith('http')) {
      window.loadURL(url)
    } else {
      window.loadFile(url)
    }

    window.on('closed', () => {
      this.windows.delete(id)
    })

    this.windows.set(id, window)
    return window
  }

  getWindow(id: string): BrowserWindow | undefined {
    return this.windows.get(id)
  }

  closeWindow(id: string): void {
    const window = this.windows.get(id)
    if (window && !window.isDestroyed()) {
      window.close()
    }
  }

  closeAll(): void {
    for (const [id, window] of this.windows) {
      if (!window.isDestroyed()) {
        window.close()
      }
    }
  }
}
```

### 无边框窗口与拖拽

```typescript
const framelessWindow = new BrowserWindow({
  width: 800,
  height: 600,
  frame: false,               // Remove native window frame
  transparent: false,         // Optional: transparent background
  titleBarStyle: 'hidden',    // macOS: hide title bar but keep traffic lights
  titleBarOverlay: {          // Windows: custom title bar overlay
    color: '#2f3241',
    symbolColor: '#ffffff',
    height: 30,
  },
  webPreferences: {
    preload: path.join(__dirname, 'preload.js'),
    contextIsolation: true,
    nodeIntegration: false,
  },
})
```

前端实现拖拽区域：

```css
/* Make the top area draggable */
.titlebar {
  -webkit-app-region: drag;
  height: 32px;
  display: flex;
  align-items: center;
  padding: 0 12px;
  user-select: none;
}

/* Buttons inside titlebar should NOT be draggable */
.titlebar button {
  -webkit-app-region: no-drag;
}

/* macOS: leave space for traffic lights */
.titlebar.macos {
  padding-left: 80px;
}
```

## 5.5 全局快捷键

```typescript
import { globalShortcut, app } from 'electron'

app.whenReady().then(() => {
  // Register global shortcut
  globalShortcut.register('CommandOrControl+Shift+Space', () => {
    console.log('Global shortcut triggered!')
    // Show/hide window, etc.
    const win = BrowserWindow.getAllWindows()[0]
    if (win) {
      win.isVisible() ? win.hide() : win.show()
    }
  })
})

// Unregister on quit
app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})
```

### 应用内快捷键（通过菜单加速器）

```typescript
// These work only when app is focused
const menu = Menu.buildFromTemplate([
  {
    label: 'Actions',
    submenu: [
      {
        label: 'Save',
        accelerator: 'CmdOrCtrl+S',
        click: () => { /* save action */ },
      },
      {
        label: 'Find',
        accelerator: 'CmdOrCtrl+F',
        click: () => { /* find action */ },
      },
    ],
  },
])
```

## 5.6 剪贴板

```typescript
import { clipboard, nativeImage } from 'electron'

// Text clipboard
ipcMain.handle('clipboard:writeText', async (_event, text: string) => {
  clipboard.writeText(text)
})

ipcMain.handle('clipboard:readText', async () => {
  return clipboard.readText()
})

// Image clipboard
ipcMain.handle('clipboard:writeImage', async (_event, dataURL: string) => {
  const image = nativeImage.createFromDataURL(dataURL)
  clipboard.writeImage(image)
})

ipcMain.handle('clipboard:readImage', async () => {
  const image = clipboard.readImage()
  if (image.isEmpty()) return null
  return image.toDataURL()
})

// HTML clipboard
ipcMain.handle('clipboard:writeHTML', async (_event, html: string) => {
  clipboard.writeHTML(html)
})
```

## 5.7 系统通知

```typescript
import { Notification } from 'electron'

ipcMain.handle('notification:show', async (_event, options: {
  title: string
  body: string
  icon?: string
}) => {
  const notification = new Notification({
    title: options.title,
    body: options.body,
    icon: options.icon,
  })

  notification.on('click', () => {
    // Handle notification click
    const mainWindow = BrowserWindow.getAllWindows()[0]
    mainWindow?.show()
    mainWindow?.focus()
  })

  notification.show()
})
```

## 5.8 本章 Demo：文件管理器

本章 Demo 是一个简易文件管理器，演示了：

- 文件选择/保存对话框
- 应用菜单和快捷键
- 文件读写操作
- 右键菜单
- 系统托盘
- 剪贴板操作
- 通知

→ 查看 Demo 代码：[demos/05-file-manager/](../demos/05-file-manager/)

## 5.9 本章小结

本章你学到了：
- 原生对话框（打开、保存、消息、确认）
- 应用菜单和右键菜单
- 系统托盘
- 多窗口管理
- 无边框窗口和拖拽区域
- 全局快捷键和应用内快捷键
- 剪贴板操作
- 系统通知

---

**上一章**：[第四章：主进程开发 — Node.js 后端与数据](./04-backend-development.md)  
**下一章**：[第六章：高级特性 — 进阶开发](./06-advanced.md)
