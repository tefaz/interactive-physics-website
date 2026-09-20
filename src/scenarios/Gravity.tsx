import { useRef, useState } from 'react'
import { Scenario } from '../components/Scenario'
import { Maths, Metric, Slider, Timeline } from '../components/Controls'
import { useInView } from '../hooks/useInView'
import { useSimulation } from '../hooks/useSimulation'
import { AU, G, SOLAR_MASS } from '../physics/constants'
import { circularRelativeSpeed, orbitalPeriod } from '../physics/orbits'
import { formatPeriod, formatVelocity } from '../utils/format'
import { OrbitalDiagram, useOrbit } from './OrbitalDiagram'

export function Gravity() {
  const ref = useRef<HTMLElement>(null), active = useInView(ref), sim = useSimulation(active, .12)
  const [separationAu, setSeparationAu] = useState(1), [speedFactor, setSpeedFactor] = useState(1)
  const massA = SOLAR_MASS, massB = 3.003e-6 * SOLAR_MASS, separation = separationAu * AU
  const period = orbitalPeriod(massA, massB, separation), speed = circularRelativeSpeed(massA, massB, separation) * speedFactor
  const result = useOrbit(massA, massB, separation, speedFactor, sim.progress, period)
  const currentDistance = Math.hypot(result.state.a.position.x-result.state.b.position.x, result.state.a.position.y-result.state.b.position.y)
  const currentSpeed = Math.hypot(result.state.a.velocity.x-result.state.b.velocity.x, result.state.a.velocity.y-result.state.b.velocity.y)
  const localEscapeSpeed = Math.sqrt(2*G*(massA+massB)/currentDistance)
  const escaping = speedFactor > Math.SQRT2
  const preset = (s:number,v:number) => { setSeparationAu(s); setSpeedFactor(v); sim.reset() }
  return <Scenario sectionRef={ref} id="gravity" number="03" eyebrow="Newtonian gravity" title="Build an orbit" lede="Gravity bends motion into an orbit. Change the initial speed and watch a circle become an ellipse—or an escape." accent="#66dfbe"
    visual={<><div className="visual-topbar"><span className="status-dot green"/><strong>{speedFactor < .72 ? 'Falling / collision course' : speedFactor < .97 ? 'Elliptical orbit' : speedFactor < 1.04 ? 'Near-circular orbit' : speedFactor < 1.42 ? 'Wide elliptical orbit' : 'Escape trajectory'}</strong><span className="not-scale">Body sizes exaggerated</span></div><OrbitalDiagram result={result} separation={separation} massA={massA} massB={massB} showForce={false} showBarycenter={false} labelA="Sun" labelB="Planet"/>{escaping && <div className="escape-note"><strong>Escaping:</strong> gravity slows the planet, but its speed remains above the local escape speed. Far distance is visually compressed.</div>}<div className="legend"><span className="velocity-key">→ planet velocity</span><span className="trail-key">— path</span></div></>}
    controls={<>
      <div className="preset-row"><button onClick={()=>preset(1,1)}>Circle</button><button onClick={()=>preset(1,.76)}>Ellipse</button><button onClick={()=>preset(1,1.48)}>Escape</button></div>
      <Slider label="Distance from Sun" min={.3} max={5} step={.05} value={separationAu} onChange={v=>{setSeparationAu(v);sim.reset()}} display={`${separationAu.toFixed(2)} AU`}/>
      <Slider label="Sideways speed" min={.4} max={1.65} step={.01} value={speedFactor} onChange={v=>{setSpeedFactor(v);sim.reset()}} display={`${speedFactor.toFixed(2)} × circular`}/>
      <Timeline {...sim} label="One circular-reference period"/>
      <div className="readout-grid"><Metric label="Current speed" value={formatVelocity(currentSpeed)}/><Metric label="Local escape speed" value={formatVelocity(localEscapeSpeed)}/><Metric label="Integrator" value="Velocity Verlet"/><Metric label="Elapsed model time" value={formatPeriod(period*sim.progress)}/></div>
      <Maths><p>F = Gm₁m₂ / r²</p><p>For a circular orbit: v = √[G(m₁ + m₂) / r] = <b>{formatVelocity(circularRelativeSpeed(massA,massB,separation))}</b></p><p>T = 2π√[r³ / G(m₁ + m₂)] = <b>{formatPeriod(period)}</b></p><small>Motion is integrated with velocity Verlet. The model is Newtonian, treats bodies as points for gravity, and omits relativistic and tidal effects.</small></Maths>
    </>}/>
}
