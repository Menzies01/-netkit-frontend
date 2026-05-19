import { useCallback } from 'react'
import axios from 'axios'
import { useAppContext } from '../context/AppContext'
import { Device } from '../types'

export const useDevices = () => {
  const { dispatch } = useAppContext()

  const fetchDevices = useCallback(async () => {
    try {
      const res = await axios.get<Device[]>('/api/devices')
      dispatch({ type: 'SET_DEVICES', payload: res.data })
    } catch (error) {
      console.error('Failed to fetch devices:', error)
    }
  }, [dispatch])

  return { fetchDevices }
}