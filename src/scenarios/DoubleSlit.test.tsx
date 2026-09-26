import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { DoubleSlit } from './DoubleSlit'

describe('double-slit experiment', () => {
  let nextFrame: FrameRequestCallback | null
  beforeEach(() => {
    vi.stubGlobal('IntersectionObserver', class {
      constructor(private callback: IntersectionObserverCallback) {}
      observe() { this.callback([{ isIntersecting: true, intersectionRatio: 1 } as IntersectionObserverEntry], this as unknown as IntersectionObserver) }
      disconnect() {}
    })
    nextFrame = null
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => { nextFrame = callback; return 1 })
    vi.stubGlobal('cancelAnimationFrame', () => { nextFrame = null })
  })
  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  it('switches between interference and path-known patterns', () => {
    const { container } = render(<DoubleSlit />)
    expect(screen.getByRole('heading', { name: 'Double slit experiment' })).toBeTruthy()
    expect(screen.queryAllByRole('slider')).toHaveLength(0)
    expect(screen.getByText('Five interference bands')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: /observe upper slit/i }))
    expect(screen.getByText('Two bands. No interference.')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: /observe upper slit/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Upper only' }))
    expect(screen.getByText('Upper slit open · one band')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Upper only' }).getAttribute('aria-pressed')).toBe('true')
    expect(container.querySelector('[data-closed-slit="lower"]')).toBeTruthy()
    expect(screen.getByRole('button', { name: /observe upper slit/i }).hasAttribute('disabled')).toBe(true)

    fireEvent.click(screen.getByRole('button', { name: 'Lower only' }))
    expect(screen.getByText('Lower slit open · one band')).toBeTruthy()
    expect(container.querySelector('[data-closed-slit="upper"]')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Both open' }))
    fireEvent.click(screen.getByRole('button', { name: /observe upper slit/i }))
    expect(screen.getByText('Two bands. No interference.')).toBeTruthy()
  })

  it('accumulates dots at a steady rate and clears them when the setup changes', () => {
    const { container } = render(<DoubleSlit />)
    fireEvent.click(screen.getByRole('button', { name: 'Play' }))
    const advance = (time: number) => act(() => { const callback = nextFrame; nextFrame = null; callback?.(time) })
    advance(1000)
    advance(1100)
    expect(container.querySelectorAll('[data-detection]')).toHaveLength(8)
    fireEvent.click(screen.getByRole('button', { name: 'Lower only' }))
    expect(container.querySelectorAll('[data-detection]')).toHaveLength(0)
    advance(1200)
    advance(1300)
    expect(container.querySelectorAll('[data-detection]')).toHaveLength(4)
    for (const dot of container.querySelectorAll('[data-detection]')) expect(Number(dot.getAttribute('cy'))).toBeGreaterThan(300)
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }))
    expect(container.querySelectorAll('[data-detection]')).toHaveLength(0)
    expect(screen.getByRole('button', { name: 'Play' })).toBeTruthy()
  })
})
