import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  getCookies: () => ipcRenderer.invoke('cookies:getAll'),
  setCookie: (url: string, name: string, value: string) => ipcRenderer.invoke('cookies:set', url, name, value),
  removeCookie: (url: string, name: string) => ipcRenderer.invoke('cookies:remove', url, name),
  getCacheSize: () => ipcRenderer.invoke('session:cacheSize'),
  clearCache: () => ipcRenderer.invoke('session:clearCache'),
  getRequestLogs: () => ipcRenderer.invoke('requests:getLogs'),
  clearLogs: () => ipcRenderer.invoke('requests:clear'),
  testRequest: (url: string) => ipcRenderer.invoke('requests:test', url),
  onRequestLogged: (cb: (log: any) => void) => {
    ipcRenderer.on('request:logged', (_e, log) => cb(log))
  },
})
