import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { RelativisticElectricity } from './RelativisticElectricity'

describe('electricity experiment', () => {
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

  it('connects the two frames and the off state to the probe force', () => {
    render(<RelativisticElectricity />)
    expect(screen.getByText('Neutral · magnetic field')).toBeTruthy()
    expect(screen.getByText('magnetic force')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: /ride with probe/i }))
    expect(screen.getByText('Positive · electric field')).toBeTruthy()
    expect(screen.getByText('electric force')).toBeTruthy()

    fireEvent.change(screen.getByRole('slider', { name: /electron and probe speed/i }), { target: { value: '0' } })
    expect(screen.getByText('Neutral · no current')).toBeTruthy()
    expect(screen.getByText('no force')).toBeTruthy()
  })
})
