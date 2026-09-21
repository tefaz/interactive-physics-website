import { Pause, Play, RotateCcw } from 'lucide-react'
import { ReactNode } from 'react'

type SliderProps = { label: string; value: number; min: number; max: number; step?: number; display: ReactNode; onChange: (value: number) => void }
export function Slider({ label, value, min, max, step = 1, display, onChange }: SliderProps) {
  return <label className="control">
    <span><span className="control-label">{label}</span><output>{display}</output></span>
    <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))} />
  </label>
}

export function Timeline({ progress, setProgress, playing, toggle, reset, label = 'Journey timeline' }: { progress: number; setProgress: (v: number) => void; playing: boolean; toggle: () => void; reset: () => void; label?: string }) {
  return <div className="timeline-wrap">
    <div className="timeline-head"><span className="control-label">{label}</span><span className="timeline-percent">{Math.round(progress * 100)}%</span></div>
    <input className="timeline" aria-label={label} type="range" min={0} max={1} step={0.001} value={progress} onChange={e => setProgress(Number(e.target.value))} />
    <div className="transport">
      <button className="play" onClick={toggle}>{playing ? <Pause size={17} fill="currentColor" /> : <Play size={17} fill="currentColor" />} {playing ? 'Pause' : 'Play'}</button>
      <button className="icon-button" onClick={reset} aria-label="Reset"><RotateCcw size={17} /> Reset</button>
    </div>
  </div>
}

export function Playback({ playing, toggle, reset }: { playing: boolean; toggle: () => void; reset: () => void }) {
  return <div className="transport playback-controls">
    <button className="play" onClick={toggle}>{playing ? <Pause size={17} fill="currentColor" /> : <Play size={17} fill="currentColor" />} {playing ? 'Pause' : 'Play'}</button>
    <button className="icon-button" onClick={reset} aria-label="Reset"><RotateCcw size={17} /> Reset</button>
  </div>
}

export function Segmented<T extends string>({ value, options, onChange, label }: { value: T; options: readonly T[]; onChange: (v: T) => void; label: string }) {
  return <div className="segmented-wrap"><span className="control-label">{label}</span><div className="segmented">
    {options.map(option => <button key={option} className={value === option ? 'active' : ''} onClick={() => onChange(option)}>{option}</button>)}
  </div></div>
}

export function Maths({ children }: { children: ReactNode }) {
  return null
}

export function Metric({ label, value, tone }: { label: string; value: ReactNode; tone?: string }) {
  return <div className="metric"><span>{label}</span><strong style={{ color: tone }}>{value}</strong></div>
}
