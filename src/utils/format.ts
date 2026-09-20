import { AU, C, ELECTRON_VOLT, LIGHT_YEAR, SOLAR_MASS, YEAR } from '../physics/constants'

const n = (value: number, digits = 2) => new Intl.NumberFormat('en', { maximumFractionDigits: digits }).format(value)
export const formatYears = (years: number) => years < 1 / 365 ? `${n(years * YEAR / 3600)} h` : years < 1 ? `${n(years * 365.25)} days` : `${n(years)} years`
export const formatDistance = (meters: number) => meters >= LIGHT_YEAR * .1 ? `${n(meters / LIGHT_YEAR)} ly` : meters >= AU * .1 ? `${n(meters / AU)} AU` : meters >= 1e3 ? `${n(meters / 1e3)} km` : `${n(meters)} m`
export const formatVelocity = (metersPerSecond: number) => metersPerSecond > C * .01 ? `${n(metersPerSecond / C, 4)}c` : `${n(metersPerSecond / 1e3)} km/s`
export const formatMass = (kg: number) => kg > SOLAR_MASS * .01 ? `${n(kg / SOLAR_MASS)} M☉` : `${kg.toExponential(2)} kg`
export const formatFrequency = (hz: number) => hz >= 1e18 ? `${n(hz / 1e18)} EHz` : hz >= 1e15 ? `${n(hz / 1e15)} PHz` : hz >= 1e12 ? `${n(hz / 1e12)} THz` : hz >= 1e9 ? `${n(hz / 1e9)} GHz` : `${n(hz)} Hz`
export const formatWavelength = (m: number) => m >= 1 ? `${n(m)} m` : m >= 1e-3 ? `${n(m * 1e3)} mm` : m >= 1e-6 ? `${n(m * 1e6)} μm` : m >= 1e-9 ? `${n(m * 1e9)} nm` : `${n(m * 1e12)} pm`
export const formatEnergy = (joules: number) => joules / ELECTRON_VOLT > 1e6 ? `${n(joules / ELECTRON_VOLT / 1e6)} MeV` : joules / ELECTRON_VOLT > 1e3 ? `${n(joules / ELECTRON_VOLT / 1e3)} keV` : `${n(joules / ELECTRON_VOLT)} eV`
export const formatPeriod = (seconds: number) => seconds > YEAR ? `${n(seconds / YEAR)} years` : seconds > 86400 ? `${n(seconds / 86400)} days` : `${n(seconds / 3600)} hours`
