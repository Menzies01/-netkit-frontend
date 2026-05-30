import React, { memo, useState, useCallback, useEffect } from 'react'
import { DataQuota, QuotaUsage } from '../../types'
import { useQuotas } from '../../hooks/useQuotas'
import { QuotaProgress } from './QuotaProgress'
import { formatBytes } from '../../utils/formatters'

interface QuotaTableProps {
  onEdit?: (quota: DataQuota) => void
  refreshTrigger?: number
}

export const QuotaTable = memo(({ onEdit, refreshTrigger = 0 }: QuotaTableProps) => {
  const { quotas, fetchQuotas, updateQuota, resetQuota, deleteQuota, loading, error, fetchQuotaUsage } = useQuotas()
  const [usageMap, setUsageMap] = useState<Map<number, QuotaUsage>>(new Map())
  const [loadingUsage, setLoadingUsage] = useState<Set<number>>(new Set())
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)

  useEffect(() => {
    fetchQuotas()
  }, [fetchQuotas, refreshTrigger])

  // Load usage for each quota
  useEffect(() => {
    const loadAllUsage = async () => {
      for (const quota of quotas) {
        if (!loadingUsage.has(quota.id) && !usageMap.has(quota.id)) {
          setLoadingUsage(prev => new Set(prev).add(quota.id))
          try {
            const usage = await fetchQuotaUsage(quota.id)
            if (usage) {
              setUsageMap(prev => new Map(prev).set(quota.id, usage))
            }
          } catch (err) {
            console.error(`Failed to load usage for quota ${quota.id}:`, err)
          } finally {
            setLoadingUsage(prev => {
              const next = new Set(prev)
              next.delete(quota.id)
              return next
            })
          }
        }
      }
    }
    
    if (quotas.length > 0) {
      loadAllUsage()
    }
  }, [quotas, fetchQuotaUsage, usageMap, loadingUsage])

  const handleToggleActive = useCallback(async (quota: DataQuota) => {
    await updateQuota(quota.id, { is_active: !quota.is_active })
    if (!quota.is_active) {
      setUsageMap(prev => {
        const next = new Map(prev)
        next.delete(quota.id)
        return next
      })
    } else {
      const usage = await fetchQuotaUsage(quota.id)
      if (usage) {
        setUsageMap(prev => new Map(prev).set(quota.id, usage))
      }
    }
  }, [updateQuota, fetchQuotaUsage])

  const handleReset = useCallback(async (id: number) => {
    await resetQuota(id)
    const usage = await fetchQuotaUsage(id)
    if (usage) {
      setUsageMap(prev => new Map(prev).set(id, usage))
    }
  }, [resetQuota, fetchQuotaUsage])

  const handleDelete = useCallback((id: number) => {
    if (confirmDeleteId === id) {
      deleteQuota(id)
      setConfirmDeleteId(null)
      setUsageMap(prev => {
        const next = new Map(prev)
        next.delete(id)
        return next
      })
    } else {
      setConfirmDeleteId(id)
      setTimeout(() => setConfirmDeleteId(null), 3000)
    }
  }, [confirmDeleteId, deleteQuota])

  const getPeriodLabel = (period: string): string => {
    switch (period) {
      case 'session': return 'Session'
      case 'daily': return 'Daily'
      case 'weekly': return 'Weekly'
      case 'monthly': return 'Monthly'
      default: return period
    }
  }

  if (loading && quotas.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-500 text-sm">
        Loading quotas...
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-red-900/50 border border-red-700 rounded text-red-200 text-sm">
        Error: {error}
      </div>
    )
  }

  if (quotas.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-500 text-sm">
        No data quotas configured. Click "Add Quota" to get started.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="border-b border-gray-800">
          <tr className="text-left text-gray-400">
            <th className="px-3 py-2 font-medium">Name</th>
            <th className="px-3 py-2 font-medium">Target</th>
            <th className="px-3 py-2 font-medium">Limit</th>
            <th className="px-3 py-2 font-medium">Period</th>
            <th className="px-3 py-2 font-medium">Usage</th>
            <th className="px-3 py-2 font-medium">Status</th>
            <th className="px-3 py-2 font-medium"></th>
          </tr>
        </thead>
        <tbody>
          {quotas.map((quota) => {
            const usage = usageMap.get(quota.id)
            const isLoading = loadingUsage.has(quota.id)
            
            return (
              <tr key={quota.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                <td className="px-3 py-2 font-medium">{quota.name}</td>
                <td className="px-3 py-2">
                  {quota.device_ip ? (
                    <span className="font-mono text-xs text-gray-400">{quota.device_ip}</span>
                  ) : (
                    <span className="text-xs text-gray-500">All Devices</span>
                  )}
                  <div className="text-xs text-gray-500">{quota.domain}</div>
                </td>
                <td className="px-3 py-2 font-mono text-xs text-gray-300">
                  {formatBytes(quota.limit_bytes)}
                </td>
                <td className="px-3 py-2 text-xs">
                  <span className="px-2 py-0.5 rounded bg-gray-800">
                    {getPeriodLabel(quota.reset_period)}
                  </span>
                </td>
                <td className="px-3 py-2 min-w-[220px]">
                  {isLoading ? (
                    <div className="text-xs text-gray-500">Loading usage...</div>
                  ) : usage ? (
                    <QuotaProgress
                      usedBytes={usage.used_bytes}
                      limitBytes={quota.limit_bytes}
                      percentUsed={usage.percent_used}
                      isEnforcing={quota.is_enforcing}
                    />
                  ) : (
                    <button
                      onClick={async () => {
                        const u = await fetchQuotaUsage(quota.id)
                        if (u) setUsageMap(prev => new Map(prev).set(quota.id, u))
                      }}
                      className="text-xs text-blue-400 hover:text-blue-300"
                    >
                      Load usage
                    </button>
                  )}
                </td>
                <td className="px-3 py-2">
                  <button
                    onClick={() => handleToggleActive(quota)}
                    className={`relative w-9 h-5 rounded-full transition-colors ${
                      quota.is_active ? 'bg-green-600' : 'bg-gray-700'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                        quota.is_active ? 'translate-x-4' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </td>
                <td className="px-3 py-2">
                  <div className="flex gap-1">
                    {quota.is_enforcing && (
                      <button
                        onClick={() => handleReset(quota.id)}
                        className="text-xs px-2 py-1 rounded bg-yellow-600/20 text-yellow-400 hover:bg-yellow-600/30 transition-colors"
                        title="Reset quota period"
                      >
                        ↻
                      </button>
                    )}
                    {onEdit && (
                      <button
                        onClick={() => onEdit(quota)}
                        className="text-xs px-2 py-1 rounded text-gray-500 hover:text-blue-400 transition-colors"
                      >
                        Edit
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(quota.id)}
                      className={`text-xs px-2 py-1 rounded transition-colors ${
                        confirmDeleteId === quota.id ? 'bg-red-600 text-white' : 'text-gray-500 hover:text-red-400'
                      }`}
                    >
                      {confirmDeleteId === quota.id ? 'Confirm?' : 'Delete'}
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
})

QuotaTable.displayName = 'QuotaTable'