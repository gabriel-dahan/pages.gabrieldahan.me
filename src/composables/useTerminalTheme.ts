import { ref, watch } from 'vue'

export type TerminalTheme = 'sage' | 'sand'

const STORAGE_KEY = 'term-phosphor'

const theme = ref<TerminalTheme>('sage')
let initialized = false

function normalizeStored(value: string | null): TerminalTheme | null {
  if (value === 'sage' || value === 'sand') return value
  if (value === 'green') return 'sage'
  if (value === 'amber') return 'sand'
  return null
}

function applyTheme(value: TerminalTheme) {
  document.documentElement.setAttribute('data-theme', value)
}

function initTheme() {
  if (initialized || typeof window === 'undefined') return
  initialized = true

  const stored = normalizeStored(localStorage.getItem(STORAGE_KEY))
  if (stored) {
    theme.value = stored
  }
  applyTheme(theme.value)

  watch(theme, (value) => {
    applyTheme(value)
    localStorage.setItem(STORAGE_KEY, value)
  })
}

export function useTerminalTheme() {
  initTheme()

  function setTheme(value: TerminalTheme) {
    theme.value = value
  }

  function toggleTheme() {
    theme.value = theme.value === 'sage' ? 'sand' : 'sage'
  }

  return {
    theme,
    setTheme,
    toggleTheme,
  }
}
