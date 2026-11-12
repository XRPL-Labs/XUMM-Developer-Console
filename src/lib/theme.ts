import { useEffect, useState } from 'react'

export type Theme = 'system' | 'light' | 'dark'

const media = () => window.matchMedia('(prefers-color-scheme: dark)')

const read = (): Theme => {
  try {
    const t = localStorage.getItem('theme')
    return t === 'light' || t === 'dark' ? t : 'system'
  } catch {
    return 'system'
  }
}

const apply = (theme: Theme) => {
  document.documentElement.classList.toggle('dark', theme === 'dark' || (theme === 'system' && media().matches))
}

export const useTheme = () => {
  const [theme, setThemeState] = useState<Theme>(read)

  useEffect(() => {
    apply(theme)
    if (theme !== 'system') return
    const onChange = () => apply('system')
    media().addEventListener('change', onChange)
    return () => media().removeEventListener('change', onChange)
  }, [theme])

  const setTheme = (next: Theme) => {
    try {
      localStorage.setItem('theme', next)
    } catch {
      // Private mode: the theme lasts for this page view
    }
    setThemeState(next)
  }

  return { theme, setTheme }
}
