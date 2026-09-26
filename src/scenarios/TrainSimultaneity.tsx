import { useRef, useState } from 'react'
import { Scenario } from '../components/Scenario'
import { ObserverFigure } from '../components/ObserverFigure'
import { Segmented, Slider, Timeline } from '../components/Controls'
import { useInView } from '../hooks/useInView'
import { useSimulation } from '../hooks/useSimulation'
import { C } from '../physics/constants'
import { simultaneityExperiment } from '../physics/relativity'

const TRAIN_LENGTH = 300
const CENTER = 380
const HALF_LENGTH = 160
// Time is measured in L/c: light travels one full train length per unit.
const LIGHT_SCALE = HALF_LENGTH * 2
const SOURCE_Y = 238
const BOB_Y = 350
const BOB_OFFSET_METERS = (BOB_Y - SOURCE_Y) / LIGHT_SCALE * TRAIN_LENGTH
const REAR = '#80e4ee'
const FRONT = '#ffc785'
type Frame = 'Platform' | 'Train'
const ns = (time: number) => `${Math.round(time * 1e9)} ns`

function Strike({ x, colour, elapsed }: { x: number; colour: string; elapsed: number }) {
  if (elapsed < 0) return null
  const flash = Math.max(0, 1 - elapsed / .18)
  return <g transform={`translate(${x} 0)`}>
    <path d="M9 119L-9 153 7 153-8 185 5 185 0 219" fill="none" stroke={colour} strokeWidth="3" strokeLinejoin="round" opacity={flash}/>
    <circle cy={SOURCE_Y} r="4" fill={colour} opacity={.4 + flash * .6}/>
  </g>
}

function Wavefront({ origin, elapsed, colour }: { origin: number; elapsed: number; colour: string }) {
  if (elapsed < 0) return null
  const radius = elapsed * LIGHT_SCALE
  // A planar slice of an expanding spherical flash. Its centre stays at the
  // emission event in the selected frame, even when the source moves away.
  return <g className="sim-light-wave">
    <circle data-wavefront={colour === REAR ? 'rear' : 'front'} cx={origin} cy={SOURCE_Y} r={radius} fill="none" stroke={colour} strokeWidth="2"/>
    <circle cx={origin} cy={SOURCE_Y} r={Math.max(0, radius - 4)} fill="none" stroke={colour} strokeWidth="5" opacity=".12"/>
  </g>
}

function Reception({ x, y, front, rear, badgeOffset, observer }: { x: number; y: number; front: boolean; rear: boolean; badgeOffset: number; observer: 'Alice' | 'Bob' }) {
  return <g transform={`translate(${x} ${y})`} data-observer={observer} data-front-received={front} data-rear-received={rear}>
    {(front || rear) && <circle r="13" fill={rear && front ? '#d8f2f5' : front ? FRONT : REAR} opacity=".17"/>}
    <circle r="3" fill={front || rear ? '#f4fcff' : '#182d40'} stroke="#c0dce8" strokeWidth="1"/>
    <g transform={`translate(0 ${badgeOffset})`}>
    {[{ colour: REAR, seen: rear, x: -9 }, { colour: FRONT, seen: front, x: 9 }].map(dot => <g key={dot.colour}>
      {dot.seen && <circle cx={dot.x} r="10" fill={dot.colour} opacity=".14"/>}
      <circle cx={dot.x} r="4" fill={dot.seen ? dot.colour : '#152738'} stroke={dot.colour} strokeOpacity={dot.seen ? 1 : .4}/>
    </g>)}
    </g>
  </g>
}

export function TrainSimultaneity() {
  const ref = useRef<HTMLElement>(null)
  const active = useInView(ref)
  const sim = useSimulation(active, .125)
  const [frame, setFrame] = useState<Frame>('Platform')
  const [beta, setBeta] = useState(.6)
  const data = simultaneityExperiment(beta, TRAIN_LENGTH, BOB_OFFSET_METERS)
  const lightTime = TRAIN_LENGTH / C
  const onboard = frame === 'Train'
  const rearStrike = onboard ? data.trainRearStrikeSeconds / lightTime : 0
  const frontStrike = onboard ? data.trainFrontStrikeSeconds / lightTime : 0
  const rearArrival = onboard ? data.trainRearSignalArrivalSeconds / lightTime : data.platformSignalArrivalSeconds / lightTime
  const frontArrival = onboard ? data.trainFrontSignalArrivalSeconds / lightTime : rearArrival
  const start = frontStrike - .25
  const bobArrival = (onboard ? data.trainPlatformSignalArrivalSeconds : data.platformSignalArrivalSeconds) / lightTime
  const platformHalfLightTime = data.platformLengthMeters / (2 * C) / lightTime
  const aliceFrontArrival = onboard ? frontArrival : platformHalfLightTime / (1 + beta)
  const aliceRearArrival = onboard ? rearArrival : platformHalfLightTime / (1 - beta)
  const end = Math.max(aliceRearArrival, bobArrival) + .24
  const time = start + sim.progress * (end - start)
  const half = onboard ? HALF_LENGTH : HALF_LENGTH / data.gamma
  const trainX = onboard ? CENTER : CENTER + beta * LIGHT_SCALE * time
  const bobX = onboard ? CENTER - beta * LIGHT_SCALE * time : CENTER
  const rearX = CENTER - half
  const frontX = CENTER + half
  // Fit the entire journey once per setup. Extending the platform timeline
  // must not carry Alice off-screen before the rear flash catches her.
  const trainStartX = onboard ? CENTER : CENTER + beta * LIGHT_SCALE * start
  const trainEndX = onboard ? CENTER : CENTER + beta * LIGHT_SCALE * end
  const bobEndX = onboard ? CENTER - beta * LIGHT_SCALE * end : CENTER
  const bobStartX = onboard ? CENTER - beta * LIGHT_SCALE * start : CENTER
  const left = Math.min(rearX - 60, trainStartX - half - 24, bobEndX - 90)
  const right = Math.max(frontX + 60, trainEndX + half + 24, bobStartX + 90)
  const sceneScale = Math.min(1, 680 / (right - left))
  const sceneCenter = Math.min(Math.max(CENTER, right - 340 / sceneScale), left + 340 / sceneScale)
  const sceneTransform = `translate(${CENTER} ${SOURCE_Y}) scale(${sceneScale}) translate(${-sceneCenter} ${-SOURCE_Y})`
  const phase = time < frontStrike ? 0 : time < rearStrike ? 1 : time < frontArrival ? 2 : time < rearArrival ? 3 : 4
  const status = phase === 0 ? 'Two events. Whose “now”?' : onboard
    ? beta === 0 && phase === 4 ? 'Alice sees both flashes together' : phase === 1 ? time >= frontArrival ? 'Alice sees front. Rear not struck yet.' : 'Front strikes first' : phase === 2 ? 'Each flash spreads outward at c' : phase === 3 ? 'Alice sees the front flash first' : 'Alice has seen both flashes'
    : time < frontStrike ? 'Two events. Whose “now”?' : time < platformHalfLightTime ? 'Two strikes. Light spreading outward.' : time < bobArrival ? 'Waves cross; Bob is still waiting' : time < aliceRearArrival ? 'Bob sees both together; Alice waits' : 'Both observers have seen both flashes'
  const eventProgress = (event: number) => (event - start) / (end - start)
  const changeFrame = (next: Frame) => { setFrame(next); sim.reset() }
  const changeSpeed = (next: number) => { setBeta(next); sim.reset() }
  const seek = (event: number) => { sim.setPlaying(false); sim.setProgress(eventProgress(event + 1e-8)) }

  return <Scenario sectionRef={ref} id="simultaneity" number="02" eyebrow="Special relativity" title="Simultaneity of events" lede="The same two strikes. A different meaning of “at the same time.”" accent={REAR}
    visual={<>
      <div className="sim-night" aria-hidden="true"/>
      <svg className="space-scene simultaneity-scene" viewBox="0 0 760 500" role="img" aria-label={`${frame} reference frame: ${status}`}>
        <defs>
          <linearGradient id="sim-hull" x2="0" y2="1"><stop stopColor="#7599ae"/><stop offset="1" stopColor="#2e5069"/></linearGradient>
          <linearGradient id="sim-window" x2="0" y2="1"><stop stopColor="#192d40"/><stop offset="1" stopColor="#0c1929"/></linearGradient>
          <clipPath id="sim-wave-area"><rect x="0" y="95" width="760" height="395"/></clipPath>
        </defs>
        <text x={CENTER} y="44" textAnchor="middle" className="sim-frame-label">{onboard ? 'ALICE’S FRAME · TRAIN AT REST' : 'BOB’S FRAME · PLATFORM AT REST'}</text>
        <text x={CENTER} y="78" textAnchor="middle" className="sim-scene-status">{status}</text>
        <g clipPath="url(#sim-wave-area)">
        <g transform={sceneTransform} data-scene-camera="true">
        <g opacity=".28" transform={`translate(${onboard ? -beta * LIGHT_SCALE * time : 0} 0)`}>
          <path d="M-400 316H1200M-400 326H1200" stroke="#7998ad"/>
          {Array.from({ length: 45 }, (_, i) => <path key={i} d={`M${i * 40 - 450} 317l-8 8`} stroke="#7998ad" strokeWidth="3"/>)}
          <path d="M-400 425H1200" stroke="#557a94"/>
          {Array.from({ length: 17 }, (_, i) => <path key={i} d={`M${i * 100 - 450} 426v12`} stroke="#557a94"/>)}
        </g>
        <g transform={`translate(${trainX} 0)`} className="sim-train">
          <path d={`M${-half} 283V216Q${-half} 195 ${-half + 24} 195H${half - 24}Q${half} 195 ${half} 216V283Z`} fill="url(#sim-hull)" stroke="#b4d2de" strokeWidth="1.5"/>
          <rect x={-half + 9} y="207" width={half * 2 - 18} height="63" rx="12" fill="url(#sim-window)" stroke="#9bbacb" strokeOpacity=".6"/>
          <path d={`M${-half + 4} 285H${half - 4}`} stroke="#a9d3da" strokeWidth="3"/>
          <rect x={-half + 6} y="290" width={half * 2 - 12} height="10" rx="5" fill="#1b3044"/>
          {[-1, 1].map(side => <g key={side} transform={`translate(${side * (half - 20)} 305)`}><circle r="10" fill="#0c1826" stroke="#7a9bad" strokeWidth="2"/><circle r="3" fill="#98b3c2"/></g>)}
          <text y="169" textAnchor="middle" className="sim-observer-label">Alice{onboard ? ' · at rest' : ''}</text>
          <text y="188" textAnchor="middle" className="sim-reception-label">{time >= aliceRearArrival ? 'Both flashes seen' : time >= aliceFrontArrival ? 'Front flash seen' : 'Waiting for light'}</text>
          {!onboard && <path d={`M${-half + 14} 141H${half - 14}m-9-5 9 5-9 5`} fill="none" stroke={FRONT} opacity=".6"/>}
        </g>
        <Wavefront origin={rearX} elapsed={time - rearStrike} colour={REAR}/>
        <Wavefront origin={frontX} elapsed={time - frontStrike} colour={FRONT}/>
        <ObserverFigure x={trainX} y={SOURCE_Y + 160 * .3} scale={.3} character="alice"/>
        <Reception x={trainX} y={SOURCE_Y} badgeOffset={41} observer="Alice" rear={time >= aliceRearArrival} front={time >= aliceFrontArrival}/>
        <ObserverFigure x={bobX} y={412} scale={.39} character="bob"/>
        <Reception x={bobX} y={BOB_Y} badgeOffset={69} observer="Bob" rear={time >= bobArrival} front={time >= bobArrival}/>
        <text x={bobX} y="455" textAnchor="middle" className="sim-observer-label">Bob{!onboard ? ' · at rest' : ''}</text>
        <text x={bobX} y="474" textAnchor="middle" className="sim-reception-label">{time >= bobArrival ? 'Both flashes seen' : 'Waiting for light'}</text>
        {onboard && <path d={`M${bobX + 30} 373h35m-8-5-8 5 8 5`} fill="none" stroke={REAR} opacity=".6"/>}
        <text x={rearX} y="112" textAnchor="middle" className="sim-end-label" style={{ fill: REAR }}>REAR</text>
        <text x={frontX} y="112" textAnchor="middle" className="sim-end-label" style={{ fill: FRONT }}>FRONT</text>
        <Strike x={rearX} colour={REAR} elapsed={time - rearStrike}/>
        <Strike x={frontX} colour={FRONT} elapsed={time - frontStrike}/>
        </g>
        </g>
      </svg>
    </>}
    controls={<>
      <Segmented value={frame} options={['Platform', 'Train'] as const} onChange={changeFrame} label="Ride with"/>
      <Slider label="Train speed" min={0} max={.9} step={.01} value={beta} onChange={changeSpeed} display={`${beta.toFixed(2)}c`}/>
      <div className="sim-event-record" aria-label="Strike times in the selected reference frame">
        <span className="control-label">When the lightning strikes</span>
        <div className="sim-strike-times">
          <div style={{ '--event-colour': REAR } as React.CSSProperties} data-struck={time >= rearStrike}><span>Rear</span><strong>{time >= rearStrike ? ns(onboard ? data.trainRearStrikeSeconds : 0) : 'Waiting'}</strong></div>
          <div style={{ '--event-colour': FRONT } as React.CSSProperties} data-struck={time >= frontStrike}><span>Front</span><strong>{time >= frontStrike ? ns(onboard ? data.trainFrontStrikeSeconds : 0) : 'Waiting'}</strong></div>
        </div>
        <div className="sim-event-track" aria-label="Strike event timeline">
          <i className="sim-time-cursor" style={{ left: `${sim.progress * 100}%` }}/>
          <button style={{ left: `${eventProgress(rearStrike) * 100}%`, color: REAR }} onClick={() => seek(rearStrike)} aria-label="Jump to rear strike"><span>R</span></button>
          <button style={{ left: `${eventProgress(frontStrike) * 100}%`, color: FRONT }} onClick={() => seek(frontStrike)} aria-label="Jump to front strike"><span>F</span></button>
        </div>
        <p className="sim-event-verdict">{time < rearStrike ? 'Watch the two event markers.' : !onboard || beta === 0 ? 'Same time' : `Front first · ${ns(data.trainStrikeGapSeconds)} apart`}</p>
      </div>
      <Timeline {...sim} label="Experiment timeline"/>
      <div className="sim-chapters" aria-label="Animation chapters">
        <button onClick={() => seek(frontStrike)}>Strikes</button>
        <button onClick={() => seek((rearStrike + rearArrival) / 2)}>Light spreads</button>
        <button onClick={() => seek(onboard ? aliceRearArrival : bobArrival)}>{onboard ? 'Alice sees both' : 'Bob sees both'}</button>
      </div>
      <p className="sim-hint">Light spreads at c. The rings pass through each other; each flash is seen when its ring reaches an eye.</p>
    </>}/>
}
