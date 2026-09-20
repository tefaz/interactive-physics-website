import { C, G, SOLAR_MASS } from './constants'

export const schwarzschildRadius = (massKg: number) => 2 * G * massKg / (C * C)
export const gravitationalTimeFactor = (radius: number, rs: number) => radius <= rs ? 0 : Math.sqrt(1 - rs / radius)
export const gravitationalRedshift = (radius: number, rs: number) => radius <= rs ? Infinity : 1 / gravitationalTimeFactor(radius, rs) - 1
export const solarMassSchwarzschildRadius = (solarMasses: number) => schwarzschildRadius(solarMasses * SOLAR_MASS)

export function fallRadius(startRs: number, progress: number) {
  const p = Math.min(1, Math.max(0, progress))
  // Invert τ = 2rs/(3c) (R₀^(3/2) − R^(3/2)) for radial E=1 free fall.
  // Equal progress intervals are equal intervals of the infaller's proper time.
  return (startRs ** 1.5 - p * (startRs ** 1.5 - 1)) ** (2 / 3)
}

// Exact Schwarzschild expressions for radial free fall with energy per unit mass E=1
// (the trajectory that is at rest at infinity), expressed with R = r / rs.
export const radialFallProperTime = (startR: number, endR: number, rs: number) =>
  2 * rs / (3 * C) * (startR ** 1.5 - endR ** 1.5)

const coordinatePrimitive = (R: number) => {
  const x = Math.sqrt(R)
  return 2 * x ** 3 / 3 + 2 * x + Math.log((x - 1) / (x + 1))
}

export const radialFallCoordinateTime = (startR: number, endR: number, rs: number) =>
  endR <= 1 ? Infinity : rs / C * (coordinatePrimitive(startR) - coordinatePrimitive(endR))

export const tortoiseRadius = (R: number, rs: number) => R <= 1 ? -Infinity : rs * (R + Math.log(R - 1))

export const outgoingSignalArrival = (emissionCoordinateTime: number, emissionR: number, observerR: number, rs: number) =>
  emissionCoordinateTime + (tortoiseRadius(observerR, rs) - tortoiseRadius(emissionR, rs)) / C
