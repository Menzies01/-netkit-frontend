import React, { memo } from 'react'
import { getProtocolColor } from '../../utils/protocol-colors'

interface Props { label: string; small?: boolean }

export const ProtocolBadge = memo(({ label, small }: Props) => {
  const colors = getProtocolColor(label)
  const maxLen = small ? 16 : 24
  
  return (
    <span
      className="inline-block font-mono font-medium"
      style={{
        background: colors.bg,
        color: colors.text,
        borderLeft: `2px solid ${colors.border}`,
        padding: small ? '1px 4px' : '2px 6px',
        fontSize: small ? '9px' : '10px',
      }}
    >
      {label.length > maxLen ? label.slice(0, maxLen) + '…' : label}
    </span>
  )
})

ProtocolBadge.displayName = 'ProtocolBadge'