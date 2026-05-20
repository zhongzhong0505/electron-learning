  interface Window {
    electronAPI: {
      getSystemInfo(): Promise<any>
      onMetricsUpdate(callback: (data: any) => void): void
      removeAllListeners(channel: string): void
    }
  }

const cpuHistory: number[] = []
const MAX_HISTORY = 60

window.electronAPI.onMetricsUpdate((metrics) => {
  // CPU gauge
  const cpuFill = document.getElementById('cpu-fill') as HTMLDivElement
  const cpuText = document.getElementById('cpu-text') as HTMLSpanElement
  const cpuInfo = document.getElementById('cpu-info') as HTMLParagraphElement
  cpuFill.style.width = `${metrics.cpu.usage}%`
  cpuFill.style.background = getColor(metrics.cpu.usage)
  cpuText.textContent = `${metrics.cpu.usage}%`
  cpuInfo.textContent = `${metrics.cpu.model} (${metrics.cpu.cores} cores)`

  // Memory gauge
  const memFill = document.getElementById('mem-fill') as HTMLDivElement
  const memText = document.getElementById('mem-text') as HTMLSpanElement
  const memInfo = document.getElementById('mem-info') as HTMLParagraphElement
  memFill.style.width = `${metrics.memory.usage}%`
  memFill.style.background = getColor(metrics.memory.usage)
  memText.textContent = `${metrics.memory.usage}%`
  memInfo.textContent = `${formatBytes(metrics.memory.used)} / ${formatBytes(metrics.memory.total)}`

  // System info
  const sysInfo = document.getElementById('sys-info') as HTMLDivElement
  sysInfo.innerHTML = `
    <div class="info-row"><span>Platform</span><span>${metrics.system.platform} (${metrics.system.arch})</span></div>
    <div class="info-row"><span>Hostname</span><span>${metrics.system.hostname}</span></div>
    <div class="info-row"><span>Uptime</span><span>${formatUptime(metrics.system.uptime)}</span></div>
    <div class="info-row"><span>Node.js</span><span>v${metrics.system.nodeVersion}</span></div>
    <div class="info-row"><span>Electron</span><span>v${metrics.system.electronVersion}</span></div>
  `

  // CPU history chart
  cpuHistory.push(metrics.cpu.usage)
  if (cpuHistory.length > MAX_HISTORY) cpuHistory.shift()
  renderChart()
})

function renderChart(): void {
  const chart = document.getElementById('cpu-chart') as HTMLDivElement
  const bars = cpuHistory.map((v) =>
    `<div class="chart-bar" style="height:${v}%;background:${getColor(v)}"></div>`
  ).join('')
  chart.innerHTML = bars
}

function getColor(value: number): string {
  if (value < 50) return '#27ae60'
  if (value < 80) return '#f39c12'
  return '#e74c3c'
}

function formatBytes(bytes: number): string {
  return (bytes / 1024 / 1024 / 1024).toFixed(1) + ' GB'
}

function formatUptime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return `${h}h ${m}m`
}


