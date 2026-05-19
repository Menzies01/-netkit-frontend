import React, { memo, useRef, useCallback, useState } from 'react'
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
  const rowHeight = density === 'compact' ? 28 : 44

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
    { key: 'domain' as const, label: 'Domain', width: null, sortable: true },
    { key: 'total_bytes' as const, label: 'Total', width: 100, sortable: true, align: 'right' },
    { key: 'bytes_in' as const, label: '↓ In', width: 90, sortable: true, align: 'right' },
    { key: 'bytes_out' as const, label: '↑ Out', width: 90, sortable: true, align: 'right' },
    { key: 'last_seen' as const, label: 'Last Seen', width: 110, sortable: true },
  ]

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center bg-gray-900 border-b border-gray-800 text-xs font-medium text-gray-400 sticky top-0 z-10">
        <div className="w-6 flex-shrink-0" />
        {columns.map(col => (
          <div
            key={col.key}
            className={`px-2 py-2 ${col.align === 'right' ? 'text-right' : 'text-left'}`}
            style={col.width ? { width: col.width, flexShrink: 0 } : { flex: 1 }}
          >
            {col.sortable ? (
              <button
                onClick={() => onSort(col.key)}
                className="hover:text-gray-200 transition-colors flex items-center gap-1"
              >
                {col.label}
                {sort?.column === col.key && (
                  <span className="text-gray-500">{sort.direction === 'asc' ? '↑' : '↓'}</span>
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
            const key = `${row.ip_address}::${row.domain}`
            const selected = state.selectedKey === key
            const protocolColor = getProtocolColor(row.domain)
            const isHighTraffic = row.total_bytes > 10_000_000
            const isMediumTraffic = row.total_bytes > 1_000_000 && row.total_bytes <= 10_000_000

            let borderColor = protocolColor.border
            if (isHighTraffic) borderColor = '#DC2626'
            else if (isMediumTraffic) borderColor = '#D97706'

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
                <div className="w-6 flex-shrink-0 flex justify-center">
                  {selected && <div className="w-1 h-1 rounded-full bg-blue-500" />}
                </div>

                <div className="px-2 truncate text-sm font-mono" style={{ width: 140, flexShrink: 0 }}>
                  {row.hostname || row.ip_address}
                </div>

                <div className="px-2 truncate text-sm" style={{ flex: 1 }}>
                  {row.domain}
                </div>

                <div className="px-2 text-right font-mono text-sm" style={{ width: 100, flexShrink: 0 }}>
                  <ByteDisplay value={row.total_bytes} />
                </div>

                <div className="px-2 text-right font-mono text-sm text-emerald-400" style={{ width: 90, flexShrink: 0 }}>
                  <ByteDisplay value={row.bytes_in} />
                </div>

                <div className="px-2 text-right font-mono text-sm text-blue-400" style={{ width: 90, flexShrink: 0 }}>
                  <ByteDisplay value={row.bytes_out} />
                </div>

                <div className="px-2 text-xs font-mono text-gray-500" style={{ width: 110, flexShrink: 0 }}>
                  {row.last_seen ? formatTimestamp(row.last_seen) : '—'}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
})

VirtualTable.displayName = 'VirtualTable'