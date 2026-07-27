import React, { memo, useState, useCallback, useEffect, useRef } from 'react'
import { DataQuota, CreateQuotaData, UpdateQuotaData, getDeviceSelectLabel } from '../../types'
import { useQuotas } from '../../hooks/useQuotas'
import { useAppContext } from '../../context/AppContext'

interface QuotaFormModalProps {
  isOpen: boolean
  quota?: DataQuota | null
  onClose: () => void
  onSuccess?: () => void
}

export const QuotaFormModal = memo(({ isOpen, quota, onClose, onSuccess }: QuotaFormModalProps) => {
  const { state } = useAppContext()
  const { createQuota, updateQuota, loading: hookLoading, error: hookError } = useQuotas()
  
  const [name, setName] = useState('')
  const [selectedDeviceId, setSelectedDeviceId] = useState<number | ''>('')
  const [domain, setDomain] = useState('')
  const [limitGb, setLimitGb] = useState('')
  const [resetPeriod, setResetPeriod] = useState<CreateQuotaData['reset_period']>('monthly')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [localLoading, setLocalLoading] = useState(false)
  const hasInitialized = useRef(false)
  const loading = localLoading || hookLoading
  const selectedDevice = selectedDeviceId ? state.devices.find(d => d.id === selectedDeviceId) : null

  useEffect(() => {
    if (isOpen) {
      if (quota) {
        setName(quota.name || '')
        let deviceId: number | '' = ''
        if (quota.device_mac) {
          const device = state.devices.find(d => d.mac_address === quota.device_mac)
          if (device) deviceId = device.id
        } else if (quota.device_ip) {
          const device = state.devices.find(d => d.ip_address === quota.device_ip)
          if (device) deviceId = device.id
        }
        setSelectedDeviceId(deviceId)
        setDomain(quota.domain || '')
        setLimitGb(quota.limit_gb?.toString() || '')
        setResetPeriod(quota.reset_period || 'monthly')
      } else {
        setName('')
        setSelectedDeviceId('')
        setDomain('')
        setLimitGb('')
        setResetPeriod('monthly')
      }
      setErrors({})
    }
  }, [isOpen, quota, state.devices])

  const validate = useCallback((): boolean => {
    const e: Record<string, string> = {}
    if (!name.trim()) e.name = 'Name is required'
    if (!domain.trim()) e.domain = 'Domain is required'
    
    const gb = parseFloat(limitGb)
    if (isNaN(gb) || gb <= 0) e.limit = 'Limit must be a positive number (GB)'
    if (gb > 10000) e.limit = 'Limit cannot exceed 10,000 GB'
    
    setErrors(e)
    return Object.keys(e).length === 0
  }, [name, domain, limitGb])

  const handleSubmit = useCallback(async () => {
    if (!validate()) return
    setLocalLoading(true)
    
    const gb = parseFloat(limitGb)
    
    if (quota) {
      const updateData: UpdateQuotaData = {
        name: name.trim(),
        domain: domain.trim(),
        limit_gb: gb,
        reset_period: resetPeriod,
      }
      if (selectedDevice) {
        if (selectedDevice.mac_address) {
          updateData.device_mac = selectedDevice.mac_address
        } else {
          updateData.device_ip = selectedDevice.ip_address
        }
      } else {
        updateData.device_mac = null
        updateData.device_ip = null
      }
      
      const result = await updateQuota(quota.id, updateData)
      if (result.success) {
        onSuccess?.()
        onClose()
      } else {
        setErrors({ submit: result.error || hookError || 'Failed to update quota' })
      }
    } else {
      const createData: CreateQuotaData = {
        name: name.trim(),
        domain: domain.trim(),
        limit_gb: gb,
        reset_period: resetPeriod,
      }
      if (selectedDevice) {
        if (selectedDevice.mac_address) {
          createData.device_mac = selectedDevice.mac_address
        } else {
          createData.device_ip = selectedDevice.ip_address
        }
      }
      
      const result = await createQuota(createData)
      if (result.success) {
        onSuccess?.()
        onClose()
      } else {
        setErrors({ submit: result.error || hookError || 'Failed to create quota' })
      }
    }
    
    setLocalLoading(false)
  }, [validate, name, selectedDevice, domain, limitGb, resetPeriod, quota, createQuota, updateQuota, onClose, onSuccess, hookError])

useEffect(() => {
  // Only reset when modal FIRST opens, not on every render
  if (isOpen && !hasInitialized.current) {
    if (quota) {
      // Edit mode - populate form
      setName(quota.name || '')
      setSelectedDeviceId(quota.device_id || '')
      setDomain(quota.domain || '')
      setLimitGb(quota.limit_gb?.toString() || '')
      setResetPeriod(quota.reset_period || 'monthly')
    } else {
      // Create mode - reset form
      setName('')
      setSelectedDeviceId('')
      setDomain('')
      setLimitGb('')
      setResetPeriod('monthly')
    }
    setErrors({})
    hasInitialized.current = true
  }
  
  // Reset the flag when modal closes
  if (!isOpen) {
    hasInitialized.current = false
  }
}, [isOpen, quota])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-gray-900 rounded-lg shadow-xl border border-gray-700 z-10">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-800">
          <h2 className="font-semibold text-gray-200">{quota ? 'Edit Data Quota' : 'New Data Quota'}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300 text-xl leading-none">×</button>
        </div>

        <div className="p-5 space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
          <div>
            <label className="text-xs text-gray-400 uppercase block mb-1 font-medium">Name</label>
            <input 
              value={name} 
              onChange={e => setName(e.target.value)} 
              placeholder="e.g., YouTube Daily Limit"
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
                  if (d.mac_address) {
                    label += ` [${d.mac_address.toLowerCase()}]`
                  } else {
                    label += ` (${d.ip_address})`
                  }
                } else if (d.mac_address) {
                  label = `${d.mac_address.toLowerCase()} (${d.ip_address})`
                } else {
                  label = d.ip_address
                }
                return <option key={d.id} value={d.id}>{label}</option>
              })}
            </select>
            <p className="text-xs text-gray-500 mt-1">Leave empty to apply to all devices</p>
          </div>

          <div>
            <label className="text-xs text-gray-400 uppercase block mb-1 font-medium">Domain</label>
            <input 
              value={domain} 
              onChange={e => setDomain(e.target.value)} 
              placeholder="e.g., youtube.com"
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm font-mono focus:outline-none focus:border-blue-500" 
            />
            {errors.domain && <p className="text-xs text-red-400 mt-1">{errors.domain}</p>}
          </div>

          <div>
            <label className="text-xs text-gray-400 uppercase block mb-1 font-medium">Data Limit</label>
            <div className="flex gap-2">
              <input 
                type="number" 
                value={limitGb} 
                onChange={e => setLimitGb(e.target.value)} 
                placeholder="GB"
                step="0.1"
                min="0.1"
                className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500" 
              />
              <span className="text-sm text-gray-400 py-2">GB</span>
            </div>
            {errors.limit && <p className="text-xs text-red-400 mt-1">{errors.limit}</p>}
          </div>

          <div>
            <label className="text-xs text-gray-400 uppercase block mb-1 font-medium">Reset Period</label>
            <div className="grid grid-cols-4 gap-1">
              {(['session', 'daily', 'weekly', 'monthly'] as const).map(period => (
                <button
                  key={period}
                  onClick={() => setResetPeriod(period)}
                  className={`px-2 py-1.5 text-xs rounded transition-colors ${
                    resetPeriod === period ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {period.charAt(0).toUpperCase() + period.slice(1)}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {resetPeriod === 'session' && 'Never auto-resets (manual reset only)'}
              {resetPeriod === 'daily' && 'Resets every day at midnight'}
              {resetPeriod === 'weekly' && 'Resets every 7 days'}
              {resetPeriod === 'monthly' && 'Resets every 30 days'}
            </p>
          </div>

          {errors.submit && (
            <div className="p-2 bg-red-900/30 border border-red-700 rounded text-red-300 text-xs">
              {errors.submit}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 px-5 py-3 border-t border-gray-800">
          <button onClick={onClose} className="px-4 py-1.5 text-sm text-gray-400 hover:text-gray-200">Cancel</button>
          <button onClick={handleSubmit} disabled={loading} className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-sm rounded disabled:opacity-50">
            {loading ? (quota ? 'Updating...' : 'Creating...') : (quota ? 'Update Quota' : 'Create Quota')}
          </button>
        </div>
      </div>
    </div>
  )
})

QuotaFormModal.displayName = 'QuotaFormModal'