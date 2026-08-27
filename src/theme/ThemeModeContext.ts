import { createContext, useContext } from 'react'

export type ThemeModeValue = { theme: string; mode: 'light' | 'dark' }

export const ThemeModeContext = createContext<ThemeModeValue>({ theme: 'default', mode: 'light' })

export function useThemeMode() {
  return useContext(ThemeModeContext)
}
