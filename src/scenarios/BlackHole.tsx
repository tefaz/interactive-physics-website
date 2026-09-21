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
  const ref=useRef<HTMLElement>(null), active=useInView(ref), sim=useSimulation(active,.05)
  const [frame,setFrame]=useState<'Earth'|'Astronaut'>('Earth')
  const rs=solarMassSchwarzschildRadius(BLACK_HOLE_MASS), R=fallRadius(START_DISTANCE,sim.progress)
  const proper=radialFallProperTime(START_DISTANCE,R,rs), coordinate=radialFallCoordinateTime(START_DISTANCE,R,rs)
  const dilation=gravitationalTimeFactor(R,rs/rs), redshift=gravitationalRedshift(R,1)
  const earthClock=Number.isFinite(coordinate) ? coordinate * gravitationalTimeFactor(EARTH_DISTANCE, 1) : Infinity
  const pulses=useMemo(()=>Array.from({length:32},(_,i)=>{
    const p=(i+1)/34, r=fallRadius(START_DISTANCE,p), emit=radialFallCoordinateTime(START_DISTANCE,r,rs), arrival=outgoingSignalArrival(emit,r,EARTH_DISTANCE,rs)
    // Earth-time intervals between emissions stretch as the astronaut nears
    // the horizon. The dots themselves retain one visual travel speed.
    const phase=(i+1)/32
    // Earth sees a dramatic widening gap between successive emissions.
    // The steep final term makes the last, reddest photons noticeably sparse.
    const visualEmit=.01+.45*phase+.5*phase**6
    return {p,r,emit,arrival,visualEmit}
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
  // The astronaut view uses a longer visual runway: start near Earth, then
  // visibly accelerate toward the horizon while the physical readout stays exact.
  const astronautScreenX=(progress:number)=>205+303*progress**1.35
  const astronautPx=astronautScreenX(sim.progress)
  const astronautX=frame==='Astronaut' ? astronautPx : px(displayedR)
  const signalSpeed=980
  const signalEmission=(pulse: typeof pulses[number])=>frame==='Earth' ? pulse.visualEmit : pulse.p
  const signalOrigin=(pulse: typeof pulses[number])=>frame==='Astronaut' ? astronautScreenX(pulse.p) : px(pulse.r)
  const signalArrival=(pulse: typeof pulses[number])=>signalEmission(pulse)+(signalOrigin(pulse)-115)/signalSpeed
  return <Scenario sectionRef={ref} id="black-hole" number="04" eyebrow="Schwarzschild black hole" title="At the event horizon" lede="Compare what the traveller feels with the messages a distant observer can receive." accent="#ff718f"
    visual={<>
      <div className="visual-topbar"><span className="status-dot red"/><strong>{R>1.05?'Falling toward the horizon':R>1?'Approaching the horizon':'Horizon crossing'}</strong><span className="not-scale">Radial distance visually compressed</span></div>
      <svg className="space-scene blackhole-scene" viewBox="0 0 860 390" role="img" aria-label="Object falling toward a black hole while light pulses travel to a distant observer">
        <defs>
          <radialGradient id="bhGlow"><stop offset=".32" stopColor="#000"/><stop offset=".62" stopColor="#020309"/><stop offset=".83" stopColor="#17101e"/><stop offset="1" stopColor="#bd557b" stopOpacity=".08"/></radialGradient>
          <linearGradient id="diskFire" x1="-160" y1="0" x2="160" y2="0" gradientUnits="userSpaceOnUse"><stop stopColor="#5c1834" stopOpacity="0"/><stop offset=".18" stopColor="#ee794e"/><stop offset=".42" stopColor="#ffe6a2"/><stop offset=".5" stopColor="#fff9db"/><stop offset=".58" stopColor="#ffe6a2"/><stop offset=".82" stopColor="#ee794e"/><stop offset="1" stopColor="#5c1834" stopOpacity="0"/></linearGradient>
          <linearGradient id="diskEdge" x1="-160" y1="0" x2="160" y2="0" gradientUnits="userSpaceOnUse"><stop stopColor="#6d1d3c" stopOpacity="0"/><stop offset=".3" stopColor="#ffae63"/><stop offset=".5" stopColor="#fff3c1"/><stop offset=".7" stopColor="#ffae63"/><stop offset="1" stopColor="#6d1d3c" stopOpacity="0"/></linearGradient>
          <filter id="diskGlow" x="-50%" y="-120%" width="200%" height="340%"><feGaussianBlur stdDeviation="7"/></filter>
        </defs>
        {Array.from({length:45},(_,i)=><circle key={i} cx={(i*79)%850} cy={(i*37)%375} r={i%9? .7:1.4} fill="#fff" opacity=".14"/>)}
        <g transform="translate(560 195)" className="gargantua-hole">
          <ellipse rx="168" ry="25" fill="none" stroke="url(#diskFire)" strokeWidth="30" opacity=".28" filter="url(#diskGlow)"/>
          <ellipse rx="171" ry="22" fill="none" stroke="url(#diskFire)" strokeWidth="15"/>
          <ellipse rx="171" ry="22" fill="none" stroke="url(#diskEdge)" strokeWidth="4"/>
          {/* Light from the far side of the disk is bent above and below the shadow. */}
          <path d="M-157 2C-115-4-110-70 0-76C110-70 115-4 157 2" fill="none" stroke="url(#diskFire)" strokeWidth="19" opacity=".68" filter="url(#diskGlow)"/>
          <path d="M-157 2C-115-4-110-70 0-76C110-70 115-4 157 2" fill="none" stroke="url(#diskFire)" strokeWidth="8"/>
          <path d="M-151-1C-108 7-99 55 0 62C99 55 108 7 151-1" fill="none" stroke="url(#diskEdge)" strokeWidth="6" opacity=".7"/>
          <circle r="83" fill="url(#bhGlow)"/>
          <circle r="50" fill="#000"/>
          <circle r="53" fill="none" stroke="#ffbf83" strokeOpacity=".2" strokeWidth="1.5"/>
          <text y="102" textAnchor="middle">black hole</text>
        </g>
        <g opacity={astronautOpacity} transform={`translate(${astronautX} 195) rotate(18)`}><rect x="-11" y="5" width="22" height="20" rx="8" fill={astronautColor} stroke="#6c9bc7" strokeWidth="2"/><path d="M-11 10l-12 7M11 10l12 7M-6 24l-4 11M6 24l4 11" fill="none" stroke={astronautColor} strokeWidth="6" strokeLinecap="round"/><rect x="-16" y="-19" width="32" height="29" rx="14" fill={astronautColor} stroke="#6c9bc7" strokeWidth="2"/><rect x="-11" y="-14" width="22" height="16" rx="8" fill="#397ca9"/><circle cx="-4" cy="-6" r="1.7" fill="#d9f7ff"/><circle cx="4" cy="-6" r="1.7" fill="#d9f7ff"/><path d="M-4 0q4 3 8 0" fill="none" stroke="#d9f7ff" strokeWidth="1.5" strokeLinecap="round"/><rect x="-17" y="8" width="5" height="13" rx="2" fill="#90b5d7"/></g><text x={astronautX} y="252" textAnchor="middle">astronaut</text><text x={astronautX} y="270" textAnchor="middle" className="black-hole-clock astronaut-clock">time · {time(proper)}</text>
        <g transform="translate(115 195)"><circle r="27" fill="#3f91e5" stroke="#9bd4ff" strokeWidth="2"/><path d="M-22-13c10-8 17 2 25 2s10-7 19-1l4 14c-11-2-14 7-23 7S-8 3-17 8s-13-7-10-14zM-14 14c8-4 12 2 18 3l-5 7-12-2z" fill="#72d39d"/><circle r="32" fill="none" stroke="#65b8ff" strokeOpacity=".25" strokeWidth="6"/><text y="52" textAnchor="middle">Earth</text><text y="70" textAnchor="middle" className="black-hole-clock earth-clock">time · {time(earthClock)}</text></g>
        <line x1="135" y1="195" x2="508" y2="195" stroke="#68708b" strokeDasharray="4 8" opacity=".35"/>
        {pulses.filter(p=>signalEmission(p)<=sim.progress).map((p,i)=>{
          const origin=signalOrigin(p)
          const travelTime=(origin-115)/signalSpeed
          const f=(sim.progress-signalEmission(p))/travelTime
          if (f <= 0 || f >= 1) return null
          const x=origin+(115-origin)*f
          const hue=Math.max(0,55-(p.r<2?(2-p.r)*45:0))
          return <g key={i} transform={`translate(${x} 195)`}><circle r="7" fill={`hsl(${hue} 95% 65%)`} opacity=".18"/><circle r="3.2" fill={`hsl(${hue} 95% 70%)`}/></g>
        })}
        {pulses.map((p,i)=>{
          const visualArrival=signalArrival(p)
          return sim.progress>=visualArrival&&sim.progress-visualArrival<.06 ? <circle key={`receipt-${i}`} cx="115" cy="195" r={34+(sim.progress-visualArrival)*170} fill="none" stroke={`hsl(${Math.max(0,55-(p.r<2?(2-p.r)*45:0))} 95% 70%)`} strokeWidth="2" opacity=".7"/> : null
        })}
      </svg>
    </>}
    controls={<>
      <Segmented value={frame} options={['Earth','Astronaut'] as const} onChange={setFrame} label="Reference frame"/>
      <Timeline {...sim} label={frame==='Earth' ? 'Journey (Earth receives delayed light)' : "Astronaut's own journey"}/>
      <div className="readout-grid"><Metric label="Astronaut distance from centre" value={formatDistance(R*rs)}/><Metric label="Newest message received from" value={latestReceived ? formatDistance(latestReceived.r*rs) : 'None yet'}/><Metric label="Local clock factor" value={`${(dilation*100).toFixed(2)}%`}/><Metric label="Gravitational redshift" value={Number.isFinite(redshift)?redshift.toFixed(2):'∞'}/></div>
    </>}/>
}
