# Demo 11: Multi-Window Communication

多窗口通信，演示：

- 动态创建和管理多个窗口
- 窗口间通信（通过主进程中转）
- 广播事件到所有窗口
- 共享状态同步
- 窗口生命周期管理

## 运行

```bash
npm install
npm run dev
```

## 核心知识点

- `BrowserWindow` 动态创建和销毁
- `webContents.send` 向特定窗口发送消息
- 主进程作为消息中转（Message Broker）
- 窗口 ID 管理
- 共享状态在多窗口间同步
