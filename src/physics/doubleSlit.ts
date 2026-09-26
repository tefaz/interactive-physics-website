export type SlitSetting = 'both' | 'upper' | 'lower'

export type DoubleSlitSettings = {
  slits: SlitSetting
  observeUpperSlit: boolean
  wavelength: number
  separation: number
  screenDistance: number
}

export type DoubleSlitState = Pick<DoubleSlitSettings, 'slits' | 'observeUpperSlit'>

export function interferenceVisible({ slits, observeUpperSlit }: DoubleSlitState): boolean {
  return slits === 'both' && !observeUpperSlit
}

/**
 * Schematic detector comparison, rather than a propagation calculation.
 * Fringe spacing and single-path widths are exaggerated independently so the
 * five / two / one band outcomes stay clear. For a geometry-dependent model,
 * use detectionIntensity below.
 */
export function illustratedIntensity(position: number, settings: DoubleSlitState): number {
  if (interferenceVisible(settings)) {
    if (Math.abs(position) >= .85) return 0
    const envelope = Math.exp(-.5 * (position / .8) ** 2)
    return envelope * Math.cos(Math.PI * position / .34) ** 2
  }
  const band = (center: number) => {
    const offset = (position - center) / .22
    return Math.abs(offset) >= 1 ? 0 : Math.cos(offset * Math.PI / 2) ** 2
  }
  const upper = settings.slits !== 'lower' ? band(-.52) : 0
  const lower = settings.slits !== 'upper' ? band(.52) : 0
  return upper + lower
}

/** Cache the schematic probability distribution; draw one hit per call. */
export function createIllustratedSampler(settings: DoubleSlitState) {
  const bins = 600
  let total = 0
  const cumulative = Array.from({ length: bins }, (_, index) => {
    total += illustratedIntensity(-1 + (index + .5) * 2 / bins, settings)
    return total
  })
  return (random = Math.random): number => {
    const target = Math.min(random(), 1 - Number.EPSILON) * total
    let low = 0, high = bins - 1
    while (low < high) {
      const middle = Math.floor((low + high) / 2)
      if (cumulative[middle] <= target) low = middle + 1
      else high = middle
    }
    return -1 + (low + random()) * 2 / bins
  }
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
