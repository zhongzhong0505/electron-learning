// Shared types for renderer
interface Note {
  id: number
  title: string
  content: string
  tags: string[]
  createdAt: string
  updatedAt: string
  pinned: boolean
  archived: boolean
}

interface Tag {
  id: string
  name: string
  color: string
}

interface AppConfig {
  theme: 'light' | 'dark'
  fontSize: number
  autoSave: boolean
  autoSaveInterval: number
  sidebarWidth: number
  showArchived: boolean
}

interface Window {
  electronAPI: {
    noteGetAll(options?: any): Promise<Note[]>
    noteGetById(id: number): Promise<Note | null>
    noteCreate(title: string, content: string): Promise<Note>
    noteUpdate(id: number, title: string, content: string): Promise<Note | null>
    noteDelete(id: number): Promise<boolean>
    noteTogglePin(id: number): Promise<Note | null>
    noteArchive(id: number): Promise<Note | null>
    noteUnarchive(id: number): Promise<Note | null>
    noteSetTags(id: number, tags: string[]): Promise<Note | null>
    noteSearch(query: string): Promise<Note[]>
    noteGetStats(): Promise<{ total: number; pinned: number; archived: number }>
    noteExport(id: number): Promise<boolean>
    tagGetAll(): Promise<Tag[]>
    tagCreate(name: string, color: string): Promise<Tag>
    tagDelete(id: string): Promise<boolean>
    configGetAll(): Promise<AppConfig>
    configGet(key: string): Promise<any>
    configSet(key: string, value: any): Promise<void>
    onMenuNewNote(cb: () => void): void
    onMenuExport(cb: () => void): void
    onMenuSearch(cb: () => void): void
    onMenuToggleTheme(cb: () => void): void
  }
}
