import { useDialKit } from 'dialkit'
import { useEffect, type ReactNode } from 'react'
import themes from '@animation-playground/design-tokens/themes.json'
import { ThemeModeContext } from './ThemeModeContext'

const themeOptions = themes.map((t) => ({ value: t.id, label: t.label }))

/** Owns the global theme/mode dial and reflects it onto `data-theme`/
 * `data-mode` on <html>, which the generated design-tokens CSS keys off of —
 * the actual color switching happens in CSS, not React. Exposes the current
 * values via context so demos can key their own entrance animations off the
 * same change without each registering a competing dial panel. */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const { theme, mode } = useDialKit('Theme & Mode', {
    theme: { type: 'select', options: themeOptions, default: 'default' },
    mode: { type: 'select', options: ['light', 'dark'], default: 'light' },
  })

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.documentElement.dataset.mode = mode
  }, [theme, mode])

  return (
    <ThemeModeContext.Provider value={{ theme, mode: mode as 'light' | 'dark' }}>
      {children}
    </ThemeModeContext.Provider>
  )
}
