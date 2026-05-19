import React, { createContext, useContext, useReducer, ReactNode } from 'react'
import { Device, SummaryRow, Policy, TrafficRow } from '../types'

interface AppState {
  devices: Device[]
  summary: SummaryRow[]
  trafficRows: TrafficRow[]
  policies: Policy[]
  selectedKey: string | null
  socketConnected: boolean
  lastUpdate: number
}

type AppAction =
  | { type: 'SET_DEVICES'; payload: Device[] }
  | { type: 'SET_SUMMARY'; payload: SummaryRow[] }
  | { type: 'SET_TRAFFIC_ROWS'; payload: TrafficRow[] }
  | { type: 'SET_POLICIES'; payload: Policy[] }
  | { type: 'SELECT'; payload: string | null }
  | { type: 'SOCKET_STATUS'; payload: boolean }
  | { type: 'TICK'; payload: number }

const initialState: AppState = {
  devices: [],
  summary: [],
  trafficRows: [],
  policies: [],
  selectedKey: null,
  socketConnected: false,
  lastUpdate: 0,
}

const reducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'SET_DEVICES':
      return { ...state, devices: action.payload }
    case 'SET_SUMMARY':
      return { ...state, summary: action.payload }
    case 'SET_TRAFFIC_ROWS':
      return { ...state, trafficRows: action.payload }
    case 'SET_POLICIES':
      return { ...state, policies: action.payload }
    case 'SELECT':
      return { ...state, selectedKey: action.payload }
    case 'SOCKET_STATUS':
      return { ...state, socketConnected: action.payload }
    case 'TICK':
      return { ...state, lastUpdate: action.payload }
    default:
      return state
  }
}

const AppContext = createContext<{ state: AppState; dispatch: React.Dispatch<AppAction> } | null>(null)

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(reducer, initialState)
  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>
}

export const useAppContext = () => {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useAppContext must be used within AppProvider')
  return ctx
}