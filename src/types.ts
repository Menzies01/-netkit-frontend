// =============================================================================
// NetKit Type Definitions - MAC Address with IP Fallback
// =============================================================================

// =============================================================================
// Device Types
// =============================================================================

export interface Device {
  id: number
  ip_address: string
  hostname: string | null
  mac_address: string | null
  first_seen: string
  last_seen: string
  is_active: boolean
  bytes_in: number
  bytes_out: number
}

// =============================================================================
// Summary / Statistics Types
// =============================================================================

export interface SummaryRow {
  domain: string
  total: number
  bytes_in: number
  bytes_out: number
  records: number
}

export interface TrafficRow {
  device_id: number
  ip_address: string
  hostname: string | null
  domain: string
  bytes_in: number
  bytes_out: number
  total_bytes: number
  last_seen: string | null
  top_domains?: TopDomain[]
}

export interface TopDomain {
  domain: string
  bytes: number
}

export interface TimeSeriesPoint {
  timestamp: string
  device_id: number
  domain: string
  bytes_in: number
  bytes_out: number
}

// =============================================================================
// Policy Types (QoS Enforcement)
// =============================================================================

// Update PolicyAction type
// Update PolicyAction type
export type PolicyAction = 'limit' | 'block' | 'priority'

// Update Policy interface
export interface Policy {
  id: number
  name: string
  description: string | null
  device_ip: string | null
  device_mac: string | null
  domain: string | null
  action: PolicyAction
  rate_kbps: number | null
  priority: number
  is_active: boolean
  created_at: string
  updated_at: string
  // Priority fields
  priority_level: 'high' | 'normal' | 'low' | null
  min_bandwidth_kbps: number | null
  max_bandwidth_kbps: number | null
  burst_kb: number | null
}

// Update CreatePolicyData
export interface CreatePolicyData {
  name: string
  description?: string
  device_mac?: string
  device_ip?: string
  domain?: string
  action: PolicyAction
  rate_kbps?: number
  priority_level?: 'high' | 'normal' | 'low'
  min_bandwidth_kbps?: number
  max_bandwidth_kbps?: number
  burst_kb?: number
}

// Update UpdatePolicyData
export interface UpdatePolicyData {
  name?: string
  description?: string
  device_mac?: string
  device_ip?: string
  domain?: string
  action?: PolicyAction
  rate_kbps?: number
  is_active?: boolean
  priority_level?: 'high' | 'normal' | 'low'
  min_bandwidth_kbps?: number
  max_bandwidth_kbps?: number
  burst_kb?: number
}

// Helper: Get priority color for display
export function getPriorityColor(level: string | null): string {
  switch (level) {
    case 'high': return 'text-red-400 bg-red-900/20'
    case 'normal': return 'text-yellow-400 bg-yellow-900/20'
    case 'low': return 'text-blue-400 bg-blue-900/20'
    default: return 'text-gray-400 bg-gray-800'
  }
}

// Helper: Get priority label
export function getPriorityLabel(level: string | null): string {
  switch (level) {
    case 'high': return '🔴 HIGH'
    case 'normal': return '🟡 NORMAL'
    case 'low': return '🔵 LOW'
    default: return '—'
  }
}
// =============================================================================
// Quota Types (Data Usage Limits)
// =============================================================================

export type ResetPeriod = 'session' | 'daily' | 'weekly' | 'monthly'

export interface DataQuota {
  id: number
  name: string
  device_ip: string | null
  device_mac: string | null
  domain: string
  limit_bytes: number
  limit_gb: number
  reset_period: ResetPeriod
  is_active: boolean
  is_enforcing: boolean
  period_start: string | null
  auto_policy_id: number | null
  created_at: string
}

export interface CreateQuotaData {
  name: string
  device_mac?: string
  device_ip?: string
  domain: string
  limit_gb?: number
  limit_bytes?: number
  reset_period?: ResetPeriod
}

export interface UpdateQuotaData {
  name?: string
  device_mac?: string
  device_ip?: string
  domain?: string
  limit_gb?: number
  limit_bytes?: number
  reset_period?: ResetPeriod
  is_active?: boolean
}

export interface QuotaUsage extends DataQuota {
  used_bytes: number
  used_gb: number
  percent_used: number
  remaining_bytes: number
}

// =============================================================================
// Event Types (Audit Log)
// =============================================================================

export type EventType = 'apply_limit' | 'apply_block' | 'remove' | 'refresh_ipset' | 'error'

export interface Event {
  id: number
  policy_id: number | null
  event_type: EventType
  detail: string
  created_at: string
}

// =============================================================================
// UI State Types
// =============================================================================

export type Density = 'compact' | 'comfortable'

export interface SortState {
  column: keyof TrafficRow
  direction: 'asc' | 'desc'
}

export interface FilterToken {
  raw: string
  field: string | null
  op: '>' | '<' | null
  value: string
}

// =============================================================================
// API Response Types
// =============================================================================

export interface ApiError {
  error: string
  message?: string
}

export interface HealthResponse {
  status: string
  timestamp: string
  service: string
}

// =============================================================================
// Helper Functions - MAC Address with IP Fallback
// =============================================================================

/**
 * Format MAC address for display
 */
export function formatMacAddress(mac: string | null | undefined): string {
  if (!mac) return ''
  return mac.toLowerCase()
}

/**
 * Format MAC address or return IP if MAC not available
 */
export function formatMacOrIp(mac: string | null | undefined, ip: string): string {
  if (mac) return formatMacAddress(mac)
  return ip
}

/**
 * Get the best display name for a device
 * Priority: hostname > MAC > IP
 */
export function getDeviceDisplayName(device: {
  hostname: string | null
  mac_address: string | null
  ip_address: string
}): string {
  if (device.hostname) return device.hostname
  if (device.mac_address) return formatMacAddress(device.mac_address)
  return device.ip_address
}

/**
 * Get device display with MAC and IP context
 */
export function getDeviceDisplayWithDetails(device: {
  hostname: string | null
  mac_address: string | null
  ip_address: string
}): string {
  const name = getDeviceDisplayName(device)
  const mac = device.mac_address ? formatMacAddress(device.mac_address) : null
  
  if (device.hostname) {
    if (mac) return `${device.hostname} [${mac}]`
    return `${device.hostname} (${device.ip_address})`
  }
  if (mac) return `${mac} (${device.ip_address})`
  return device.ip_address
}

/**
 * Get short device display (for tables)
 */
export function getShortDeviceDisplay(device: {
  hostname: string | null
  mac_address: string | null
  ip_address: string
}): string {
  if (device.hostname) return device.hostname
  if (device.mac_address) return formatMacAddress(device.mac_address).slice(-8)
  return device.ip_address
}

/**
 * Get device identifier for API submission
 * Prefers MAC, falls back to IP
 */
export function getDeviceTarget(device: {
  mac_address: string | null
  ip_address: string
}): { device_mac?: string; device_ip?: string } {
  if (device.mac_address) {
    return { device_mac: device.mac_address }
  }
  return { device_ip: device.ip_address }
}

/**
 * Format bytes to human readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Convert bytes to GB
 */
export function bytesToGb(bytes: number): number {
  return bytes / 1_073_741_824
}

/**
 * Convert GB to bytes
 */
export function gbToBytes(gb: number): number {
  return Math.round(gb * 1_073_741_824)
}

/**
 * Get device select option label
 */
export function getDeviceSelectLabel(device: Device): string {
  if (device.hostname) {
    if (device.mac_address) {
      return `${device.hostname} [${formatMacAddress(device.mac_address)}]`
    }
    return `${device.hostname} (${device.ip_address})`
  }
  if (device.mac_address) {
    return `${formatMacAddress(device.mac_address)} (${device.ip_address})`
  }
  return device.ip_address
}