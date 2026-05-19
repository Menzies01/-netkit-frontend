import { useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAppContext } from '../context/AppContext'

export const useSocket = (onStatsUpdate: () => void) => {
  const { dispatch } = useAppContext()
  const socketRef = useRef<Socket | null>(null)
  const lastEmitRef = useRef<number>(0)

  useEffect(() => {
    const socket = io({
      path: '/socket.io',
      transports: ['websocket'],
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    })
    socketRef.current = socket

    socket.on('connect', () => {
      dispatch({ type: 'SOCKET_STATUS', payload: true })
    })

    socket.on('disconnect', () => {
      dispatch({ type: 'SOCKET_STATUS', payload: false })
    })

    socket.on('stats_update', () => {
      const now = Date.now()
      dispatch({ type: 'TICK', payload: now })
      if (now - lastEmitRef.current >= 2000) {
        lastEmitRef.current = now
        onStatsUpdate()
      }
    })

    return () => {
      socket.disconnect()
    }
  }, [dispatch, onStatsUpdate])

  return socketRef
}