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
    // Store in localStorage for persistence
    localStorage.setItem('netkit-density', d)
  }

  // Load saved preference on mount
  useEffect(() => {
    const saved = localStorage.getItem('netkit-density') as Density | null
    if (saved && (saved === 'compact' || saved === 'comfortable')) {
      setDensityState(saved)
    }
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