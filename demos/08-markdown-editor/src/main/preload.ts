import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  renderMarkdown: (md: string) => ipcRenderer.invoke('md:render', md),
  fileSave: (filePath: string, content: string) => ipcRenderer.invoke('file:save', filePath, content),
  fileSaveAs: (content: string) => ipcRenderer.invoke('file:saveAs', content),
  getCurrentPath: () => ipcRenderer.invoke('file:getCurrentPath'),
  onFileOpened: (cb: (data: { path: string; content: string }) => void) => {
    ipcRenderer.on('file:opened', (_e, data) => cb(data))
  },
  onMenuNew: (cb: () => void) => { ipcRenderer.on('menu:new', cb) },
  onMenuSave: (cb: () => void) => { ipcRenderer.on('menu:save', cb) },
  onMenuSaveAs: (cb: () => void) => { ipcRenderer.on('menu:saveAs', cb) },
})
