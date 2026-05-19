// src/components/table/VirtualTable.tsx
import React, { memo, useRef, useCallback } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { TrafficRow, SortState } from '../../types'
import { useTheme } from '../../context/ThemeContext'
import { useAppContext } from '../../context/AppContext'
import { ByteDisplay } from '../shared/ByteDisplay'
import { getProtocolColor } from '../../utils/protocol-colors'
import { formatTimestamp } from '../../utils/formatters'

interface VirtualTableProps {
  rows: TrafficRow[]
  sort: SortState | null
  onSort: (col: keyof TrafficRow) => void
}

export const VirtualTable = memo(({ rows, sort, onSort }: VirtualTableProps) => {
  const { density } = useTheme()
  const { state, dispatch } = useAppContext()
  const parentRef = useRef<HTMLDivElement>(null)
  const rowHeight = density === 'compact' ? 32 : 48

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan: 5,
  })

  const handleSelect = useCallback((row: TrafficRow) => {
    const key = `${row.ip_address}::${row.domain}`
    dispatch({ type: 'SELECT', payload: state.selectedKey === key ? null : key })
  }, [dispatch, state.selectedKey])

  const columns = [
    { key: 'ip_address' as const, label: 'Device', width: 140, sortable: true },
    { key: 'domain' as const, label: 'Domain', width: 200, sortable: true }, // Fixed width for domain
    { key: 'total_bytes' as const, label: 'Total', width: 90, sortable: true, align: 'right' },
    { key: 'bytes_in' as const, label: '↓ In', width: 80, sortable: true, align: 'right' },
    { key: 'bytes_out' as const, label: '↑ Out', width: 80, sortable: true, align: 'right' },
    { key: 'last_seen' as const, label: 'Last Seen', width: 100, sortable: true },
  ]

  return (
    <div className="flex flex-col h-full bg-gray-950">
      {/* Header */}
      <div className="flex items-center bg-gray-900 border-b border-gray-700 text-xs font-medium text-gray-300 sticky top-0 z-10 min-h-[36px]">
        <div className="w-6 flex-shrink-0" />
        {columns.map(col => (
          <div
            key={col.key}
            className={`px-3 py-2 ${col.align === 'right' ? 'text-right' : 'text-left'}`}
            style={{ width: col.width, flexShrink: 0 }}
          >
            {col.sortable ? (
              <button
                onClick={() => onSort(col.key)}
                className="hover:text-white transition-colors flex items-center gap-1"
              >
                {col.label}
                {sort?.column === col.key && (
                  <span className="text-gray-400">{sort.direction === 'asc' ? '↑' : '↓'}</span>
                )}
              </button>
            ) : (
              col.label
            )}
          </div>
        ))}
      </div>

      {/* Virtualized rows */}
      <div ref={parentRef} className="flex-1 overflow-auto">
        <div style={{ height: `${virtualizer.getTotalSize()}px`, position: 'relative' }}>
          {virtualizer.getVirtualItems().map(virtualRow => {
            const row = rows[virtualRow.index]
            if (!row) return null
            
            const key = `${row.ip_address}::${row.domain}`
            const selected = state.selectedKey === key
            const protocolColor = getProtocolColor(row.domain || 'unknown')
            const isHighTraffic = (row.total_bytes || 0) > 10_000_000
            const isMediumTraffic = (row.total_bytes || 0) > 1_000_000 && (row.total_bytes || 0) <= 10_000_000

            let borderColor = protocolColor.border
            if (isHighTraffic) borderColor = '#ef4444'
            else if (isMediumTraffic) borderColor = '#f59e0b'

            // Get display domain - show full domain, not truncated
            const displayDomain = row.domain || 'unknown'

            return (
              <div
                key={key}
                onClick={() => handleSelect(row)}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${rowHeight}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
                className={`flex items-center border-b border-gray-800 cursor-pointer transition-colors ${
                  selected ? 'bg-gray-800' : 'hover:bg-gray-800/50'
                }`}
                style={{ borderLeft: `3px solid ${borderColor}` }}
              >
                {/* Selection indicator */}
                <div className="w-6 flex-shrink-0 flex justify-center">
                  {selected && <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
                </div>

                {/* Device IP */}
                <div className="px-3 truncate text-sm font-mono text-gray-300" style={{ width: 140, flexShrink: 0 }}>
                  {row.hostname || row.ip_address || 'unknown'}
                </div>

                  <div 
                    className="px-3 text-sm font-medium truncate" 
                    style={{ width: 200, flexShrink: 0, color: protocolColor.text }}
                    title={row.domain}  // Will show actual domain like "HTTPS", "youtube.com", etc.
                  >
                    {row.domain || 'unknown'}
                  </div>

                {/* Total bytes */}
                <div className="px-3 text-right font-mono text-sm text-gray-300" style={{ width: 90, flexShrink: 0 }}>
                  <ByteDisplay value={row.total_bytes || 0} />
                </div>

                {/* Bytes In */}
                <div className="px-3 text-right font-mono text-sm text-emerald-400" style={{ width: 80, flexShrink: 0 }}>
                  <ByteDisplay value={row.bytes_in || 0} />
                </div>

                {/* Bytes Out */}
                <div className="px-3 text-right font-mono text-sm text-blue-400" style={{ width: 80, flexShrink: 0 }}>
                  <ByteDisplay value={row.bytes_out || 0} />
                </div>

                {/* Last Seen */}
                <div className="px-3 text-xs font-mono text-gray-500" style={{ width: 100, flexShrink: 0 }}>
                  {row.last_seen ? formatTimestamp(row.last_seen) : '—'}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="px-3 py-1.5 text-xs text-gray-500 border-t border-gray-800 bg-gray-900/50">
        {rows.length} flows • Click any row to inspect
      </div>
    </div>
  )
})

VirtualTable.displayName = 'VirtualTable'