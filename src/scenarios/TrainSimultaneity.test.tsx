import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { TrainSimultaneity } from './TrainSimultaneity'

describe('simultaneity animation', () => {
  beforeEach(() => {
    vi.stubGlobal('IntersectionObserver', class {
      observe() {}
      disconnect() {}
    })
  })
  afterEach(() => { cleanup(); vi.unstubAllGlobals() })

  it('records simultaneous platform strikes, then sequential train strikes', () => {
    render(<TrainSimultaneity />)
    expect(screen.getAllByText('Waiting')).toHaveLength(2)
    fireEvent.click(screen.getByRole('button', { name: 'Strikes' }))
    expect(screen.getAllByText('0 ns')).toHaveLength(2)
    expect(screen.getByText('Same time')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Train' }))
    expect(screen.getAllByText('Waiting')).toHaveLength(2)
    fireEvent.click(screen.getByRole('button', { name: 'Jump to front strike' }))
    expect(screen.getByText('-300 ns')).toBeTruthy()
    expect(screen.getByText('Waiting')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Jump to rear strike' }))
    expect(screen.getByText('300 ns')).toBeTruthy()
    expect(screen.getByText('Front first · 600 ns apart')).toBeTruthy()
  })

  it('lights reception indicators when radial wavefronts reach each observer’s eye', () => {
    const { container } = render(<TrainSimultaneity />)
    for (const frame of ['Platform', 'Train']) {
      fireEvent.click(screen.getByRole('button', { name: frame }))
      // Bob stands 112 px off the light sources’ line. At 0.6c the platform
      // half-length is 128 px, and γ = 1.25. His path is diagonal, not 128 px.
      const bobPlatformArrival = Math.hypot(128, 112) / 320
      const start = frame === 'Platform' ? -.25 : -.55
      const bobArrival = frame === 'Platform' ? bobPlatformArrival : 1.25 * bobPlatformArrival
      const end = Math.max(frame === 'Platform' ? 1 : .8, bobArrival) + .24
      const events = [
        { observer: 'Alice', signal: 'front', arrival: frame === 'Platform' ? .25 : .2 },
        { observer: 'Bob', signal: 'rear', arrival: bobArrival },
        { observer: 'Bob', signal: 'front', arrival: bobArrival },
        { observer: 'Alice', signal: 'rear', arrival: frame === 'Platform' ? 1 : .8 },
      ]
      for (const event of events) {
        const seek = (time: number) => fireEvent.change(screen.getByRole('slider', { name: 'Experiment timeline' }), { target: { value: String((time - start) / (end - start)) } })
        seek(event.arrival - 1e-7)
        const observer = container.querySelector(`[data-observer="${event.observer}"]`)!
        expect(observer.getAttribute(`data-${event.signal}-received`)).toBe('false')
        const wave = container.querySelector(`[data-wavefront="${event.signal}"]`)!
        const [x, y] = observer.getAttribute('transform')!.match(/-?\d+(?:\.\d+)?/g)!.map(Number)
        const distance = Math.hypot(x - Number(wave.getAttribute('cx')), y - Number(wave.getAttribute('cy')))
        expect(Number(wave.getAttribute('r'))).toBeCloseTo(distance, 3)
        seek(event.arrival + 1e-7)
        expect(container.querySelector(`[data-observer="${event.observer}"]`)!.getAttribute(`data-${event.signal}-received`)).toBe('true')
        // Receiving light does not remove the rest of the expanding flash.
        expect(container.querySelector(`[data-wavefront="${event.signal}"]`)).toBeTruthy()
      }
    }
  })

  it('agrees in both frames when the train is stationary', () => {
    render(<TrainSimultaneity />)
    fireEvent.click(screen.getByRole('button', { name: 'Train' }))
    fireEvent.change(screen.getByRole('slider', { name: 'Train speed' }), { target: { value: '0' } })
    fireEvent.click(screen.getByRole('button', { name: 'Alice sees both' }))
    expect(screen.getAllByText('0 ns')).toHaveLength(2)
    expect(screen.getByText('Same time')).toBeTruthy()
    expect(screen.getByRole('img').getAttribute('aria-label')).toContain('Alice sees both flashes together')
  })

  it('keeps light expanding through the crossing before Bob receives it', () => {
    const { container } = render(<TrainSimultaneity />)
    const progress = (.41 + .25) / (1 + .24 + .25)
    fireEvent.change(screen.getByRole('slider', { name: 'Experiment timeline' }), { target: { value: String(progress) } })
    expect(screen.getByRole('img').getAttribute('aria-label')).toContain('Waves cross; Bob is still waiting')
    expect(container.querySelectorAll('[data-wavefront]')).toHaveLength(2)
    expect(container.querySelector('[data-observer="Bob"]')!.getAttribute('data-front-received')).toBe('false')
    fireEvent.click(screen.getByRole('button', { name: 'Bob sees both' }))
    expect(container.querySelector('[data-observer="Bob"]')!.getAttribute('data-front-received')).toBe('true')
    expect(container.querySelector('[data-observer="Bob"]')!.getAttribute('data-rear-received')).toBe('true')
    expect(container.querySelectorAll('[data-wavefront]')).toHaveLength(2)
  })

  it('finishes with both observers receiving both flashes, with Alice still in view', () => {
    const { container } = render(<TrainSimultaneity />)
    for (const frame of ['Platform', 'Train']) {
      fireEvent.click(screen.getByRole('button', { name: frame }))
      for (const beta of [0, .3, .6, .9]) {
        fireEvent.change(screen.getByRole('slider', { name: 'Train speed' }), { target: { value: String(beta) } })
        const camera = container.querySelector('[data-scene-camera]')!.getAttribute('transform')!
        fireEvent.change(screen.getByRole('slider', { name: 'Experiment timeline' }), { target: { value: '1' } })
        expect(container.querySelector('[data-scene-camera]')!.getAttribute('transform')).toBe(camera)
        const [screenX, , scale, offsetX] = camera.match(/-?\d+(?:\.\d+)?/g)!.map(Number)
        for (const name of ['Alice', 'Bob']) {
          const observer = container.querySelector(`[data-observer="${name}"]`)!
          expect(observer.getAttribute('data-front-received')).toBe('true')
          expect(observer.getAttribute('data-rear-received')).toBe('true')
          const x = Number(observer.getAttribute('transform')!.match(/-?\d+(?:\.\d+)?/)![0])
          const visibleX = screenX + scale * (x + offsetX)
          expect(visibleX).toBeGreaterThan(40)
          expect(visibleX).toBeLessThan(720)
        }
        const train = container.querySelector('.sim-train')!
        const trainX = Number(train.getAttribute('transform')!.match(/-?\d+(?:\.\d+)?/)![0])
        const halfLength = (Number(train.querySelector('rect')!.getAttribute('width')) + 18) / 2
        expect(screenX + scale * (trainX + halfLength + offsetX)).toBeLessThan(720)
      }
    }
  })
})
