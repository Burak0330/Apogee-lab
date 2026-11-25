![APOGEE Orbital Lab cover showing three glowing orbital paths around a star](docs/cover.png)

# APOGEE Orbital Lab

**Give gravity something to do.** APOGEE is a browser sandbox for launching probes, watching orbits unfold, and experimenting with a live Newtonian gravity simulation.

## Run it locally

With Python 3 installed, run this from the project directory.

```sh
python3 -m http.server 8080
```

Open [localhost:8080](http://localhost:8080). The app uses native JavaScript modules and Canvas 2D. There are no dependencies to install.

## Flight controls

| Control | What it does |
| --- | --- |
| Drag on the plot | Launch a probe from the starting point. Direction sets heading and distance sets speed. |
| Focus the plot and press Enter | Launch a probe from a preset position. |
| Speed | Run at 0.25× to 4× simulation speed. |
| Pause, Reset, and Show orbital trails | Freeze time, reload the active scenario, or toggle its traces. |

Try **Resonance** for three planets with roughly 1:2:4 orbital periods, **Binary stars** for two suns orbiting their shared center, or **Gravity assist** to watch a probe skim past a moving planet.

## How it works

Every massive body attracts every other body. The engine uses a fixed 120 Hz velocity Verlet step and softens gravity at close range to keep the force finite. Probes respond to gravity without influencing the other bodies. The lab uses arbitrary units and omits collisions.

## Checks and deployment

Run `npm run check` with Node.js 24 to verify JavaScript syntax and run the physics tests.

To publish the demo, push the project to a GitHub repository on the `main` branch. Select **GitHub Actions** under **Settings → Pages → Build and deployment**, then run the **GitHub Pages** workflow. Later pushes to `main` trigger redeployment.
