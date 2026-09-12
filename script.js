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
      title: 'First Transgression',
      desc: 'You clicked it. You literally had one job.',
      pts: 100
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
      icon: '🔌',
      title: 'Domestic Terrorist',
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
      id: 'auditor',
      icon: '🚨',
      title: 'Audit Violation',
      desc: 'Attempted to tamper with your official mistake records.',
      pts: 200
    },
    {
      id: 'ghost',
      icon: '👁️',
      title: 'Vanishing Act',
      desc: 'Left the browser tab and returned to face the consequences.',
      pts: 150
    },
    {
      id: 'ascended',
      icon: '👑',
      title: 'Transcendent Defiance',
      desc: 'Reached Stage 5 // The Singularity (50+ clicks).',
      pts: 1000
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
    lastVisitDate:     null
  };

  let state = { ...DEFAULT_STATE };

  function loadState() {
    try {
      let raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        // Migration from milestone 2
        raw = localStorage.getItem(OLD_STORAGE_KEY);
      }
      if (raw) {
        const parsed = JSON.parse(raw);
        state = {
          ...DEFAULT_STATE,
          ...parsed,
          protocols: { ...DEFAULT_STATE.protocols, ...(parsed.protocols || {}) },
          achievements: Array.isArray(parsed.achievements) ? parsed.achievements : []
        };
      }
    } catch (_) { /* LocalStorage fallback */ }
  }

  function saveState() {
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

  function handleClick(e) {
    const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
    const timeSinceLast = now - lastClickTime;
    lastClickTime = now;

    // Wake up if sleeping
    if (isDormant) {
      wakeUp('click');
    }

    // Double-click detection (< 300ms)
    if (timeSinceLast < 300 && timeSinceLast > 10) {
      handleDoubleClick();
      return;
    }

    executeNormalClick(e);
  }

  function executeNormalClick(e) {
    state.clickCount++;

    // Unlocks first transgression achievement on 1st click
    if (state.clickCount === 1) {
      unlockAchievement('first_contact');
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

    // Protocol: Ghost Decoys
    if (state.protocols.clones) {
      FX.spawnGhost(cx, cy + rect.height / 2);
    }

    // Visual button ripple flash
    D.button.classList.add('clicked');
    setTimeout(() => D.button.classList.remove('clicked'), 200);

    // Pop counter
    D.counterValue.classList.add('pop');
    setTimeout(() => D.counterValue.classList.remove('pop'), 160);
    D.counterValue.textContent = state.clickCount;
    D.hudRight.classList.add('visible');

    // Progression & Corruption updates
    updateProgression();

    // Button label mutation
    updateButtonLabel();

    // Warnings cycling
    D.warningText.textContent = WARNINGS[Math.min(warningIdx, WARNINGS.length - 1)];
    warningIdx = (warningIdx + 1) % WARNINGS.length;

    // Subtext message (if not electrified)
    if (!state.cablePulled && !D.button.classList.contains('electrified')) {
      D.warningSub.textContent = SUB_WARNINGS[subIdx % SUB_WARNINGS.length];
      D.warningSub.classList.add('has-text');
      subIdx++;
    }

    // Evasive jitter in Stage 2+ (10+ clicks)
    if (state.clickCount >= 10) {
      applyButtonDodge();
    }

    saveState();
  }

  function updateProgression() {
    const c = state.clickCount;
    let stageNum = 0;
    let stageName = 'STAGE 0 // THE WARNING';
    let corruption = Math.min(Math.round(c * 2), 100);

    D.hudBarFill.style.width = corruption + '%';
    D.hudLabel.textContent = `CORRUPTION: ${corruption}%`;

    let ledColor = '#5a5af8';
    let directiveText = 'CONTAINMENT DIRECTIVE // LEVEL 0';

    // Stage milestones
    if (c >= 50) {
      stageNum = 5;
      stageName = 'STAGE 5 // THE SINGULARITY';
      D.body.className = 'stage-5';
      ledColor = '#ffd700';
      directiveText = 'REALITY COLLAPSE // THE SINGULARITY';
    } else if (c >= 35) {
      stageNum = 4;
      stageName = 'STAGE 4 // MELTDOWN';
      D.body.className = 'stage-4';
      ledColor = '#00ff88';
      directiveText = 'CODE RED // NUCLEAR MELTDOWN';
    } else if (c >= 20) {
      stageNum = 3;
      stageName = 'STAGE 3 // CHAOS PROTOCOL';
      D.body.className = 'stage-3';
      ledColor = '#e056fd';
      directiveText = 'CRITICAL ANOMALY // CHAOS PROTOCOL';
    } else if (c >= 10) {
      stageNum = 2;
      stageName = 'STAGE 2 // ESCALATION';
      D.body.className = 'stage-2';
      ledColor = '#ffa502';
      directiveText = 'ANOMALY ALERT // EVASIVE TRAJECTORY';
    } else if (c >= 5) {
      stageNum = 1.5;
      stageName = 'STAGE 1.5 // DEFIANCE';
      D.body.className = 'stage-1';
      ledColor = '#ff4757';
      directiveText = 'CONTAINMENT STATUS // COMPROMISED';
    } else if (c >= 1) {
      stageNum = 1;
      stageName = 'STAGE 1 // FIRST CONTACT';
      D.body.className = 'stage-1';
      ledColor = '#ff4757';
      directiveText = 'CONTAINMENT STATUS // COMPROMISED';
    } else {
      D.body.className = 'stage-0';
    }

    state.stage = stageNum;
    D.hudStage.textContent = stageName;

    if (D.hudStatusLed) {
      D.hudStatusLed.style.backgroundColor = ledColor;
      D.hudStatusLed.style.boxShadow = `0 0 10px ${ledColor}`;
    }
    if (D.directiveTag) {
      D.directiveTag.textContent = directiveText;
    }

    // Milestone celebrations
    if (c === 1) {
      triggerFlash('rgba(255, 71, 87, 0.2)');
      showToast('⚠️ Containment Breach', 'You clicked it. You were explicitly told not to.', 3500);
      D.hintText.textContent = 'Hint: The button remembers every transgression.';
    } else if (c === 5) {
      showToast('🔥 Agitation Detected', 'The button is getting warm. Thermal sensors spiking.', 3500);
      D.hintText.textContent = 'Hint: Rapid clicks will only make it angrier.';
    } else if (c === 10) {
      triggerFlash('rgba(255, 165, 2, 0.25)');
      showToast('⚡ STAGE 2 UNLOCKED', 'The button has acquired autonomous evasive instincts.', 4000);
      D.hintText.textContent = 'Notice: It is actively attempting to avoid your cursor.';
      FX.confetti();
    } else if (c === 20) {
      triggerFlash('rgba(224, 86, 253, 0.3)');
      showToast('🚨 SYSTEM OVERLOAD', 'Containment is breaking down. Have mercy on the button.', 4500);
      D.hintText.textContent = 'Critical: Reality anchor degrading.';
      FX.confetti();
    } else if (c === 35) {
      triggerFlash('rgba(0, 255, 136, 0.35)');
      showToast('☣️ NUCLEAR MELTDOWN', 'Thermal threshold exceeded. Core containment liquefying.', 4500);
      D.hintText.textContent = 'Radiation levels dangerous. Please evacuate the web page.';
      FX.confetti();
    } else if (c === 50) {
      triggerFlash('rgba(255, 215, 0, 0.5)');
      showToast('✨ THE SINGULARITY', 'You broke the simulation. The Button is now self-aware.', 6000);
      D.hintText.textContent = 'Transcended. All resistance was mathematically futile.';
      unlockAchievement('ascended');
      FX.confetti();
    }
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

    // 3. Evasive proximity dodge in Stage 2+ (10+ clicks) if gravity protocol is NOT pulling it
    if (state.clickCount >= 10 && !state.protocols.gravity && !isDizzy && !isDormant) {
      if (dist < 85 && dist > 15) {
        const angle = Math.atan2(dy, dx);
        const dodgeDist = Math.min(32, 95 - dist);
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
        active === D.cancelResetBtn
      ) {
        return; // Allow native dialog / control button trigger
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
      warningIdx = Math.min(state.clickCount, WARNINGS.length - 1);
      D.warningText.textContent = WARNINGS[warningIdx];
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
