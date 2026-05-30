import { useState, useRef, useEffect } from 'react'

export function useThrottle<T>(value: T, limitMs: number): T {
  const [throttled, setThrottled] = useState<T>(value)
  const lastRan = useRef<number>(Date.now())
  const pendingRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const now = Date.now()
    const timeSinceLastRun = now - lastRan.current

    if (timeSinceLastRun >= limitMs) {
      // Enough time has passed - update immediately
      setThrottled(value)
      lastRan.current = now
    } else {
      // Not enough time - schedule for later
      if (pendingRef.current) {
        clearTimeout(pendingRef.current)
      }
      pendingRef.current = setTimeout(() => {
        setThrottled(value)
        lastRan.current = Date.now()
        pendingRef.current = null
      }, limitMs - timeSinceLastRun)
    }

    return () => {
      if (pendingRef.current) {
        clearTimeout(pendingRef.current)
      }
    }
  }, [value, limitMs])

  return throttled
}