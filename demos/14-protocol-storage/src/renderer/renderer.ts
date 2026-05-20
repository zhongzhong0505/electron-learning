interface Window {
  electronAPI: {
    storeSet(key: string, value: string): Promise<void>
    storeGet(key: string): Promise<string | null>
    storeGetAll(): Promise<Array<{ key: string; hasValue: boolean }>>
    storeDelete(key: string): Promise<void>
    isEncryptionAvailable(): Promise<boolean>
  }
}

const keyInput = document.getElementById('key-input') as HTMLInputElement
const valueInput = document.getElementById('value-input') as HTMLInputElement
const saveBtn = document.getElementById('save-btn') as HTMLButtonElement
const getKeyInput = document.getElementById('get-key-input') as HTMLInputElement
const getBtn = document.getElementById('get-btn') as HTMLButtonElement
const retrievedValue = document.getElementById('retrieved-value') as HTMLDivElement
const refreshBtn = document.getElementById('refresh-btn') as HTMLButtonElement
const keysList = document.getElementById('keys-list') as HTMLDivElement
const encryptionStatus = document.getElementById('encryption-status') as HTMLDivElement

// Check encryption
;(async () => {
  const available = await window.electronAPI.isEncryptionAvailable()
  encryptionStatus.textContent = available
    ? '✅ OS-level encryption is available (Keychain/DPAPI/SecretService)'
    : '⚠️ Encryption not available — using base64 fallback'
  encryptionStatus.className = 'status ' + (available ? 'ok' : 'warn')
})()

// Save
saveBtn.addEventListener('click', async () => {
  const key = keyInput.value.trim()
  const value = valueInput.value
  if (!key || !value) return
  await window.electronAPI.storeSet(key, value)
  keyInput.value = ''
  valueInput.value = ''
  loadKeys()
})

// Get
getBtn.addEventListener('click', async () => {
  const key = getKeyInput.value.trim()
  if (!key) return
  const value = await window.electronAPI.storeGet(key)
  if (value !== null) {
    retrievedValue.textContent = `Value: ${value}`
    retrievedValue.className = 'value-display show'
  } else {
    retrievedValue.textContent = 'Key not found'
    retrievedValue.className = 'value-display show error'
  }
})

// List keys
refreshBtn.addEventListener('click', loadKeys)

async function loadKeys(): Promise<void> {
  const keys = await window.electronAPI.storeGetAll()
  if (keys.length === 0) {
    keysList.innerHTML = '<p class="empty">No stored secrets</p>'
    return
  }
  keysList.innerHTML = keys.map((k: any) => `
    <div class="key-item">
      <span class="key-name">🔑 ${k.key}</span>
      <button onclick="deleteKey('${k.key}')">Delete</button>
    </div>
  `).join('')
}

// Global delete function for inline onclick
;(window as any).deleteKey = async (key: string) => {
  await window.electronAPI.storeDelete(key)
  loadKeys()
}

loadKeys()
