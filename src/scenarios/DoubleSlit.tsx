import { Eye, EyeOff } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Metric, Playback, Slider } from '../components/Controls'
import { Scenario } from '../components/Scenario'
import { useInView } from '../hooks/useInView'
import { detectionIntensity, DoubleSlitSettings, interferenceVisible, sampleDetection, SlitSetting } from '../physics/doubleSlit'

type Hit = { position: number; spread: number }
type Detections = { hits: Hit[]; total: number }

const SLIT_OPTIONS: { value: SlitSetting; label: string }[] = [
  { value: 'both', label: 'Both open' },
  { value: 'upper', label: 'Upper only' },
  { value: 'lower', label: 'Lower only' },
]

function useDetections(settings: DoubleSlitSettings, rate: number, active: boolean) {
  const [playing, setPlaying] = useState(false)
  const [detections, setDetections] = useState<Detections>({ hits: [], total: 0 })
  const carry = useRef(0)

  const reset = useCallback(() => {
    setDetections({ hits: [], total: 0 })
    carry.current = 0
    setPlaying(false)
  }, [])

  useEffect(() => {
    setDetections({ hits: [], total: 0 })
    carry.current = 0
  }, [settings])
  useEffect(() => { if (!active) setPlaying(false) }, [active])

  useEffect(() => {
    if (!active || !playing) return
    let frame = 0
    let last = 0
    const tick = (now: number) => {
      const seconds = last ? Math.min((now - last) / 1000, .1) : 0
      last = now
      // A centered source illuminates both openings equally; closing one blocks half.
      carry.current += seconds * rate * (settings.slits === 'both' ? 1 : .5)
      const count = Math.min(Math.floor(carry.current), 24)
      carry.current -= count
      if (count) {
        const incoming = Array.from({ length: count }, () => ({ position: sampleDetection(settings), spread: Math.random() }))
        setDetections(previous => ({ hits: [...previous.hits, ...incoming].slice(-1400), total: previous.total + count }))
      }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [active, playing, rate, settings])

  return { ...detections, playing, toggle: () => setPlaying(value => !value), reset }
}

function DoubleSlitDiagram({ settings, hits }: { settings: DoubleSlitSettings; hits: Hit[] }) {
  const coherent = interferenceVisible(settings)
  const nearScreen = settings.screenDistance < .65
  const screenX = 470 + (settings.screenDistance - .2) / 1.8 * 238
  // The nearby detector image lines up with each opening on the same y scale.
  const upperY = 300 - settings.separation * 90
  const lowerY = 300 + settings.separation * 90
  const upperOpen = settings.slits !== 'lower'
  const lowerOpen = settings.slits !== 'upper'
  const yFor = (position: number) => 300 + position * 180
  const samples = Array.from({ length: 161 }, (_, index) => {
    const position = -1 + index / 80
    return { intensity: detectionIntensity(position, settings), y: yFor(position) }
  })
  const highest = Math.max(...samples.map(sample => sample.intensity))
  const curveBase = screenX - 86
  const curve = samples.map(sample => ({ x: curveBase + sample.intensity / highest * 73, y: sample.y }))
  const curvePath = curve.map((point, index) => `${index ? 'L' : 'M'}${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(' ')
  const curveArea = `M${curveBase} 120 ${curvePath} L${curveBase} 480 Z`
  const waveSlits = [upperOpen && upperY, lowerOpen && lowerY].filter((value): value is number => value !== false)

  return <svg className="double-slit-scene" viewBox="0 0 900 600" preserveAspectRatio="xMidYMid meet" role="img" aria-label={`${nearScreen ? 'Separate slit images on a nearby screen' : coherent ? 'Interference fringes on a distant screen' : 'Overlapping slit patterns without interference on a distant screen'} build from individual electron detections`}>
    <defs>
      <radialGradient id="slit-background"><stop stopColor="#12344a"/><stop offset=".7" stopColor="#0a1e30"/><stop offset="1" stopColor="#071423"/></radialGradient>
      <linearGradient id="slit-curve" x1="0" x2="1"><stop stopColor="#5ee2f2" stopOpacity=".04"/><stop offset="1" stopColor="#5ee2f2" stopOpacity=".25"/></linearGradient>
      <clipPath id="wave-clip"><rect x="365" y="102" width={screenX - 380} height="396"/></clipPath>
    </defs>
    <rect width="900" height="600" fill="url(#slit-background)"/>
    {Array.from({ length: 40 }, (_, index) => <circle key={index} cx={(index * 227 + 47) % 900} cy={(index * 157 + 91) % 600} r={index % 6 ? .7 : 1.2} fill="#c5e8f5" opacity=".25"/>)}
    <text x="83" y="162" className="slit-scene-label">Electron source</text>
    <text x="318" y="162" className="slit-scene-label">Barrier</text>
    <text x={screenX - 32} y="102" className="slit-scene-label">Detector screen</text>
    <path d="M128 300H346" stroke="#70daf0" strokeWidth="2" strokeDasharray="3 9" opacity=".55"/>
    <circle cx="118" cy="300" r="30" fill="#5be0f2" opacity=".08"/>
    <circle cx="118" cy="300" r="13" fill="#9cf4ff" opacity=".22" stroke="#91f1ff" strokeWidth="2"/>
    <circle cx="118" cy="300" r="4" fill="#d9ffff"/>
    <g clipPath="url(#wave-clip)" opacity={settings.observeUpperSlit ? .25 : .58}>
      {waveSlits.flatMap((y, slitIndex) => [75, 145, 215, 285, 355].map(radius => <circle key={`${slitIndex}-${radius}`} cx="356" cy={y} r={radius} fill="none" stroke={coherent ? '#70deed' : '#f2c87f'} strokeWidth="1.5" strokeDasharray="5 8" opacity=".55"/>))}
    </g>
    <rect x="346" y="112" width="17" height={upperY - 123} rx="4" fill="#527a8f" stroke="#9abbd1" strokeWidth="1"/>
    <rect x="346" y={upperY + 11} width="17" height={lowerY - upperY - 22} rx="4" fill="#527a8f" stroke="#9abbd1" strokeWidth="1"/>
    <rect x="346" y={lowerY + 11} width="17" height={489 - lowerY} rx="4" fill="#527a8f" stroke="#9abbd1" strokeWidth="1"/>
    {!upperOpen && <rect x="346" y={upperY - 11} width="17" height="22" fill="#527a8f" stroke="#9abbd1"/>}
    {!lowerOpen && <rect x="346" y={lowerY - 11} width="17" height="22" fill="#527a8f" stroke="#9abbd1"/>}
    {upperOpen && <circle cx="355" cy={upperY} r="6" fill="#9ff6ff" opacity=".9"/>}
    {lowerOpen && <circle cx="355" cy={lowerY} r="6" fill="#9ff6ff" opacity=".9"/>}
    <text x="268" y={upperY + 4} className="slit-small-label">upper slit</text>
    <text x="268" y={lowerY + 4} className="slit-small-label">lower slit</text>
    {settings.observeUpperSlit && <g className="slit-observer"><rect x="298" y={upperY - 39} width="104" height="25" rx="12"/><text x="310" y={upperY - 22}>path detector</text><path d={`M352 ${upperY - 14}V${upperY - 7}`} stroke="#ffd088" strokeWidth="2"/></g>}
    <path d={curveArea} fill="url(#slit-curve)"/>
    <path d={curvePath} fill="none" stroke={coherent ? '#64dfee' : '#ffd082'} strokeWidth="3" strokeLinecap="round"/>
    <line x1={screenX} x2={screenX} y1="111" y2="489" stroke="#bbebf5" strokeWidth="7" strokeLinecap="round" opacity=".85"/>
    <line x1={screenX + 5} x2={screenX + 5} y1="111" y2="489" stroke="#6ce6f4" strokeWidth="2" opacity=".8"/>
    {hits.map((hit, index) => <circle key={index} cx={screenX + 10 + hit.spread * 52} cy={yFor(hit.position)} r="2.3" fill={coherent ? '#b8faff' : '#ffe0a4'} opacity=".73"/>)}
    <text x={curveBase - 8} y="513" className="slit-small-label">probability</text>
    <text x={screenX + 8} y="513" className="slit-small-label">hits</text>
    <line x1="366" x2={screenX - 5} y1="545" y2="545" stroke="#93b8c5" strokeWidth="1" opacity=".55"/>
    <text x={(screenX + 366) / 2 - 28} y="564" className="slit-small-label">screen distance</text>
  </svg>
}

export function DoubleSlit() {
  const ref = useRef<HTMLElement>(null)
  const active = useInView(ref)
  const [slits, setSlits] = useState<SlitSetting>('both')
  const [observeUpperSlit, setObserveUpperSlit] = useState(false)
  const [wavelength, setWavelength] = useState(.42)
  const [separation, setSeparation] = useState(1.3)
  const [screenDistance, setScreenDistance] = useState(2)
  const [rate, setRate] = useState(80)
  const settings = useMemo(() => ({ slits, observeUpperSlit, wavelength, separation, screenDistance }), [slits, observeUpperSlit, wavelength, separation, screenDistance])
  const sim = useDetections(settings, rate, active)
  const coherent = interferenceVisible(settings)
  const near = screenDistance < .65
  const far = screenDistance >= 1.35
  const title = near
    ? slits === 'both' ? 'Nearby screen: two separate bands' : `${slits === 'upper' ? 'Upper' : 'Lower'} slit: one nearby band`
    : !far
      ? coherent ? 'The two bands begin to overlap' : 'The bands spread without fringes'
      : coherent ? 'Interference builds up' : slits === 'both' ? 'Path known: fringes disappear' : 'One slit: a broad diffraction band'
  const explanation = near
    ? slits === 'both'
      ? 'Close to the barrier, each slit makes a separate band. The waves have not spread enough to overlap strongly.'
      : `Only the ${slits} slit is open, so detections cluster on that side of the nearby screen.`
    : !far
      ? coherent ? 'As the waves from the two slits spread into the same region, interference starts to appear.' : 'The two spreading bands overlap, but path information removes their interference.'
      : coherent
        ? 'Each electron arrives as one dot. Two indistinguishable paths produce bright and dark fringes.'
        : slits === 'both'
          ? 'A detector reveals which slit each electron used. Both paths spread across the distant screen without fringes.'
          : 'A single slit still diffracts electrons across the distant screen; it does not make a narrow image of the opening.'

  return <Scenario sectionRef={ref} id="double-slit" number="09" eyebrow="Quantum physics" title="One electron at a time" lede="Watch individual detections build the double-slit pattern, then remove a path or find out which slit an electron used." accent="#72e6f5"
    visual={<><DoubleSlitDiagram settings={settings} hits={sim.hits}/><div className="double-slit-insight" aria-live="polite"><span className={`double-slit-insight-dot ${coherent ? '' : 'is-classical'}`}/><div><strong>{title}</strong><span>{explanation}</span></div></div></>}
    controls={<>
      <div className="double-slit-control-intro"><span>THE EXPERIMENT</span><strong>Change what can be known</strong></div>
      <div className="double-slit-options"><span className="control-label">Open slits</span><div>{SLIT_OPTIONS.map(option => <button key={option.value} className={slits === option.value ? 'selected' : ''} aria-pressed={slits === option.value} onClick={() => setSlits(option.value)}>{option.label}</button>)}</div></div>
      <button className={`double-slit-observe ${observeUpperSlit ? 'selected' : ''}`} aria-pressed={observeUpperSlit} onClick={() => setObserveUpperSlit(value => !value)}>{observeUpperSlit ? <Eye size={19}/> : <EyeOff size={19}/>}<span><strong>Observe upper slit</strong><small>{observeUpperSlit ? 'Path information available' : 'No path information'}</small></span></button>
      <Slider label="Electron wavelength" min={.25} max={.65} step={.01} value={wavelength} display={`${wavelength.toFixed(2)} units`} onChange={setWavelength}/>
      <Slider label="Slit separation" min={.8} max={1.6} step={.01} value={separation} display={`${separation.toFixed(2)} units`} onChange={setSeparation}/>
      <Slider label="Screen distance" min={.2} max={2} step={.05} value={screenDistance} display={near ? 'Near' : far ? 'Far' : 'Between'} onChange={setScreenDistance}/>
      <Slider label="Electron launch rate" min={10} max={180} step={10} value={rate} display={`${rate} / sec`} onChange={setRate}/>
      <Playback playing={sim.playing} toggle={sim.toggle} reset={sim.reset}/>
      <div className="readout-grid"><Metric label="Detections" value={sim.total.toLocaleString()}/><Metric label="Screen pattern" value={near ? slits === 'both' ? 'Two bands' : `${slits} band` : far && coherent ? 'Fringes' : 'Spreading bands'}/></div>
      <p className="double-slit-note">Move the screen closer to see separate slit images, or farther away to see their waves spread and overlap. The curve predicts where a transmitted electron lands; each dot is one detection. Closing a slit blocks about half the electrons. Observing a slit means obtaining path information. Dimensions are illustrative.</p>
    </>}/>
}
