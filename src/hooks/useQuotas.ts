import { useCallback, useState } from 'react'
import axios, { AxiosError } from 'axios'
import { DataQuota, QuotaUsage, CreateQuotaBody, ApiError } from '../types'

interface UseQuotasReturn {
  quotas: DataQuota[]
  fetchQuotas: () => Promise<{ success: boolean; error?: string }>
  fetchQuotaUsage: (id: number) => Promise<QuotaUsage | null>
  createQuota: (body: CreateQuotaBody) => Promise<{ success: boolean; data?: DataQuota; error?: string }>
  updateQuota: (id: number, body: Partial<CreateQuotaBody & { is_active: boolean }>) => Promise<{ success: boolean; error?: string }>
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
      const errorMsg = axiosError.response?.data?.error || axiosError.message || 'Failed to fetch quota usage'
      console.error('Failed to fetch quota usage:', err)
      return null
    }
  }, [])

  const createQuota = useCallback(async (body: CreateQuotaBody): Promise<{ success: boolean; data?: DataQuota; error?: string }> => {
    setLoading(true)
    setError(null)
    try {
      const res = await axios.post<DataQuota>('/api/quotas', body)
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

  const updateQuota = useCallback(async (id: number, body: Partial<CreateQuotaBody & { is_active: boolean }>): Promise<{ success: boolean; error?: string }> => {
    setLoading(true)
    setError(null)
    try {
      await axios.put(`/api/quotas/${id}`, body)
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