import React, { memo, useMemo } from 'react'
import { useAppContext } from '../../context/AppContext'
import { useTheme } from '../../context/ThemeContext'
import { formatBytes } from '../../utils/formatters'

export const StatusBar = memo(() => {
  const { state } = useAppContext()
  const { density } = useTheme()

  const totalBytes = useMemo(
    () => state.trafficRows.reduce((s, r) => s + r.total_bytes, 0),
    [state.trafficRows]
  )
  
  const domains = useMemo(
    () => new Set(state.trafficRows.map(r => r.domain)).size,
    [state.trafficRows]
  )

  const isLoading = state.devices.length === 0 && state.trafficRows.length === 0

  return (
    <div className="flex items-center gap-4 px-3 bg-gray-900 border-t border-gray-800 text-xs text-gray-500 h-6">
      <div className="flex items-center gap-1.5">
        <span className={`w-1.5 h-1.5 rounded-full ${state.socketConnected ? 'bg-green-500' : 'bg-red-500'}`} />
        <span>{state.socketConnected ? 'LIVE' : 'OFFLINE'}</span>
      </div>
      <div>Devices: <span className="text-gray-300">{isLoading ? '—' : state.devices.length}</span></div>
      <div>Domains: <span className="text-gray-300">{isLoading ? '—' : domains}</span></div>
      <div>Session: <span className="text-gray-300">{isLoading ? '—' : formatBytes(totalBytes)}</span></div>
      <div className="ml-auto">{density === 'compact' ? 'COMPACT' : 'COMFORTABLE'}</div>
    </div>
  )
})

StatusBar.displayName = 'StatusBar'