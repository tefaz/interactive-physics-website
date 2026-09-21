import { useRef, useState } from 'react'
import { Scenario } from '../components/Scenario'
import { Maths, Metric, Playback, Slider } from '../components/Controls'
import { useInView } from '../hooks/useInView'
import { AU, G, SOLAR_MASS } from '../physics/constants'
import { circularRelativeSpeed, orbitalPeriod } from '../physics/orbits'
import { formatPeriod, formatVelocity } from '../utils/format'
import { OrbitalDiagram, useContinuousOrbit } from './OrbitalDiagram'

const EARTH_MASS_IN_SUNS = 3.003e-6

const companionMassLabel = (solarMasses: number) => {
  if (solarMasses >= .08) return `${solarMasses.toFixed(solarMasses >= 1 ? 1 : 2)} M☉`
  const earthMasses = solarMasses / EARTH_MASS_IN_SUNS
  return earthMasses >= 10 ? `${Math.round(earthMasses)} M⊕` : `${earthMasses.toFixed(1)} M⊕`
}

export function Gravity() {
  const ref = useRef<HTMLElement>(null), active = useInView(ref)
  const [logCompanionMass, setLogCompanionMass] = useState(Math.log10(EARTH_MASS_IN_SUNS))
  const [speedFactor, setSpeedFactor] = useState(1)
  const separationAu = 1
  const primarySolarMasses = 1
  const companionSolarMasses = 10 ** logCompanionMass
  const massA = primarySolarMasses * SOLAR_MASS, massB = companionSolarMasses * SOLAR_MASS, separation = separationAu * AU
  const period = orbitalPeriod(massA, massB, separation)
  const escaping = speedFactor > Math.SQRT2
  const sim = useContinuousOrbit(massA, massB, separation, speedFactor, period, active)
  const result = sim.result
  const currentDistance = Math.hypot(result.state.a.position.x-result.state.b.position.x, result.state.a.position.y-result.state.b.position.y)
  const currentSpeed = Math.hypot(result.state.a.velocity.x-result.state.b.velocity.x, result.state.a.velocity.y-result.state.b.velocity.y)
  const localEscapeSpeed = Math.sqrt(2*G*(massA+massB)/currentDistance)
  const initialCircularSpeed = circularRelativeSpeed(massA, massB, separation)
  const asymptoticSpeed = escaping ? initialCircularSpeed * Math.sqrt(speedFactor ** 2 - 2) : 0
  const primaryRadius = separationAu * companionSolarMasses / (primarySolarMasses + companionSolarMasses)
  const companionRadius = separationAu * primarySolarMasses / (primarySolarMasses + companionSolarMasses)
  const companionName = companionSolarMasses >= .08 ? 'Companion star' : 'Planet'
  const orbitType = speedFactor < .72 ? 'Collision course' : speedFactor < .97 ? 'Elliptical orbit' : speedFactor < 1.04 ? 'Circular orbit' : speedFactor < Math.SQRT2 ? 'Wide elliptical orbit' : 'Escape trajectory'
  const preset = (mass: number, velocity: number) => { setLogCompanionMass(Math.log10(mass)); setSpeedFactor(velocity) }
  return <Scenario sectionRef={ref} id="gravity" number="03" eyebrow="Newtonian gravity" title="Gravity is a two-body dance" lede="Change the mass ratio and sideways speed. A planet makes its star wobble, twin stars share the motion, and enough speed pulls the pair apart." accent="#66dfbe"
    visual={<><div className="visual-topbar"><span className="status-dot green"/><strong>{orbitType}</strong><span className="not-scale">Body sizes exaggerated</span></div><OrbitalDiagram result={result} separation={separation} massA={massA} massB={massB} showForce showBarycenter starMode={companionSolarMasses >= .08} labelA="Primary" labelB={companionName}/>{escaping && <div className="escape-note"><strong>Escaping, not constant-speed:</strong> the pair really slows while climbing out of gravity, but never turns back. Far away it retains <strong>{formatVelocity(asymptoticSpeed)}</strong>.</div>}<div className="orbit-balance"><span>Primary path radius <b>{primaryRadius < .001 ? '<0.001' : primaryRadius.toFixed(2)} AU</b></span><span>{companionName} path radius <b>{companionRadius.toFixed(2)} AU</b></span></div></>}
    controls={<>
      <div className="preset-row"><button onClick={()=>preset(EARTH_MASS_IN_SUNS,1)}>Planet + star</button><button onClick={()=>preset(1,1)}>Twin stars</button><button onClick={()=>preset(.2,.72)}>Eccentric pair</button><button onClick={()=>preset(.5,1.48)}>Escape</button></div>
      <Slider label="Companion mass" min={-6} max={1} step={.01} value={logCompanionMass} onChange={setLogCompanionMass} display={companionMassLabel(companionSolarMasses)}/>
      <Slider label="Initial sideways speed" min={.4} max={1.65} step={.01} value={speedFactor} onChange={setSpeedFactor} display={`${speedFactor.toFixed(2)} × circular`}/>
      <Playback playing={sim.playing} toggle={sim.toggle} reset={sim.reset}/>
      <div className="readout-grid"><Metric label="Current relative speed" value={formatVelocity(currentSpeed)}/><Metric label="Local escape speed" value={formatVelocity(localEscapeSpeed)}/><Metric label="Circular period" value={formatPeriod(period)}/><Metric label="Orbit type" value={orbitType}/></div>
      <div className="gravity-note"><strong>One rule, two lessons</strong><p>Sideways speed sets the shape of the path. Mass ratio sets where the balance point lies—and therefore how much each body must move.</p></div>
      <Maths><p>F = Gm₁m₂ / r²</p><p>For a circular orbit: v = √[G(m₁ + m₂) / r] = <b>{formatVelocity(circularRelativeSpeed(massA,massB,separation))}</b></p><p>T = 2π√[r³ / G(m₁ + m₂)] = <b>{formatPeriod(period)}</b></p><small>Both bodies are integrated with velocity Verlet around their conserved center of mass.</small></Maths>
    </>}/>
}
