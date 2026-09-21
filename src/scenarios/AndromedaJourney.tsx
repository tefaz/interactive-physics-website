import { useMemo, useRef, useState } from 'react'
import { Scenario } from '../components/Scenario'
import { Metric, Slider, Timeline } from '../components/Controls'
import { useInView } from '../hooks/useInView'
import { useSimulation } from '../hooks/useSimulation'
import { intergalacticJourney } from '../physics/relativity'

const DISTANCE_LY = 2_500_000
const compactYears = (years: number) => {
  const absolute = Math.abs(years)
  if (absolute === 0) return '0 years'
  if (absolute < 1 / 365.25) {
    const seconds = absolute * 365.25 * 24 * 60 * 60
    if (seconds < 120) return `${seconds.toFixed(0)} seconds`
    if (seconds < 7200) return `${(seconds / 60).toFixed(0)} minutes`
    return `${(seconds / 3600).toFixed(1)} hours`
  }
  if (absolute < 1) return `${(absolute * 365.25).toFixed(1)} days`
  if (absolute >= 1e6) return `${(absolute / 1e6).toFixed(absolute >= 10e6 ? 1 : 2)} million years`
  if (absolute >= 1e3) return `${(absolute / 1e3).toFixed(absolute >= 10e3 ? 1 : 2)} thousand years`
  return `${absolute.toFixed(absolute < 10 ? 2 : 0)} years`
}
const imageDate = (years: number) => years < 0 ? `${compactYears(years)} before launch` : years === 0 ? 'the launch moment' : `${compactYears(years)} after launch`
const imageAge = (years: number) => years <= 1e-6 ? 'live at the planet' : `${compactYears(years)} behind the planet`
const speedFromNines = (nines: number) => 1 - 10 ** -nines

function Galaxy({ x, y, color, flip = 1, label }: { x: number; y: number; color: string; flip?: number; label: string }) {
  return <g transform={`translate(${x} ${y}) scale(${flip} 1)`}>
    <ellipse rx="92" ry="25" fill={color} opacity=".12" transform="rotate(-14)"/>
    <ellipse rx="70" ry="16" fill="none" stroke={color} strokeWidth="8" opacity=".45" transform="rotate(-14)"/>
    <path d="M-81 17C-45-28 32-30 79 3M-70-22C-28 21 31 27 72-9" fill="none" stroke={color} strokeWidth="5" strokeLinecap="round" opacity=".75"/>
    <circle r="12" fill="#fff5cf"/><circle r="27" fill={color} opacity=".18"/>
    <text y="58" textAnchor="middle" transform={`scale(${flip} 1)`}>{label}</text>
  </g>
}

function Ship({ x }: { x: number }) {
  return <g transform={`translate(${x} 286)`} className="andromeda-ship">
    <path d="M-25 0l-34 17 14-17-14-17z" fill="#ffac5d"/>
    <path d="M-37-19C-4-31 28-20 47 0 28 20-4 31-37 19Z" fill="#eaf3ff" stroke="#95b1d2" strokeWidth="3"/>
    <circle cx="15" r="12" fill="#74dfff" stroke="#304b6c" strokeWidth="3"/>
  </g>
}

export function AndromedaJourney() {
  const ref = useRef<HTMLElement>(null)
  const active = useInView(ref)
  const sim = useSimulation(active, .055)
  const [nines, setNines] = useState(9)
  const beta = speedFromNines(nines)
  const data = intergalacticJourney(beta, DISTANCE_LY, sim.progress)
  const shipX = 145 + sim.progress * 465
  const stars = useMemo(() => Array.from({ length: 62 }, (_, i) => ({ x: (i * 149 + 31) % 1000, y: (i * 83 + 19) % 600, r: i % 9 ? 1 : 2 })), [])
  const setSpeed = (value: number) => { setNines(value); sim.reset() }
  const ninesLabel = nines === 1 ? '0.9c' : `0.${'9'.repeat(nines)}c`
  const arrived = sim.progress === 1

  return <Scenario sectionRef={ref} id="andromeda-journey" number="04" eyebrow="Light travel & time dilation" title="Racing Andromeda’s light" lede="A traveller crosses 2.5 million light-years while Earth and the ship receive radically different views of the destination’s history." accent="#d58cff"
    visual={<>
      <svg className="space-scene andromeda-scene" viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid slice" role="img" aria-label={`Spaceship ${Math.round(sim.progress * 100)} percent of the way from the Milky Way to Andromeda`}>
        <defs><linearGradient id="journey-line" x1="0" x2="1"><stop stopColor="#72dcff"/><stop offset="1" stopColor="#d98eff"/></linearGradient></defs>
        <rect width="1000" height="600" fill="#08091c"/>
        {stars.map((s, i) => <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#fff" opacity={.14 + (i % 5) * .1}/>) }
        <Galaxy x={105} y={286} color="#73d7ff" label="Milky Way · Earth"/>
        <Galaxy x={700} y={286} color="#d58cff" flip={-1} label="Andromeda"/>
        <g className="destination-planet"><circle cx="625" cy="244" r="10" fill="#df9cff" stroke="#ffe6ff" strokeWidth="3"/><circle cx="625" cy="244" r="17" fill="none" stroke="#df9cff" opacity=".28"/><text x="600" y="220" textAnchor="end">outer-ring planet</text></g>
        <line x1="190" y1="286" x2="610" y2="286" stroke="url(#journey-line)" strokeWidth="3" strokeDasharray="7 10" opacity=".55"/>
        <Ship x={shipX}/>
        <g className="journey-progress"><rect x="205" y="358" width="405" height="8" rx="4" fill="#252944"/><rect x="205" y="358" width={405 * sim.progress} height="8" rx="4" fill="url(#journey-line)"/><text x="205" y="392">launch</text><text x="610" y="392" textAnchor="end">arrival</text></g>
        <g className="image-callout" transform={`translate(${Math.min(555, Math.max(245, shipX))} 190)`}><path d="M0 38v38" stroke="#cf9cff" strokeWidth="2"/><rect x="-113" y="-22" width="226" height="62" rx="16" fill="#2a1c43" stroke="#a86fd4"/><text y="2" textAnchor="middle">Age of traveller’s view</text><text y="23" textAnchor="middle" className="image-date">{imageAge(data.earthElapsedYears - data.travellerImageEmissionYear)}</text></g>
      </svg>
      <div className="andromeda-summary">
        <p className="andromeda-insight"><strong>{arrived ? 'Arrival: the astronaut sees the planet’s current local moment, while Earth still receives a 2.5-million-year-old image.' : 'Flying toward Andromeda compresses millions of years of arriving images into the traveller’s much shorter lifetime.'}</strong></p>
        <div className="clock-row cosmic-clock-row">
          <Metric label="Earth time since launch" value={`+${compactYears(data.earthElapsedYears)}`} tone="#73d7ff"/>
          <Metric label="Astronaut time since launch" value={`+${compactYears(data.travellerElapsedYears)}`} tone="#ffd080"/>
          <Metric label="Outer-ring planet time since launch" value={`+${compactYears(data.earthElapsedYears)}`} tone="#dda3ff"/>
        </div>
        <div className="signal-age-row">
          <span><b>Earth’s received image:</b> {imageAge(DISTANCE_LY)}</span>
          <span><b>Traveller’s received image:</b> {imageAge(data.earthElapsedYears - data.travellerImageEmissionYear)}</span>
        </div>
      </div>
    </>}
    controls={<>
      <Slider label="Cruising speed" value={nines} min={1} max={12} step={1} display={ninesLabel} onChange={setSpeed}/>
      <div className="preset-row"><button onClick={() => setSpeed(3)}>0.999c</button><button onClick={() => setSpeed(6)}>6 nines</button><button onClick={() => setSpeed(9)}>9 nines</button><button onClick={() => setSpeed(12)}>12 nines</button></div>
      <Timeline {...sim} label="Journey to Andromeda"/>
      <div className="readout-grid"><Metric label="Earth time since launch" value={compactYears(data.earthElapsedYears)}/><Metric label="Astronaut time since launch" value={compactYears(data.travellerElapsedYears)}/><Metric label="Lorentz factor γ" value={data.gamma.toLocaleString(undefined,{maximumFractionDigits:0})}/><Metric label="Approach fast-forward" value={`${data.approachDopplerFactor.toLocaleString(undefined,{maximumFractionDigits:0})}×`}/></div>
      <div className="andromeda-note"><strong>Two effects, one extraordinary trip</strong><p><b>Time dilation:</b> Earth’s frame records {compactYears(data.earthTotalYears)}, while the astronaut experiences {compactYears(data.travellerTotalYears)}.</p><p><b>Light-travel delay:</b> Earth’s image always trails the planet by 2.5 million years. Its light was emitted {imageDate(data.earthImageEmissionYear)}; that timestamp is not the image’s age.</p></div>
    </>}/>
}
