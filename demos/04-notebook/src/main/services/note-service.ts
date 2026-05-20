import path from 'path'
import fs from 'fs'
import { app } from 'electron'

export interface Note {
  id: number
  title: string
  content: string
  createdAt: string
  updatedAt: string
}

/**
 * NoteService - Uses a JSON file for storage (no native module dependency)
 * In production, you'd use better-sqlite3 for performance.
 */
export class NoteService {
  private notes: Note[] = []
  private nextId = 1
  private dataPath: string

  constructor() {
    const userDataPath = app.getPath('userData')
    this.dataPath = path.join(userDataPath, 'notebook-data.json')
  }

  async init(): Promise<void> {
    try {
      if (fs.existsSync(this.dataPath)) {
        const data = fs.readFileSync(this.dataPath, 'utf-8')
        const parsed = JSON.parse(data)
        this.notes = parsed.notes || []
        this.nextId = parsed.nextId || 1
      }
    } catch {
      this.notes = []
      this.nextId = 1
    }
  }

  async destroy(): Promise<void> {
    this.save()
  }

  private save(): void {
    const dir = path.dirname(this.dataPath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    fs.writeFileSync(this.dataPath, JSON.stringify({
      notes: this.notes,
      nextId: this.nextId,
    }, null, 2))
  }

  getAll(): Note[] {
    return [...this.notes].sort((a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )
  }

  getById(id: number): Note | undefined {
    return this.notes.find((n) => n.id === id)
  }

  create(title: string, content: string = ''): Note {
    const now = new Date().toISOString()
    const note: Note = {
      id: this.nextId++,
      title,
      content,
      createdAt: now,
      updatedAt: now,
    }
    this.notes.push(note)
    this.save()
    return note
  }

  update(id: number, title: string, content: string): Note {
    const note = this.notes.find((n) => n.id === id)
    if (!note) throw new Error(`Note with id ${id} not found`)
    note.title = title
    note.content = content
    note.updatedAt = new Date().toISOString()
    this.save()
    return note
  }

  delete(id: number): void {
    this.notes = this.notes.filter((n) => n.id !== id)
    this.save()
  }

  search(query: string): Note[] {
    const q = query.toLowerCase()
    return this.notes.filter((n) =>
      n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)
    )
  }
}
