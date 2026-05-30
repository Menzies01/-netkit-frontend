import React, { useEffect, useCallback, useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import { ThemeProvider } from './context/ThemeContext'
import { Sidebar } from './components/layout/Sidebar'
import { StatusBar } from './components/layout/StatusBar'
import { Overview } from './pages/Overview'
import { DeviceDetail } from './pages/DeviceDetail'
import { Policies } from './pages/Policies'
import { Quotas } from './pages/Quotas'
import { useSocket } from './hooks/useSocket'
import { useStats } from './hooks/useStats'
import { useDevices } from './hooks/useDevices'
import { usePolicies } from './hooks/usePolicies'

const AppInner = () => {
  const { fetchSummary } = useStats()
  const { fetchDevices } = useDevices()
  const { fetchPolicies } = usePolicies()
  const [initialLoadComplete, setInitialLoadComplete] = useState(false)

  const refresh = useCallback(() => {
    fetchSummary()
    fetchDevices()
  }, [fetchSummary, fetchDevices])

  useSocket(refresh)

  useEffect(() => {
    const loadInitialData = async () => {
      await Promise.all([
        fetchSummary(),
        fetchDevices(),
        fetchPolicies(),
      ])
      setInitialLoadComplete(true)
    }
    loadInitialData()
  }, [fetchSummary, fetchDevices, fetchPolicies])

  if (!initialLoadComplete) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-gray-950 text-gray-200">
        <div className="text-center">
          <div className="animate-pulse text-2xl mb-2">📡</div>
          <div className="text-sm text-gray-400">Connecting to NetKit backend...</div>
        </div>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <div className="flex h-screen w-screen overflow-hidden bg-gray-950 text-gray-200">
        <Sidebar />
        <div className="flex flex-col flex-1 overflow-hidden min-w-0">
          <main className="flex-1 overflow-hidden">
            <Routes>
              <Route path="/" element={<Overview />} />
              <Route path="/device/:id" element={<DeviceDetail />} />
              <Route path="/policies" element={<Policies />} />
              <Route path="/quotas" element={<Quotas />} />
            </Routes>
          </main>
          <StatusBar />
        </div>
      </div>
    </BrowserRouter>
  )
}

const App = () => (
  <AppProvider>
    <ThemeProvider>
      <AppInner />
    </ThemeProvider>
  </AppProvider>
)

export default App