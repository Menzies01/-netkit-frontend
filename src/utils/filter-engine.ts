import { TrafficRow, FilterToken, SortState } from '../types'

export const parseQuery = (query: string): FilterToken[] => {
  if (!query.trim()) return []
  return query.trim().split(/\s+/).map(raw => {
    const match = raw.match(/^(\w+):([><]?)(.+)$/)
    if (match) {
      const [, field, op, value] = match
      return {
        raw,
        field: field.toLowerCase(),
        op: (op === '>' || op === '<' ? op : null) as '>' | '<' | null,
        value,
      }
    }
    return { raw, field: null, op: null, value: raw }
  })
}

const matchesFilter = (row: TrafficRow, token: FilterToken): boolean => {
  if (!token.field) {
    const v = token.value.toLowerCase()
    return row.domain.toLowerCase().includes(v) || 
           row.ip_address.includes(v) ||
           (row.hostname?.toLowerCase().includes(v) ?? false)
  }

  switch (token.field) {
    case 'ip':
      return row.ip_address.startsWith(token.value)
    case 'domain':
      return row.domain.toLowerCase().includes(token.value.toLowerCase())
    case 'bytes': {
      const threshold = parseInt(token.value, 10)
      if (isNaN(threshold)) return true
      if (token.op === '>') return row.total_bytes > threshold
      if (token.op === '<') return row.total_bytes < threshold
      return row.total_bytes === threshold
    }
    default:
      return true
  }
}

export const applyFilter = (
  rows: TrafficRow[],
  query: string,
  sort: SortState | null = null
): TrafficRow[] => {
  const tokens = parseQuery(query)
  let filtered = tokens.length === 0 ? rows : rows.filter(r => tokens.every(t => matchesFilter(r, t)))
  
  if (sort) {
    filtered = [...filtered].sort((a, b) => {
      const aVal = a[sort.column]
      const bVal = b[sort.column]
      if (aVal == null) return 1
      if (bVal == null) return -1
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sort.direction === 'asc' ? aVal - bVal : bVal - aVal
      }
      const cmp = String(aVal).localeCompare(String(bVal))
      return sort.direction === 'asc' ? cmp : -cmp
    })
  }
  
  return filtered
}