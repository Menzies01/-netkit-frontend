// src/components/charts/ThroughputLine.tsx
import React, { memo, useRef, useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { formatBytesShort } from '../../utils/formatters'

interface Props {
  triggerValue: number
  totalBytes: number
}

export const ThroughputLine = memo(({ triggerValue, totalBytes }: Props) => {
  const bufferRef = useRef<Map<number, number>>(new Map())
  const [chartData, setChartData] = useState<{ time: number; bytes: number }[]>([])
  const TEN_MIN = 10 * 60 * 1000

  useEffect(() => {
    if (triggerValue === 0) return
    const now = Math.floor(Date.now() / 5000) * 5000
    const cutoff = now - TEN_MIN
    
    bufferRef.current.set(now, totalBytes)
    for (const [t] of bufferRef.current) {
      if (t < cutoff) bufferRef.current.delete(t)
    }
    
    const points = Array.from(bufferRef.current.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([t, bytes]) => ({ time: t, bytes }))
    setChartData(points)
  }, [triggerValue, totalBytes])

  if (!chartData.length) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-500 text-sm bg-gray-900 rounded-lg">
        Waiting for data...
      </div>
    )
  }

  // Format time labels for better readability
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-2 shadow-lg">
          <p className="text-xs text-gray-400">{formatTime(label)}</p>
          <p className="text-sm font-mono text-blue-400">
            {formatBytesShort(payload[0].value)}
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
          <XAxis
            dataKey="time"
            type="number"
            domain={['dataMin', 'dataMax']}
            tickFormatter={formatTime}
            tick={{ fontSize: 10, fill: '#6b7280' }}
            interval="preserveStartEnd"
            minTickGap={50}
          />
          <YAxis
            tickFormatter={formatBytesShort}
            tick={{ fontSize: 10, fill: '#6b7280' }}
            width={50}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="bytes"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}, (p, n) => p.triggerValue === n.triggerValue)

ThroughputLine.displayName = 'ThroughputLine'