import React, { useState, useCallback } from 'react'
import { QuotaTable } from '../components/quota/QuotaTable'
import { QuotaFormModal } from '../components/quota/QuotaForm'
import { DataQuota } from '../types'

export const Quotas = () => {
  const [showModal, setShowModal] = useState(false)
  const [editingQuota, setEditingQuota] = useState<DataQuota | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const handleClose = useCallback(() => {
    setShowModal(false)
    setEditingQuota(null)
    setRefreshKey(prev => prev + 1)
  }, [])

  const handleOpenCreate = useCallback(() => {
    setEditingQuota(null)
    setShowModal(true)
  }, [])

  const handleEdit = useCallback((quota: DataQuota) => {
    setEditingQuota(quota)
    setShowModal(true)
  }, [])

  return (
    <div className="flex flex-col h-full overflow-hidden bg-gray-950">
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800 bg-gray-900">
        <div>
          <h1 className="text-lg font-semibold">Data Quotas</h1>
          <p className="text-xs text-gray-500">
            Automatically block domains when data usage exceeds limits
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-sm rounded transition-colors"
        >
          + Add Quota
        </button>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="bg-gray-900 rounded border border-gray-800">
          <QuotaTable key={refreshKey} onEdit={handleEdit} />
        </div>
      </div>

      <QuotaFormModal
        isOpen={showModal}
        quota={editingQuota}
        onClose={handleClose}
        onSuccess={handleClose}
      />
    </div>
  )
}