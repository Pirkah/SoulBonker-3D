/**
 * Input Manager for SoulBonker 3D
 * Optimized for Laptop / Keyboard-only play (ZQSD + JKL) and Gamepad / Mouse.
 */

export class InputManager {
  constructor(domElement, camera, groundPlane) {
    this.domElement = domElement;
    this.camera = camera;
    this.groundPlane = groundPlane;

    // Movement axes
    this.moveVector = { x: 0, z: 0 };
    this.rawKeys = {};

    // Mouse aiming
    this.mouseScreen = { x: 0, y: 0 };
    this.mouseWorld = null;
    this.hasMovedMouseRecently = false;
    this.mouseMoveTimeout = null;

    // Action triggers (single-frame pulses)
    this.actions = {
      lightAttack: false,
      heavyAttack: false,
      dodge: false,
      lockOn: false,
      pause: false,
      selectCard1: false,
      selectCard2: false,
      selectCard3: false,
      startOrRestart: false
    };

    // State held
    this.isChargingHeavy = false;
    this.heavyChargeTime = 0;

    // Bind event handlers
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onKeyUp = this.onKeyUp.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
    this.onContextMenu = this.onContextMenu.bind(this);

    this.setupListeners();
  }

  setupListeners() {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('mousedown', this.onMouseDown);
    window.addEventListener('mouseup', this.onMouseUp);
    window.addEventListener('contextmenu', this.onContextMenu);
  }

  destroy() {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('mousedown', this.onMouseDown);
    window.removeEventListener('mouseup', this.onMouseUp);
    window.removeEventListener('contextmenu', this.onContextMenu);
  }

  onContextMenu(e) {
    e.preventDefault();
  }

  onKeyDown(e) {
    const key = (e.key || '').toLowerCase();
    const code = e.code || '';
    this.rawKeys[key] = true;
    this.rawKeys[code] = true;
    if (e.key) this.rawKeys[e.key] = true;

    // Dodge: Space, L, Shift, V
    if (code === 'Space' || code === 'KeyL' || code === 'ShiftLeft' || code === 'ShiftRight' || code === 'KeyV' || key === ' ' || key === 'l' || key === 'v') {
      this.actions.dodge = true;
      this.actions.startOrRestart = true;
    }

    // Light Attack: J or X
    if (code === 'KeyJ' || code === 'KeyX' || key === 'j' || key === 'x') {
      this.actions.lightAttack = true;
      this.actions.startOrRestart = true;
    }

    // Heavy Attack Charge & Trigger: K or E or C
    if (code === 'KeyK' || code === 'KeyE' || code === 'KeyC' || key === 'k' || key === 'e' || key === 'c') {
      this.isChargingHeavy = true;
      this.actions.heavyAttack = true;
      this.actions.startOrRestart = true;
    }

    // Lock On: I or R or Tab
    if (code === 'KeyI' || code === 'KeyR' || code === 'Tab' || key === 'i' || key === 'r') {
      e.preventDefault();
      this.actions.lockOn = true;
    }

    // Pause: P or Escape
    if (code === 'KeyP' || code === 'Escape' || key === 'p') {
      this.actions.pause = true;
    }

    // Enter / Space to start or restart
    if (code === 'Enter' || code === 'NumpadEnter') {
      this.actions.startOrRestart = true;
    }

    // Mod Menu Toggle: M or ² (Backquote) or F1
    if (code === 'KeyM' || code === 'Backquote' || code === 'F1' || key === 'm' || key === '²') {
      e.preventDefault();
      this.actions.toggleModMenu = true;
    }

    // Rogue-lite Card Selection: [1] or [J], [2] or [K], [3] or [L]
    if (code === 'Digit1' || code === 'Numpad1' || key === '1') {
      this.actions.selectCard1 = true;
    }
    if (code === 'Digit2' || code === 'Numpad2' || key === '2') {
      this.actions.selectCard2 = true;
    }
    if (code === 'Digit3' || code === 'Numpad3' || key === '3') {
      this.actions.selectCard3 = true;
    }
  }

  onKeyUp(e) {
    const key = (e.key || '').toLowerCase();
    const code = e.code || '';
    this.rawKeys[key] = false;
    this.rawKeys[code] = false;
    if (e.key) this.rawKeys[e.key] = false;

    // Heavy Attack Release
    if (code === 'KeyK' || code === 'KeyE' || code === 'KeyC' || key === 'k' || key === 'e' || key === 'c') {
      if (this.isChargingHeavy) {
        this.actions.heavyAttack = true;
        this.isChargingHeavy = false;
      }
    }
  }

  onMouseDown(e) {
    if (e.button === 0) { // Left click
      this.actions.lightAttack = true;
      this.actions.startOrRestart = true;
    } else if (e.button === 2) { // Right click
      this.isChargingHeavy = true;
      this.actions.heavyAttack = true;
    } else if (e.button === 1) { // Middle click
      this.actions.lockOn = true;
    }
  }

  onMouseUp(e) {
    if (e.button === 2) {
      if (this.isChargingHeavy) {
        this.actions.heavyAttack = true;
        this.isChargingHeavy = false;
      }
    }
  }

  onMouseMove(e) {
    this.hasMovedMouseRecently = true;
    clearTimeout(this.mouseMoveTimeout);
    this.mouseMoveTimeout = setTimeout(() => {
      this.hasMovedMouseRecently = false;
    }, 1500);

    const rect = this.domElement.getBoundingClientRect();
    this.mouseScreen.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouseScreen.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  }

  update(dt, raycaster, playerPos) {
    // 1. Movement Inputs (French ZQSD + WASD + Arrow Keys)
    let moveX = 0;
    let moveZ = 0;

    const forward = this.rawKeys['w'] || this.rawKeys['z'] || this.rawKeys['arrowup'] || this.rawKeys['KeyW'] || this.rawKeys['KeyZ'] || this.rawKeys['ArrowUp'] || this.rawKeys['W'] || this.rawKeys['Z'];
    const backward = this.rawKeys['s'] || this.rawKeys['arrowdown'] || this.rawKeys['KeyS'] || this.rawKeys['ArrowDown'] || this.rawKeys['S'];
    const left = this.rawKeys['a'] || this.rawKeys['q'] || this.rawKeys['arrowleft'] || this.rawKeys['KeyA'] || this.rawKeys['KeyQ'] || this.rawKeys['ArrowLeft'] || this.rawKeys['A'] || this.rawKeys['Q'];
    const right = this.rawKeys['d'] || this.rawKeys['arrowright'] || this.rawKeys['KeyD'] || this.rawKeys['ArrowRight'] || this.rawKeys['D'];

    if (forward) moveZ -= 1;
    if (backward) moveZ += 1;
    if (left) moveX -= 1;
    if (right) moveX += 1;

    // Check Gamepad
    this.pollGamepad();

    // Normalize
    const length = Math.sqrt(moveX * moveX + moveZ * moveZ);
    if (length > 0) {
      this.moveVector.x = moveX / length;
      this.moveVector.z = moveZ / length;
    } else {
      this.moveVector.x = 0;
      this.moveVector.z = 0;
    }

    if (this.isChargingHeavy) {
      this.heavyChargeTime += dt;
    } else {
      this.heavyChargeTime = 0;
    }

    // Raycast ground only if mouse was moved
    if (this.hasMovedMouseRecently && raycaster && this.camera && this.groundPlane) {
      raycaster.setFromCamera(this.mouseScreen, this.camera);
      const intersects = raycaster.intersectObject(this.groundPlane);
      if (intersects.length > 0) {
        if (!this.mouseWorld) this.mouseWorld = { x: 0, y: 0, z: 0 };
        this.mouseWorld.x = intersects[0].point.x;
        this.mouseWorld.y = intersects[0].point.y;
        this.mouseWorld.z = intersects[0].point.z;
      }
    }
  }

  pollGamepad() {
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    const gp = gamepads[0];
    if (!gp) return;

    const deadzone = 0.2;
    const stickX = Math.abs(gp.axes[0]) > deadzone ? gp.axes[0] : 0;
    const stickY = Math.abs(gp.axes[1]) > deadzone ? gp.axes[1] : 0;

    if (stickX !== 0 || stickY !== 0) {
      this.moveVector.x = stickX;
      this.moveVector.z = stickY;
    }

    if (gp.buttons[0]?.pressed || gp.buttons[1]?.pressed) {
      this.actions.dodge = true;
      this.actions.startOrRestart = true;
    }
    if (gp.buttons[2]?.pressed) {
      this.actions.lightAttack = true;
      this.actions.startOrRestart = true;
    }
    if (gp.buttons[3]?.pressed || gp.buttons[7]?.pressed) {
      this.isChargingHeavy = true;
    }
    if (gp.buttons[9]?.pressed) {
      this.actions.pause = true;
    }
    if (gp.buttons[10]?.pressed || gp.buttons[11]?.pressed) {
      this.actions.lockOn = true;
    }
  }

  flush() {
    this.actions.lightAttack = false;
    this.actions.heavyAttack = false;
    this.actions.dodge = false;
    this.actions.lockOn = false;
    this.actions.pause = false;
    this.actions.selectCard1 = false;
    this.actions.selectCard2 = false;
    this.actions.selectCard3 = false;
    this.actions.startOrRestart = false;
    this.actions.toggleModMenu = false;
  }
}
