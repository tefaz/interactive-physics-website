import { describe, expect, it } from 'vitest'
import { gamma, twinJourney } from './relativity'
import { fromFrequency, fromWavelength } from './electromagnetism'
import { C, G, H, SOLAR_MASS } from './constants'
import { circularSystem, orbitalPeriod, stepVerlet } from './orbits'
import { fallRadius, radialFallCoordinateTime, radialFallProperTime, schwarzschildRadius } from './blackHole'

describe('special relativity', () => {
  it('has gamma 1 at rest', () => expect(gamma(0)).toBe(1))
  it('has gamma 1.25 at 0.6c', () => expect(gamma(0.6)).toBeCloseTo(1.25, 12))
  it('calculates a known round trip', () => {
    const trip = twinJourney(0.8, 4)
    expect(trip.earthTotalYears).toBeCloseTo(10)
    expect(trip.travellerTotalYears).toBeCloseTo(6)
  })
})

describe('electromagnetism', () => {
  it('links wavelength and frequency', () => expect(fromWavelength(1).frequency).toBe(C))
  it('links frequency and photon energy', () => expect(fromFrequency(1).energy).toBe(H))
})

describe('gravity', () => {
  it('keeps a circular orbit separation stable', () => {
    const separation = 1e9, period = orbitalPeriod(SOLAR_MASS, SOLAR_MASS, separation)
    let state = circularSystem(SOLAR_MASS, SOLAR_MASS, separation)
    for (let i = 0; i < 2000; i++) state = stepVerlet(state, period / 2000)
    const distance = Math.hypot(state.a.position.x - state.b.position.x, state.a.position.y - state.b.position.y)
    expect(distance / separation).toBeCloseTo(1, 3)
  })
  it('uses the Schwarzschild radius formula', () => expect(schwarzschildRadius(SOLAR_MASS)).toBeCloseTo(2 * G * SOLAR_MASS / C ** 2, 8))
  it('has finite infaller time but divergent Schwarzschild time at the horizon', () => {
    const rs = schwarzschildRadius(10 * SOLAR_MASS)
    expect(radialFallProperTime(8, 1, rs)).toBeGreaterThan(0)
    expect(radialFallCoordinateTime(8, 1, rs)).toBe(Infinity)
  })
  it('accelerates inward over equal intervals of infaller proper time', () => {
    const firstQuarter = 8 - fallRadius(8, .25)
    const thirdQuarter = fallRadius(8, .5) - fallRadius(8, .75)
    expect(thirdQuarter).toBeGreaterThan(firstQuarter)
  })
})
