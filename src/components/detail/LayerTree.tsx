import React, { memo } from 'react'
import { TrafficRow } from '../../types'
import { useAppContext } from '../../context/AppContext'
import { getProtocolColor } from '../../utils/protocol-colors'
import { formatBytes } from '../../utils/formatters'

interface Props { row: TrafficRow }

export const LayerTree = memo(({ row }: Props) => {
  const { state, dispatch } = useAppContext()
  const protocolColor = getProtocolColor(row.domain)
  const key = `${row.ip_address}::${row.domain}`

  const select = () => dispatch({ type: 'SELECT', payload: key })

  return (
    <div className="space-y-1" onClick={select}>
      {/* Network Layer */}
      <details open className="border border-gray-800 bg-gray-900/50">
        <summary className="flex items-center gap-2 cursor-pointer px-3 py-2 text-xs font-medium text-gray-300 list-none hover:bg-gray-800/30">
          <span className="text-gray-600">▶</span>
          <span className="text-primary">Network Layer</span>
          <span className="ml-auto text-[9px] text-gray-600 font-mono">L3</span>
        </summary>
        <div className="px-3 pb-2 space-y-1">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-500 w-12">Source:</span>
            <span className="font-mono text-gray-300">{row.ip_address}</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-500 w-12">Dest:</span>
            <span className="text-gray-500 italic">DNS resolution</span>
          </div>
        </div>
      </details>

      {/* Transport Layer */}
      <details open className="border border-gray-800 bg-gray-900/50">
        <summary className="flex items-center gap-2 cursor-pointer px-3 py-2 text-xs font-medium text-gray-300 list-none hover:bg-gray-800/30">
          <span className="text-gray-600">▶</span>
          <span className="text-warning">Transport Layer</span>
          <span className="ml-auto text-[9px] text-gray-600 font-mono">L4</span>
        </summary>
        <div className="px-3 pb-2 space-y-1">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-500 w-12">Protocol:</span>
            <span className="font-mono text-gray-300">TCP</span>
          </div>
        </div>
      </details>

      {/* Application Layer */}
      <details open className="border border-gray-800 bg-gray-900/50">
        <summary className="flex items-center gap-2 cursor-pointer px-3 py-2 text-xs font-medium text-gray-300 list-none hover:bg-gray-800/30">
          <span className="text-gray-600">▶</span>
          <span className="text-success">Application Layer</span>
          <span className="ml-auto text-[9px] text-gray-600 font-mono">L7</span>
        </summary>
        <div className="px-3 pb-2 space-y-1">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-500 w-12">Domain:</span>
            <span className="font-mono" style={{ color: protocolColor.border }}>{row.domain}</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-500 w-12">↓ In:</span>
            <span className="font-mono text-success">{formatBytes(row.bytes_in)}</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-500 w-12">↑ Out:</span>
            <span className="font-mono text-primary">{formatBytes(row.bytes_out)}</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-500 w-12">Method:</span>
            <span className="text-gray-500">DNS cache / TLS SNI</span>
          </div>
        </div>
      </details>

      {/* Policy Layer */}
      <details className="border border-gray-800 bg-gray-900/50">
        <summary className="flex items-center gap-2 cursor-pointer px-3 py-2 text-xs font-medium text-gray-300 list-none hover:bg-gray-800/30">
          <span className="text-gray-600">▶</span>
          <span className="text-danger">Policy Enforcement</span>
          <span className="ml-auto text-[9px] text-gray-600 font-mono">QoS</span>
        </summary>
        <div className="px-3 pb-2">
          <PolicyLayer row={row} />
        </div>
      </details>
    </div>
  )
})

LayerTree.displayName = 'LayerTree'

const PolicyLayer = ({ row }: Props) => {
  const { state } = useAppContext()
  const policies = state.policies.filter(p =>
    (p.device_ip === row.ip_address || !p.device_ip) &&
    (p.domain === row.domain || !p.domain) &&
    p.is_active
  )

  if (!policies.length) {
    return <div className="text-gray-600 text-xs py-1">No active policies</div>
  }

  return (
    <div className="space-y-1">
      {policies.map(p => (
        <div key={p.id} className="border-l-2 border-danger bg-gray-800/30 p-2">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-xs font-medium text-gray-300">{p.name}</div>
              <div className="text-[10px] text-gray-500 font-mono mt-0.5">
                {p.device_ip || 'any'} → {p.domain || 'any'}
              </div>
            </div>
            <div className={`text-[10px] font-bold px-1.5 py-0.5 ${p.action === 'block' ? 'text-danger' : 'text-warning'}`}>
              {p.action === 'block' ? 'BLOCK' : `${p.rate_kbps}kbps`}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}