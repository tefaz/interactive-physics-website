import { useMemo } from 'react'
import { barycenter, circularSystem, stepVerlet, SystemState, Vec } from '../physics/orbits'

export type OrbitResult = { state: SystemState; trailA: Vec[]; trailB: Vec[]; bary: Vec }

export function useOrbit(massA: number, massB: number, separation: number, speedFactor: number, progress: number, period: number): OrbitResult {
  const path = useMemo(() => {
    let state = circularSystem(massA, massB, separation, speedFactor)
    const states = [state]
    const dt = period / 900
    for (let i = 0; i < 900; i++) {
      state = stepVerlet(state, dt)
      states.push(state)
    }
    return { states }
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
    }
  }, [path, progress])
}

const Arrow = ({ x, y, vx, vy, color, marker }: { x: number; y: number; vx: number; vy: number; color: string; marker: string }) => {
  const length = Math.hypot(vx, vy) || 1
  return <line x1={x} y1={y} x2={x + vx / length * 38} y2={y + vy / length * 38} stroke={color} strokeWidth="2.5" markerEnd={`url(#${marker})`}/>
}

export function OrbitalDiagram({ result, separation, massA, massB, showVelocity = true, showForce = true, showBarycenter = true, starMode = false, labelA = 'A', labelB = 'B' }: { result: OrbitResult; separation: number; massA: number; massB: number; showVelocity?: boolean; showForce?: boolean; showBarycenter?: boolean; starMode?: boolean; labelA?: string; labelB?: string }) {
  // Keep a stable diagram scale when speed changes. Beyond the normal orbit
  // area, radial compression keeps escape trajectories visible without a camera jump.
  const map = (p: Vec) => {
    const radius = Math.hypot(p.x, p.y)
    if (radius === 0) return { x: 330, y: 205 }
    const visualRadius = 145 * Math.tanh((radius * 195 / separation) / 145)
    return { x: 330 + p.x / radius * visualRadius, y: 205 + p.y / radius * visualRadius }
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
    {showBarycenter && <g transform={`translate(${center.x} ${center.y})`}><circle r="8" fill="none" stroke="#fff" opacity=".8"/><path d="M-13 0h26M0-13v26" stroke="#fff" opacity=".8"/><text y="-18" textAnchor="middle">barycenter</text></g>}
    <g transform={`translate(${a.x} ${a.y})`}><circle r={radiusA+7} fill="#ffb75e" opacity=".08"/><circle r={radiusA} fill={starMode ? 'url(#starA)' : '#ffb45d'} stroke="#ffd49b" strokeWidth="2"/><circle cx={-radiusA*.3} cy={-2} r="2" fill="#55351f"/><circle cx={radiusA*.3} cy={-2} r="2" fill="#55351f"/><path d={`M${-radiusA*.28} ${radiusA*.25}q${radiusA*.28} ${radiusA*.22} ${radiusA*.56} 0`} fill="none" stroke="#55351f" strokeWidth="2" strokeLinecap="round"/><text y={radiusA+21} textAnchor="middle">{labelA}</text></g>
    <g transform={`translate(${b.x} ${b.y})`}><circle r={radiusB+7} fill="#70b9ff" opacity=".08"/><circle r={radiusB} fill={starMode ? 'url(#starB)' : '#69adf5'} stroke="#aedaff" strokeWidth="2"/><circle cx={-radiusB*.3} cy={-2} r="2" fill="#193659"/><circle cx={radiusB*.3} cy={-2} r="2" fill="#193659"/><path d={`M${-radiusB*.28} ${radiusB*.25}q${radiusB*.28} ${radiusB*.22} ${radiusB*.56} 0`} fill="none" stroke="#193659" strokeWidth="2" strokeLinecap="round"/><text y={radiusB+21} textAnchor="middle">{labelB}</text></g>
    {showVelocity && <><Arrow x={a.x} y={a.y} vx={result.state.a.velocity.x} vy={result.state.a.velocity.y} color="#65e0ca" marker="arrow-vel"/><Arrow x={b.x} y={b.y} vx={result.state.b.velocity.x} vy={result.state.b.velocity.y} color="#65e0ca" marker="arrow-vel"/></>}
    {showForce && <><Arrow x={a.x} y={a.y} vx={dx} vy={dy} color="#ff8f8f" marker="arrow-force"/><Arrow x={b.x} y={b.y} vx={-dx} vy={-dy} color="#ff8f8f" marker="arrow-force"/></>}
  </svg>
}
