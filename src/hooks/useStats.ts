// src/hooks/useStats.ts
import { useCallback } from 'react'
import axios from 'axios'
import { useAppContext } from '../context/AppContext'
import { SummaryRow, TrafficRow } from '../types'

export const useStats = () => {
  const { dispatch } = useAppContext()

  const fetchSummary = useCallback(async () => {
    try {
      const [summaryRes, devicesRes] = await Promise.all([
        axios.get('/api/stats/summary?minutes=60&limit=20'),
        axios.get('/api/stats/devices?minutes=60'),
      ])
      
      // ✅ Extract domain from top_domains array
      const cleanDevices = (devicesRes.data || []).map((row: any) => {
        // Get the primary domain from top_domains array
        let domain = 'unknown'
        let bytes_in = row.bytes_in || 0
        let bytes_out = row.bytes_out || 0
        
        if (row.top_domains && row.top_domains.length > 0) {
          // Use the first domain in top_domains (usually the most significant)
          const topDomain = row.top_domains[0]
          domain = topDomain.domain || 'unknown'
          
          // If bytes are zero but top_domains has bytes, use those
          if (bytes_out === 0 && topDomain.bytes) {
            bytes_out = topDomain.bytes
          }
          if (bytes_in === 0 && topDomain.bytes) {
            bytes_in = topDomain.bytes
          }
        }
        
        // For summary data (different structure)
        if (row.domain && !domain) {
          domain = row.domain
        }
        
        return {
          device_id: row.device_id || 0,
          ip_address: row.ip_address || 'unknown',
          hostname: row.hostname || null,
          domain: domain,  // Now properly extracted!
          bytes_in: bytes_in,
          bytes_out: bytes_out,
          total_bytes: row.total_bytes || (bytes_in + bytes_out),
          last_seen: row.last_seen || null,
          top_domains: row.top_domains || [],  // Keep for reference
        }
      })
      
      // Also process summary data similarly
      const cleanSummary = (summaryRes.data || []).map((row: any) => ({
        domain: row.domain || 'unknown',
        total: row.total || 0,
        bytes_in: row.bytes_in || 0,
        bytes_out: row.bytes_out || 0,
        records: row.records || 0,
      }))
      
      dispatch({ type: 'SET_SUMMARY', payload: cleanSummary })
      dispatch({ type: 'SET_TRAFFIC_ROWS', payload: cleanDevices })
      
      // Debug: Log to verify
      console.log('Cleaned devices (first row):', cleanDevices[0])
      
    } catch (error) {
      console.error('Failed to fetch stats:', error)
      dispatch({ type: 'SET_SUMMARY', payload: [] })
      dispatch({ type: 'SET_TRAFFIC_ROWS', payload: [] })
    }
  }, [dispatch])

  return { fetchSummary }
}