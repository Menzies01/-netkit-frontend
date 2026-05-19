import { useCallback } from 'react'
import axios from 'axios'
import { useAppContext } from '../context/AppContext'
import { SummaryRow, TrafficRow } from '../types'

export const useStats = () => {
  const { dispatch } = useAppContext()

  const fetchSummary = useCallback(async () => {
    try {
      const [summaryRes, devicesRes] = await Promise.all([
        axios.get<SummaryRow[]>('/api/stats/summary?minutes=60&limit=20'),
        axios.get<TrafficRow[]>('/api/stats/devices?minutes=60'),
      ])
      dispatch({ type: 'SET_SUMMARY', payload: summaryRes.data })
      dispatch({ type: 'SET_TRAFFIC_ROWS', payload: devicesRes.data })
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }, [dispatch])

  return { fetchSummary }
}