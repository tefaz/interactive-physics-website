import { TwinParadox } from './scenarios/TwinParadox'
import { TrainSimultaneity } from './scenarios/TrainSimultaneity'
import { EquivalencePrinciple } from './scenarios/EquivalencePrinciple'
import { AndromedaJourney } from './scenarios/AndromedaJourney'
import { Gravity } from './scenarios/Gravity'
import { BlackHole } from './scenarios/BlackHole'

export function App() {
  return <>
    <main>
      <TwinParadox/>
      <EquivalencePrinciple/>
      <TrainSimultaneity/>
      <AndromedaJourney/>
      <Gravity/>
      <BlackHole/>
    </main>
  </>
}
