import { G } from './constants'

export type Vec = { x: number; y: number }
export type Body = { mass: number; position: Vec; velocity: Vec }
export type SystemState = { a: Body; b: Body }

const acceleration = (from: Vec, toward: Vec, otherMass: number): Vec => {
  const dx = toward.x - from.x, dy = toward.y - from.y
  const r2 = dx * dx + dy * dy
  const r = Math.sqrt(r2)
  const f = G * otherMass / (r2 * r)
  return { x: dx * f, y: dy * f }
}

// Velocity Verlet is symplectic and keeps bounded orbits stable far better than Euler.
export function stepVerlet(state: SystemState, dt: number): SystemState {
  const aa0 = acceleration(state.a.position, state.b.position, state.b.mass)
  const ab0 = acceleration(state.b.position, state.a.position, state.a.mass)
  const pa = { x: state.a.position.x + state.a.velocity.x * dt + aa0.x * dt * dt / 2, y: state.a.position.y + state.a.velocity.y * dt + aa0.y * dt * dt / 2 }
  const pb = { x: state.b.position.x + state.b.velocity.x * dt + ab0.x * dt * dt / 2, y: state.b.position.y + state.b.velocity.y * dt + ab0.y * dt * dt / 2 }
  const aa1 = acceleration(pa, pb, state.b.mass), ab1 = acceleration(pb, pa, state.a.mass)
  return {
    a: { ...state.a, position: pa, velocity: { x: state.a.velocity.x + (aa0.x + aa1.x) * dt / 2, y: state.a.velocity.y + (aa0.y + aa1.y) * dt / 2 } },
    b: { ...state.b, position: pb, velocity: { x: state.b.velocity.x + (ab0.x + ab1.x) * dt / 2, y: state.b.velocity.y + (ab0.y + ab1.y) * dt / 2 } },
  }
}

export const circularRelativeSpeed = (massA: number, massB: number, separation: number) => Math.sqrt(G * (massA + massB) / separation)
export const orbitalPeriod = (massA: number, massB: number, separation: number) => 2 * Math.PI * Math.sqrt(separation ** 3 / (G * (massA + massB)))
export const barycenter = (a: Body, b: Body): Vec => ({ x: (a.position.x * a.mass + b.position.x * b.mass) / (a.mass + b.mass), y: (a.position.y * a.mass + b.position.y * b.mass) / (a.mass + b.mass) })

export function circularSystem(massA: number, massB: number, separation: number, speedFactor = 1): SystemState {
  const total = massA + massB
  const ra = separation * massB / total, rb = separation * massA / total
  const relativeV = circularRelativeSpeed(massA, massB, separation) * speedFactor
  return {
    a: { mass: massA, position: { x: -ra, y: 0 }, velocity: { x: 0, y: relativeV * massB / total } },
    b: { mass: massB, position: { x: rb, y: 0 }, velocity: { x: 0, y: -relativeV * massA / total } },
  }
}
