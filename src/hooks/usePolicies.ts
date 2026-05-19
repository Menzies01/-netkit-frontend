import { useCallback } from 'react'
import axios from 'axios'
import { useAppContext } from '../context/AppContext'
import { Policy } from '../types'

export const usePolicies = () => {
  const { dispatch } = useAppContext()

  const fetchPolicies = useCallback(async () => {
    try {
      const res = await axios.get<Policy[]>('/api/policies')
      dispatch({ type: 'SET_POLICIES', payload: res.data })
    } catch (error) {
      console.error('Failed to fetch policies:', error)
    }
  }, [dispatch])

  const createPolicy = useCallback(async (body: Partial<Policy>) => {
    await axios.post<Policy>('/api/policies', body)
    await fetchPolicies()
  }, [fetchPolicies])

  const updatePolicy = useCallback(async (id: number, body: Partial<Policy>) => {
    await axios.put(`/api/policies/${id}`, body)
    await fetchPolicies()
  }, [fetchPolicies])

  const deletePolicy = useCallback(async (id: number) => {
    await axios.delete(`/api/policies/${id}`)
    await fetchPolicies()
  }, [fetchPolicies])

  return { fetchPolicies, createPolicy, updatePolicy, deletePolicy }
}