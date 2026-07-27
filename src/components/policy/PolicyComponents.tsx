import React, { memo, useState, useCallback, useRef, useEffect } from 'react'
import { Policy, getDeviceDisplayName, formatMacAddress, getDeviceSelectLabel } from '../../types'
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

  const getDeviceDisplay = (policy: Policy): string => {
    if (policy.device_mac) {
      const device = state.devices.find(d => d.mac_address === policy.device_mac)
      if (device) return getDeviceDisplayName(device)
      return formatMacAddress(policy.device_mac)
    }
    if (policy.device_ip) {
      const device = state.devices.find(d => d.ip_address === policy.device_ip)
      if (device) return getDeviceDisplayName(device)
      return policy.device_ip
    }
    return 'All devices'
  }

  const getActionDisplay = (policy: Policy): JSX.Element => {
    if (policy.action === 'limit') {
      return <span className="px-2 py-0.5 rounded text-xs bg-blue-900/50 text-blue-300">LIMIT</span>
    }
    if (policy.action === 'block') {
      return <span className="px-2 py-0.5 rounded text-xs bg-red-900/50 text-red-300">BLOCK</span>
    }
    if (policy.action === 'priority') {
      const colorClass = policy.priority_level === 'high' ? 'bg-red-900/50 text-red-300' :
                         policy.priority_level === 'low' ? 'bg-blue-900/50 text-blue-300' :
                         'bg-yellow-900/50 text-yellow-300'
      const levelText = policy.priority_level?.toUpperCase() || 'NORMAL'
      return <span className={`px-2 py-0.5 rounded text-xs ${colorClass}`}>PRIORITY {levelText}</span>
    }
    return <span className="px-2 py-0.5 rounded text-xs bg-gray-700 text-gray-300">—</span>
  }

  if (loading && state.policies.length === 0) {
    return <div className="flex items-center justify-center py-12 text-gray-500 text-sm">Loading policies...</div>
  }

  if (!state.policies.length) {
    return <div className="flex items-center justify-center py-12 text-gray-500 text-sm">No policies configured. Click "Add Policy" to get started.</div>
  }

  return (
    <table className="w-full text-sm">
      <thead className="border-b border-gray-800">
        <tr className="text-left text-gray-400">
          <th className="px-3 py-2 font-medium">Name</th>
          <th className="px-3 py-2 font-medium">Device</th>
          <th className="px-3 py-2 font-medium">Domain</th>
          <th className="px-3 py-2 font-medium">Action</th>
          <th className="px-3 py-2 font-medium">Rate/Priority</th>
          <th className="px-3 py-2 font-medium">Status</th>
          <th className="px-3 py-2 font-medium"></th>
        </tr>
      </thead>
      <tbody>
        {state.policies.map(policy => (
          <tr key={policy.id} className="border-b border-gray-800 hover:bg-gray-800/50">
            <td className="px-3 py-2">{policy.name}</td>
            <td className="px-3 py-2 text-xs text-gray-400">{getDeviceDisplay(policy)}</td>
            <td className="px-3 py-2 font-mono text-xs text-gray-400">{policy.domain || '—'}</td>
            <td className="px-3 py-2">{getActionDisplay(policy)}</td>
            <td className="px-3 py-2 font-mono text-xs text-gray-400">
              {policy.action === 'limit' && formatRate(policy.rate_kbps)}
              {policy.action === 'priority' && (policy.priority_level?.toUpperCase() || 'NORMAL')}
              {policy.action !== 'limit' && policy.action !== 'priority' && '—'}
            </td>
            <td className="px-3 py-2">
              <button
                onClick={() => handleToggle(policy.id, policy.is_active)}
                className={`relative w-9 h-5 rounded-full transition-colors ${policy.is_active ? 'bg-green-600' : 'bg-gray-700'}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${policy.is_active ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </button>
            </td>
            <td className="px-3 py-2">
              <button
                onClick={() => handleDelete(policy.id)}
                className={`text-xs px-2 py-1 rounded transition-colors ${confirmId === policy.id ? 'bg-red-600 text-white' : 'text-gray-500 hover:text-red-400'}`}
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
  const [selectedDeviceId, setSelectedDeviceId] = useState<number | ''>('')
  const [domain, setDomain] = useState('')
  const [action, setAction] = useState<'limit' | 'block' | 'priority'>('limit')
  const [rateKbps, setRateKbps] = useState(512)
  const [priorityLevel, setPriorityLevel] = useState<'high' | 'normal' | 'low'>('normal')
  const [minBandwidth, setMinBandwidth] = useState<number>(0)
  const [maxBandwidth, setMaxBandwidth] = useState<number>(0)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [localLoading, setLocalLoading] = useState(false)

  const loading = localLoading || hookLoading
  const selectedDevice = selectedDeviceId ? state.devices.find(d => d.id === selectedDeviceId) : null
  const hasInitialized = useRef(false)
 useEffect(() => {
  // Only reset when modal FIRST opens, not on every render
  if (isOpen && !hasInitialized.current) {
    setName('')
    setSelectedDeviceId('')
    setDomain('')
    setAction('limit')
    setRateKbps(512)
    setPriorityLevel('normal')
    setMinBandwidth(0)
    setMaxBandwidth(0)
    setErrors({})
    hasInitialized.current = true
  }
  
  // Reset the flag when modal closes
  if (!isOpen) {
    hasInitialized.current = false
  }
}, [isOpen])

  const validate = useCallback((): boolean => {
    const e: Record<string, string> = {}
    if (!name.trim()) e.name = 'Name is required'
    if (action === 'limit' && rateKbps <= 0) e.rate = 'Rate must be positive'
    if (!selectedDevice && !domain) e.target = 'Device or Domain required'
    setErrors(e)
    return Object.keys(e).length === 0
  }, [name, action, rateKbps, selectedDevice, domain])

  const handleSubmit = useCallback(async () => {
    if (!validate()) return
    setLocalLoading(true)

    // Build request body
    const requestBody: any = {
      name: name.trim(),
      action: action,
    }

    if (selectedDevice?.mac_address) {
      requestBody.device_mac = selectedDevice.mac_address
    } else if (selectedDevice?.ip_address) {
      requestBody.device_ip = selectedDevice.ip_address
    }

    if (domain) requestBody.domain = domain

    if (action === 'limit' && rateKbps) {
      requestBody.rate_kbps = rateKbps
    }

    // 🔴 CRITICAL: Priority fields
    if (action === 'priority') {
      requestBody.priority_level = priorityLevel
      if (minBandwidth > 0) requestBody.min_bandwidth_kbps = minBandwidth
      if (maxBandwidth > 0) requestBody.max_bandwidth_kbps = maxBandwidth
    }

    console.log('Submitting policy:', requestBody)

    const result = await createPolicy(requestBody)

    if (result.success) {
      onSuccess?.()
      onClose()
    } else {
      setErrors({ submit: result.error || hookError || 'Failed to create policy' })
    }
    setLocalLoading(false)
  }, [validate, createPolicy, name, selectedDevice, domain, action, rateKbps, priorityLevel, minBandwidth, maxBandwidth, onClose, onSuccess, hookError])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose()
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-gray-900 rounded-lg shadow-xl border border-gray-700 z-10">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-800">
          <h2 className="font-semibold text-gray-200">Create New Policy</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300 text-xl leading-none">×</button>
        </div>

        <div className="p-5 space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
          <div>
            <label className="text-xs text-gray-400 uppercase block mb-1 font-medium">Name</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g., Throttle YouTube"
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            />
            {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="text-xs text-gray-400 uppercase block mb-1 font-medium">Device (Optional)</label>
            <select
              value={selectedDeviceId}
              onChange={e => setSelectedDeviceId(e.target.value ? Number(e.target.value) : '')}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="">All devices</option>
              {state.devices.map(d => {
                let label = ''
                if (d.hostname) {
                  label = d.hostname
                  if (d.mac_address) label += ` [${d.mac_address.toLowerCase()}]`
                  else label += ` (${d.ip_address})`
                } else if (d.mac_address) {
                  label = `${d.mac_address.toLowerCase()} (${d.ip_address})`
                } else {
                  label = d.ip_address
                }
                return <option key={d.id} value={d.id}>{label}</option>
              })}
            </select>
          </div>

          <div>
            <label className="text-xs text-gray-400 uppercase block mb-1 font-medium">Domain (Optional)</label>
            <input
              value={domain}
              onChange={e => setDomain(e.target.value)}
              placeholder="e.g., youtube.com"
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm font-mono focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 uppercase block mb-1 font-medium">Action</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setAction('limit')}
                className={`px-3 py-1.5 text-sm rounded transition-colors ${action === 'limit' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
              >
                📊 LIMIT
              </button>
              <button
                type="button"
                onClick={() => setAction('block')}
                className={`px-3 py-1.5 text-sm rounded transition-colors ${action === 'block' ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
              >
                🚫 BLOCK
              </button>
              <button
                type="button"
                onClick={() => setAction('priority')}
                className={`px-3 py-1.5 text-sm rounded transition-colors ${action === 'priority' ? 'bg-yellow-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
              >
                ⭐ PRIORITY
              </button>
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
                  className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                />
                <span className="text-xs text-gray-500">kbps</span>
              </div>
              {errors.rate && <p className="text-xs text-red-400 mt-1">{errors.rate}</p>}
            </div>
          )}

          {action === 'priority' && (
            <>
              <div>
                <label className="text-xs text-gray-400 uppercase block mb-1 font-medium">Priority Level</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPriorityLevel('high')}
                    className={`px-3 py-1.5 text-sm rounded transition-colors ${priorityLevel === 'high' ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                  >
                    🔴 HIGH
                  </button>
                  <button
                    type="button"
                    onClick={() => setPriorityLevel('normal')}
                    className={`px-3 py-1.5 text-sm rounded transition-colors ${priorityLevel === 'normal' ? 'bg-yellow-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                  >
                    🟡 NORMAL
                  </button>
                  <button
                    type="button"
                    onClick={() => setPriorityLevel('low')}
                    className={`px-3 py-1.5 text-sm rounded transition-colors ${priorityLevel === 'low' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                  >
                    🔵 LOW
                  </button>
                </div>
              </div>
              <div className="text-xs text-gray-500 bg-gray-800/50 p-2 rounded">
                {priorityLevel === 'high' && '🔴 HIGH priority traffic gets bandwidth first. When HIGH is idle, other traffic can use full bandwidth.'}
                {priorityLevel === 'normal' && '🟡 NORMAL priority traffic is standard web browsing.'}
                {priorityLevel === 'low' && '🔵 LOW priority traffic yields to higher priorities, but can use full bandwidth when they are idle.'}
              </div>
            </>
          )}

          {(errors.target || errors.submit) && (
            <div className="p-2 bg-red-900/30 border border-red-700 rounded text-red-300 text-xs">
              {errors.target || errors.submit}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 px-5 py-3 border-t border-gray-800">
          <button onClick={onClose} className="px-4 py-1.5 text-sm text-gray-400 hover:text-gray-200">Cancel</button>
          <button onClick={handleSubmit} disabled={loading} className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-sm rounded disabled:opacity-50">
            {loading ? 'Creating...' : 'Create Policy'}
          </button>
        </div>
      </div>
    </div>
  )
})

PolicyFormModal.displayName = 'PolicyFormModal'