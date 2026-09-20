import { useCallback, useEffect, useRef, useState } from 'react'

export function useSimulation(active: boolean, speed = 0.08) {
  const [progress, setProgress] = useState(0)
  const [playing, setPlaying] = useState(false)
  const last = useRef(0)

  useEffect(() => {
    if (!active) setPlaying(false)
  }, [active])

  useEffect(() => {
    if (!playing || !active) return
    let frame = 0
    const tick = (now: number) => {
      const dt = last.current ? Math.min((now - last.current) / 1000, 0.05) : 0
      last.current = now
      setProgress(p => {
        const next = p + dt * speed
        if (next >= 1) { setPlaying(false); return 1 }
        return next
      })
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => { cancelAnimationFrame(frame); last.current = 0 }
  }, [playing, active, speed])

  const reset = useCallback(() => { setPlaying(false); setProgress(0) }, [])
  const toggle = useCallback(() => {
    setProgress(p => p >= 1 ? 0 : p)
    setPlaying(p => !p)
  }, [])
  return { progress, setProgress, playing, setPlaying, reset, toggle }
}
