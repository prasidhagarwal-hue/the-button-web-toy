# THE BUTTON

> A mysterious button. Whatever you do, do **NOT** click it.

A progressively chaotic, strangely addictive web toy built with pure HTML, CSS & JavaScript.

---

## What is this?

THE BUTTON is a single-page interactive experience that starts deceptively simple and spirals into something much stranger the more you interact with it.

The page tells you not to click the button. You click it anyway. Things escalate.

---

## Features

- **6 progressive stages** — each with its own visual theme, color palette, and behavioral mutations
- **10 interactions** — clicking, double-clicking, right-clicking, hovering, keyboard input, idling, scrolling, resizing, dragging, and mouse patterns
- **12 achievements** — unlock them through exploration and experimentation  
- **8 Easter eggs** — hidden triggers reward curiosity
- **Score system** — click count + achievement bonuses + speed/patience bonuses
- **LocalStorage persistence** — your "corruption level" is remembered between sessions
- **Procedural audio** — sound effects generated via Web Audio API (no audio files)
- **Zero dependencies** — pure HTML, CSS, JavaScript

---

## How to Run

Just open `index.html` in any modern browser. No build step, no server required.

```
open index.html
```

Or host it on any static file host (GitHub Pages, Netlify, etc.).

---

## Interactions to Discover

Some hints... but not too many.

- Try clicking it. Obviously.
- Try *not* clicking it for a while.
- Try right-clicking it.
- Try double-clicking it.
- Try dragging it to a corner.
- Try typing things.
- Try drawing circles around it.
- Some things only happen after 42 of something.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Structure | HTML5 (semantic) |
| Styling | CSS3 (custom properties, keyframes, glassmorphism) |
| Logic | Vanilla JavaScript (ES6+, IIFE pattern) |
| Fonts | Google Fonts — Space Grotesk + Space Mono |
| Audio | Web Audio API |
| Storage | localStorage |
| Canvas | Canvas 2D (particles + starfield) |

---

## Architecture

```
Webtoy/
├── index.html     # Semantic structure
├── style.css      # Design system, stage themes, all animations
└── script.js      # State machine, interactions, achievements, Easter eggs
```

**JavaScript pattern:** A single IIFE with clearly separated modules:
- State persistence (localStorage)
- Stage engine (state machine)
- Interaction handlers (10 event-driven functions)
- Achievement system
- Easter egg system
- Web Audio engine
- Effects engine (particles, shake, glitch, starfield)

---

## Project Background

Built as a GitHub Club recruitment submission. The goal: create something useless, fun, and surprisingly addictive using only HTML, CSS, and JavaScript.

Mission accomplished (probably).

---

*Made with questionable judgment and zero regrets.*
