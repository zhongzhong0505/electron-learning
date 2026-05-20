# Demo 06: System Monitor

系统监控面板，演示 Electron 高级特性：

- 实时数据推送（webContents.send）
- CPU、内存使用率监控
- 进程列表
- 定时器和 interval 管理
- 性能优化（避免主进程阻塞）
- electron-log 日志集成

## 运行

```bash
npm install
npm run dev
```

## 核心知识点

- `setInterval` + `webContents.send` 实时推送
- `os` 模块获取系统信息
- 数据可视化（进度条/图表）
- Utility Process（CPU 密集任务分离）
