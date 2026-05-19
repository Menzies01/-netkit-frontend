import { useState, useRef, useEffect } from 'react'

export function useThrottle<T>(value: T, limitMs: number): T {
  const [throttled, setThrottled] = useState<T>(value)
  const lastRan = useRef<number>(Date.now())

  useEffect(() => {
    const handler = setTimeout(() => {
      if (Date.now() - lastRan.current >= limitMs) {
        setThrottled(value)
        lastRan.current = Date.now()
      }
    }, limitMs - (Date.now() - lastRan.current))

    return () => clearTimeout(handler)
  }, [value, limitMs])

  return throttled
}
