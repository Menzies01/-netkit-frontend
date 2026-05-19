import React, { useState, useCallback, useMemo, useTransition } from 'react'
import { useAppContext } from '../context/AppContext'
import { VirtualTable } from '../components/table/VirtualTable'
import { DetailPane } from '../components/detail/DetailPane'
import { HexView } from '../components/detail/HexView'
import { BandwidthBar } from '../components/charts/BandwidthBar'
import { ThroughputLine } from '../components/charts/ThroughputLine'
import { TopBar } from '../components/layout/TopBar'
import { TrafficRow, SortState } from '../types'

export const Overview = () => {
  const { state, dispatch } = useAppContext()
  const [filteredRows, setFiltered] = useState<TrafficRow[]>([])
  const [sort, setSort] = useState<SortState | null>(null)
  const [, startTransition] = useTransition()

  const selectedRow = useMemo(() => {
    if (!state.selectedKey) return null
    const [ip, domain] = state.selectedKey.split('::')
    return state.trafficRows.find(r => r.ip_address === ip && r.domain === domain) ?? null
  }, [state.selectedKey, state.trafficRows])

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

  return (
    <div className="flex flex-col h-full overflow-hidden bg-gray-950">
      <TopBar rows={state.trafficRows} sort={sort} onFiltered={handleFiltered} />

      {/* Charts row - compact, functional */}
      <div className="flex border-b border-gray-800 bg-gray-900/50">
        <div className="flex-1 p-3 border-r border-gray-800">
          <div className="text-xs text-gray-500 mb-2 font-medium">TOP APPLICATIONS</div>
          <BandwidthBar data={state.summary} />
        </div>
            <div className="w-96 p-3">  {/* Changed from w-80 to w-96 for more width */}
              <div className="text-xs text-gray-500 mb-2 font-medium">THROUGHPUT (10 MIN)</div>
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
          <VirtualTable rows={displayRows} sort={sort} onSort={handleSort} />
        </div>

        {/* Center: Detail pane */}
        <div className="w-2/5 border-r border-gray-800 overflow-hidden flex flex-col">
          <div className="px-3 py-2 bg-gray-900 border-b border-gray-800 text-xs font-medium text-gray-400">
            LAYER INSPECTOR
          </div>
          <DetailPane row={selectedRow} />
        </div>

        {/* Right: Hex view */}
        <div className="w-1/5 overflow-hidden flex flex-col">
          <div className="px-3 py-2 bg-gray-900 border-b border-gray-800 text-xs font-medium text-gray-400">
            HEX VIEW
          </div>
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
  )
}