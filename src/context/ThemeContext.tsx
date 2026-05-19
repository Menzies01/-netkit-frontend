import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Density } from '../types'

interface ThemeContextValue {
  density: Density
  setDensity: (d: Density) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [density, setDensityState] = useState<Density>('comfortable')

  const setDensity = (d: Density) => {
    setDensityState(d)
    const root = document.documentElement
    if (d === 'compact') {
      root.style.setProperty('--row-height', '28px')
      root.style.setProperty('--row-font', '11px')
      root.style.setProperty('--row-padding', '4px')
    } else {
      root.style.setProperty('--row-height', '44px')
      root.style.setProperty('--row-font', '13px')
      root.style.setProperty('--row-padding', '8px')
    }
  }

  useEffect(() => {
    setDensity('comfortable')
  }, [])

  return (
    <ThemeContext.Provider value={{ density, setDensity }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = (): ThemeContextValue => {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}