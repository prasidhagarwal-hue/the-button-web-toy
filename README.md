# THE BUTTON

An experimental, narrative-driven interactive web toy built entirely with pure web technologies.

---

## About

**THE BUTTON** is an exploratory interactive web toy disguised as a high-security containment terminal. At its core lies a simple, irresistible premise: **Do not click the button.** 

Once curiosity takes over, the terminal wakes up. Instead of an ordinary clicker, the application functions as a reactive state machine that dynamically evolves across progressive stages of psychological resistance. As the player continues to interact, the button defies input, deploys defensive mechanisms, hides mystery clues across the interface, and eventually challenges the player with an override puzzle that leads to branching narrative endings.

### How It Works
- **State Progression Engine:** A deterministic state machine tracks user actions, mistake counts, and corruption levels to trigger sequential stages of gameplay.
- **Dynamic Physics & Evasion:** The button calculates pointer distance and dynamically dodges the cursor using CSS transforms and velocity vectors.
- **Decoys & Shield Mechanics:** Real-time DOM instantiation spawns holographic decoys and protective shields that deflect user interaction.
- **Multi-Phase Puzzle Logic:** Players must investigate subtle UI anomalies, collect hidden code fragments, and enter the decrypted sequence into an on-screen cyber keypad.
- **Client-Side Persistence:** Session progression, unlocked achievements, and high scores automatically persist across browser reloads via `localStorage`.

---

## Features

- **Interactive Button:** Tactile button with recoil physics, responsive pointer tracking, charging mechanics, and dynamic feedback.
- **Dynamic Stages:** 5 progressive escalation phases transforming visual themes, warning messages, and terminal behavior.
- **Decoy Interactions:** Holographic duplicate buttons spawn in real time to distract and evade the player's cursor.
- **Hidden Clues:** Interactive anomalies hidden within terminal headers, mechanical collars, and classified basements.
- **Secret Puzzle:** A cyber security number pad requiring code discovery and input validation to bypass lockdown.
- **Multiple Endings:** A climactic decision terminal featuring three distinct story conclusions with dedicated epilogues.
- **Achievements:** Comprehensive Containment Archive modal tracking 19 unique milestone and secret achievements.
- **Easter Eggs:** Hidden keyboard sequences (including the Konami code), audit tampering alerts, cable severance events, and tab visibility detection.
- **LocalStorage Integration:** Automatic state synchronization that saves progress, high scores, and discovered badges.
- **Fluid CSS & Canvas Animations:** Custom keyframe transitions, CRT scanline effects, glassmorphic HUD overlays, and Canvas 2D particle bursts.

---

## Tech Stack

- **HTML5:** Semantic document structure, ARIA accessibility landmarks, and modal dialogs.
- **CSS3:** Custom CSS properties (design tokens), flexbox/grid layout, fluid typography (`clamp()`), and hardware-accelerated animations.
- **Vanilla JavaScript (ES6+):** Pure dependency-free script powering the state engine, DOM manipulation, Web Audio API synthesis, and event pipelines.
- **LocalStorage API:** Defensive client-side persistence for game state and achievement tracking.

---

## How to Run Locally

Because this project is built with vanilla web standards, it requires no package managers, dependencies, or build tools.

### 1. Clone the Repository
```bash
git clone https://github.com/prasidhagarwal-hue/the-button-web-toy.git
cd the-button-web-toy
```

### 2. Launch the Application

Choose any of the following methods:

- **Direct Browser Launch:** Double-click `index.html` to open it directly in any modern browser.
- **Python HTTP Server:**
  ```bash
  python -m http.server 8000
  ```
  Visit [http://localhost:8000](http://localhost:8000) in your browser.
- **Node `npx serve`:**
  ```bash
  npx serve .
  ```
- **VS Code:** Right-click `index.html` and select **"Open with Live Server"**.

---

## How to Play

1. **Observe the Directive:** The terminal clearly tells you not to click the button.
2. **Defy Instructions:** Click, hover, or interact with the interface to trigger the terminal's defense mechanisms.
3. **Overcome Evasion & Decoys:** Adapt when the button begins dodging your cursor and creating decoys.
4. **Investigate the Anomalies:** When containment lockdown occurs, inspect unusual interface elements to discover hidden code digits.
5. **Crack the Override:** Enter the 3-digit secret code into the security keypad to reach the final terminal stage.
6. **Choose Your Ending:** Decide the ultimate fate of The Button.

---

## Interactions

The experience is built around discovery. Key discoverable interactions include:

- **Single & Multi-Clicks:** Testing the button's suspension and escalating mistake tallies.
- **Press & Hold:** Building up sustained thermal energy to trigger containment warnings.
- **Cursor Agitation:** Rapid mouse movement over the button provoking defensive recoil.
- **Underground Vault Scroll:** Scrolling beneath the main viewport to inspect classified logs and emergency hardware.
- **Hardware Cable Severance:** Cutting the emergency backup cable to trigger an immediate high-voltage fault.
- **Interface Diode & HUD Tamper:** Clicking the optical status diode and mistake counter for audit violation reactions.
- **Keyboard Codes:** Typing contextual phrases or classic gaming sequences to trigger hidden responses.

---

## Project Structure

```
the-button-web-toy/
├── index.html     # Semantic structure, accessible HUD, modal dialogs, and archives
├── style.css      # Design token system, responsive layouts, stage themes, and animations
├── script.js      # Core state machine, DOM event handlers, Web Audio synthesis, and puzzle logic
├── .gitignore     # Exclusion rules for temporary files and OS metadata
└── README.md      # Project overview, documentation, and technical breakdown
```

### Key Modules in `script.js`
- **`State` & `Progression`:** Manages deterministic stage transitions, click counters, anomaly scoring, and local storage reconciliation.
- **`Sound` (Web Audio API):** Generates 100% procedural synthetic audio (clicks, rumbles, buzzers, victory fanfare) with zero external audio assets.
- **`Particles` (Canvas 2D):** Runs a background particle field, cursor interaction sparks, and celebratory confetti effects.
- **Input Pipeline:** Manages consolidated keyboard listeners, pointer coordinates, touch gestures, and event debouncing.

---

## Screenshots

<!-- Add your screenshots to an /assets or /screenshots directory and update the links below -->

| Stage 0: The Warning | Stage 2: Evasion & Decoys |
|:---:|:---:|
| ![Stage 0 Screenshot](https://via.placeholder.com/600x340/0a0a0f/ff3b30?text=Stage+0+-+The+Warning) | ![Stage 2 Screenshot](https://via.placeholder.com/600x340/120f08/ff9f0a?text=Stage+2+-+Decoys) |

| Stage 4: Cyber Keypad | Stage 5: Final Choice |
|:---:|:---:|
| ![Stage 4 Screenshot](https://via.placeholder.com/600x340/0d111a/00ff88?text=Stage+4+-+Keypad) | ![Stage 5 Screenshot](https://via.placeholder.com/600x340/1a1305/ffd700?text=Stage+5+-+Final+Choice) |

---

## Demo

- 🌐 **Live Demo:** [https://prasidhagarwal-hue.github.io/the-button-web-toy/](https://prasidhagarwal-hue.github.io/the-button-web-toy/)
- 📹 **Demo Video:** `[Coming Soon / YouTube Link]`

---

## Learning / Takeaways

Building **THE BUTTON** demonstrates core frontend software engineering concepts without relying on external libraries or frameworks:

- **DOM Manipulation:** High-frequency, dynamic creation and updating of DOM elements, CSS classes, attributes, and modal dialogs.
- **Robust Event Handling:** Coordinated event handling across pointers, touch, scroll, keyboard shortcuts, and custom delegated event listeners with debouncing.
- **State Machine Architecture:** Deterministic management of complex multi-stage progression and multiple branching outcomes.
- **Resilient Local Storage:** Defensive data serialization and deserialization guarding against corrupt or missing client-side state.
- **Pure CSS Animations & FX:** Combining keyframe sequences, 3D transforms, filters, and design tokens for a cohesive retro-futuristic terminal aesthetic.
- **Responsive & Accessible Design:** Fully fluid layouts utilizing `clamp()`, flexible CSS Grid/Flexbox, keyboard navigability (`:focus-visible`), and ARIA semantics.

---

*Do not press the button.*
