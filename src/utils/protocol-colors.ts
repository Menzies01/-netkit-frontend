export interface ProtocolColor {
  bg: string
  text: string
  border: string
}

export const PROTOCOL_COLORS: Record<string, ProtocolColor> = {
  'HTTP': { bg: '#1e3a5f', text: '#93c5fd', border: '#3b82f6' },
  'HTTPS': { bg: '#4c1d95', text: '#ddd6fe', border: '#8b5cf6' },
  'DNS': { bg: '#064e3b', text: '#a7f3d0', border: '#10b981' },
  'SSH': { bg: '#78350f', text: '#fde68a', border: '#f59e0b' },
  'FTP': { bg: '#831843', text: '#fbcfe8', border: '#ec4899' },
  'Other': { bg: '#1f2937', text: '#d1d5db', border: '#6b7280' },
}

export const getProtocolColor = (domain: string): ProtocolColor => {
  const d = domain.toLowerCase()
  
  if (d.includes('youtube') || d.includes('netflix') || d.includes('tiktok') || d.includes('twitch')) {
    return { bg: '#7f1d1d', text: '#fca5a5', border: '#ef4444' }
  }
  if (d.includes('google') || d.includes('youtube')) {
    return { bg: '#1e3a5f', text: '#93c5fd', border: '#3b82f6' }
  }
  if (d.includes('facebook') || d.includes('instagram') || d.includes('whatsapp')) {
    return { bg: '#2e1065', text: '#c7d2fe', border: '#6366f1' }
  }
  if (d.includes('microsoft') || d.includes('office') || d.includes('azure')) {
    return { bg: '#0c4a6e', text: '#7dd3fc', border: '#0284c7' }
  }
  
  return PROTOCOL_COLORS[d] ?? PROTOCOL_COLORS['Other']
}