import { useEffect, useRef, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAppContext } from '../context/AppContext'

export const useSocket = (onStatsUpdate: () => void) => {
  const { dispatch } = useAppContext()
  const socketRef = useRef<Socket | null>(null)
  const lastEmitRef = useRef<number>(0)
  const onStatsUpdateRef = useRef(onStatsUpdate)

  // Keep ref updated to avoid effect re-runs
  useEffect(() => {
    onStatsUpdateRef.current = onStatsUpdate
  }, [onStatsUpdate])

  useEffect(() => {
    const socket = io(window.location.origin, {
      path: '/socket.io',
      transports: ['websocket'],
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 10,
      timeout: 10000,
    })
    socketRef.current = socket

    socket.on('connect', () => {
      console.log('[Socket.IO] Connected')
      dispatch({ type: 'SOCKET_STATUS', payload: true })
    })

    socket.on('disconnect', (reason) => {
      console.log('[Socket.IO] Disconnected:', reason)
      dispatch({ type: 'SOCKET_STATUS', payload: false })
    })

    socket.on('reconnect', (attemptNumber) => {
      console.log('[Socket.IO] Reconnected after', attemptNumber, 'attempts')
      dispatch({ type: 'SOCKET_STATUS', payload: true })
    })

    socket.on('reconnect_failed', () => {
      console.error('[Socket.IO] Reconnection failed')
      dispatch({ type: 'SOCKET_STATUS', payload: false })
    })

    socket.on('connect_error', (error) => {
      console.error('[Socket.IO] Connection error:', error.message)
      dispatch({ type: 'SOCKET_STATUS', payload: false })
    })

    socket.on('stats_update', () => {
      const now = Date.now()
      dispatch({ type: 'TICK', payload: now })
      // Always call the latest callback via ref
      if (now - lastEmitRef.current >= 2000) {
        lastEmitRef.current = now
        onStatsUpdateRef.current()
      }
    })

    return () => {
      if (socket.connected) {
        socket.disconnect()
      }
      socketRef.current = null
    }
  }, [dispatch]) // Only dispatch as dependency - onStatsUpdate is handled via ref

  return socketRef
}