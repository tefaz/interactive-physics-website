# Fun Physics Demos

A client-side collection of interactive, visual physics experiments. Each full-screen demo lets you change a frame of reference or physical parameter, then see the consequence in an animated SVG scene with live readouts.

Built with React, TypeScript, SVG, and Vite. No backend is required.

## Highlights

- Nine interactive demos spanning relativity, Newtonian gravity, black holes, electromagnetism, and quantum physics.
- Responsive, full-screen laboratory scenes with playback, reset controls, and accessible labels.
- Rendering-independent physics models with automated tests for the core calculations.
- Intentional visual exaggeration where an effect would otherwise be too small to see, with the scene explaining that choice.

## Gallery

<p align="center">
  <img src="TwinParadox.png" alt="Twin Paradox interactive demo" width="49%" />
  <img src="RacingAndromedaTimeDilation.png" alt="Racing Andromeda's light interactive demo" width="49%" />
</p>
<p align="center">
  <img src="GravityAcceleration.png" alt="Two-body gravity interactive demo" width="49%" />
  <img src="EventHorizonAstronaut.png" alt="Event horizon interactive demo" width="49%" />
</p>
<p align="center">
  <img src="ElectricFieldsAndMagnetism.png" alt="Electric fields and magnetism interactive demo" width="49%" />
</p>

## Demos

| Topic | What you can explore |
| --- | --- |
| Twin paradox | Compare the clocks of two brothers as one travels to a distant marker and returns. |
| Gravity or acceleration? | Use Einstein's elevator to compare uniform gravity with an accelerating rocket. |
| Simultaneity of events | Switch between platform and train frames to see why simultaneous lightning strikes need not remain simultaneous. |
| Racing Andromeda's light | Follow a near-light-speed journey and compare what Earth and the traveller see of Andromeda's history. |
| Gravity is a two-body dance | Change mass ratio and sideways speed to create planetary wobbles, binary-star orbits, collisions, and escape trajectories. |
| Three bodies, no simple orbit | Set the mass of each body, starting speed, and spacing; compare a figure-eight orbit, unequal stars, and a star with two planets. |
| At the event horizon | Compare a falling astronaut's experience with delayed, redshifted signals received on Earth. |
| Electric fields & magnetism | Change electron flow and follow a positive probe beside a wire. Compare its magnetic force in the wire frame with its electric force in the probe frame. |
| Double slit experiment | Watch individual detections build five interference bands, observe the paths for two bands, or close one slit for a band on the open side. Patterns use a fixed, schematic detector view. |

## Run locally

Prerequisite: a current Node.js LTS release.

```bash
npm install
npm run dev
```

Vite prints the local URL after starting the development server.

## Commands

```bash
npm run dev        # Start the development server
npm run build      # Type-check and create a production build
npm test           # Run the physics test suite once
npm run test:watch # Re-run tests while files change
npm run appimage   # Build a Linux AppImage in release/
```

## Linux desktop app

The [GitHub Releases](https://github.com/tefaz/interactive-physics-website/releases) page includes a portable Linux AppImage. After downloading it, make it executable and run it:

```bash
chmod +x Fun-Physics-Demos-*.AppImage
./Fun-Physics-Demos-*.AppImage
```

The AppImage bundles the app and does not need a separate Node.js installation.

## Project structure

```text
src/
├── components/  Shared scene shell, controls, and character illustrations
├── hooks/       Viewport-aware animation and simulation playback hooks
├── physics/     Rendering-independent models, constants, and tests
├── scenarios/   Per-demo interaction state and SVG scenes
└── utils/       Formatting helpers
```

## Physics and visual notes

- The two-body gravity demo integrates both bodies with velocity Verlet to reduce energy drift compared with a basic Euler step.
- The three-body demo integrates all pairwise pulls with velocity Verlet. Very close approaches use softened gravity and shorter time steps to keep the simulation stable.
- The double-slit demo samples individual detections from spreading Gaussian slit amplitudes. A nearby screen resolves two slit images; a distant screen shows fringes only when both paths are available and indistinguishable.
- Relativity demos use idealized setups—for example, instantaneous turnaround in the twin paradox—to focus on the underlying principle.
- The black-hole experiment uses Schwarzschild expressions for an `E = 1` radial geodesic and outgoing signal arrival times; its artwork is schematic.
- The electricity demo uses a positive probe initially moving alongside the electron flow. The wire is neutral in its own frame and positively charged in the probe's frame. Its charge spacing and the probe's bend are deliberately enlarged to show the effect.

Physical values and visual coordinates are kept separate throughout the project, and each scene labels its important approximations.
