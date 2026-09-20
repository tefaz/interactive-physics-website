import { ReactNode, RefObject } from 'react'

export function Scenario({ sectionRef, id, title, lede, visual, controls, children, accent, primary = false }: { sectionRef: RefObject<HTMLElement | null>; id: string; number: string; eyebrow: string; title: string; lede: string; visual: ReactNode; controls: ReactNode; children?: ReactNode; accent: string; primary?: boolean }) {
  return <section ref={sectionRef} className="scenario" id={id} style={{ '--accent': accent } as React.CSSProperties}>
    <div className="scenario-glow" />
    <div className="scenario-shell">
      <header className="scenario-heading">
        {primary ? <h1>{title}</h1> : <h2>{title}</h2>}
        <p>{lede}</p>
      </header>
      <div className="lab-grid">
        <div className="visual-card">{visual}</div>
        <aside className="control-panel">{controls}</aside>
      </div>
      {children}
    </div>
  </section>
}
