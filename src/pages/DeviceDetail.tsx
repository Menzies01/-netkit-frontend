import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import axios from 'axios'
import { useAppContext } from '../context/AppContext'
import { useSocket } from '../hooks/useSocket'
import { DevicePie } from '../components/charts/DevicePie'
import { ThroughputLine } from '../components/charts/ThroughputLine'
import { VirtualTable } from '../components/table/VirtualTable'
import { DetailPane } from '../components/detail/DetailPane'
import { ByteDisplay } from '../components/shared/ByteDisplay'
import { TrafficRow, SortState } from '../types'
import { formatTimestamp } from '../utils/formatters'

export const DeviceDetail = () => {
  const { id } = useParams<{ id: string }>()
  const { state, dispatch } = useAppContext()
  const [deviceRows, setDeviceRows] = useState<TrafficRow[]>([])
  const [sort, setSort] = useState<SortState | null>(null)
  const throughputBuf = useRef<Map<number, number>>(new Map())
  const [triggerVal, setTriggerVal] = useState(0)
  const [totalBytes, setTotalBytes] = useState(0)

  const device = useMemo(
    () => state.devices.find(d => d.id === Number(id)),
    [state.devices, id]
  )

  // src/pages/DeviceDetail.tsx - Update the fetchDeviceStats function
const fetchDeviceStats = useCallback(async () => {
  if (!id) return
  try {
    const res = await axios.get<TrafficRow[]>(`/api/stats?device_id=${id}&minutes=60`)
    
    // Extract domain from top_domains if needed
    const processedRows = (res.data || []).map((row: any) => {
      let domain = row.domain || 'unknown'
      let bytes_in = row.bytes_in || 0
      let bytes_out = row.bytes_out || 0
      
      if (row.top_domains && row.top_domains.length > 0 && (!domain || domain === 'unknown')) {
        const topDomain = row.top_domains[0]
        domain = topDomain.domain || 'unknown'
        if (bytes_out === 0 && topDomain.bytes) bytes_out = topDomain.bytes
        if (bytes_in === 0 && topDomain.bytes) bytes_in = topDomain.bytes
      }
      
      return {
        ...row,
        domain: domain,
        bytes_in: bytes_in,
        bytes_out: bytes_out,
        total_bytes: row.total_bytes || (bytes_in + bytes_out),
      }
    })
    
    setDeviceRows(processedRows)
    // ... rest of the code
  } catch (error) {
    console.error('Failed to fetch device stats:', error)
  }
}, [id])

  useEffect(() => {
    fetchDeviceStats()
  }, [fetchDeviceStats])

  useSocket(fetchDeviceStats)

  const handleSort = useCallback((col: keyof TrafficRow) => {
    setSort(prev =>
      prev?.column === col
        ? { column: col, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
        : { column: col, direction: 'desc' }
    )
  }, [])

  const selectedRow = useMemo(() => {
    if (!state.selectedKey) return null
    const [ip, domain] = state.selectedKey.split('::')
    return deviceRows.find(r => r.ip_address === ip && r.domain === domain) ?? null
  }, [state.selectedKey, deviceRows])

  if (!device) {
    return <div className="flex items-center justify-center h-full">Device not found</div>
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-gray-950">
      <div className="flex items-center gap-3 px-4 py-2 border-b border-gray-800 bg-gray-900">
        <Link to="/" className="text-gray-500 hover:text-gray-300 text-sm">← Back</Link>
        <div>
          <div className="font-semibold">{device.hostname || `Device ${id}`}</div>
          <div className="text-xs text-gray-500 font-mono">{device.ip_address}</div>
        </div>
        <div className="ml-auto flex gap-4 text-sm">
          <div>
            <div className="text-xs text-gray-500">↓ In</div>
            <ByteDisplay value={device.bytes_in} className="text-emerald-400" />
          </div>
          <div>
            <div className="text-xs text-gray-500">↑ Out</div>
            <ByteDisplay value={device.bytes_out} className="text-blue-400" />
          </div>
        </div>
      </div>

      <div className="flex border-b border-gray-800">
        <div className="flex-1 p-3 border-r border-gray-800">
          <div className="text-xs text-gray-500 mb-2">TRAFFIC BY DOMAIN</div>
          <DevicePie rows={deviceRows} />
        </div>
        <div className="w-80 p-3">
          <div className="text-xs text-gray-500 mb-2">THROUGHPUT (10 MIN)</div>
          <ThroughputLine triggerValue={triggerVal} totalBytes={totalBytes} />
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 border-r border-gray-800 overflow-hidden flex flex-col">
          <div className="px-3 py-2 bg-gray-900 border-b border-gray-800 text-xs font-medium text-gray-400">
            FLOWS
          </div>
          <VirtualTable rows={deviceRows} sort={sort} onSort={handleSort} />
        </div>
        <div className="w-80 overflow-hidden flex flex-col">
          <div className="px-3 py-2 bg-gray-900 border-b border-gray-800 text-xs font-medium text-gray-400">
            INSPECTOR
          </div>
          <DetailPane row={selectedRow} />
        </div>
      </div>
    </div>
  )
}