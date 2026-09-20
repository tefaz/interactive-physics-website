import { useMemo, useRef, useState } from 'react'
import { Scenario } from '../components/Scenario'
import { Metric, Segmented, Timeline } from '../components/Controls'
import { useInView } from '../hooks/useInView'
import { useSimulation } from '../hooks/useSimulation'
import { fallRadius, gravitationalRedshift, gravitationalTimeFactor, outgoingSignalArrival, radialFallCoordinateTime, radialFallProperTime, solarMassSchwarzschildRadius } from '../physics/blackHole'
import { formatDistance } from '../utils/format'

const time = (seconds: number) => !Number.isFinite(seconds) ? '∞' : seconds < .001 ? `${(seconds*1e6).toFixed(1)} μs` : seconds < 1 ? `${(seconds*1e3).toFixed(1)} ms` : seconds < 120 ? `${seconds.toFixed(1)} s` : `${(seconds/60).toFixed(1)} min`
const BLACK_HOLE_MASS = 4_000_000
const START_DISTANCE = 8
const EARTH_DISTANCE = 25

export function BlackHole() {
  const ref=useRef<HTMLElement>(null), active=useInView(ref), sim=useSimulation(active,.035)
  const [frame,setFrame]=useState<'Earth'|'Astronaut'>('Earth')
  const rs=solarMassSchwarzschildRadius(BLACK_HOLE_MASS), R=fallRadius(START_DISTANCE,sim.progress)
  const proper=radialFallProperTime(START_DISTANCE,R,rs), coordinate=radialFallCoordinateTime(START_DISTANCE,R,rs)
  const dilation=gravitationalTimeFactor(R,rs/rs), redshift=gravitationalRedshift(R,1)
  const earthClock=Number.isFinite(coordinate) ? coordinate * gravitationalTimeFactor(EARTH_DISTANCE, 1) : Infinity
  const pulses=useMemo(()=>Array.from({length:32},(_,i)=>{
    const p=(i+1)/34, r=fallRadius(START_DISTANCE,p), emit=radialFallCoordinateTime(START_DISTANCE,r,rs), arrival=outgoingSignalArrival(emit,r,EARTH_DISTANCE,rs)
    // A visual reception timeline: increasingly delayed arrivals make the
    // redshift visible without compressing late pulses into a final rush.
    const visualArrival=p+.12+1.8*p**3
    return {p,r,emit,arrival,visualArrival}
  }),[rs])
  const currentT=Number.isFinite(coordinate)?coordinate:radialFallCoordinateTime(START_DISTANCE,1+1e-9,rs)
  const latestReceived=[...pulses].reverse().find(p=>p.arrival<=currentT)
  // The Earth view deliberately compresses the ever-increasing signal delay:
  // it approaches, but does not show, a horizon crossing.
  const earthViewR=1+(START_DISTANCE-1)*Math.exp(-5*sim.progress)
  const displayedR=frame==='Earth' ? earthViewR : R
  const earthImageOpacity=Math.max(.08, Math.min(1, (earthViewR-1)/(START_DISTANCE-1)*1.5))
  const astronautOpacity=frame==='Earth' ? earthImageOpacity : 1
  const astronautColor=frame==='Earth' && earthImageOpacity<.45 ? '#ff887f' : '#d9ecff'
  const px=(r:number)=>145+(EARTH_DISTANCE-r)/(EARTH_DISTANCE-1)*363
  return <Scenario sectionRef={ref} id="black-hole" number="05" eyebrow="Schwarzschild black hole" title="At the event horizon" lede="Compare what the traveller feels with the messages a distant observer can receive." accent="#ff718f"
    visual={<>
      <div className="visual-topbar"><span className="status-dot red"/><strong>{R>1.05?'Falling toward the horizon':R>1?'Approaching the horizon':'Horizon crossing'}</strong><span className="not-scale">Radial distance visually compressed</span></div>
      <svg className="space-scene blackhole-scene" viewBox="0 0 860 390" role="img" aria-label="Object falling toward a black hole while light pulses travel to a distant observer">
        <defs><radialGradient id="bhGlow"><stop offset=".4" stopColor="#03040a"/><stop offset=".7" stopColor="#101121"/><stop offset="1" stopColor="#bd557b" stopOpacity=".1"/></radialGradient></defs>
        {Array.from({length:45},(_,i)=><circle key={i} cx={(i*79)%850} cy={(i*37)%375} r={i%9? .7:1.4} fill="#fff" opacity=".14"/>)}
        <g transform="translate(560 195)"><circle r="83" fill="url(#bhGlow)"/><circle r="49" fill="#000"/><circle r="52" fill="none" stroke="#ff718f" strokeWidth="2" strokeDasharray="4 5"/><text y="76" textAnchor="middle">black hole</text></g>
        <g opacity={astronautOpacity} transform={`translate(${px(displayedR)} 195) rotate(18)`}><rect x="-11" y="5" width="22" height="20" rx="8" fill={astronautColor} stroke="#6c9bc7" strokeWidth="2"/><path d="M-11 10l-12 7M11 10l12 7M-6 24l-4 11M6 24l4 11" fill="none" stroke={astronautColor} strokeWidth="6" strokeLinecap="round"/><rect x="-16" y="-19" width="32" height="29" rx="14" fill={astronautColor} stroke="#6c9bc7" strokeWidth="2"/><rect x="-11" y="-14" width="22" height="16" rx="8" fill="#397ca9"/><circle cx="-4" cy="-6" r="1.7" fill="#d9f7ff"/><circle cx="4" cy="-6" r="1.7" fill="#d9f7ff"/><path d="M-4 0q4 3 8 0" fill="none" stroke="#d9f7ff" strokeWidth="1.5" strokeLinecap="round"/><rect x="-17" y="8" width="5" height="13" rx="2" fill="#90b5d7"/></g><text x={px(displayedR)} y="252" textAnchor="middle">astronaut</text>
        <g transform="translate(115 195)"><circle r="27" fill="#3f91e5" stroke="#9bd4ff" strokeWidth="2"/><path d="M-22-13c10-8 17 2 25 2s10-7 19-1l4 14c-11-2-14 7-23 7S-8 3-17 8s-13-7-10-14zM-14 14c8-4 12 2 18 3l-5 7-12-2z" fill="#72d39d"/><circle r="32" fill="none" stroke="#65b8ff" strokeOpacity=".25" strokeWidth="6"/><text y="52" textAnchor="middle">Earth</text></g>
        <line x1="135" y1="195" x2="508" y2="195" stroke="#68708b" strokeDasharray="4 8" opacity=".35"/>
        {frame==='Earth' && pulses.filter(p=>p.p<=sim.progress).map((p,i)=>{
          const f=(sim.progress-p.p)/(p.visualArrival-p.p)
          if (f <= 0 || f >= 1) return null
          const x=px(p.r)+(115-px(p.r))*f
          const hue=Math.max(0,55-(p.r<2?(2-p.r)*45:0))
          return <g key={i} transform={`translate(${x} 195)`}><circle r="7" fill={`hsl(${hue} 95% 65%)`} opacity=".18"/><circle r="3.2" fill={`hsl(${hue} 95% 70%)`}/></g>
        })}
        {frame==='Earth' && pulses.filter(p=>sim.progress>=p.visualArrival&&sim.progress-p.visualArrival<.06).map((p,i)=><circle key={`receipt-${i}`} cx="115" cy="195" r={34+(sim.progress-p.visualArrival)*170} fill="none" stroke={`hsl(${Math.max(0,55-(p.r<2?(2-p.r)*45:0))} 95% 70%)`} strokeWidth="2" opacity=".7"/>) }
      </svg>
      <div className="black-hole-summary">
        <p>{frame==='Earth' ? <><strong>Earth view:</strong> this is the delayed image Earth receives. It slows toward the horizon; message dots arrive farther apart, redden, and fade.</> : <><strong>Astronaut view:</strong> this follows the astronaut’s own clock. They speed up toward the horizon and reach it in finite time; there is no local “freeze.”</>}</p>
        <div className="clock-row"><Metric label="Earth's clock" value={time(earthClock)} tone="#ff8ba3"/><div className="clock-vs">vs</div><Metric label="Astronaut's own clock" value={time(proper)} tone="#65ddff"/></div>
      </div>
    </>}
    controls={<>
      <Segmented value={frame} options={['Earth','Astronaut'] as const} onChange={setFrame} label="Viewpoint"/>
      <Timeline {...sim} label={frame==='Earth' ? 'Journey (Earth receives delayed light)' : "Astronaut's own journey"}/>
      <div className="readout-grid"><Metric label="Astronaut distance from centre" value={formatDistance(R*rs)}/><Metric label="Newest message received from" value={latestReceived ? formatDistance(latestReceived.r*rs) : 'None yet'}/><Metric label="Local clock factor" value={`${(dilation*100).toFixed(2)}%`}/><Metric label="Gravitational redshift" value={Number.isFinite(redshift)?redshift.toFixed(2):'∞'}/></div>
    </>}/>
}
