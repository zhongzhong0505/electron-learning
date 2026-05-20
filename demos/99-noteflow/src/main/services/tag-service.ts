import { Database, TagRecord } from './database'

export class TagService {
  constructor(private db: Database) {}

  getAll(): TagRecord[] {
    return this.db.getAllTags()
  }

  create(name: string, color: string = '#667eea'): TagRecord {
    return this.db.createTag(name, color)
  }

  delete(id: string): boolean {
    return this.db.deleteTag(id)
  }
}
