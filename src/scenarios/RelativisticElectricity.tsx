import { useRef, useState } from 'react'
import { Scenario } from '../components/Scenario'
import { Playback, Slider } from '../components/Controls'
import { useInView } from '../hooks/useInView'
import { useSimulation } from '../hooks/useSimulation'
import { wireInMovingFrame } from '../physics/electromagnetism'

function Charge({ x, y, positive, gold = false }: { x: number; y: number; positive: boolean; gold?: boolean }) {
  return <g transform={`translate(${x} ${y})`}>
    <circle r="12" fill={gold ? '#ffd36b' : positive ? '#fa8698' : '#63d9ff'} stroke={gold ? '#fff0ba' : positive ? '#ffd1dc' : '#d5f8ff'} strokeWidth="2"/>
    <path d={positive ? 'M-5 0H5M0-5V5' : 'M-5 0H5'} stroke="#14233a" strokeWidth="2.5" strokeLinecap="round"/>
  </g>
}

export function RelativisticElectricity() {
  const ref = useRef<HTMLElement>(null)
  const sim = useSimulation(useInView(ref), .08)
  const [riding, setRiding] = useState(false)
  const [speed, setSpeed] = useState(.75)
  const data = wireInMovingFrame(speed, riding ? speed : 0)
  const phase = sim.progress * 280
  const probeX = riding ? 295 : 185 + phase * speed
  const arrowLength = 30 + 20 * speed * speed * data.gamma
  const status = riding ? 'More + in the same stretch' : 'Equal + and − cancel out'
  const row = (positive: boolean) => {
    const spacing = 56 / (positive ? data.positiveDensity : Math.abs(data.negativeDensity))
    const shift = phase * (positive ? data.relativeLatticeBeta : data.relativeElectronBeta)
    return Array.from({ length: 40 }, (_, i) => <Charge key={i} x={310 + (i - 20) * spacing + shift % spacing} y={positive ? 170 : 216} positive={positive}/>)
  }
  return <Scenario sectionRef={ref} id="relativistic-electricity" number="07" eyebrow="Electromagnetism" title="Same wire. Different view." lede="Electric and magnetic fields change with your viewpoint." accent="#68d8ff"
    visual={<div className="electricity-stage">
      <div className="electricity-view-label">{riding ? '🚗 Riding with the electrons' : '🚶 Standing beside the wire'}</div>
      <svg className="electricity-diagram" viewBox="0 0 620 460" role="img" aria-label={`${status}. ${riding ? 'Positive atoms move left, closer together. Electrons are still and farther apart. An electric force pushes the stationary positive test charge away.' : 'Atoms are still. Electrons move right. A magnetic force pushes a positive charge moving with the electrons away.'}`}>
        <defs>
          <clipPath id="electricity-wire-clip"><rect x="35" y="148" width="550" height="90" rx="12"/></clipPath>
          <marker id="electricity-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0L10 5 0 10Z" fill="#ffd36b"/></marker>
        </defs>
        <text x="35" y="35" className="diagram-heading">{status}</text>
        <text x="35" y="69" className="positive-label">+</text>
        <rect x="60" y="57" width={160 * data.positiveDensity} height="13" rx="6" fill="#fa8698"/>
        <text x="35" y="93" className="negative-label">−</text>
        <rect x="60" y="81" width={160 * Math.abs(data.negativeDensity)} height="13" rx="6" fill="#63d9ff"/>
        <text x="35" y="131" className="positive-label">{riding ? '← Positive atoms: closer together' : 'Positive atoms: still'}</text>
        <rect x="24" y="146" width="572" height="95" rx="18" fill="#233c57" stroke="#7e9fbe" strokeWidth="2"/>
        <path d="M35 193H585" stroke="#94b4cc" opacity=".2"/>
        <g clipPath="url(#electricity-wire-clip)">{row(true)}{row(false)}</g>
        <text x="35" y="269" className="negative-label">{riding ? 'Electrons: still, farther apart' : 'Electrons: moving →'}</text>
        <text x="35" y="291" className="diagram-small">Two rows magnify the charges inside one wire.</text>
        <text x="35" y="326" className="diagram-small">+ test charge</text>
        <g transform={`translate(${probeX} 333)`}>
          <rect x="-38" y="8" width="76" height="21" rx="8" fill="#aa8138" stroke="#ffe0a0"/>
          <circle cx="-23" cy="32" r="7" fill="#10182b" stroke="#d7dce8"/><circle cx="23" cy="32" r="7" fill="#10182b" stroke="#d7dce8"/>
          <Charge x={0} y={0} positive gold/>
          {!riding && <path d="M44 17H82" stroke="#ffd36b" strokeWidth="2" markerEnd="url(#electricity-arrow)"/>}
          <path d={`M0 47v${arrowLength}`} stroke="#ffd36b" strokeWidth="4" markerEnd="url(#electricity-arrow)"/>
        </g>
        <text x="310" y="455" textAnchor="middle" className="force-label">{riding ? 'Electric push ↓' : 'Magnetic push ↓'} Away from the wire</text>
      </svg>
      <p className="electricity-takeaway">Same outward push. A different electric–magnetic mix.</p>
    </div>}
    controls={<>
      <div className="electricity-frame-buttons" role="group" aria-label="Choose your viewpoint">
        <button aria-pressed={!riding} className={!riding ? 'selected' : ''} onClick={() => setRiding(false)}><span aria-hidden="true">🚶</span> Stand beside it</button>
        <button aria-pressed={riding} className={riding ? 'selected' : ''} onClick={() => setRiding(true)}><span aria-hidden="true">🚗</span> Ride with electrons</button>
      </div>
      <p className="electricity-prompt">Switch views. Watch the spacing.</p>
      <Playback {...sim}/>
      <Slider label="Electron speed" min={.15} max={.9} step={.01} value={speed} onChange={setSpeed} display={`${Math.round(speed * 100)}% of light speed`}/>
      <p className="electricity-scale-note">Speeds exaggerated to make relativity visible.</p>
      <details className="electricity-details">
        <summary>Why does this happen?</summary>
        <p>Electric charge is a property of matter: like charges repel; opposites attract. Moving charge is an electric current.</p>
        <p>Beside this wire, equal positive and negative charges cancel its outward electric field. Its current creates a magnetic field that pushes our moving + test charge away.</p>
        <p>Ride alongside the electrons: the positive atoms move and their spacing contracts. The electrons are at rest and their spacing is larger. More + per length means an outward electric field, which pushes our now-stationary + test charge.</p>
        <p>A magnetic field still exists in the car view, but it does not push a charge at rest. Both views predict outward deflection; force sizes need not match between frames.</p>
        <p>This shows force on a guided test charge, not a free-flight trajectory. Arrows are schematic; bars show charge per equal length. The ideal wire is infinite and neutral in its own frame; circuit surface charges and random electron motion are omitted. Real electron drift is much slower.</p>
        <a href="https://www.feynmanlectures.caltech.edu/II_13.html#Ch13-S6" target="_blank" rel="noreferrer">Explore the physics ↗</a>
      </details>
    </>}/>
}
