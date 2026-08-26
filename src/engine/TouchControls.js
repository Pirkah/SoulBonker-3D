/**
 * TouchControls.js
 * Virtual Analog Joystick & Action Buttons for Mobile / Tablet touchscreens.
 * Seamlessly integrates with InputManager and CameraController for Cross-Platform play.
 */

export class TouchControls {
  constructor(domElement, cameraController) {
    this.domElement = domElement;
    this.cameraController = cameraController;

    // Movement vector output (-1 to 1)
    this.moveVector = { x: 0, z: 0 };
    this.isJoystickActive = false;
    this.joystickTouchId = null;

    // Joystick Origin & Current Positions
    this.joystickBasePos = { x: 0, y: 0 };
    this.joystickCurrentPos = { x: 0, y: 0 };
    this.maxJoystickRadius = 55; // Pixels radius

    // Camera drag touch tracking
    this.cameraTouchId = null;
    this.cameraLastPos = { x: 0, y: 0 };
    this.cameraSensitivity = 0.005;

    // Action triggers (single-frame pulse or state)
    this.actions = {
      lightAttack: false,
      heavyAttack: false,
      dodge: false,
      lockOn: false,
      pause: false,
      startOrRestart: false
    };

    this.isChargingHeavy = false;

    // DOM Elements
    this.overlay = null;
    this.joystickBase = null;
    this.joystickThumb = null;

    // Initialize UI
    this.initDOM();
    this.bindEvents();
  }

  isTouchDevice() {
    return ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (window.innerWidth <= 950) || /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  }

  initDOM() {
    this.overlay = document.getElementById('touch-controls-overlay');
    this.joystickBase = document.getElementById('touch-joystick-base');
    this.joystickThumb = document.getElementById('touch-joystick-thumb');

    // If on touch device, show touch overlay
    if (this.overlay && this.isTouchDevice()) {
      this.overlay.style.display = 'block';
    }
  }

  show() {
    if (!this.overlay) this.overlay = document.getElementById('touch-controls-overlay');
    if (this.overlay) this.overlay.style.display = 'block';
  }

  hide() {
    if (!this.overlay) this.overlay = document.getElementById('touch-controls-overlay');
    if (this.overlay) this.overlay.style.display = 'none';
  }

  bindEvents() {
    // Touch Action Buttons
    const btnAttack = document.getElementById('touch-btn-attack');
    const btnHeavy = document.getElementById('touch-btn-heavy');
    const btnDodge = document.getElementById('touch-btn-dodge');
    const btnLock = document.getElementById('touch-btn-lock');

    this.lastAttackTapTime = 0;
    this.lastDodgeTapTime = 0;
    this.lastHeavyTapTime = 0;

    const triggerAttack = (e) => {
      if (e) { e.preventDefault(); e.stopPropagation(); }
      const now = performance.now();
      if (now - this.lastAttackTapTime < 180) return;
      this.lastAttackTapTime = now;

      this.actions.lightAttack = true;
      this.actions.startOrRestart = true;
      if (btnAttack) btnAttack.classList.add('touch-btn-active');
    };
    const endAttack = (e) => {
      if (e) { e.preventDefault(); e.stopPropagation(); }
      if (btnAttack) btnAttack.classList.remove('touch-btn-active');
    };

    if (btnAttack) {
      btnAttack.addEventListener('touchstart', triggerAttack, { passive: false });
      btnAttack.addEventListener('touchend', endAttack, { passive: false });
      btnAttack.addEventListener('mousedown', triggerAttack);
      btnAttack.addEventListener('mouseup', endAttack);
    }

    const triggerHeavy = (e) => {
      if (e) { e.preventDefault(); e.stopPropagation(); }
      const now = performance.now();
      if (now - this.lastHeavyTapTime < 220) return;
      this.lastHeavyTapTime = now;

      this.isChargingHeavy = true;
      this.actions.heavyAttack = true;
      this.actions.startOrRestart = true;
      if (btnHeavy) btnHeavy.classList.add('touch-btn-active');
    };
    const endHeavy = (e) => {
      if (e) { e.preventDefault(); e.stopPropagation(); }
      this.isChargingHeavy = false;
      if (btnHeavy) btnHeavy.classList.remove('touch-btn-active');
    };

    if (btnHeavy) {
      btnHeavy.addEventListener('touchstart', triggerHeavy, { passive: false });
      btnHeavy.addEventListener('touchend', endHeavy, { passive: false });
      btnHeavy.addEventListener('mousedown', triggerHeavy);
      btnHeavy.addEventListener('mouseup', endHeavy);
    }

    const triggerDodge = (e) => {
      if (e) { e.preventDefault(); e.stopPropagation(); }
      const now = performance.now();
      if (now - this.lastDodgeTapTime < 250) return;
      this.lastDodgeTapTime = now;

      this.actions.dodge = true;
      this.actions.startOrRestart = true;
      if (btnDodge) btnDodge.classList.add('touch-btn-active');
    };
    const endDodge = (e) => {
      if (e) { e.preventDefault(); e.stopPropagation(); }
      if (btnDodge) btnDodge.classList.remove('touch-btn-active');
    };

    if (btnDodge) {
      btnDodge.addEventListener('touchstart', triggerDodge, { passive: false });
      btnDodge.addEventListener('touchend', endDodge, { passive: false });
      btnDodge.addEventListener('mousedown', triggerDodge);
      btnDodge.addEventListener('mouseup', endDodge);
    }

    const triggerLock = (e) => {
      if (e) { e.preventDefault(); e.stopPropagation(); }
      this.actions.lockOn = true;
      if (btnLock) btnLock.classList.add('touch-btn-active');
    };
    const endLock = (e) => {
      if (e) { e.preventDefault(); e.stopPropagation(); }
      if (btnLock) btnLock.classList.remove('touch-btn-active');
    };

    if (btnLock) {
      btnLock.addEventListener('touchstart', triggerLock, { passive: false });
      btnLock.addEventListener('touchend', endLock, { passive: false });
      btnLock.addEventListener('mousedown', triggerLock);
      btnLock.addEventListener('mouseup', endLock);
    }

    // Touch Area Events for Joystick & Camera Swipe
    const touchZoneLeft = document.getElementById('touch-zone-left');
    const touchZoneRight = document.getElementById('touch-zone-right');

    if (touchZoneLeft) {
      touchZoneLeft.addEventListener('touchstart', (e) => this.handleLeftTouchStart(e), { passive: false });
      touchZoneLeft.addEventListener('touchmove', (e) => this.handleLeftTouchMove(e), { passive: false });
      touchZoneLeft.addEventListener('touchend', (e) => this.handleLeftTouchEnd(e), { passive: false });
      touchZoneLeft.addEventListener('touchcancel', (e) => this.handleLeftTouchEnd(e), { passive: false });
    }

    if (touchZoneRight) {
      touchZoneRight.addEventListener('touchstart', (e) => this.handleRightTouchStart(e), { passive: false });
      touchZoneRight.addEventListener('touchmove', (e) => this.handleRightTouchMove(e), { passive: false });
      touchZoneRight.addEventListener('touchend', (e) => this.handleRightTouchEnd(e), { passive: false });
      touchZoneRight.addEventListener('touchcancel', (e) => this.handleRightTouchEnd(e), { passive: false });
    }

    // Window events
    window.addEventListener('touchstart', () => {
      this.show();
    }, { passive: true });

    window.addEventListener('resize', () => {
      if (this.isTouchDevice()) {
        this.show();
      }
    });
  }

  handleLeftTouchStart(e) {
    e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (this.joystickTouchId === null) {
        this.joystickTouchId = touch.identifier;
        this.isJoystickActive = true;

        const rect = this.domElement.getBoundingClientRect();
        const clientX = touch.clientX - rect.left;
        const clientY = touch.clientY - rect.top;

        this.joystickBasePos.x = clientX;
        this.joystickBasePos.y = clientY;
        this.joystickCurrentPos.x = clientX;
        this.joystickCurrentPos.y = clientY;

        if (this.joystickBase && this.joystickThumb) {
          this.joystickBase.style.left = `${clientX}px`;
          this.joystickBase.style.top = `${clientY}px`;
          this.joystickBase.style.display = 'block';
          this.joystickThumb.style.transform = `translate(0px, 0px)`;
        }
        break;
      }
    }
  }

  handleLeftTouchMove(e) {
    e.preventDefault();
    if (!this.isJoystickActive) return;

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === this.joystickTouchId) {
        const rect = this.domElement.getBoundingClientRect();
        const clientX = touch.clientX - rect.left;
        const clientY = touch.clientY - rect.top;

        const dx = clientX - this.joystickBasePos.x;
        const dy = clientY - this.joystickBasePos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        let clampedDist = Math.min(dist, this.maxJoystickRadius);
        let angle = Math.atan2(dy, dx);

        const thumbX = Math.cos(angle) * clampedDist;
        const thumbY = Math.sin(angle) * clampedDist;

        if (this.joystickThumb) {
          this.joystickThumb.style.transform = `translate(${thumbX}px, ${thumbY}px)`;
        }

        // Normalized movement vector (-1 to 1)
        this.moveVector.x = (thumbX / this.maxJoystickRadius);
        this.moveVector.z = (thumbY / this.maxJoystickRadius);
        break;
      }
    }
  }

  handleLeftTouchEnd(e) {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === this.joystickTouchId) {
        this.joystickTouchId = null;
        this.isJoystickActive = false;
        this.moveVector.x = 0;
        this.moveVector.z = 0;

        if (this.joystickBase) {
          this.joystickBase.style.display = 'none';
        }
        break;
      }
    }
  }

  handleRightTouchStart(e) {
    if (e.target && (e.target.classList.contains('touch-action-btn') || e.target.closest('.touch-action-btn'))) {
      return;
    }
    e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (this.cameraTouchId === null) {
        this.cameraTouchId = touch.identifier;
        this.cameraLastPos.x = touch.clientX;
        this.cameraLastPos.y = touch.clientY;
        break;
      }
    }
  }

  handleRightTouchMove(e) {
    if (e.target && (e.target.classList.contains('touch-action-btn') || e.target.closest('.touch-action-btn'))) {
      return;
    }
    e.preventDefault();
    if (this.cameraTouchId === null || !this.cameraController) return;

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === this.cameraTouchId) {
        const dx = touch.clientX - this.cameraLastPos.x;
        const dy = touch.clientY - this.cameraLastPos.y;

        this.cameraLastPos.x = touch.clientX;
        this.cameraLastPos.y = touch.clientY;

        // Rotate Camera Yaw & Pitch smoothly
        this.cameraController.yaw -= dx * this.cameraSensitivity;
        this.cameraController.pitch = Math.max(0.1, Math.min(1.2, this.cameraController.pitch + dy * this.cameraSensitivity * 0.8));
        break;
      }
    }
  }

  handleRightTouchEnd(e) {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === this.cameraTouchId) {
        this.cameraTouchId = null;
        break;
      }
    }
  }

  resetSingleFrameActions() {
    this.actions.lightAttack = false;
    this.actions.heavyAttack = false;
    this.actions.dodge = false;
    this.actions.lockOn = false;
    this.actions.pause = false;
    this.actions.startOrRestart = false;
  }
}
