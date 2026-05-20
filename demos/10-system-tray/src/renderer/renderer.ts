interface Window {
  electronAPI: {
    sendNotification(title: string, body: string): Promise<void>
  }
}

const notifyBtn = document.getElementById('notify-btn') as HTMLButtonElement
const notifyTitle = document.getElementById('notify-title') as HTMLInputElement
const notifyBody = document.getElementById('notify-body') as HTMLInputElement

notifyBtn.addEventListener('click', async () => {
  const title = notifyTitle.value || 'Notification'
  const body = notifyBody.value || 'Hello from tray app!'
  await window.electronAPI.sendNotification(title, body)
})
