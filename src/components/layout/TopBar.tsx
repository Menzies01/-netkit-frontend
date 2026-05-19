import React, { memo } from 'react'
import { Link } from 'react-router-dom'
import { FilterBar } from '../filter/FilterBar'
import { DensityToggle } from '../shared/DensityToggle'
import { ConnectionStatus } from '../shared/ConnectionStatus'
import { TrafficRow, SortState } from '../../types'

interface Props {
  rows: TrafficRow[]
  sort: SortState | null
  onFiltered: (rows: TrafficRow[]) => void
}

export const TopBar = memo(({ rows, sort, onFiltered }: Props) => (
  <div className="flex items-center gap-4 px-4 py-2 bg-gray-900 border-b border-gray-800">
    <h1 className="text-lg font-semibold">
      NetKit<span className="text-blue-500">Monitor</span>
    </h1>
    
    <div className="flex-1 max-w-xl">
      <FilterBar rows={rows} sort={sort} onFiltered={onFiltered} />
    </div>
    
    <div className="flex items-center gap-3">
      <DensityToggle />
      <ConnectionStatus />
      <Link to="/policies" className="text-gray-500 hover:text-gray-300 transition-colors">
        ⚙️
      </Link>
    </div>
  </div>
))

TopBar.displayName = 'TopBar'