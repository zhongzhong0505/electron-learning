# 第十一章：屏幕与电源管理

## 11.1 screen 模块

`screen` 模块提供显示器信息，适用于多显示器定位和响应式窗口管理。

```typescript
import { screen } from 'electron'

// Get primary display
const primary = screen.getPrimaryDisplay()
console.log(primary.size)       // { width: 2560, height: 1440 }
console.log(primary.scaleFactor) // 2 (Retina)
console.log(primary.bounds)     // { x: 0, y: 0, width: 2560, height: 1440 }
console.log(primary.workArea)   // Excludes taskbar/dock

// Get all displays
const displays = screen.getAllDisplays()

// Get display nearest to a point
const display = screen.getDisplayNearestPoint({ x: 100, y: 100 })

// Listen for display changes
screen.on('display-added', (event, newDisplay) => { /* ... */ })
screen.on('display-removed', (event, oldDisplay) => { /* ... */ })
screen.on('display-metrics-changed', (event, display, changedMetrics) => { /* ... */ })
```

## 11.2 powerMonitor 模块

监测系统电源状态变化：

```typescript
import { powerMonitor } from 'electron'

// System suspend/resume
powerMonitor.on('suspend', () => {
  console.log('System going to sleep')
  // Pause background tasks, save state
})

powerMonitor.on('resume', () => {
  console.log('System woke up')
  // Resume tasks, refresh data
})

// Screen lock/unlock
powerMonitor.on('lock-screen', () => { /* ... */ })
powerMonitor.on('unlock-screen', () => { /* ... */ })

// AC power / battery
powerMonitor.on('on-ac', () => { /* plugged in */ })
powerMonitor.on('on-battery', () => { /* on battery */ })

// Get current power state
const state = powerMonitor.getSystemIdleState(60) // 'active' | 'idle' | 'locked' | 'unknown'
const idleTime = powerMonitor.getSystemIdleTime() // seconds
```

## 11.3 powerSaveBlocker

防止系统进入睡眠状态（适用于下载、播放等场景）：

```typescript
import { powerSaveBlocker } from 'electron'

// Prevent display sleep
const id = powerSaveBlocker.start('prevent-display-sleep')

// Check if active
powerSaveBlocker.isStarted(id) // true

// Release when done
powerSaveBlocker.stop(id)
```

## 11.4 本章 Demo

本章 Demo 演示了：
- 显示器信息展示
- 实时电源状态监控
- 系统空闲时间检测
- 防止系统睡眠开关

→ 查看 Demo 代码：[demos/15-screen-power/](../demos/15-screen-power/)

---

**上一章**：[第十章：自定义协议与安全存储](./19-protocol-storage.md)  
**下一章**：[第十二章：屏幕录制与网络模块](./21-capturer-net.md)
