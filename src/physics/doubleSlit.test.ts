import { describe, expect, it } from 'vitest'
import { createIllustratedSampler, detectionIntensity, illustratedIntensity, interferenceVisible, sampleDetection, type DoubleSlitSettings } from './doubleSlit'

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

describe('schematic detector patterns', () => {
  it('has five prominent interference peaks with dark gaps between them', () => {
    const values = Array.from({ length: 1001 }, (_, index) => illustratedIntensity(-1 + index / 500, both))
    const peaks = values.filter((value, index) => index > 0 && index < 1000 && value > values[index - 1] && value > values[index + 1])
    expect(peaks).toHaveLength(5)
    expect(Math.min(...peaks)).toBeGreaterThan(.65)
    for (const position of [-.51, -.17, .17, .51]) expect(illustratedIntensity(position, both)).toBeLessThan(1e-12)
    const sample = createIllustratedSampler(both)
    const hits = Array.from({ length: 1000 }, (_, index) => sample(() => (index + .5) / 1000))
    for (const center of [-.68, -.34, 0, .34, .68]) {
      expect(hits.filter(position => Math.abs(position - center) < .13).length).toBeGreaterThan(120)
    }
  })

  it('adds the two separated single-path bands when observation is enabled', () => {
    const observed = { ...both, observeUpperSlit: true }
    const upper = { ...both, slits: 'upper' as const }
    const lower = { ...both, slits: 'lower' as const }
    for (let index = 0; index <= 100; index++) {
      const position = -1 + index / 50
      expect(illustratedIntensity(position, observed)).toBeCloseTo(illustratedIntensity(position, upper) + illustratedIntensity(position, lower), 12)
    }
    expect(illustratedIntensity(0, observed)).toBe(0)
    const sample = createIllustratedSampler(observed)
    const hits = Array.from({ length: 1000 }, (_, index) => sample(() => (index + .5) / 1000))
    expect(hits.filter(position => position < -.3)).toHaveLength(500)
    expect(hits.filter(position => position > .3)).toHaveLength(500)
  })

  it('keeps every single-slit hit on the remaining open side', () => {
    for (const slits of ['upper', 'lower'] as const) {
      for (const observeUpperSlit of [false, true]) {
        const sample = createIllustratedSampler({ slits, observeUpperSlit })
        for (let index = 0; index < 500; index++) {
          const hit = sample(() => (index + .5) / 500)
          expect(slits === 'upper' ? hit < -.3 : hit > .3).toBe(true)
        }
      }
    }
  })
})
