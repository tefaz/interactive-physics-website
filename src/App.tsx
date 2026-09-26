import { TwinParadox } from './scenarios/TwinParadox'
import { TrainSimultaneity } from './scenarios/TrainSimultaneity'
import { EquivalencePrinciple } from './scenarios/EquivalencePrinciple'
import { AndromedaJourney } from './scenarios/AndromedaJourney'
import { Gravity } from './scenarios/Gravity'
import { ThreeBody } from './scenarios/ThreeBody'
import { BlackHole } from './scenarios/BlackHole'
import { RelativisticElectricity } from './scenarios/RelativisticElectricity'
import { DoubleSlit } from './scenarios/DoubleSlit'

export function App() {
  return <>
    <main>
      <TwinParadox/>
      <EquivalencePrinciple/>
      <TrainSimultaneity/>
      <AndromedaJourney/>
      <Gravity/>
      <ThreeBody/>
      <BlackHole/>
      <RelativisticElectricity/>
      <DoubleSlit/>
    </main>
  </>
}
