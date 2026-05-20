interface Window {
  electronAPI: {
    getSources(): Promise<Array<{ id: string; name: string; thumbnail: string; displayId: string }>>
    netFetch(url: string, options?: any): Promise<{ status: number; statusText: string; headers: Record<string, string>; body: string }>
  }
}

const sourcesGrid = document.getElementById('sources-grid') as HTMLDivElement
const refreshBtn = document.getElementById('refresh-sources') as HTMLButtonElement
const screenshotContainer = document.getElementById('screenshot-container') as HTMLDivElement
const fetchUrl = document.getElementById('fetch-url') as HTMLInputElement
const fetchBtn = document.getElementById('fetch-btn') as HTMLButtonElement
const fetchResult = document.getElementById('fetch-result') as HTMLPreElement

// Load sources
async function loadSources(): Promise<void> {
  const sources = await window.electronAPI.getSources()
  sourcesGrid.innerHTML = sources.map((s) => `
    <div class="source-card" data-id="${s.id}">
      <img src="${s.thumbnail}" alt="${s.name}" />
      <span class="source-name">${s.name.substring(0, 30)}</span>
    </div>
  `).join('')

  // Click to capture
  sourcesGrid.querySelectorAll('.source-card').forEach((card) => {
    card.addEventListener('click', async () => {
      const sourceId = (card as HTMLElement).dataset.id!
      await captureScreenshot(sourceId)
    })
  })
}

async function captureScreenshot(sourceId: string): Promise<void> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        mandatory: {
          chromeMediaSource: 'desktop',
          chromeMediaSourceId: sourceId,
        },
      } as any,
    })

    const video = document.createElement('video')
    video.srcObject = stream
    await video.play()

    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d')!.drawImage(video, 0, 0)

    stream.getTracks().forEach((t) => t.stop())

    const dataUrl = canvas.toDataURL('image/png')
    screenshotContainer.innerHTML = `<img src="${dataUrl}" class="screenshot" />`
  } catch (err) {
    screenshotContainer.innerHTML = `<p class="error">Failed to capture: ${(err as Error).message}</p>`
  }
}

// Net fetch
fetchBtn.addEventListener('click', async () => {
  const url = fetchUrl.value.trim()
  if (!url) return
  fetchResult.textContent = 'Loading...'
  const result = await window.electronAPI.netFetch(url)
  try {
    const parsed = JSON.parse(result.body)
    fetchResult.textContent = `Status: ${result.status} ${result.statusText}\n\n${JSON.stringify(parsed, null, 2)}`
  } catch {
    fetchResult.textContent = `Status: ${result.status} ${result.statusText}\n\n${result.body.substring(0, 2000)}`
  }
})

fetchUrl.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') fetchBtn.click()
})

refreshBtn.addEventListener('click', loadSources)
loadSources()
