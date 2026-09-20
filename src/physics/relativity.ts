import { C, LIGHT_YEAR, YEAR } from './constants'

export function gamma(beta: number) {
  if (Math.abs(beta) >= 1) throw new RangeError('|beta| must be less than 1')
  return 1 / Math.sqrt(1 - beta * beta)
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

export const yearsToSeconds = (years: number) => years * YEAR
export const lightYearsToMeters = (ly: number) => ly * LIGHT_YEAR
export const betaToVelocity = (beta: number) => beta * C
