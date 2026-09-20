import { useMemo, useRef, useState } from 'react'
import { Scenario } from '../components/Scenario'
import { Maths, Metric, Segmented, Slider, Timeline } from '../components/Controls'
import { useInView } from '../hooks/useInView'
import { useSimulation } from '../hooks/useSimulation'
import { twinAtProgress } from '../physics/relativity'
import { formatYears } from '../utils/format'

const speedStops = [.1, .2, .3, .4, .5, .6, .7, .8, .9, .95, .99, .995, .999, .9999]
const speedAt = (v: number) => {
  const lo = Math.floor(v), hi = Math.min(speedStops.length - 1, Math.ceil(v)), f = v - lo
  return speedStops[lo] + (speedStops[hi] - speedStops[lo]) * f
}
const speedLabel = (beta: number) => `${beta.toFixed(beta >= .999 ? 4 : beta >= .99 ? 3 : 2)}c`

function Earth({ x }: { x: number }) {
  return <g transform={`translate(${x} 191)`}><circle r="46" fill="#438ee8" stroke="#8dccff" strokeWidth="3"/><path d="M-31-28c18-6 21 8 32 9s12-8 27-2l8 18c-15-2-15 12-29 10S-4-4-17 3s-20-8-18-16zM-20 24c13-7 19 3 28 4l-8 9-16-3z" fill="#72d39d"/><circle cx="-13" cy="-4" r="6" fill="#fff"/><circle cx="13" cy="-4" r="6" fill="#fff"/><circle cx="-11" cy="-3" r="2.5" fill="#172543"/><circle cx="11" cy="-3" r="2.5" fill="#172543"/><path d="M-13 12q13 12 26 0" fill="none" stroke="#172543" strokeWidth="3" strokeLinecap="round"/><circle r="53" fill="none" stroke="#65b8ff" strokeOpacity=".18" strokeWidth="7"/></g>
}

function Rocket({ x, direction }: { x: number; direction: number }) {
  return <g transform={`translate(${x} 185) scale(${direction} 1)`} className="rocket"><path d="M-25 8l-22 14 8-22z" fill="#ffb35c"/><path d="M-16-11C4-26 29-17 40 0 28 17 4 25-16 10z" fill="#f3f6ff" stroke="#9aa7ca" strokeWidth="2"/><circle cx="13" cy="0" r="10" fill="#70d9ff" stroke="#263653" strokeWidth="2"/><circle cx="10" cy="-2" r="1.5" fill="#172543"/><circle cx="16" cy="-2" r="1.5" fill="#172543"/><path d="M9 3q4 4 8 0" fill="none" stroke="#172543" strokeWidth="1.5" strokeLinecap="round"/><path d="M-12-11l-7-13-8 18M-12 10l-7 13-8-18" fill="#e45e75"/></g>
}

export function TwinParadox() {
  const ref = useRef<HTMLElement>(null)
  const active = useInView(ref)
  const sim = useSimulation(active, .055)
  const [speedControl, setSpeedControl] = useState(8)
  const [distanceLy, setDistanceLy] = useState(4)
  const [frame, setFrame] = useState<'Earth' | 'Rocket'>('Earth')
  const beta = speedAt(speedControl)
  const data = twinAtProgress(beta, distanceLy, sim.progress)
  const rocketX = frame === 'Earth' ? 175 + data.position * 400 : 430
  const earthX = frame === 'Earth' ? 125 : 430 - data.position * 300
  const destinationX = frame === 'Earth' ? 600 : 430 + (1 - data.position) * 300
  const contracted = distanceLy / data.gamma
  const stars = useMemo(() => Array.from({ length: 42 }, (_, i) => ({ x: (i * 83 + 41) % 860, y: (i * 47 + 29) % 310, r: i % 7 === 0 ? 1.8 : 1 })), [])

  return <Scenario primary sectionRef={ref} id="twin-paradox" number="01" eyebrow="Special relativity" title="Twin Paradox" lede="Send one twin to a distant marker and back. The clocks below are the prediction—not an animation trick." accent="#72e3ff"
    visual={<>
      <svg className="space-scene twin-scene" viewBox="0 0 860 360" role="img" aria-label="Rocket travelling between Earth and a turnaround beacon">
        <defs><linearGradient id="trail" x1="0" x2="1"><stop stopColor="#6fe4ff" stopOpacity=".1"/><stop offset="1" stopColor="#6fe4ff"/></linearGradient></defs>
        {stars.map((s, i) => <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#fff" opacity={.15 + (i % 5) * .1}/>) }
        <line x1={Math.min(earthX, destinationX)} y1="191" x2={Math.max(earthX, destinationX)} y2="191" stroke="#7580a1" strokeDasharray="5 9" opacity=".45"/>
        <line x1={earthX} y1="191" x2={rocketX} y2="191" stroke="url(#trail)" strokeWidth="3"/>
        <Earth x={earthX}/>
        <g transform={`translate(${destinationX} 191)`}><circle r="29" fill="#2b2141" stroke="#ca81ff" strokeWidth="3"/><circle cx="-9" cy="-4" r="3" fill="#e9caff"/><circle cx="9" cy="-4" r="3" fill="#e9caff"/><path d="M-9 9q9 7 18 0" fill="none" stroke="#e9caff" strokeWidth="2" strokeLinecap="round"/><path d="M0-40v-15M0 40v15M-40 0h-15M40 0h15" stroke="#ca81ff" strokeWidth="2"/></g>
        <Rocket x={rocketX} direction={data.direction}/>
        <text x={earthX} y="269" textAnchor="middle">Earth</text><text x={destinationX} y="242" textAnchor="middle">Turnaround</text>
      </svg>
      <div className="clock-row">
        <Metric label="Earth twin" value={formatYears(data.earthElapsedYears)} tone="#72e3ff"/>
        <div className="clock-vs">Δ {formatYears(data.earthElapsedYears - data.travellerElapsedYears)}</div>
        <Metric label="Travelling twin" value={formatYears(data.travellerElapsedYears)} tone="#ffb35c"/>
      </div>
      {sim.progress === 1 && <div className="result-banner">Reunion: the traveller is <strong>{formatYears(data.differenceYears)}</strong> younger.</div>}
    </>}
    controls={<>
      <Segmented value={frame} options={['Earth', 'Rocket'] as const} onChange={setFrame} label="View from reference frame"/>
      <Slider label="Rocket speed" value={speedControl} min={0} max={speedStops.length - 1} step={.01} display={speedLabel(beta)} onChange={setSpeedControl}/>
      <div className="microcopy">Nonlinear control gives you room near light speed.</div>
      <Slider label="Turnaround distance" value={distanceLy} min={.5} max={20} step={.5} display={`${distanceLy.toFixed(1)} light-years`} onChange={setDistanceLy}/>
      <Timeline {...sim}/>
      <div className="readout-grid"><Metric label="Lorentz factor γ" value={data.gamma.toFixed(3)}/><Metric label="Earth round trip" value={formatYears(data.earthTotalYears)}/><Metric label="Traveller round trip" value={formatYears(data.travellerTotalYears)}/><Metric label={frame === 'Rocket' ? 'Distance in leg frame' : 'Earth-frame distance'} value={`${(frame === 'Rocket' ? contracted : distanceLy).toFixed(2)} ly`}/></div>
      {frame === 'Rocket' && <p className="frame-note"><strong>Two rocket frames:</strong> the rocket is centered for intuition, but it switches from an outbound to an inbound inertial frame at turnaround. This is not one continuous inertial frame.</p>}
      <Maths><p><b>β = v/c = {beta.toFixed(4)}</b></p><p>γ = 1 / √(1 − β²) = <b>{data.gamma.toFixed(4)}</b></p><p>Earth time = 2d / v = 2 × {distanceLy} ly / {beta.toFixed(4)}c = <b>{data.earthTotalYears.toFixed(3)} years</b></p><p>Traveller proper time = t / γ = <b>{data.travellerTotalYears.toFixed(3)} years</b></p><small>Idealization: acceleration and turnaround duration are negligible. Proper time is accumulated along two distinct inertial legs.</small></Maths>
    </>}/>
}
