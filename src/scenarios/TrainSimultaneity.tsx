import { useRef, useState } from 'react'
import { Scenario } from '../components/Scenario'
import { Metric, Segmented, Slider, Timeline } from '../components/Controls'
import { useInView } from '../hooks/useInView'
import { useSimulation } from '../hooks/useSimulation'
import { C } from '../physics/constants'
import { simultaneityExperiment } from '../physics/relativity'

const TRAIN_LENGTH = 300
const SCENE_CENTER = 420
const PROPER_HALF_LENGTH = 165
const LIGHT_SCALE = PROPER_HALF_LENGTH

type Frame = 'Platform' | 'Train'

function Lightning({ x, visible, label }: { x: number; visible: boolean; label: string }) {
  return <g className={`lightning ${visible ? 'is-visible' : ''}`} transform={`translate(${x} 0)`}>
    <path d="M8 52L-12 95 7 94-11 132 10 131-15 171 7 168-9 207" fill="none" stroke="#42c9ff" strokeWidth="17" strokeOpacity=".48" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M8 52L-12 95 7 94-11 132 10 131-15 171 7 168-9 207" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cy="207" r="26" fill="#58ceff" opacity=".22"/>
    <text y="46" textAnchor="middle">{label}</text>
  </g>
}

function Person({ x, y, coat, label, glow = false, scale = 1, labelY = 64 }: { x: number; y: number; coat: string; label: string; glow?: boolean; scale?: number; labelY?: number }) {
  return <g transform={`translate(${x} ${y}) scale(${scale})`}>
    {glow && <circle cy="-29" r="31" fill="#fff2a0" opacity=".2" className="observer-glow"/>}
    <circle cy="-44" r="14" fill="#f2c5a7"/>
    <path d="M-12-47q12-16 25 1v-6q-2-15-15-16-13 1-14 17z" fill="#312942"/>
    <circle cx="-4" cy="-45" r="1.5" fill="#342d43"/><circle cx="5" cy="-45" r="1.5" fill="#342d43"/>
    <path d="M-4-39q5 4 9 0" fill="none" stroke="#7d4e4a" strokeWidth="1.4" strokeLinecap="round"/>
    <path d="M-13-27q13-9 26 0l6 42h-38z" fill={coat}/>
    <path d="M-15-19l-14 28M15-19l14 28M-8 15l-4 27M8 15l4 27" stroke={coat} strokeWidth="8" strokeLinecap="round"/>
    <text y={labelY} textAnchor="middle">{label}</text>
  </g>
}

function Train({ center, halfLength }: { center: number; halfLength: number }) {
  const left = center - halfLength
  const width = halfLength * 2
  const dividerCount = halfLength < 95 ? 1 : 3
  return <g className="relativity-train">
    <rect x={left} y="207" width={width} height="108" rx="18" fill="#2469ad" stroke="#d9f0fb" strokeWidth="4"/>
    <path d={`M${left + 12} 208q15-25 40-25h${Math.max(0, width - 104)}q25 0 40 25`} fill="#1c5796" stroke="#d9f0fb" strokeWidth="3"/>
    <rect x={left + 13} y="224" width={Math.max(18, width - 26)} height="62" rx="7" fill="#f1e1c1" stroke="#123f72" strokeWidth="3"/>
    <rect x={left + 16} y="269" width={Math.max(12, width - 32)} height="14" rx="3" fill="#c7894e"/>
    {Array.from({ length: dividerCount }, (_, i) => <path key={i} d={`M${left + width * (i + 1) / (dividerCount + 1)} 225v59`} stroke="#154d8c" strokeWidth="4"/>) }
    <path d={`M${left + 9} 292H${left + width - 9}`} stroke="#0f467d" strokeWidth="14" strokeLinecap="round"/>
    <circle cx={left + Math.max(27, width * .16)} cy="316" r="14" fill="#26334a" stroke="#9fc7df" strokeWidth="5"/>
    <circle cx={left + width - Math.max(27, width * .16)} cy="316" r="14" fill="#26334a" stroke="#9fc7df" strokeWidth="5"/>
  </g>
}

function LightPulse({ x, direction }: { x: number; direction: -1 | 1 }) {
  return <g transform={`translate(${x} 238) scale(${direction} 1)`} className="light-pulse">
    <path d="M-4 0h-46" stroke="#c7f4ff" strokeWidth="4" strokeLinecap="round"/>
    <path d="M-2-14L17 0-2 14 3 3-15 0 3-3z" fill="#fff"/>
    <circle r="20" fill="#53cfff" opacity=".22"/>
  </g>
}

const within = (time: number, event: number, duration = .16) => time >= event && time <= event + duration
const received = (time: number, arrival: number) => time >= arrival
const formatNs = (seconds: number) => `${Math.round(Math.abs(seconds) * 1e9)} ns`

export function TrainSimultaneity() {
  const ref = useRef<HTMLElement>(null)
  const active = useInView(ref)
  const sim = useSimulation(active, .16)
  const [frame, setFrame] = useState<Frame>('Platform')
  const [beta, setBeta] = useState(.6)
  const data = simultaneityExperiment(beta, TRAIN_LENGTH)
  const lightTime = TRAIN_LENGTH / C

  const platformArrival = data.platformSignalArrivalSeconds / lightTime
  const trainFrontStrike = data.trainFrontStrikeSeconds / lightTime
  const trainRearStrike = data.trainRearStrikeSeconds / lightTime
  const trainFrontArrival = data.trainFrontSignalArrivalSeconds / lightTime
  const trainRearArrival = data.trainRearSignalArrivalSeconds / lightTime
  const start = frame === 'Platform' ? -.42 : trainFrontStrike - .32
  const end = frame === 'Platform' ? platformArrival + .38 : trainRearArrival + .32
  const time = start + sim.progress * (end - start)

  const platformHalf = PROPER_HALF_LENGTH / data.gamma
  const trainCenter = frame === 'Platform' ? SCENE_CENTER + beta * LIGHT_SCALE * time : SCENE_CENTER
  const halfLength = frame === 'Platform' ? platformHalf : PROPER_HALF_LENGTH
  const platformPersonX = frame === 'Platform' ? SCENE_CENTER : SCENE_CENTER - beta * LIGHT_SCALE * time
  const worldOffset = frame === 'Train' ? -beta * LIGHT_SCALE * time : 0
  const rearStrikeX = frame === 'Platform' ? SCENE_CENTER - platformHalf : SCENE_CENTER - PROPER_HALF_LENGTH
  const frontStrikeX = frame === 'Platform' ? SCENE_CENTER + platformHalf : SCENE_CENTER + PROPER_HALF_LENGTH
  const rearStrikeTime = frame === 'Platform' ? 0 : trainRearStrike
  const frontStrikeTime = frame === 'Platform' ? 0 : trainFrontStrike
  const rearArrival = frame === 'Platform' ? platformArrival : trainRearArrival
  const frontArrival = frame === 'Platform' ? platformArrival : trainFrontArrival
  const rearPulseX = rearStrikeX + Math.max(0, time - rearStrikeTime) * LIGHT_SCALE
  const frontPulseX = frontStrikeX - Math.max(0, time - frontStrikeTime) * LIGHT_SCALE
  const frontPulseVisible = time >= frontStrikeTime && time <= frontArrival
  const rearPulseVisible = time >= rearStrikeTime && time <= rearArrival
  const observerReceived = frame === 'Platform'
    ? received(time, platformArrival)
    : received(time, trainFrontArrival)

  const status = frame === 'Platform'
    ? time < 0 ? 'The train approaches the strike points'
      : time < platformArrival ? 'Both ends were struck at the same platform time'
        : 'The platform observer receives both flashes together'
    : time < trainFrontStrike ? 'Waiting in the train frame'
      : time < trainRearStrike ? 'The front has been struck; the rear has not'
        : time < trainRearArrival ? 'Both strikes happened, but at different train times'
          : 'The onboard observer has now received both flashes'

  const changeFrame = (next: Frame) => { setFrame(next); sim.reset() }
  const changeSpeed = (next: number) => { setBeta(next); sim.reset() }

  return <Scenario sectionRef={ref} id="simultaneity" number="02" eyebrow="Special relativity" title="Simultaneity of events" lede="Two lightning strikes can be simultaneous for the person on the platform and sequential for the person on the train." accent="#42b9e8"
    visual={<>
      <svg className="space-scene relativity-scene" viewBox="0 0 1000 560" preserveAspectRatio="xMidYMid slice" role="img" aria-label={`${frame} reference frame: ${status}`}>
        <defs>
          <linearGradient id="day-sky" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#49b6e5"/><stop offset="1" stopColor="#bfe4f0"/></linearGradient>
          <linearGradient id="lawn" x1="0" x2="0" y2="1"><stop stopColor="#5fae57"/><stop offset="1" stopColor="#2f7d42"/></linearGradient>
        </defs>
        <rect width="1000" height="560" fill="url(#day-sky)"/>
        <g className="platform-world" transform={`translate(${worldOffset} 0)`}>
          {Array.from({ length: 9 }, (_, i) => <g key={i} transform={`translate(${i * 220 - 260} ${70 + (i % 3) * 38})`} opacity=".78"><ellipse rx="42" ry="16" fill="#fff"/><ellipse cx="35" cy="4" rx="31" ry="13" fill="#fff"/><ellipse cx="-32" cy="6" rx="25" ry="11" fill="#fff"/></g>)}
          <rect x="-600" y="344" width="2200" height="216" fill="url(#lawn)"/>
          <path d="M-600 327H1600M-600 344H1600" stroke="#4d4b47" strokeWidth="4" opacity=".82"/>
          {Array.from({ length: 34 }, (_, i) => <path key={i} d={`M${i * 70 - 480} 322v28`} stroke="#886c4d" strokeWidth="6" opacity=".9"/>)}
          <g className="motion-streaks" opacity={frame === 'Train' ? .3 : .08}>
            <path d="M-200 390h180M45 428h120M-190 476h285M290 405h170M720 448h230" stroke="#e7fbff" strokeWidth="4" strokeLinecap="round" strokeDasharray="14 17"/>
          </g>
        </g>

        <Train center={trainCenter} halfLength={halfLength}/>
        <Person x={trainCenter} y={275} scale={.72} coat="#e96864" label="Alice" glow={frame === 'Train' && observerReceived}/>
        <Person x={platformPersonX} y={415} coat="#40adb2" label="Bob" labelY={-76} glow={frame === 'Platform' && observerReceived}/>

        <Lightning x={frontStrikeX} visible={within(time, frontStrikeTime)} label="front"/>
        <Lightning x={rearStrikeX} visible={within(time, rearStrikeTime)} label="rear"/>
        {frontPulseVisible && <LightPulse x={frontPulseX} direction={-1}/>} 
        {rearPulseVisible && <LightPulse x={rearPulseX} direction={1}/>} 

      </svg>
      <p className="visual-caption"><strong>{status}.</strong> The expanding arrows are light signals, not the lightning bolts themselves.</p>
      <div className="clock-row simultaneity-result">
        <Metric label="Bob’s frame" value="strikes together" tone="#74e6e0"/>
        <div className="clock-vs">same events</div>
        <Metric label="Alice’s frame" value={`front first by ${formatNs(data.trainStrikeGapSeconds)}`} tone="#ffd166"/>
      </div>
    </>}
    controls={<>
      <Segmented value={frame} options={['Platform', 'Train'] as const} onChange={changeFrame} label="Reference frame"/>
      <div className="preset-row"><button onClick={() => changeSpeed(.3)}>0.30c</button><button onClick={() => changeSpeed(.6)}>0.60c</button><button onClick={() => changeSpeed(.9)}>0.90c</button></div>
      <Slider label="Train speed" min={.1} max={.9} step={.01} value={beta} onChange={changeSpeed} display={`${beta.toFixed(2)}c`}/>
      <Timeline {...sim} label={`${frame} frame time`}/>
      <div className="readout-grid">
        {frame === 'Platform' ? <><Metric label="Rear strike" value="t = 0 ns"/><Metric label="Front strike" value="t = 0 ns"/></> : <><Metric label="Front strike" value={`t′ = −${formatNs(data.trainFrontStrikeSeconds)}`}/><Metric label="Rear strike" value={`t′ = +${formatNs(data.trainRearStrikeSeconds)}`}/></>}
      </div>
      <div className="simultaneity-note">
        <strong>{frame === 'Platform' ? 'Bob’s definition of now' : 'Alice’s definition of now'}</strong>
        <p>{frame === 'Platform'
          ? `The ${Math.round(data.platformLengthMeters)} m moving train is length-contracted. Equal-distance flashes reach Bob together.`
          : 'Alice is stationary at the train’s midpoint. In this frame the front strike really occurs first—it is not just a signal-delay illusion.'}</p>
      </div>
      <div className="relativity-principle">
        <strong>Why space and time both change</strong>
        <p>The speed of light is <b>c</b> for Alice and Bob. To keep that true, moving rulers, clocks, and definitions of “now” cannot all agree.</p>
        <p>{frame === 'Platform'
          ? 'Bob measures Alice’s moving train as shorter. Alice measures a different set of simultaneous events.'
          : 'Alice measures Bob’s moving platform distances as contracted. That same space-time transformation makes the front strike earlier than the rear strike.'}</p>
      </div>
    </>}/>
}
