interface Window {
  electronAPI: {
    minimize(): void
    maximize(): void
    close(): void
    isMaximized(): Promise<boolean>
    getPlatform(): Promise<string>
  }
}

async function init(): Promise<void> {
  const platform = await window.electronAPI.getPlatform()
  const platformBadge = document.getElementById('platform-badge') as HTMLSpanElement
  platformBadge.textContent = platform

  // Only show custom window buttons on non-macOS
  if (platform !== 'darwin') {
    const controls = document.getElementById('window-controls') as HTMLDivElement
    controls.innerHTML = `
      <button id="btn-min" title="Minimize">─</button>
      <button id="btn-max" title="Maximize">□</button>
      <button id="btn-close" class="close" title="Close">✕</button>
    `

    document.getElementById('btn-min')!.addEventListener('click', () => {
      window.electronAPI.minimize()
    })

    document.getElementById('btn-max')!.addEventListener('click', async () => {
      window.electronAPI.maximize()
      const isMax = await window.electronAPI.isMaximized()
      const stateEl = document.getElementById('window-state') as HTMLSpanElement
      stateEl.textContent = isMax ? 'Maximized' : 'Normal'
    })

    document.getElementById('btn-close')!.addEventListener('click', () => {
      window.electronAPI.close()
    })
  } else {
    // macOS uses native traffic lights, adjust title padding
    const titlebar = document.getElementById('titlebar') as HTMLDivElement
    titlebar.style.paddingLeft = '80px'
  }
}

init()
