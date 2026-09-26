/** Positions are in AU, masses in solar masses, and time in years. */
export type Vec2 = { x: number; y: number }
export type ThreeBody = { mass: number; position: Vec2; velocity: Vec2 }
export type ThreeBodyState = [ThreeBody, ThreeBody, ThreeBody]
export type ThreeBodyPreset = 'figureEight' | 'chaotic' | 'solarSystem'

const G = 4 * Math.PI ** 2
const SOFTENING = 0.025 // AU: keeps very close flybys finite and drawable.

export const threeBodyPresets: Record<ThreeBodyPreset, { label: string; masses: [number, number, number]; speed: number; spacing: number }> = {
  figureEight: { label: 'Figure eight', masses: [1, 1, 1], speed: 1, spacing: 1 },
  chaotic: { label: 'Unequal stars', masses: [1.4, 0.85, 0.55], speed: 0.94, spacing: 1 },
  solarSystem: { label: 'Star + planets', masses: [1, 0.001, 0.002], speed: 1, spacing: 1 },
}

const subtract = (a: Vec2, b: Vec2): Vec2 => ({ x: a.x - b.x, y: a.y - b.y })

export function centerOfMass(state: ThreeBodyState): Vec2 {
  const total = state.reduce((sum, body) => sum + body.mass, 0)
  return {
    x: state.reduce((sum, body) => sum + body.mass * body.position.x, 0) / total,
    y: state.reduce((sum, body) => sum + body.mass * body.position.y, 0) / total,
  }
}

export function initialThreeBodyState(preset: ThreeBodyPreset, masses: [number, number, number], speed: number, spacing: number): ThreeBodyState {
  let positions: [Vec2, Vec2, Vec2]
  let velocities: [Vec2, Vec2, Vec2]
  if (preset === 'solarSystem') {
    positions = [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: -1.65, y: 0 }]
    velocities = [
      { x: 0, y: 0 },
      { x: 0, y: Math.sqrt(G * (masses[0] + masses[1]) / (1 * spacing)) },
      { x: 0, y: -Math.sqrt(G * (masses[0] + masses[2]) / (1.65 * spacing)) },
    ]
  } else {
    // Equal masses and these initial conditions form the classic figure-eight solution.
    // Unequal masses or a changed speed break the symmetry and lead to close encounters.
    positions = [
      { x: -0.97000436, y: 0.24308753 },
      { x: 0.97000436, y: -0.24308753 },
      { x: 0, y: 0 },
    ]
    const velocityScale = 2 * Math.PI / Math.sqrt(spacing)
    velocities = [
      { x: 0.466203685 * velocityScale, y: 0.43236573 * velocityScale },
      { x: 0.466203685 * velocityScale, y: 0.43236573 * velocityScale },
      { x: -0.93240737 * velocityScale, y: -0.86473146 * velocityScale },
    ]
  }
  const bodies = masses.map((mass, index) => ({
    mass,
    position: { x: positions[index].x * spacing, y: positions[index].y * spacing },
    velocity: { x: velocities[index].x * speed, y: velocities[index].y * speed },
  })) as ThreeBodyState
  const center = centerOfMass(bodies)
  const total = masses.reduce((sum, mass) => sum + mass, 0)
  const drift = {
    x: bodies.reduce((sum, body) => sum + body.mass * body.velocity.x, 0) / total,
    y: bodies.reduce((sum, body) => sum + body.mass * body.velocity.y, 0) / total,
  }
  return bodies.map(body => ({ ...body, position: subtract(body.position, center), velocity: subtract(body.velocity, drift) })) as ThreeBodyState
}

export function minimumSeparation(state: ThreeBodyState): number {
  return Math.min(
    Math.hypot(state[0].position.x - state[1].position.x, state[0].position.y - state[1].position.y),
    Math.hypot(state[0].position.x - state[2].position.x, state[0].position.y - state[2].position.y),
    Math.hypot(state[1].position.x - state[2].position.x, state[1].position.y - state[2].position.y),
  )
}

function accelerations(state: ThreeBodyState): [Vec2, Vec2, Vec2] {
  const acceleration: [Vec2, Vec2, Vec2] = [{ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }]
  for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) {
    const dx = state[j].position.x - state[i].position.x
    const dy = state[j].position.y - state[i].position.y
    const r2 = dx * dx + dy * dy + SOFTENING ** 2
    const factor = G / (r2 * Math.sqrt(r2))
    acceleration[i].x += factor * state[j].mass * dx
    acceleration[i].y += factor * state[j].mass * dy
    acceleration[j].x -= factor * state[i].mass * dx
    acceleration[j].y -= factor * state[i].mass * dy
  }
  return acceleration
}

export function stepThreeBody(state: ThreeBodyState, dt: number): ThreeBodyState {
  const before = accelerations(state)
  const moved = state.map((body, index) => ({
    ...body,
    position: {
      x: body.position.x + body.velocity.x * dt + before[index].x * dt * dt / 2,
      y: body.position.y + body.velocity.y * dt + before[index].y * dt * dt / 2,
    },
  })) as ThreeBodyState
  const after = accelerations(moved)
  return moved.map((body, index) => ({
    ...body,
    velocity: {
      x: body.velocity.x + (before[index].x + after[index].x) * dt / 2,
      y: body.velocity.y + (before[index].y + after[index].y) * dt / 2,
    },
  })) as ThreeBodyState
}

/** Use shorter Verlet steps during close encounters. */
export function safeThreeBodyStep(state: ThreeBodyState, remaining: number): number {
  const separation = Math.max(minimumSeparation(state), SOFTENING)
  const largestMass = Math.max(...state.map(body => body.mass))
  const encounterStep = 0.025 * Math.sqrt(separation ** 3 / (G * largestMass))
  return Math.min(remaining, 0.002, Math.max(0.00001, encounterStep))
}
