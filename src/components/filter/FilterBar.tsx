import React, { memo, useRef, useState, useEffect, useCallback, useTransition, ChangeEvent } from 'react'
import { useAppContext } from '../../context/AppContext'
import { TrafficRow, SortState, FilterToken } from '../../types'
import { parseQuery } from '../../utils/filter-engine'

// @ts-ignore - Vite worker import
import FilterWorker from '../../workers/filter.worker?worker'

interface Props {
  rows: TrafficRow[]
  sort: SortState | null
  onFiltered: (rows: TrafficRow[]) => void
}

export const FilterBar = memo(({ rows, sort, onFiltered }: Props) => {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const { state } = useAppContext()
  const [, startTransition] = useTransition()
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()
  const workerRef = useRef<Worker | null>(null)
  const pendingFilterRef = useRef<string | null>(null)
  const [workerReady, setWorkerReady] = useState(false)

  // Initialize Web Worker
  useEffect(() => {
    try {
      const worker = new FilterWorker()
      workerRef.current = worker
      
      worker.onmessage = (e: MessageEvent) => {
        const { filteredRows } = e.data
        startTransition(() => {
          onFiltered(filteredRows)
        })
        if (pendingFilterRef.current !== null) {
          pendingFilterRef.current = null
        }
      }
      
      worker.onerror = (error) => {
        console.error('[FilterWorker] Error:', error)
        setWorkerReady(false)
        workerRef.current = null
      }
      
      worker.onmessageerror = (error) => {
        console.error('[FilterWorker] Message error:', error)
        setWorkerReady(false)
      }
      
      setWorkerReady(true)
      
      return () => {
        worker.terminate()
        workerRef.current = null
      }
    } catch (err) {
      console.error('[FilterBar] Failed to initialize worker:', err)
      setWorkerReady(false)
    }
  }, [onFiltered])

  const handleFilter = useCallback((searchQuery: string, filterRows: TrafficRow[], filterSort: SortState | null) => {
    if (workerRef.current && workerReady) {
      // Use worker for filtering
      workerRef.current.postMessage({
        rows: filterRows,
        query: searchQuery,
        sort: filterSort,
      })
    } else {
      // Fallback to main thread filtering if worker is not available
      console.warn('[FilterBar] Worker not available, falling back to main thread')
      const { applyFilter } = require('../../utils/filter-engine')
      const filtered = applyFilter(filterRows, searchQuery, filterSort)
      startTransition(() => onFiltered(filtered))
    }
  }, [onFiltered, workerReady])

  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value
    setQuery(q)
    
    // Show suggestions based on query context
    const lowerQ = q.toLowerCase()
    if (lowerQ.endsWith('ip:') || lowerQ.includes('ip:')) {
      const partial = q.split('ip:')[1]?.split(' ')[0] ?? ''
      const matching = state.devices
        .map(d => d.ip_address)
        .filter(ip => ip.toLowerCase().startsWith(partial.toLowerCase()))
      setSuggestions(matching.slice(0, 8))
    } else if (lowerQ.endsWith('domain:') || lowerQ.includes('domain:')) {
      const partial = q.split('domain:')[1]?.split(' ')[0] ?? ''
      const domains = new Set<string>()
      rows.forEach(row => {
        if (row.domain && row.domain.toLowerCase().startsWith(partial.toLowerCase())) {
          domains.add(row.domain)
        }
      })
      setSuggestions(Array.from(domains).slice(0, 8))
    } else {
      setSuggestions([])
    }

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => handleFilter(q, rows, sort), 80)
  }, [handleFilter, state.devices, rows, sort])

  const tokens: FilterToken[] = parseQuery(query)

  const removeToken = useCallback((raw: string) => {
    const newQuery = query.split(/\s+/).filter(t => t !== raw).join(' ')
    setQuery(newQuery)
    handleFilter(newQuery, rows, sort)
  }, [query, handleFilter, rows, sort])

  const handleSuggestionClick = useCallback((suggestion: string, field: 'ip' | 'domain') => {
    let newQuery = query
    if (field === 'ip') {
      newQuery = query.replace(/ip:[^\s]*/, `ip:${suggestion}`)
    } else if (field === 'domain') {
      newQuery = query.replace(/domain:[^\s]*/, `domain:${suggestion}`)
    }
    setQuery(newQuery)
    setSuggestions([])
    handleFilter(newQuery, rows, sort)
  }, [query, handleFilter, rows, sort])

  return (
    <div className="flex flex-col gap-1">
      <div className="relative">
        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-sm">🔍</span>
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={handleChange}
            placeholder="ip:192.168. domain:youtube bytes:>1000000"
            className="w-full bg-gray-800 border border-gray-700 rounded px-7 py-1.5 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500 font-mono"
            spellCheck={false}
          />
        </div>
        {suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 z-50 bg-slate-800 border border-slate-600 rounded-b shadow-lg mt-0.5 max-h-64 overflow-y-auto">
            {suggestions.map(suggestion => {
              const isIp = suggestion.match(/^\d+\.\d+\.\d+\.\d+$/)
              return (
                <button
                  key={suggestion}
                  onClick={() => handleSuggestionClick(suggestion, isIp ? 'ip' : 'domain')}
                  className="w-full text-left px-3 py-1.5 text-sm font-mono text-slate-200 hover:bg-slate-700 transition-colors"
                >
                  {suggestion}
                  {isIp && state.devices.find(d => d.ip_address === suggestion)?.hostname && (
                    <span className="ml-2 text-slate-500 text-xs">
                      {state.devices.find(d => d.ip_address === suggestion)?.hostname}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        )}
        {query && (
          <button
            onClick={() => {
              setQuery('')
              setSuggestions([])
              handleFilter('', rows, sort)
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
          >
            ✕
          </button>
        )}
      </div>
      
      {!workerReady && rows.length > 100 && (
        <div className="text-xs text-yellow-500 bg-yellow-900/20 px-2 py-0.5 rounded">
          ⚡ Using fallback filter (slower). Worker failed to load.
        </div>
      )}
      
      {tokens.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {tokens.map(token => (
            <span
              key={token.raw}
              className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-gray-800 border border-gray-700 font-mono"
            >
              {token.raw}
              <button onClick={() => removeToken(token.raw)} className="text-gray-500 hover:text-gray-300">
                ✕
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
})

FilterBar.displayName = 'FilterBar'