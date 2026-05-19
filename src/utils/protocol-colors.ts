// src/utils/protocol-colors.ts
export interface ProtocolColor {
  bg: string
  text: string
  border: string
}

// ✅ Make sure PROTOCOL_COLORS is defined and exported
export const PROTOCOL_COLORS: Record<string, ProtocolColor> = {
  'HTTP': { bg: '#1d4ed8', text: '#bfdbfe', border: '#3b82f6' },
  'HTTPS': { bg: '#4c1d95', text: '#ddd6fe', border: '#8b5cf6' },
  'HTTPS-Unknown': { bg: '#6d28d9', text: '#ede9fe', border: '#8b5cf6' },
  'DNS': { bg: '#065f46', text: '#a7f3d0', border: '#10b981' },
  'SSH': { bg: '#92400e', text: '#fde68a', border: '#f59e0b' },
  'FTP': { bg: '#831843', text: '#fbcfe8', border: '#ec4899' },
  'FTP-Data': { bg: '#831843', text: '#fbcfe8', border: '#ec4899' },
  'SMTP': { bg: '#1e3a5f', text: '#93c5fd', border: '#3b82f6' },
  'RDP': { bg: '#7c2d12', text: '#fed7aa', border: '#f97316' },
  'MySQL': { bg: '#164e63', text: '#a5f3fc', border: '#06b6d4' },
  'PostgreSQL': { bg: '#1e3a8a', text: '#bfdbfe', border: '#3b82f6' },
  'Redis': { bg: '#7f1d1d', text: '#fca5a5', border: '#ef4444' },
  'SMB': { bg: '#3b0764', text: '#e9d5ff', border: '#a855f7' },
  'LDAP': { bg: '#1c1917', text: '#d6d3d1', border: '#78716c' },
  'SNMP': { bg: '#042f2e', text: '#99f6e4', border: '#14b8a6' },
  'WireGuard': { bg: '#0f172a', text: '#e2e8f0', border: '#64748b' },
  'OpenVPN': { bg: '#1a2e05', text: '#d9f99d', border: '#84cc16' },
  'Other': { bg: '#374151', text: '#d1d5db', border: '#6b7280' },
  'Unknown': { bg: '#1f2937', text: '#9ca3af', border: '#4b5563' },
}

// Streaming and special domain detection
const STREAMING_DOMAINS = ['youtube', 'netflix', 'tiktok', 'twitch', 'vimeo', 'hulu', 'disney']
const GOOGLE_DOMAINS = ['google.com', 'googleapis.com', 'gstatic.com', 'googlevideo.com']
const META_DOMAINS = ['facebook.com', 'instagram.com', 'whatsapp.com', 'fbcdn.net']
const MICROSOFT_DOMAINS = ['microsoft.com', 'windows.com', 'live.com', 'azure.com', 'office.com']
const CLOUD_DOMAINS = ['amazonaws.com', 'cloudflare.com', 'fastly.com', 'akamai']

// ✅ Add safety check for undefined/null domains
export const getProtocolColor = (domain: string | null | undefined): ProtocolColor => {
  // Safety check - handle missing domain
  if (!domain || domain === 'undefined' || domain === 'null' || domain === '') {
    return PROTOCOL_COLORS['Other']
  }
  
  const d = domain.toLowerCase()

  if (STREAMING_DOMAINS.some(s => d.includes(s)))
    return { bg: '#7f1d1d', text: '#fca5a5', border: '#ef4444' }
  if (GOOGLE_DOMAINS.some(s => d.endsWith(s) || d.includes(s)))
    return { bg: '#1e3a5f', text: '#93c5fd', border: '#3b82f6' }
  if (META_DOMAINS.some(s => d.includes(s)))
    return { bg: '#1e1b4b', text: '#c7d2fe', border: '#6366f1' }
  if (MICROSOFT_DOMAINS.some(s => d.includes(s)))
    return { bg: '#0c2a4a', text: '#7dd3fc', border: '#0284c7' }
  if (CLOUD_DOMAINS.some(s => d.includes(s)))
    return { bg: '#0f2027', text: '#6ee7b7', border: '#059669' }

  return PROTOCOL_COLORS[domain] ?? PROTOCOL_COLORS['Other']
}

export const getTrafficTier = (bytes: number): 'high' | 'medium' | 'low' => {
  if (bytes > 10_000_000) return 'high'
  if (bytes > 1_000_000) return 'medium'
  return 'low'
}

export const TIER_COLORS: Record<string, string | null> = {
  high: '#ef4444',
  medium: '#f59e0b',
  low: null,
}