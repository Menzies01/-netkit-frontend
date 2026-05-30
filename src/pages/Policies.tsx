import React, { useEffect, useState, useCallback } from 'react'
import { usePolicies } from '../hooks/usePolicies'
import { PolicyTable, PolicyFormModal } from '../components/policy/PolicyComponents'

export const Policies = () => {
  const { fetchPolicies, loading, error } = usePolicies()
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    fetchPolicies()
  }, [fetchPolicies])

  const handleClose = useCallback(() => {
    setShowModal(false)
    fetchPolicies()
  }, [fetchPolicies])

  const handleOpen = useCallback(() => {
    setShowModal(true)
  }, [])

  return (
    <div className="flex flex-col h-full overflow-hidden bg-gray-950">
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800 bg-gray-900">
        <div>
          <h1 className="text-lg font-semibold">QoS Policies</h1>
          <p className="text-xs text-gray-500">Enforced within 10 seconds via tc + iptables</p>
        </div>
        <button
          onClick={handleOpen}
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-sm rounded transition-colors"
        >
          + Add Policy
        </button>
      </div>
      
      <div className="flex-1 overflow-auto p-4">
        {error && (
          <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded text-red-200 text-sm">
            Error loading policies: {error}
          </div>
        )}
        
        {loading ? (
          <div className="flex items-center justify-center py-12 text-gray-500 text-sm">
            Loading policies...
          </div>
        ) : (
          <div className="bg-gray-900 rounded border border-gray-800">
            <PolicyTable />
          </div>
        )}
      </div>
      
      <PolicyFormModal isOpen={showModal} onClose={handleClose} onSuccess={handleClose} />
    </div>
  )
}