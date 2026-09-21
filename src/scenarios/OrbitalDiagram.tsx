import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { barycenter, circularSystem, stepVerlet, SystemState, Vec } from '../physics/orbits'

export type OrbitResult = { state: SystemState; trailA: Vec[]; trailB: Vec[]; bary: Vec; scaleRadius: number }

export function useOrbit(massA: number, massB: number, separation: number, speedFactor: number, progress: number, period: number): OrbitResult {
  const path = useMemo(() => {
    let state = circularSystem(massA, massB, separation, speedFactor)
    const states = [state]
    const dt = period / 900
    for (let i = 0; i < 900; i++) {
      state = stepVerlet(state, dt)
      states.push(state)
    }
    const scaleRadius = states.reduce((largest, step) => {
      const center = barycenter(step.a, step.b)
      return Math.max(largest,
        Math.hypot(step.a.position.x - center.x, step.a.position.y - center.y),
        Math.hypot(step.b.position.x - center.x, step.b.position.y - center.y))
    }, 0)
    return { states, scaleRadius }
  }, [massA, massB, separation, speedFactor, period])

  return useMemo(() => {
    const count = Math.round(progress * 900)
    const state = path.states[count]
    const travelled = path.states.slice(0, count + 1)
    return {
      state,
      trailA: travelled.filter((_, index) => index % 7 === 0).map(step => step.a.position),
      trailB: travelled.filter((_, index) => index % 7 === 0).map(step => step.b.position),
      bary: barycenter(state.a, state.b),
      scaleRadius: path.scaleRadius,
    }
  }, [path, progress])
}

/** A live two-body integration that advances from its current state until reset. */
export function useContinuousOrbit(massA: number, massB: number, separation: number, speedFactor: number, period: number, active: boolean) {
  const initialState = useMemo(() => circularSystem(massA, massB, separation, speedFactor), [massA, massB, separation, speedFactor])
  const stateRef = useRef<SystemState>(initialState)
  const trailsRef = useRef<{ a: Vec[]; b: Vec[] }>({ a: [initialState.a.position], b: [initialState.b.position] })
  const [result, setResult] = useState<OrbitResult>(() => ({ state: initialState, trailA: [initialState.a.position], trailB: [initialState.b.position], bary: barycenter(initialState.a, initialState.b), scaleRadius: separation }))
  const [playing, setPlaying] = useState(false)

  const reset = useCallback(() => {
    const state = circularSystem(massA, massB, separation, speedFactor)
    stateRef.current = state
    trailsRef.current = { a: [state.a.position], b: [state.b.position] }
    setResult({ state, trailA: [state.a.position], trailB: [state.b.position], bary: barycenter(state.a, state.b), scaleRadius: separation })
    setPlaying(false)
  }, [massA, massB, separation, speedFactor])

  useEffect(() => { reset() }, [reset])
  useEffect(() => { if (!active) setPlaying(false) }, [active])

  useEffect(() => {
    if (!playing || !active) return
    let frame = 0, last = 0
    const maxStep = period / 1800
    const tick = (now: number) => {
      const realSeconds = last ? Math.min((now - last) / 1000, .05) : 0
      last = now
      const modelSeconds = realSeconds * period / 10
      const steps = Math.max(1, Math.ceil(modelSeconds / maxStep))
      const dt = modelSeconds / steps
      let state = stateRef.current
      for (let i = 0; i < steps; i++) state = stepVerlet(state, dt)
      stateRef.current = state
      const nextA = [...trailsRef.current.a, state.a.position].slice(-480)
      const nextB = [...trailsRef.current.b, state.b.position].slice(-480)
      trailsRef.current = { a: nextA, b: nextB }
      const bary = barycenter(state.a, state.b)
      setResult({ state, trailA: nextA, trailB: nextB, bary, scaleRadius: separation })
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [playing, active, period, separation])

  return { result, playing, toggle: () => setPlaying(value => !value), reset }
}

const Arrow = ({ x, y, vx, vy, color, marker }: { x: number; y: number; vx: number; vy: number; color: string; marker: string }) => {
  const length = Math.hypot(vx, vy) || 1
  return <line x1={x} y1={y} x2={x + vx / length * 38} y2={y + vy / length * 38} stroke={color} strokeWidth="2.5" markerEnd={`url(#${marker})`}/>
}

export function OrbitalDiagram({ result, separation, massA, massB, showVelocity = true, showForce = true, showBarycenter = true, starMode = false, labelA = 'A', labelB = 'B' }: { result: OrbitResult; separation: number; massA: number; massB: number; showVelocity?: boolean; showForce?: boolean; showBarycenter?: boolean; starMode?: boolean; labelA?: string; labelB?: string }) {
  // Keep one fixed linear scale. Escaping objects deliberately leave frame
  // rather than causing the camera or trails to rescale.
  const map = (p: Vec) => {
    const scaleRadius = Math.max(result.scaleRadius, separation * .1)
    return { x: 330 + (p.x - result.bary.x) / scaleRadius * 190, y: 205 + (p.y - result.bary.y) / scaleRadius * 190 }
  }
  const a = map(result.state.a.position), b = map(result.state.b.position), center = map(result.bary)
  const radiusA = Math.min(34, 13 + Math.log10(massA / massB + 1) * 7)
  const radiusB = Math.min(34, 13 + Math.log10(massB / massA + 1) * 7)
  const dx = b.x-a.x, dy=b.y-a.y
  const trailA = result.trailA.map(point => { const mapped = map(point); return `${mapped.x},${mapped.y}` }).join(' ')
  const trailB = result.trailB.map(point => { const mapped = map(point); return `${mapped.x},${mapped.y}` }).join(' ')
  return <svg className="space-scene orbit-scene" viewBox="0 0 860 410" role="img" aria-label="Two bodies orbiting their common center of mass">
    <defs><radialGradient id="starA"><stop stopColor="#fff9c6"/><stop offset=".35" stopColor="#ffc95f"/><stop offset="1" stopColor="#ef773b"/></radialGradient><radialGradient id="starB"><stop stopColor="#e7f7ff"/><stop offset=".4" stopColor="#7dcaff"/><stop offset="1" stopColor="#4774d8"/></radialGradient><marker id="arrow-vel" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0l10 5-10 5z" fill="#65e0ca"/></marker><marker id="arrow-force" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0l10 5-10 5z" fill="#ff8f8f"/></marker></defs>
    {Array.from({length: 36}, (_, i) => <circle key={i} cx={(i*97)%850} cy={(i*43)%390} r={i%8 ? .7 : 1.5} fill="#fff" opacity=".14"/>)}
    <polyline points={trailA} fill="none" stroke="#ffba62" strokeWidth="2" opacity=".6"/><polyline points={trailB} fill="none" stroke="#70b9ff" strokeWidth="2" opacity=".6"/>
    <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#8b94ae" opacity=".18" strokeDasharray="4 7"/>
    <g transform={`translate(${a.x} ${a.y})`}><circle r={radiusA+7} fill="#ffb75e" opacity=".08"/><circle r={radiusA} fill={starMode ? 'url(#starA)' : '#ffb45d'} stroke="#ffd49b" strokeWidth="2"/><circle cx={-radiusA*.3} cy={-2} r="2" fill="#55351f"/><circle cx={radiusA*.3} cy={-2} r="2" fill="#55351f"/><path d={`M${-radiusA*.28} ${radiusA*.25}q${radiusA*.28} ${radiusA*.22} ${radiusA*.56} 0`} fill="none" stroke="#55351f" strokeWidth="2" strokeLinecap="round"/><text y={radiusA+21} textAnchor="middle">{labelA}</text></g>
    <g transform={`translate(${b.x} ${b.y})`}><circle r={radiusB+7} fill="#70b9ff" opacity=".08"/><circle r={radiusB} fill={starMode ? 'url(#starB)' : '#69adf5'} stroke="#aedaff" strokeWidth="2"/><circle cx={-radiusB*.3} cy={-2} r="2" fill="#193659"/><circle cx={radiusB*.3} cy={-2} r="2" fill="#193659"/><path d={`M${-radiusB*.28} ${radiusB*.25}q${radiusB*.28} ${radiusB*.22} ${radiusB*.56} 0`} fill="none" stroke="#193659" strokeWidth="2" strokeLinecap="round"/><text y={radiusB+21} textAnchor="middle">{labelB}</text></g>
    {showBarycenter && <g transform={`translate(${center.x} ${center.y})`}><circle r="8" fill="#111625" stroke="#fff" strokeWidth="2" opacity=".92"/><path d="M-13 0h26M0-13v26" stroke="#fff" strokeWidth="1.5"/><text y="-45" textAnchor="middle">barycenter</text></g>}
    {showVelocity && <><Arrow x={a.x} y={a.y} vx={result.state.a.velocity.x} vy={result.state.a.velocity.y} color="#65e0ca" marker="arrow-vel"/><Arrow x={b.x} y={b.y} vx={result.state.b.velocity.x} vy={result.state.b.velocity.y} color="#65e0ca" marker="arrow-vel"/></>}
    {showForce && <><Arrow x={a.x} y={a.y} vx={dx} vy={dy} color="#ff8f8f" marker="arrow-force"/><Arrow x={b.x} y={b.y} vx={-dx} vy={-dy} color="#ff8f8f" marker="arrow-force"/></>}
  </svg>
}
