interface Window {
  electronAPI: {
    getCookies(): Promise<any[]>
    setCookie(url: string, name: string, value: string): Promise<void>
    removeCookie(url: string, name: string): Promise<void>
    getCacheSize(): Promise<number>
    clearCache(): Promise<void>
    getRequestLogs(): Promise<any[]>
    clearLogs(): Promise<void>
    testRequest(url: string): Promise<any>
    onRequestLogged(cb: (log: any) => void): void
  }
}

let requestCount = 0

// Tabs
document.querySelectorAll('.tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'))
    document.querySelectorAll('.panel').forEach((p) => p.classList.remove('active'))
    tab.classList.add('active')
    const panelId = 'panel-' + (tab as HTMLElement).dataset.tab
    document.getElementById(panelId)!.classList.add('active')
  })
})

// Requests panel
const requestList = document.getElementById('request-list') as HTMLDivElement
const reqCount = document.getElementById('req-count') as HTMLSpanElement
const testUrl = document.getElementById('test-url') as HTMLInputElement
const testBtn = document.getElementById('test-btn') as HTMLButtonElement
const clearLogsBtn = document.getElementById('clear-logs-btn') as HTMLButtonElement

window.electronAPI.onRequestLogged((log) => {
  requestCount++
  reqCount.textContent = String(requestCount)
  const statusClass = log.status && log.status < 400 ? 'ok' : 'err'
  const entry = `<div class="req-entry">
    <span class="req-status ${statusClass}">${log.status || 'ERR'}</span>
    <span class="req-method">${log.method}</span>
    <span class="req-url">${log.url.substring(0, 80)}</span>
    <span class="req-type">${log.type}</span>
  </div>`
  requestList.innerHTML = entry + requestList.innerHTML
})

testBtn.addEventListener('click', async () => {
  const url = testUrl.value.trim()
  if (url) await window.electronAPI.testRequest(url)
})

testUrl.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') testBtn.click()
})

clearLogsBtn.addEventListener('click', async () => {
  await window.electronAPI.clearLogs()
  requestList.innerHTML = ''
  requestCount = 0
  reqCount.textContent = '0'
})

// Cookies panel
const cookieList = document.getElementById('cookie-list') as HTMLDivElement
const refreshCookiesBtn = document.getElementById('refresh-cookies-btn') as HTMLButtonElement

refreshCookiesBtn.addEventListener('click', loadCookies)

async function loadCookies(): Promise<void> {
  const cookies = await window.electronAPI.getCookies()
  if (cookies.length === 0) {
    cookieList.innerHTML = '<p class="empty">No cookies found</p>'
    return
  }
  cookieList.innerHTML = cookies.map((c: any) => `
    <div class="cookie-entry">
      <span class="cookie-name">${c.name}</span>
      <span class="cookie-domain">${c.domain}</span>
      <span class="cookie-value">${c.value}</span>
    </div>
  `).join('')
}

// Cache panel
const cacheSizeEl = document.getElementById('cache-size') as HTMLElement
const clearCacheBtn = document.getElementById('clear-cache-btn') as HTMLButtonElement

async function loadCacheSize(): Promise<void> {
  const size = await window.electronAPI.getCacheSize()
  cacheSizeEl.textContent = (size / 1024 / 1024).toFixed(2) + ' MB'
}

clearCacheBtn.addEventListener('click', async () => {
  await window.electronAPI.clearCache()
  loadCacheSize()
})

// Initial
loadCacheSize()
loadCookies()
