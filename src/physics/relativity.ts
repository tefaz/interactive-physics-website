import { C, LIGHT_YEAR, YEAR } from './constants'

export function gamma(beta: number) {
  if (Math.abs(beta) >= 1) throw new RangeError('|beta| must be less than 1')
  return 1 / Math.sqrt(1 - beta * beta)
}

export type SimultaneityExperiment = {
  beta: number
  gamma: number
  properLengthMeters: number
  platformLengthMeters: number
  trainFrontStrikeSeconds: number
  trainRearStrikeSeconds: number
  trainStrikeGapSeconds: number
  platformSignalArrivalSeconds: number
  trainFrontSignalArrivalSeconds: number
  trainRearSignalArrivalSeconds: number
}

/**
 * Two lightning strikes hit the ends of a train simultaneously in the
 * platform frame. Times in the train frame are measured from the instant
 * its midpoint passes the platform observer.
 */
export function simultaneityExperiment(beta: number, properLengthMeters: number): SimultaneityExperiment {
  if (properLengthMeters <= 0) throw new RangeError('properLengthMeters must be positive')
  const g = gamma(beta)
  const halfStrikeGap = beta * properLengthMeters / (2 * C)
  return {
    beta,
    gamma: g,
    properLengthMeters,
    platformLengthMeters: properLengthMeters / g,
    trainFrontStrikeSeconds: -halfStrikeGap,
    trainRearStrikeSeconds: halfStrikeGap,
    trainStrikeGapSeconds: 2 * halfStrikeGap,
    platformSignalArrivalSeconds: properLengthMeters / (2 * g * C),
    trainFrontSignalArrivalSeconds: (1 - beta) * properLengthMeters / (2 * C),
    trainRearSignalArrivalSeconds: (1 + beta) * properLengthMeters / (2 * C),
  }
}

export type TwinJourney = {
  beta: number
  distanceLy: number
  earthTotalYears: number
  travellerTotalYears: number
  differenceYears: number
  gamma: number
}

export function twinJourney(beta: number, distanceLy: number): TwinJourney {
  const g = gamma(beta)
  const earthTotalYears = (2 * distanceLy) / beta
  const travellerTotalYears = earthTotalYears / g
  return { beta, distanceLy, earthTotalYears, travellerTotalYears, differenceYears: earthTotalYears - travellerTotalYears, gamma: g }
}

export function twinAtProgress(beta: number, distanceLy: number, progress: number) {
  const journey = twinJourney(beta, distanceLy)
  const p = Math.min(1, Math.max(0, progress))
  const outbound = p <= 0.5
  return {
    ...journey,
    progress: p,
    phase: p === 0 ? 'Ready for departure' : p < 0.5 ? 'Outbound' : p === 0.5 ? 'Instantaneous turnaround' : p < 1 ? 'Returning home' : 'Reunited',
    position: outbound ? p * 2 : (1 - p) * 2,
    earthElapsedYears: journey.earthTotalYears * p,
    travellerElapsedYears: journey.travellerTotalYears * p,
    direction: outbound ? 1 : -1,
  }
}

/**
 * One-way journey toward a distant light source, in the Earth/planet frame.
 * Image ages are emission dates relative to the launch event: negative values
 * were emitted before launch, positive values after it.
 */
export function intergalacticJourney(beta: number, distanceLy: number, progress: number) {
  if (distanceLy <= 0) throw new RangeError('distanceLy must be positive')
  const g = gamma(beta)
  const p = Math.min(1, Math.max(0, progress))
  const earthTotalYears = distanceLy / beta
  const earthElapsedYears = earthTotalYears * p
  const travellerElapsedYears = earthElapsedYears / g
  return {
    beta,
    gamma: g,
    progress: p,
    earthTotalYears,
    travellerTotalYears: earthTotalYears / g,
    earthElapsedYears,
    travellerElapsedYears,
    earthImageEmissionYear: earthElapsedYears - distanceLy,
    travellerImageEmissionYear: (1 + beta) * earthElapsedYears - distanceLy,
    approachDopplerFactor: Math.sqrt((1 + beta) / (1 - beta)),
  }
}

export const yearsToSeconds = (years: number) => years * YEAR
export const lightYearsToMeters = (ly: number) => ly * LIGHT_YEAR
export const betaToVelocity = (beta: number) => beta * C
