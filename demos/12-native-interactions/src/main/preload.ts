import { contextBridge, ipcRenderer } from 'electron'
contextBridge.exposeInMainWorld('electronAPI', {
  notify: (title: string, body: string) => ipcRenderer.invoke('notify', title, body),
  readFile: (filePath: string) => ipcRenderer.invoke('file:read', filePath),
  openExternal: (url: string) => ipcRenderer.invoke('shell:open', url),
  showInFolder: (filePath: string) => ipcRenderer.invoke('shell:showItem', filePath),
  showContextMenu: () => ipcRenderer.send('show-context-menu'),
})
