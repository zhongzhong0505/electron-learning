import { Database, NoteRecord } from './database'
import { logger } from '../utils/logger'
import fs from 'fs'
import path from 'path'
import { Paths } from '../utils/paths'

export class NoteService {
  constructor(private db: Database) {}

  getAll(options?: { archived?: boolean; tag?: string }): NoteRecord[] {
    let notes = this.db.getAllNotes()
    if (options?.archived !== undefined) {
      notes = notes.filter((n) => n.archived === options.archived)
    }
    if (options?.tag) {
      notes = notes.filter((n) => n.tags.includes(options.tag!))
    }
    return notes
  }

  getById(id: number): NoteRecord | null {
    return this.db.getNoteById(id) || null
  }

  create(title: string, content: string = ''): NoteRecord {
    logger.info('Creating note:', title)
    return this.db.createNote(title, content)
  }

  update(id: number, title: string, content: string): NoteRecord | null {
    return this.db.updateNote(id, { title, content })
  }

  delete(id: number): boolean {
    logger.info('Deleting note:', id)
    return this.db.deleteNote(id)
  }

  togglePin(id: number): NoteRecord | null {
    const note = this.db.getNoteById(id)
    if (!note) return null
    return this.db.updateNote(id, { pinned: !note.pinned })
  }

  archive(id: number): NoteRecord | null {
    return this.db.updateNote(id, { archived: true })
  }

  unarchive(id: number): NoteRecord | null {
    return this.db.updateNote(id, { archived: false })
  }

  setTags(id: number, tags: string[]): NoteRecord | null {
    return this.db.updateNote(id, { tags })
  }

  search(query: string): NoteRecord[] {
    return this.db.searchNotes(query)
  }

  exportAsHtml(id: number): string | null {
    const note = this.db.getNoteById(id)
    if (!note) return null

    // Simple markdown to HTML
    let html = note.content
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`(.+?)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br/>')

    return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${note.title}</title>
<style>body{font-family:system-ui;max-width:700px;margin:40px auto;padding:0 20px;line-height:1.7}
code{background:#f0f0f0;padding:2px 6px;border-radius:3px}</style></head>
<body><h1>${note.title}</h1>${html}</body></html>`
  }

  exportToFile(id: number, filePath: string): boolean {
    const html = this.exportAsHtml(id)
    if (!html) return false
    try {
      const dir = path.dirname(filePath)
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
      fs.writeFileSync(filePath, html)
      return true
    } catch {
      return false
    }
  }

  getStats(): { total: number; pinned: number; archived: number } {
    const all = this.db.getAllNotes()
    return {
      total: all.filter((n) => !n.archived).length,
      pinned: all.filter((n) => n.pinned).length,
      archived: all.filter((n) => n.archived).length,
    }
  }
}
