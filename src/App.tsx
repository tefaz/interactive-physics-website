import { TwinParadox } from './scenarios/TwinParadox'
import { Electromagnetic } from './scenarios/Electromagnetic'
import { Gravity } from './scenarios/Gravity'
import { BinaryStars } from './scenarios/BinaryStars'
import { BlackHole } from './scenarios/BlackHole'

export function App() {
  return <>
    <main>
      <TwinParadox/>
      <Electromagnetic/>
      <Gravity/>
      <BinaryStars/>
      <BlackHole/>
    </main>
  </>
}
