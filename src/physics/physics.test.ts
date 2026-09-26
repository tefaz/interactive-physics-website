import { describe, expect, it } from 'vitest'
import { gamma, intergalacticJourney, simultaneityExperiment, twinJourney } from './relativity'
import { fromFrequency, fromWavelength, wireInMovingFrame } from './electromagnetism'
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
  it('transforms simultaneous platform strikes into sequential train events', () => {
    const experiment = simultaneityExperiment(0.6, C)
    expect(experiment.platformLengthMeters).toBeCloseTo(0.8 * C)
    expect(experiment.trainFrontStrikeSeconds).toBeCloseTo(-0.3)
    expect(experiment.trainRearStrikeSeconds).toBeCloseTo(0.3)
    expect(experiment.trainStrikeGapSeconds).toBeCloseTo(0.6)
    expect(experiment.trainFrontSignalArrivalSeconds).toBeCloseTo(0.2)
    expect(experiment.trainRearSignalArrivalSeconds).toBeCloseTo(0.8)
  })
  it('accounts for the platform observer’s transverse distance in both frames', () => {
    for (const beta of [0, .3, .6, .9]) {
      const experiment = simultaneityExperiment(beta, C, .35 * C)
      const platformArrival = experiment.platformSignalArrivalSeconds
      const trainArrival = experiment.trainPlatformSignalArrivalSeconds
      const half = experiment.platformLengthMeters / (2 * C)
      expect(platformArrival).toBeCloseTo(Math.hypot(half, .35), 12)
      expect(trainArrival).toBeCloseTo(experiment.gamma * platformArrival, 12)
      // In the train frame Bob moves. Each expanding light sphere intersects
      // his position at the same event, despite different emission times.
      const bobX = -beta * trainArrival
      expect(Math.hypot(bobX - .5, .35)).toBeCloseTo(trainArrival - experiment.trainFrontStrikeSeconds, 12)
      expect(Math.hypot(bobX + .5, .35)).toBeCloseTo(trainArrival - experiment.trainRearStrikeSeconds, 12)
    }
  })
  it('distinguishes telescope delay from traveller time on a one-way journey', () => {
    const departure = intergalacticJourney(0.8, 10, 0)
    const arrival = intergalacticJourney(0.8, 10, 1)
    expect(departure.earthImageEmissionYear).toBe(-10)
    expect(departure.travellerImageEmissionYear).toBe(-10)
    expect(arrival.earthTotalYears).toBeCloseTo(12.5)
    expect(arrival.travellerTotalYears).toBeCloseTo(7.5)
    expect(arrival.earthImageEmissionYear).toBeCloseTo(2.5)
    expect(arrival.travellerImageEmissionYear).toBeCloseTo(12.5)
  })
})

describe('electromagnetism', () => {
  it('links wavelength and frequency', () => expect(fromWavelength(1).frequency).toBe(C))
  it('links frequency and photon energy', () => expect(fromFrequency(1).energy).toBe(H))
  it('keeps the wire neutral in its own frame', () => {
    const wire = wireInMovingFrame(.6, 0)
    expect(wire.netDensity).toBeCloseTo(0)
    expect(wire.relativeElectronBeta).toBeCloseTo(.6)
  })
  it('finds positive charge density in the electron frame', () => {
    const wire = wireInMovingFrame(.6, .6)
    expect(wire.relativeElectronBeta).toBeCloseTo(0)
    expect(wire.netDensity).toBeCloseTo(.45)
    expect(wire.positiveDensity).toBeCloseTo(1.25)
    expect(wire.negativeDensity).toBeCloseTo(-.8)
  })
  it('has no force-producing current or charge when flow is off', () => {
    const wire = wireInMovingFrame(0, 0)
    expect(wire.current).toBeCloseTo(0)
    expect(wire.netDensity).toBe(0)
  })
  it('shows a stronger positive density at higher shared probe and electron speed', () => {
    expect(wireInMovingFrame(.8, .8).netDensity).toBeGreaterThan(wireInMovingFrame(.4, .4).netDensity)
  })
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
