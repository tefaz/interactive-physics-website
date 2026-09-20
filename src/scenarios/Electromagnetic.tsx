import { useId, useRef, useState } from 'react'
import { Scenario } from '../components/Scenario'
import { Maths, Metric, Slider, Timeline } from '../components/Controls'
import { useInView } from '../hooks/useInView'
import { useSimulation } from '../hooks/useSimulation'
import { fromWavelength, spectrumName, spectrumPresets } from '../physics/electromagnetism'
import { C, H } from '../physics/constants'
import { formatEnergy, formatFrequency, formatWavelength } from '../utils/format'

const presetEntries = Object.entries(spectrumPresets)

export function Electromagnetic() {
  const ref = useRef<HTMLElement>(null), active = useInView(ref), sim = useSimulation(active, .11)
  const [logWavelength, setLogWavelength] = useState(Math.log10(550e-9))
  const radiation = fromWavelength(10 ** logWavelength)
  const phase = sim.progress * Math.PI * 8
  const gradientId = useId().replace(/:/g, '')
  const points = (amp: number, offset: number, skew = 0) => Array.from({ length: 121 }, (_, i) => {
    const x = 70 + i * 5.8
    const cycles = Math.max(1.3, Math.min(6, 2.3 - (logWavelength + 6.3) * .32))
    const y = offset + Math.sin(i / 120 * Math.PI * 2 * cycles - phase) * amp
    return `${x},${y + skew * Math.sin(i / 120 * Math.PI * 2 * cycles - phase)}`
  }).join(' ')

  return <Scenario sectionRef={ref} id="electromagnetic" number="02" eyebrow="Light & radiation" title="Stretch the wave. Change its energy." lede="One slider changes the whole story: shorter waves oscillate faster and carry more energy per photon." accent="#bb82ff"
    visual={<>
      <div className="visual-topbar"><span className="status-dot violet"/><strong>{spectrumName(radiation.wavelength)}</strong><span className="not-scale">Schematic field amplitudes</span></div>
      <svg className="space-scene em-scene" viewBox="0 0 860 380" role="img" aria-label="A light wave travelling to the right">
        <defs><linearGradient id={gradientId}><stop stopColor="#ff74d4"/><stop offset="1" stopColor="#8c78ff"/></linearGradient><marker id="arrow-em" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0l10 5-10 5z" fill="#e9efff"/></marker></defs>
        <line x1="68" y1="195" x2="800" y2="195" stroke="#77809d" strokeWidth="1.5" markerEnd="url(#arrow-em)"/>
        {Array.from({length: 12}, (_, i) => <line key={i} x1={100+i*58} y1="89" x2={100+i*58} y2="302" stroke="#fff" opacity=".035"/>)}
        <polyline points={points(92, 195)} fill="none" stroke={`url(#${gradientId})`} strokeWidth="6" strokeLinecap="round"/>
        <text x="665" y="171">light travels this way</text>
        <g className="photon-packet" transform={`translate(${80 + sim.progress * 670} 195)`}><circle r="18" fill="#ffe88a" opacity=".18"/><circle r="10" fill="#fff1a8"/><circle cx="-3" cy="-2" r="1.3" fill="#44381f"/><circle cx="3" cy="-2" r="1.3" fill="#44381f"/><path d="M-3 3q3 3 6 0" fill="none" stroke="#44381f" strokeWidth="1.3" strokeLinecap="round"/></g>
      </svg>
      <div className="spectrum-bar"><div className="spectrum-labels"><span>Radio</span><span>Microwave</span><span>IR</span><span>Visible</span><span>UV</span><span>X-ray</span><span>Gamma</span></div><div className="rainbow-track"><i style={{ left: `${(1 - (logWavelength + 12) / 13) * 100}%` }}/></div></div>
      <p className="visual-caption"><strong>Shorter wave → faster oscillation → more photon energy.</strong> The curve shows a field changing, not the path of a photon.</p>
    </>}
    controls={<>
      <div className="preset-row">{presetEntries.map(([name, wavelength]) => <button key={name} className={spectrumName(wavelength).toLowerCase().startsWith(name.replace('-', ' ')) ? '' : ''} onClick={() => setLogWavelength(Math.log10(wavelength))}>{name}</button>)}</div>
      <Slider label="Wavelength λ" min={-12} max={1} step={.01} value={logWavelength} onChange={setLogWavelength} display={formatWavelength(radiation.wavelength)}/>
      <Timeline {...sim} label="Animation phase"/>
      <div className="readout-grid"><Metric label="Frequency" value={formatFrequency(radiation.frequency)}/><Metric label="Energy per photon" value={formatEnergy(radiation.energy)}/></div>
      <Maths><p>f = c / λ = <b>{radiation.frequency.toExponential(3)} Hz</b></p><p>E = hf = <b>{radiation.energy.toExponential(3)} J</b></p><small>The bright dot marks the moving wave packet. It does not travel along the wavy line.</small></Maths>
    </>}/>
}
