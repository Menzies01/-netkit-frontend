import React, { memo, useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { SummaryRow } from '../../types'
import { getProtocolColor } from '../../utils/protocol-colors'
import { formatBytesShort } from '../../utils/formatters'

interface Props { data: SummaryRow[] }

export const BandwidthBar = memo(({ data }: Props) => {
  const chartData = useMemo(() => {
    if (!data.length) return []
    const sorted = [...data].sort((a, b) => b.total - a.total)
    const top15 = sorted.slice(0, 15)
    const other = sorted.slice(15).reduce((sum, r) => sum + r.total, 0)
    if (other > 0) top15.push({ domain: 'Other', total: other, bytes_in: 0, bytes_out: 0, records: 0 })
    return top15
  }, [data])

  if (!chartData.length) {
    return <div className="flex items-center justify-center h-44 text-gray-600">No data</div>
  }

  return (
    <ResponsiveContainer width="100%" height={176}>
      <BarChart data={chartData} margin={{ top: 4, right: 4, bottom: 32, left: 0 }}>
        <XAxis
          dataKey="domain"
          tick={{ fontSize: 10, fill: '#6B7280' }}
          angle={-45}
          textAnchor="end"
          height={40}
          interval={0}
        />
        <YAxis tickFormatter={formatBytesShort} tick={{ fontSize: 10, fill: '#6B7280' }} width={45} />
        <Tooltip
          contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: 4 }}
          formatter={(v: number) => [formatBytesShort(v), 'Traffic']}
        />
        <Bar dataKey="total" isAnimationActive={false} radius={[2, 2, 0, 0]}>
          {chartData.map(entry => {
            const color = getProtocolColor(entry.domain)
            return <Cell key={entry.domain} fill={color.border} />
          })}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
})

BandwidthBar.displayName = 'BandwidthBar'