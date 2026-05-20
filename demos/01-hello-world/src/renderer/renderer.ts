  interface Window {
    electronAPI: {
      greet(name: string): Promise<string>
      getAppInfo(): Promise<{
        electronVersion: string
        nodeVersion: string
        chromeVersion: string
        platform: string
        arch: string
      }>
    }
  }

const nameInput = document.getElementById('name-input') as HTMLInputElement
const greetBtn = document.getElementById('greet-btn') as HTMLButtonElement
const greetingEl = document.getElementById('greeting') as HTMLParagraphElement

greetBtn.addEventListener('click', async () => {
  const name = nameInput.value || 'World'
  const greeting = await window.electronAPI.greet(name)
  greetingEl.textContent = greeting
  greetingEl.classList.add('show')
})

nameInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') greetBtn.click()
})

async function loadAppInfo(): Promise<void> {
  const info = await window.electronAPI.getAppInfo()
  const infoEl = document.getElementById('app-info') as HTMLDivElement

  const items = [
    { label: 'Electron', value: info.electronVersion },
    { label: 'Node.js', value: info.nodeVersion },
    { label: 'Chrome', value: info.chromeVersion },
    { label: 'Platform', value: info.platform },
    { label: 'Architecture', value: info.arch },
  ]

  infoEl.innerHTML = items
    .map((item) => `<div class="info-item"><span class="label">${item.label}</span><span class="value">${item.value}</span></div>`)
    .join('')
}

loadAppInfo()


