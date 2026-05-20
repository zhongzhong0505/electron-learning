# NoteFlow — 大型 Electron 实战项目

> 一个完整的模块化笔记应用，展示 Electron 企业级项目的架构设计、前后端分层、服务化设计模式。

## 架构设计

```
┌───────────────────────────────────────────────────────────────┐
│                    Renderer Process (UI)                        │
├───────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌─────────┐  ┌──────────┐  ┌─────────┐  ┌───────────────┐  │
│  │  Pages  │  │Components│  │  Hooks  │  │  Store (State)│  │
│  │         │  │          │  │         │  │               │  │
│  │• Editor │  │• NoteCard│  │• useNotes│  │• notes[]     │  │
│  │• List   │  │• Sidebar │  │• useSearch│ │• currentNote │  │
│  │• Search │  │• Toolbar │  │• useTheme│  │• settings    │  │
│  │• Settings│ │• TagBadge│  │• useAuto │  │• tags[]      │  │
│  └─────────┘  └──────────┘  └─────────┘  └───────────────┘  │
│                         │                                      │
└─────────────────────────┼──────────────────────────────────────┘
                          │ window.electronAPI (contextBridge)
┌─────────────────────────┼──────────────────────────────────────┐
│                    Preload Script                                │
│              (IPC Channel Mapping)                               │
└─────────────────────────┼──────────────────────────────────────┘
                          │ ipcMain.handle / webContents.send
┌─────────────────────────┼──────────────────────────────────────┐
│                    Main Process (Backend)                        │
├───────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌── IPC Layer ──────────────────────────────────────────┐    │
│  │  note-handlers.ts | tag-handlers.ts | config-handlers │    │
│  └───────────────────────────┬───────────────────────────┘    │
│                              │                                 │
│  ┌── Service Layer ──────────┼───────────────────────────┐    │
│  │                           ▼                            │    │
│  │  ┌─────────────┐  ┌────────────┐  ┌──────────────┐   │    │
│  │  │ NoteService │  │ TagService │  │ConfigService │   │    │
│  │  │             │  │            │  │              │   │    │
│  │  │• CRUD       │  │• CRUD      │  │• get/set     │   │    │
│  │  │• search     │  │• assign    │  │• theme       │   │    │
│  │  │• export     │  │• filter    │  │• window      │   │    │
│  │  └──────┬──────┘  └─────┬──────┘  └──────┬───────┘   │    │
│  └─────────┼────────────────┼────────────────┼───────────┘    │
│            │                │                │                 │
│  ┌── Data Layer ────────────┼────────────────┼───────────┐    │
│  │         ▼                ▼                ▼            │    │
│  │  ┌──────────────────────────────────────────────────┐ │    │
│  │  │              Database (SQLite)                     │ │    │
│  │  │  Tables: notes | tags | note_tags | settings     │ │    │
│  │  └──────────────────────────────────────────────────┘ │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                │
│  ┌── Utils ──────────────────────────────────────────────┐    │
│  │  logger.ts | paths.ts | validators.ts                  │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                │
└───────────────────────────────────────────────────────────────┘
```

## 技术栈

| 层级 | 技术 |
|------|------|
| 主进程 | Electron 42 + TypeScript |
| 数据库 | better-sqlite3 (JSON 文件作为备选) |
| 服务层 | 分层 Service 模式 |
| IPC | contextBridge + invoke/handle |
| 渲染进程 | TypeScript + 原生 DOM |
| 状态管理 | 简单 Store 模式 |
| 构建 | tsc (分离 main/renderer) |

## 项目结构

```
99-noteflow/
├── src/
│   ├── main/                          # 主进程
│   │   ├── main.ts                    # 入口 + 窗口管理
│   │   ├── preload.ts                 # contextBridge 暴露 API
│   │   ├── services/                  # 业务服务层
│   │   │   ├── database.ts            # SQLite 数据库管理
│   │   │   ├── note-service.ts        # 笔记 CRUD + 搜索
│   │   │   ├── tag-service.ts         # 标签管理
│   │   │   └── config-service.ts      # 应用配置
│   │   ├── ipc/                       # IPC Handler 注册
│   │   │   ├── note-handlers.ts       # 笔记相关 IPC
│   │   │   ├── tag-handlers.ts        # 标签相关 IPC
│   │   │   └── config-handlers.ts     # 配置相关 IPC
│   │   └── utils/                     # 工具函数
│   │       ├── logger.ts              # 日志
│   │       └── paths.ts               # 路径管理
│   └── renderer/                      # 渲染进程
│       ├── index.html                 # HTML 入口
│       ├── app.ts                     # 应用初始化
│       ├── store.ts                   # 状态管理
│       ├── pages/                     # 页面
│       │   ├── editor.ts             # 编辑器页面
│       │   └── settings.ts           # 设置页面
│       ├── components/                # UI 组件
│       │   ├── sidebar.ts            # 侧边栏
│       │   ├── note-list.ts          # 笔记列表
│       │   ├── toolbar.ts            # 工具栏
│       │   └── tag-picker.ts         # 标签选择器
│       ├── types/                     # 类型定义
│       │   └── index.ts              # 共享类型
│       └── styles/
│           └── app.css                # 样式
├── resources/                         # 静态资源
├── package.json
├── tsconfig.main.json
├── tsconfig.renderer.json
└── tsconfig.json
```

## 运行

```bash
npm install
npm run dev
```

## 功能列表

- ✅ 笔记 CRUD（创建/读取/更新/删除）
- ✅ Markdown 编辑 + 实时预览
- ✅ 全文搜索
- ✅ 标签系统（创建/分配/过滤）
- ✅ 暗色/亮色主题切换
- ✅ 自动保存
- ✅ 导出为 HTML/文本
- ✅ 应用菜单 + 快捷键
- ✅ 窗口状态记忆
