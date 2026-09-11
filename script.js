/* ============================================================
   THE BUTTON — script.js
   Milestone 1: Foundation

   Modules (in order):
     1. CONFIG      — static data (messages, tooltips)
     2. STATE       — in-memory state + localStorage
     3. DOM         — cached element references
     4. AUDIO       — Web Audio API tone generator
     5. EFFECTS     — shake, flash, toast
     6. BUTTON      — click & hover interaction handlers
     7. IDLE        — idle watcher (stage 0 escalation)
     8. INIT        — bootstrap
   ============================================================ */

(function () {
  'use strict';

  /* ==========================================================
     1. CONFIG
     ========================================================== */

  const STORAGE_KEY = 'theButton_m1';

  /** Warning messages shown in sequence after each click */
  const WARNINGS = [
    'DO NOT CLICK THE BUTTON.',
    'I TOLD YOU NOT TO CLICK IT.',
    'WHY WOULD YOU DO THAT.',
    'ARE YOU HAPPY NOW?',
    'You clicked it again.',
    'This is getting out of hand.',
    'I cannot stop you, can I.',
    'FINE. KEEP CLICKING.',
    'THE BUTTON REMEMBERS.',
    'mistakes were made.',
  ];

  /** Sub-line messages (shown below main warning after click 1) */
  const SUB_WARNINGS = [
    'The button will remember this.',
    'Something has changed.',
    'This was not supposed to happen.',
    'Resistance is futile.',
    'Keep going. See what happens.',
    '...why.',
    'You are still here.',
    'The button is watching.',
  ];

  /** Tooltip messages shown on button hover */
  const TOOLTIPS = [
    "I'm serious.",
    "Don't.",
    "You will regret this.",
    "Last chance.",
    "Please, no.",
    "I'm warning you.",
  ];

  /** Idle escalation messages (Stage 0, before first click) */
  const IDLE_MESSAGES = [
    { delay: 15, text: '...Why are you still here?' },
    { delay: 45, text: 'Fine. Do what you want. Don\'t blame me.' },
    { delay: 90, text: 'I\'m waiting...' },
    { delay: 150, text: 'You are remarkably patient. Or away from keyboard.' },
  ];


  /* ==========================================================
     2. STATE
     ========================================================== */

  /**
   * Default state shape.
   * All fields that need to persist go here.
   */
  const DEFAULT_STATE = {
    clickCount:      0,
    firstVisitDate:  null,
    lastVisitDate:   null,
    firstClickDelay: null,   // ms from page load to very first click
    totalTime:       0,      // cumulative seconds on page
  };

  let state = { ...DEFAULT_STATE };
  const pageLoadTime  = Date.now();
  let   sessionStart  = Date.now();

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) state = { ...DEFAULT_STATE, ...JSON.parse(raw) };
    } catch (_) { /* silent — localStorage may be unavailable */ }
  }

  function saveState() {
    try {
      const now = Date.now();
      state.totalTime      += Math.floor((now - sessionStart) / 1000);
      sessionStart          = now;
      state.lastVisitDate   = new Date().toISOString();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (_) { /* silent */ }
  }


  /* ==========================================================
     3. DOM
     ========================================================== */

  /** All element references cached here — never queried inside event handlers */
  const D = {};

  function cacheDOM() {
    const g = id => document.getElementById(id);
    D.body          = document.body;
    D.hudLeft       = g('hud-left');
    D.hudStage      = g('hud-stage');
    D.hudBarFill    = g('hud-bar-fill');
    D.hudLabel      = g('hud-label');
    D.hudRight      = g('hud-right');
    D.counterValue  = g('counter-value');
    D.muteBtn       = g('mute-btn');
    D.warningText   = g('warning-text');
    D.warningSub    = g('warning-sub');
    D.buttonWrap    = g('button-wrap');
    D.button        = g('the-button');
    D.btnLabel      = g('btn-label');
    D.tooltip       = g('tooltip');
    D.hintText      = g('hint-text');
    D.toastContainer= g('toast-container');
  }


  /* ==========================================================
     4. AUDIO ENGINE
     Web Audio API — generates tones programmatically.
     No audio files needed, no network requests.
     ========================================================== */

  let audioCtx = null;
  let isMuted  = false;

  /** Lazily creates / resumes the AudioContext. */
  function getAudioCtx() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  }

  /**
   * Plays a single tone.
   * @param {number} freq      – frequency in Hz
   * @param {number} duration  – note duration in seconds
   * @param {string} type      – OscillatorNode type ('sine'|'square'|'sawtooth'|'triangle')
   * @param {number} gain      – peak gain (0–1)
   * @param {number} [delay=0] – schedule offset from now in seconds
   */
  function playTone(freq, duration, type = 'sine', gain = 0.22, delay = 0) {
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
    } catch (_) { /* silent — AudioContext may be blocked */ }
  }

  /** Preset sounds */
  const Sound = {
    /** Short click blip — pitch rises slightly with click count */
    click() {
      const freq = Math.min(160 + state.clickCount * 3, 340);
      playTone(freq, 0.13, 'square', 0.14);
      playTone(freq * 1.5, 0.08, 'sine', 0.06, 0.06);
    },

    /** Warning sting (idle / idle-escalation) */
    warn() {
      playTone(90,  0.7, 'sawtooth', 0.10);
      playTone(110, 0.4, 'sawtooth', 0.07, 0.1);
    },
  };


  /* ==========================================================
     5. EFFECTS
     ========================================================== */

  /**
   * Temporarily adds a CSS class to <body>, then removes it
   * after the animation ends (or a fallback timeout).
   */
  function addBodyClass(cls, fallbackMs = 600) {
    if (D.body.classList.contains(cls)) return;
    D.body.classList.add(cls);
    const cleanup = () => D.body.classList.remove(cls);
    D.body.addEventListener('animationend', cleanup, { once: true });
    setTimeout(cleanup, fallbackMs);   // safety fallback
  }

  /** Creates a brief full-screen flash overlay. */
  function triggerFlash(colorRgba = 'rgba(255,255,255,0.12)') {
    const el = document.createElement('div');
    el.style.cssText = `
      position:fixed;inset:0;
      background:${colorRgba};
      pointer-events:none;z-index:9999;
      animation:none;opacity:1;
      transition:opacity 0.28s ease;
    `;
    document.body.appendChild(el);
    requestAnimationFrame(() => {
      el.style.opacity = '0';
      el.addEventListener('transitionend', () => el.remove(), { once: true });
    });
  }

  /**
   * Shows a toast notification.
   * @param {string} title   – bold first line
   * @param {string} body    – smaller second line
   * @param {number} [ms=3600] – auto-dismiss delay in ms
   */
  function showToast(title, body, ms = 3600) {
    const t = document.createElement('div');
    t.className = 'toast';
    t.innerHTML = `<div class="toast-title">${title}</div><div class="toast-body">${body}</div>`;
    D.toastContainer.appendChild(t);

    // Trigger CSS transition on next frame
    requestAnimationFrame(() => requestAnimationFrame(() => t.classList.add('show')));

    setTimeout(() => {
      t.classList.remove('show');
      t.addEventListener('transitionend', () => t.remove(), { once: true });
    }, ms);
  }


  /* ==========================================================
     6. BUTTON — Interaction handlers
     ========================================================== */

  // Index trackers for cycling through message arrays
  let warningIdx = 1;   // start at 1; index 0 is the initial text set in HTML
  let subIdx     = 0;

  /**
   * Called on every single click of THE BUTTON.
   */
  function handleClick(e) {
    state.clickCount++;

    // Record time of very first click
    if (state.firstClickDelay === null) {
      state.firstClickDelay = Date.now() - pageLoadTime;
    }

    // --- Feedback: sound ---
    Sound.click();

    // --- Feedback: button flash class ---
    D.button.classList.add('clicked');
    setTimeout(() => D.button.classList.remove('clicked'), 220);

    // --- Feedback: screen shake (after first click) ---
    if (state.clickCount > 1) {
      addBodyClass('shake');
    }

    // --- Feedback: screen flash ---
    if (state.clickCount === 1) {
      triggerFlash('rgba(240, 80, 80, 0.10)');
    }

    // --- UI: warning text cycle ---
    D.warningText.textContent = WARNINGS[Math.min(warningIdx, WARNINGS.length - 1)];
    warningIdx++;

    // --- UI: sub-warning (appears after click 1) ---
    if (state.clickCount >= 1) {
      D.warningSub.textContent = SUB_WARNINGS[subIdx % SUB_WARNINGS.length];
      D.warningSub.classList.add('has-text');
      subIdx++;
    }

    // --- UI: button label mutation ---
    updateButtonLabel();

    // --- UI: click counter ---
    D.counterValue.textContent = state.clickCount;
    D.hudRight.classList.add('visible');

    // --- UI: hint text ---
    if (state.clickCount === 1) {
      D.hintText.textContent = 'Something has changed.';
    } else if (state.clickCount === 5) {
      D.hintText.textContent = 'Keep going...';
    } else if (state.clickCount === 10) {
      D.hintText.textContent = 'You\'re getting closer to something.';
    }

    // --- Toast on first click ---
    if (state.clickCount === 1) {
      showToast('I said DO NOT click it.', 'You clicked it anyway.', 3200);
    }

    saveState();
  }

  /**
   * Changes the button label based on click count.
   * Keeps text short so it fits inside the circle.
   */
  function updateButtonLabel() {
    const labels = [
      'DO NOT\nCLICK',
      'YOU\nCLICKED IT',
      'STOP.',
      'PLEASE.',
      'WHY.',
      'ENOUGH.',
      'NO.',
      'STOP\nIT',
      '...',
      'FINE.',
    ];
    const raw = labels[Math.min(state.clickCount, labels.length - 1)];
    D.btnLabel.innerHTML = raw.replace(/\n/g, '<br>');
  }

  /** Shows a tooltip on button hover. */
  function handleMouseEnter() {
    const tip = TOOLTIPS[Math.floor(Math.random() * TOOLTIPS.length)];
    D.tooltip.textContent = tip;
    D.tooltip.setAttribute('aria-hidden', 'false');
    D.tooltip.classList.add('visible');
  }

  /** Hides the tooltip when mouse leaves. */
  function handleMouseLeave() {
    D.tooltip.classList.remove('visible');
    D.tooltip.setAttribute('aria-hidden', 'true');
  }


  /* ==========================================================
     7. IDLE WATCHER
     Escalates the warning text while the user hesitates
     on Stage 0 (before their first click).
     ========================================================== */

  let idleSeconds  = 0;
  let idleMsgIndex = 0;

  function startIdleWatcher() {
    setInterval(() => {
      idleSeconds++;

      // Only run escalation before the first click
      if (state.clickCount > 0 || idleMsgIndex >= IDLE_MESSAGES.length) return;

      const next = IDLE_MESSAGES[idleMsgIndex];
      if (next && idleSeconds >= next.delay) {
        D.warningSub.textContent = next.text;
        D.warningSub.classList.add('has-text');
        idleMsgIndex++;
        Sound.warn();
      }
    }, 1000);
  }

  /** Reset idle counter whenever the user interacts. */
  function resetIdle() {
    idleSeconds = 0;
  }


  /* ==========================================================
     8. INIT
     ========================================================== */

  function init() {
    cacheDOM();
    loadState();

    // Restore click count from previous session
    if (state.clickCount > 0) {
      D.counterValue.textContent = state.clickCount;
      D.hudRight.classList.add('visible');
      updateButtonLabel();
      // Restore warning text to correct position
      warningIdx = Math.min(state.clickCount, WARNINGS.length - 1);
      D.warningText.textContent = WARNINGS[Math.max(0, warningIdx - 1)];
    }

    // Returning visitor greeting
    if (state.firstVisitDate && state.clickCount > 0) {
      showToast(
        '👁️ Welcome back, you poor soul.',
        `You've made ${state.clickCount} mistakes so far.`,
        4000
      );
    }

    // Record first visit date
    if (!state.firstVisitDate) {
      state.firstVisitDate = new Date().toISOString();
      saveState();
    }

    // --- Attach event listeners ---

    // THE BUTTON
    D.button.addEventListener('click',      handleClick);
    D.button.addEventListener('mouseenter', handleMouseEnter);
    D.button.addEventListener('mouseleave', handleMouseLeave);

    // Touch: tooltip equivalent via focus
    D.button.addEventListener('focus',  handleMouseEnter);
    D.button.addEventListener('blur',   handleMouseLeave);

    // Mute toggle
    D.muteBtn.addEventListener('click', () => {
      isMuted = !isMuted;
      D.muteBtn.textContent = isMuted ? '🔇' : '🔊';
      D.muteBtn.setAttribute('aria-label', isMuted ? 'Unmute sound' : 'Mute sound');
    });

    // Idle reset on any user interaction
    ['mousemove', 'keydown', 'scroll', 'click', 'touchstart'].forEach(ev => {
      document.addEventListener(ev, resetIdle, { passive: true });
    });

    // Persist on page exit
    window.addEventListener('pagehide',      saveState);
    window.addEventListener('beforeunload',  saveState);

    // Start idle watcher
    startIdleWatcher();
  }

  // Boot when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
