// src/utils/filter-engine.ts
import { TrafficRow, FilterToken, SortState } from '../types'

export const parseQuery = (query: string): FilterToken[] => {
  if (!query.trim()) return []
  return query.trim().split(/\s+/).map(raw => {
    const fieldMatch = raw.match(/^(\w+):(>|<|=)?(.+)$/)
    if (fieldMatch) {
      return {
        raw,
        field: fieldMatch[1].toLowerCase(),
        op: (fieldMatch[2] as '>' | '<' | '=' | null) ?? null,
        value: fieldMatch[3],
      }
    }
    return { raw, field: null, op: null, value: raw }
  })
}

// ✅ Safe string comparison - handles null/undefined
const safeToLowerCase = (str: string | null | undefined): string => {
  if (!str) return ''
  return str.toLowerCase()
}

// ✅ Safe includes check
const safeIncludes = (str: string | null | undefined, search: string): boolean => {
  if (!str) return false
  return safeToLowerCase(str).includes(safeToLowerCase(search))
}

const matchesFilter = (row: TrafficRow, token: FilterToken): boolean => {
  if (!token.field) {
    // Plain text search - safe checks
    const searchValue = token.value.toLowerCase()
    const domainMatch = safeIncludes(row.domain, searchValue)
    const ipMatch = row.ip_address ? row.ip_address.toLowerCase().includes(searchValue) : false
    const hostnameMatch = safeIncludes(row.hostname, searchValue)
    
    return domainMatch || ipMatch || hostnameMatch
  }

  switch (token.field) {
    case 'ip':
      if (!row.ip_address) return false
      return row.ip_address.startsWith(token.value)
      
    case 'domain':
      return safeIncludes(row.domain, token.value)
      
    case 'hostname':
      return safeIncludes(row.hostname, token.value)
      
    case 'proto':
    case 'protocol': {
      if (!row.domain) return false
      const proto = row.domain.toUpperCase()
      return proto.includes(token.value.toUpperCase())
    }
    
    case 'bytes': {
      const threshold = parseInt(token.value, 10)
      if (isNaN(threshold)) return true
      const total = row.total_bytes || 0
      if (token.op === '>') return total > threshold
      if (token.op === '<') return total < threshold
      return total === threshold
    }
    
    default:
      return true
  }
}

const sortRows = (rows: TrafficRow[], sort: SortState | null): TrafficRow[] => {
  if (!sort) return rows
  
  return [...rows].sort((a, b) => {
    const aVal = a[sort.column]
    const bVal = b[sort.column]
    
    // Handle null/undefined values
    if (aVal === null || aVal === undefined) return 1
    if (bVal === null || bVal === undefined) return -1
    
    let cmp = 0
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      cmp = aVal - bVal
    } else {
      cmp = String(aVal).localeCompare(String(bVal))
    }
    return sort.direction === 'asc' ? cmp : -cmp
  })
}

export const applyFilter = (
  rows: TrafficRow[],
  query: string,
  sort: SortState | null = null
): TrafficRow[] => {
  // Safety check - if rows is undefined or not an array
  if (!rows || !Array.isArray(rows)) {
    return []
  }
  
  const tokens = parseQuery(query)
  
  // If no filter tokens, just sort and return
  let filtered = tokens.length === 0 
    ? rows 
    : rows.filter(row => {
        // Safety check for row
        if (!row) return false
        return tokens.every(token => matchesFilter(row, token))
      })
  
  return sortRows(filtered, sort)
}