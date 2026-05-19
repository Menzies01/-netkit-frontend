// src/workers/filter.worker.ts
import { applyFilter } from '../utils/filter-engine'
import { TrafficRow, SortState } from '../types'

interface WorkerMessage {
  rows: TrafficRow[]
  query: string
  sort: SortState | null
}

self.onmessage = (e: MessageEvent<WorkerMessage>) => {
  const { rows, query, sort } = e.data
  
  // Safety check
  if (!rows || !Array.isArray(rows)) {
    self.postMessage([])
    return
  }
  
  const filtered = applyFilter(rows, query, sort)
  self.postMessage(filtered)
}