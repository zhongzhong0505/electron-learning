import { contextBridge, ipcRenderer } from 'electron'
contextBridge.exposeInMainWorld('electronAPI', {
  createWindow: (title: string) => ipcRenderer.invoke('window:create', title),
  broadcast: (message: string) => ipcRenderer.send('broadcast', message),
  sendToWindow: (id: number, message: string) => ipcRenderer.send('send-to-window', id, message),
  getWindows: () => ipcRenderer.invoke('window:list'),
  onBroadcast: (cb: (msg: string) => void) => ipcRenderer.on('broadcast:message', (_e, msg) => cb(msg)),
  onDirectMessage: (cb: (msg: string) => void) => ipcRenderer.on('direct:message', (_e, msg) => cb(msg)),
})
