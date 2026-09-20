# Field Notes — Interactive Physics

A client-side, dark-mode physics laboratory built with React, TypeScript, SVG, and Vite.

## Development

```bash
npm install
npm run dev
npm test
npm run build
```

## Architecture

- `src/physics/` contains rendering-independent models and physical constants.
- `src/hooks/useSimulation.ts` provides normalized time, playback, reset, and scrubbing.
- `src/hooks/useInView.ts` pauses off-screen simulations through `IntersectionObserver`.
- `src/components/` contains reusable scenario, control, timeline, measurement, and maths UI.
- `src/scenarios/` owns scenario-specific state and SVG rendering. Gravity and Binary Stars share both the two-body engine and `OrbitalDiagram`.

SVG was chosen over WebGL: all five current concepts are clearer in controlled 2D, avoid camera interaction, and remain crisp at responsive sizes. Physical values and visual coordinates are deliberately separate. Every exaggerated visual scale is labelled in its scene.

The orbital engine uses velocity Verlet rather than Euler integration to limit secular energy drift. Relativity uses idealized instantaneous turnaround. The black-hole scene uses exact Schwarzschild expressions for an E=1 radial geodesic and outgoing null-signal arrival times, while keeping the diagram itself schematic.
