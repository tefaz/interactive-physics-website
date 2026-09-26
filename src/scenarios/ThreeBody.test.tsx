import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { ThreeBody } from './ThreeBody'

describe('three-body experiment', () => {
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

  it('lets each mass change independently and loads a preset', () => {
    render(<ThreeBody />)
    const massA = screen.getByRole('slider', { name: 'Body A mass' }) as HTMLInputElement
    const massB = screen.getByRole('slider', { name: 'Body B mass' }) as HTMLInputElement
    const massC = screen.getByRole('slider', { name: 'Body C mass' }) as HTMLInputElement
    fireEvent.change(massB, { target: { value: '-1' } })
    expect(massA.value).toBe('0')
    expect(massB.value).toBe('-1')
    expect(massC.value).toBe('0')

    fireEvent.click(screen.getByRole('button', { name: 'Star + planets' }))
    expect(massA.value).toBe('0')
    expect(massB.value).toBe('-3')
    expect(Number(massC.value)).toBeCloseTo(-2.699, 2)
    expect(screen.getByRole('button', { name: 'Star + planets' }).getAttribute('aria-pressed')).toBe('true')
  })
})
