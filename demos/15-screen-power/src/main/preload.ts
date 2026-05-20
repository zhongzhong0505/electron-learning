import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  getDisplays: () => ipcRenderer.invoke('screen:getDisplays'),
  getPrimaryDisplay: () => ipcRenderer.invoke('screen:getPrimary'),
  getCursorPosition: () => ipcRenderer.invoke('screen:getCursorPosition'),
  startPowerBlocker: () => ipcRenderer.invoke('power:startBlocker'),
  stopPowerBlocker: () => ipcRenderer.invoke('power:stopBlocker'),
  getIdleTime: () => ipcRenderer.invoke('power:getIdleTime'),
  onPowerUpdate: (cb: (data: any) => void) => {
    ipcRenderer.on('power:update', (_e, data) => cb(data))
  },
  onPowerEvent: (cb: (event: string) => void) => {
    ipcRenderer.on('power:event', (_e, event) => cb(event))
  },
})
