import React, { memo } from 'react'
import { useAppContext } from '../../context/AppContext'
import { useTheme } from '../../context/ThemeContext'
import { formatBytes } from '../../utils/formatters'

export const StatusBar = memo(() => {
  const { state } = useAppContext()
  const { density } = useTheme()

  const totalBytes = state.trafficRows.reduce((s, r) => s + r.total_bytes, 0)
  const domains = new Set(state.trafficRows.map(r => r.domain)).size

  return (
    <div className="flex items-center gap-4 px-3 bg-gray-900 border-t border-gray-800 text-xs text-gray-500 h-6">
      <div className="flex items-center gap-1.5">
        <span className={`w-1.5 h-1.5 rounded-full ${state.socketConnected ? 'bg-green-500' : 'bg-red-500'}`} />
        <span>{state.socketConnected ? 'LIVE' : 'OFFLINE'}</span>
      </div>
      <div>Devices: <span className="text-gray-300">{state.devices.length}</span></div>
      <div>Domains: <span className="text-gray-300">{domains}</span></div>
      <div>Session: <span className="text-gray-300">{formatBytes(totalBytes)}</span></div>
      <div className="ml-auto">{density === 'compact' ? 'COMPACT' : 'COMFORTABLE'}</div>
    </div>
  )
})

StatusBar.displayName = 'StatusBar'