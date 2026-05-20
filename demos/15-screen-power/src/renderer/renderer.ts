interface Window {
  electronAPI: {
    getDisplays(): Promise<any[]>
    getPrimaryDisplay(): Promise<any>
    getCursorPosition(): Promise<{ x: number; y: number }>
    startPowerBlocker(): Promise<boolean>
    stopPowerBlocker(): Promise<boolean>
    getIdleTime(): Promise<number>
    onPowerUpdate(cb: (data: any) => void): void
    onPowerEvent(cb: (event: string) => void): void
  }
}

const displaysEl = document.getElementById('displays') as HTMLDivElement
const idleTimeEl = document.getElementById('idle-time') as HTMLSpanElement
const idleStateEl = document.getElementById('idle-state') as HTMLSpanElement
const blockerStatusEl = document.getElementById('blocker-status') as HTMLSpanElement
const startBlockerBtn = document.getElementById('start-blocker') as HTMLButtonElement
const stopBlockerBtn = document.getElementById('stop-blocker') as HTMLButtonElement
const eventsLog = document.getElementById('events-log') as HTMLDivElement

// Load displays
;(async () => {
  const displays = await window.electronAPI.getDisplays()
  displaysEl.innerHTML = displays.map((d: any, i: number) => `
    <div class="display-item">
      <strong>Display ${i + 1}${d.internal ? ' (Built-in)' : ''}</strong><br/>
      <span>Size: ${d.size.width}×${d.size.height}</span><br/>
      <span>Scale: ${d.scaleFactor}x</span><br/>
      <span>Position: (${d.bounds.x}, ${d.bounds.y})</span>
    </div>
  `).join('')
})()

// Power updates
window.electronAPI.onPowerUpdate((data) => {
  idleTimeEl.textContent = data.idleTime + 's'
  idleStateEl.textContent = data.idleState
  blockerStatusEl.textContent = data.isBlockingPower ? '🔴 Blocking' : '🟢 Off'
  blockerStatusEl.className = data.isBlockingPower ? 'active' : ''
})

// Power events
window.electronAPI.onPowerEvent((event) => {
  const time = new Date().toLocaleTimeString()
  eventsLog.innerHTML = `<div class="event-entry"><span class="time">${time}</span> ${event}</div>` + eventsLog.innerHTML
})

// Blocker controls
startBlockerBtn.addEventListener('click', () => window.electronAPI.startPowerBlocker())
stopBlockerBtn.addEventListener('click', () => window.electronAPI.stopPowerBlocker())
