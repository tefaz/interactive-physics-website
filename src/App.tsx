import { TwinParadox } from './scenarios/TwinParadox'
import { TrainSimultaneity } from './scenarios/TrainSimultaneity'
import { EquivalencePrinciple } from './scenarios/EquivalencePrinciple'
import { AndromedaJourney } from './scenarios/AndromedaJourney'
import { Gravity } from './scenarios/Gravity'
import { BlackHole } from './scenarios/BlackHole'
import { RelativisticElectricity } from './scenarios/RelativisticElectricity'

export function App() {
  return <>
    <main>
      <TwinParadox/>
      <EquivalencePrinciple/>
      <TrainSimultaneity/>
      <AndromedaJourney/>
      <Gravity/>
      <BlackHole/>
      <RelativisticElectricity/>
    </main>
  </>
}
