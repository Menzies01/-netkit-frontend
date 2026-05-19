import React, { memo, useMemo } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { TrafficRow } from '../../types'
import { getProtocolColor } from '../../utils/protocol-colors'
import { formatBytesShort } from '../../utils/formatters'

interface Props { rows: TrafficRow[] }

export const DevicePie = memo(({ rows }: Props) => {
  const data = useMemo(() => {
    const byDomain = new Map<string, number>()
    rows.forEach(r => {
      byDomain.set(r.domain, (byDomain.get(r.domain) || 0) + r.total_bytes)
    })
    const sorted = Array.from(byDomain.entries()).sort((a, b) => b[1] - a[1])
    const top8 = sorted.slice(0, 8)
    const other = sorted.slice(8).reduce((sum, [, v]) => sum + v, 0)
    if (other > 0) top8.push(['Other', other])
    return top8.map(([name, value]) => ({ name, value }))
  }, [rows])

  if (!data.length) {
    return <div className="flex items-center justify-center h-44 text-gray-600">No data</div>
  }

  return (
    <ResponsiveContainer width="100%" height={176}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} isAnimationActive={false}>
          {data.map(entry => {
            const color = getProtocolColor(entry.name)
            return <Cell key={entry.name} fill={color.border} />
          })}
        </Pie>
        <Tooltip
          contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: 4 }}
          formatter={(v: number) => [formatBytesShort(v), 'Bytes']}
        />
      </PieChart>
    </ResponsiveContainer>
  )
})

DevicePie.displayName = 'DevicePie'