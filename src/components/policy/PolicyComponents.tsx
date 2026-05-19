import React, { memo, useState, useCallback, useRef, useEffect } from 'react'
import { Policy } from '../../types'
import { usePolicies } from '../../hooks/usePolicies'
import { useAppContext } from '../../context/AppContext'
import { formatRate } from '../../utils/formatters'

export const PolicyTable = memo(() => {
  const { state } = useAppContext()
  const { updatePolicy, deletePolicy } = usePolicies()
  const [confirmId, setConfirmId] = useState<number | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout>>()

  const handleDelete = useCallback((id: number) => {
    if (confirmId === id) {
      clearTimeout(timerRef.current)
      deletePolicy(id)
      setConfirmId(null)
    } else {
      setConfirmId(id)
      timerRef.current = setTimeout(() => setConfirmId(null), 3000)
    }
  }, [confirmId, deletePolicy])

  useEffect(() => () => clearTimeout(timerRef.current), [])

  if (!state.policies.length) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-500 text-sm">
        No policies configured. Click "Add Policy" to get started.
      </div>
    )
  }

  return (
    <table className="w-full text-sm">
      <thead className="border-b border-gray-800">
        <tr className="text-left text-gray-400">
          <th className="px-3 py-2 font-medium">Name</th>
          <th className="px-3 py-2 font-medium">Device IP</th>
          <th className="px-3 py-2 font-medium">Domain</th>
          <th className="px-3 py-2 font-medium">Action</th>
          <th className="px-3 py-2 font-medium">Rate</th>
          <th className="px-3 py-2 font-medium">Status</th>
          <th className="px-3 py-2 font-medium"></th>
        </tr>
      </thead>
      <tbody>
        {state.policies.map(policy => (
          <tr key={policy.id} className="border-b border-gray-800 hover:bg-gray-800/50">
            <td className="px-3 py-2">{policy.name}</td>
            <td className="px-3 py-2 font-mono text-xs text-gray-400">{policy.device_ip || '—'}</td>
            <td className="px-3 py-2 font-mono text-xs text-gray-400">{policy.domain || '—'}</td>
            <td className="px-3 py-2">
              {policy.action === 'block' ? (
                <span className="px-2 py-0.5 rounded text-xs bg-red-900/50 text-red-300">BLOCK</span>
              ) : (
                <span className="px-2 py-0.5 rounded text-xs bg-blue-900/50 text-blue-300">LIMIT</span>
              )}
            </td>
            <td className="px-3 py-2 font-mono text-xs text-gray-400">
              {policy.action === 'limit' ? formatRate(policy.rate_kbps) : '—'}
            </td>
            <td className="px-3 py-2">
              <button
                onClick={() => updatePolicy(policy.id, { is_active: !policy.is_active })}
                className={`relative w-9 h-5 rounded-full transition-colors ${
                  policy.is_active ? 'bg-green-600' : 'bg-gray-700'
                }`}
              >
                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                  policy.is_active ? 'translate-x-4' : 'translate-x-0.5'
                }`} />
              </button>
            </td>
            <td className="px-3 py-2">
              <button
                onClick={() => handleDelete(policy.id)}
                className={`text-xs px-2 py-1 rounded transition-colors ${
                  confirmId === policy.id ? 'bg-red-600 text-white' : 'text-gray-500 hover:text-red-400'
                }`}
              >
                {confirmId === policy.id ? 'Confirm?' : 'Delete'}
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
})

PolicyTable.displayName = 'PolicyTable'

interface FormProps { onClose: () => void }

export const PolicyForm = memo(({ onClose }: FormProps) => {
  const { state } = useAppContext()
  const { createPolicy } = usePolicies()
  const [name, setName] = useState('')
  const [deviceIp, setDeviceIp] = useState('')
  const [domain, setDomain] = useState('')
  const [action, setAction] = useState<'limit' | 'block'>('limit')
  const [rateKbps, setRateKbps] = useState(512)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  const validate = (): boolean => {
    const e: Record<string, string> = {}
    if (!name.trim()) e.name = 'Name is required'
    if (action === 'limit' && rateKbps <= 0) e.rate = 'Rate must be positive'
    if (!deviceIp && !domain) e.target = 'Device or Domain required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setLoading(true)
    try {
      await createPolicy({
        name: name.trim(),
        device_ip: deviceIp || undefined,
        domain: domain || undefined,
        action,
        rate_kbps: action === 'limit' ? rateKbps : undefined,
      })
      onClose()
    } catch {
      setErrors({ submit: 'Failed to create policy' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-gray-900 border-l border-gray-800 shadow-xl z-50 flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
        <h2 className="font-semibold">New Policy</h2>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-300">✕</button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div>
          <label className="text-xs text-gray-400 uppercase block mb-1">Name</label>
          <input value={name} onChange={e => setName(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm" />
          {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name}</p>}
        </div>

        <div>
          <label className="text-xs text-gray-400 uppercase block mb-1">Device IP</label>
          <select value={deviceIp} onChange={e => setDeviceIp(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm">
            <option value="">All devices</option>
            {state.devices.map(d => (
              <option key={d.id} value={d.ip_address}>{d.hostname || d.ip_address}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs text-gray-400 uppercase block mb-1">Domain</label>
          <input value={domain} onChange={e => setDomain(e.target.value)} placeholder="e.g., youtube.com" className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm" />
        </div>

        <div>
          <label className="text-xs text-gray-400 uppercase block mb-1">Action</label>
          <div className="flex gap-3">
            <label className="flex items-center gap-1">
              <input type="radio" value="limit" checked={action === 'limit'} onChange={() => setAction('limit')} /> Limit
            </label>
            <label className="flex items-center gap-1">
              <input type="radio" value="block" checked={action === 'block'} onChange={() => setAction('block')} /> Block
            </label>
          </div>
        </div>

        {action === 'limit' && (
          <div>
            <label className="text-xs text-gray-400 uppercase block mb-1">Rate (kbps)</label>
            <input type="number" value={rateKbps} onChange={e => setRateKbps(parseInt(e.target.value, 10))} min={1} className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm" />
            {errors.rate && <p className="text-xs text-red-400 mt-1">{errors.rate}</p>}
          </div>
        )}

        {(errors.target || errors.submit) && (
          <p className="text-sm text-red-400 bg-red-900/20 rounded px-2 py-1">{errors.target || errors.submit}</p>
        )}
      </div>

      <div className="px-4 py-3 border-t border-gray-800 flex gap-2">
        <button onClick={handleSubmit} disabled={loading} className="flex-1 bg-blue-600 hover:bg-blue-700 text-sm py-1.5 rounded transition-colors">
          {loading ? 'Creating...' : 'Create Policy'}
        </button>
        <button onClick={onClose} className="px-3 py-1.5 text-sm text-gray-400 hover:text-gray-200">Cancel</button>
      </div>
    </div>
  )
})

PolicyForm.displayName = 'PolicyForm'