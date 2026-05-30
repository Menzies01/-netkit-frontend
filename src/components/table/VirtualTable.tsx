import React, { memo, useState, useCallback } from 'react'
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

export const VirtualTable = memo(({ rows = [], sort, onSort }: VirtualTableProps) => {
  const { density } = useTheme()
  const { state, dispatch } = useAppContext()
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const handleSelect = useCallback((row: TrafficRow) => {
    const key = `${row.ip_address}::${row.domain}`
    dispatch({ type: 'SELECT', payload: state.selectedKey === key ? null : key })
  }, [dispatch, state.selectedKey])

  const getSortIcon = (column: keyof TrafficRow) => {
    if (sort?.column !== column) return null
    return sort.direction === 'asc' ? ' ↑' : ' ↓'
  }

  if (rows.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-500 text-sm">
        No traffic data available
      </div>
    )
  }

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        {/* Header */}
        <thead className="bg-gray-900 sticky top-0 z-10">
          <tr className="border-b border-gray-700">
            <th className="px-3 py-2 text-left text-gray-400 font-medium w-8">
              <span className="sr-only">Select</span>
            </th>
            <th 
              className="px-3 py-2 text-left text-gray-400 font-medium cursor-pointer hover:text-white"
              onClick={() => onSort('ip_address')}
            >
              Device{getSortIcon('ip_address')}
            </th>
            <th 
              className="px-3 py-2 text-left text-gray-400 font-medium cursor-pointer hover:text-white"
              onClick={() => onSort('domain')}
            >
              Domain{getSortIcon('domain')}
            </th>
            <th 
              className="px-3 py-2 text-right text-gray-400 font-medium cursor-pointer hover:text-white"
              onClick={() => onSort('total_bytes')}
            >
              Total{getSortIcon('total_bytes')}
            </th>
            <th 
              className="px-3 py-2 text-right text-gray-400 font-medium cursor-pointer hover:text-white"
              onClick={() => onSort('bytes_in')}
            >
              ↓ In{getSortIcon('bytes_in')}
            </th>
            <th 
              className="px-3 py-2 text-right text-gray-400 font-medium cursor-pointer hover:text-white"
              onClick={() => onSort('bytes_out')}
            >
              ↑ Out{getSortIcon('bytes_out')}
            </th>
            <th 
              className="px-3 py-2 text-left text-gray-400 font-medium cursor-pointer hover:text-white"
              onClick={() => onSort('last_seen')}
            >
              Last Seen{getSortIcon('last_seen')}
            </th>
          </tr>
        </thead>

        {/* Body */}
        <tbody>
          {rows.map((row) => {
            const rowKey = `${row.ip_address}::${row.domain}`
            const isSelected = state.selectedKey === rowKey
            const isHovered = hoveredId === rowKey
            const protocolColor = getProtocolColor(row.domain || 'unknown')
            
            return (
              <tr
                key={rowKey}
                onClick={() => handleSelect(row)}
                onMouseEnter={() => setHoveredId(rowKey)}
                onMouseLeave={() => setHoveredId(null)}
                className={`border-b border-gray-800 cursor-pointer transition-colors ${
                  isSelected ? 'bg-gray-800' : isHovered ? 'bg-gray-800/50' : ''
                }`}
                style={{ borderLeft: isSelected ? `3px solid ${protocolColor.border}` : undefined }}
              >
                <td className="px-3 py-2">
                  {isSelected && (
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                  )}
                </td>
                <td className="px-3 py-2 font-mono text-gray-300">
                  <div className="truncate max-w-[150px]" title={row.hostname || row.ip_address}>
                    {row.hostname || row.ip_address || 'unknown'}
                  </div>
                </td>
                <td className="px-3 py-2 font-medium" style={{ color: protocolColor.text }}>
                  <div className="truncate max-w-[200px]" title={row.domain}>
                    {row.domain || 'unknown'}
                  </div>
                </td>
                <td className="px-3 py-2 text-right font-mono text-gray-300">
                  <ByteDisplay value={row.total_bytes || 0} />
                </td>
                <td className="px-3 py-2 text-right font-mono text-emerald-400">
                  <ByteDisplay value={row.bytes_in || 0} />
                </td>
                <td className="px-3 py-2 text-right font-mono text-blue-400">
                  <ByteDisplay value={row.bytes_out || 0} />
                </td>
                <td className="px-3 py-2 font-mono text-gray-500 whitespace-nowrap">
                  {row.last_seen ? formatTimestamp(row.last_seen) : '—'}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {/* Footer */}
      <div className="px-3 py-2 text-xs text-gray-500 border-t border-gray-800 bg-gray-900/50">
        {rows.length} flows • Click any row to inspect
      </div>
    </div>
  )
})

VirtualTable.displayName = 'VirtualTable'