import { ipcMain } from 'electron'
import { ConfigService, AppConfig } from '../services/config-service'

export function registerConfigHandlers(configService: ConfigService): void {
  ipcMain.handle('config:getAll', () => configService.getAll())
  ipcMain.handle('config:get', (_e, key: keyof AppConfig) => configService.get(key))
  ipcMain.handle('config:set', (_e, key: keyof AppConfig, value: any) => configService.set(key, value))
  ipcMain.handle('config:reset', () => configService.reset())
}
