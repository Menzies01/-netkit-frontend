import React, { memo, useMemo, useState } from 'react'
import { TrafficRow } from '../../types'

interface Props { row: TrafficRow | null }

export const HexView = memo(({ row }: Props) => {
  const [activeField, setActiveField] = useState<string | null>(null)

  const hexLines = useMemo(() => {
    if (!row) return []

    const data = [
      { label: 'IP', value: row.ip_address },
      { label: 'Domain', value: row.domain || 'unknown' },
      { label: 'Bytes In', value: row.bytes_in.toString() },
      { label: 'Bytes Out', value: row.bytes_out.toString() },
      { label: 'Total', value: row.total_bytes.toString() },
    ]

    const bytes: number[] = []
    const fieldMap: string[] = []

    data.forEach(({ label, value }) => {
      const encoder = new TextEncoder()
      const encoded = encoder.encode(value)
      encoded.forEach(b => {
        bytes.push(b)
        fieldMap.push(label)
      })
      bytes.push(0x00)
      fieldMap.push(label)
    })

    const lines = []
    for (let i = 0; i < bytes.length; i += 16) {
      const chunk = bytes.slice(i, i + 16)
      const fields = fieldMap.slice(i, i + 16)
      const hex = chunk.map(b => b.toString(16).padStart(2, '0'))
      const ascii = chunk.map(b => (b >= 32 && b <= 126) ? String.fromCharCode(b) : '.').join('')
      lines.push({
        offset: i.toString(16).padStart(4, '0'),
        hex,
        ascii,
        fields,
      })
    }
    return lines
  }, [row])

  if (!row || !hexLines.length) {
    return (
      <div className="flex items-center justify-center h-full text-gray-600 text-xs">
        Select a row to view hex dump
      </div>
    )
  }

  const fieldColors: Record<string, string> = {
    IP: '#3B82F6',
    Domain: '#10B981',
    'Bytes In': '#34D399',
    'Bytes Out': '#60A5FA',
    Total: '#F59E0B',
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex flex-wrap gap-1 p-2 border-b border-gray-800">
        {Object.entries(fieldColors).map(([field, color]) => (
          <button
            key={field}
            onClick={() => setActiveField(activeField === field ? null : field)}
            className={`px-2 py-0.5 rounded text-xs transition-colors ${
              activeField === field ? 'bg-gray-700' : 'hover:bg-gray-800'
            }`}
          >
            <span className="inline-block w-2 h-2 rounded-sm mr-1" style={{ backgroundColor: color }} />
            {field}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-auto p-2 font-mono text-xs">
        {hexLines.map((line, idx) => (
          <div key={idx} className="flex gap-3 py-0.5">
            <span className="text-gray-600 w-12">{line.offset}</span>
            <div className="flex gap-0.5 flex-1">
              {line.hex.map((byte, i) => {
                const field = line.fields[i]
                const isActive = activeField === field
                const color = fieldColors[field as keyof typeof fieldColors] || '#6B7280'
                return (
                  <span
                    key={i}
                    className="w-5 text-center"
                    style={{
                      color: isActive ? color : '#9CA3AF',
                      opacity: activeField && !isActive ? 0.3 : 1,
                    }}
                  >
                    {byte}
                  </span>
                )
              })}
            </div>
            <span className="text-gray-600 w-32">{line.ascii}</span>
          </div>
        ))}
      </div>
    </div>
  )
})

HexView.displayName = 'HexView'