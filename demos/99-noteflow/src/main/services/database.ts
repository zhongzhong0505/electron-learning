import fs from 'fs'
import path from 'path'
import { Paths } from '../utils/paths'
import { logger } from '../utils/logger'

/**
 * Database service using JSON file storage.
 * In production, replace with better-sqlite3 for performance.
 */
export interface NoteRecord {
  id: number
  title: string
  content: string
  tags: string[]    // tag ids
  createdAt: string
  updatedAt: string
  pinned: boolean
  archived: boolean
}

export interface TagRecord {
  id: string
  name: string
  color: string
}

interface DatabaseSchema {
  notes: NoteRecord[]
  tags: TagRecord[]
  nextNoteId: number
}

export class Database {
  private data: DatabaseSchema
  private dbPath: string
  private saveTimeout: NodeJS.Timeout | null = null

  constructor() {
    this.dbPath = Paths.database + '.json'
    this.data = this.load()
  }

  private load(): DatabaseSchema {
    try {
      if (fs.existsSync(this.dbPath)) {
        const raw = fs.readFileSync(this.dbPath, 'utf-8')
        return JSON.parse(raw)
      }
    } catch (err) {
      logger.error('Failed to load database', err as Error)
    }
    return { notes: [], tags: [], nextNoteId: 1 }
  }

  private save(): void {
    // Debounced save to avoid excessive I/O
    if (this.saveTimeout) clearTimeout(this.saveTimeout)
    this.saveTimeout = setTimeout(() => {
      try {
        const dir = path.dirname(this.dbPath)
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
        fs.writeFileSync(this.dbPath, JSON.stringify(this.data, null, 2))
      } catch (err) {
        logger.error('Failed to save database', err as Error)
      }
    }, 100)
  }

  saveSync(): void {
    const dir = path.dirname(this.dbPath)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(this.dbPath, JSON.stringify(this.data, null, 2))
  }

  // Notes
  getAllNotes(): NoteRecord[] {
    return [...this.data.notes].sort((a, b) => {
      if (a.pinned && !b.pinned) return -1
      if (!a.pinned && b.pinned) return 1
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    })
  }

  getNoteById(id: number): NoteRecord | undefined {
    return this.data.notes.find((n) => n.id === id)
  }

  createNote(title: string, content: string = ''): NoteRecord {
    const note: NoteRecord = {
      id: this.data.nextNoteId++,
      title,
      content,
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      pinned: false,
      archived: false,
    }
    this.data.notes.push(note)
    this.save()
    return note
  }

  updateNote(id: number, updates: Partial<Pick<NoteRecord, 'title' | 'content' | 'tags' | 'pinned' | 'archived'>>): NoteRecord | null {
    const note = this.data.notes.find((n) => n.id === id)
    if (!note) return null
    Object.assign(note, updates, { updatedAt: new Date().toISOString() })
    this.save()
    return note
  }

  deleteNote(id: number): boolean {
    const idx = this.data.notes.findIndex((n) => n.id === id)
    if (idx === -1) return false
    this.data.notes.splice(idx, 1)
    this.save()
    return true
  }

  searchNotes(query: string): NoteRecord[] {
    const q = query.toLowerCase()
    return this.getAllNotes().filter((n) =>
      n.title.toLowerCase().includes(q) ||
      n.content.toLowerCase().includes(q) ||
      n.tags.some((t) => t.toLowerCase().includes(q))
    )
  }

  // Tags
  getAllTags(): TagRecord[] {
    return this.data.tags
  }

  createTag(name: string, color: string): TagRecord {
    const tag: TagRecord = {
      id: name.toLowerCase().replace(/\s+/g, '-'),
      name,
      color,
    }
    this.data.tags.push(tag)
    this.save()
    return tag
  }

  deleteTag(id: string): boolean {
    const idx = this.data.tags.findIndex((t) => t.id === id)
    if (idx === -1) return false
    this.data.tags.splice(idx, 1)
    // Remove tag from all notes
    for (const note of this.data.notes) {
      note.tags = note.tags.filter((t) => t !== id)
    }
    this.save()
    return true
  }
}
