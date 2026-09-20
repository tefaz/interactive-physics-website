import { useRef, useState } from 'react'
import { Scenario } from '../components/Scenario'
import { Maths, Metric, Slider, Timeline } from '../components/Controls'
import { useInView } from '../hooks/useInView'
import { useSimulation } from '../hooks/useSimulation'
import { AU, SOLAR_MASS } from '../physics/constants'
import { orbitalPeriod } from '../physics/orbits'
import { formatPeriod } from '../utils/format'
import { OrbitalDiagram, useOrbit } from './OrbitalDiagram'

export function BinaryStars() {
  const ref = useRef<HTMLElement>(null), active = useInView(ref), sim = useSimulation(active, .045)
  const [massA, setMassA] = useState(2), [massB, setMassB] = useState(.8), [separationAu, setSeparationAu] = useState(2)
  const a = massA*SOLAR_MASS, b=massB*SOLAR_MASS, separation=separationAu*AU, period=orbitalPeriod(a,b,separation)
  const result=useOrbit(a,b,separation,1,sim.progress,period)
  const aRadius = separationAu * massB/(massA+massB), bRadius=separationAu * massA/(massA+massB)
  return <Scenario sectionRef={ref} id="binary-stars" number="04" eyebrow="Binary stars" title="Both stars have to move." lede="A binary is not one star circling a fixed partner. Both trace paths around their shared balance point." accent="#ffb763"
    visual={<><div className="visual-topbar"><span className="status-dot amber"/><strong>Common-center orbit</strong><span className="not-scale">Star sizes exaggerated</span></div><OrbitalDiagram result={result} separation={separation} massA={a} massB={b} showForce={false} starMode labelA="Star A" labelB="Star B"/><div className="orbit-balance"><span>Star A orbit radius <b>{aRadius.toFixed(2)} AU</b></span><span>Star B orbit radius <b>{bRadius.toFixed(2)} AU</b></span></div></>}
    controls={<>
      <div className="preset-row"><button onClick={()=>{setMassA(1);setMassB(1);sim.reset()}}>Equal twins</button><button onClick={()=>{setMassA(8);setMassB(.3);sim.reset()}}>Extreme ratio</button><button onClick={()=>{setMassA(2);setMassB(.8);sim.reset()}}>Sun-like pair</button></div>
      <Slider label="Star A mass" min={.2} max={10} step={.1} value={massA} onChange={v=>{setMassA(v);sim.reset()}} display={`${massA.toFixed(1)} M☉`}/>
      <Slider label="Star B mass" min={.2} max={10} step={.1} value={massB} onChange={v=>{setMassB(v);sim.reset()}} display={`${massB.toFixed(1)} M☉`}/>
      <Slider label="Separation" min={.3} max={10} step={.1} value={separationAu} onChange={v=>{setSeparationAu(v);sim.reset()}} display={`${separationAu.toFixed(1)} AU`}/>
      <Timeline {...sim} label="Orbital timeline"/>
      <div className="readout-grid"><Metric label="Barycenter from A" value={`${aRadius.toFixed(2)} AU`}/><Metric label="Barycenter from B" value={`${bRadius.toFixed(2)} AU`}/><Metric label="Circular period" value={formatPeriod(period)}/><Metric label="Mass ratio A : B" value={`${(massA/massB).toFixed(2)} : 1`}/></div>
      <Maths><p>Distance from A to barycenter:</p><p>rₐ = r × mᵦ / (mₐ + mᵦ) = {separationAu.toFixed(1)} × {massB.toFixed(1)} / {(massA+massB).toFixed(1)} = <b>{aRadius.toFixed(3)} AU</b></p><p>The same two-body velocity-Verlet engine powers this scene and the gravity lab above.</p></Maths>
    </>}/>
}
