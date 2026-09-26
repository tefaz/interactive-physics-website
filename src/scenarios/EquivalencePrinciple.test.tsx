import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { EquivalencePrinciple } from './EquivalencePrinciple'

describe('equivalence experiment', () => {
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
  afterEach(() => { cleanup(); vi.unstubAllGlobals() })

  it('lands on the drawn floor for both causes and both views', () => {
    const { container } = render(<EquivalencePrinciple />)
    for (const cause of ['Accelerating rocket', 'Gravity']) {
      fireEvent.click(screen.getByRole('button', { name: cause }))
      for (const view of ['Sealed cabin', 'Outside view']) {
        fireEvent.click(screen.getByRole('button', { name: view }))
        for (const acceleration of [1, 9.81, 20]) {
          fireEvent.change(screen.getByRole('slider', { name: cause === 'Gravity' ? 'Gravitational field g' : 'Rocket acceleration a' }), { target: { value: String(acceleration) } })
          fireEvent.change(screen.getByRole('slider', { name: 'Release the ball' }), { target: { value: '1' } })
          const ball = container.querySelector('[data-ball]')!
          const floor = container.querySelector('[data-floor]')!
          expect(Number(ball.getAttribute('cy')) + Number(ball.getAttribute('r'))).toBeCloseTo(Number(floor.getAttribute('y')), 10)
          expect(screen.getByRole('img').getAttribute('aria-label')).toContain('Ball–floor gap 0.00 metres')
          const duration = Math.sqrt(4 / acceleration).toFixed(2)
          expect(screen.getByText(`${duration} / ${duration} s`)).toBeTruthy()
        }
      }
    }
  })

  it('preserves the instant while switching cause and view, and keeps the outside rocket ball stationary', () => {
    const { container } = render(<EquivalencePrinciple />)
    const timeline = screen.getByRole('slider', { name: 'Release the ball' }) as HTMLInputElement
    const worldBallY = () => {
      const ball = container.querySelector('[data-ball]')!
      const offset = Number(container.querySelector('[data-cabin]')!.getAttribute('transform')!.match(/-?\d+(?:\.\d+)?/g)![1])
      return Number(ball.getAttribute('cy')) + offset
    }
    fireEvent.change(timeline, { target: { value: '.5' } })
    expect(screen.getByRole('img').getAttribute('aria-label')).toContain('Ball–floor gap 1.50 metres')
    const insideBallY = worldBallY()
    fireEvent.click(screen.getByRole('button', { name: 'Gravity' }))
    expect(timeline.value).toBe('0.5')
    expect(worldBallY()).toBe(insideBallY)
    fireEvent.click(screen.getByRole('button', { name: 'Outside view' }))
    expect(timeline.value).toBe('0.5')
    expect(worldBallY()).toBe(insideBallY)
    fireEvent.click(screen.getByRole('button', { name: 'Accelerating rocket' }))
    const coastingY = worldBallY()
    const camera = container.querySelector('[data-eq-camera]')!.getAttribute('transform')
    fireEvent.change(timeline, { target: { value: '.8' } })
    expect(worldBallY()).toBeCloseTo(coastingY, 10)
    expect(container.querySelector('[data-eq-camera]')!.getAttribute('transform')).toBe(camera)
  })

  it('plays in real time and pauses comparisons at the same instant', () => {
    render(<EquivalencePrinciple />)
    fireEvent.click(screen.getByRole('button', { name: 'Play' }))
    const advance = (time: number) => act(() => { const callback = nextFrame; nextFrame = null; callback?.(time) })
    advance(1000)
    for (let index = 1; index <= 10; index++) advance(1000 + index * 20)
    const timeline = screen.getByRole('slider', { name: 'Release the ball' }) as HTMLInputElement
    expect(Number(timeline.value)).toBeCloseTo(.2 / Math.sqrt(4 / 9.81))
    expect(screen.getByText('0.20 / 0.64 s')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Gravity' }))
    expect(screen.getByRole('button', { name: 'Play' })).toBeTruthy()
    expect(Number(timeline.value)).toBeCloseTo(.2 / Math.sqrt(4 / 9.81))
  })

  it('lands after about 0.64 real seconds on Earth while the Moon drop takes longer', () => {
    render(<EquivalencePrinciple />)
    const advance = (time: number) => act(() => { const callback = nextFrame; nextFrame = null; callback?.(time) })
    const timeline = screen.getByRole('slider', { name: 'Release the ball' }) as HTMLInputElement
    fireEvent.click(screen.getByRole('button', { name: 'Play' }))
    advance(1000)
    for (let index = 1; index <= 31; index++) advance(1000 + index * 20)
    expect(Number(timeline.value)).toBeLessThan(1)
    advance(1640)
    expect(timeline.value).toBe('1')
    expect(screen.getByRole('img').getAttribute('aria-label')).toContain('The ball meets the floor')

    fireEvent.click(screen.getByRole('button', { name: 'Moon · 1.62' }))
    fireEvent.click(screen.getByRole('button', { name: 'Play' }))
    advance(3000)
    for (let index = 1; index <= 32; index++) advance(3000 + index * 20)
    expect(Number(timeline.value)).toBeLessThan(1)
    expect(screen.getByText('0.64 / 1.57 s')).toBeTruthy()
  })
})
