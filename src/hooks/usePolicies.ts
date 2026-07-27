import { useCallback, useState } from 'react'
import axios, { AxiosError } from 'axios'
import { useAppContext } from '../context/AppContext'
import { Policy, CreatePolicyData, UpdatePolicyData, ApiError } from '../types'

interface UsePoliciesReturn {
  fetchPolicies: () => Promise<void>
  createPolicy: (body: CreatePolicyData) => Promise<{ success: boolean; error?: string }>
  updatePolicy: (id: number, body: UpdatePolicyData) => Promise<{ success: boolean; error?: string }>
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

  const createPolicy = useCallback(async (body: CreatePolicyData): Promise<{ success: boolean; error?: string }> => {
    setLoading(true)
    setError(null)
    try {
      const requestBody: Record<string, unknown> = {
        name: body.name,
        action: body.action,
      }

      if (body.device_mac) {
        requestBody.device_mac = body.device_mac
      } else if (body.device_ip) {
        requestBody.device_ip = body.device_ip
      }

      if (body.domain) requestBody.domain = body.domain
      if (body.rate_kbps !== undefined && body.rate_kbps !== null) requestBody.rate_kbps = body.rate_kbps
      if (body.description) requestBody.description = body.description

      // Priority fields - CRITICAL
      if (body.priority_level) {
        requestBody.priority_level = body.priority_level
      }
      if (body.min_bandwidth_kbps !== undefined) {
        requestBody.min_bandwidth_kbps = body.min_bandwidth_kbps
      }
      if (body.max_bandwidth_kbps !== undefined) {
        requestBody.max_bandwidth_kbps = body.max_bandwidth_kbps
      }
      if (body.burst_kb !== undefined) {
        requestBody.burst_kb = body.burst_kb
      }

      console.log('Creating policy with body:', requestBody)

      await axios.post<Policy>('/api/policies', requestBody)
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

  const updatePolicy = useCallback(async (id: number, body: UpdatePolicyData): Promise<{ success: boolean; error?: string }> => {
    setLoading(true)
    setError(null)
    try {
      const updatePayload: Record<string, unknown> = {}

      if (body.name !== undefined) updatePayload.name = body.name
      if (body.description !== undefined) updatePayload.description = body.description
      if (body.device_mac !== undefined) updatePayload.device_mac = body.device_mac
      if (body.device_ip !== undefined) updatePayload.device_ip = body.device_ip
      if (body.domain !== undefined) updatePayload.domain = body.domain
      if (body.action !== undefined) updatePayload.action = body.action
      if (body.rate_kbps !== undefined) updatePayload.rate_kbps = body.rate_kbps
      if (body.is_active !== undefined) updatePayload.is_active = body.is_active
      if (body.priority_level !== undefined) updatePayload.priority_level = body.priority_level
      if (body.min_bandwidth_kbps !== undefined) updatePayload.min_bandwidth_kbps = body.min_bandwidth_kbps
      if (body.max_bandwidth_kbps !== undefined) updatePayload.max_bandwidth_kbps = body.max_bandwidth_kbps

      await axios.put(`/api/policies/${id}`, updatePayload)
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