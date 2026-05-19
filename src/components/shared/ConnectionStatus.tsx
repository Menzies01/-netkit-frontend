import React, { memo, useState, useEffect } from 'react'
import { useAppContext } from '../../context/AppContext'

export const ConnectionStatus = memo(() => {
  const { state } = useAppContext()
  const [seconds, setSeconds] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds(Math.floor((Date.now() - state.lastUpdate) / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [state.lastUpdate])

  return (
    <div className="flex items-center gap-1.5 text-xs">
      <span className={`w-1.5 h-1.5 rounded-full ${state.socketConnected ? 'bg-green-500' : 'bg-red-500'}`} />
      <span className="text-gray-400">
        {state.socketConnected ? `${seconds}s` : 'offline'}
      </span>
    </div>
  )
})

ConnectionStatus.displayName = 'ConnectionStatus'