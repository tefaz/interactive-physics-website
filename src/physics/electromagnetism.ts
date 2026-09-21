import { C, ELECTRON_VOLT, H } from './constants'

export type Radiation = { wavelength: number; frequency: number; energy: number; energyEv: number }

export function fromWavelength(wavelength: number): Radiation {
  const frequency = C / wavelength
  const energy = H * frequency
  return { wavelength, frequency, energy, energyEv: energy / ELECTRON_VOLT }
}

export function fromFrequency(frequency: number) { return fromWavelength(C / frequency) }

export const spectrumPresets = {
  radio: 3,
  microwave: 3e-3,
  infrared: 10e-6,
  visible: 550e-9,
  ultraviolet: 100e-9,
  'x-ray': 0.1e-9,
  gamma: 1e-12,
} as const

export function spectrumName(wavelength: number) {
  if (wavelength > 1e-1) return 'Radio'
  if (wavelength > 1e-3) return 'Microwave'
  if (wavelength > 700e-9) return 'Infrared'
  if (wavelength > 380e-9) return 'Visible light'
  if (wavelength > 10e-9) return 'Ultraviolet'
  if (wavelength > 1e-11) return 'X-ray'
  return 'Gamma ray'
}

/**
 * A neutral wire viewed from a frame moving parallel to it.
 *
 * Values are normalized to the positive line-charge density in the wire's
 * rest frame. Positive beta points with the electrons. The lab-frame
 * electron velocity is also positive, so conventional current is negative.
 */
export function wireInMovingFrame(electronBeta: number, observerBeta: number) {
  const gamma = 1 / Math.sqrt(1 - observerBeta ** 2)
  const positiveDensity = gamma
  const negativeDensity = -gamma * (1 - observerBeta * electronBeta)
  const netDensity = positiveDensity + negativeDensity
  const labCurrent = -electronBeta
  const current = gamma * labCurrent
  const relativeElectronBeta = (electronBeta - observerBeta) / (1 - electronBeta * observerBeta)
  const relativeLatticeBeta = -observerBeta

  return {
    gamma,
    positiveDensity,
    negativeDensity,
    netDensity,
    current,
    relativeElectronBeta,
    relativeLatticeBeta,
  }
}
