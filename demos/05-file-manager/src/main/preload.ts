import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  openFile: () => ipcRenderer.invoke('dialog:openFile'),
  openFolder: () => ipcRenderer.invoke('dialog:openFolder'),
  readDir: (dirPath: string) => ipcRenderer.invoke('fs:readDir', dirPath),
  readFile: (filePath: string) => ipcRenderer.invoke('fs:readFile', filePath),
  getStats: (filePath: string) => ipcRenderer.invoke('fs:getStats', filePath),
  copyToClipboard: (text: string) => ipcRenderer.invoke('clipboard:write', text),
  showInFinder: (filePath: string) => ipcRenderer.invoke('shell:openInFinder', filePath),
  openExternal: (url: string) => ipcRenderer.invoke('shell:openExternal', url),
  // Menu events (with proper cleanup support)
  onMenuOpenFile: (cb: () => void) => {
    ipcRenderer.on('menu:openFile', cb)
    return () => ipcRenderer.removeListener('menu:openFile', cb)
  },
  onMenuOpenFolder: (cb: () => void) => {
    ipcRenderer.on('menu:openFolder', cb)
    return () => ipcRenderer.removeListener('menu:openFolder', cb)
  },
})
