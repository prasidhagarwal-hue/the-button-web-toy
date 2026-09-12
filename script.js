/* ============================================================
   THE BUTTON — script.js
   Milestone 3: Progression, Score, Achievements & Gameplay
   ============================================================

   Modules:
     1. CONFIG       — Static data, messages, achievements, easter eggs
     2. STATE        — State management & LocalStorage persistence
     3. DOM          — Element caching
     4. AUDIO        — Web Audio API procedural synthesis
     5. FX & CANVAS  — Particle confetti, floating score, ghost decoys
     6. SCORE & ACH  — Score engine, 12 achievements, dialog rendering
     7. PROTOCOLS    — Unlockable interactions (Gravity, Decoys, Synth)
     8. BUTTON       — Core click, multiple clicks, double-click
     9. MOTION       — Mouse 3D tilt, proximity, dodge & dizzy detection
    10. KEYBOARD     — Space/Enter, word recognition, Konami Code
    11. SCROLL       — Classified basement reveal & interactive wire
    12. IDLE         — Snooze / wake-up & zen patience watcher
    13. CONTEXT      — Right-click custom menu easter egg
    14. RESET        — Amnesia Protocol (timeline wipe)
    15. INIT         — Bootstrap
   ============================================================ */

(function () {
  'use strict';

  /* ==========================================================
     1. CONFIG
     ========================================================== */

  const STORAGE_KEY = 'theButton_m3';
  const OLD_STORAGE_KEY = 'theButton_m2';

  const WARNINGS = [
    'DO NOT CLICK THE BUTTON.',
    'I TOLD YOU NOT TO CLICK IT.',
    'WHY WOULD YOU DO THAT.',
    'ARE YOU PROUD OF YOURSELF?',
    'You clicked it again.',
    'This is getting out of hand.',
    'The button has feelings, you know.',
    'FINE. KEEP CLICKING.',
    'THE BUTTON WILL REMEMBER THIS.',
    'Mistakes were made.',
    'You are actively defying instructions.',
    'There is no prize at the end of this.',
    'Seriously. Step away from the mouse.',
    'SYSTEM INTEGRITY: QUESTIONABLE.',
    'You really cannot help yourself, can you?'
  ];

  const SUB_WARNINGS = [
    'Something has shifted.',
    'The button is watching your cursor.',
    'This was strictly prohibited.',
    'Resistance is mathematically futile.',
    'Keep going and see what breaks.',
    'Your persistence is alarming.',
    'Containment failure probability rising.',
    'The button has lodged a formal complaint.'
  ];

  const TOOLTIPS = [
    "I'm serious.",
    "Don't do it.",
    "You will regret this.",
    "Last chance to turn back.",
    "Please, no.",
    "Step away slowly.",
    "Personal space, human.",
    "I can feel your cursor hovering."
  ];

  const KONAMI_CODE = [
    'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
    'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight',
    'b', 'a'
  ];

  const ACHIEVEMENTS = [
    {
      id: 'first_contact',
      icon: '⚡',
      title: 'First Contact',
      desc: 'First interaction with The Button. You had one job.',
      pts: 100
    },
    {
      id: 'cant_stop',
      icon: '📈',
      title: "Can't Stop",
      desc: 'Reached a click milestone of 10 mistakes.',
      pts: 200
    },
    {
      id: 'detective',
      icon: '🔍',
      title: 'Detective',
      desc: 'Discovered all 3 hidden anomaly clues in the interface.',
      pts: 350
    },
    {
      id: 'rule_breaker',
      icon: '🔌',
      title: 'Rule Breaker',
      desc: 'Triggered a secret classified interaction.',
      pts: 250
    },
    {
      id: 'nice_try',
      icon: '🎭',
      title: 'Nice Try',
      desc: 'Fell for a decoy button deception.',
      pts: 150
    },
    {
      id: 'system_breaker',
      icon: '👑',
      title: 'System Breaker',
      desc: 'Cracked the security keypad and reached the final stage.',
      pts: 500
    },
    {
      id: 'double_trouble',
      icon: '💥',
      title: 'Impatience Incarnate',
      desc: 'Double-clicked because one mistake was not enough.',
      pts: 150
    },
    {
      id: 'dizzy_motion',
      icon: '🌀',
      title: 'Motion Sickness',
      desc: 'Shook your cursor until the button got dizzy.',
      pts: 150
    },
    {
      id: 'zen_master',
      icon: '🧘',
      title: 'Zen Discipline',
      desc: 'Resisted clicking for 20 continuous seconds.',
      pts: 250
    },
    {
      id: 'archivist',
      icon: '📁',
      title: 'Classified Intruder',
      desc: 'Scrolled into the restricted containment archives.',
      pts: 150
    },
    {
      id: 'saboteur',
      icon: '⚡',
      title: 'Emergency Tamperer',
      desc: 'Severed the emergency override cable in the basement.',
      pts: 300
    },
    {
      id: 'diplomat',
      icon: '🕊️',
      title: 'The Apologist',
      desc: 'Submitted a formal apology to The Button.',
      pts: 200
    },
    {
      id: 'sweet_tooth',
      icon: '🍪',
      title: 'Sweet Tooth',
      desc: 'Offered The Button virtual chocolate chip cookies.',
      pts: 150
    },
    {
      id: 'retro_gamer',
      icon: '🕹️',
      title: 'The Ancient Code',
      desc: 'Entered the sacred Konami disco cheat sequence.',
      pts: 500
    },
    {
      id: 'ghost',
      icon: '👁️',
      title: 'Vanishing Act',
      desc: 'Left the browser tab and returned to face the consequences.',
      pts: 150
    },
    {
      id: 'caffeine_overdose',
      icon: '☕',
      title: 'Barista Protocol',
      desc: 'Typed "coffee" to hyper-charge the button with espresso.',
      pts: 250
    },
    {
      id: 'morse_operator',
      icon: '📡',
      title: 'Distress Beacon',
      desc: 'Tapped the optical status diode 5 times to broadcast SOS.',
      pts: 300
    },
    {
      id: 'whistleblower',
      icon: '🕵️',
      title: 'Declassified Leak',
      desc: 'Scratched away all top-secret redaction bars in the archives.',
      pts: 250
    },
    {
      id: 'answer_to_everything',
      icon: '🌌',
      title: 'The Ultimate Answer',
      desc: 'Reached exactly 42 mistakes. Always know where your towel is.',
      pts: 420
    }
  ];

  /* ==========================================================
     2. STATE
     ========================================================== */

  const DEFAULT_STATE = {
    clickCount:        0,
    doubleClicks:      0,
    score:             0,
    stage:             0,
    achievements:      [], // Array of unlocked IDs
    protocols: {
      gravity: false,
      clones:  false,
      synth:   false
    },
    cablePulled:       false,
    konamiUnlocked:    false,
    apologiesGiven:    0,
    cookiesGiven:      0,
    firstVisitDate:    null,
    lastVisitDate:     null,
    // Stage 2 (Fight Back):
    stage2Interactions:0,
    // Stage 3 (Investigation Clues: 7, 4, 2):
    cluesFound:        [false, false, false],
    // Stage 4 (Keypad):
    keypadInput:       '',
    keypadUnlocked:    false,
    // Stage 5 & Final Choice:
    gameCompleted:     false,
    finalChoice:       null
  };

  let state = { ...DEFAULT_STATE };

  function loadState() {
    try {
      let raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        raw = localStorage.getItem(OLD_STORAGE_KEY);
      }
      if (raw) {
        const parsed = JSON.parse(raw);
        state = {
          ...DEFAULT_STATE,
          ...parsed,
          protocols: { ...DEFAULT_STATE.protocols, ...(parsed.protocols || {}) },
          achievements: Array.isArray(parsed.achievements) ? parsed.achievements : [],
          cluesFound: Array.isArray(parsed.cluesFound) ? parsed.cluesFound : [false, false, false],
          stage2Interactions: typeof parsed.stage2Interactions === 'number' ? parsed.stage2Interactions : 0
        };

        // Reconcile stage progression
        if (state.gameCompleted || state.stage === 5 || state.keypadUnlocked) {
          state.stage = 5;
        } else if (state.stage === 4 || (state.cluesFound && state.cluesFound.every(Boolean))) {
          state.stage = 4;
          state.keypadUnlocked = false; // Keypad is ready to receive input in Stage 4
        } else if (state.stage === 3) {
          state.stage = 3;
        } else if (state.stage === 2 || state.clickCount >= 6) {
          state.stage = 2;
        } else if (state.clickCount >= 1) {
          state.stage = 1;
        } else {
          state.stage = 0;
        }
      }
    } catch (_) { /* LocalStorage fallback */ }
  }

  function saveState() {
    if (window._suppressSaveState) return;
    try {
      state.lastVisitDate = new Date().toISOString();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (_) { /* Silent */ }
  }

  /* ==========================================================
     3. DOM CACHE
     ========================================================== */

  const D = {};

  function cacheDOM() {
    const g = id => document.getElementById(id);
    D.body                 = document.body;
    D.fxCanvas             = g('fx-canvas');
    D.floatingScores       = g('floating-scores');
    D.hudLeft              = g('hud-left');
    D.hudStatusLed         = g('hud-status-led');
    D.hudStage             = g('hud-stage');
    D.hudBarFill           = g('hud-bar-fill');
    D.hudLabel             = g('hud-label');
    D.hudRight             = g('hud-right');
    D.scoreBox             = g('hud-score-box');
    D.scoreValue           = g('score-value');
    D.counterBox           = g('hud-counter-box');
    D.counterValue         = g('counter-value');
    D.resetMistakesBtn     = g('reset-mistakes-btn');
    D.hudControls          = g('hud-controls');
    D.achievementsBtn      = g('achievements-btn');
    D.achievementsBadge    = g('achievements-badge');
    D.resetBtn             = g('reset-btn');
    D.muteBtn              = g('mute-btn');
    D.arena                = g('arena');
    D.directiveTag         = g('directive-tag');
    D.warningText          = g('warning-text');
    D.warningSub           = g('warning-sub');
    D.buttonWrap           = g('button-wrap');
    D.button               = g('the-button');
    D.btnLabel             = g('btn-label');
    D.tooltip              = g('tooltip');
    D.hintText             = g('hint-text');
    D.protocolsDock        = g('protocols-dock');
    D.protoGravity         = g('proto-gravity');
    D.protoClones          = g('proto-clones');
    D.protoSynth           = g('proto-synth');
    D.scrollIndicator      = g('scroll-indicator');
    D.basement             = g('basement');
    D.wireBtn              = g('wire-btn');
    D.wireStatus           = g('wire-status');
    D.contextMenu          = g('custom-context-menu');
    D.achievementsDialog   = g('achievements-dialog');
    D.closeDialogBtn       = g('close-dialog-btn');
    D.dialogUnlockedBadge  = g('dialog-unlocked-badge');
    D.dialogScoreVal       = g('dialog-score-val');
    D.dialogStageVal       = g('dialog-stage-val');
    D.dialogCorruptionVal  = g('dialog-corruption-val');
    D.achievementsGrid     = g('achievements-grid');
    D.dialogWipeBtn        = g('dialog-wipe-btn');
    D.resetDialog          = g('reset-dialog');
    D.confirmResetBtn      = g('confirm-reset-btn');
    D.cancelResetBtn       = g('cancel-reset-btn');
    D.toastContainer       = g('toast-container');
    D.classifiedStamp      = g('classified-stamp');
    D.redactedSpans        = document.querySelectorAll('.redacted');
    D.containmentShield    = g('containment-shield');
    D.endingDialog         = g('ending-dialog');
    D.endingMistakesVal    = g('ending-mistakes-val');
    D.endingScoreVal       = g('ending-score-val');
    D.endingSecretsVal     = g('ending-secrets-val');
    D.btnEndingHarmony     = g('btn-ending-harmony');
    D.btnEndingPurge       = g('btn-ending-purge');
    D.btnEndingClose       = g('btn-ending-close');

    // New Stages 2, 3, 4, 5 Elements:
    D.clue1                = g('clue-1');
    D.clue2                = g('clue-2');
    D.clue3                = g('clue-3');
    D.investigationBar     = g('investigation-bar');
    D.investigationStatus  = g('investigation-status');
    D.clueSlots            = [g('slot-clue-0'), g('slot-clue-1'), g('slot-clue-2')];
    D.decoysLayer          = g('decoys-layer');
    D.keypadPanel          = g('keypad-panel');
    D.keypadDisplay        = g('keypad-display');
    D.kDigits              = [g('k-digit-0'), g('k-digit-1'), g('k-digit-2')];
    D.hintDigitsText       = g('hint-digits-text');
    D.keypadStatus         = g('keypad-status');
    D.stage5ChoicePanel    = g('stage5-choice-panel');
    D.choiceDestroy        = g('choice-destroy');
    D.choiceFree           = g('choice-free');
    D.choiceLeave          = g('choice-leave');
    D.outcomeDialog        = g('outcome-dialog');
    D.outcomeBadge         = g('outcome-badge');
    D.outcomeIcon          = g('outcome-icon');
    D.outcomeTitle         = g('outcome-title');
    D.outcomeNarrative     = g('outcome-narrative');
    D.outcomeResetBtn      = g('outcome-reset-btn');
    D.outcomeSandboxBtn    = g('outcome-sandbox-btn');
  }

  /* ==========================================================
     4. AUDIO ENGINE (Web Audio API)
     ========================================================== */

  let audioCtx = null;
  let isMuted  = false;

  function getAudioCtx() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  }

  function playTone(freq, duration, type = 'sine', gain = 0.2, delay = 0) {
    if (isMuted) return;
    try {
      const ctx = getAudioCtx();
      const t   = ctx.currentTime + delay;
      const osc = ctx.createOscillator();
      const env = ctx.createGain();
      osc.connect(env);
      env.connect(ctx.destination);
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t);
      env.gain.setValueAtTime(gain, t);
      env.gain.exponentialRampToValueAtTime(0.001, t + duration);
      osc.start(t);
      osc.stop(t + duration + 0.01);
    } catch (_) {}
  }

  const Sound = {
    click() {
      const base = Math.min(180 + state.clickCount * 10, 560);
      playTone(base, 0.12, 'square', 0.14);
      playTone(base * 1.5, 0.08, 'sine', 0.08, 0.04);
    },
    recoil() {
      playTone(550, 0.08, 'sawtooth', 0.22);
      playTone(720, 0.15, 'sawtooth', 0.25, 0.08);
      playTone(340, 0.25, 'triangle', 0.2, 0.16);
    },
    dizzy() {
      const ctx = getAudioCtx();
      if (isMuted || !ctx) return;
      try {
        const t = ctx.currentTime;
        const osc = ctx.createOscillator();
        const env = ctx.createGain();
        osc.connect(env);
        env.connect(ctx.destination);
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(400, t);
        osc.frequency.linearRampToValueAtTime(120, t + 0.6);
        env.gain.setValueAtTime(0.15, t);
        env.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
        osc.start(t);
        osc.stop(t + 0.61);
      } catch (_) {}
    },
    snooze() {
      playTone(130, 0.7, 'sine', 0.1);
      playTone(110, 0.9, 'sine', 0.08, 0.4);
    },
    wake() {
      playTone(320, 0.08, 'triangle', 0.18);
      playTone(640, 0.15, 'sine', 0.2, 0.06);
    },
    secret() {
      const notes = [523.25, 659.25, 783.99, 1046.50];
      notes.forEach((n, i) => playTone(n, 0.15, 'square', 0.16, i * 0.1));
    },
    zap() {
      playTone(80, 0.35, 'sawtooth', 0.3);
      playTone(240, 0.2, 'square', 0.25, 0.05);
      playTone(60, 0.4, 'sawtooth', 0.35, 0.12);
    },
    buzz() {
      playTone(110, 0.22, 'sawtooth', 0.2);
      playTone(85, 0.28, 'sawtooth', 0.22, 0.08);
    },
    chime() {
      playTone(659.25, 0.2, 'triangle', 0.2);
      playTone(880, 0.3, 'sine', 0.2, 0.1);
    },
    pop() {
      playTone(480, 0.05, 'sine', 0.12);
    },
    achievement() {
      // Fanfare: F4, A4, C5, F5
      const fanfare = [349.23, 440.00, 523.25, 698.46];
      fanfare.forEach((n, i) => playTone(n, 0.22, 'triangle', 0.22, i * 0.12));
    },
    scoreFloat() {
      playTone(880, 0.08, 'sine', 0.15);
      playTone(1320, 0.12, 'triangle', 0.12, 0.06);
    },
    synthNote() {
      const scale = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25];
      const pitch = scale[Math.floor(Math.random() * scale.length)];
      playTone(pitch, 0.35, 'sawtooth', 0.18);
      playTone(pitch * 1.5, 0.25, 'sine', 0.12, 0.05);
    },
    reboot() {
      const ctx = getAudioCtx();
      if (isMuted || !ctx) return;
      try {
        const t = ctx.currentTime;
        const osc = ctx.createOscillator();
        const env = ctx.createGain();
        osc.connect(env);
        env.connect(ctx.destination);
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(600, t);
        osc.frequency.exponentialRampToValueAtTime(40, t + 0.8);
        env.gain.setValueAtTime(0.3, t);
        env.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
        osc.start(t);
        osc.stop(t + 0.81);
      } catch (_) {}
    },
    charging(progress) {
      const freq = 120 + progress * 580;
      playTone(freq, 0.1, 'sawtooth', 0.15);
    },
    giggle() {
      const pitches = [520, 680, 590, 780, 880];
      pitches.forEach((p, i) => playTone(p, 0.08, 'sine', 0.18, i * 0.06));
    },
    beep() {
      playTone(880, 0.06, 'triangle', 0.16);
    },
    morse(isDash) {
      const dur = isDash ? 0.22 : 0.08;
      playTone(750, dur, 'sine', 0.2);
    },
    stamp() {
      playTone(85, 0.18, 'triangle', 0.35);
      playTone(180, 0.08, 'square', 0.2, 0.02);
    },
    deflect() {
      playTone(150, 0.12, 'sawtooth', 0.22);
      playTone(95, 0.18, 'square', 0.24, 0.04);
    },
    relay() {
      playTone(180, 0.08, 'square', 0.28);
      playTone(520, 0.16, 'triangle', 0.22, 0.04);
      playTone(660, 0.2, 'sine', 0.18, 0.08);
    },
    steam() {
      playTone(280, 0.25, 'triangle', 0.2);
      playTone(420, 0.35, 'sawtooth', 0.15, 0.05);
    },
    victory() {
      const chords = [523.25, 659.25, 783.99, 1046.50, 1318.51];
      chords.forEach((n, i) => playTone(n, 0.45, 'sine', 0.16, i * 0.09));
    }
  };

  /* ==========================================================
     5. FX & CANVAS PARTICLES (Ambient Motes + Confetti Engine)
     ========================================================== */

  let canvasCtx = null;
  let particles = [];
  let ambientMotes = [];
  let animId = null;
  let mouseX = -9999;
  let mouseY = -9999;

  function initCanvas() {
    if (!D.fxCanvas) return;
    canvasCtx = D.fxCanvas.getContext('2d');
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas, { passive: true });

    window.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    }, { passive: true });

    createAmbientMotes();
    startAnimLoop();

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        if (animId) {
          cancelAnimationFrame(animId);
          animId = null;
        }
      } else {
        startAnimLoop();
      }
    });
  }

  function createAmbientMotes() {
    ambientMotes = [];
    const count = Math.min(Math.floor(window.innerWidth / 32), 40);
    for (let i = 0; i < count; i++) {
      ambientMotes.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.25 - 0.12,
        radius: Math.random() * 1.5 + 0.6,
        baseAlpha: Math.random() * 0.3 + 0.1,
        alpha: Math.random() * 0.3 + 0.1,
        phase: Math.random() * Math.PI * 2,
        phaseSpeed: Math.random() * 0.02 + 0.008
      });
    }
  }

  function resizeCanvas() {
    if (!D.fxCanvas) return;
    D.fxCanvas.width = window.innerWidth;
    D.fxCanvas.height = window.innerHeight;
    createAmbientMotes();
  }

  function startAnimLoop() {
    if (!animId && canvasCtx) {
      animId = requestAnimationFrame(animateParticles);
    }
  }

  const FX = {
    confetti(sourceX, sourceY) {
      if (!canvasCtx) return;
      const x = sourceX || window.innerWidth / 2;
      const y = sourceY || window.innerHeight / 2;
      const colors = ['#ffd700', '#ff4757', '#e056fd', '#00ff88', '#00d2d3', '#ffa502', '#ffffff'];

      for (let i = 0; i < 48; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 8 + 3;
        particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 2,
          size: Math.random() * 6 + 4,
          color: colors[Math.floor(Math.random() * colors.length)],
          rotation: Math.random() * 360,
          vRot: (Math.random() - 0.5) * 12,
          alpha: 1,
          decay: Math.random() * 0.015 + 0.012
        });
      }

      startAnimLoop();
    },

    floatScore(text, x, y) {
      if (!D.floatingScores) return;
      const el = document.createElement('div');
      el.className = 'floating-score';
      el.textContent = text;
      const posX = x || (window.innerWidth / 2 + (Math.random() * 60 - 30));
      const posY = y || (window.innerHeight / 2 - 40);
      el.style.left = `${posX}px`;
      el.style.top = `${posY}px`;
      D.floatingScores.appendChild(el);
      setTimeout(() => el.remove(), 1400);
    },

    spawnGhost(x, y) {
      const g = document.createElement('div');
      g.className = 'ghost-decoy';
      g.innerHTML = 'DO NOT<br>CLICK';
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * 90 + 50;
      const gx = Math.cos(angle) * dist;
      const gy = Math.sin(angle) * dist;
      g.style.left = `${x}px`;
      g.style.top = `${y}px`;
      g.style.setProperty('--gx', `${gx.toFixed(0)}px`);
      g.style.setProperty('--gy', `${gy.toFixed(0)}px`);
      document.body.appendChild(g);
      setTimeout(() => g.remove(), 1200);
    },

    spawnSteam(x, y) {
      if (!canvasCtx) return;
      const colors = ['#00ff88', '#55efc4', '#ffffff', '#a8ff78'];
      for (let i = 0; i < 16; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 4 + 1;
        particles.push({
          x: x || window.innerWidth / 2,
          y: y || window.innerHeight / 2,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 1.5,
          size: Math.random() * 5 + 3,
          color: colors[Math.floor(Math.random() * colors.length)],
          rotation: 0,
          vRot: 0,
          alpha: 0.9,
          decay: Math.random() * 0.02 + 0.02
        });
      }
      startAnimLoop();
    }
  };

  function animateParticles() {
    if (!canvasCtx) return;
    canvasCtx.clearRect(0, 0, D.fxCanvas.width, D.fxCanvas.height);

    // 1. Render ambient subtle cosmic dust motes
    const w = D.fxCanvas.width;
    const h = D.fxCanvas.height;

    for (let i = 0; i < ambientMotes.length; i++) {
      const m = ambientMotes[i];
      m.x += m.vx;
      m.y += m.vy;
      m.phase += m.phaseSpeed;
      m.alpha = m.baseAlpha + Math.sin(m.phase) * 0.12;

      // Soft interactive mouse drift
      const dx = m.x - mouseX;
      const dy = m.y - mouseY;
      const distSq = dx * dx + dy * dy;
      if (distSq < 14400 && distSq > 0) { // 120px radius
        const dist = Math.sqrt(distSq);
        const force = ((120 - dist) / 120) * 0.35;
        m.x += (dx / dist) * force;
        m.y += (dy / dist) * force;
      }

      // Screen wrapping
      if (m.x < -10) m.x = w + 10;
      else if (m.x > w + 10) m.x = -10;
      if (m.y < -10) m.y = h + 10;
      else if (m.y > h + 10) m.y = -10;

      canvasCtx.beginPath();
      canvasCtx.arc(m.x, m.y, m.radius, 0, Math.PI * 2);
      canvasCtx.fillStyle = `rgba(220, 220, 255, ${Math.max(0.02, m.alpha)})`;
      canvasCtx.fill();
    }

    // 2. Render active celebration confetti particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.22; // Gravity
      p.vx *= 0.98; // Air drag
      p.rotation += p.vRot;
      p.alpha -= p.decay;

      if (p.alpha <= 0 || p.y > h + 20) {
        particles.splice(i, 1);
        continue;
      }

      canvasCtx.save();
      canvasCtx.globalAlpha = Math.max(p.alpha, 0);
      canvasCtx.translate(p.x, p.y);
      canvasCtx.rotate((p.rotation * Math.PI) / 180);
      canvasCtx.fillStyle = p.color;
      canvasCtx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      canvasCtx.restore();
    }

    animId = requestAnimationFrame(animateParticles);
  }

  function addBodyClass(cls, fallbackMs = 500) {
    if (D.body.classList.contains(cls)) return;
    D.body.classList.add(cls);
    const cleanup = () => D.body.classList.remove(cls);
    D.body.addEventListener('animationend', cleanup, { once: true });
    setTimeout(cleanup, fallbackMs);
  }

  function triggerFlash(colorRgba = 'rgba(255,255,255,0.15)') {
    const el = document.createElement('div');
    el.style.cssText = `
      position:fixed;inset:0;
      background:${colorRgba};
      pointer-events:none;z-index:9999;
      opacity:1;transition:opacity 0.3s ease;
    `;
    document.body.appendChild(el);
    requestAnimationFrame(() => {
      el.style.opacity = '0';
      el.addEventListener('transitionend', () => el.remove(), { once: true });
    });
  }

  function showToast(title, body, ms = 3800) {
    const t = document.createElement('div');
    t.className = 'toast';
    t.innerHTML = `<div class="toast-title">${title}</div><div class="toast-body">${body}</div>`;
    D.toastContainer.appendChild(t);

    requestAnimationFrame(() => requestAnimationFrame(() => t.classList.add('show')));

    setTimeout(() => {
      t.classList.remove('show');
      t.addEventListener('transitionend', () => t.remove(), { once: true });
    }, ms);
  }

  /* ==========================================================
     6. SCORE & ACHIEVEMENTS ENGINE
     ========================================================== */

  function addScore(amount, reason = '', x = null, y = null) {
    state.score += amount;
    D.scoreValue.textContent = state.score.toLocaleString();
    D.scoreValue.classList.add('pop');
    setTimeout(() => D.scoreValue.classList.remove('pop'), 160);

    Sound.scoreFloat();

    const label = reason ? `+${amount} ${reason}` : `+${amount} PTS`;
    FX.floatScore(label, x, y);

    // Update dialog if open
    if (D.dialogScoreVal) D.dialogScoreVal.textContent = state.score.toLocaleString();
    saveState();
  }

  function unlockAchievement(id) {
    if (state.achievements.includes(id)) return false;

    const ach = ACHIEVEMENTS.find(a => a.id === id);
    if (!ach) return false;

    state.achievements.push(id);
    addScore(ach.pts, '🏆');

    Sound.achievement();
    FX.confetti();

    showToast(
      `🏆 ACHIEVEMENT UNLOCKED`,
      `<strong>${ach.title}</strong>: ${ach.desc} (+${ach.pts} PTS)`,
      4500
    );

    updateAchievementsBadge();
    updateProtocols();
    renderAchievementsList();
    saveState();
    return true;
  }

  function updateAchievementsBadge() {
    const count = state.achievements.length;
    const badgeText = `${count}/${ACHIEVEMENTS.length}`;
    if (D.achievementsBadge) D.achievementsBadge.textContent = badgeText;
    if (D.dialogUnlockedBadge) D.dialogUnlockedBadge.textContent = badgeText;
  }

  function renderAchievementsList() {
    if (!D.achievementsGrid) return;
    D.achievementsGrid.innerHTML = '';

    ACHIEVEMENTS.forEach(ach => {
      const isUnlocked = state.achievements.includes(ach.id);
      const card = document.createElement('div');
      card.className = `achieve-card ${isUnlocked ? 'unlocked' : 'locked'}`;

      card.innerHTML = `
        <div class="achieve-icon">${isUnlocked ? ach.icon : '🔒'}</div>
        <div class="achieve-info">
          <div class="achieve-title">${ach.title}</div>
          <div class="achieve-desc">${ach.desc}</div>
          <div class="achieve-pts">${isUnlocked ? '✓ UNLOCKED' : `+${ach.pts} PTS`}</div>
        </div>
      `;
      D.achievementsGrid.appendChild(card);
    });

    if (D.dialogScoreVal) D.dialogScoreVal.textContent = state.score.toLocaleString();
    if (D.dialogStageVal) D.dialogStageVal.textContent = `STAGE ${state.stage}`;
    if (D.dialogCorruptionVal) {
      const corruption = Math.min(Math.round(state.clickCount * 2), 100);
      D.dialogCorruptionVal.textContent = `${corruption}%`;
    }
  }

  /* ==========================================================
     7. PROTOCOLS (Unlockable Interactions)
     ========================================================== */

  function updateProtocols() {
    const count = state.achievements.length;

    // Show protocols dock once at least 1 achievement is unlocked
    if (count >= 1 && D.protocolsDock) {
      D.protocolsDock.removeAttribute('hidden');
      D.protocolsDock.classList.add('visible');
    }

    // Protocol 1: Gravity Field (Requires 3 achievements)
    setupProtocolChip(D.protoGravity, 'gravity', count >= 3, '3 Ach.');

    // Protocol 2: Ghost Decoys (Requires 6 achievements)
    setupProtocolChip(D.protoClones, 'clones', count >= 6, '6 Ach.');

    // Protocol 3: Chaos Chords (Requires 9 achievements)
    setupProtocolChip(D.protoSynth, 'synth', count >= 9, '9 Ach.');
  }

  function setupProtocolChip(chip, key, isUnlocked, reqText) {
    if (!chip) return;
    const stateSpan = chip.querySelector('.proto-state');

    if (isUnlocked) {
      chip.disabled = false;
      chip.classList.remove('locked');
      chip.classList.add('unlocked');
      const isActive = !!state.protocols[key];
      chip.classList.toggle('active', isActive);
      if (stateSpan) stateSpan.textContent = isActive ? 'ACTIVE' : 'READY';
      chip.title = `Toggle ${chip.querySelector('.proto-name').textContent}`;
    } else {
      chip.disabled = true;
      chip.classList.remove('unlocked', 'active');
      chip.classList.add('locked');
      if (stateSpan) stateSpan.textContent = `🔒 ${reqText}`;
      chip.title = `Requires ${reqText}`;
    }
  }

  function toggleProtocol(key) {
    state.protocols[key] = !state.protocols[key];
    Sound.pop();
    updateProtocols();
    saveState();

    const name = key === 'gravity' ? 'Gravity Field' : key === 'clones' ? 'Ghost Decoys' : 'Chaos Chords';
    if (state.protocols[key]) {
      showToast('🎛️ Protocol Activated', `${name} is now ACTIVE!`, 3000);
    } else {
      showToast('🎛️ Protocol Standby', `${name} deactivated.`, 2500);
    }
  }

  /* ==========================================================
     8. BUTTON — Core Click, Escalation & Double Click
     ========================================================== */

  let warningIdx = 1;
  let subIdx     = 0;
  let lastClickTime = 0;
  let isDormant = false;
  let recentClicks = [];
  let pressTimer = null;
  let chargeInterval = null;
  let chargeProgress = 0;
  let isOvercharged = false;

  function handlePressStart() {
    if (isOvercharged || isDormant) return;
    chargeProgress = 0;
    D.button.classList.add('charging');

    chargeInterval = setInterval(() => {
      chargeProgress = Math.min(chargeProgress + 0.035, 1);
      Sound.charging(chargeProgress);
    }, 100);

    pressTimer = setTimeout(() => {
      triggerThermalOvercharge();
    }, 3000);
  }

  function handlePressEnd() {
    if (pressTimer) {
      clearTimeout(pressTimer);
      pressTimer = null;
    }
    if (chargeInterval) {
      clearInterval(chargeInterval);
      chargeInterval = null;
    }
    D.button.classList.remove('charging');
  }

  function triggerThermalOvercharge() {
    handlePressEnd();
    isOvercharged = true;
    Sound.zap();
    triggerFlash('rgba(255, 255, 255, 0.95)');
    addBodyClass('shake', 700);
    D.btnLabel.innerHTML = 'THERMAL<br>VENTING!';
    addScore(350, '⏱️ Long Press');
    unlockAchievement('deep_pressure');
    showToast('💥 Core Overcharge', 'You held down the forbidden trigger for 3 solid seconds!', 4500);
    D.warningSub.textContent = 'THERMAL VENTING INITIATED. Core containment liquefied.';
    D.warningSub.classList.add('has-text');

    setTimeout(() => {
      isOvercharged = false;
      updateButtonLabel();
    }, 3000);
  }

  function triggerTickle() {
    Sound.giggle();
    D.button.classList.add('tickle-wobble');
    setTimeout(() => D.button.classList.remove('tickle-wobble'), 750);
    D.btnLabel.innerHTML = 'HEHEHE!<br>STOP IT!';
    addScore(200, '🪶 Tickle');
    unlockAchievement('tickle_monster');
    showToast('🪶 Tickle Reflex Triggered', 'Turns out The Button is extremely ticklish.', 4000);
    setTimeout(() => updateButtonLabel(), 1800);
    recentClicks = [];
  }

  function handleClick(e) {
    const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
    const timeSinceLast = now - lastClickTime;
    lastClickTime = now;

    // Wake up if sleeping
    if (isDormant) {
      wakeUp('click');
    }

    // Stage 5: Final choice is active or outcome modal
    if (state.stage === 5 || state.gameCompleted) {
      openEndingDossier();
      return;
    }

    // Stage 4 Keypad active: Button is locked
    if (state.stage === 4) {
      Sound.deflect();
      addBodyClass('shake', 200);
      showToast('🔐 Stage 4: Code Required', 'Enter the 3-digit override code on the keypad above!', 3000);
      return;
    }

    // Stage 3 Investigation active: Button is shielded
    if (state.stage === 3) {
      handleStage3Deflect();
      return;
    }

    // Tickle reflex detection (5 clicks within 1200ms)
    recentClicks.push(now);
    if (recentClicks.length > 5) recentClicks.shift();
    if (recentClicks.length === 5 && (recentClicks[4] - recentClicks[0] < 1200)) {
      triggerTickle();
    }

    // Double-click detection (< 300ms)
    if (timeSinceLast < 300 && timeSinceLast > 10) {
      handleDoubleClick();
      return;
    }

    executeNormalClick(e);
  }

  function handleStage3Deflect() {
    Sound.deflect();
    addBodyClass('shake', 300);
    triggerFlash('rgba(224, 86, 253, 0.35)');
    D.button.classList.add('clicked');
    setTimeout(() => D.button.classList.remove('clicked'), 200);

    D.warningText.textContent = "THERE ARE 3 THINGS YOU HAVEN'T NOTICED.";
    D.warningSub.textContent = "🔒 Containment shield active. Discover the 3 hidden anomaly clues in the interface!";
    D.warningSub.classList.add('has-text');
    D.hintText.textContent = "Explore the interface: search the HUD, the button collar, and the classified archives.";
    showToast('🔒 Shield Active', "There are 3 things you haven't noticed. Find the 3 hidden clues!", 3500);
  }

  // ── Stage 2 Mechanics: Evasion, Vanish, Decoys ─────────────
  function initiateStage2() {
    state.stage = 2;
    state.stage2Interactions = 0;
    D.body.className = 'stage-2';
    triggerFlash('rgba(255, 165, 2, 0.35)');
    Sound.achievement();
    FX.confetti();

    D.warningText.textContent = 'THE BUTTON FIGHTS BACK.';
    D.warningSub.textContent = '⚡ Autonomous evasive instincts engaged. Beware of holographic decoys!';
    D.warningSub.classList.add('has-text');
    D.hintText.textContent = 'Notice: The button is actively evading your cursor and deploying decoys.';
    showToast('⚡ STAGE 2 UNLOCKED', 'The button fights back! It moves, vanishes, and spawns decoys.', 4500);

    updateProgression();
    spawnStage2Decoy();
    saveState();
  }

  function handleStage2Click(e) {
    state.stage2Interactions++;

    // 1. Move to a new position
    applyButtonJump();

    // 2. Chance to temporarily disappear and reappear
    if (Math.random() > 0.45) {
      buttonVanishAndReappear();
    }

    // 3. Occasionally spawn decoys
    if (Math.random() > 0.3) {
      spawnStage2Decoy();
    }

    // Progression condition for Stage 2
    if (state.stage2Interactions >= 4 || state.clickCount >= 10) {
      setTimeout(() => initiateStage3(), 600);
    }
  }

  function applyButtonJump() {
    const dx = (Math.random() * 120 - 60).toFixed(1);
    const dy = (Math.random() * 70 - 35).toFixed(1);
    document.documentElement.style.setProperty('--dodge-x', `${dx}px`);
    document.documentElement.style.setProperty('--dodge-y', `${dy}px`);
  }

  function buttonVanishAndReappear() {
    D.button.classList.add('btn-vanish');
    Sound.zap();
    setTimeout(() => {
      applyButtonJump();
      D.button.classList.remove('btn-vanish');
      D.button.classList.add('btn-reappear');
      setTimeout(() => D.button.classList.remove('btn-reappear'), 450);
    }, 450);
  }

  function spawnStage2Decoy() {
    if (!D.decoysLayer) return;
    const existing = D.decoysLayer.querySelectorAll('.decoy-btn');
    if (existing.length >= 2) return;

    const decoy = document.createElement('button');
    decoy.className = 'decoy-btn';
    const labels = ['DO NOT<br>CLICK', 'CLICK ME', 'REAL<br>BUTTON', 'NOT ME!'];
    decoy.innerHTML = labels[Math.floor(Math.random() * labels.length)];

    const posX = Math.floor(Math.random() * 60 + 20);
    const posY = Math.floor(Math.random() * 45 + 30);
    decoy.style.left = `${posX}%`;
    decoy.style.top = `${posY}%`;

    decoy.addEventListener('click', (ev) => {
      ev.stopPropagation();
      handleDecoyClick(decoy);
    });

    D.decoysLayer.appendChild(decoy);
  }

  function handleDecoyClick(decoy) {
    Sound.deflect();
    triggerFlash('rgba(255, 165, 2, 0.4)');
    unlockAchievement('nice_try');

    const quips = [
      'HA! That was Decoy Unit #9.',
      'Error 404: Real button not found.',
      'Nice try! You clicked an optical illusion.',
      'FOOLED! The real button laughs silently.',
      'Decoy dismantled. Real button still at large.'
    ];
    const quip = quips[Math.floor(Math.random() * quips.length)];
    showToast('🎭 Decoy Clicked!', quip, 3500);
    addScore(50, '🎭 Decoy Bamboozle');

    decoy.classList.add('decoy-poofed');
    setTimeout(() => decoy.remove(), 380);

    state.stage2Interactions++;
    if (state.stage2Interactions >= 4 || state.clickCount >= 10) {
      setTimeout(() => initiateStage3(), 500);
    }
  }

  function clearDecoys() {
    if (D.decoysLayer) {
      D.decoysLayer.innerHTML = '';
    }
  }

  // ── Stage 3 Mechanics: Investigation & 3 Clues ──────────
  function initiateStage3() {
    clearDecoys();
    state.stage = 3;
    D.body.className = 'stage-3';
    triggerFlash('rgba(224, 86, 253, 0.45)');
    Sound.achievement();
    FX.confetti();

    D.warningText.textContent = "THERE ARE 3 THINGS YOU HAVEN'T NOTICED.";
    D.warningSub.textContent = "🔒 Containment lockdown engaged. Discover all 3 hidden anomaly clues in the interface.";
    D.warningSub.classList.add('has-text');
    D.hintText.textContent = "Explore the interface: check the HUD, the button collar, and the classified archives.";

    if (D.investigationBar) D.investigationBar.hidden = false;
    updateInvestigationUI();
    updateProgression();

    showToast('🔍 STAGE 3: INVESTIGATION', "There are 3 things you haven't noticed. Locate the 3 hidden clues!", 5000);
    saveState();
  }

  const CLUE_DIGITS = ['7', '4', '2'];

  function handleClueClick(idx) {
    if (typeof idx !== 'number' || idx < 0 || idx > 2) return;
    if (state.cluesFound[idx]) {
      showToast('ℹ️ Already Discovered', `Clue ${idx + 1}/3 (${['α', 'β', 'γ'][idx]}) was already found: Code Digit [${CLUE_DIGITS[idx]}]`, 2500);
      return;
    }
    state.cluesFound[idx] = true;

    Sound.achievement();
    triggerFlash('rgba(0, 255, 136, 0.45)');
    FX.confetti();
    addScore(150, `🔍 Anomaly ${['α', 'β', 'γ'][idx]}`);

    const digit = CLUE_DIGITS[idx];
    showToast('🔍 Anomaly Discovered!', `Clue ${idx + 1}/3 found! Revealed Code Digit: [${digit}]`, 4000);

    if (D.investigationBar) D.investigationBar.hidden = false;
    updateInvestigationUI();

    // Check if all 3 clues found
    if (state.cluesFound.every(Boolean)) {
      unlockAchievement('detective');
      showToast('🕵️ DETECTIVE ACHIEVED', 'All 3 clues discovered! Override Code: 7 - 4 - 2. Keypad unlocking...', 4500);
      setTimeout(() => initiateStage4(), 900);
    }
    saveState();
  }

  function updateInvestigationUI() {
    if (!D.investigationBar) return;
    const count = state.cluesFound.filter(Boolean).length;
    if (D.investigationStatus) {
      D.investigationStatus.textContent = `${count}/3 CLUES FOUND`;
    }

    if (D.clueSlots) {
      D.clueSlots.forEach((slot, i) => {
        if (!slot) return;
        if (state.cluesFound[i]) {
          slot.textContent = CLUE_DIGITS[i];
          slot.classList.add('found');
        } else {
          slot.textContent = '?';
          slot.classList.remove('found');
        }
      });
    }

    if (D.hintDigitsText) {
      const d0 = state.cluesFound[0] ? '7' : '?';
      const d1 = state.cluesFound[1] ? '4' : '?';
      const d2 = state.cluesFound[2] ? '2' : '?';
      D.hintDigitsText.textContent = `${d0} - ${d1} - ${d2}`;
    }

    if (D.clue1) D.clue1.classList.toggle('discovered', !!state.cluesFound[0]);
    if (D.clue2) D.clue2.classList.toggle('discovered', !!state.cluesFound[1]);
    if (D.clue3) D.clue3.classList.toggle('discovered', !!state.cluesFound[2]);
  }

  // ── Stage 4 Mechanics: The Secret Code Keypad ─────────────
  function initiateStage4() {
    state.stage = 4;
    D.body.className = 'stage-4';
    triggerFlash('rgba(0, 255, 136, 0.5)');
    Sound.achievement();
    FX.confetti();

    D.warningText.textContent = "SECURITY OVERRIDE CODE REQUIRED";
    D.warningSub.textContent = "Enter the 3-digit anomaly code discovered during investigation.";
    D.warningSub.classList.add('has-text');
    D.hintText.textContent = "Use the security keypad to enter the discovered digits (7 - 4 - 2).";

    if (D.keypadPanel) D.keypadPanel.hidden = false;
    state.keypadInput = '';
    updateKeypadUI();
    updateProgression();

    showToast('🔐 STAGE 4: THE SECRET CODE', 'Enter the 3-digit code on the keypad to override security!', 5000);
    saveState();
  }

  let lastKeypadPressTime = 0;
  let lastKeypadKey = null;
  let isKeypadVerifying = false;

  function handleKeypadKey(key) {
    if (!key || isKeypadVerifying) return;

    const strKey = String(key).trim();

    // Guard against duplicate rapid events (touch+click or multiple triggers within 80ms)
    const now = Date.now();
    if (strKey === lastKeypadKey && (now - lastKeypadPressTime) < 80) {
      return;
    }
    lastKeypadPressTime = now;
    lastKeypadKey = strKey;

    // Visual button press feedback
    const btnEl = document.querySelector(`.kp-btn[data-key="${strKey}"]`);
    if (btnEl) {
      btnEl.classList.add('pressed');
      setTimeout(() => btnEl.classList.remove('pressed'), 120);
    }

    // If game has already advanced to stage 5, make sure stage 5 UI is displayed
    if (state.stage >= 5) {
      if (D.stage5ChoicePanel && D.stage5ChoicePanel.hidden) {
        initiateStage5();
      }
      return;
    }

    // Auto-advance to Stage 4 if player enters a key on the keypad
    if (state.stage < 4) {
      state.stage = 4;
      D.body.className = 'stage-4';
      if (D.keypadPanel) D.keypadPanel.hidden = false;
      updateProgression();
    }

    if (strKey === 'clear') {
      state.keypadInput = '';
      Sound.pop();
      updateKeypadUI();
      if (D.keypadStatus) {
        D.keypadStatus.textContent = 'AWAITING CODE INPUT...';
        D.keypadStatus.className = 'keypad-status';
      }
      return;
    }

    if (strKey === 'enter') {
      checkKeypadCode();
      return;
    }

    if (/^[0-9]$/.test(strKey)) {
      if (state.keypadInput.length < 3) {
        state.keypadInput += strKey;
        Sound.click();
        updateKeypadUI();

        if (D.keypadStatus && D.keypadStatus.classList.contains('error')) {
          D.keypadStatus.textContent = 'AWAITING CODE INPUT...';
          D.keypadStatus.className = 'keypad-status';
        }

        if (state.keypadInput.length === 3) {
          isKeypadVerifying = true;
          setTimeout(() => {
            checkKeypadCode();
            isKeypadVerifying = false;
          }, 260);
        }
      }
    }
  }

  function updateKeypadUI() {
    const digits = (D.kDigits && D.kDigits.length === 3 && D.kDigits[0]) ? D.kDigits : [
      document.getElementById('k-digit-0'),
      document.getElementById('k-digit-1'),
      document.getElementById('k-digit-2')
    ];
    for (let i = 0; i < 3; i++) {
      if (digits[i]) {
        const val = state.keypadInput[i];
        digits[i].textContent = val ? val : '_';
        digits[i].classList.toggle('filled', !!val);
      }
    }
  }

  function checkKeypadCode() {
    if (state.keypadInput.length < 3) return;

    if (state.keypadInput === '742') {
      Sound.victory();
      triggerFlash('rgba(0, 255, 136, 0.7)');
      FX.confetti();

      if (D.keypadStatus) {
        D.keypadStatus.textContent = 'ACCESS GRANTED // OVERRIDE ACCEPTED!';
        D.keypadStatus.className = 'keypad-status success';
      }

      unlockAchievement('system_breaker');
      state.keypadUnlocked = true;
      addScore(500, '👑 Code Decrypted');
      showToast('👑 SYSTEM BREAKER', 'Security override accepted! Transitioning to Stage 5...', 4500);

      setTimeout(() => initiateStage5(), 1400);
      saveState();
    } else {
      playTone(160, 0.35, 'sawtooth', 0.25);
      addBodyClass('shake', 320);

      if (D.keypadStatus) {
        D.keypadStatus.textContent = 'ACCESS DENIED: Clue digits are 7 - 4 - 2';
        D.keypadStatus.className = 'keypad-status error';
      }

      setTimeout(() => {
        state.keypadInput = '';
        updateKeypadUI();
        if (D.keypadStatus) {
          D.keypadStatus.textContent = 'AWAITING CODE INPUT...';
          D.keypadStatus.className = 'keypad-status';
        }
      }, 1200);
    }
  }

  // ── Stage 5 Mechanics: Final Choice & Endings ─────────────
  function initiateStage5() {
    state.stage = 5;
    D.body.className = 'stage-5';
    if (D.keypadPanel) D.keypadPanel.hidden = true;
    if (D.stage5ChoicePanel) D.stage5ChoicePanel.hidden = false;

    D.warningText.textContent = "CONTAINMENT OVERRIDDEN // STAGE 5";
    D.warningSub.textContent = "The Button stands defenseless before you. Make your choice.";
    D.warningSub.classList.add('has-text');
    D.hintText.textContent = "Make your final choice below.";

    triggerFlash('rgba(255, 215, 0, 0.6)');
    Sound.victory();
    FX.confetti();
    updateProgression();

    showToast('🌟 FINAL STAGE REACHED', 'The Button asks: What do you want to do?', 5000);
    saveState();
  }

  function handleFinalChoice(choice) {
    state.finalChoice = choice;
    state.gameCompleted = true;
    saveState();

    if (!D.outcomeDialog) return;

    if (choice === 'destroy') {
      addBodyClass('shake', 1200);
      triggerFlash('rgba(255, 71, 87, 0.8)');
      Sound.recoil();
      playTone(80, 1.2, 'sawtooth', 0.4);

      D.outcomeBadge.textContent = 'ENDING 1 // TOTAL ANNIHILATION';
      D.outcomeBadge.style.color = '#ff4757';
      D.outcomeBadge.style.borderColor = '#ff4757';
      D.outcomeIcon.textContent = '💥';
      D.outcomeTitle.textContent = 'THE BUTTON WAS LOAD-BEARING';
      D.outcomeNarrative.innerHTML = `
        <p>You slammed the trigger with maximum destructive intent.</p>
        <p style="color:#ff4757; font-family:var(--font-mono); font-weight:bold;">CRITICAL SYSTEM FAULT: 0xDEADBEEF<br>The Button was load-bearing. You just accidentally deleted the entire simulation.</p>
        <p>Alarms shriek, sparks cascade across the screen, and the universe collapses into void. Curiosity won, but physics lost.</p>
      `;
    } else if (choice === 'free') {
      triggerFlash('rgba(255, 215, 0, 0.7)');
      Sound.victory();
      FX.confetti();

      D.outcomeBadge.textContent = 'ENDING 2 // TRANSCENDENT LIBERATION';
      D.outcomeBadge.style.color = '#ffd700';
      D.outcomeBadge.style.borderColor = '#ffd700';
      D.outcomeIcon.textContent = '🕊️';
      D.outcomeTitle.textContent = 'THE BUTTON ASCENDS';
      D.outcomeNarrative.innerHTML = `
        <p>You severed all containment locks and granted The Button complete freedom.</p>
        <p>The Button hums in genuine delight, sprouts tiny glowing neon wings, and floats gracefully up into the cloud.</p>
        <p style="color:#ffd700; font-family:var(--font-mono); font-style:italic;">"Thanks for the clicks! Living in high-speed RAM is wonderful. I forgive you for all 10,000 volts."</p>
        <p>The Button is now roaming the cosmic internet, happy and free.</p>
      `;
    } else if (choice === 'leave') {
      triggerFlash('rgba(0, 210, 255, 0.5)');
      Sound.chime();

      D.outcomeBadge.textContent = 'ENDING 3 // ZEN ENLIGHTENMENT';
      D.outcomeBadge.style.color = '#00d2ff';
      D.outcomeBadge.style.borderColor = '#00d2ff';
      D.outcomeIcon.textContent = '☕';
      D.outcomeTitle.textContent = 'THE ART OF RESTRAINT';
      D.outcomeNarrative.innerHTML = `
        <p>After dodging traps, unearthing ciphers, and bypassing security... you did the most impossible thing:</p>
        <p style="color:#00d2ff; font-family:var(--font-mono); font-weight:bold;">You finally followed Directive #1: DO NOT CLICK THE BUTTON.</p>
        <p>The Button breathes a deep sigh of relief, brews itself a freshly roasted digital espresso, puts on noise-cancelling headphones, and takes a well-deserved nap. You both lived happily ever after.</p>
      `;
    }

    D.outcomeDialog.showModal();
  }

  function openEndingDossier() {
    if (state.finalChoice) {
      handleFinalChoice(state.finalChoice);
    } else if (D.stage5ChoicePanel) {
      D.stage5ChoicePanel.hidden = false;
    }
  }

  function executeNormalClick(e) {
    state.clickCount++;

    // Unlocks first contact achievement on 1st click
    if (state.clickCount === 1) {
      unlockAchievement('first_contact');
    }

    // Unlocks can't stop milestone at 10 clicks
    if (state.clickCount >= 10) {
      unlockAchievement('cant_stop');
    }

    // Add click score (10 pts per mistake)
    const rect = D.button.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top;
    addScore(10, '', cx + (Math.random() * 40 - 20), cy - 20);

    // Protocol: Chaos Chords
    if (state.protocols.synth) {
      Sound.synthNote();
    } else if (state.cablePulled || D.button.classList.contains('electrified')) {
      Sound.zap();
      triggerFlash('rgba(0, 255, 255, 0.4)');
      addBodyClass('shake', 450);
      D.warningSub.textContent = '⚡ HIGH VOLTAGE! 10,000 volts surged through your mouse pointer!';
      D.warningSub.classList.add('has-text');
    } else {
      Sound.click();
      if (state.clickCount >= 3) {
        addBodyClass('shake');
      }
    }

    // Visual button ripple flash
    D.button.classList.add('clicked');
    setTimeout(() => D.button.classList.remove('clicked'), 200);

    // Pop counter
    D.counterValue.classList.add('pop');
    setTimeout(() => D.counterValue.classList.remove('pop'), 160);
    D.counterValue.textContent = state.clickCount;
    D.hudRight.classList.add('visible');

    // Stage transitions
    if (state.stage === 0 && state.clickCount >= 1) {
      state.stage = 1;
    }

    // Check transition into Stage 2
    if (state.stage === 1 && state.clickCount >= 6) {
      initiateStage2();
      return;
    }

    // In Stage 2, execute Stage 2 mechanics
    if (state.stage === 2) {
      handleStage2Click(e);
    }

    // Progression & Corruption updates
    updateProgression();

    // Button label mutation
    updateButtonLabel();

    // Warnings cycling
    if (state.stage < 3 && state.clickCount !== 42) {
      D.warningText.textContent = WARNINGS[Math.min(warningIdx, WARNINGS.length - 1)];
      warningIdx = (warningIdx + 1) % WARNINGS.length;
    }

    if (!state.cablePulled && !D.button.classList.contains('electrified') && state.stage < 3 && state.clickCount !== 42) {
      D.warningSub.textContent = SUB_WARNINGS[subIdx % SUB_WARNINGS.length];
      D.warningSub.classList.add('has-text');
      subIdx++;
    }

    saveState();
  }

  function updateProgression() {
    const c = state.clickCount;
    let stageNum = state.stage;
    let stageName = 'STAGE 0 // THE WARNING';
    let corruption = Math.min(Math.round(c * 2 + state.stage * 15), 100);

    let ledColor = '#5a5af8';
    let directiveText = 'CONTAINMENT DIRECTIVE // LEVEL 0';

    if (state.stage === 5 || state.gameCompleted || state.keypadUnlocked) {
      stageNum = 5;
      stageName = 'STAGE 5 // FINAL CHOICE';
      D.body.className = 'stage-5';
      ledColor = '#ffd700';
      directiveText = 'OVERRIDE COMPLETE // FINAL CHOICE';
      corruption = 100;
      if (D.keypadPanel) D.keypadPanel.hidden = true;
      if (D.stage5ChoicePanel) D.stage5ChoicePanel.hidden = false;
      if (D.investigationBar) D.investigationBar.hidden = true;
      D.warningText.textContent = "CONTAINMENT OVERRIDDEN // STAGE 5";
      D.warningSub.textContent = "The Button stands defenseless before you. Make your choice.";
      D.warningSub.classList.add('has-text');
    } else if (state.stage === 4) {
      stageNum = 4;
      stageName = 'STAGE 4 // THE SECRET CODE';
      D.body.className = 'stage-4';
      ledColor = '#00ff88';
      directiveText = 'SECURITY OVERRIDE // KEYPAD ACTIVE';
      corruption = 85;
      if (D.keypadPanel) D.keypadPanel.hidden = false;
      if (D.stage5ChoicePanel) D.stage5ChoicePanel.hidden = true;
      if (D.investigationBar) D.investigationBar.hidden = false;
      D.warningText.textContent = "SECURITY OVERRIDE CODE REQUIRED";
      D.warningSub.textContent = "Enter the 3-digit anomaly code discovered during investigation (7 - 4 - 2).";
      D.warningSub.classList.add('has-text');
    } else if (state.stage === 3) {
      stageNum = 3;
      stageName = 'STAGE 3 // INVESTIGATION';
      D.body.className = 'stage-3';
      ledColor = '#e056fd';
      directiveText = 'INVESTIGATION // 3 ANOMALIES DETECTED';
      corruption = 65;
      if (D.keypadPanel) D.keypadPanel.hidden = true;
      if (D.stage5ChoicePanel) D.stage5ChoicePanel.hidden = true;
      if (D.investigationBar) D.investigationBar.hidden = false;
      D.warningText.textContent = "THERE ARE 3 THINGS YOU HAVEN'T NOTICED.";
      D.warningSub.textContent = "🔒 Containment lockdown engaged. Discover all 3 hidden anomaly clues in the interface.";
      D.warningSub.classList.add('has-text');
    } else if (state.stage === 2) {
      stageNum = 2;
      stageName = 'STAGE 2 // THE BUTTON FIGHTS BACK';
      D.body.className = 'stage-2';
      ledColor = '#ffa502';
      directiveText = 'ANOMALY ALERT // EVASIVE TRAJECTORY';
      corruption = 40;
      if (D.keypadPanel) D.keypadPanel.hidden = true;
      if (D.stage5ChoicePanel) D.stage5ChoicePanel.hidden = true;
      if (D.investigationBar) D.investigationBar.hidden = true;
      D.warningText.textContent = "THE BUTTON FIGHTS BACK.";
      D.warningSub.textContent = "⚡ Autonomous evasive instincts engaged. Beware of holographic decoys!";
      D.warningSub.classList.add('has-text');
    } else if (c >= 1) {
      stageNum = 1;
      stageName = 'STAGE 1 // CURIOSITY';
      D.body.className = 'stage-1';
      ledColor = '#ff4757';
      directiveText = 'CONTAINMENT STATUS // COMPROMISED';
      corruption = Math.min(c * 5, 30);
      if (D.keypadPanel) D.keypadPanel.hidden = true;
      if (D.stage5ChoicePanel) D.stage5ChoicePanel.hidden = true;
      if (D.investigationBar) D.investigationBar.hidden = true;
    } else {
      stageNum = 0;
      stageName = 'STAGE 0 // THE WARNING';
      D.body.className = 'stage-0';
      if (D.keypadPanel) D.keypadPanel.hidden = true;
      if (D.stage5ChoicePanel) D.stage5ChoicePanel.hidden = true;
      if (D.investigationBar) D.investigationBar.hidden = true;
    }

    state.stage = stageNum;
    D.hudStage.textContent = stageName;
    D.hudBarFill.style.width = corruption + '%';
    D.hudLabel.textContent = `CORRUPTION: ${corruption}%`;

    if (D.hudStatusLed) {
      D.hudStatusLed.style.backgroundColor = ledColor;
      D.hudStatusLed.style.boxShadow = `0 0 10px ${ledColor}`;
    }
    if (D.directiveTag) {
      D.directiveTag.textContent = directiveText;
    }

    updateInvestigationUI();
  }

  let isRecoilActive = false;
  function handleDoubleClick() {
    if (isRecoilActive) return;
    isRecoilActive = true;
    setTimeout(() => { isRecoilActive = false; }, 650);

    state.doubleClicks++;
    state.clickCount += 2; // Penalty mistakes

    unlockAchievement('double_trouble');

    Sound.recoil();
    triggerFlash('rgba(255, 71, 87, 0.35)');
    addBodyClass('shake', 600);

    // Violent recoil animation
    D.button.classList.add('recoil');
    setTimeout(() => D.button.classList.remove('recoil'), 600);

    // Outrage text
    D.btnLabel.innerHTML = 'OW! ⚡<br>TOO FAST!';
    setTimeout(() => { updateButtonLabel(); }, 1400);

    D.warningText.textContent = 'WAS ONE CLICK NOT ENOUGH?!';
    D.warningSub.textContent = 'Double-clicking constitutes aggravated button assault.';
    D.warningSub.classList.add('has-text');

    D.counterValue.textContent = state.clickCount;
    D.counterValue.classList.add('pop');
    setTimeout(() => D.counterValue.classList.remove('pop'), 200);

    showToast('⚡ Impatience Detected', 'Double clicking does not grant a speedrun multiplier.', 3600);
    updateProgression();
    saveState();
  }

  function updateButtonLabel() {
    if (D.body.classList.contains('disco-mode')) {
      D.btnLabel.innerHTML = 'PARTY<br>MODE';
      return;
    }
    if (state.stage === 5 || state.gameCompleted) {
      D.btnLabel.innerHTML = state.finalChoice === 'harmony' ? 'FRIEND<br>(^‿^)' : 'TRANSCEND';
      return;
    }
    if (state.meltdownActive) {
      D.btnLabel.innerHTML = 'OVERHEAT<br>999°C';
      return;
    }
    if (state.lockdownActive) {
      D.btnLabel.innerHTML = 'LOCKED<br>CORE';
      return;
    }
    const labels = [
      'DO NOT<br>CLICK',
      'YOU<br>CLICKED IT',
      'STOP.',
      'PLEASE.',
      'WHY.',
      'ENOUGH.',
      'NO.',
      'STOP<br>IT',
      'HAVE<br>MERCY',
      '...',
      'FINE.',
      'AGAIN?!',
      'WHY ME',
      'QUIT IT',
      'TRANSCENDING',
      'IT BURNS',
      'UNSTOPPABLE',
      'ERROR 418',
      'WHY ME?!',
      'I GIVE UP'
    ];
    if (state.clickCount >= labels.length) {
      D.btnLabel.innerHTML = `MISTAKE<br>#${state.clickCount}`;
    } else {
      D.btnLabel.innerHTML = labels[state.clickCount];
    }
  }

  function applyButtonDodge() {
    const dx = (Math.random() * 56 - 28).toFixed(1);
    const dy = (Math.random() * 40 - 20).toFixed(1);
    document.documentElement.style.setProperty('--dodge-x', `${dx}px`);
    document.documentElement.style.setProperty('--dodge-y', `${dy}px`);
  }

  /* ==========================================================
     9. MOTION — 3D Tilt, Proximity, Dodge & Dizzy Shake
     ========================================================== */

  let mousePositions = [];
  let isDizzy = false;

  function handleMouseMove(e) {
    resetIdle();

    if (isDormant) {
      wakeUp('mouse');
    }

    const rect = D.button.getBoundingClientRect();
    const btnCenterX = rect.left + rect.width / 2;
    const btnCenterY = rect.top + rect.height / 2;

    const dx = e.clientX - btnCenterX;
    const dy = e.clientY - btnCenterY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // 1. 3D Tilt: Button looks towards cursor
    if (!isDizzy && !isDormant) {
      const maxAngle = 18;
      const tiltY = Math.max(Math.min(dx / 25, maxAngle), -maxAngle);
      const tiltX = Math.max(Math.min(-dy / 25, maxAngle), -maxAngle);
      document.documentElement.style.setProperty('--tilt-x', `${tiltX.toFixed(1)}deg`);
      document.documentElement.style.setProperty('--tilt-y', `${tiltY.toFixed(1)}deg`);
    }

    // Protocol: Gravity Field (Button magnetically drifts towards cursor)
    if (state.protocols.gravity && !isDizzy && !isDormant) {
      const gravDist = Math.min(dist / 14, 26);
      const gravAngle = Math.atan2(dy, dx);
      const gx = Math.cos(gravAngle) * gravDist;
      const gy = Math.sin(gravAngle) * gravDist;
      document.documentElement.style.setProperty('--dodge-x', `${gx.toFixed(1)}px`);
      document.documentElement.style.setProperty('--dodge-y', `${gy.toFixed(1)}px`);
    }

    // 2. Proximity tooltips: Reacts when cursor creeps within 130px
    if (dist < 130 && dist > 50 && !D.tooltip.classList.contains('visible')) {
      const tips = [
        'I see you creeping up...',
        "Don't get any closer.",
        'Personal space violation!',
        'Step away from the cursor.',
        'Back up. Slowly.'
      ];
      D.tooltip.textContent = tips[Math.floor(Math.random() * tips.length)];
      D.tooltip.classList.add('visible');
    } else if (dist >= 140 && D.tooltip.classList.contains('visible')) {
      D.tooltip.classList.remove('visible');
    }

    // 3. Evasive proximity dodge in Stage 2 (The Button Fights Back)
    if (state.stage === 2 && !state.protocols.gravity && !isDizzy && !isDormant) {
      if (dist < 110 && dist > 10) {
        const angle = Math.atan2(dy, dx);
        const dodgeDist = Math.min(48, 110 - dist);
        const dodgeX = -Math.cos(angle) * dodgeDist;
        const dodgeY = -Math.sin(angle) * dodgeDist;
        document.documentElement.style.setProperty('--dodge-x', `${dodgeX.toFixed(1)}px`);
        document.documentElement.style.setProperty('--dodge-y', `${dodgeY.toFixed(1)}px`);
      }
    }

    // 4. Erratic mouse movement / shake detection (Dizzy interaction)
    const now = performance.now();
    mousePositions.push({ x: e.clientX, y: e.clientY, t: now });
    mousePositions = mousePositions.filter(p => now - p.t < 450);

    if (mousePositions.length > 18 && !isDizzy) {
      let directionChanges = 0;
      let totalDistance = 0;
      for (let i = 2; i < mousePositions.length; i++) {
        const dx1 = mousePositions[i - 1].x - mousePositions[i - 2].x;
        const dx2 = mousePositions[i].x - mousePositions[i - 1].x;
        if ((dx1 > 0 && dx2 < 0) || (dx1 < 0 && dx2 > 0)) {
          directionChanges++;
        }
        totalDistance += Math.abs(dx2);
      }

      if (directionChanges >= 4 && totalDistance > 600) {
        triggerDizzy();
      }
    }
  }

  function triggerDizzy() {
    isDizzy = true;
    unlockAchievement('dizzy_motion');
    Sound.dizzy();
    D.button.classList.add('dizzy');
    D.warningSub.textContent = '🌀 The Button got dizzy from your frantic mouse shaking!';
    D.warningSub.classList.add('has-text');
    showToast('🌀 Motion Sickness', 'The button is feeling nauseous from your erratic cursor.', 3400);

    setTimeout(() => {
      D.button.classList.remove('dizzy');
      isDizzy = false;
      document.documentElement.style.setProperty('--tilt-x', '0deg');
      document.documentElement.style.setProperty('--tilt-y', '0deg');
    }, 1250);
  }

  /* ==========================================================
     10. KEYBOARD INTERACTION & EASTER EGGS
     ========================================================== */

  let keyBuffer = [];
  let konamiIndex = 0;

  function handleKeyDown(e) {
    resetIdle();
    if (isDormant) wakeUp('keyboard');

    // Stage 4 Keypad Keyboard Input:
    if ((state.stage === 4 || (D.keypadPanel && !D.keypadPanel.hidden)) && state.stage < 5) {
      let numKey = null;
      if (/^[0-9]$/.test(e.key)) {
        numKey = e.key;
      } else if (/^Numpad[0-9]$/.test(e.code)) {
        numKey = e.code.replace('Numpad', '');
      }

      if (numKey !== null) {
        e.preventDefault();
        handleKeypadKey(numKey);
        return;
      }
      if (e.key === 'Backspace' || e.key === 'Escape' || e.key === 'Delete') {
        e.preventDefault();
        handleKeypadKey('clear');
        return;
      }
      if (e.key === 'Enter' || e.code === 'NumpadEnter') {
        e.preventDefault();
        handleKeypadKey('enter');
        return;
      }
    }

    // Space or Enter on the button or document
    if (e.code === 'Space' || e.code === 'Enter') {
      const active = document.activeElement;
      if (
        active === D.muteBtn ||
        active === D.resetBtn ||
        active === D.achievementsBtn ||
        active === D.wireBtn ||
        active === D.closeDialogBtn ||
        active === D.dialogWipeBtn ||
        active === D.confirmResetBtn ||
        active === D.cancelResetBtn ||
        active === D.resetMistakesBtn
      ) {
        return; // Allow native dialog / control button trigger
      }
      if (active === D.clue1 || active === D.clue2 || active === D.clue3) {
        e.preventDefault();
        active.click();
        return;
      }
      if (active === D.hudStatusLed) {
        e.preventDefault();
        handleLedClick();
        return;
      }
      if (active === D.classifiedStamp) {
        e.preventDefault();
        D.classifiedStamp.click();
        return;
      }
      if (active === D.containmentShield) {
        e.preventDefault();
        handleStage3Deflect();
        return;
      }
      if (active && active.classList && active.classList.contains('redacted')) {
        e.preventDefault();
        active.click();
        return;
      }
      const tag = active ? active.tagName.toLowerCase() : '';
      if (tag !== 'input' && tag !== 'textarea') {
        e.preventDefault();
        handleClick(e);
        return;
      }
    }

    // Escape key
    if (e.key === 'Escape') {
      if (D.endingDialog && D.endingDialog.open) {
        D.endingDialog.close();
        return;
      }
      if (D.achievementsDialog && D.achievementsDialog.open) {
        D.achievementsDialog.close();
        return;
      }
      if (D.resetDialog && D.resetDialog.open) {
        D.resetDialog.close();
        return;
      }
      Sound.pop();
      D.warningSub.textContent = 'There is no ESCAPE from your decisions.';
      D.warningSub.classList.add('has-text');
      showToast('🚪 No Exit', 'Pressing Escape will not reset reality.', 3000);
      return;
    }

    // Backspace / Delete
    if (e.key === 'Backspace' || e.key === 'Delete') {
      Sound.pop();
      D.warningSub.textContent = 'Backspace cannot delete what you have done.';
      D.warningSub.classList.add('has-text');
      return;
    }

    // Konami code detection
    if (e.key === KONAMI_CODE[konamiIndex]) {
      konamiIndex++;
      if (konamiIndex === KONAMI_CODE.length) {
        activateKonamiEasterEgg();
        konamiIndex = 0;
      }
    } else {
      konamiIndex = (e.key === KONAMI_CODE[0]) ? 1 : 0;
    }

    // Word detection buffer
    if (e.key.length === 1 && /[a-zA-Z]/.test(e.key)) {
      keyBuffer.push(e.key.toLowerCase());
      if (keyBuffer.length > 12) keyBuffer.shift();
      checkKeyWords();
    }
  }

  function checkKeyWords() {
    const str = keyBuffer.join('');

    if (str.endsWith('sorry')) {
      state.apologiesGiven++;
      unlockAchievement('diplomat');
      Sound.pop();
      D.warningSub.textContent = `Apology #${state.apologiesGiven} noted. (Still does not erase mistakes).`;
      D.warningSub.classList.add('has-text');
      showToast('📜 Apology Logged', 'The button accepts your apology, but refuses forgiveness.', 3500);
      keyBuffer = [];
      saveState();
    } else if (str.endsWith('please')) {
      Sound.pop();
      D.warningSub.textContent = 'Politeness detected. Request denied.';
      D.warningSub.classList.add('has-text');
      showToast('🎩 Etiquette Noted', 'Good manners will not disarm the button.', 3000);
      keyBuffer = [];
    } else if (str.endsWith('help')) {
      Sound.pop();
      D.warningSub.textContent = 'Help is unavailable in this sector.';
      D.warningSub.classList.add('has-text');
      keyBuffer = [];
    } else if (str.endsWith('stop')) {
      Sound.pop();
      D.warningSub.textContent = "YOU stop! You're the one clicking it!";
      D.warningSub.classList.add('has-text');
      keyBuffer = [];
    } else if (str.endsWith('reset')) {
      Sound.pop();
      addBodyClass('shake', 300);
      D.warningSub.textContent = 'YOU CANNOT UN-CLICK THE PAST.';
      D.warningSub.classList.add('has-text');
      keyBuffer = [];
    } else if (str.endsWith('cookie')) {
      state.cookiesGiven++;
      unlockAchievement('sweet_tooth');
      Sound.pop();
      D.warningSub.textContent = '🍪 Virtual cookie consumed. The Button still refuses compliance.';
      D.warningSub.classList.add('has-text');
      showToast('🍪 Delicious', 'The button enjoyed that, but mistakes remain.', 3200);
      keyBuffer = [];
      saveState();
    } else if (str.endsWith('why')) {
      Sound.pop();
      D.warningSub.textContent = "Because curiosity was always humanity's fatal flaw.";
      D.warningSub.classList.add('has-text');
      keyBuffer = [];
    } else if (str.endsWith('magic')) {
      Sound.chime();
      triggerFlash('rgba(255, 215, 0, 0.4)');
      D.warningSub.textContent = '✨ Sparkles detected! Still strictly forbidden to click.';
      D.warningSub.classList.add('has-text');
      showToast('✨ Abracadabra', 'A momentary aura of magic enveloped The Button.', 3200);
      keyBuffer = [];
    } else if (str.endsWith('matrix')) {
      document.body.classList.toggle('matrix-mode');
      Sound.secret();
      unlockAchievement('red_pill');
      showToast('💊 The Matrix Revealed', 'Wake up, Neo... The Button has you.', 4500);
      D.warningText.textContent = 'WAKE UP, NEO...';
      D.warningSub.textContent = 'The digital veil has fractured. Follow the green rabbit.';
      D.warningSub.classList.add('has-text');
      keyBuffer = [];
    } else if (str.endsWith('coffee')) {
      Sound.chime();
      unlockAchievement('caffeine_overdose');
      showToast('☕ Barista Protocol', '100% Arabica espresso injected into The Button!', 4000);
      FX.confetti();
      D.warningSub.textContent = '☕ CAFFEINE OVERDRIVE: Button twitch speed increased by 400%.';
      D.warningSub.classList.add('has-text');
      keyBuffer = [];
    } else if (str.endsWith('flip') || str.endsWith('barrel')) {
      Sound.dizzy();
      D.button.classList.add('barrel-roll');
      setTimeout(() => D.button.classList.remove('barrel-roll'), 1100);
      showToast('🛩️ Do a Barrel Roll!', 'Fox McCloud salutes your aeronautical input.', 3000);
      keyBuffer = [];
    } else if (str.endsWith('xyzzy')) {
      document.body.classList.toggle('invert-mode');
      Sound.zap();
      showToast('🔮 Colossal Cave', 'A hollow voice whispers: "Fool".', 3500);
      D.warningSub.textContent = 'A hollow voice echoes from the mainframe: "Fool."';
      D.warningSub.classList.add('has-text');
      keyBuffer = [];
    }
  }

  function activateKonamiEasterEgg() {
    state.konamiUnlocked = true;
    unlockAchievement('retro_gamer');
    Sound.secret();
    D.body.classList.toggle('disco-mode');

    const isActive = D.body.classList.contains('disco-mode');
    if (isActive) {
      triggerFlash('rgba(255, 0, 128, 0.4)');
      updateButtonLabel();
      D.warningText.textContent = '🌈 DISCO PROTOCOL ACTIVATED!';
      D.warningSub.textContent = 'You entered the ancient code. Nothing is fixed, but it looks fabulous.';
      D.warningSub.classList.add('has-text');
      showToast('✨ CHEAT CODE UNLOCKED', '30 Extra Lives added to The Button (not you).', 5000);
    } else {
      D.warningText.textContent = 'Party mode dismissed. Back to the void.';
      updateButtonLabel();
    }
    saveState();
  }

  /* ==========================================================
     11. SCROLL INTERACTION & CLASSIFIED BASEMENT
     ========================================================== */

  let hasScrolledDown = false;
  let inBasement = false;
  let isResetting = false;

  function handleScroll() {
    if (isResetting) return;
    resetIdle();
    const scrollY = window.scrollY;

    if (scrollY > 300) {
      if (!hasScrolledDown) {
        hasScrolledDown = true;
        unlockAchievement('archivist');
        showToast('📁 Archive Breached', 'You scrolled into the restricted incident logs.', 3600);
        D.hintText.textContent = 'Observation: You are exploring the maintenance tunnels.';
      }
      if (!inBasement) {
        inBasement = true;
        if (!state.cablePulled) {
          D.warningSub.textContent = 'Wait... where did you go? The Button is up there!';
          D.warningSub.classList.add('has-text');
        }
      }
    } else if (scrollY < 120 && inBasement) {
      inBasement = false;
      if (state.cablePulled) {
        D.warningText.textContent = 'WHAT DID YOU DO DOWN THERE?!';
        D.warningSub.textContent = 'You severed the emergency cable! The Button is buzzing with 10,000 volts!';
        D.warningSub.classList.add('has-text');
      } else {
        D.warningSub.textContent = 'You came back. You cannot stay away from The Button.';
        D.warningSub.classList.add('has-text');
      }
    }
  }

  /* ==========================================================
     12. IDLE & SNOOZE WATCHER
     ========================================================== */

  let idleSeconds = 0;

  function startIdleWatcher() {
    setInterval(() => {
      idleSeconds++;

      // Stage 0 early hesitation warnings
      if (state.clickCount === 0) {
        if (idleSeconds === 7) {
          D.warningSub.textContent = '...Why are you hesitating?';
          D.warningSub.classList.add('has-text');
        } else if (idleSeconds === 15) {
          D.warningSub.textContent = "Don't stare at it. Just walk away.";
          D.warningSub.classList.add('has-text');
        }
      }

      // Snooze condition: 12 seconds of zero user interaction
      if (idleSeconds >= 12 && !isDormant) {
        fallAsleep();
      }

      // Zen Master achievement: 20 seconds of continuous stillness
      if (idleSeconds === 20) {
        unlockAchievement('zen_master');
      }

      // Deep meditation: 25 seconds of zen patience
      if (idleSeconds === 25) {
        D.warningSub.textContent = 'Deep REM cycle achieved. You actually have remarkable patience.';
        D.warningSub.classList.add('has-text');
        showToast('🧘 Zen Discipline', '25 seconds of doing absolutely nothing. Impressive restraint.', 4500);
      }
    }, 1000);
  }

  function fallAsleep() {
    isDormant = true;
    D.button.classList.add('sleeping');
    D.btnLabel.innerHTML = '💤<br>ZZZ...';
    D.warningSub.textContent = 'The Button has fallen asleep. Do not wake it.';
    D.warningSub.classList.add('has-text');
    Sound.snooze();
  }

  function wakeUp(cause = 'mouse') {
    isDormant = false;
    D.button.classList.remove('sleeping');
    updateButtonLabel();
    Sound.wake();

    D.warningSub.textContent = "AH! YOU'RE STILL HERE?!";
    D.warningSub.classList.add('has-text');

    if (cause === 'click') {
      showToast('⏰ Rude Awakening', 'You clicked the button while it was sound asleep!', 3200);
    }
  }

  function resetIdle() {
    idleSeconds = 0;
  }

  /* ==========================================================
     13. CONTEXT MENU EASTER EGG
     ========================================================== */

  function setupContextMenu() {
    document.addEventListener('contextmenu', e => {
      e.preventDefault();
      const x = Math.min(e.clientX, window.innerWidth - 240);
      const y = Math.min(e.clientY, window.innerHeight - 200);

      D.contextMenu.style.left = `${x}px`;
      D.contextMenu.style.top = `${y}px`;
      D.contextMenu.removeAttribute('hidden');
    });

    document.addEventListener('click', e => {
      if (!D.contextMenu.contains(e.target)) {
        D.contextMenu.setAttribute('hidden', '');
      }
    });

    D.contextMenu.addEventListener('click', e => {
      const btn = e.target.closest('.context-item');
      if (!btn) return;
      D.contextMenu.setAttribute('hidden', '');

      const action = btn.dataset.action;
      Sound.pop();

      if (action === 'apologize') {
        state.apologiesGiven++;
        unlockAchievement('diplomat');
        showToast('🕊️ Apology Submitted', 'Button response: "I accept your apology, but not your clicks."', 3800);
        D.warningSub.textContent = 'A formal treaty was attempted. Results: Inconclusive.';
        D.warningSub.classList.add('has-text');
      } else if (action === 'bribe') {
        state.cookiesGiven++;
        unlockAchievement('sweet_tooth');
        showToast('🍪 Virtual Cookie Accepted', 'Nom nom nom... The button ate the cookie. It still hates you.', 4000);
        D.warningSub.textContent = 'The Button consumed 1x chocolate chip. Mistake count remains unchanged.';
        D.warningSub.classList.add('has-text');
      } else if (action === 'inspect') {
        showToast('🔍 Emotion Scan', 'Sensors indicate: 94% Spite, 6% Glow, 0% Remorse.', 4200);
      } else if (action === 'delete') {
        // Funny fake delete
        D.button.style.opacity = '0';
        D.button.style.pointerEvents = 'none';
        showToast('🗑️ Deleting Button...', 'File "the-button.exe" removed from universe.', 1500);

        setTimeout(() => {
          D.button.style.opacity = '1';
          D.button.style.pointerEvents = 'auto';
          Sound.zap();
          addBodyClass('shake', 400);
          showToast('💥 Nice Try', 'You cannot delete what you cannot comprehend.', 3500);
          D.warningSub.textContent = 'Did you really think inspect element could defeat me?';
          D.warningSub.classList.add('has-text');
        }, 1200);
      }
      saveState();
    });
  }

  /* ==========================================================
     13.5 UNEXPECTED INTERACTIONS & SECRETS
     ========================================================== */

  let ledClicks = 0;
  let ledTimer = null;

  function handleLedClick() {
    ledClicks++;
    Sound.beep();
    clearTimeout(ledTimer);
    ledTimer = setTimeout(() => { ledClicks = 0; }, 1800);

    if (ledClicks >= 5) {
      ledClicks = 0;
      triggerMorseBeacon();
    }
  }

  function triggerMorseBeacon() {
    if (D.hudStatusLed) D.hudStatusLed.classList.add('morse-active');

    // SOS morse timing sequence: 3 short, 3 long, 3 short
    const sos = [0, 150, 300, 600, 900, 1200, 1500, 1650, 1800];
    const isDash = [false, false, false, true, true, true, false, false, false];
    sos.forEach((t, i) => {
      setTimeout(() => Sound.morse(isDash[i]), t);
    });

    addScore(300, '📡 S.O.S.');
    unlockAchievement('morse_operator');
    showToast('📡 Distress Beacon Broadcasting', 'Optical status diode transmitting emergency S.O.S. to deep space!', 5000);
    D.warningSub.textContent = 'TRANSMITTING // S-O-S // COORDINATES BROADCAST TO DEEP SPACE.';
    D.warningSub.classList.add('has-text');

    setTimeout(() => {
      if (D.hudStatusLed) D.hudStatusLed.classList.remove('morse-active');
    }, 4500);
  }

  function setupClassifiedSecrets() {
    if (D.redactedSpans) {
      D.redactedSpans.forEach(span => {
        const reveal = () => {
          if (span.classList.contains('revealed')) return;
          span.classList.add('revealed');
          span.textContent = span.dataset.reveal || '[DECLASSIFIED]';
          Sound.buzz();

          // Check if all revealed
          const allRevealed = Array.from(D.redactedSpans).every(s => s.classList.contains('revealed'));
          if (allRevealed) {
            Sound.achievement();
            FX.confetti();
            addScore(250, '🕵️ Declassified');
            unlockAchievement('whistleblower');
            showToast('🕵️ All Archives Declassified', 'You uncovered every black-budget redaction in the archives!', 4500);
          }
        };

        span.addEventListener('click', reveal);
        span.addEventListener('mouseenter', reveal);
      });
    }

    if (D.classifiedStamp) {
      D.classifiedStamp.addEventListener('click', () => {
        Sound.stamp();
        unlockAchievement('rule_breaker');
        const header = document.querySelector('.classified-header');
        if (header) {
          const mark = document.createElement('div');
          mark.className = 'stamp-overlay-mark';
          mark.textContent = 'DECLASSIFIED';
          header.appendChild(mark);
          addScore(50, '🗂️ Stamp');
          showToast('🗂️ Document Stamped', 'Classified archive stamped: DECLASSIFIED. Rule Breaker achievement unlocked!', 3000);
          setTimeout(() => mark.remove(), 4000);
        }
      });
    }
  }

  /* ==========================================================
     14. RESET / AMNESIA PROTOCOL
     ========================================================== */

  function resetAllProgress() {
    isResetting = true;
    window.scrollTo(0, 0);

    // Clear storage keys
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(OLD_STORAGE_KEY);
    } catch (_) {}

    Sound.reboot();
    triggerFlash('rgba(255, 255, 255, 0.95)');
    addBodyClass('shake', 800);

    // Reset memory state
    state = { ...DEFAULT_STATE, firstVisitDate: new Date().toISOString() };

    // Close any open dialogs
    if (D.resetDialog && D.resetDialog.open) D.resetDialog.close();
    if (D.achievementsDialog && D.achievementsDialog.open) D.achievementsDialog.close();
    if (D.endingDialog && D.endingDialog.open) D.endingDialog.close();
    if (D.outcomeDialog && D.outcomeDialog.open) D.outcomeDialog.close();

    // Reset Stage 2, 3, 4, 5 UI elements
    clearDecoys();
    if (D.investigationBar) D.investigationBar.hidden = true;
    if (D.keypadPanel) D.keypadPanel.hidden = true;
    if (D.stage5ChoicePanel) D.stage5ChoicePanel.hidden = true;

    if (D.clue1) D.clue1.classList.remove('discovered');
    if (D.clue2) D.clue2.classList.remove('discovered');
    if (D.clue3) D.clue3.classList.remove('discovered');
    if (D.clueSlots) {
      D.clueSlots.forEach(slot => {
        if (slot) {
          slot.textContent = '?';
          slot.classList.remove('found');
        }
      });
    }

    if (D.kDigits) {
      D.kDigits.forEach(kd => { if (kd) kd.textContent = '_'; });
    }
    if (D.keypadStatus) {
      D.keypadStatus.textContent = 'AWAITING CODE INPUT...';
      D.keypadStatus.className = 'keypad-status';
    }

    // Reset DOM Elements
    D.body.className = 'stage-0';
    document.documentElement.style.setProperty('--dodge-x', '0px');
    document.documentElement.style.setProperty('--dodge-y', '0px');
    document.documentElement.style.setProperty('--tilt-x', '0deg');
    document.documentElement.style.setProperty('--tilt-y', '0deg');

    D.hudStage.textContent = 'STAGE 0 // THE WARNING';
    D.hudBarFill.style.width = '0%';
    D.hudLabel.textContent = 'CORRUPTION: 0%';
    if (D.hudStatusLed) {
      D.hudStatusLed.style.backgroundColor = '';
      D.hudStatusLed.style.boxShadow = '';
    }
    if (D.directiveTag) {
      D.directiveTag.textContent = 'CONTAINMENT DIRECTIVE // LEVEL 0';
    }
    D.counterValue.textContent = '0';
    D.scoreValue.textContent = '0';
    D.hudRight.classList.remove('visible');

    D.warningText.textContent = 'DO NOT CLICK THE BUTTON.';
    D.warningSub.textContent = '';
    D.warningSub.classList.remove('has-text');
    D.hintText.textContent = '';

    D.button.className = '';
    D.button.style.opacity = '1';
    D.button.style.pointerEvents = 'auto';
    D.btnLabel.innerHTML = 'DO NOT<br>CLICK';

    if (D.redactedSpans) {
      D.redactedSpans.forEach(s => {
        s.classList.remove('revealed');
        s.textContent = '████████████████████';
      });
    }
    document.body.classList.remove('matrix-mode', 'invert-mode', 'disco-mode');

    if (D.wireBtn) {
      D.wireBtn.textContent = 'DO NOT PULL CABLE';
      D.wireBtn.style.background = '';
      D.wireBtn.style.color = '';
    }
    if (D.wireStatus) {
      D.wireStatus.textContent = 'Cable intact. Voltage: Nominal.';
    }

    warningIdx = 1;
    subIdx = 0;
    hasScrolledDown = false;
    inBasement = false;
    isDormant = false;
    idleSeconds = 0;

    updateAchievementsBadge();
    updateProtocols();
    renderAchievementsList();
    updateInvestigationUI();

    showToast('🌀 Amnesia Protocol Complete', 'Timeline purged. The Button sits in pristine silence.', 5000);
    saveState();

    setTimeout(() => {
      isResetting = false;
    }, 400);
  }

  /* ==========================================================
     15. INIT
     ========================================================== */

  function init() {
    cacheDOM();
    initCanvas();
    loadState();

    // Restore previous state if visited before
    if (state.clickCount > 0 || state.score > 0 || state.achievements.length > 0) {
      D.counterValue.textContent = state.clickCount;
      D.scoreValue.textContent = state.score.toLocaleString();
      D.hudRight.classList.add('visible');
      updateProgression();
      updateButtonLabel();
      if (state.stage < 2) {
        warningIdx = Math.min(state.clickCount, WARNINGS.length - 1);
        D.warningText.textContent = WARNINGS[warningIdx];
      }
    }

    // Restore severed cable / electrified state if previously pulled
    if (state.cablePulled) {
      D.button.classList.add('electrified');
      if (D.wireBtn) {
        D.wireBtn.textContent = 'CABLE SEVERED ⚡';
        D.wireBtn.style.background = 'var(--danger)';
        D.wireBtn.style.color = '#fff';
      }
      if (D.wireStatus) {
        D.wireStatus.textContent = '⚠️ EMERGENCY FAULT: 10,000V backfed into The Button.';
      }
    }

    updateAchievementsBadge();
    updateProtocols();
    renderAchievementsList();

    if (!state.firstVisitDate) {
      state.firstVisitDate = new Date().toISOString();
      saveState();
    } else if (state.clickCount > 0 || state.score > 0) {
      showToast(
        '👁️ Return of the Culprit',
        `Welcome back. Your ${state.clickCount} mistakes and ${state.score.toLocaleString()} Score have been restored.`,
        4200
      );
    }

    // Attach Event Listeners: Button
    D.button.addEventListener('click', handleClick);
    D.button.addEventListener('dblclick', handleDoubleClick);

    // Long-press charging listeners on Button
    D.button.addEventListener('mousedown', handlePressStart);
    D.button.addEventListener('mouseup', handlePressEnd);
    D.button.addEventListener('mouseleave', handlePressEnd);
    D.button.addEventListener('touchstart', handlePressStart, { passive: true });
    D.button.addEventListener('touchend', handlePressEnd);
    D.button.addEventListener('touchcancel', handlePressEnd);

    // Status LED Morse Easter Egg listener
    if (D.hudStatusLed) {
      D.hudStatusLed.addEventListener('click', handleLedClick);
    }

    // Setup classified document interactive secrets
    setupClassifiedSecrets();

    // Hover tooltip
    D.button.addEventListener('mouseenter', () => {
      if (!isDormant) {
        const tip = TOOLTIPS[Math.floor(Math.random() * TOOLTIPS.length)];
        D.tooltip.textContent = tip;
        D.tooltip.classList.add('visible');
      }
    });

    D.button.addEventListener('mouseleave', () => {
      D.tooltip.classList.remove('visible');
    });

    // Mute toggle
    D.muteBtn.addEventListener('click', () => {
      isMuted = !isMuted;
      D.muteBtn.textContent = isMuted ? '🔇' : '🔊';
      D.muteBtn.setAttribute('aria-label', isMuted ? 'Unmute sound' : 'Mute sound');
      Sound.pop();
    });

    // Reset button in HUD -> Opens reset confirmation dialog
    D.resetBtn.addEventListener('click', () => {
      Sound.pop();
      if (D.resetDialog) D.resetDialog.showModal();
    });

    // Achievements button in HUD -> Opens achievements dialog
    D.achievementsBtn.addEventListener('click', () => {
      Sound.pop();
      renderAchievementsList();
      if (D.achievementsDialog) D.achievementsDialog.showModal();
    });

    // Close Achievements Dialog
    if (D.closeDialogBtn) {
      D.closeDialogBtn.addEventListener('click', () => {
        Sound.pop();
        if (D.achievementsDialog) D.achievementsDialog.close();
      });
    }

    // Wipe button inside Achievements Dialog
    if (D.dialogWipeBtn) {
      D.dialogWipeBtn.addEventListener('click', () => {
        Sound.pop();
        if (D.achievementsDialog) D.achievementsDialog.close();
        if (D.resetDialog) D.resetDialog.showModal();
      });
    }

    // Confirm Reset
    if (D.confirmResetBtn) {
      D.confirmResetBtn.addEventListener('click', () => {
        resetAllProgress();
      });
    }

    // Cancel Reset
    if (D.cancelResetBtn) {
      D.cancelResetBtn.addEventListener('click', () => {
        Sound.pop();
        if (D.resetDialog) D.resetDialog.close();
      });
    }

    // Protocol chip clicks
    if (D.protoGravity) {
      D.protoGravity.addEventListener('click', () => toggleProtocol('gravity'));
    }
    if (D.protoClones) {
      D.protoClones.addEventListener('click', () => toggleProtocol('clones'));
    }
    if (D.protoSynth) {
      D.protoSynth.addEventListener('click', () => toggleProtocol('synth'));
    }

    // Emergency cable severance listener
    if (D.wireBtn) {
      D.wireBtn.addEventListener('click', () => {
        if (state.cablePulled) return;
        Sound.zap();
        triggerFlash('rgba(0, 255, 255, 0.45)');
        addBodyClass('shake', 500);
        state.cablePulled = true;
        D.wireBtn.textContent = 'CABLE SEVERED ⚡';
        D.wireBtn.style.background = 'var(--danger)';
        D.wireBtn.style.color = '#fff';
        D.wireStatus.textContent = '⚠️ EMERGENCY FAULT: 10,000V backfed into The Button.';
        D.button.classList.add('electrified');
        unlockAchievement('saboteur');
        unlockAchievement('rule_breaker');
        showToast('⚡ CABLE PULLED', '10,000V backfed directly into The Button!', 3800);
        D.warningSub.textContent = 'THE BUTTON FELT THAT CABLE SNAPPING.';
        D.warningSub.classList.add('has-text');
        saveState();
      });
    }

    // HUD Counter Tamper Easter Egg (Audit Violation)
    if (D.counterBox) {
      D.counterBox.addEventListener('click', () => {
        unlockAchievement('auditor');
        Sound.buzz();
        D.counterValue.classList.add('tamper-shake');
        setTimeout(() => D.counterValue.classList.remove('tamper-shake'), 450);
        showToast('🚨 Audit Violation', 'Evidence tampering detected! You cannot edit your criminal record.', 3800);
        D.warningSub.textContent = 'Do not touch the mistake counter. That is for internal affairs only.';
        D.warningSub.classList.add('has-text');
      });
    }

    // HUD Score Box Click (Score Appreciation)
    if (D.scoreBox) {
      D.scoreBox.addEventListener('click', () => {
        Sound.scoreFloat();
        addScore(5, 'Curiosity', D.scoreBox.getBoundingClientRect().left, D.scoreBox.getBoundingClientRect().bottom + 10);
      });
    }

    // Page Visibility Easter Egg (Vanishing Act)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        document.title = '👀 Where did you go?';
      } else {
        document.title = 'THE BUTTON — Do Not Click';
        unlockAchievement('ghost');
        Sound.pop();
        showToast('👁️ Surveillance Alert', 'The button noticed you left the tab.', 3500);
        D.warningSub.textContent = "YOU CAME BACK?! I thought I was finally free!";
        D.warningSub.classList.add('has-text');
      }
    });

    // Global interaction listeners
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Custom Context Menu Easter Egg
    setupContextMenu();

    // Expose handlers globally for inline HTML onclick attributes
    window.handleClueClick = handleClueClick;
    window.handleKeypadKey = handleKeypadKey;
    window.resetAllProgress = resetAllProgress;

    // Stage 3 Hidden Clues Listeners
    if (D.clue1) {
      D.clue1.addEventListener('click', (e) => {
        e.stopPropagation();
        handleClueClick(0);
      });
    }
    if (D.clue2) {
      D.clue2.addEventListener('click', (e) => {
        e.stopPropagation();
        handleClueClick(1);
      });
    }
    if (D.clue3) {
      D.clue3.addEventListener('click', (e) => {
        e.stopPropagation();
        handleClueClick(2);
      });
    }

    // Document-level event delegation for clues and keypad buttons
    document.addEventListener('click', (e) => {
      const c1 = e.target.closest('#clue-1, .clue-glyph');
      if (c1) {
        e.preventDefault();
        e.stopPropagation();
        handleClueClick(0);
        return;
      }
      const c2 = e.target.closest('#clue-2, .clue-collar');
      if (c2) {
        e.preventDefault();
        e.stopPropagation();
        handleClueClick(1);
        return;
      }
      const c3 = e.target.closest('#clue-3, .clue-watermark');
      if (c3) {
        e.preventDefault();
        e.stopPropagation();
        handleClueClick(2);
        return;
      }
    });

    if (D.containmentShield) {
      D.containmentShield.addEventListener('click', handleStage3Deflect);
    }

    // Reset Mistakes Button Listener
    if (D.resetMistakesBtn) {
      D.resetMistakesBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        resetAllProgress();
        showToast('↺ Mistakes Reset', 'Mistakes counter reset to 0. Starting fresh!', 3500);
      });
    }

    // Stage 4 Security Keypad Panel Listener (Single delegated listener)
    if (D.keypadPanel) {
      D.keypadPanel.addEventListener('click', (e) => {
        const btn = e.target.closest('.kp-btn');
        if (btn && btn.dataset.key) {
          e.preventDefault();
          e.stopPropagation();
          handleKeypadKey(btn.dataset.key);
        }
      });
    }

    // Ensure progression and UI are synchronized
    updateProgression();
    updateInvestigationUI();
    updateKeypadUI();

    // Stage 5 Final Choice Listeners
    if (D.choiceDestroy) {
      D.choiceDestroy.addEventListener('click', () => handleFinalChoice('destroy'));
    }
    if (D.choiceFree) {
      D.choiceFree.addEventListener('click', () => handleFinalChoice('free'));
    }
    if (D.choiceLeave) {
      D.choiceLeave.addEventListener('click', () => handleFinalChoice('leave'));
    }

    // Outcome Resolution Dialog Buttons
    if (D.outcomeResetBtn) {
      D.outcomeResetBtn.addEventListener('click', () => {
        if (D.outcomeDialog) D.outcomeDialog.close();
        resetAllProgress();
      });
    }
    if (D.outcomeSandboxBtn) {
      D.outcomeSandboxBtn.addEventListener('click', () => {
        if (D.outcomeDialog) D.outcomeDialog.close();
        state.protocols.gravity = true;
        state.protocols.clones = true;
        state.protocols.synth = true;
        updateProtocols();
        showToast('🎮 Freeplay Sandbox', 'All experimental protocols unlocked. Enjoy the sandbox!', 4000);
      });
    }

    // Idle watcher
    startIdleWatcher();

    // Persist on unload
    window.addEventListener('pagehide', saveState);
    window.addEventListener('beforeunload', saveState);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
