import { PersonStanding, ScanEye } from 'lucide-react'
import { useRef, useState } from 'react'
import { Scenario } from '../components/Scenario'
import { Playback, Slider } from '../components/Controls'
import { useInView } from '../hooks/useInView'
import { useSimulation } from '../hooks/useSimulation'
import { wireInMovingFrame } from '../physics/electromagnetism'

function Charge({ x, y, positive }: { x: number; y: number; positive: boolean }) {
  return <g className={positive ? 'charge charge-positive' : 'charge charge-negative'} transform={`translate(${x} ${y})`}>
    <circle r="10" />
    <path d={positive ? 'M-3.5 0H3.5M0-3.5V3.5' : 'M-3.5 0H3.5'} />
  </g>
}

export function RelativisticElectricity() {
  const ref = useRef<HTMLElement>(null)
  const sim = useSimulation(useInView(ref), .11)
  const [riding, setRiding] = useState(false)
  const [electronBeta, setElectronBeta] = useState(.6)
  const currentOn = electronBeta > 0
  // The probe initially travels alongside the electrons. In this frame its
  // initial sideways force is entirely electric.
  const wire = wireInMovingFrame(electronBeta, riding ? electronBeta : 0)
  const strength = electronBeta ** 2 / .8 ** 2
  const probeX = riding ? 510 : 445 + 140 * sim.progress * electronBeta / .8
  const probeY = 426 + 86 * strength * sim.progress ** 2
  const pathX = (t: number) => riding ? 510 : 445 + 140 * t * electronBeta / .8
  const pathY = (t: number) => 426 + 86 * strength * t ** 2
  const trail = Array.from({ length: 21 }, (_, i) => `${i ? 'L' : 'M'}${pathX(i / 20).toFixed(1)} ${pathY(i / 20).toFixed(1)}`).join(' ')
  const chargeRow = (positive: boolean) => {
    const spacing = 70 / (positive ? wire.positiveDensity : -wire.negativeDensity)
    const velocity = positive ? wire.relativeLatticeBeta : wire.relativeElectronBeta
    const shift = ((sim.progress * 720 * velocity) % spacing + spacing) % spacing
    return Array.from({ length: 32 }, (_, i) =>
      <Charge key={i} x={-spacing + i * spacing + shift} y={positive ? 281 : 328} positive={positive} />)
  }
  const explanation = !currentOn
    ? 'No electron flow: the wire is neutral, and the probe stays on a straight path.'
    : riding
      ? 'Protons pack closer than electrons in this frame. The probe starts at rest, and the outward electric field pushes it away.'
      : 'The wire is neutral here. Its current creates a magnetic field; the moving positive probe feels a force away from the wire.'

  return <Scenario sectionRef={ref} id="relativistic-electricity" number="07" eyebrow="Electromagnetism" title="Electric fields & magnetism" lede="Follow a positive charge beside a current-carrying wire, then switch frames to see why it moves away." accent="#67ead4"
    visual={<div className={`electricity-stage ${riding ? 'is-riding' : 'is-standing'} ${currentOn ? 'has-current' : 'no-current'}`}>
      <svg className="electricity-diagram" viewBox="0 0 1000 650" preserveAspectRatio="xMidYMid slice" role="img" aria-label={`${riding ? 'Probe frame' : 'Wire frame'}. ${explanation}`}>
        <defs>
          <linearGradient id="electricity-night" x2="0" y2="1"><stop stopColor="#07182d"/><stop offset=".55" stopColor="#102b43"/><stop offset="1" stopColor="#16374a"/></linearGradient>
          <radialGradient id="electricity-aura"><stop stopColor="#65eed5" stopOpacity=".16"/><stop offset="1" stopColor="#65eed5" stopOpacity="0"/></radialGradient>
          <linearGradient id="wire-shell" x2="0" y2="1"><stop stopColor="#263f59"/><stop offset=".45" stopColor="#101e31"/><stop offset="1" stopColor="#091421"/></linearGradient>
          <pattern id="electricity-grid" width="54" height="54" patternUnits="userSpaceOnUse"><path d="M54 0H0V54" fill="none" stroke="#a4d9e5" strokeWidth="1" opacity=".075"/></pattern>
          <clipPath id="electricity-wire-clip"><rect x="-10" y="245" width="1020" height="112" rx="55"/></clipPath>
          <marker id="electricity-arrow" markerWidth="8" markerHeight="8" refX="5" refY="4" orient="auto"><path d="M1 1L6 4 1 7" fill="none" stroke="#f4fbff" strokeWidth="1.5"/></marker>
        </defs>
        <rect width="1000" height="650" fill="url(#electricity-night)"/>
        <rect width="1000" height="650" fill="url(#electricity-grid)"/>
        <ellipse cx="500" cy="305" rx="570" ry="275" fill="url(#electricity-aura)"/>
        {currentOn && (riding ? <g className="electric-field" aria-hidden="true">
          {[392, 445, 500, 555, 608].map(x => <path key={x} d={`M${x} 361V405`} markerEnd="url(#electricity-arrow)" />)}
          <text x="510" y="394" textAnchor="middle">electric field points away</text>
        </g> : <g className="magnetic-field" aria-hidden="true">
          {[355, 420, 485, 550, 615, 680].map(x => <g key={x} transform={`translate(${x} 389)`}><circle r="10"/><circle r="3"/></g>)}
          <text x="518" y="372" textAnchor="middle">magnetic field: out of screen ⊙</text>
        </g>)}
        <rect x="-20" y="254" width="1040" height="112" rx="56" className="electricity-wire-shadow"/>
        <rect x="-10" y="245" width="1020" height="112" rx="55" fill="url(#wire-shell)" stroke="#7394a9" strokeWidth="2"/>
        <path d="M15 260H985" stroke="#d9f7f3" strokeWidth="2" opacity=".22" strokeLinecap="round"/>
        <g clipPath="url(#electricity-wire-clip)">{chargeRow(true)}{chargeRow(false)}</g>
        <g className="wire-key" transform="translate(390 224)">
          <g><circle r="6" className="key-positive"/><text x="13" y="4">protons in lattice</text></g>
          <g transform="translate(151 0)"><circle r="6" className="key-negative"/><text x="13" y="4">electrons</text></g>
        </g>
        <g className="electron-flow" transform="translate(755 327)"><path d={riding ? 'M110 0H0' : 'M0 0H110'} markerEnd="url(#electricity-arrow)"/><text x="55" y="-15" textAnchor="middle">{!currentOn ? 'no flow' : riding ? 'lattice moves left' : 'electron flow'}</text></g>
        <path d="M445 426H595" className="probe-guide"/>
        <path d={trail} className="probe-trail" style={{ opacity: currentOn ? 1 : .4 }}/>
        <g className="probe" transform={`translate(${probeX} ${probeY})`}>
          <circle r="26" className="probe-halo"/>
          <circle r="17" className="probe-body"/>
          <path d="M-6 0H6M0-6V6"/>
          {currentOn && <path d="M0 30V70" className="probe-force" markerEnd="url(#electricity-arrow)"/>}
        </g>
        <text className="probe-label" x={probeX + 34} y={probeY - 11}>positive probe</text>
        <text className="probe-force-label" x={probeX + 22} y={probeY + 65}>{currentOn ? riding ? 'electric force' : 'magnetic force' : 'no force'}</text>
        <g className="frame-readout" transform="translate(32 180)">
          <text className="readout-kicker">VIEW FROM</text>
          <text className="readout-title" y="25">{riding ? 'The moving probe' : 'Beside the wire'}</text>
        </g>
      </svg>
      <div className="electricity-insight" aria-live="polite">
        <span className="electricity-insight-dot" aria-hidden="true"/>
        <div><span>{!currentOn ? 'Current off' : riding ? 'Electric view' : 'Magnetic view'}</span><strong>{explanation}</strong></div>
      </div>
    </div>}
    controls={<>
      <div className="electricity-control-intro"><span>THE EXPERIMENT</span><strong>Will the positive probe move away?</strong></div>
      <Slider label="Electron and probe speed" value={electronBeta} min={0} max={.8} step={.05} display={electronBeta === 0 ? 'Off' : `${electronBeta.toFixed(2)}c`} onChange={value => { setElectronBeta(value); sim.reset() }}/>
      <div className="electricity-frame-buttons" role="group" aria-label="Choose your viewpoint">
        <button aria-pressed={!riding} className={!riding ? 'selected' : ''} onClick={() => setRiding(false)}><PersonStanding aria-hidden="true"/><span><strong>Beside wire</strong><small>Wire at rest</small></span></button>
        <button aria-pressed={riding} className={riding ? 'selected' : ''} onClick={() => setRiding(true)}><ScanEye aria-hidden="true"/><span><strong>Ride with probe</strong><small>Initially at rest</small></span></button>
      </div>
      <div className={`electricity-status ${riding && currentOn ? 'is-charged' : ''}`}><span>{!currentOn ? '0' : riding ? '+' : '±'}</span><div><small>WIRE IN THIS FRAME</small><strong>{!currentOn ? 'Neutral · no current' : riding ? 'Positive · electric field' : 'Neutral · magnetic field'}</strong></div></div>
      <Playback {...sim}/>
      <p className="electricity-scale-note">Thought experiment: speeds are fractions of light speed. Real electron drift is usually far slower. Charge spacing and the probe’s bend are enlarged so you can see them.</p>
    </>} />
}
