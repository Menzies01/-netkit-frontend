import React, { useState, useCallback, useMemo, useTransition, useEffect } from 'react'
import { useAppContext } from '../context/AppContext'
import { useStats } from '../hooks/useStats'
import { useSocket } from '../hooks/useSocket'
import { VirtualTable } from '../components/table/VirtualTable'
import { DetailPane } from '../components/detail/DetailPane'
import { HexView } from '../components/detail/HexView'
import { BandwidthBar } from '../components/charts/BandwidthBar'
import { ThroughputLine } from '../components/charts/ThroughputLine'
import { TopBar } from '../components/layout/TopBar'
import { PriorityMonitor } from '../components/qos/PriorityMonitor'
import { TrafficRow, SortState } from '../types'

export const Overview = () => {
  const { state, dispatch } = useAppContext()
  const { fetchSummary } = useStats()
  const [filteredRows, setFiltered] = useState<TrafficRow[]>([])
  const [sort, setSort] = useState<SortState | null>(null)
  const [, startTransition] = useTransition()

  useEffect(() => {
    fetchSummary()
  }, [fetchSummary])

  const handleStatsUpdate = useCallback(() => {
    fetchSummary()
  }, [fetchSummary])

  useSocket(handleStatsUpdate)

  const getDeviceKey = useCallback((ipAddress: string): string => {
    const device = state.devices.find(d => d.ip_address === ipAddress)
    return device?.mac_address || ipAddress
  }, [state.devices])

  const selectedRow = useMemo(() => {
    if (!state.selectedKey) return null
    const [deviceIdentifier, domain] = state.selectedKey.split('::')
    const found = state.trafficRows.find(row => {
      const rowDeviceKey = getDeviceKey(row.ip_address)
      return rowDeviceKey === deviceIdentifier && row.domain === domain
    })
    if (!found && state.selectedKey) {
      dispatch({ type: 'SELECT', payload: null })
    }
    return found ?? null
  }, [state.selectedKey, state.trafficRows, dispatch, getDeviceKey])

  const handleFiltered = useCallback((rows: TrafficRow[]) => {
    startTransition(() => setFiltered(rows))
  }, [])

  const handleSort = useCallback((col: keyof TrafficRow) => {
    setSort(prev =>
      prev?.column === col
        ? { column: col, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
        : { column: col, direction: 'desc' }
    )
  }, [])

  const totalBytes = useMemo(
    () => state.trafficRows.reduce((s, r) => s + r.total_bytes, 0),
    [state.trafficRows]
  )

  const displayRows = filteredRows.length > 0 ? filteredRows : state.trafficRows
  const isLoading = state.trafficRows.length === 0

  return (
    <div className="h-full flex flex-col bg-gray-950">
      {/* Top Bar - Fixed */}
      <TopBar rows={state.trafficRows} sort={sort} onFiltered={handleFiltered} />

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto">
        
        {/* Charts Row */}
        <div className="flex border-b border-gray-800 bg-gray-900/50">
          <div className="flex-1 p-3 border-r border-gray-800">
            <div className="text-xs text-slate-400 font-medium mb-2">📊 TOP APPLICATIONS</div>
            <BandwidthBar data={state.summary} />
          </div>
          <div className="flex-1 p-3">
            <div className="text-xs text-slate-400 font-medium mb-2">📈 NETWORK ACTIVITY</div>
            <ThroughputLine triggerValue={state.lastUpdate} totalBytes={totalBytes} />
          </div>
        </div>

        {/* Priority Monitor Section */}
        <div className="bg-gray-900/20 border-b border-gray-800">
          <PriorityMonitor />
        </div>

        {/* Three Column Layout */}
        <div className="flex h-[calc(100vh-280px)] min-h-[400px]">
          
          {/* Column 1: Traffic Table */}
          <div className="w-2/5 border-r border-gray-800 flex flex-col">
            <div className="px-3 py-2 bg-gray-900/50 border-b border-gray-800 text-xs font-medium text-gray-400 sticky top-0">
              🔄 ACTIVE FLOWS ({displayRows.length})
            </div>
            <div className="flex-1 overflow-auto">
              {isLoading ? (
                <div className="flex items-center justify-center h-full text-gray-500 text-sm">
                  Loading traffic data...
                </div>
              ) : (
                <VirtualTable rows={displayRows} sort={sort} onSort={handleSort} />
              )}
            </div>
          </div>

          {/* Column 2: Detail Pane */}
          <div className="w-2/5 border-r border-gray-800 flex flex-col">
            <div className="px-3 py-2 bg-gray-900/50 border-b border-gray-800 text-xs font-medium text-gray-400 sticky top-0">
              🔍 TRAFFIC DETAILS
            </div>
            <div className="flex-1 overflow-auto">
              <DetailPane row={selectedRow} />
            </div>
          </div>

          {/* Column 3: Hex View */}
          <div className="w-1/5 flex flex-col">
            <div className="px-3 py-2 bg-gray-900/50 border-b border-gray-800 text-xs font-medium text-gray-400 sticky top-0">
              🖥️ DATA INSPECTOR
            </div>
            <div className="flex-1 overflow-auto">
              {selectedRow ? (
                <HexView row={selectedRow} />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-600 text-xs">
                  Select a row to inspect
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}