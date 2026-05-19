import React, { useEffect, useCallback } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import { ThemeProvider } from './context/ThemeContext'
import { Sidebar } from './components/layout/Sidebar'
import { StatusBar } from './components/layout/StatusBar'
import { Overview } from './pages/Overview'
import { DeviceDetail } from './pages/DeviceDetail'
import { Policies } from './pages/Policies'
import { useSocket } from './hooks/useSocket'
import { useStats } from './hooks/useStats'
import { useDevices } from './hooks/useDevices'
import { usePolicies } from './hooks/usePolicies'

const AppInner = () => {
  const { fetchSummary } = useStats()
  const { fetchDevices } = useDevices()
  const { fetchPolicies } = usePolicies()

  const refresh = useCallback(() => {
    fetchSummary()
    fetchDevices()
  }, [fetchSummary, fetchDevices])

  useSocket(refresh)

  useEffect(() => {
    refresh()
    fetchPolicies()
    const interval = setInterval(refresh, 30000)
    return () => clearInterval(interval)
  }, [refresh, fetchPolicies])

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