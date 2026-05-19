import React, { memo, useRef, useState, useEffect, useCallback, useTransition, ChangeEvent } from 'react'
import { TrafficRow, SortState } from '../../types'
import { parseQuery, applyFilter } from '../../utils/filter-engine'

interface Props {
  rows: TrafficRow[]
  sort: SortState | null
  onFiltered: (rows: TrafficRow[]) => void
}

export const FilterBar = memo(({ rows, sort, onFiltered }: Props) => {
  const [query, setQuery] = useState('')
  const [, startTransition] = useTransition()
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()

  const handleFilter = useCallback((searchQuery: string) => {
    const filtered = applyFilter(rows, searchQuery, sort)
    startTransition(() => onFiltered(filtered))
  }, [rows, sort, onFiltered])

  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value
    setQuery(q)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => handleFilter(q), 80)
  }, [handleFilter])

  const tokens = parseQuery(query)

  const removeToken = useCallback((raw: string) => {
    const newQuery = query.split(/\s+/).filter(t => t !== raw).join(' ')
    setQuery(newQuery)
    handleFilter(newQuery)
  }, [query, handleFilter])

  return (
    <div className="flex flex-col gap-1">
      <div className="relative">
        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-sm">🔍</span>
        <input
          type="text"
          value={query}
          onChange={handleChange}
          placeholder="ip:192.168. domain:youtube bytes:>1000000"
          className="w-full bg-gray-800 border border-gray-700 rounded px-7 py-1.5 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500 font-mono"
          spellCheck={false}
        />
        {query && (
          <button
            onClick={() => {
              setQuery('')
              handleFilter('')
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
          >
            ✕
          </button>
        )}
      </div>
      
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