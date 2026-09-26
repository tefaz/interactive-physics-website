import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { DoubleSlit } from './DoubleSlit'

describe('double-slit experiment', () => {
  beforeEach(() => {
    vi.stubGlobal('IntersectionObserver', class {
      observe() {}
      disconnect() {}
    })
  })
  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  it('switches between interference and path-known patterns', () => {
    render(<DoubleSlit />)
    expect(screen.getByText('Interference builds up')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: /observe upper slit/i }))
    expect(screen.getByText('Path known: fringes disappear')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: /observe upper slit/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Upper only' }))
    expect(screen.getByText('One slit: a broad diffraction band')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Upper only' }).getAttribute('aria-pressed')).toBe('true')

    fireEvent.change(screen.getByRole('slider', { name: 'Screen distance' }), { target: { value: '.2' } })
    expect(screen.getByText('Upper slit: one nearby band')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Both open' }))
    fireEvent.click(screen.getByRole('button', { name: /observe upper slit/i }))
    expect(screen.getByText('Nearby screen: two separate bands')).toBeTruthy()
  })
})
