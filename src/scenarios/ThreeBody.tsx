import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Maths, Metric, Playback, Slider } from '../components/Controls'
import { Scenario } from '../components/Scenario'
import { useInView } from '../hooks/useInView'
import { centerOfMass, initialThreeBodyState, minimumSeparation, safeThreeBodyStep, stepThreeBody, threeBodyPresets, ThreeBodyPreset, ThreeBodyState, Vec2 } from '../physics/threeBody'

const COLORS = ['#ffcf78', '#72e8df', '#d4a5ff'] as const
const NAMES = ['A', 'B', 'C'] as const
const MAX_TRAIL = 360

type Simulation = { state: ThreeBodyState; trails: [Vec2[], Vec2[], Vec2[]]; years: number }

function startingSimulation(preset: ThreeBodyPreset, masses: [number, number, number], speed: number, spacing: number): Simulation {
  const state = initialThreeBodyState(preset, masses, speed, spacing)
  return { state, trails: [[state[0].position], [state[1].position], [state[2].position]], years: 0 }
}

function useThreeBodySimulation(preset: ThreeBodyPreset, masses: [number, number, number], speed: number, spacing: number, playbackSpeed: number, active: boolean) {
  const initial = useMemo(() => startingSimulation(preset, masses, speed, spacing), [preset, masses, speed, spacing])
  const current = useRef(initial)
  const [simulation, setSimulation] = useState(initial)
  const [playing, setPlaying] = useState(false)

  const reset = useCallback(() => {
    current.current = initial
    setSimulation(initial)
    setPlaying(false)
  }, [initial])

  useEffect(() => { reset() }, [reset])
  useEffect(() => { if (!active) setPlaying(false) }, [active])

  useEffect(() => {
    if (!active || !playing) return
    let frame = 0
    let last = 0
    const tick = (now: number) => {
      const elapsed = last ? Math.min((now - last) / 1000, 0.05) : 0
      last = now
      let remaining = elapsed * playbackSpeed / 10
      let state = current.current.state
      let advanced = 0
      for (let steps = 0; remaining > 1e-9 && steps < 180; steps++) {
        const dt = safeThreeBodyStep(state, remaining)
        state = stepThreeBody(state, dt)
        remaining -= dt
        advanced += dt
      }
      if (advanced > 0) {
        const trails = current.current.trails.map((trail, index) => [...trail, state[index].position].slice(-MAX_TRAIL)) as Simulation['trails']
        const next = { state, trails, years: current.current.years + advanced }
        current.current = next
        setSimulation(next)
      }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [active, playing, playbackSpeed])

  return { simulation, playing, toggle: () => setPlaying(value => !value), reset }
}

function ThreeBodyDiagram({ simulation, spacing }: { simulation: Simulation; spacing: number }) {
  const center = centerOfMass(simulation.state)
  const scale = 158 / spacing
  const map = (point: Vec2) => ({ x: 400 + (point.x - center.x) * scale, y: 300 + (point.y - center.y) * scale })
  const path = (points: Vec2[]) => points.map((point, index) => {
    const p = map(point)
    return `${index === 0 ? 'M' : 'L'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`
  }).join(' ')
  return <svg className="three-body-scene" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Three bodies pulling on one another, with colored trails showing their paths">
    <defs>
      <radialGradient id="three-space"><stop stopColor="#173349"/><stop offset=".65" stopColor="#0b1a2c"/><stop offset="1" stopColor="#07101e"/></radialGradient>
      {COLORS.map((color, index) => <radialGradient id={`three-body-${index}`} key={color}><stop stopColor="#fff"/><stop offset=".35" stopColor={color}/><stop offset="1" stopColor={color} stopOpacity=".72"/></radialGradient>)}
    </defs>
    <rect width="800" height="600" fill="url(#three-space)"/>
    {Array.from({ length: 55 }, (_, index) => {
      const x = (index * 179 + 83) % 800, y = (index * 269 + 57) % 600
      return <circle key={index} cx={x} cy={y} r={index % 7 === 0 ? 1.4 : .7} fill="#ccedff" opacity={index % 4 === 0 ? .48 : .23}/>
    })}
    {[1, 2].map(radius => <circle key={radius} cx="400" cy="300" r={radius * scale} fill="none" stroke="#b6dcf6" strokeOpacity=".09" strokeDasharray="4 8"/>)}
    <path d="M389 300h22 M400 289v22" stroke="#e6f2ff" strokeOpacity=".3" strokeWidth="1.5"/>
    <text x="416" y="290" className="three-body-center-label">center of mass</text>
    {simulation.trails.map((trail, index) => <path key={index} d={path(trail)} fill="none" stroke={COLORS[index]} strokeWidth="2.5" strokeOpacity=".75" strokeLinecap="round" strokeLinejoin="round"/>)}
    {simulation.state.map((body, index) => {
      const p = map(body.position)
      const radius = 10 + Math.max(0, Math.log10(body.mass / .001)) * 3.2
      return <g key={index} className="three-body-object" transform={`translate(${p.x} ${p.y})`}>
        <circle r={radius + 12} fill={COLORS[index]} opacity=".12"/>
        <circle r={radius} fill={`url(#three-body-${index})`} stroke={COLORS[index]} strokeWidth="1.4"/>
        <text x={radius + 10} y="4" fill={COLORS[index]}>{NAMES[index]}</text>
      </g>
    })}
  </svg>
}

const massLabel = (mass: number) => `${mass < .01 ? mass.toFixed(3) : mass < 1 ? mass.toFixed(2) : mass.toFixed(1)} M☉`

export function ThreeBody() {
  const ref = useRef<HTMLElement>(null)
  const active = useInView(ref)
  const [preset, setPreset] = useState<ThreeBodyPreset>('figureEight')
  const [logMasses, setLogMasses] = useState<[number, number, number]>([0, 0, 0])
  const [speed, setSpeed] = useState(1)
  const [spacing, setSpacing] = useState(1)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)
  const masses = useMemo(() => logMasses.map(value => 10 ** value) as [number, number, number], [logMasses])
  const sim = useThreeBodySimulation(preset, masses, speed, spacing, playbackSpeed, active)

  const selectPreset = (next: ThreeBodyPreset) => {
    const settings = threeBodyPresets[next]
    setPreset(next)
    setLogMasses(settings.masses.map(mass => Math.log10(mass)) as [number, number, number])
    setSpeed(settings.speed)
    setSpacing(settings.spacing)
  }
  const setMass = (index: number, value: number) => setLogMasses(previous => previous.map((mass, body) => body === index ? value : mass) as [number, number, number])
  const nearest = minimumSeparation(sim.simulation.state)

  return <Scenario sectionRef={ref} id="three-body" number="04" eyebrow="Newtonian gravity" title="Three bodies, no simple orbit" lede="Each object pulls on the other two. Change their masses and starting conditions to see orderly paths turn into close encounters." accent="#a9a0ff"
    visual={<>
      <ThreeBodyDiagram simulation={sim.simulation} spacing={spacing}/>
      <div className="three-body-visual-note"><strong>Three paths, one shared gravitational field</strong><span>Small changes can grow into very different trajectories.</span></div>
      <div className="three-body-legend">{NAMES.map((name, index) => <span key={name}><i style={{ background: COLORS[index] }}/>{name} · {massLabel(masses[index])}</span>)}</div>
    </>}
    controls={<>
      <div className="three-body-intro"><strong>Set the system in motion</strong><span>Choose a starting arrangement or tune each body.</span></div>
      <div className="preset-row three-body-presets">{(Object.keys(threeBodyPresets) as ThreeBodyPreset[]).map(key => <button key={key} className={preset === key ? 'selected' : ''} aria-pressed={preset === key} onClick={() => selectPreset(key)}>{threeBodyPresets[key].label}</button>)}</div>
      {NAMES.map((name, index) => <div className="three-body-mass" key={name} style={{ '--body-color': COLORS[index] } as React.CSSProperties}><Slider label={`Body ${name} mass`} min={-3} max={.5} step={.01} value={logMasses[index]} display={massLabel(masses[index])} onChange={value => setMass(index, value)}/></div>)}
      <Slider label="Initial speed" min={.65} max={1.4} step={.01} value={speed} display={`${speed.toFixed(2)} ×`} onChange={setSpeed}/>
      <Slider label="Starting spacing" min={.65} max={1.6} step={.01} value={spacing} display={`${spacing.toFixed(2)} ×`} onChange={setSpacing}/>
      <Slider label="Animation speed" min={.25} max={3} step={.05} value={playbackSpeed} display={`${playbackSpeed.toFixed(2)} ×`} onChange={setPlaybackSpeed}/>
      <Playback playing={sim.playing} toggle={sim.toggle} reset={sim.reset}/>
      <div className="readout-grid"><Metric label="Time elapsed" value={`${sim.simulation.years.toFixed(2)} years`}/><Metric label="Closest pair" value={`${nearest.toFixed(2)} AU`}/></div>
      <div className="gravity-note"><strong>Why the paths change</strong><p>Every body responds to both neighbors. The figure-eight preset starts with a special balance; changing a mass or starting speed can disrupt its symmetry. Body sizes are enlarged for clarity.</p></div>
      <Maths><p>Each body feels the sum of the other two gravitational pulls.</p><small>Velocity Verlet integration with softened gravity at very close approaches.</small></Maths>
    </>}/>
}
