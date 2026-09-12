/* ============================================================
   THE BUTTON — script.js
   Milestone 2: Core Interactions
   ============================================================

   Modules:
     1. CONFIG      — Static data, messages, easter eggs
     2. STATE       — State management & LocalStorage
     3. DOM         — Element caching
     4. AUDIO       — Web Audio API procedural synthesis
     5. EFFECTS     — Visual feedback (shake, flash, toast, dodge)
     6. BUTTON      — Core click, multiple clicks, double-click
     7. MOTION      — Mouse 3D tilt, proximity & dizzy detection
     8. KEYBOARD    — Space/Enter, word recognition, Konami Code
     9. SCROLL      — Classified basement reveal & interactive wire
    10. IDLE        — Snooze / wake-up loop
    11. CONTEXT     — Right-click custom menu easter egg
    12. INIT        — Bootstrap
   ============================================================ */

(function () {
  'use strict';

  /* ==========================================================
     1. CONFIG
     ========================================================== */

  const STORAGE_KEY = 'theButton_m2';

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

  /* ==========================================================
     2. STATE
     ========================================================== */

  const DEFAULT_STATE = {
    clickCount:        0,
    doubleClicks:      0,
    firstVisitDate:    null,
    lastVisitDate:     null,
    stage:             0,
    cablePulled:       false,
    konamiUnlocked:    false,
    apologiesGiven:    0
  };

  let state = { ...DEFAULT_STATE };
  let sessionStart = Date.now();

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) state = { ...DEFAULT_STATE, ...JSON.parse(raw) };
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
    D.body            = document.body;
    D.hudLeft         = g('hud-left');
    D.hudStage        = g('hud-stage');
    D.hudBarFill      = g('hud-bar-fill');
    D.hudLabel        = g('hud-label');
    D.hudRight        = g('hud-right');
    D.counterValue    = g('counter-value');
    D.muteBtn         = g('mute-btn');
    D.arena           = g('arena');
    D.warningText     = g('warning-text');
    D.warningSub      = g('warning-sub');
    D.buttonWrap      = g('button-wrap');
    D.button          = g('the-button');
    D.btnLabel        = g('btn-label');
    D.tooltip         = g('tooltip');
    D.hintText        = g('hint-text');
    D.scrollIndicator = g('scroll-indicator');
    D.basement        = g('basement');
    D.wireBtn         = g('wire-btn');
    D.wireStatus      = g('wire-status');
    D.contextMenu     = g('custom-context-menu');
    D.toastContainer  = g('toast-container');
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
      const base = Math.min(180 + state.clickCount * 12, 520);
      playTone(base, 0.12, 'square', 0.15);
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
      // 8-bit arpeggio: C5, E5, G5, C6
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
    }
  };

  /* ==========================================================
     5. EFFECTS & TOASTS
     ========================================================== */

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
     6. BUTTON — Core Click & Progression
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

    executeNormalClick();
  }

  function executeNormalClick() {
    state.clickCount++;

    // Check if button is electrified from severed basement cable
    if (state.cablePulled || D.button.classList.contains('electrified')) {
      Sound.zap();
      triggerFlash('rgba(0, 255, 255, 0.4)');
      addBodyClass('shake', 450);
      D.warningSub.textContent = '⚡ HIGH VOLTAGE! 10,000 volts surged through your mouse pointer!';
      D.warningSub.classList.add('has-text');
    } else {
      // Audio blip
      Sound.click();
      // Screen shake on escalation
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

  /**
   * INTERACTION 2: Multiple Click Progression
   * Visibly changes the website themes, corruptions, and triggers stage remarks.
   */
  function updateProgression() {
    const c = state.clickCount;
    let stageNum = 0;
    let stageName = 'STAGE 0 // THE WARNING';
    let corruption = Math.min(Math.round(c * 2), 100);

    // Progress bar fill & corruption %
    D.hudBarFill.style.width = corruption + '%';
    D.hudLabel.textContent = `CORRUPTION: ${corruption}%`;

    // Stage milestones
    if (c >= 50) {
      stageNum = 5;
      stageName = 'STAGE 5 // THE SINGULARITY';
      D.body.className = 'stage-5';
    } else if (c >= 35) {
      stageNum = 4;
      stageName = 'STAGE 4 // MELTDOWN';
      D.body.className = 'stage-4';
    } else if (c >= 20) {
      stageNum = 3;
      stageName = 'STAGE 3 // CHAOS PROTOCOL';
      D.body.className = 'stage-3';
    } else if (c >= 10) {
      stageNum = 2;
      stageName = 'STAGE 2 // ESCALATION';
      D.body.className = 'stage-2';
    } else if (c >= 5) {
      stageNum = 1.5;
      stageName = 'STAGE 1.5 // DEFIANCE';
      D.body.className = 'stage-1';
    } else if (c >= 1) {
      stageNum = 1;
      stageName = 'STAGE 1 // FIRST CONTACT';
      D.body.className = 'stage-1';
    } else {
      D.body.className = 'stage-0';
    }

    state.stage = stageNum;
    D.hudStage.textContent = stageName;

    // Milestone toasts
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
    } else if (c === 20) {
      triggerFlash('rgba(224, 86, 253, 0.3)');
      showToast('🚨 SYSTEM OVERLOAD', 'Containment is breaking down. Have mercy on the button.', 4500);
      D.hintText.textContent = 'Critical: Reality anchor degrading.';
    } else if (c === 35) {
      triggerFlash('rgba(0, 255, 136, 0.35)');
      showToast('☣️ NUCLEAR MELTDOWN', 'Thermal threshold exceeded. Core containment liquefying.', 4500);
      D.hintText.textContent = 'Radiation levels dangerous. Please evacuate the web page.';
    } else if (c === 50) {
      triggerFlash('rgba(255, 215, 0, 0.5)');
      showToast('✨ THE SINGULARITY', 'You broke the simulation. The Button is now self-aware.', 6000);
      D.hintText.textContent = 'Transcended. All resistance was mathematically futile.';
    }
  }

  /**
   * INTERACTION 3: Double-Click Interaction
   * Violent recoil, alarm squeak, outrage text, and impatience penalty.
   */
  let isRecoilActive = false;
  function handleDoubleClick() {
    if (isRecoilActive) return;
    isRecoilActive = true;
    setTimeout(() => { isRecoilActive = false; }, 650);

    state.doubleClicks++;
    state.clickCount += 2; // Penalty mistakes

    Sound.recoil();
    triggerFlash('rgba(255, 71, 87, 0.35)');
    addBodyClass('shake', 600);

    // Apply violent recoil animation
    D.button.classList.add('recoil');
    setTimeout(() => D.button.classList.remove('recoil'), 600);

    // Dynamic reaction text
    const prevLabel = D.btnLabel.innerHTML;
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
    // Shifts button by random offset (-28px to +28px)
    const dx = (Math.random() * 56 - 28).toFixed(1);
    const dy = (Math.random() * 40 - 20).toFixed(1);
    document.documentElement.style.setProperty('--dodge-x', `${dx}px`);
    document.documentElement.style.setProperty('--dodge-y', `${dy}px`);
  }

  /* ==========================================================
     7. MOTION — 3D Tilt, Proximity, Dodge & Dizzy Shake
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

    // 3. Evasive proximity dodge in Stage 2+ (10+ clicks)
    if (state.clickCount >= 10 && !isDizzy && !isDormant) {
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
    // Keep last 450ms
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
     8. KEYBOARD INTERACTION & EASTER EGGS
     ========================================================== */

  let keyBuffer = [];
  let konamiIndex = 0;

  function handleKeyDown(e) {
    resetIdle();
    if (isDormant) wakeUp('keyboard');

    // Space or Enter on the button or document
    if (e.code === 'Space' || e.code === 'Enter') {
      const active = document.activeElement;
      if (active === D.muteBtn || active === D.wireBtn) {
        return; // allow native button trigger
      }
      const tag = active ? active.tagName.toLowerCase() : '';
      if (tag !== 'input' && tag !== 'textarea') {
        e.preventDefault();
        handleClick();
        return;
      }
    }

    // Escape key
    if (e.key === 'Escape') {
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
      Sound.pop();
      D.warningSub.textContent = '🍪 Virtual cookie consumed. The Button still refuses compliance.';
      D.warningSub.classList.add('has-text');
      showToast('🍪 Delicious', 'The button enjoyed that, but mistakes remain.', 3200);
      keyBuffer = [];
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

  /**
   * EASTER EGG 1: Konami Code Party Mode
   */
  function activateKonamiEasterEgg() {
    state.konamiUnlocked = true;
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
     9. SCROLL INTERACTION & CLASSIFIED BASEMENT
     ========================================================== */

  let hasScrolledDown = false;
  let inBasement = false;

  function handleScroll() {
    resetIdle();
    const scrollY = window.scrollY;

    if (scrollY > 300) {
      if (!hasScrolledDown) {
        hasScrolledDown = true;
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
     10. IDLE & SNOOZE WATCHER
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
     11. CONTEXT MENU EASTER EGG
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
        showToast('🕊️ Apology Submitted', 'Button response: "I accept your apology, but not your clicks."', 3800);
        D.warningSub.textContent = 'A formal treaty was attempted. Results: Inconclusive.';
        D.warningSub.classList.add('has-text');
      } else if (action === 'bribe') {
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
     12. INIT
     ========================================================== */

  function init() {
    cacheDOM();
    loadState();

    // Restore previous state if visited before
    if (state.clickCount > 0) {
      D.counterValue.textContent = state.clickCount;
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

    if (!state.firstVisitDate) {
      state.firstVisitDate = new Date().toISOString();
      saveState();
    } else if (state.clickCount > 0) {
      showToast(
        '👁️ Return of the Culprit',
        `Welcome back. Your ${state.clickCount} previous mistakes have been preserved.`,
        4200
      );
    }

    // Attach Event Listeners
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
    });

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
        showToast('⚡ CABLE PULLED', '10,000V backfed directly into The Button!', 3800);
        D.warningSub.textContent = 'THE BUTTON FELT THAT CABLE SNAPPING.';
        D.warningSub.classList.add('has-text');
        saveState();
      });
    }

    // HUD Counter Tamper Easter Egg
    if (D.hudRight) {
      D.hudRight.addEventListener('click', () => {
        Sound.buzz();
        D.counterValue.classList.add('tamper-shake');
        setTimeout(() => D.counterValue.classList.remove('tamper-shake'), 450);
        showToast('🚨 Audit Violation', 'Evidence tampering detected! You cannot edit your criminal record.', 3800);
        D.warningSub.textContent = 'Do not touch the mistake counter. That is for internal affairs only.';
        D.warningSub.classList.add('has-text');
      });
    }

    // Page Visibility Easter Egg
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        document.title = '👀 Where did you go?';
      } else {
        document.title = 'THE BUTTON — Do Not Click';
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
