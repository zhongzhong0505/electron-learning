# Demo 10: System Tray

系统托盘应用，演示：

- 创建系统托盘图标
- 托盘右键菜单
- 后台运行（关闭窗口不退出）
- 托盘图标点击显示/隐藏窗口
- 动态更新托盘图标和菜单
- 气泡通知

## 运行

```bash
npm install
npm run dev
```

## 核心知识点

- `Tray` API
- `nativeImage.createFromPath`
- 窗口 `close` 事件拦截（hide instead of quit）
- 托盘菜单动态更新
