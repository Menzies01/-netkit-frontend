import { useCallback, useState } from 'react'
import axios, { AxiosError } from 'axios'
import { useAppContext } from '../context/AppContext'
import { Policy, ApiError } from '../types'

interface CreatePolicyBody {
  name: string
  device_ip: string | null
  domain: string | null
  action: 'limit' | 'block'
  rate_kbps: number | null
}

interface UsePoliciesReturn {
  fetchPolicies: () => Promise<void>
  createPolicy: (body: CreatePolicyBody) => Promise<{ success: boolean; error?: string }>
  updatePolicy: (id: number, body: Partial<Policy>) => Promise<{ success: boolean; error?: string }>
  deletePolicy: (id: number) => Promise<{ success: boolean; error?: string }>
  loading: boolean
  error: string | null
}

export const usePolicies = (): UsePoliciesReturn => {
  const { dispatch } = useAppContext()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchPolicies = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await axios.get<Policy[]>('/api/policies')
      dispatch({ type: 'SET_POLICIES', payload: res.data })
    } catch (err) {
      const axiosError = err as AxiosError<ApiError>
      const errorMsg = axiosError.response?.data?.error || axiosError.message || 'Failed to fetch policies'
      setError(errorMsg)
      console.error('Failed to fetch policies:', err)
    } finally {
      setLoading(false)
    }
  }, [dispatch])

  const createPolicy = useCallback(async (body: CreatePolicyBody): Promise<{ success: boolean; error?: string }> => {
    setLoading(true)
    setError(null)
    try {
      await axios.post<Policy>('/api/policies', body)
      await fetchPolicies()
      return { success: true }
    } catch (err) {
      const axiosError = err as AxiosError<ApiError>
      const errorMsg = axiosError.response?.data?.error || axiosError.message || 'Failed to create policy'
      setError(errorMsg)
      console.error('Failed to create policy:', err)
      return { success: false, error: errorMsg }
    } finally {
      setLoading(false)
    }
  }, [fetchPolicies])

  const updatePolicy = useCallback(async (id: number, body: Partial<Policy>): Promise<{ success: boolean; error?: string }> => {
    setLoading(true)
    setError(null)
    try {
      await axios.put(`/api/policies/${id}`, body)
      await fetchPolicies()
      return { success: true }
    } catch (err) {
      const axiosError = err as AxiosError<ApiError>
      const errorMsg = axiosError.response?.data?.error || axiosError.message || 'Failed to update policy'
      setError(errorMsg)
      console.error('Failed to update policy:', err)
      return { success: false, error: errorMsg }
    } finally {
      setLoading(false)
    }
  }, [fetchPolicies])

  const deletePolicy = useCallback(async (id: number): Promise<{ success: boolean; error?: string }> => {
    setLoading(true)
    setError(null)
    try {
      await axios.delete(`/api/policies/${id}`)
      await fetchPolicies()
      return { success: true }
    } catch (err) {
      const axiosError = err as AxiosError<ApiError>
      const errorMsg = axiosError.response?.data?.error || axiosError.message || 'Failed to delete policy'
      setError(errorMsg)
      console.error('Failed to delete policy:', err)
      return { success: false, error: errorMsg }
    } finally {
      setLoading(false)
    }
  }, [fetchPolicies])

  return { fetchPolicies, createPolicy, updatePolicy, deletePolicy, loading, error }
}