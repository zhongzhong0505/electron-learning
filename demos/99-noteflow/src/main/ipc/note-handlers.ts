import { ipcMain, dialog, BrowserWindow } from 'electron'
import { NoteService } from '../services/note-service'

export function registerNoteHandlers(noteService: NoteService): void {
  ipcMain.handle('note:getAll', (_e, options) => noteService.getAll(options))
  ipcMain.handle('note:getById', (_e, id: number) => noteService.getById(id))
  ipcMain.handle('note:create', (_e, title: string, content: string) => noteService.create(title, content))
  ipcMain.handle('note:update', (_e, id: number, title: string, content: string) => noteService.update(id, title, content))
  ipcMain.handle('note:delete', (_e, id: number) => noteService.delete(id))
  ipcMain.handle('note:togglePin', (_e, id: number) => noteService.togglePin(id))
  ipcMain.handle('note:archive', (_e, id: number) => noteService.archive(id))
  ipcMain.handle('note:unarchive', (_e, id: number) => noteService.unarchive(id))
  ipcMain.handle('note:setTags', (_e, id: number, tags: string[]) => noteService.setTags(id, tags))
  ipcMain.handle('note:search', (_e, query: string) => noteService.search(query))
  ipcMain.handle('note:getStats', () => noteService.getStats())

  ipcMain.handle('note:export', async (event, id: number) => {
    const win = BrowserWindow.fromWebContents(event.sender)!
    const result = await dialog.showSaveDialog(win, {
      defaultPath: 'note-export.html',
      filters: [{ name: 'HTML', extensions: ['html'] }],
    })
    if (result.canceled || !result.filePath) return false
    return noteService.exportToFile(id, result.filePath)
  })
}
