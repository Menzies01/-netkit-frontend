import React, { useEffect, useState, useCallback } from 'react'
import { usePolicies } from '../hooks/usePolicies'
import { PolicyTable, PolicyForm } from '../components/policy/PolicyComponents'

export const Policies = () => {
  const { fetchPolicies } = usePolicies()
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    fetchPolicies()
  }, [fetchPolicies])

  const handleClose = useCallback(() => {
    setShowForm(false)
    fetchPolicies()
  }, [fetchPolicies])

  return (
    <div className="flex flex-col h-full overflow-hidden bg-gray-950">
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800 bg-gray-900">
        <div>
          <h1 className="text-lg font-semibold">QoS Policies</h1>
          <p className="text-xs text-gray-500">Enforced within 10 seconds via tc + iptables</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-sm rounded transition-colors"
        >
          + Add Policy
        </button>
      </div>
      <div className="flex-1 overflow-auto p-4">
        <div className="bg-gray-900 rounded border border-gray-800">
          <PolicyTable />
        </div>
      </div>
      {showForm && <PolicyForm onClose={handleClose} />}
    </div>
  )
}