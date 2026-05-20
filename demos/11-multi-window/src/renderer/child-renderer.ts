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
  const childMsg = document.getElementById('child-msg') as HTMLInputElement
  const childBroadcastBtn = document.getElementById('child-broadcast-btn') as HTMLButtonElement
  const messagesEl = document.getElementById('messages') as HTMLDivElement

  childBroadcastBtn.addEventListener('click', () => {
    const msg = childMsg.value.trim()
    if (msg) {
      window.electronAPI.broadcast(msg)
      childMsg.value = ''
    }
  })

  childMsg.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') childBroadcastBtn.click()
  })

  function addMessage(type: string, text: string): void {
    const time = new Date().toLocaleTimeString()
    messagesEl.innerHTML = `<div class="msg"><span class="time">${time}</span>[${type}] ${text}</div>` + messagesEl.innerHTML
  }

  window.electronAPI.onBroadcast((msg) => addMessage('Broadcast', msg))
  window.electronAPI.onDirectMessage((msg) => addMessage('Direct', msg))
})()
