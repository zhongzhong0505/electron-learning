# Demo 02: IPC Communication

演示 Electron 进程间通信的三种模式：

1. **invoke/handle** — 请求-响应模式（推荐）
2. **send/on** — 单向消息
3. **webContents.send** — 主进程主动推送

## 功能演示

- 计数器（invoke/handle 调用）
- 实时时钟（主进程定时推送）
- 系统信息获取
- 错误处理演示

## 运行

```bash
npm install
npm run dev
```
