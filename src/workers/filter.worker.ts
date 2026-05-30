// src/workers/filter.worker.ts
import { applyFilter } from '../utils/filter-engine'
import { TrafficRow, SortState } from '../types'

interface WorkerMessage {
  rows: TrafficRow[]
  query: string
  sort: SortState | null
}

interface WorkerResponse {
  filteredRows: TrafficRow[]
  error?: string
}

self.onmessage = (e: MessageEvent<WorkerMessage>) => {
  const { rows, query, sort } = e.data
  
  // Safety checks
  if (!rows || !Array.isArray(rows)) {
    const response: WorkerResponse = {
      filteredRows: [],
      error: 'Invalid rows data: expected array'
    }
    self.postMessage(response)
    return
  }
  
  try {
    // Apply filter with the provided query and sort
    const filteredRows = applyFilter(rows, query, sort)
    
    // Validate output
    if (!Array.isArray(filteredRows)) {
      throw new Error('applyFilter did not return an array')
    }
    
    const response: WorkerResponse = {
      filteredRows: filteredRows
    }
    self.postMessage(response)
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown filter error'
    console.error('[FilterWorker] Error during filtering:', err)
    
    const response: WorkerResponse = {
      filteredRows: rows, // Return unfiltered rows as fallback
      error: errorMsg
    }
    self.postMessage(response)
  }
}

// Handle worker termination gracefully
self.onerror = (error) => {
  console.error('[FilterWorker] Unhandled error:', error)
  // Don't try to post message here - worker may be terminating
}