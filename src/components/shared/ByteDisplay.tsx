import React, { memo } from 'react'
import { formatBytes } from '../../utils/formatters'

export const ByteDisplay = memo(({ value, className }: { value: number; className?: string }) => (
  <span className={`font-mono tabular-nums ${className || ''}`}>
    {formatBytes(value)}
  </span>
))

ByteDisplay.displayName = 'ByteDisplay'