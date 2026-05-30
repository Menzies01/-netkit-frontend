// src/hooks/useStats.ts
import { useCallback, useState } from 'react'
import axios from 'axios'
import { useAppContext } from '../context/AppContext'
import { SummaryRow, TrafficRow, Device } from '../types'

interface UseStatsReturn {
  fetchSummary: (minutes?: number) => Promise<void>
  fetchDeviceTraffic: (deviceId: number, minutes?: number) => Promise<TrafficRow[]>
  loading: boolean
  error: string | null
}

export const useStats = (): UseStatsReturn => {
  const { dispatch } = useAppContext()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchSummary = useCallback(async (minutes: number = 60) => {
    setLoading(true)
    setError(null)
    try {
      const [summaryRes, devicesRes] = await Promise.all([
        axios.get(`/api/stats/summary?minutes=${minutes}&limit=20`),
        axios.get(`/api/stats/devices?minutes=${minutes}`),
      ])
      
      // Clean summary data - this is correct
      const cleanSummary: SummaryRow[] = (summaryRes.data || []).map((row: any) => ({
        domain: row.domain || 'unknown',
        total: row.total || 0,
        bytes_in: row.bytes_in || 0,
        bytes_out: row.bytes_out || 0,
        records: row.records || 0,
      }))
      
      // For devices: each row is a device aggregate
      // The VirtualTable expects TrafficRow[], but we need to decide:
      // Option 1: Show one row per device (this is what the API provides)
      // Option 2: Fetch timeseries for domain-level data
      // 
      // Since TrafficRow requires a domain field, we'll create a synthetic
      // row per device using "all" as the domain, or fetch per-device top domain
      const cleanDevices: TrafficRow[] = (devicesRes.data || []).map((device: any) => {
        // Get the top domain from top_domains if available
        let topDomain = 'all'
        let topDomainBytes = 0
        
        if (device.top_domains && device.top_domains.length > 0) {
          const top = device.top_domains[0]
          topDomain = top.domain || 'all'
          topDomainBytes = top.bytes || 0
        }
        
        return {
          device_id: device.device_id || 0,
          ip_address: device.ip_address || 'unknown',
          hostname: device.hostname || null,
          domain: topDomain,  // Use top domain or 'all' as placeholder
          bytes_in: device.bytes_in || 0,
          bytes_out: device.bytes_out || 0,
          total_bytes: device.total_bytes || (device.bytes_in + device.bytes_out),
          last_seen: device.last_seen || null,
          top_domains: device.top_domains || [],
        }
      })
      
      dispatch({ type: 'SET_SUMMARY', payload: cleanSummary })
      dispatch({ type: 'SET_TRAFFIC_ROWS', payload: cleanDevices })
      
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch stats'
      setError(errorMsg)
      console.error('Failed to fetch stats:', err)
      dispatch({ type: 'SET_SUMMARY', payload: [] })
      dispatch({ type: 'SET_TRAFFIC_ROWS', payload: [] })
    } finally {
      setLoading(false)
    }
  }, [dispatch])

  // New function to fetch per-device timeseries data for domain-level detail
  const fetchDeviceTraffic = useCallback(async (deviceId: number, minutes: number = 60): Promise<TrafficRow[]> => {
    setLoading(true)
    setError(null)
    try {
      const res = await axios.get(`/api/stats/timeseries?device_id=${deviceId}&minutes=${minutes}`)
      
      // Transform timeseries data into TrafficRow format
      // Each record has device_id, domain, bytes_in, bytes_out, recorded_at
      const rows: TrafficRow[] = (res.data || []).map((record: any) => ({
        device_id: record.device_id,
        ip_address: '',  // Will be filled from device cache if needed
        hostname: null,
        domain: record.domain || 'unknown',
        bytes_in: record.bytes_in || 0,
        bytes_out: record.bytes_out || 0,
        total_bytes: (record.bytes_in || 0) + (record.bytes_out || 0),
        last_seen: record.recorded_at || null,
      }))
      
      return rows
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch device traffic'
      setError(errorMsg)
      console.error('Failed to fetch device traffic:', err)
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  return { fetchSummary, fetchDeviceTraffic, loading, error }
}