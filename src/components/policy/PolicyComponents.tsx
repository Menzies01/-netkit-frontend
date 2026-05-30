import React, { memo, useState, useCallback, useRef, useEffect } from 'react'
import { Policy } from '../../types'
import { usePolicies } from '../../hooks/usePolicies'
import { useAppContext } from '../../context/AppContext'
import { formatRate } from '../../utils/formatters'

export const PolicyTable = memo(() => {
  const { state } = useAppContext()
  const { updatePolicy, deletePolicy, loading } = usePolicies()
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

  const handleToggle = useCallback((id: number, isActive: boolean) => {
    updatePolicy(id, { is_active: !isActive })
  }, [updatePolicy])

  useEffect(() => () => clearTimeout(timerRef.current), [])

  if (loading && state.policies.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-500 text-sm">
        Loading policies...
      </div>
    )
  }

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
                onClick={() => handleToggle(policy.id, policy.is_active)}
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

interface PolicyFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export const PolicyFormModal = memo(({ isOpen, onClose, onSuccess }: PolicyFormModalProps) => {
  const { state } = useAppContext()
  const { createPolicy, loading: hookLoading, error: hookError } = usePolicies()
  const [name, setName] = useState('')
  const [deviceIp, setDeviceIp] = useState('')
  const [domain, setDomain] = useState('')
  const [action, setAction] = useState<'limit' | 'block'>('limit')
  const [rateKbps, setRateKbps] = useState(512)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [localLoading, setLocalLoading] = useState(false)

  const loading = localLoading || hookLoading

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setName('')
      setDeviceIp('')
      setDomain('')
      setAction('limit')
      setRateKbps(512)
      setErrors({})
    }
  }, [isOpen])

  const validate = useCallback((): boolean => {
    const e: Record<string, string> = {}
    if (!name.trim()) e.name = 'Name is required'
    if (action === 'limit' && rateKbps <= 0) e.rate = 'Rate must be positive'
    if (!deviceIp && !domain) e.target = 'Device or Domain required'
    setErrors(e)
    return Object.keys(e).length === 0
  }, [name, action, rateKbps, deviceIp, domain])

  const handleSubmit = useCallback(async () => {
    if (!validate()) return
    setLocalLoading(true)
    
    const result = await createPolicy({
      name: name.trim(),
      device_ip: deviceIp || null,
      domain: domain || null,
      action,
      rate_kbps: action === 'limit' ? rateKbps : null,
    })
    
    if (result.success) {
      onSuccess?.()
      onClose()
    } else {
      setErrors({ submit: result.error || hookError || 'Failed to create policy' })
    }
    setLocalLoading(false)
  }, [validate, createPolicy, name, deviceIp, domain, action, rateKbps, onClose, onSuccess, hookError])

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  // Handle body scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-md bg-gray-900 rounded-lg shadow-xl border border-gray-700 z-10">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-800">
          <h2 className="font-semibold text-gray-200">Create New Policy</h2>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-300 transition-colors text-xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
          <div>
            <label className="text-xs text-gray-400 uppercase block mb-1 font-medium">Name</label>
            <input 
              value={name} 
              onChange={e => setName(e.target.value)} 
              placeholder="e.g., Throttle YouTube"
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors" 
            />
            {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="text-xs text-gray-400 uppercase block mb-1 font-medium">Device IP (Optional)</label>
            <select 
              value={deviceIp} 
              onChange={e => setDeviceIp(e.target.value)} 
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors"
            >
              <option value="">All devices</option>
              {state.devices.map(d => (
                <option key={d.id} value={d.ip_address}>{d.hostname || d.ip_address}</option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">Leave empty to apply to all devices</p>
          </div>

          <div>
            <label className="text-xs text-gray-400 uppercase block mb-1 font-medium">Domain (Optional)</label>
            <input 
              value={domain} 
              onChange={e => setDomain(e.target.value)} 
              placeholder="e.g., youtube.com, netflix.com"
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm font-mono focus:outline-none focus:border-blue-500 transition-colors" 
            />
            <p className="text-xs text-gray-500 mt-1">Leave empty to apply to all domains</p>
          </div>

          <div>
            <label className="text-xs text-gray-400 uppercase block mb-1 font-medium">Action</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="radio" 
                  value="limit" 
                  checked={action === 'limit'} 
                  onChange={() => setAction('limit')} 
                  className="w-3.5 h-3.5"
                />
                <span className="text-sm">Limit</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="radio" 
                  value="block" 
                  checked={action === 'block'} 
                  onChange={() => setAction('block')} 
                  className="w-3.5 h-3.5"
                />
                <span className="text-sm">Block</span>
              </label>
            </div>
          </div>

          {action === 'limit' && (
            <div>
              <label className="text-xs text-gray-400 uppercase block mb-1 font-medium">Rate (kbps)</label>
              <div className="flex items-center gap-2">
                <input 
                  type="number" 
                  value={rateKbps} 
                  onChange={e => setRateKbps(parseInt(e.target.value, 10) || 0)} 
                  min={1}
                  className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors" 
                />
                <span className="text-xs text-gray-500">kbps</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Example: 512 kbps = 64 KB/s</p>
              {errors.rate && <p className="text-xs text-red-400 mt-1">{errors.rate}</p>}
            </div>
          )}

          {(errors.target || errors.submit) && (
            <div className="p-2 bg-red-900/30 border border-red-700 rounded text-red-300 text-xs">
              {errors.target || errors.submit}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-5 py-3 border-t border-gray-800">
          <button 
            onClick={onClose} 
            className="px-4 py-1.5 text-sm text-gray-400 hover:text-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmit} 
            disabled={loading}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-sm rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating...' : 'Create Policy'}
          </button>
        </div>
      </div>
    </div>
  )
})

PolicyFormModal.displayName = 'PolicyFormModal'