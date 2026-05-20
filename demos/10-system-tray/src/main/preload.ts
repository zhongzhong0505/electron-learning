import { contextBridge, ipcRenderer } from 'electron'
contextBridge.exposeInMainWorld('electronAPI', {
  sendNotification: (title: string, body: string) => ipcRenderer.invoke('tray:notify', title, body),
})
