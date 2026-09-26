import { describe, expect, it } from 'vitest'
import { centerOfMass, initialThreeBodyState, safeThreeBodyStep, stepThreeBody } from './threeBody'

describe('three-body gravity', () => {
  it('starts in the center-of-mass frame, even with unequal masses', () => {
    const state = initialThreeBodyState('chaotic', [1.4, .85, .55], .94, 1)
    const center = centerOfMass(state)
    const momentum = state.reduce((sum, body) => ({ x: sum.x + body.mass * body.velocity.x, y: sum.y + body.mass * body.velocity.y }), { x: 0, y: 0 })
    expect(center.x).toBeCloseTo(0, 10)
    expect(center.y).toBeCloseTo(0, 10)
    expect(momentum.x).toBeCloseTo(0, 10)
    expect(momentum.y).toBeCloseTo(0, 10)
  })

  it('keeps the three-body center of mass fixed while the bodies move', () => {
    let state = initialThreeBodyState('figureEight', [1, 1, 1], 1, 1)
    for (let index = 0; index < 1000; index++) state = stepThreeBody(state, .0005)
    const center = centerOfMass(state)
    expect(center.x).toBeCloseTo(0, 6)
    expect(center.y).toBeCloseTo(0, 6)
    expect(state[0].position.x).not.toBeCloseTo(-.97000436, 1)
  })

  it('shortens its integration step for close encounters', () => {
    const state = initialThreeBodyState('figureEight', [1, 1, 1], 1, 1)
    const close = state.map(body => ({ ...body, position: { x: body.position.x * .05, y: body.position.y * .05 } })) as typeof state
    expect(safeThreeBodyStep(close, .01)).toBeLessThan(safeThreeBodyStep(state, .01))
  })
})
