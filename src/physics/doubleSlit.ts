export type SlitSetting = 'both' | 'upper' | 'lower'

export type DoubleSlitSettings = {
  slits: SlitSetting
  observeUpperSlit: boolean
  wavelength: number
  separation: number
  screenDistance: number
}

export function interferenceVisible({ slits, observeUpperSlit }: DoubleSlitSettings): boolean {
  return slits === 'both' && !observeUpperSlit
}

/** Paraxial Gaussian slit amplitudes propagated to a screen; position is -1 to 1. */
export function detectionIntensity(position: number, settings: DoubleSlitSettings): number {
  const slitWidth = .09
  const spread = settings.screenDistance * settings.wavelength / (4 * Math.PI * slitWidth ** 2)
  const width = slitWidth * Math.sqrt(1 + spread ** 2)
  const upper = Math.exp(-0.5 * ((position + settings.separation / 2) / width) ** 2)
  const lower = Math.exp(-0.5 * ((position - settings.separation / 2) / width) ** 2)
  if (settings.slits === 'upper') return upper
  if (settings.slits === 'lower') return lower
  if (settings.observeUpperSlit) return upper + lower
  const phaseDifference = position * settings.separation * spread / (2 * slitWidth ** 2 * (1 + spread ** 2))
  return upper + lower + 2 * Math.sqrt(upper * lower) * Math.cos(phaseDifference)
}

/** Sample one localized detector hit according to the current probability curve. */
export function sampleDetection(settings: DoubleSlitSettings, random = Math.random): number {
  const count = 400
  const weights = Array.from({ length: count }, (_, index) => detectionIntensity(-1 + (index + 0.5) * 2 / count, settings))
  const total = weights.reduce((sum, weight) => sum + weight, 0)
  let target = random() * total
  for (let index = 0; index < count; index++) {
    target -= weights[index]
    if (target <= 0) return -1 + (index + random()) * 2 / count
  }
  return 1
}
