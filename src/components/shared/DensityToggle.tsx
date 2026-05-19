import React, { memo } from 'react'
import { useTheme } from '../../context/ThemeContext'

export const DensityToggle = memo(() => {
  const { density, setDensity } = useTheme()
  return (
    <div className="flex rounded overflow-hidden border border-gray-700">
      <button
        onClick={() => setDensity('compact')}
        className={`px-2 py-0.5 text-xs transition-colors ${
          density === 'compact' ? 'bg-gray-700 text-gray-200' : 'bg-gray-800 text-gray-500 hover:text-gray-300'
        }`}
      >
        COMPACT
      </button>
      <button
        onClick={() => setDensity('comfortable')}
        className={`px-2 py-0.5 text-xs transition-colors ${
          density === 'comfortable' ? 'bg-gray-700 text-gray-200' : 'bg-gray-800 text-gray-500 hover:text-gray-300'
        }`}
      >
        COMFORT
      </button>
    </div>
  )
})

DensityToggle.displayName = 'DensityToggle'