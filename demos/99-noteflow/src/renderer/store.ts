// Simple reactive state store
class Store {
  notes: Note[] = []
  tags: Tag[] = []
  currentNote: Note | null = null
  config: AppConfig = { theme: 'light', fontSize: 15, autoSave: true, autoSaveInterval: 2000, sidebarWidth: 280, showArchived: false }
  searchQuery: string = ''

  private listeners: Array<() => void> = []

  subscribe(listener: () => void): void {
    this.listeners.push(listener)
  }

  notify(): void {
    this.listeners.forEach((fn) => fn())
  }

  async loadNotes(): Promise<void> {
    if (this.searchQuery) {
      this.notes = await window.electronAPI.noteSearch(this.searchQuery)
    } else {
      this.notes = await window.electronAPI.noteGetAll({ archived: this.config.showArchived ? undefined : false })
    }
    this.notify()
  }

  async loadTags(): Promise<void> {
    this.tags = await window.electronAPI.tagGetAll()
    this.notify()
  }

  async loadConfig(): Promise<void> {
    this.config = await window.electronAPI.configGetAll()
    this.notify()
  }

  async selectNote(id: number): Promise<void> {
    this.currentNote = await window.electronAPI.noteGetById(id)
    this.notify()
  }

  async createNote(): Promise<void> {
    const note = await window.electronAPI.noteCreate('Untitled', '')
    await this.loadNotes()
    await this.selectNote(note.id)
  }

  async deleteCurrentNote(): Promise<void> {
    if (!this.currentNote) return
    await window.electronAPI.noteDelete(this.currentNote.id)
    this.currentNote = null
    await this.loadNotes()
    this.notify()
  }

  async toggleTheme(): Promise<void> {
    const newTheme = this.config.theme === 'light' ? 'dark' : 'light'
    await window.electronAPI.configSet('theme', newTheme)
    this.config.theme = newTheme
    this.notify()
  }
}

const store = new Store()
