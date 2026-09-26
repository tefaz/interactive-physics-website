import { useRef, useState } from 'react'
import { Scenario } from '../components/Scenario'
import { ObserverFigure } from '../components/ObserverFigure'
import { Metric, Segmented, Slider, Timeline } from '../components/Controls'
import { useInView } from '../hooks/useInView'
import { useSimulation } from '../hooks/useSimulation'

type Cause = 'Accelerating rocket' | 'Gravity'
type View = 'Sealed cabin' | 'Outside view'

const FALL_HEIGHT = 2
const FLOOR_Y = 510
const RELEASE_Y = 242
const BALL_RADIUS = 12
const BALL_X = 454
const DROP_PIXELS = FLOOR_Y - RELEASE_Y - BALL_RADIUS

function Cabin({ offset, ballY, rocket, progress, acceleration }: { offset: number; ballY: number; rocket: boolean; progress: number; acceleration: number }) {
  const landed = progress >= 1
  return <g data-cabin="true" transform={`translate(0 ${offset})`}>
    {rocket && <g className="eq-exhaust">
      <path d="M338 566Q346 604 360 618Q374 604 382 566" fill="#ffbd79" opacity=".5"/>
      <path d="M344 566Q353 592 360 600Q367 592 376 566" fill="#ffebbd" opacity=".8"/>
      <path d="M382 566Q390 604 404 618Q418 604 426 566" fill="#ffbd79" opacity=".5"/>
      <path d="M388 566Q397 592 404 600Q411 592 420 566" fill="#ffebbd" opacity=".8"/>
    </g>}
    <path d="M244 522V226Q244 178 292 174H468Q516 178 516 226V522Q516 548 489 548H271Q244 548 244 522Z" fill="url(#eq-hull)" stroke="#d2b394" strokeWidth="2"/>
    <path d="M256 510V226Q256 192 292 190H468Q504 192 504 226V510Z" fill="url(#eq-interior)" stroke="#917263"/>
    <path d="M269 220Q269 204 288 202H470M268 488h224" fill="none" stroke="#bb937b" opacity=".3"/>
    <path d="M273 228v245M487 228v245" stroke="#96755f" opacity=".3"/>
    {[251, 509].flatMap(x => [238, 319, 400, 489].map(y => <circle key={`${x}-${y}`} cx={x} cy={y} r="2" fill="#8c6c57"/>))}
    <g transform="translate(304 255)" className="eq-dial">
      <circle r="26" fill="#b68c66" stroke="#e6ccb0"/>
      <circle r="21" fill="#f2e6cc"/>
      {[-120, -60, 0, 60, 120].map(angle => <path key={angle} d="M0-16v-3" transform={`rotate(${angle})`} stroke="#79604c" strokeWidth="1.5"/>)}
      <path d="M0 4V-15" transform={`rotate(${acceleration / 20 * 240 - 120})`} stroke="#995a49" strokeWidth="2" strokeLinecap="round"/>
      <circle r="2.5" fill="#79604c"/>
      <text y="13" textAnchor="middle" style={{ fill: '#79604c', fontSize: 10 }}>a</text>
    </g>
    <path d="M286 297h36M286 303h36M286 309h36" stroke="#bca28e" strokeWidth="2" opacity=".4"/>
    <rect data-floor="true" x="256" y={FLOOR_Y} width="248" height="18" rx="3" fill="#9c795e"/>
    <path d={`M256 ${FLOOR_Y}H504`} stroke="#efd9b2" strokeWidth="2"/>
    <path d="M276 521h17m10 0h17m10 0h17m10 0h17m10 0h17m10 0h17m10 0h17m10 0h17" stroke="#d8b48a" strokeWidth="2" opacity=".6"/>
    <path d="M275 536h32M452 536h32" stroke="#a47f60" strokeWidth="3" strokeLinecap="round"/>
    {rocket && <><path d="M336 548v18h48v-18M380 548v18h48v-18" fill="#79604e" stroke="#c7a580"/><path d="M241 489l-27 58h30M519 489l27 58h-30" fill="#a07c5d" stroke="#d2b394"/></>}
    <ObserverFigure x={347} y={FLOOR_Y} character="researcher" scale={.96}/>
    {/* The release clamp belongs to the cabin; it recedes from the free ball in the outside rocket view. */}
    <path d="M454 191v31" stroke="#d0ae89" strokeWidth="3"/>
    <path d={progress === 0 ? 'M438 225v17l6 4M470 225v17l-6 4' : 'M438 225l-9 15M470 225l9 15'} fill="none" stroke="#e9d3b5" strokeWidth="2.5" strokeLinecap="round"/>
    {!rocket && progress > 0 && <path d={`M${BALL_X} ${RELEASE_Y}V${Math.max(RELEASE_Y, ballY - BALL_RADIUS - 5)}`} stroke="#c5b5ef" strokeDasharray="3 7" opacity=".4"/>}
    {landed && <ellipse cx={BALL_X} cy={FLOOR_Y} rx="25" ry="4" fill="#f2bd9e" opacity=".25"/>}
    <circle data-ball="true" cx={BALL_X} cy={ballY} r={BALL_RADIUS} fill="url(#eq-ball)" className="equivalence-ball"/>
    <path d={`M${BALL_X - 5} ${ballY - 6}q4-4 9-1`} fill="none" stroke="#ede5ff" strokeWidth="2" strokeLinecap="round" opacity=".8"/>
  </g>
}

export function EquivalencePrinciple() {
  const ref = useRef<HTMLElement>(null)
  const active = useInView(ref)
  const [cause, setCause] = useState<Cause>('Accelerating rocket')
  const [view, setView] = useState<View>('Sealed cabin')
  const [acceleration, setAcceleration] = useState(9.81)
  const duration = Math.sqrt(2 * FALL_HEIGHT / acceleration)
  const sim = useSimulation(active, 1 / duration)
  const time = sim.progress * duration
  const distance = Math.min(FALL_HEIGHT, .5 * acceleration * time * time)
  const gap = Math.max(0, FALL_HEIGHT - distance)
  const fallPixels = distance / FALL_HEIGHT * DROP_PIXELS
  const outside = view === 'Outside view'
  const outsideRocket = outside && cause === 'Accelerating rocket'
  const cabinOffset = outsideRocket ? -fallPixels : 0
  const ballY = RELEASE_Y + fallPixels
  const worldBallY = ballY + cabinOffset
  const worldFloorY = FLOOR_Y + cabinOffset
  // A fixed camera for the entire outside experiment keeps the freely coasting
  // ball stationary on screen and fits both the initial and final cabin positions.
  const camera = outside ? 'translate(106.4 145) scale(.72)' : 'translate(0 -30)'
  const landed = sim.progress >= 1
  const status = sim.progress === 0 ? 'Release the ball' : landed ? 'The ball meets the floor' : outsideRocket ? 'The floor accelerates toward the ball' : outside ? 'Gravity accelerates the ball downward' : 'The ball accelerates toward the floor'
  const changeCause = (next: Cause) => { setCause(next); sim.setPlaying(false) }
  const changeView = (next: View) => { setView(next); sim.setPlaying(false) }
  const changeAcceleration = (next: number) => { setAcceleration(next); sim.reset() }

  return <Scenario sectionRef={ref} id="equivalence" number="02" eyebrow="General relativity" title="Gravity or acceleration?" lede="Inside a small cabin, a gravitational field and an equally accelerating rocket produce the same local experiment." accent="#e9bd7d"
    visual={<>
      <div className="eq-background" aria-hidden="true"/>
      <svg className="space-scene equivalence-scene" viewBox="0 0 760 640" role="img" aria-label={`${view}, ${cause}: ${status}. Ball–floor gap ${gap.toFixed(2)} metres.`}>
        <defs>
          <linearGradient id="eq-hull" x2="1" y2=".2"><stop stopColor="#e2c7a2"/><stop offset=".45" stopColor="#f2e4c9"/><stop offset="1" stopColor="#b59374"/></linearGradient>
          <linearGradient id="eq-interior" x2="0" y2="1"><stop stopColor="#3a2b34"/><stop offset="1" stopColor="#60494b"/></linearGradient>
          <radialGradient id="eq-ball" cx=".3" cy=".25"><stop stopColor="#e4d9ff"/><stop offset="1" stopColor="#8773c3"/></radialGradient>
          <radialGradient id="eq-planet" cx=".5" cy="0"><stop stopColor="#6c8575"/><stop offset="1" stopColor="#28392f"/></radialGradient>
        </defs>
        <text x="380" y="40" textAnchor="middle" className="eq-frame-label">{outside ? cause === 'Gravity' ? 'OUTSIDE · CABIN AT REST' : 'OUTSIDE · ROCKET ACCELERATING' : 'INSIDE · SEALED CABIN'}</text>
        <text x="380" y="75" textAnchor="middle" className="eq-scene-status">{status}</text>
        {outside && Array.from({ length: 26 }, (_, i) => <circle key={i} cx={(i * 137 + 23) % 760} cy={110 + (i * 79 + 37) % 480} r={i % 6 ? .8 : 1.4} fill="#e5d6c2" opacity=".22"/>)}
        <g transform={camera} data-eq-camera="true">
          {outside && cause === 'Gravity' && <g>
            <circle cx="380" cy="970" r="400" fill="url(#eq-planet)"/>
            <path d="M110 570H650" stroke="#a9b49b" strokeWidth="2"/>
            <path d="M275 548v22h31M452 548v22h32" fill="none" stroke="#c6ae89" strokeWidth="3"/>
            <path d="M163 269v111m-7-9 7 10 7-10" fill="none" stroke="#ffc58a" strokeWidth="3" strokeLinecap="round"/>
            <text x="163" y="408" textAnchor="middle" className="eq-motion-label">Gravity pulls down</text>
          </g>}
          {outsideRocket && <g>
            <path d={`M190 ${RELEASE_Y}H628`} stroke="#c5b5ef" strokeDasharray="4 7" opacity=".35"/>
            <text x="225" y={RELEASE_Y - 15} textAnchor="end" className="eq-motion-label">Ball coasts</text>
            <path d="M162 463V357m-7 9 7-10 7 10" fill="none" stroke="#ffc58a" strokeWidth="3" strokeLinecap="round"/>
            <text x="162" y="491" textAnchor="middle" className="eq-motion-label">Floor moves up</text>
          </g>}
          <Cabin offset={cabinOffset} ballY={ballY} rocket={outsideRocket} progress={sim.progress} acceleration={acceleration}/>
          <g className="eq-gap-guide">
            <path d={`M549 ${worldBallY + BALL_RADIUS}h12M555 ${worldBallY + BALL_RADIUS}V${worldFloorY}M549 ${worldFloorY}h12`} fill="none" stroke="#e9bd7d" strokeWidth="1.5"/>
            <text x="573" y={(worldBallY + BALL_RADIUS + worldFloorY) / 2 + 5} className="eq-measure-text">{gap.toFixed(2)} m</text>
            {!outside && sim.progress === 0 && <text x="573" y="280" className="eq-motion-label">to the floor</text>}
          </g>
        </g>
        <g className="eq-comparison" transform="translate(380 606)">
          <rect x="-239" y="-20" width="478" height="39" rx="19"/>
          <circle cx="-208" r="4" fill="#e9bd7d"/>
          <text x="8" y="5" textAnchor="middle">{outside ? outsideRocket ? 'The free ball coasts; the cabin catches up.' : 'The cabin stays put; the free ball falls.' : 'Same acceleration. Same fall. Either cause.'}</text>
        </g>
      </svg>
    </>}
    controls={<>
      <Segmented value={cause} options={['Accelerating rocket', 'Gravity'] as const} onChange={changeCause} label="Cause"/>
      <Segmented value={view} options={['Sealed cabin', 'Outside view'] as const} onChange={changeView} label="View"/>
      <Slider label={cause === 'Gravity' ? 'Gravitational field g' : 'Rocket acceleration a'} value={acceleration} min={1} max={20} step={.01} display={`${acceleration.toFixed(2)} m/s²`} onChange={changeAcceleration}/>
      <div className="preset-row"><button onClick={() => changeAcceleration(1.62)}>Moon · 1.62</button><button onClick={() => changeAcceleration(9.81)}>Earth · 9.81</button><button onClick={() => changeAcceleration(3.71)}>Mars · 3.71</button></div>
      <Timeline {...sim} label="Release the ball"/>
      <div className="eq-playback-note">Real-time playback · 1× speed</div>
      <div className="readout-grid"><Metric label="Physical time" value={`${time.toFixed(2)} / ${duration.toFixed(2)} s`}/><Metric label="Ball–floor gap" value={`${gap.toFixed(2)} m`}/></div>
      <p className="equivalence-note">Compare the same moment; tidal effects neglected.</p>
    </>}/>
}
