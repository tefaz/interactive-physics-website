import { Eye, EyeOff } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Metric, Playback } from '../components/Controls'
import { Scenario } from '../components/Scenario'
import { useInView } from '../hooks/useInView'
import { createIllustratedSampler, DoubleSlitState, illustratedIntensity, interferenceVisible, SlitSetting } from '../physics/doubleSlit'

type Hit = { position: number; spread: number }
type Detections = { hits: Hit[]; total: number }
const LAUNCH_RATE = 80
const SCREEN_X = 620
const SLIT_OPTIONS: { value: SlitSetting; label: string }[] = [
  { value: 'both', label: 'Both open' },
  { value: 'upper', label: 'Upper only' },
  { value: 'lower', label: 'Lower only' },
]

function useDetections(settings: DoubleSlitState, active: boolean) {
  const [playing, setPlaying] = useState(false)
  const [detections, setDetections] = useState<Detections>({ hits: [], total: 0 })
  const carry = useRef(0)
  const sample = useMemo(() => createIllustratedSampler(settings), [settings])
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
      // Keep the source steady. Closing a slit blocks half the incident flux.
      carry.current += seconds * LAUNCH_RATE * (settings.slits === 'both' ? 1 : .5)
      const count = Math.min(Math.floor(carry.current), 24)
      carry.current -= count
      if (count) {
        const incoming = Array.from({ length: count }, () => ({ position: sample(), spread: Math.random() }))
        setDetections(previous => ({ hits: [...previous.hits, ...incoming].slice(-1800), total: previous.total + count }))
      }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [active, playing, sample, settings])

  return { ...detections, playing, toggle: () => setPlaying(value => !value), reset }
}

function DoubleSlitDiagram({ settings, hits, playing }: { settings: DoubleSlitState; hits: Hit[]; playing: boolean }) {
  const coherent = interferenceVisible(settings)
  const upperY = 206
  const lowerY = 394
  const upperOpen = settings.slits !== 'lower'
  const lowerOpen = settings.slits !== 'upper'
  const colour = coherent ? '#72e6f5' : '#ffd185'
  const yFor = (position: number) => 300 + position * 180
  const samples = Array.from({ length: 401 }, (_, index) => {
    const position = -1 + index / 200
    return { intensity: illustratedIntensity(position, settings), y: yFor(position) }
  })
  const highest = Math.max(...samples.map(sample => sample.intensity))
  const curveBase = 760
  const curve = samples.map(sample => ({ x: curveBase + sample.intensity / highest * 80, y: sample.y }))
  const curvePath = curve.map((point, index) => `${index ? 'L' : 'M'}${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(' ')
  const curveArea = `M${curveBase} 120 ${curvePath} L${curveBase} 480 Z`
  const waveSlits = [upperOpen && upperY, lowerOpen && lowerY].filter((value): value is number => value !== false)
  const pattern = coherent ? 'Five interference bands' : settings.slits === 'both' ? 'Two separated bands' : `${settings.slits === 'upper' ? 'Upper' : 'Lower'} half only`

  return <svg className={`double-slit-scene ${playing ? 'is-playing' : ''}`} viewBox="0 0 900 600" preserveAspectRatio="xMidYMid meet" role="img" aria-label={`Schematic double slit experiment: ${pattern.toLowerCase()}, built from individual electron detections`}>
    <defs>
      <radialGradient id="slit-background"><stop stopColor="#12344a"/><stop offset=".7" stopColor="#0a1e30"/><stop offset="1" stopColor="#071423"/></radialGradient>
      <linearGradient id="slit-curve" x1="0" x2="1"><stop stopColor={colour} stopOpacity=".03"/><stop offset="1" stopColor={colour} stopOpacity=".3"/></linearGradient>
      <clipPath id="wave-clip"><rect x="365" y="120" width={SCREEN_X - 380} height="360"/></clipPath>
      <clipPath id="slit-board-clip"><rect x={SCREEN_X + 10} y="120" width="86" height="360" rx="9"/></clipPath>
    </defs>
    <rect width="900" height="600" fill="url(#slit-background)"/>
    {Array.from({ length: 40 }, (_, index) => <circle key={index} cx={(index * 227 + 47) % 900} cy={(index * 157 + 91) % 600} r={index % 6 ? .7 : 1.2} fill="#c5e8f5" opacity=".18"/>)}
    <text x="118" y="162" textAnchor="middle" className="slit-scene-label">Electron source</text>
    <text x="354" y="100" textAnchor="middle" className="slit-scene-label">Two slits</text>
    <text x={SCREEN_X + 50} y="100" textAnchor="middle" className="slit-scene-label">Detections</text>
    <text x="800" y="100" textAnchor="middle" className="slit-scene-label">Probability</text>
    <path d="M128 300H330" stroke="#70daf0" strokeWidth="2" strokeDasharray="3 9" opacity=".35"/>
    <circle cx="118" cy="300" r="30" fill="#5be0f2" opacity=".08"/>
    <circle cx="118" cy="300" r="13" fill="#9cf4ff" opacity=".22" stroke="#91f1ff" strokeWidth="2"/>
    <circle cx="118" cy="300" r="4" fill="#d9ffff" className="slit-source-dot"/>
    <text x="118" y="346" textAnchor="middle" className="slit-small-label">80 electrons / sec</text>
    <g clipPath="url(#wave-clip)" opacity={settings.observeUpperSlit ? .22 : .48}>
      {waveSlits.flatMap((y, slitIndex) => [65, 120, 175, 230, 285].map(radius => <circle key={`${slitIndex}-${radius}`} cx="356" cy={y} r={radius} fill="none" stroke={colour} strokeWidth="1.5" strokeDasharray="5 8" opacity=".5"/>))}
    </g>
    <rect x="346" y="120" width="17" height={upperY - 131} rx="4" fill="#527a8f" stroke="#9abbd1"/>
    <rect x="346" y={upperY + 11} width="17" height={lowerY - upperY - 22} rx="4" fill="#527a8f" stroke="#9abbd1"/>
    <rect x="346" y={lowerY + 11} width="17" height={480 - lowerY - 11} rx="4" fill="#527a8f" stroke="#9abbd1"/>
    {!upperOpen && <rect data-closed-slit="upper" x="346" y={upperY - 11} width="17" height="22" fill="#36566a" stroke="#9abbd1"/>}
    {!lowerOpen && <rect data-closed-slit="lower" x="346" y={lowerY - 11} width="17" height="22" fill="#36566a" stroke="#9abbd1"/>}
    {upperOpen && <circle cx="355" cy={upperY} r="6" fill="#9ff6ff" opacity=".9"/>}
    {lowerOpen && <circle cx="355" cy={lowerY} r="6" fill="#9ff6ff" opacity=".9"/>}
    <text x="272" y={upperY + 4} className="slit-small-label">upper</text>
    <text x="272" y={lowerY + 4} className="slit-small-label">lower</text>
    {settings.observeUpperSlit && settings.slits === 'both' && <g className="slit-observer"><rect x="298" y={upperY - 42} width="112" height="25" rx="12"/><text x="311" y={upperY - 25}>path detector on</text><path d={`M352 ${upperY - 17}V${upperY - 7}`} stroke="#ffd088" strokeWidth="2"/></g>}
    <rect x={SCREEN_X + 10} y="120" width="86" height="360" rx="9" fill="#061523" stroke="#628da2" strokeOpacity=".6"/>
    <line x1={SCREEN_X} x2={SCREEN_X} y1="120" y2="480" stroke="#bbebf5" strokeWidth="5" strokeLinecap="round" opacity=".8"/>
    {!coherent && <path d={`M${SCREEN_X + 14} 300h78`} stroke="#849daa" strokeDasharray="3 5" opacity=".45"/>}
    <g clipPath="url(#slit-board-clip)" data-detector-hits="true">
      {hits.map((hit, index) => <circle key={index} data-detection="true" cx={SCREEN_X + 15 + hit.spread * 76} cy={yFor(hit.position)} r="1.7" fill={coherent ? '#b8faff' : '#ffe0a4'} opacity=".72"/>)}
      {hits.length > 0 && <circle cx={SCREEN_X + 15 + hits[hits.length - 1].spread * 76} cy={yFor(hits[hits.length - 1].position)} r="3" fill="#fff"/>}
    </g>
    <path d={`M${curveBase} 120v360`} stroke="#597b8e" opacity=".35"/>
    <path d={curveArea} fill="url(#slit-curve)"/>
    <path data-probability-curve="true" d={curvePath} fill="none" stroke={colour} strokeWidth="3" strokeLinecap="round"/>
    <text x={SCREEN_X + 53} y="513" textAnchor="middle" className="slit-small-label">one dot = one electron</text>
    <text x="800" y="513" textAnchor="middle" className="slit-small-label">where dots accumulate</text>
    <text x="800" y="545" textAnchor="middle" className="slit-pattern-label">{coherent ? '5 bands' : settings.slits === 'both' ? '2 bands' : '1 band'}</text>
  </svg>
}

export function DoubleSlit() {
  const ref = useRef<HTMLElement>(null)
  const active = useInView(ref)
  const [slits, setSlits] = useState<SlitSetting>('both')
  const [observeUpperSlit, setObserveUpperSlit] = useState(false)
  const settings = useMemo(() => ({ slits, observeUpperSlit }), [slits, observeUpperSlit])
  const sim = useDetections(settings, active)
  const coherent = interferenceVisible(settings)
  const title = coherent ? 'Five interference bands' : slits === 'both' ? 'Two bands. No interference.' : `${slits === 'upper' ? 'Upper' : 'Lower'} slit open · one band`
  const explanation = coherent
    ? 'One dot per electron. Without path information, the detections build five bright bands with dark gaps between them.'
    : slits === 'both'
      ? 'The detector reveals the path. Interference disappears, leaving two separate bands in this schematic view.'
      : `The ${slits === 'upper' ? 'lower' : 'upper'} slit is closed. Dots collect only in the ${slits} half of the screen.`

  return <Scenario sectionRef={ref} id="double-slit" number="09" eyebrow="Quantum physics" title="Double slit experiment" lede="Individual electrons build a pattern. Change the paths, or measure which slit they pass through." accent="#72e6f5"
    visual={<><DoubleSlitDiagram settings={settings} hits={sim.hits} playing={sim.playing}/><div className="double-slit-insight" aria-live="polite"><span className={`double-slit-insight-dot ${coherent ? '' : 'is-classical'}`}/><div><strong>{title}</strong><span>{explanation}</span></div></div></>}
    controls={<>
      <div className="double-slit-control-intro"><span>THE EXPERIMENT</span><strong>Same source. Different pattern.</strong></div>
      <div className="double-slit-options"><span className="control-label">Open slits</span><div>{SLIT_OPTIONS.map(option => <button key={option.value} className={slits === option.value ? 'selected' : ''} aria-pressed={slits === option.value} onClick={() => setSlits(option.value)}>{option.label}</button>)}</div></div>
      <button className={`double-slit-observe ${observeUpperSlit ? 'selected' : ''}`} disabled={slits !== 'both'} aria-pressed={observeUpperSlit} onClick={() => setObserveUpperSlit(value => !value)}>{observeUpperSlit ? <Eye size={19}/> : <EyeOff size={19}/>}<span><strong>Observe upper slit</strong><small>{slits !== 'both' ? 'One slit open: the path is already known' : observeUpperSlit ? 'Path information available' : 'No path information'}</small></span></button>
      <Playback playing={sim.playing} toggle={sim.toggle} reset={sim.reset}/>
      <div className="readout-grid"><Metric label="Detections" value={sim.total.toLocaleString()}/><Metric label="Screen pattern" value={coherent ? '5 bands' : slits === 'both' ? '2 bands' : '1 band'}/></div>
      <p className="double-slit-note">Schematic patterns: fringe spacing and single-slit band widths are exaggerated for clarity.</p>
    </>}/>
}
