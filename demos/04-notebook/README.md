# Demo 04: Notebook

笔记本应用，演示 Electron 主进程后端开发：

- better-sqlite3 数据库集成
- Service 模式组织业务逻辑
- 完整 CRUD 操作
- electron-store 配置持久化
- Service 生命周期管理（init/destroy）

## 运行

```bash
npm install
npm run dev
```

## 核心知识点

- `better-sqlite3` 同步 SQLite API
- `electron-rebuild` 原生模块编译
- Service 设计模式
- IPC handler 与 Service 解耦
