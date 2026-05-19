import React, { memo } from 'react'
import { TrafficRow } from '../../types'
import { formatBytes } from '../../utils/formatters'

interface Props { row: TrafficRow | null }

export const DetailPane = memo(({ row }: Props) => {
  if (!row) {
    return (
      <div className="flex items-center justify-center h-full text-gray-600 text-sm">
        Select a row to view details
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto p-3 space-y-4">
      {/* Endpoint info */}
      <div className="space-y-2">
        <div className="text-xs font-medium text-gray-400 uppercase tracking-wide">Endpoint</div>
        <div className="bg-gray-900 rounded p-3 space-y-1">
          <div className="text-sm font-mono text-blue-400">{row.ip_address}</div>
          <div className="text-sm">{row.domain}</div>
          {row.hostname && <div className="text-xs text-gray-500">{row.hostname}</div>}
        </div>
      </div>

      {/* Traffic stats */}
      <div className="space-y-2">
        <div className="text-xs font-medium text-gray-400 uppercase tracking-wide">Traffic</div>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-gray-900 rounded p-2">
            <div className="text-xs text-gray-500">↓ In</div>
            <div className="text-lg font-mono text-emerald-400">{formatBytes(row.bytes_in)}</div>
          </div>
          <div className="bg-gray-900 rounded p-2">
            <div className="text-xs text-gray-500">↑ Out</div>
            <div className="text-lg font-mono text-blue-400">{formatBytes(row.bytes_out)}</div>
          </div>
        </div>
        <div className="bg-gray-900 rounded p-2">
          <div className="text-xs text-gray-500">Total</div>
          <div className="text-xl font-mono font-semibold">{formatBytes(row.total_bytes)}</div>
        </div>
      </div>

      {/* Layer tree */}
      <div className="space-y-2">
        <div className="text-xs font-medium text-gray-400 uppercase tracking-wide">Layers</div>
        
        <details className="bg-gray-900 rounded">
          <summary className="px-3 py-2 cursor-pointer hover:bg-gray-800 text-sm font-medium">
            Network Layer
          </summary>
          <div className="px-3 pb-2 space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-500">Source IP</span>
              <span className="font-mono">{row.ip_address}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Destination</span>
              <span className="text-gray-400">DNS Resolved</span>
            </div>
          </div>
        </details>

        <details className="bg-gray-900 rounded">
          <summary className="px-3 py-2 cursor-pointer hover:bg-gray-800 text-sm font-medium">
            Transport Layer
          </summary>
          <div className="px-3 pb-2 space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-500">Protocol</span>
              <span>TCP</span>
            </div>
          </div>
        </details>

        <details className="bg-gray-900 rounded">
          <summary className="px-3 py-2 cursor-pointer hover:bg-gray-800 text-sm font-medium">
            Application Layer
          </summary>
          <div className="px-3 pb-2 space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-500">Domain</span>
              <span>{row.domain}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Detection</span>
              <span className="text-gray-400">DNS / TLS SNI</span>
            </div>
          </div>
        </details>
      </div>
    </div>
  )
})

DetailPane.displayName = 'DetailPane'