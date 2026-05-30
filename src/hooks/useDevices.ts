import { useCallback, useState } from 'react'
import axios from 'axios'
import { useAppContext } from '../context/AppContext'
import { Device, ApiError } from '../types'

interface UseDevicesReturn {
  fetchDevices: () => Promise<{ success: boolean; error?: string }>
  loading: boolean
  error: string | null
}

export const useDevices = (): UseDevicesReturn => {
  const { dispatch } = useAppContext()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchDevices = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    setLoading(true)
    setError(null)
    try {
      const res = await axios.get<Device[]>('/api/devices')
      dispatch({ type: 'SET_DEVICES', payload: res.data })
      return { success: true }
    } catch (err) {
      let errorMsg = 'Failed to fetch devices'
      if (axios.isAxiosError(err)) {
        const axiosError = err as import('axios').AxiosError<ApiError>
        errorMsg = axiosError.response?.data?.error || axiosError.message || errorMsg
      } else if (err instanceof Error) {
        errorMsg = err.message
      }
      setError(errorMsg)
      console.error('Failed to fetch devices:', err)
      return { success: false, error: errorMsg }
    } finally {
      setLoading(false)
    }
  }, [dispatch])

  return { fetchDevices, loading, error }
}