import { useEffect, useState } from 'react'
import { readStoredTheme, systemPrefersDark, writeStoredTheme, type ThemePreference } from '../storage'
import { MoonIcon, SunIcon } from '../icons'

function applyTheme(theme: ThemePreference) {
  document.documentElement.dataset.theme = theme
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<ThemePreference>('light')

  useEffect(() => {
    const initial = readStoredTheme() ?? (systemPrefersDark() ? 'dark' : 'light')
    setTheme(initial)
    applyTheme(initial)
  }, [])

  function toggle() {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    applyTheme(next)
    writeStoredTheme(next)
  }

  return (
    <button type="button" className="icon-button" onClick={toggle} aria-pressed={theme === 'dark'} aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}>
      {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
    </button>
  )
}
