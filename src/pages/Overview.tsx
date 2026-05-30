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
import { TrafficRow, SortState } from '../types'

export const Overview = () => {
  const { state, dispatch } = useAppContext()
  const { fetchSummary } = useStats()
  const [filteredRows, setFiltered] = useState<TrafficRow[]>([])
  const [sort, setSort] = useState<SortState | null>(null)
  const [, startTransition] = useTransition()

  // Initial data fetch
  useEffect(() => {
    fetchSummary()
  }, [fetchSummary])

  // Socket update handler - refreshes data when backend pushes updates
  const handleStatsUpdate = useCallback(() => {
    fetchSummary()
  }, [fetchSummary])

  // Initialize Socket.IO connection
  useSocket(handleStatsUpdate)

  const selectedRow = useMemo(() => {
    if (!state.selectedKey) return null
    const [ip, domain] = state.selectedKey.split('::')
    // Find the row - use displayRows or trafficRows? Use trafficRows as source of truth
    const found = state.trafficRows.find(r => r.ip_address === ip && r.domain === domain)
    
    // If selected row no longer exists in current data, clear selection
    if (!found && state.selectedKey) {
      dispatch({ type: 'SELECT', payload: null })
    }
    return found ?? null
  }, [state.selectedKey, state.trafficRows, dispatch])

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
    <div className="flex flex-col h-full overflow-hidden bg-gray-950">
      <TopBar rows={state.trafficRows} sort={sort} onFiltered={handleFiltered} />

      {/* Charts row - compact, functional */}
      <div className="flex border-b border-gray-800 bg-gray-900/50">
        {/* Left Chart */}
        <div className="flex-1 p-3 border-r border-gray-800">
          <div className="flex items-center gap-2 px-1 mb-1">
            <span className="text-xs text-slate-300 font-medium">Top Applications</span>
            <span className="text-xs text-slate-500" title="Shows which websites and apps are using the most network bandwidth in the last 60 minutes. Taller bars = more data used.">
              ⓘ
            </span>
          </div>
          <BandwidthBar data={state.summary} />
        </div>

        {/* Right Chart */}
        <div className="flex-1 p-3">
          <div className="flex items-center gap-2 px-1 mb-1">
            <span className="text-xs text-slate-300 font-medium">Network Activity</span>
            <span className="text-xs text-slate-500" title="Shows how busy the network has been over the last 10 minutes. Spikes mean heavy downloads or uploads.">
              ⓘ
            </span>
          </div>
          <ThroughputLine triggerValue={state.lastUpdate} totalBytes={totalBytes} />
        </div>
      </div>

      {/* Three-column layout - clean grid */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Traffic table */}
        <div className="w-2/5 border-r border-gray-800 overflow-hidden flex flex-col">
          <div className="px-3 py-2 bg-gray-900 border-b border-gray-800 text-xs font-medium text-gray-400">
            ACTIVE FLOWS ({displayRows.length})
          </div>
          {isLoading ? (
            <div className="flex items-center justify-center flex-1 text-gray-500 text-sm">
              Loading traffic data...
            </div>
          ) : (
            <VirtualTable rows={displayRows} sort={sort} onSort={handleSort} />
          )}
        </div>

        {/* Center: Detail pane */}
        <div className="w-2/5 border-r border-gray-800 overflow-hidden flex flex-col">
          <div className="flex flex-col px-3 py-2 border-b border-slate-800 flex-shrink-0">
            <span className="text-xs text-slate-300 font-medium">Traffic Details</span>
            <span className="text-xs text-slate-500">Click any row to see where the traffic is going and what application sent it</span>
          </div>
          <DetailPane row={selectedRow} />
        </div>

        {/* Right: Hex view */}
        <div className="w-1/5 overflow-hidden flex flex-col">
          <div className="flex flex-col px-3 py-2 border-b border-slate-800 flex-shrink-0">
            <span className="text-xs text-slate-300 font-medium">Data Inspector</span>
            <span className="text-xs text-slate-500">Raw byte representation of the selected traffic record — for audit and verification</span>
          </div>
          <div className="flex-1 overflow-auto">
            {selectedRow ? (
              <HexView row={selectedRow} />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-600 text-xs">
                Select a row
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}