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

export interface Policy {
  id: number
  name: string
  description: string | null
  device_ip: string | null
  domain: string | null
  action: 'limit' | 'block'
  rate_kbps: number | null
  priority: number
  is_active: boolean
  created_at: string
  updated_at: string
}

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

export interface ApiError {
  error: string
  message?: string
}