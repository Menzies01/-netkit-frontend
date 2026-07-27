import { useCallback, useState } from 'react'
import axios, { AxiosError } from 'axios'
import { DataQuota, QuotaUsage, CreateQuotaData, UpdateQuotaData, ApiError } from '../types'

interface UseQuotasReturn {
  quotas: DataQuota[]
  fetchQuotas: () => Promise<{ success: boolean; error?: string }>
  fetchQuotaUsage: (id: number) => Promise<QuotaUsage | null>
  createQuota: (body: CreateQuotaData) => Promise<{ success: boolean; data?: DataQuota; error?: string }>
  updateQuota: (id: number, body: UpdateQuotaData) => Promise<{ success: boolean; error?: string }>
  resetQuota: (id: number) => Promise<{ success: boolean; error?: string }>
  deleteQuota: (id: number) => Promise<{ success: boolean; error?: string }>
  loading: boolean
  error: string | null
}

export const useQuotas = (): UseQuotasReturn => {
  const [quotas, setQuotas] = useState<DataQuota[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchQuotas = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    setLoading(true)
    setError(null)
    try {
      const res = await axios.get<DataQuota[]>('/api/quotas')
      setQuotas(res.data)
      return { success: true }
    } catch (err) {
      const axiosError = err as AxiosError<ApiError>
      const errorMsg = axiosError.response?.data?.error || axiosError.message || 'Failed to fetch quotas'
      setError(errorMsg)
      console.error('Failed to fetch quotas:', err)
      return { success: false, error: errorMsg }
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchQuotaUsage = useCallback(async (id: number): Promise<QuotaUsage | null> => {
    try {
      const res = await axios.get<QuotaUsage>(`/api/quotas/${id}/usage`)
      return res.data
    } catch (err) {
      const axiosError = err as AxiosError<ApiError>
      console.error('Failed to fetch quota usage:', err)
      return null
    }
  }, [])

  const createQuota = useCallback(async (body: CreateQuotaData): Promise<{ success: boolean; data?: DataQuota; error?: string }> => {
    setLoading(true)
    setError(null)
    try {
      const requestBody: Record<string, unknown> = {
        name: body.name,
        domain: body.domain,
      }
      
      // Prefer device_mac, fallback to device_ip
      if (body.device_mac) {
        requestBody.device_mac = body.device_mac
      } else if (body.device_ip) {
        requestBody.device_ip = body.device_ip
      }
      
      if (body.limit_gb !== undefined) {
        requestBody.limit_gb = body.limit_gb
      } else if (body.limit_bytes !== undefined) {
        requestBody.limit_bytes = body.limit_bytes
      }
      
      if (body.reset_period) {
        requestBody.reset_period = body.reset_period
      }
      
      const res = await axios.post<DataQuota>('/api/quotas', requestBody)
      await fetchQuotas()
      return { success: true, data: res.data }
    } catch (err) {
      const axiosError = err as AxiosError<ApiError>
      const errorMsg = axiosError.response?.data?.error || axiosError.message || 'Failed to create quota'
      setError(errorMsg)
      console.error('Failed to create quota:', err)
      return { success: false, error: errorMsg }
    } finally {
      setLoading(false)
    }
  }, [fetchQuotas])

  const updateQuota = useCallback(async (id: number, body: UpdateQuotaData): Promise<{ success: boolean; error?: string }> => {
    setLoading(true)
    setError(null)
    try {
      const updatePayload: Record<string, unknown> = {}
      
      if (body.name !== undefined) updatePayload.name = body.name
      if (body.device_mac !== undefined) updatePayload.device_mac = body.device_mac
      if (body.device_ip !== undefined) updatePayload.device_ip = body.device_ip
      if (body.domain !== undefined) updatePayload.domain = body.domain
      if (body.limit_gb !== undefined) updatePayload.limit_gb = body.limit_gb
      if (body.limit_bytes !== undefined) updatePayload.limit_bytes = body.limit_bytes
      if (body.reset_period !== undefined) updatePayload.reset_period = body.reset_period
      if (body.is_active !== undefined) updatePayload.is_active = body.is_active
      
      await axios.put(`/api/quotas/${id}`, updatePayload)
      await fetchQuotas()
      return { success: true }
    } catch (err) {
      const axiosError = err as AxiosError<ApiError>
      const errorMsg = axiosError.response?.data?.error || axiosError.message || 'Failed to update quota'
      setError(errorMsg)
      console.error('Failed to update quota:', err)
      return { success: false, error: errorMsg }
    } finally {
      setLoading(false)
    }
  }, [fetchQuotas])

  const resetQuota = useCallback(async (id: number): Promise<{ success: boolean; error?: string }> => {
    setLoading(true)
    setError(null)
    try {
      await axios.post(`/api/quotas/${id}/reset`)
      await fetchQuotas()
      return { success: true }
    } catch (err) {
      const axiosError = err as AxiosError<ApiError>
      const errorMsg = axiosError.response?.data?.error || axiosError.message || 'Failed to reset quota'
      setError(errorMsg)
      console.error('Failed to reset quota:', err)
      return { success: false, error: errorMsg }
    } finally {
      setLoading(false)
    }
  }, [fetchQuotas])

  const deleteQuota = useCallback(async (id: number): Promise<{ success: boolean; error?: string }> => {
    setLoading(true)
    setError(null)
    try {
      await axios.delete(`/api/quotas/${id}`)
      await fetchQuotas()
      return { success: true }
    } catch (err) {
      const axiosError = err as AxiosError<ApiError>
      const errorMsg = axiosError.response?.data?.error || axiosError.message || 'Failed to delete quota'
      setError(errorMsg)
      console.error('Failed to delete quota:', err)
      return { success: false, error: errorMsg }
    } finally {
      setLoading(false)
    }
  }, [fetchQuotas])

  return {
    quotas,
    fetchQuotas,
    fetchQuotaUsage,
    createQuota,
    updateQuota,
    resetQuota,
    deleteQuota,
    loading,
    error,
  }
}