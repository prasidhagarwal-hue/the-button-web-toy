# THE BUTTON

> *"DO NOT PRESS THE BUTTON."* It sits in the center of the screen, completely isolated, starkly illuminated, and explicitly forbidden. You know you shouldn't. You will anyway.

A delightfully subversive, chaotic, and progressive web toy built entirely with **Vanilla HTML, CSS, and JavaScript** — zero external frameworks, zero asset dependencies, and zero regrets.

---

## What is it?

**THE BUTTON** is an experimental, exploration-driven interactive web experience disguised as a classified containment terminal. 

It begins with a simple, unmistakable directive: **Do not click.** But the moment curiosity wins, the system reacts. Every press, pause, twitch, and keystroke unravels a narrative of humorous resistance, system instability, and escalating chaos. As you push further into the containment anomaly, the interface evolves dynamically through distinct psychological stages — unlocking secret experimental protocols, unmasking redacted incident logs, and challenging you to uncover hidden interactive curiosities.

---

## Features

- ⚡ **6 Progressive Stages of Escalation**: Watch the interface transform from a sterile warning terminal to passive-aggressive defiance, existential dread, thermal meltdown, and full-blown singularity corruption.
- 🎛️ **Live Telemetry & Score Engine**: Real-time *Mistakes Made* counter, dynamic *Anomaly Score* multiplier, containment integrity progress bar, and responsive optical status diode.
- 🏆 **19 Discovery Achievements**: A dedicated Containment Archives modal tracking milestones, discipline tests, tactile interactions, and unlisted secret discoveries.
- 🧪 **Unlockable Experimental Protocols Dock**:
  - **🧲 Gravity Field**: Cursor magnetism drawing the button toward your mouse.
  - **👥 Ghost Decoys**: Spawns evasive duplicate buttons that scatter upon interaction.
  - **🎹 Chaos Chords**: Musical arpeggios synthesized on every subsequent click.
- 🔊 **100% Procedural Audio Engine**: Powered entirely by the native browser **Web Audio API** — clicks, mechanical thuds, warning buzzers, disco synthesizers, and tape-stop reboots generated in real-time with zero external MP3s.
- 🌌 **Canvas 2D Physics & Particle FX**: High-performance starfield backdrop, responsive cursor interaction sparks, shockwaves, and celebratory milestone confetti bursts.
- 📁 **Classified Incident Basement**: Scroll beneath the primary viewport to inspect restricted incident logs, interactive rubber stamps, and declassifiable redacted intelligence.
- 💾 **Robust Session Persistence & Amnesia Reset**: Automatic `localStorage` synchronization with graceful recovery from corrupted data and an intentional *Amnesia Protocol* reset.
- ♿ **Accessible & Fully Responsive**: Keyboard accessible (`Space`/`Enter`), high-contrast `:focus-visible` styling, fluid viewport scaling across mobile, tablet, and desktop displays.

---

## Tech Stack

| Technology | Role |
|---|---|
| **HTML5** | Semantic structure, ARIA accessibility attributes, modal dialogs, and classified document markup |
| **CSS3** | Vanilla styling, custom CSS properties/tokens, responsive typography (`clamp()`), fluid layout, keyframe animations, glassmorphic depth, and high-contrast focus rings |
| **JavaScript (ES6+)** | Pure Vanilla JS, IIFE modular architecture, state machine progression, custom event buses, Canvas 2D physics loop, and Web Audio API procedural synthesis |
| **LocalStorage API** | Resilient client-side persistence for click counts, high scores, discovered secrets, protocol toggle states, and corruption levels |

*Zero dependencies: No React, no Tailwind, no jQuery, no external audio files, and no npm packages required.*

---

## How to Run

Because THE BUTTON is built with pure web standards, no compilation, bundler, or build step is necessary.

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/the-button.git
cd the-button
```

### 2. Launch in Browser
You can launch the experience immediately using any of the following methods:

- **Direct File Launch**: Simply double-click `index.html` to open it in Google Chrome, Mozilla Firefox, Microsoft Edge, or Apple Safari.
- **Python Local Server**:
  ```bash
  python -m http.server 8000
  ```
  *Then visit `http://localhost:8000`.*
- **Node `npx serve`**:
  ```bash
  npx serve .
  ```
- **VS Code Live Server**: Right-click `index.html` and select **"Open with Live Server"**.

---

## Interactions

THE BUTTON is designed to be played like an exploratory puzzle toy. Here are some publicly discoverable interactions to try:

- **Single Click**: The cardinal sin. Defy the initial directive and see what happens.
- **Rapid Double Click**: Click in quick succession to test the button's recoil suspension.
- **Sustained Pressure**: Press and hold down on the button for several continuous seconds to build thermal charge.
- **Cursor Agitation**: Wave your mouse rapidly over the button until its mechanical gyroscopes lose balance.
- **Zen Patience**: Can you stop clicking completely and let the terminal idle in silence?
- **Deep Scroll**: Scroll past the viewport boundary into the underground maintenance vault.
- **Cable Tampering**: Look for vulnerable hardware in the basement and sever the emergency override cable.
- **Keyboard Conversations**: The terminal is always listening. Try typing words of politeness, caffeine cravings, or classic video game sequences.
- **Optical Diode**: Click on the HUD telemetry status indicator light multiple times.

*(Additional classified secrets and Easter eggs remain hidden for curious players to uncover).*

---

## Screenshots

<!-- Add your screenshots in an /assets or /screenshots directory and update the links below -->

| The Warning (Stage 0) | Passive-Aggressive Escalation (Stage 2) |
|:---:|:---:|
| ![Stage 0 Warning Placeholder](https://via.placeholder.com/600x340/0a0a0f/ff3b30?text=THE+BUTTON+-+STAGE+0) | ![Stage 2 Escalation Placeholder](https://via.placeholder.com/600x340/120f08/ff9f0a?text=THE+BUTTON+-+STAGE+2) |

| Thermal Meltdown & Protocols (Stage 4) | Containment Archives & Achievements |
|:---:|:---:|
| ![Stage 4 Meltdown Placeholder](https://via.placeholder.com/600x340/1a0505/ff453a?text=THE+BUTTON+-+STAGE+4) | ![Achievements Drawer Placeholder](https://via.placeholder.com/600x340/0d0e14/64d2ff?text=ACHIEVEMENTS+DRAWER) |

---

## Demo

- 🌐 **Live Interactive Website**: `https://your-username.github.io/the-button/` *(Coming soon)*
- 📹 **Gameplay Walkthrough Video**: `https://www.youtube.com/watch?v=your-demo-video-id` *(Coming soon)*

---

## Project Structure

```
Webtoy/
├── index.html     # Semantic structure, accessible HUD, modal dialogs, and archives
├── style.css      # Design token system, responsive typography, keyframe animations, and stage themes
├── script.js      # State machine engine, Web Audio synthesizer, Canvas 2D particle system, and Easter eggs
├── .gitignore     # Exclusion rules for OS, editor, node, and temporary files
└── README.md      # Comprehensive technical documentation and exploration guide
```

### Key Architectural Highlights in `script.js`
- **State Machine (`State`)**: Encapsulates runtime progression, score calculations, and synchronization with `localStorage`.
- **Procedural Sound Engine (`Sound`)**: Synthesizes harmonic clicks, sub-bass rumbles, fanfare chords, and white noise sweeps via the Web Audio API.
- **Physics & Particle Engine (`Particles`)**: Manages the high-performance background starfield, cursor sparks, and celebratory confetti in Canvas 2D.
- **Input Pipeline**: Consolidated listeners handling pointer dynamics, multi-touch events, scroll offsets, long-press timers, and keyboard sequence buffers.

---

## What I Learned

Building **THE BUTTON** provided deep hands-on exploration of pure, dependency-free frontend engineering:

1. **State Machines in Vanilla JavaScript**: Architecting a deterministic, multi-stage state machine that coordinates visuals, sounds, and UI text without external reactive libraries.
2. **Procedural Web Audio API**: Designing expressive, tactile audio feedback (synthesizer arpeggios, frequency sweeps, noise envelopes) entirely in code, removing the network overhead of audio asset loading.
3. **Canvas 2D Particle Simulation**: Implementing smooth 60 FPS physics loops (gravity, velocity, rotational damping) on an overlay canvas layer without blocking user interaction.
4. **Resilient Client-Side Storage**: Structuring defensive serialization/deserialization routines that guard against corrupted `localStorage` data and provide instant state recovery.
5. **Accessibility & Cross-Platform Ergonomics**: Ensuring modern touch-target sizing (44px+), zero-overflow responsive fluid design (`clamp()`), and full keyboard navigation (`:focus-visible`, `tabindex`, ARIA roles).

---

*Made with questionable judgment and zero regrets. Do not press the button.*
