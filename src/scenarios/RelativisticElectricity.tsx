import { CarFront, PersonStanding } from 'lucide-react'
import { useRef, useState } from 'react'
import { Scenario } from '../components/Scenario'
import { ObserverFigure } from '../components/ObserverFigure'
import { Playback } from '../components/Controls'
import { useInView } from '../hooks/useInView'
import { useSimulation } from '../hooks/useSimulation'
import { wireInMovingFrame } from '../physics/electromagnetism'

function Charge({ x, y, positive }: { x: number; y: number; positive: boolean }) {
  return <g className={positive ? 'charge charge-positive' : 'charge charge-negative'} transform={`translate(${x} ${y})`}>
    <circle r="10" />
    <path d={positive ? 'M-3.5 0H3.5M0-3.5V3.5' : 'M-3.5 0H3.5'} />
  </g>
}

function StandingObserver({ active }: { active: boolean }) {
  return <g className={`electricity-observer standing-observer${active ? ' is-active' : ''}`}>
    <ellipse cx="170" cy="489" rx="43" ry="9" className="observer-shadow" />
    <ObserverFigure x={170} y={487} scale={.52} character="bob"/>
    <g className="observer-tag" transform="translate(118 503)"><rect width="104" height="29" rx="14.5"/><text x="52" y="19" textAnchor="middle">FIELD FRAME</text></g>
  </g>
}

function MovingCar({ x, active }: { x: number; active: boolean }) {
  return <g className={`electricity-car${active ? ' is-active' : ''}`} transform={`translate(${x} 432)`}>
    <ellipse cy="48" rx="68" ry="12" className="observer-shadow" />
    <path d="M-57 8L-35-19Q-31-25-22-25H24Q32-25 38-17L53 7Z" className="car-roof" />
    <path d="M-26-19H-5V4H-43ZM2-19H22Q28-19 32-13L43 4H2Z" className="car-window" />
    <rect x="-66" y="3" width="132" height="34" rx="12" className="car-body" />
    <path d="M-52 12H50" className="car-highlight" />
    <circle cx="-39" cy="38" r="14" className="car-wheel"/><circle cx="39" cy="38" r="14" className="car-wheel"/>
    <circle cx="-39" cy="38" r="5" className="car-hub"/><circle cx="39" cy="38" r="5" className="car-hub"/>
    <g className="observer-tag" transform="translate(-50 65)"><rect width="100" height="29" rx="14.5"/><text x="50" y="19" textAnchor="middle">CAR FRAME</text></g>
  </g>
}

export function RelativisticElectricity() {
  const ref = useRef<HTMLElement>(null)
  const sim = useSimulation(useInView(ref), .08)
  const [riding, setRiding] = useState(false)
  // Relativistic density changes at road speeds are far too small to draw, so
  // a larger beta is used only to magnify the charge spacing in the diagram.
  const visualBeta = .75
  const data = wireInMovingFrame(visualBeta, riding ? visualBeta : 0)
  const phase = sim.progress * 240
  const electronSpacing = 68 / Math.abs(data.negativeDensity)
  const protonSpacing = 68 / data.positiveDensity
  const carX = riding ? 650 : 550 + ((phase * visualBeta) % 185)
  const row = (positive: boolean) => {
    const spacing = positive ? protonSpacing : electronSpacing
    const shift = positive ? phase * data.relativeLatticeBeta : phase * data.relativeElectronBeta
    return Array.from({ length: 25 }, (_, i) => <Charge key={i} x={-55 + i * spacing + (shift % spacing)} y={positive ? 284 : 326} positive={positive} />)
  }
  const chargeState = riding ? 'Positive charge revealed' : 'Net charge balanced'
  const explanation = riding
    ? 'The positive lattice is moving and length-contracted. More positive charge fits into every metre of wire.'
    : 'The positive lattice is at rest. The moving electrons are spaced to keep the wire electrically neutral.'
  const viewpoint = riding ? 'Car frame: electrons rest while the positive lattice contracts' : 'Field frame: positive lattice rests while electrons flow right'

  return <Scenario sectionRef={ref} id="relativistic-electricity" number="07" eyebrow="Electromagnetism" title="Electric fields & magnetism" lede="A single wire can look electrically neutral or charged, depending on how you move alongside it." accent="#67ead4"
    visual={<div className={`electricity-stage ${riding ? 'is-riding' : 'is-standing'}`}>
      <svg className="electricity-diagram" viewBox="0 0 1000 650" preserveAspectRatio="xMidYMid slice" role="img" aria-label={viewpoint}>
        <defs>
          <linearGradient id="electricity-night" x2="0" y2="1"><stop stopColor="#07182d"/><stop offset=".55" stopColor="#102b43"/><stop offset="1" stopColor="#16374a"/></linearGradient>
          <radialGradient id="electricity-aura"><stop stopColor="#65eed5" stopOpacity=".16"/><stop offset="1" stopColor="#65eed5" stopOpacity="0"/></radialGradient>
          <linearGradient id="wire-shell" x2="0" y2="1"><stop stopColor="#263f59"/><stop offset=".45" stopColor="#101e31"/><stop offset="1" stopColor="#091421"/></linearGradient>
          <linearGradient id="car-paint" x2="0" y2="1"><stop stopColor="#ffd37a"/><stop offset="1" stopColor="#e48a42"/></linearGradient>
          <pattern id="electricity-grid" width="54" height="54" patternUnits="userSpaceOnUse"><path d="M54 0H0V54" fill="none" stroke="#a4d9e5" strokeWidth="1" opacity=".075"/></pattern>
          <pattern id="road-dashes" width="118" height="8" patternUnits="userSpaceOnUse"><rect x="25" width="62" height="4" rx="2" fill="#d7f5f0" opacity=".42"/></pattern>
          <clipPath id="electricity-wire-clip"><rect x="-10" y="254" width="1020" height="102" rx="51"/></clipPath>
          <filter id="charge-glow"><feGaussianBlur stdDeviation="6" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        </defs>
        <rect width="1000" height="650" fill="url(#electricity-night)"/>
        <rect width="1000" height="650" fill="url(#electricity-grid)"/>
        <ellipse cx="485" cy="305" rx="560" ry="260" fill="url(#electricity-aura)"/>
        <g className="field-lines">{[72, 118, 164].map(radius => <ellipse key={radius} cx="500" cy="305" rx="460" ry={radius} />)}</g>
        <g className="magnetic-label" transform="translate(96 183)"><circle r="18"/><circle r="4"/><text x="29" y="5">magnetic field</text></g>
        <path d="M-40 510H1040V650H-40Z" className="electricity-ground"/>
        <path d="M-40 539H1040" stroke="url(#road-dashes)" strokeWidth="5"/>
        <g className="wire-shadow"><rect x="-18" y="269" width="1036" height="108" rx="54"/><rect x="-12" y="260" width="1024" height="102" rx="51"/></g>
        <rect x="-10" y="254" width="1020" height="102" rx="51" fill="url(#wire-shell)" stroke="#7394a9" strokeWidth="2"/>
        <path d="M15 270H985" stroke="#d9f7f3" strokeWidth="2" opacity=".22" strokeLinecap="round"/>
        <path d="M0 305H1000" stroke="#98b7c9" strokeWidth="1" opacity=".28" strokeDasharray="7 10"/>
        <g clipPath="url(#electricity-wire-clip)" filter="url(#charge-glow)">{row(true)}{row(false)}</g>
        <g className="wire-key" transform="translate(390 376)">
          <g><circle cx="0" r="6" className="key-positive"/><text x="13" y="4">positive lattice</text></g>
          <g transform="translate(132 0)"><circle cx="0" r="6" className="key-negative"/><text x="13" y="4">electrons</text></g>
        </g>
        <g className="electron-flow" transform="translate(760 326)"><path d="M0 0H110"/><path d="M102-7L112 0 102 7"/><text x="55" y="-14" textAnchor="middle">electron flow</text></g>
        <StandingObserver active={!riding}/>
        <MovingCar x={carX} active={riding}/>
        <g className="frame-readout" transform="translate(32 222)">
          <text className="readout-kicker">YOU ARE OBSERVING FROM</text>
          <text className="readout-title" y="24">{riding ? 'Inside the moving car' : 'Beside the wire'}</text>
        </g>
      </svg>
      <div className="electricity-insight">
        <span className="electricity-insight-dot" aria-hidden="true"/>
        <div><span>{chargeState}</span><strong>{explanation}</strong></div>
      </div>
    </div>}
    controls={<>
      <div className="electricity-control-intro"><span>REFERENCE FRAME</span><strong>Where are you observing from?</strong></div>
      <div className="electricity-frame-buttons" role="group" aria-label="Choose your viewpoint">
        <button aria-pressed={!riding} className={!riding ? 'selected' : ''} onClick={() => setRiding(false)}><PersonStanding aria-hidden="true"/><span><strong>Beside the wire</strong><small>Lattice at rest</small></span></button>
        <button aria-pressed={riding} className={riding ? 'selected' : ''} onClick={() => setRiding(true)}><CarFront aria-hidden="true"/><span><strong>Moving car</strong><small>Electrons at rest</small></span></button>
      </div>
      <div className={`electricity-status ${riding ? 'is-charged' : ''}`}><span>{riding ? '+' : '±'}</span><div><small>WIRE APPEARS</small><strong>{riding ? 'Positively charged' : 'Electrically neutral'}</strong></div></div>
      <div className="electricity-speed"><span>ILLUSTRATED SPEED</span><strong>20 km/h</strong><small>Car and electron flow move together</small></div>
      <Playback {...sim}/>
      <p className="electricity-scale-note">The car is a thought experiment. Real drift speeds are usually much slower, and the change in charge spacing would be microscopic, so it is greatly magnified here.</p>
    </>} />
}
