  interface Window {
    electronAPI: {
      counterGet(): Promise<number>
      counterIncrement(): Promise<number>
      counterDecrement(): Promise<number>
      counterReset(): Promise<number>
      divide(a: number, b: number): Promise<number>
      getSystemInfo(): Promise<any>
      asyncDelay(ms: number): Promise<string>
      onClockTick(callback: (time: string) => void): void
      removeAllListeners(channel: string): void
    }
  }

// Counter
const counterValue = document.getElementById('counter-value') as HTMLDivElement
const btnInc = document.getElementById('btn-inc') as HTMLButtonElement
const btnDec = document.getElementById('btn-dec') as HTMLButtonElement
const btnReset = document.getElementById('btn-reset') as HTMLButtonElement

async function updateCounter(value: number): Promise<void> {
  counterValue.textContent = String(value)
}

btnInc.addEventListener('click', async () => {
  const val = await window.electronAPI.counterIncrement()
  updateCounter(val)
})

btnDec.addEventListener('click', async () => {
  const val = await window.electronAPI.counterDecrement()
  updateCounter(val)
})

btnReset.addEventListener('click', async () => {
  const val = await window.electronAPI.counterReset()
  updateCounter(val)
})

// Clock
window.electronAPI.onClockTick((time) => {
  const date = new Date(time)
  ;(document.getElementById('clock') as HTMLDivElement).textContent = date.toLocaleTimeString()
})

// Error handling
const btnDivide = document.getElementById('btn-divide') as HTMLButtonElement
const divideResult = document.getElementById('divide-result') as HTMLParagraphElement

btnDivide.addEventListener('click', async () => {
  const a = Number((document.getElementById('num-a') as HTMLInputElement).value)
  const b = Number((document.getElementById('num-b') as HTMLInputElement).value)

  try {
    const result = await window.electronAPI.divide(a, b)
    divideResult.textContent = `Result: ${result}`
    divideResult.className = 'result success'
  } catch (error) {
    divideResult.textContent = `Error: ${(error as Error).message}`
    divideResult.className = 'result error'
  }
})

// Async
const btnAsync = document.getElementById('btn-async') as HTMLButtonElement
const asyncResult = document.getElementById('async-result') as HTMLParagraphElement

btnAsync.addEventListener('click', async () => {
  asyncResult.textContent = 'Running...'
  asyncResult.className = 'result'
  btnAsync.setAttribute('disabled', 'true')

  const result = await window.electronAPI.asyncDelay(2000)
  asyncResult.textContent = result
  asyncResult.className = 'result success'
  btnAsync.removeAttribute('disabled')
})

// Initial load
window.electronAPI.counterGet().then(updateCounter)


