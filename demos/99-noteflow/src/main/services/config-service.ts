import fs from 'fs'
import path from 'path'
import { Paths } from '../utils/paths'

export interface AppConfig {
  theme: 'light' | 'dark'
  fontSize: number
  autoSave: boolean
  autoSaveInterval: number
  windowBounds: { x: number; y: number; width: number; height: number } | null
  sidebarWidth: number
  showArchived: boolean
}

const DEFAULT_CONFIG: AppConfig = {
  theme: 'light',
  fontSize: 15,
  autoSave: true,
  autoSaveInterval: 2000,
  windowBounds: null,
  sidebarWidth: 280,
  showArchived: false,
}

export class ConfigService {
  private config: AppConfig
  private configPath: string

  constructor() {
    this.configPath = path.join(Paths.userData, 'config.json')
    this.config = this.load()
  }

  private load(): AppConfig {
    try {
      if (fs.existsSync(this.configPath)) {
        const raw = fs.readFileSync(this.configPath, 'utf-8')
        return { ...DEFAULT_CONFIG, ...JSON.parse(raw) }
      }
    } catch { /* use defaults */ }
    return { ...DEFAULT_CONFIG }
  }

  private save(): void {
    const dir = path.dirname(this.configPath)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2))
  }

  getAll(): AppConfig {
    return { ...this.config }
  }

  get<K extends keyof AppConfig>(key: K): AppConfig[K] {
    return this.config[key]
  }

  set<K extends keyof AppConfig>(key: K, value: AppConfig[K]): void {
    this.config[key] = value
    this.save()
  }

  reset(): void {
    this.config = { ...DEFAULT_CONFIG }
    this.save()
  }
}
