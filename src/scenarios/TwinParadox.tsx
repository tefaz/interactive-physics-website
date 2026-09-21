import { useMemo, useRef, useState } from 'react'
import { Scenario } from '../components/Scenario'
import { ObserverFigure } from '../components/ObserverFigure'
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

function Earth({ x, elapsed }: { x: number; elapsed: string }) {
  return <g transform={`translate(${x} 248)`}>
    <circle r="53" fill="#62c9ff" opacity=".07"/><circle r="47" fill="url(#twin-earth)" stroke="#8ddfff" strokeWidth="1.5"/>
    <path d="M-34-29L-17-36-5-29-9-18 3-13-2-1-15 2-18 17-28 7-26-7-37-15ZM14-31L32-24 39-9 26-3 19 12 8 20 4 9 10-3 4-15ZM-9 32L8 28 21 35 9 42-5 40Z" fill="#69c7a3"/>
    <path d="M-36-16Q-8-31 30-17M-24 26Q4 14 34 23" fill="none" stroke="#e0f8ff" strokeWidth="3" opacity=".35"/>
    <ellipse cy="-46" rx="16" ry="3" fill="#163d5b" opacity=".5"/>
    <ObserverFigure x={0} y={-47} scale={.45} character="bob"/>
    <text y="76" textAnchor="middle" className="twin-person-label">Brother 1</text>
    <text y="93" textAnchor="middle">Stays on Earth</text>
    <text y="106" textAnchor="middle" className="twin-clock earth-clock">Time · {elapsed}</text>
  </g>
}

function Rocket({ x, direction, elapsed }: { x: number; direction: number; elapsed: string }) {
  return <g transform={`translate(${x} 109)`}>
    <g transform={`scale(${direction} 1)`} className="rocket">
      <path d="M-49-12Q-80-10-91 0-75 13-49 12" fill="#faac58" opacity=".8"/><path d="M-49-6L-77 0-49 6" fill="#fff1b6"/>
      <path d="M-35-21L-55-40-65-40-54-7M-35 21L-55 40-65 40-54 7" fill="#d86e60" stroke="#f5a694" strokeWidth="1.5"/>
      <path d="M-50-23Q-5-39 34-23L65 0 34 23Q-5 39-50 23Z" fill="url(#twin-hull)" stroke="#c9e8f0" strokeWidth="1.5"/>
      <path d="M35-22L65 0 35 22Q46 0 35-22" fill="#79b6c7"/>
      <rect x="-55" y="-15" width="8" height="30" rx="3" fill="#54778e"/>
      <rect x="-29" y="-26" width="57" height="49" rx="18" fill="#102638" stroke="#83d3e3" strokeWidth="2"/>
      {/* A seated pilot: backrest, bent legs, connected arms and matching family features. */}
      <path d="M-19-4L-16 15H4" fill="none" stroke="#627e91" strokeWidth="5" strokeLinecap="round"/>
      <path d="M-7 6L7 8 13 18H20" fill="none" stroke="#344d65" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M-12-9Q-3-13 1-5L3 8H-12Z" fill="#e4ac58"/>
      <path d="M-4-5L3 1 12-2" fill="none" stroke="#e4ac58" strokeWidth="5" strokeLinecap="round"/>
      <path d="M11-2h5" stroke="#bd8a68" strokeWidth="3" strokeLinecap="round"/>
      <path d="M-7-12v5" stroke="#bd8a68" strokeWidth="5"/>
      <path d="M-13-21Q-4-28 0-19L2-15-1-13Q-4-8-10-13Z" fill="#bd8a68"/>
      <path d="M-13-16Q-19-27-7-28 1-27 1-21L-7-23-11-17Z" fill="#35404a"/>
      <circle cx="-2" cy="-18" r=".9" fill="#263043"/>
      <path d="M18-7L22 10" stroke="#80cfdb" strokeWidth="3" strokeLinecap="round"/>
      <path d="M-25-17Q-23-22-17-22" fill="none" stroke="#d4f9ff" strokeWidth="2" opacity=".7"/>
      <path d="M-33 19h-8M-33 23h-8" stroke="#7896a7" strokeWidth="2"/>
    </g>
    <text y="62" textAnchor="middle" className="twin-person-label">Brother 2</text>
    <text y="79" textAnchor="middle">{direction === 1 ? 'Outbound' : 'Homeward'} · rocket</text>
    <text y="96" textAnchor="middle" className="twin-clock rocket-clock">Time · {elapsed}</text>
  </g>
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
  const rocketFrame = frame === 'Rocket'
  const rocketFrameOffset = 300 * data.position
  const returnProgress = 1 - data.position
  const earthX = rocketFrame ? (data.direction === 1 ? 430 - rocketFrameOffset : 130 + 300 * returnProgress) : 125
  const destinationX = rocketFrame ? (data.direction === 1 ? 730 - rocketFrameOffset : 430 + 300 * returnProgress) : 600
  // In the Earth view, launch and reunion occur at Earth's centre. In the
  // rocket view, the rocket is at rest and Earth moves past it instead.
  const rocketX = rocketFrame ? 430 : earthX + data.position * (destinationX - earthX)
  const rocketElapsed = data.travellerElapsedYears
  const rocketFrameEarthElapsed = data.direction === 1
    ? rocketElapsed / data.gamma
    : data.earthTotalYears / 2 * (1 + beta * beta) + (rocketElapsed - data.travellerTotalYears / 2) / data.gamma
  const earthElapsed = rocketFrame ? rocketFrameEarthElapsed : data.earthElapsedYears
  const earthClock = rocketFrame && earthElapsed >= 1 ? `${earthElapsed.toFixed(4)} years` : formatYears(earthElapsed)
  const contractedDistance = distanceLy / data.gamma
  const stars = useMemo(() => Array.from({ length: 42 }, (_, i) => ({ x: (i * 83 + 41) % 860, y: (i * 47 + 29) % 310, r: i % 7 === 0 ? 1.8 : 1 })), [])

  return <Scenario primary sectionRef={ref} id="twin-paradox" number="01" eyebrow="Special relativity" title="Twin Paradox" lede="Send one twin to a distant marker and back. The clocks below are the prediction—not an animation trick." accent="#72e3ff"
    visual={<>
      <svg className="space-scene twin-scene" viewBox="0 0 860 360" role="img" aria-label={rocketFrame ? "Rocket-frame view: Brother 2 is stationary while Earth moves away and returns" : "Earth-frame view: Brother 1 stands on Earth while Brother 2 pilots a rocket to the turnaround beacon and back"}>
        <defs><linearGradient id="trail" x1="0" x2="1"><stop stopColor="#6fe4ff" stopOpacity=".1"/><stop offset="1" stopColor="#6fe4ff"/></linearGradient><radialGradient id="twin-earth" cx=".3" cy=".25"><stop stopColor="#4ab7e9"/><stop offset="1" stopColor="#20508a"/></radialGradient><linearGradient id="twin-hull" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#f3faf7"/><stop offset="1" stopColor="#8faebf"/></linearGradient></defs>
        {stars.map((s, i) => <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#fff" opacity={.15 + (i % 5) * .1}/>) }
        <path d={`M${earthX} 205V109H${destinationX}`} fill="none" stroke="#7580a1" strokeDasharray="4 8" opacity=".45"/>
        <Earth x={earthX} elapsed={earthClock}/>
        <g transform={`translate(${destinationX} 109)`}><ellipse rx="18" ry="44" fill="#b489ed" opacity=".07" stroke="#c99aff"/><ellipse rx="12" ry="37" fill="none" stroke="#c99aff" strokeWidth="2" strokeDasharray="4 5"/><path d="M0-53V-43M0 43v10" stroke="#dcbdff" strokeWidth="2"/></g>
        <Rocket x={rocketX} direction={data.direction} elapsed={formatYears(data.travellerElapsedYears)}/>
        <text x={destinationX} y="39" textAnchor="middle">Turnaround beacon</text>
        {sim.progress === 1 && <g className="twin-reunion" transform="translate(430 178)">
          <rect x="-146" y="-29" width="292" height="58" rx="18"/>
          <text y="-5" textAnchor="middle">Reunion</text>
          <text y="15" textAnchor="middle">Brother 2 is {formatYears(data.differenceYears)} younger</text>
        </g>}
      </svg>
    </>}
    controls={<>
      <Segmented value={frame} options={['Earth', 'Rocket'] as const} onChange={setFrame} label="Reference frame"/>
      <Slider label="Rocket speed" value={speedControl} min={0} max={speedStops.length - 1} step={.01} display={speedLabel(beta)} onChange={setSpeedControl}/>
      <div className="microcopy">Nonlinear control gives you room near light speed.</div>
      <Slider label="Turnaround distance" value={distanceLy} min={.5} max={20} step={.5} display={`${distanceLy.toFixed(1)} light-years`} onChange={setDistanceLy}/>
      <Timeline {...sim}/>
      <div className="readout-grid"><Metric label="Lorentz factor γ" value={data.gamma.toFixed(3)}/><Metric label="Earth round trip" value={formatYears(data.earthTotalYears)}/><Metric label="Traveller round trip" value={formatYears(data.travellerTotalYears)}/><Metric label={rocketFrame ? 'Rocket-frame leg distance' : 'Earth-frame distance'} value={`${(rocketFrame ? contractedDistance : distanceLy).toFixed(2)} ly`}/></div>
      {rocketFrame && <p className="twin-frame-note"><strong>Rocket-frame clock comparison:</strong> Brother 1's time is the Earth event simultaneous with Brother 2 in the current leg's inertial frame. It jumps forward at turnaround when that frame changes.</p>}
      <Maths><p><b>β = v/c = {beta.toFixed(4)}</b></p><p>γ = 1 / √(1 − β²) = <b>{data.gamma.toFixed(4)}</b></p><p>Earth time = 2d / v = 2 × {distanceLy} ly / {beta.toFixed(4)}c = <b>{data.earthTotalYears.toFixed(3)} years</b></p><p>Traveller proper time = t / γ = <b>{data.travellerTotalYears.toFixed(3)} years</b></p><small>Idealization: acceleration and turnaround duration are negligible. Proper time is accumulated along two distinct inertial legs.</small></Maths>
    </>}/>
}
