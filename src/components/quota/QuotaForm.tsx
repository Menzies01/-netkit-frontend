import React, { memo, useState, useCallback, useEffect } from 'react'
import { DataQuota, CreateQuotaBody } from '../../types'
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
  const [deviceIp, setDeviceIp] = useState('')
  const [domain, setDomain] = useState('')
  const [limitGb, setLimitGb] = useState('')
  const [resetPeriod, setResetPeriod] = useState<CreateQuotaBody['reset_period']>('monthly')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [localLoading, setLocalLoading] = useState(false)

  const loading = localLoading || hookLoading

  // Reset form when modal opens or quota changes
  useEffect(() => {
    if (isOpen) {
      if (quota) {
        // Edit mode - populate form
        setName(quota.name || '')
        setDeviceIp(quota.device_ip || '')
        setDomain(quota.domain || '')
        setLimitGb(quota.limit_gb?.toString() || '')
        setResetPeriod(quota.reset_period || 'monthly')
      } else {
        // Create mode - reset form
        setName('')
        setDeviceIp('')
        setDomain('')
        setLimitGb('')
        setResetPeriod('monthly')
      }
      setErrors({})
    }
  }, [isOpen, quota])

  const validate = useCallback((): boolean => {
    const e: Record<string, string> = {}
    if (!name.trim()) e.name = 'Name is required'
    if (!domain.trim()) e.domain = 'Domain is required'
    
    const gb = parseFloat(limitGb)
    if (isNaN(gb) || gb <= 0) e.limit = 'Limit must be a positive number (GB)'
    if (gb > 10000) e.limit = 'Limit cannot exceed 10,000 GB (10 TB)'
    
    setErrors(e)
    return Object.keys(e).length === 0
  }, [name, domain, limitGb])

  const handleSubmit = useCallback(async () => {
    if (!validate()) return
    
    setLocalLoading(true)
    
    const gb = parseFloat(limitGb)
    
    if (quota) {
      // Update existing quota
      const result = await updateQuota(quota.id, {
        name: name.trim(),
        device_ip: deviceIp || null,
        domain: domain.trim(),
        limit_gb: gb,
        reset_period: resetPeriod,
      })
      
      if (result.success) {
        onSuccess?.()
        onClose()
      } else {
        setErrors({ submit: result.error || hookError || 'Failed to update quota' })
      }
    } else {
      // Create new quota
      const result = await createQuota({
        name: name.trim(),
        device_ip: deviceIp || null,
        domain: domain.trim(),
        limit_gb: gb,
        reset_period: resetPeriod,
      })
      
      if (result.success) {
        onSuccess?.()
        onClose()
      } else {
        setErrors({ submit: result.error || hookError || 'Failed to create quota' })
      }
    }
    
    setLocalLoading(false)
  }, [validate, name, deviceIp, domain, limitGb, resetPeriod, quota, createQuota, updateQuota, onClose, onSuccess, hookError])

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
          <h2 className="font-semibold text-gray-200">
            {quota ? 'Edit Data Quota' : 'New Data Quota'}
          </h2>
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
              placeholder="e.g., YouTube Daily Limit"
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
                <option key={d.id} value={d.ip_address}>
                  {d.hostname || d.ip_address}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">Leave empty to apply to all devices</p>
          </div>

          <div>
            <label className="text-xs text-gray-400 uppercase block mb-1 font-medium">Domain</label>
            <input 
              value={domain} 
              onChange={e => setDomain(e.target.value)} 
              placeholder="e.g., youtube.com, netflix.com"
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm font-mono focus:outline-none focus:border-blue-500 transition-colors" 
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
                className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors" 
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
                    resetPeriod === period
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
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
            {loading ? (quota ? 'Updating...' : 'Creating...') : (quota ? 'Update Quota' : 'Create Quota')}
          </button>
        </div>
      </div>
    </div>
  )
})

QuotaFormModal.displayName = 'QuotaFormModal'