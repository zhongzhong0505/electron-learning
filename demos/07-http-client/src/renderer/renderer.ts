  interface Window {
    electronAPI: {
      httpRequest(options: { method: string; url: string; headers?: Record<string, string>; body?: string }): Promise<any>
    }
  }

interface HistoryItem { method: string; url: string; status: number; duration: number; timestamp: number }
const requestHistory: HistoryItem[] = []

const methodSelect = document.getElementById('method') as HTMLSelectElement
const urlInput = document.getElementById('url') as HTMLInputElement
const sendBtn = document.getElementById('send-btn') as HTMLButtonElement
const reqHeaders = document.getElementById('req-headers') as HTMLTextAreaElement
const reqBody = document.getElementById('req-body') as HTMLTextAreaElement
const responseMeta = document.getElementById('response-meta') as HTMLDivElement
const responseBody = document.getElementById('response-body') as HTMLPreElement
const historyList = document.getElementById('history-list') as HTMLUListElement

sendBtn.addEventListener('click', sendRequest)
urlInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') sendRequest() })

async function sendRequest(): Promise<void> {
  const method = methodSelect.value
  const url = urlInput.value.trim()
  if (!url) return

  sendBtn.disabled = true
  sendBtn.textContent = 'Sending...'
  responseMeta.innerHTML = ''
  ;(responseBody.querySelector('code') as HTMLElement).textContent = 'Loading...'

  let headers: Record<string, string> = {}
  try { headers = JSON.parse(reqHeaders.value || '{}') } catch { /* ignore */ }

  const result = await window.electronAPI.httpRequest({
    method, url, headers, body: reqBody.value,
  })

  const statusClass = result.error ? 'error' : result.status < 400 ? 'success' : 'error'
  responseMeta.innerHTML = `
    <span class="status ${statusClass}">${result.status} ${result.statusText}</span>
    <span class="duration">${result.duration}ms</span>
  `
  ;(responseBody.querySelector('code') as HTMLElement).textContent = result.body

  requestHistory.unshift({ method, url, status: result.status, duration: result.duration, timestamp: Date.now() })
  renderHistory()

  sendBtn.disabled = false
  sendBtn.textContent = 'Send'
}

function renderHistory(): void {
  historyList.innerHTML = requestHistory.slice(0, 20).map((item) => `
    <li class="history-item" data-url="${item.url}" data-method="${item.method}">
      <span class="method ${item.method.toLowerCase()}">${item.method}</span>
      <span class="url">${item.url}</span>
      <span class="status">${item.status}</span>
      <span class="duration">${item.duration}ms</span>
    </li>
  `).join('')

  historyList.querySelectorAll('.history-item').forEach((el) => {
    el.addEventListener('click', () => {
      urlInput.value = (el as HTMLElement).dataset.url || ''
      methodSelect.value = (el as HTMLElement).dataset.method || 'GET'
    })
  })
}


