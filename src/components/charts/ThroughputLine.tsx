import React, { memo, useRef, useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { formatBytesShort } from '../../utils/formatters'

interface Props {
  triggerValue: number
  totalBytes: number
}

export const ThroughputLine = memo(({ triggerValue, totalBytes }: Props) => {
  const bufferRef = useRef<Map<number, number>>(new Map())
  const [chartData, setChartData] = useState<{ time: number; bytes: number }[]>([])

  useEffect(() => {
    if (triggerValue === 0) return
    const now = Math.floor(Date.now() / 5000) * 5000
    const cutoff = now - 10 * 60 * 1000
    
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
    return <div className="flex items-center justify-center h-36 text-gray-600">Waiting for data...</div>
  }

  return (
    <ResponsiveContainer width="100%" height={144}>
      <LineChart data={chartData} margin={{ top: 4, right: 4, bottom: 4, left: 0 }}>
        <XAxis
          dataKey="time"
          type="number"
          domain={['dataMin', 'dataMax']}
          tickFormatter={(v: number) => new Date(v).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          tick={{ fontSize: 9, fill: '#6B7280' }}
        />
        <YAxis tickFormatter={formatBytesShort} tick={{ fontSize: 9, fill: '#6B7280' }} width={40} />
        <Tooltip
          contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: 4 }}
          formatter={(v: number) => [formatBytesShort(v), 'Throughput']}
        />
        <Line type="monotone" dataKey="bytes" stroke="#3B82F6" strokeWidth={1.5} dot={false} isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
  )
})

ThroughputLine.displayName = 'ThroughputLine'