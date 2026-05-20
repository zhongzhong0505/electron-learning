import { ipcMain } from 'electron'
import { TagService } from '../services/tag-service'

export function registerTagHandlers(tagService: TagService): void {
  ipcMain.handle('tag:getAll', () => tagService.getAll())
  ipcMain.handle('tag:create', (_e, name: string, color: string) => tagService.create(name, color))
  ipcMain.handle('tag:delete', (_e, id: string) => tagService.delete(id))
}
