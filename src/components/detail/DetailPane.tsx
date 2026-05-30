import React, { memo, useMemo } from 'react'
import { TrafficRow } from '../../types'
import { formatBytes, formatTimestamp } from '../../utils/formatters'

interface Props { row: TrafficRow | null }

export const DetailPane = memo(({ row }: Props) => {
  const hasTopDomains = useMemo(() => {
    return row?.top_domains && row.top_domains.length > 0
  }, [row])

  if (!row) {
    return (
      <div className="flex items-center justify-center h-full text-gray-600 text-sm">
        Select a row to view details
      </div>
    )
  }

  // Determine if this is a device aggregate row or a domain-level row
  const isDeviceAggregate = row.domain === 'all' || (hasTopDomains && row.top_domains && row.top_domains.length > 0)

  return (
    <div className="h-full overflow-y-auto p-3 space-y-4">
      {/* Endpoint info */}
      <div className="space-y-2">
        <div className="text-xs font-medium text-gray-400 uppercase tracking-wide">Endpoint</div>
        <div className="bg-gray-900 rounded p-3 space-y-1">
          <div className="text-sm font-mono text-blue-400">{row.ip_address}</div>
          <div className="text-sm break-all">{row.domain !== 'all' ? row.domain : 'All Domains'}</div>
          {row.hostname && <div className="text-xs text-gray-500">{row.hostname}</div>}
          {row.last_seen && (
            <div className="text-xs text-gray-500 mt-1">
              Last seen: {formatTimestamp(row.last_seen)}
            </div>
          )}
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

      {/* Top domains (for device aggregate rows) */}
      {hasTopDomains && (
        <div className="space-y-2">
          <div className="text-xs font-medium text-gray-400 uppercase tracking-wide">Top Domains</div>
          <div className="bg-gray-900 rounded divide-y divide-gray-800">
            {row.top_domains!.slice(0, 5).map((td, idx) => (
              <div key={idx} className="flex justify-between items-center px-3 py-2 text-xs">
                <span className="font-mono text-gray-300 truncate max-w-[150px]">{td.domain}</span>
                <span className="text-gray-500">{formatBytes(td.bytes)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Layer information - now accurate based on available data */}
      <div className="space-y-2">
        <div className="text-xs font-medium text-gray-400 uppercase tracking-wide">Analysis</div>
        
        <div className="bg-gray-900 rounded">
          <div className="px-3 py-2 text-sm font-medium border-b border-gray-800">
            Network Information
          </div>
          <div className="px-3 py-2 space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-500">Source/Destination</span>
              <span className="font-mono">{row.ip_address}</span>
            </div>
            {row.domain !== 'all' && (
              <div className="flex justify-between">
                <span className="text-gray-500">Domain</span>
                <span className="text-gray-300 truncate max-w-[200px]">{row.domain}</span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-gray-900 rounded">
          <div className="px-3 py-2 text-sm font-medium border-b border-gray-800">
            Traffic Classification
          </div>
          <div className="px-3 py-2 space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-500">Data Source</span>
              <span>{isDeviceAggregate ? 'Device Aggregate' : 'Domain-level Flow'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Last Updated</span>
              <span>{row.last_seen ? formatTimestamp(row.last_seen) : 'Real-time'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
})

DetailPane.displayName = 'DetailPane'