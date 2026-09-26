import { describe, expect, it } from 'vitest'
import { detectionIntensity, interferenceVisible, sampleDetection, type DoubleSlitSettings } from './doubleSlit'

const both: DoubleSlitSettings = { slits: 'both', observeUpperSlit: false, wavelength: .42, separation: 1.3, screenDistance: 2 }

describe('double-slit distribution', () => {
  it('has far-screen fringes when both paths are indistinguishable', () => {
    expect(interferenceVisible(both)).toBe(true)
    expect(detectionIntensity(0, both)).toBeGreaterThan(detectionIntensity(.33, both) * 10)
  })

  it('removes far-screen fringes when a path detector is on', () => {
    const observed = { ...both, observeUpperSlit: true }
    expect(interferenceVisible(observed)).toBe(false)
    expect(detectionIntensity(.33, observed)).toBeGreaterThan(detectionIntensity(.33, both) * 10)
  })

  it('places near-screen hits on the side of the open slit', () => {
    const near = { ...both, screenDistance: .2 }
    const upperOnly = { ...near, slits: 'upper' as const }
    const lowerOnly = { ...near, slits: 'lower' as const }
    expect(detectionIntensity(-.65, upperOnly)).toBeGreaterThan(detectionIntensity(.65, upperOnly) * 100)
    expect(detectionIntensity(.65, lowerOnly)).toBeGreaterThan(detectionIntensity(-.65, lowerOnly) * 100)
  })

  it('shows two separated near-screen bands when both slits are observed', () => {
    const observed = { ...both, screenDistance: .2, observeUpperSlit: true }
    expect(detectionIntensity(-.65, observed)).toBeGreaterThan(detectionIntensity(0, observed) * 100)
    expect(detectionIntensity(.65, observed)).toBeGreaterThan(detectionIntensity(0, observed) * 100)
    const positions = Array.from({ length: 100 }, (_, index) => sampleDetection(observed, () => (index + .5) / 100))
    expect(positions.filter(position => position < -.3).length).toBeGreaterThan(40)
    expect(positions.filter(position => position > .3).length).toBeGreaterThan(40)
    expect(positions.filter(position => Math.abs(position) < .2).length).toBe(0)
  })

  it('spreads a single-slit distribution across the far screen', () => {
    const upperOnly = { ...both, slits: 'upper' as const }
    expect(detectionIntensity(0, upperOnly)).toBeGreaterThan(.5)
    expect(detectionIntensity(.65, upperOnly)).toBeGreaterThan(.2)
  })

  it('samples a position on the detector', () => {
    expect(sampleDetection(both, () => .5)).toBeGreaterThanOrEqual(-1)
    expect(sampleDetection(both, () => .5)).toBeLessThanOrEqual(1)
  })
})
