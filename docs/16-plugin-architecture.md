# 附录H：插件化架构设计

## H.1 插件系统设计思路

Electron 应用可以通过插件机制扩展功能，类似 VS Code 的扩展系统。

### 设计目标

- 插件可以在运行时动态加载/卸载
- 插件有明确的 API 边界（不能随意访问主应用内部）
- 插件之间相互隔离

## H.2 插件接口定义

```typescript
// src/main/plugin/types.ts
export interface PluginManifest {
  id: string
  name: string
  version: string
  description: string
  main: string  // Entry file relative to plugin dir
  activationEvents: string[]  // When to activate
}

export interface PluginContext {
  // APIs available to plugins
  registerCommand(id: string, handler: () => void): void
  registerMenuItems(items: MenuItem[]): void
  getStoragePath(): string
  showNotification(title: string, body: string): void
  onEvent(event: string, callback: (data: any) => void): void
  emitEvent(event: string, data: any): void
}

export interface Plugin {
  activate(context: PluginContext): void | Promise<void>
  deactivate(): void | Promise<void>
}
```

## H.3 插件管理器

```typescript
// src/main/plugin/plugin-manager.ts
import path from 'path'
import fs from 'fs/promises'
import { app } from 'electron'

export class PluginManager {
  private plugins: Map<string, { manifest: PluginManifest; instance: Plugin }> = new Map()
  private pluginsDir: string

  constructor() {
    this.pluginsDir = path.join(app.getPath('userData'), 'plugins')
  }

  async init(): Promise<void> {
    await fs.mkdir(this.pluginsDir, { recursive: true })
    await this.loadAllPlugins()
  }

  private async loadAllPlugins(): Promise<void> {
    const entries = await fs.readdir(this.pluginsDir, { withFileTypes: true })
    
    for (const entry of entries) {
      if (entry.isDirectory()) {
        try {
          await this.loadPlugin(entry.name)
        } catch (error) {
          console.error(`Failed to load plugin ${entry.name}:`, error)
        }
      }
    }
  }

  private async loadPlugin(pluginId: string): Promise<void> {
    const pluginDir = path.join(this.pluginsDir, pluginId)
    const manifestPath = path.join(pluginDir, 'manifest.json')
    
    const manifestContent = await fs.readFile(manifestPath, 'utf-8')
    const manifest: PluginManifest = JSON.parse(manifestContent)

    const mainPath = path.join(pluginDir, manifest.main)
    const pluginModule = require(mainPath)
    const instance: Plugin = pluginModule.default || pluginModule

    // Create sandboxed context
    const context = this.createPluginContext(manifest)
    await instance.activate(context)

    this.plugins.set(manifest.id, { manifest, instance })
  }

  private createPluginContext(manifest: PluginManifest): PluginContext {
    return {
      registerCommand: (id, handler) => {
        // Register command with app
      },
      registerMenuItems: (items) => {
        // Add menu items
      },
      getStoragePath: () => {
        return path.join(this.pluginsDir, manifest.id, 'storage')
      },
      showNotification: (title, body) => {
        new Notification({ title, body }).show()
      },
      onEvent: (event, callback) => {
        // Subscribe to app events
      },
      emitEvent: (event, data) => {
        // Emit events to app
      },
    }
  }

  async unloadPlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId)
    if (plugin) {
      await plugin.instance.deactivate()
      this.plugins.delete(pluginId)
    }
  }

  getLoadedPlugins(): PluginManifest[] {
    return Array.from(this.plugins.values()).map((p) => p.manifest)
  }
}
```

## H.4 示例插件

```typescript
// plugins/word-counter/index.ts
import { Plugin, PluginContext } from '../../src/main/plugin/types'

const plugin: Plugin = {
  activate(context) {
    context.registerCommand('wordCounter.count', () => {
      context.emitEvent('request:editorContent', null)
    })

    context.onEvent('response:editorContent', (content: string) => {
      const wordCount = content.split(/\s+/).filter(Boolean).length
      context.showNotification('Word Count', `${wordCount} words`)
    })
  },

  deactivate() {
    // Cleanup
  },
}

export default plugin
```

```json
// plugins/word-counter/manifest.json
{
  "id": "word-counter",
  "name": "Word Counter",
  "version": "1.0.0",
  "description": "Counts words in the editor",
  "main": "index.js",
  "activationEvents": ["onCommand:wordCounter.count"]
}
```
