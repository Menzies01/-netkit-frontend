import React, { memo } from 'react'
import { formatBytes } from '../../utils/formatters'

interface QuotaProgressProps {
  usedBytes: number
  limitBytes: number
  percentUsed: number
  isEnforcing: boolean
}

export const QuotaProgress = memo(({ usedBytes, limitBytes, percentUsed, isEnforcing }: QuotaProgressProps) => {
  let barColor = 'bg-emerald-500'
  let textColor = 'text-emerald-400'
  let statusText = ''
  
  if (percentUsed >= 100) {
    barColor = 'bg-red-500'
    textColor = 'text-red-400'
    statusText = 'Exceeded!'
  } else if (percentUsed >= 80) {
    barColor = 'bg-orange-500'
    textColor = 'text-orange-400'
    statusText = 'Near limit'
  } else if (percentUsed >= 50) {
    barColor = 'bg-yellow-500'
    textColor = 'text-yellow-400'
  }

  return (
    <div className="w-full">
      <div className="flex justify-between text-xs mb-1">
        <span className={textColor}>
          {formatBytes(usedBytes)} / {formatBytes(limitBytes)}
        </span>
        <span className={textColor}>
          {percentUsed.toFixed(1)}% {statusText}
        </span>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-1.5">
        <div
          className={`${barColor} h-1.5 rounded-full transition-all duration-300`}
          style={{ width: `${Math.min(percentUsed, 100)}%` }}
        />
      </div>
      {isEnforcing && (
        <div className="text-xs text-red-400 mt-1 flex items-center gap-1">
          <span>🔒</span> Quota exceeded - traffic blocked
        </div>
      )}
    </div>
  )
})

QuotaProgress.displayName = 'QuotaProgress'