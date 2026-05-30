// src/components/charts/ThroughputLine.tsx
import React, { memo, useRef, useEffect, useState, useCallback } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine, Area, ComposedChart } from 'recharts'
import { formatBytesShort } from '../../utils/formatters'

interface Props {
  triggerValue: number
  totalBytes: number
}

interface DataPoint {
  time: number
  throughput: number  // bytes per second
  formattedTime: string
  isSpike: boolean
}

export const ThroughputLine = memo(({ triggerValue, totalBytes }: Props) => {
  const lastBytesRef = useRef<number>(0)
  const lastTimeRef = useRef<number>(0)
  const bufferRef = useRef<Map<number, { throughput: number; isSpike: boolean }>>(new Map())
  const [chartData, setChartData] = useState<DataPoint[]>([])
  const [stats, setStats] = useState<{ max: number; avg: number; spikeCount: number }>({ max: 0, avg: 0, spikeCount: 0 })
  const TEN_MIN = 10 * 60 * 1000

  useEffect(() => {
    // Skip first update (no previous data to calculate delta)
    if (lastBytesRef.current === 0) {
      lastBytesRef.current = totalBytes
      lastTimeRef.current = Date.now()
      return
    }

    const now = Date.now()
    const deltaBytes = totalBytes - lastBytesRef.current
    const deltaTimeSec = (now - lastTimeRef.current) / 1000
    
    // Calculate throughput in bytes per second
    let throughput = 0
    if (deltaTimeSec > 0 && deltaBytes > 0) {
      throughput = deltaBytes / deltaTimeSec
    }
    
    // Round timestamp to 5-second intervals for consistent grouping
    const roundedTime = Math.floor(now / 5000) * 5000
    
    // Detect spikes (throughput > 2x the average of last 10 readings)
    const allThroughputs = Array.from(bufferRef.current.values()).map(v => v.throughput)
    const avgThroughput = allThroughputs.length > 0 ? allThroughputs.reduce((a, b) => a + b, 0) / allThroughputs.length : 0
    const isSpike = throughput > avgThroughput * 2 && throughput > 50000 // > 50KB/s and 2x average
    
    // Store the throughput for this interval
    if (throughput > 0) {
      bufferRef.current.set(roundedTime, { throughput, isSpike })
    }
    
    // Update refs for next calculation
    lastBytesRef.current = totalBytes
    lastTimeRef.current = now
    
    // Clean up old data (keep last 10 minutes)
    const cutoff = now - TEN_MIN
    for (const [t] of bufferRef.current) {
      if (t < cutoff) bufferRef.current.delete(t)
    }
    
    // Convert to array and sort by time
    const points: DataPoint[] = Array.from(bufferRef.current.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([time, { throughput, isSpike }]) => ({
        time,
        throughput,
        formattedTime: new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        isSpike,
      }))
    
    setChartData(points)
    
    // Calculate stats
    if (points.length > 0) {
      const max = Math.max(...points.map(p => p.throughput))
      const avg = points.reduce((s, p) => s + p.throughput, 0) / points.length
      const spikeCount = points.filter(p => p.isSpike).length
      setStats({ max, avg, spikeCount })
    }
  }, [triggerValue, totalBytes, TEN_MIN])

  const formatTime = useCallback((timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }, [])

  const formatThroughput = useCallback((value: number) => {
    if (value === 0) return '0 B/s'
    if (value < 1024) return `${value.toFixed(0)} B/s`
    if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB/s`
    return `${(value / (1024 * 1024)).toFixed(1)} MB/s`
  }, [])

  const CustomTooltip = useCallback(({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-lg min-w-[180px]">
          <p className="text-xs text-gray-400 mb-1">{data.formattedTime || formatTime(label)}</p>
          <p className="text-lg font-mono font-bold text-blue-400">
            {formatThroughput(data.throughput)}
          </p>
          {data.isSpike && (
            <p className="text-xs text-orange-400 mt-1 flex items-center gap-1">
              <span>⚠️</span> Traffic Spike Detected
            </p>
          )}
          <p className="text-xs text-gray-500 mt-1 pt-1 border-t border-gray-800">
            Real-time network throughput
          </p>
        </div>
      )
    }
    return null
  }, [formatTime, formatThroughput])

  const getSpikeDotSize = (isSpike: boolean, throughput: number, maxThroughput: number) => {
    if (isSpike) return 8
    // Scale dot size by throughput relative to max
    const ratio = Math.min(throughput / maxThroughput, 1)
    return 3 + ratio * 3
  }

  if (!chartData.length) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-gray-500 text-sm bg-gray-900 rounded-lg">
        <div className="animate-pulse text-2xl mb-2">📊</div>
        <div>Waiting for network data...</div>
        <div className="text-xs text-gray-600 mt-1">Traffic will appear here when detected</div>
      </div>
    )
  }

  const maxThroughput = Math.max(...chartData.map(d => d.throughput), 1)
  const highThreshold = maxThroughput * 0.7

  return (
    <div className="w-full">
      {/* Stats row */}
      <div className="flex justify-between items-center mb-2 px-1 text-xs">
        <div className="flex gap-4">
          <div>
            <span className="text-gray-500">Peak:</span>
            <span className="text-blue-400 ml-1 font-mono">{formatThroughput(stats.max)}</span>
          </div>
          <div>
            <span className="text-gray-500">Avg:</span>
            <span className="text-gray-300 ml-1 font-mono">{formatThroughput(stats.avg)}</span>
          </div>
          {stats.spikeCount > 0 && (
            <div>
              <span className="text-orange-500">⚠️ {stats.spikeCount} spikes</span>
            </div>
          )}
        </div>
        <div className="text-gray-500 text-[10px]">Last 10 minutes • Updates every 5s</div>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" strokeOpacity={0.5} />
          
          <XAxis
            dataKey="time"
            type="number"
            domain={['dataMin', 'dataMax']}
            tickFormatter={formatTime}
            tick={{ fontSize: 10, fill: '#6b7280' }}
            interval="preserveStartEnd"
            minTickGap={60}
            stroke="#374151"
          />
          
          <YAxis
            tickFormatter={formatThroughput}
            tick={{ fontSize: 10, fill: '#6b7280' }}
            width={55}
            stroke="#374151"
            domain={[0, 'auto']}
          />
          
          {/* Reference line for high traffic threshold */}
          <ReferenceLine 
            y={highThreshold} 
            stroke="#f59e0b" 
            strokeDasharray="5 5" 
            strokeOpacity={0.5}
            label={{ 
              value: 'High', 
              fill: '#f59e0b', 
              fontSize: 9,
              position: 'right'
            }}
          />
          
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#374151', strokeWidth: 1 }} />
          
          {/* Area under the curve for visual impact */}
          <Area
            type="monotone"
            dataKey="throughput"
            stroke="none"
            fill="#3b82f6"
            fillOpacity={0.15}
            isAnimationActive={false}
          />
          
          {/* Main line */}
          <Line
            type="monotone"
            dataKey="throughput"
            stroke="#3b82f6"
            strokeWidth={2.5}
            dot={(props: any) => {
              if (!props || !props.payload) return null
              const { cx, cy, payload } = props
              const dotSize = getSpikeDotSize(payload.isSpike, payload.throughput, maxThroughput)
              const isSpike = payload.isSpike
              
              return (
                <g key={`dot-${payload.time}`}>
                  <circle
                    cx={cx}
                    cy={cy}
                    r={dotSize}
                    fill={isSpike ? '#f59e0b' : '#3b82f6'}
                    stroke={isSpike ? '#fbbf24' : '#60a5fa'}
                    strokeWidth={isSpike ? 2 : 1}
                    style={{ filter: isSpike ? 'drop-shadow(0 0 3px #f59e0b)' : 'none' }}
                  />
                </g>
              )
            }}
            activeDot={{ r: 6, fill: '#60a5fa', stroke: '#fff', strokeWidth: 1 }}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
      
      {/* Legend */}
      <div className="flex justify-center gap-4 mt-1 text-[10px] text-gray-500">
        <div className="flex items-center gap-1">
          <div className="w-3 h-0.5 bg-blue-500"></div>
          <span>Throughput</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-orange-500"></div>
          <span>Spike</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-px border-t border-orange-500 border-dashed"></div>
          <span>High threshold</span>
        </div>
      </div>
    </div>
  )
}, (prev, next) => prev.triggerValue === next.triggerValue && prev.totalBytes === next.totalBytes)

ThroughputLine.displayName = 'ThroughputLine'