interface Window {
  electronAPI: {
    createWindow(title: string): Promise<number>
    broadcast(message: string): void
    sendToWindow(id: number, message: string): void
    getWindows(): Promise<Array<{ id: number; title: string }>>
    onBroadcast(cb: (msg: string) => void): void
    onDirectMessage(cb: (msg: string) => void): void
  }
}

;(function () {
  let childCounter = 0

  const createBtn = document.getElementById('create-btn') as HTMLButtonElement
  const refreshBtn = document.getElementById('refresh-btn') as HTMLButtonElement
  const broadcastMsg = document.getElementById('broadcast-msg') as HTMLInputElement
  const broadcastBtn = document.getElementById('broadcast-btn') as HTMLButtonElement
  const windowList = document.getElementById('window-list') as HTMLDivElement
  const messagesEl = document.getElementById('messages') as HTMLDivElement

  createBtn.addEventListener('click', async () => {
    childCounter++
    await window.electronAPI.createWindow(`Child ${childCounter}`)
    refreshWindowList()
  })

  refreshBtn.addEventListener('click', refreshWindowList)

  broadcastBtn.addEventListener('click', () => {
    const msg = broadcastMsg.value.trim()
    if (msg) {
      window.electronAPI.broadcast(msg)
      broadcastMsg.value = ''
    }
  })

  broadcastMsg.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') broadcastBtn.click()
  })

  async function refreshWindowList(): Promise<void> {
    const wins = await window.electronAPI.getWindows()
    windowList.innerHTML = wins
      .map((w) => `<div>Window #${w.id} — ${w.title}</div>`)
      .join('')
  }

  function addMessage(type: string, text: string): void {
    const time = new Date().toLocaleTimeString()
    messagesEl.innerHTML = `<div class="msg"><span class="time">${time}</span>[${type}] ${text}</div>` + messagesEl.innerHTML
  }

  window.electronAPI.onBroadcast((msg) => addMessage('Broadcast', msg))
  window.electronAPI.onDirectMessage((msg) => addMessage('Direct', msg))

  refreshWindowList()
})()
