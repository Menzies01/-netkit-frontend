import React, { useState, useEffect, useCallback } from 'react'
import axios from 'axios'

interface PriorityStats {
  link_speed_mbps: number
  priority_classes: {
    high: {
      name: string
      current_mbps: number
      current_percent: number
      min_percent: number
      max_percent: number
      color: string
      icon: string
    }
    normal: {
      name: string
      current_mbps: number
      current_percent: number
      min_percent: number
      max_percent: number
      color: string
      icon: string
    }
    low: {
      name: string
      current_mbps: number
      current_percent: number
      min_percent: number
      max_percent: number
      color: string
      icon: string
    }
  }
  classified_domains: Record<string, number>  // ← This is a NUMBER, not string
}

export const PriorityMonitor: React.FC = () => {
  const [stats, setStats] = useState<PriorityStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = useCallback(async () => {
    try {
      const response = await axios.get('/api/qos/priority/stats')
      setStats(response.data)
      setError(null)
    } catch (err) {
      console.error('Failed to fetch priority stats:', err)
      setError('Priority QoS not configured')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()
    const interval = setInterval(fetchStats, 5000)
    return () => clearInterval(interval)
  }, [fetchStats])

  // Helper to convert priority number to string
  const getPriorityName = (priority: number): string => {
    if (priority === 1) return 'high'
    if (priority === 2) return 'normal'
    if (priority === 3) return 'low'
    return 'normal'
  }

  const getPriorityDisplay = (priority: number): string => {
    if (priority === 1) return 'HIGH'
    if (priority === 2) return 'NORMAL'
    if (priority === 3) return 'LOW'
    return 'NORMAL'
  }

  const getPriorityColor = (priority: number): string => {
    if (priority === 1) return 'bg-red-900/50 text-red-300'
    if (priority === 2) return 'bg-yellow-900/50 text-yellow-300'
    if (priority === 3) return 'bg-blue-900/50 text-blue-300'
    return 'bg-gray-900/50 text-gray-300'
  }

  const getBarColor = (color: string) => {
    switch (color) {
      case 'red': return 'bg-red-500'
      case 'yellow': return 'bg-yellow-500'
      case 'blue': return 'bg-blue-500'
      default: return 'bg-gray-500'
    }
  }

  if (loading) {
    return (
      <div className="p-4 text-center text-gray-500 text-sm">
        Loading priority queue stats...
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="p-4 text-center text-gray-500 text-sm">
        ⚠️ {error || 'No priority data available'}
        <button onClick={fetchStats} className="ml-2 text-blue-400 hover:text-blue-300">
          Retry
        </button>
      </div>
    )
  }

  const classes = [
    { key: 'high', data: stats.priority_classes.high, label: 'HIGH PRIORITY', desc: 'Critical traffic (UNISWA, VoIP, Zoom)' },
    { key: 'normal', data: stats.priority_classes.normal, label: 'NORMAL PRIORITY', desc: 'Standard web browsing, email' },
    { key: 'low', data: stats.priority_classes.low, label: 'LOW PRIORITY', desc: 'Background traffic (YouTube, Netflix, downloads)' }
  ]

  const hasClassifiedDomains = stats.classified_domains && Object.keys(stats.classified_domains).length > 0

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-200">⚡ Priority Queue Monitor</h3>
          <p className="text-xs text-gray-500">Bandwidth distribution by priority class</p>
        </div>
        <div className="text-right">
          <span className="text-xs text-gray-500">Total Link</span>
          <div className="text-sm font-mono text-gray-300">{stats.link_speed_mbps} Mbps</div>
        </div>
      </div>

      {/* Priority Bars */}
      <div className="space-y-4 mb-6">
        {classes.map(({ data, label, desc }) => (
          <div key={label}>
            <div className="flex justify-between text-xs mb-1">
              <div>
                <span className="text-gray-300">{data.icon} {label}</span>
                <span className="text-gray-500 text-xs ml-2">({desc})</span>
              </div>
              <span className="text-gray-400 font-mono">
                {data.current_mbps.toFixed(1)} Mbps ({data.current_percent}%)
              </span>
            </div>
            <div className="relative h-8 bg-gray-800 rounded-lg overflow-hidden">
              <div
                className={`absolute left-0 top-0 h-full ${getBarColor(data.color)} transition-all duration-500`}
                style={{ width: `${Math.min(data.current_percent, 100)}%` }}
              />
              <div className="absolute inset-0 flex items-center justify-between px-3 text-xs text-white font-mono">
                <span>Min: {data.min_percent}%</span>
                <span>Max: {data.max_percent === 100 ? '100%' : `${data.max_percent}%`}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Classified Domains - FIXED: priority is a number */}
      <div className="border-t border-gray-800 pt-4">
        <div className="text-xs text-gray-400 mb-2">📋 CLASSIFIED DOMAINS</div>
        {!hasClassifiedDomains ? (
          <p className="text-xs text-gray-500">
            No domains classified. Create a priority policy to see domains here.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {Object.entries(stats.classified_domains).map(([domain, priority]) => (
              <div
                key={domain}
                className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(priority)}`}
              >
                {domain} → {getPriorityDisplay(priority)}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Help Text */}
      <div className="border-t border-gray-800 mt-4 pt-3 text-xs text-gray-500">
        💡 <span className="text-gray-400">How it works:</span> HIGH priority gets 70% minimum bandwidth. 
        LOW priority is capped at 30%. NORMAL gets the rest.
      </div>
    </div>
  )
}