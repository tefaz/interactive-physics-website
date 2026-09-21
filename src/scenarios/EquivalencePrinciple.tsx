import { useMemo, useRef, useState } from 'react'
import { Scenario } from '../components/Scenario'
import { Metric, Segmented, Slider, Timeline } from '../components/Controls'
import { useInView } from '../hooks/useInView'
import { useSimulation } from '../hooks/useSimulation'

type Cause = 'Accelerating rocket' | 'Gravity'
type View = 'Sealed cabin' | 'Outside view'

const FALL_HEIGHT = 2

function Observer({ y }: { y: number }) {
  return <g transform={`translate(500 ${y})`}>
    <circle cy="-69" r="18" fill="#efbf98"/>
    <path d="M-17-74q17-24 34 1v-8q-4-19-19-19-16 1-20 22z" fill="#32283d"/>
    <circle cx="-6" cy="-70" r="2" fill="#2e2a39"/><circle cx="6" cy="-70" r="2" fill="#2e2a39"/>
    <path d="M-6-62q6 5 12 0" fill="none" stroke="#80564d" strokeWidth="2" strokeLinecap="round"/>
    <path d="M-21-43q21-13 42 0l8 72h-58z" fill="#f2a85d"/>
    <path d="M-18-31l-47 26M18-31l38 6M-14 28l-7 54M14 28l7 54" fill="none" stroke="#f2a85d" strokeWidth="13" strokeLinecap="round"/>
    <path d="M-29 82h17M12 82h17" stroke="#29344c" strokeWidth="9" strokeLinecap="round"/>
  </g>
}

function Cabin({ offset = 0, ballY, rocket }: { offset?: number; ballY: number; rocket: boolean }) {
  return <g transform={`translate(0 ${offset})`}>
    {rocket && <g className="rocket-flame"><path d="M367 505l33 74 30-74 30 74 32-74" fill="#ffb44f" opacity=".85"/><path d="M395 505l18 48 18-48 20 48 18-48" fill="#fff0a3"/></g>}
    <path d="M328 109Q430 72 532 109L552 474Q430 506 308 474Z" fill="url(#cabin-wall)" stroke="#d9e7f0" strokeWidth="5"/>
    <path d="M319 439Q430 465 541 439L543 475Q430 503 316 475Z" fill="#405168"/>
    <path d="M341 134h178M326 408h211" stroke="#9fb2c4" strokeWidth="3" opacity=".7"/>
    <rect x="350" y="150" width="62" height="94" rx="10" fill="#17263c" stroke="#9ed8ed" strokeWidth="4"/>
    <g opacity=".45"><circle cx="366" cy="173" r="2" fill="#fff"/><circle cx="393" cy="194" r="1.5" fill="#fff"/><circle cx="374" cy="224" r="1.5" fill="#fff"/></g>
    <Observer y={356}/>
    <path d="M556 331h-54" stroke="#f2a85d" strokeWidth="12" strokeLinecap="round"/>
    <circle cx="562" cy={ballY} r="17" fill="#ff6e8a" stroke="#ffd6de" strokeWidth="3" className="equivalence-ball"/>
    <path d={`M562 205V${Math.max(205, ballY - 22)}`} stroke="#ffafbf" strokeDasharray="4 7" strokeWidth="2" opacity=".65"/>
  </g>
}

export function EquivalencePrinciple() {
  const ref = useRef<HTMLElement>(null)
  const active = useInView(ref)
  const sim = useSimulation(active, .22)
  const [cause, setCause] = useState<Cause>('Accelerating rocket')
  const [view, setView] = useState<View>('Sealed cabin')
  const [acceleration, setAcceleration] = useState(9.81)
  const duration = Math.sqrt(2 * FALL_HEIGHT / acceleration)
  const time = sim.progress * duration
  const distance = Math.min(FALL_HEIGHT, .5 * acceleration * time * time)
  const fallPixels = distance / FALL_HEIGHT * 198
  const outsideRocket = view === 'Outside view' && cause === 'Accelerating rocket'
  const cabinOffset = outsideRocket ? -fallPixels : 0
  const ballY = outsideRocket ? 205 - cabinOffset : 205 + fallPixels
  const stars = useMemo(() => Array.from({ length: 34 }, (_, i) => ({ x: (i * 137 + 23) % 1000, y: (i * 79 + 37) % 590, r: i % 6 ? 1.2 : 2.1 })), [])
  const changeCause = (next: Cause) => { setCause(next); sim.reset() }
  const changeAcceleration = (next: number) => { setAcceleration(next); sim.reset() }

  return <Scenario sectionRef={ref} id="equivalence" number="02" eyebrow="General relativity" title="Acceleration feels like gravity" lede="Einstein’s elevator reveals the equivalence principle: inside a small sealed cabin, constant acceleration and a uniform gravitational field produce the same local physics." accent="#ffbe63"
    visual={<>
      <svg className="space-scene equivalence-scene" viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid slice" role="img" aria-label={`${view}: a released ball ${cause === 'Gravity' ? 'falls under gravity' : 'appears to fall in an accelerating rocket'}`}>
        <defs>
          <linearGradient id="cabin-wall" x1="0" x2="1"><stop stopColor="#718398"/><stop offset=".48" stopColor="#53677d"/><stop offset="1" stopColor="#788b9e"/></linearGradient>
          <radialGradient id="earth-glow"><stop stopColor="#85d8ff"/><stop offset=".68" stopColor="#397ac5"/><stop offset="1" stopColor="#254887"/></radialGradient>
        </defs>
        <rect width="1000" height="600" fill={view === 'Sealed cabin' ? '#11192a' : cause === 'Gravity' ? '#102643' : '#070c1b'}/>
        {view === 'Outside view' && <>
          {stars.map((s, i) => <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#fff" opacity={.18 + (i % 5) * .11}/>) }
          {cause === 'Gravity' && <g><circle cx="430" cy="745" r="270" fill="url(#earth-glow)"/><path d="M190 535Q430 460 670 535" fill="none" stroke="#9be9ff" strokeWidth="7" opacity=".75"/><text x="700" y="540">near a planet</text></g>}
          {cause === 'Accelerating rocket' && <g className="acceleration-arrow"><path d="M208 415V230" stroke="#ffca70" strokeWidth="7" strokeLinecap="round"/><path d="M180 265l28-42 28 42" fill="#ffca70"/><text x="208" y="450" textAnchor="middle">cabin accelerates up</text></g>}
        </>}
        <Cabin offset={cabinOffset} ballY={ballY} rocket={cause === 'Accelerating rocket' && view === 'Outside view'}/>
        {view === 'Sealed cabin' && <g className="sealed-badge"><rect x="155" y="272" width="120" height="56" rx="28" fill="#222c40" stroke="#71819a"/><path d="M180 289h22v21h-22zM184 289v-7a7 7 0 0114 0v7" fill="none" stroke="#cbd5e2" strokeWidth="3"/><text x="219" y="306">no windows</text></g>}
      </svg>
      <p className="visual-caption equivalence-caption"><strong>{outsideRocket ? 'From outside, the ball coasts while the rocket floor accelerates up to meet it.' : cause === 'Gravity' && view === 'Outside view' ? 'From outside, gravity accelerates the ball down toward the floor.' : 'From inside, the ball accelerates toward the floor. No local experiment reveals the cause.'}</strong></p>
      <div className="clock-row equivalence-result">
        <Metric label="Apparent downward acceleration" value={`${acceleration.toFixed(2)} m/s²`} tone="#ffd080"/>
        <div className="clock-vs">same result</div>
        <Metric label="Distance fallen" value={`${distance.toFixed(2)} m`} tone="#ff91a6"/>
      </div>
    </>}
    controls={<>
      <Segmented value={cause} options={['Accelerating rocket', 'Gravity'] as const} onChange={changeCause} label="Cause"/>
      <Segmented value={view} options={['Sealed cabin', 'Outside view'] as const} onChange={setView} label="Perspective"/>
      <Slider label={cause === 'Gravity' ? 'Gravitational field g' : 'Rocket acceleration a'} value={acceleration} min={1} max={20} step={.01} display={`${acceleration.toFixed(2)} m/s²`} onChange={changeAcceleration}/>
      <div className="preset-row"><button onClick={() => changeAcceleration(1.62)}>Moon 1.62</button><button onClick={() => changeAcceleration(9.81)}>Earth 9.81</button><button onClick={() => changeAcceleration(3.71)}>Mars 3.71</button></div>
      <Timeline {...sim} label="Release the ball"/>
      <div className="readout-grid"><Metric label="Elapsed time" value={`${time.toFixed(2)} s`}/><Metric label="Time to floor" value={`${duration.toFixed(2)} s`}/></div>
      <div className="equivalence-note"><strong>Einstein’s equivalence principle</strong><p>In a small enough region, being at rest in gravity is physically indistinguishable from accelerating at the same rate. That insight led Einstein to describe gravity as curved spacetime.</p></div>
    </>}/>
}
