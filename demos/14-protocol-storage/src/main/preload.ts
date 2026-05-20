import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  storeSet: (key: string, value: string) => ipcRenderer.invoke('store:set', key, value),
  storeGet: (key: string) => ipcRenderer.invoke('store:get', key),
  storeGetAll: () => ipcRenderer.invoke('store:getAll'),
  storeDelete: (key: string) => ipcRenderer.invoke('store:delete', key),
  isEncryptionAvailable: () => ipcRenderer.invoke('store:isEncryptionAvailable'),
})
