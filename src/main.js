import * as THREE from '../libs/three.module.js';
import { MathUtils } from './utils/MathUtils.js';
import { AudioManager } from './engine/AudioManager.js';
import { InputManager } from './engine/InputManager.js';
import { CameraController } from './engine/CameraController.js';
import { PhysicsSystem } from './engine/Physics.js';
import { Arena } from './world/Arena.js';
import { ParticleManager } from './world/Particles.js';
import { Player } from './entities/Player.js';
import { WaveManager } from './systems/WaveManager.js';
import { UpgradeManager } from './systems/UpgradeManager.js';
import { UIManager } from './systems/UIManager.js';
import { ModMenu } from './systems/ModMenu.js';
import { GlobalModelLoader } from './engine/ModelLoader.js';
import { NetworkManager } from './network/NetworkManager.js';
import { DuelManager } from './systems/DuelManager.js';

import { CHARACTER_CLASSES } from './systems/ClassManager.js';

class Game {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.gameState = 'START'; // START, PLAYING, UPGRADE, PAUSED, GAMEOVER
    this.gameMode = 'SOLO_WAVES'; // SOLO_WAVES, DUEL_1V1
    this.selectedClassKey = 'KNIGHT';

    // Slow-mo / Bullet-time state
    this.timeScale = 1.0;
    this.slowMoTimer = 0;

    // WebRTC 1v1 Network Manager
    this.network = new NetworkManager();

    this.initEngine();
    this.initWorld();
    this.initEvents();

    window.game = this;

    // Global Slow-mo Hook for Perfect Dodge
    window.triggerSlowMo = (duration = 1.2, scale = 0.15) => {
      this.timeScale = scale;
      this.slowMoTimer = duration;
      this.audio.setSlowMo(true);
      this.ui.showPerfectDodgeBanner();
      this.cameraController.setFovPunch(44, 400);
    };
  }

  initEngine() {
    // 1. Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0c14);
    this.scene.fog = new THREE.FogExp2(0x0a0c14, 0.015);

    // 2. Camera (Third-person view)
    this.camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 200);

    // 3. WebGL Renderer (Optimized for Mac Battery / Apple Silicon)
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // 4. Optimized Lighting
    const ambientLight = new THREE.AmbientLight(0x556688, 1.2);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xaaccff, 1.8);
    dirLight.position.set(20, 35, 20);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 10;
    dirLight.shadow.camera.far = 80;
    dirLight.shadow.camera.left = -35;
    dirLight.shadow.camera.right = 35;
    dirLight.shadow.camera.top = 35;
    dirLight.shadow.camera.bottom = -35;
    this.scene.add(dirLight);

    const rimLight = new THREE.DirectionalLight(0x00d9ff, 0.8);
    rimLight.position.set(-20, 15, -20);
    this.scene.add(rimLight);

    // 5. Raycaster
    this.raycaster = new THREE.Raycaster();
  }

  initWorld() {
    this.arena = new Arena(this.scene, 32);
    this.physics = new PhysicsSystem(30);
    this.physics.setPillars(this.arena.pillars);

    this.particles = new ParticleManager(this.scene);
    this.audio = new AudioManager();
    this.cameraController = new CameraController(this.camera, this.canvas, this.scene);
    this.input = new InputManager(this.canvas, this.camera, this.arena.groundRaycastPlane, this.cameraController);
    this.ui = new UIManager(this.camera, document.body);

    this.waveManager = new WaveManager(this.scene, 30);
    this.player = new Player(this.scene, this.waveManager.projectiles);
    this.upgradeManager = new UpgradeManager();
    this.modMenu = new ModMenu(this);
    this.duelManager = new DuelManager(this.scene, this.network, this.audio, this.particles);

    // Preload all 4 character class models & weapons into cache for instantaneous 0ms swapping
    Object.values(CHARACTER_CLASSES).forEach((cls) => {
      GlobalModelLoader.loadOBJWithMTL(cls.modelPath, cls.mtlPath);
      GlobalModelLoader.loadOBJWithMTL(cls.weaponModel, cls.weaponMtl);
    });

    // Wave Manager Arena Theme Change Hook (Every 5 Waves)
    this.waveManager.onArenaThemeChange = (newTheme, waveNumber) => {
      if (this.gameMode === 'SOLO_WAVES') {
        const displayName = this.waveManager.getThemeDisplayName(newTheme);
        this.switchArenaTheme(newTheme, `🌀 PORTAIL : ${displayName}`, `Vague ${waveNumber} - Préparation au combat`);
      }
    };

    // Clock
    this.clock = new THREE.Clock();
  }

  switchArenaTheme(themeName, title = null, subtitle = null) {
    if (this.arena.currentTheme === themeName && this.arena.themeMeshes.length > 0) return;

    // Show stylish HTML transition screen (Loading & memory disposal)
    let overlay = document.getElementById('arena-transition-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'arena-transition-overlay';
      overlay.style.cssText = `
        position: fixed; inset: 0; background: rgba(5, 6, 12, 0.94);
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        z-index: 9999; opacity: 0; pointer-events: none; transition: opacity 0.30s ease;
        backdrop-filter: blur(14px); color: #fff; font-family: system-ui, sans-serif;
      `;
      overlay.innerHTML = `
        <div style="font-size: 3.2rem; margin-bottom: 12px; filter: drop-shadow(0 0 16px rgba(0,240,255,0.8));">🌀</div>
        <div id="arena-trans-title" style="font-size: 1.7rem; font-weight: 900; letter-spacing: 2px; text-transform: uppercase; color: #00f0ff; text-shadow: 0 0 20px rgba(0,240,255,0.6); text-align: center;">PORTAIL VERS L'ARÈNE...</div>
        <div id="arena-trans-sub" style="font-size: 0.95rem; color: #8899aa; margin-top: 8px; text-align: center;">Chargement des textures & géométries 3D...</div>
        <div style="width: 220px; height: 5px; background: rgba(255,255,255,0.1); border-radius: 3px; margin-top: 22px; overflow: hidden;">
          <div style="width: 100%; height: 100%; background: linear-gradient(90deg, #00f0ff, #ff0055); animation: loadingBar 0.8s infinite linear;"></div>
        </div>
      `;
      document.body.appendChild(overlay);
    }

    const titleEl = document.getElementById('arena-trans-title');
    const subEl = document.getElementById('arena-trans-sub');
    if (titleEl) titleEl.textContent = title || `PORTAIL : ${this.waveManager.getThemeDisplayName(themeName)}`;
    if (subEl) subEl.textContent = subtitle || "Allègement mémoire & textures 3D...";

    // Fade in
    overlay.style.opacity = '1';
    overlay.style.pointerEvents = 'auto';

    setTimeout(() => {
      // Rebuild arena with zero memory leaks
      this.arena.setTheme(themeName, () => {
        this.physics.setPillars(this.arena.pillars);
        if (this.input) this.input.groundRaycastPlane = this.arena.groundRaycastPlane;

        setTimeout(() => {
          overlay.style.opacity = '0';
          overlay.style.pointerEvents = 'none';
          this.particles.spawnTextPopup(`✨ ${this.waveManager.getThemeDisplayName(themeName)}`, this.player.position, '#00f0ff', true);
        }, 200);
      });
    }, 280);
  }

  selectCharacterClass(classKey, startImmediately = false) {
    const classData = CHARACTER_CLASSES[classKey];
    if (!classData) return;

    this.selectedClassKey = classKey;
    this.player.setClass(classData);

    // Highlight card in Solo start UI
    document.querySelectorAll('.hero-card').forEach(c => c.classList.remove('selected'));
    const cardEl = document.querySelector(`.hero-card[data-class="${classKey}"]`);
    if (cardEl) cardEl.classList.add('selected');

    // Highlight chip in 1v1 Lobby UI
    document.querySelectorAll('.duel-class-chip').forEach(c => c.classList.remove('selected'));
    const chipEl = document.querySelector(`.duel-class-chip[data-class="${classKey}"]`);
    if (chipEl) chipEl.classList.add('selected');

    const myBadge = document.getElementById('duel-my-class-badge');
    if (myBadge) {
      myBadge.textContent = `Votre Héros : ${classData.icon} ${classData.name}`;
    }

    // If in 1v1 network lobby/game, broadcast to opponent
    if (this.network && this.network.isConnected) {
      this.network.sendEvent('CLASS_SELECT', { classKey });
    }

    this.particles.spawnTextPopup(`✨ ${classData.name}`, this.player.position, classData.color || '#00f0ff', true);

    if (startImmediately) {
      this.startGame(classKey);
    }
  }

  startGame(classKey) {
    this.gameMode = 'SOLO_WAVES';
    this.arena.setTheme('ACADEMIA');
    const classData = CHARACTER_CLASSES[classKey] || CHARACTER_CLASSES.KNIGHT;
    this.selectCharacterClass(classKey, false);

    const startModal = document.getElementById('start-modal');
    if (startModal) startModal.style.display = 'none';

    const duelModal = document.getElementById('duel-lobby-modal');
    if (duelModal) duelModal.style.display = 'none';

    if (document.activeElement && document.activeElement.blur) {
      document.activeElement.blur();
    }
    window.focus();
    this.input.flush();

    this.audio.init();
    this.audio.resume();
    this.gameState = 'PLAYING';

    // Restore solo UI elements
    const waveHud = document.querySelector('.wave-hud');
    if (waveHud) waveHud.style.display = 'flex';
    const killCount = document.getElementById('kill-count');
    if (killCount) killCount.style.display = 'block';
    const pauseBtn = document.getElementById('pause-btn');
    if (pauseBtn) pauseBtn.style.display = 'block';
    const modBtn = document.getElementById('mod-hud-btn');
    if (modBtn) modBtn.style.display = 'block';

    if (this.input && this.input.touchControls && this.input.touchControls.isTouchDevice()) {
      this.input.touchControls.show();
    }

    this.waveManager.startWave(1);
    this.particles.spawnTextPopup(`⚔️ ${classData.name} PRÊT !`, this.player.position, classData.color || '#00f0ff', true);
  }

  start1v1Duel() {
    this.gameMode = 'DUEL_1V1';
    const classData = CHARACTER_CLASSES[this.selectedClassKey] || CHARACTER_CLASSES.KNIGHT;
    this.player.setClass(classData);

    const startModal = document.getElementById('start-modal');
    if (startModal) startModal.style.display = 'none';

    const duelModal = document.getElementById('duel-lobby-modal');
    if (duelModal) duelModal.style.display = 'none';

    if (this.input && this.input.touchControls && this.input.touchControls.isTouchDevice()) {
      this.input.touchControls.show();
    }

    // Hide solo HUD elements in 1v1 mode (clean minimal battlefield HUD)
    const waveHud = document.querySelector('.wave-hud');
    if (waveHud) waveHud.style.display = 'none';
    const bossHud = document.getElementById('boss-hp-container');
    if (bossHud) bossHud.style.display = 'none';
    const killCount = document.getElementById('kill-count');
    if (killCount) killCount.style.display = 'none';
    const pauseBtn = document.getElementById('pause-btn');
    if (pauseBtn) pauseBtn.style.display = 'none';
    const modBtn = document.getElementById('mod-hud-btn');
    if (modBtn) modBtn.style.display = 'none';
    const controlsHint = document.querySelector('.controls-hint');
    if (controlsHint) controlsHint.style.display = 'none';

    if (document.activeElement && document.activeElement.blur) {
      document.activeElement.blur();
    }
    window.focus();
    this.input.flush();

    this.audio.init();
    this.audio.resume();
    this.gameState = 'PLAYING';

    // Switch to Roman Colosseum Arena with transition
    this.switchArenaTheme('ROMAN_COLOSSEUM', '🏛️ LE COLISÉE ROMAIN (1V1)', 'Arène des Gladiateurs & Sang Antique');
    this.duelManager.initDuel(this.player);
  }

  initEvents() {
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // Character Selection Cards Binding (Solo & 1v1)
    const classKeys = ['KNIGHT', 'ARCHER', 'MAGE', 'SPACEMARINE', 'ANGEL', 'ROGUE', 'ORK', 'REAPER', 'NECROMANCER'];
    classKeys.forEach((key) => {
      // Solo Start Screen Card (Click selects the card)
      const card = document.querySelector(`.hero-card[data-class="${key}"]`);
      if (card) {
        card.addEventListener('click', (e) => {
          e.stopPropagation();
          this.selectCharacterClass(key, false);
        });
      }

      // Solo Start Screen Button (Click starts solo immediately)
      const btn = document.getElementById(`btn-${key.toLowerCase()}`);
      if (btn) {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.selectCharacterClass(key, false);
          this.startGame(key);
        });
      }

      // 1v1 Lobby Class Chip
      const chip = document.querySelector(`.duel-class-chip[data-class="${key}"]`);
      if (chip) {
        chip.addEventListener('click', (e) => {
          e.stopPropagation();
          this.selectCharacterClass(key, false);
        });
      }
    });

    // Keyboard numbers [1 to 9] for class selection
    window.addEventListener('keydown', (e) => {
      const startModal = document.getElementById('start-modal');
      const duelModal = document.getElementById('duel-lobby-modal');
      const isStartOpen = startModal && startModal.style.display !== 'none';
      const isDuelOpen = duelModal && duelModal.style.display !== 'none';

      if (isStartOpen || isDuelOpen) {
        if (e.key === '1' || e.code === 'Digit1' || e.code === 'Numpad1') this.selectCharacterClass('KNIGHT', false);
        else if (e.key === '2' || e.code === 'Digit2' || e.code === 'Numpad2') this.selectCharacterClass('ARCHER', false);
        else if (e.key === '3' || e.code === 'Digit3' || e.code === 'Numpad3') this.selectCharacterClass('MAGE', false);
        else if (e.key === '4' || e.code === 'Digit4' || e.code === 'Numpad4') this.selectCharacterClass('SPACEMARINE', false);
        else if (e.key === '5' || e.code === 'Digit5' || e.code === 'Numpad5') this.selectCharacterClass('ANGEL', false);
        else if (e.key === '6' || e.code === 'Digit6' || e.code === 'Numpad6') this.selectCharacterClass('ROGUE', false);
        else if (e.key === '7' || e.code === 'Digit7' || e.code === 'Numpad7') this.selectCharacterClass('ORK', false);
        else if (e.key === '8' || e.code === 'Digit8' || e.code === 'Numpad8') this.selectCharacterClass('REAPER', false);
        else if (e.key === '9' || e.code === 'Digit9' || e.code === 'Numpad9') this.selectCharacterClass('NECROMANCER', false);
      }

      if (this.gameState === 'START' && isStartOpen) {
        if (e.code === 'Space' || e.key === ' ' || e.code === 'Enter') {
          this.startGame(this.selectedClassKey);
        }
      }
    });

    // Start Game Button & Global Triggers
    const startBtn = document.getElementById('start-btn');
    if (startBtn) {
      startBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.startGame(this.selectedClassKey);
      });
    }

    // === 1V1 MULTIPLAYER LOBBY EVENTS ===
    const openDuelBtn = document.getElementById('open-duel-btn');
    const duelModal = document.getElementById('duel-lobby-modal');
    const tabHostBtn = document.getElementById('tab-host-btn');
    const tabJoinBtn = document.getElementById('tab-join-btn');
    const hostSection = document.getElementById('duel-host-section');
    const joinSection = document.getElementById('duel-join-section');
    const hostRoomCodeEl = document.getElementById('host-room-code');
    const copyDuelLinkBtn = document.getElementById('copy-duel-link-btn');
    const joinRoomInput = document.getElementById('join-room-input');
    const joinDuelBtn = document.getElementById('join-duel-btn');
    const duelStatusText = document.getElementById('duel-status-text');
    const startDuelBtn = document.getElementById('start-duel-btn');
    const backFromDuelBtn = document.getElementById('back-from-duel-btn');
    const duelRematchBtn = document.getElementById('duel-rematch-btn');
    const duelQuitBtn = document.getElementById('duel-quit-btn');

    if (openDuelBtn) {
      openDuelBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        document.getElementById('start-modal').style.display = 'none';
        if (duelModal) duelModal.style.display = 'flex';
        this.selectCharacterClass(this.selectedClassKey, false);

        // Auto create host room by default
        this.network.createRoom().then((roomId) => {
          if (hostRoomCodeEl) hostRoomCodeEl.textContent = roomId;
        }).catch(err => {
          if (duelStatusText) duelStatusText.textContent = `❌ Erreur : ${err.message || err}`;
        });
      });
    }

    if (tabHostBtn && tabJoinBtn) {
      tabHostBtn.addEventListener('click', () => {
        tabHostBtn.classList.add('active');
        tabJoinBtn.classList.remove('active');
        hostSection.style.display = 'flex';
        joinSection.style.display = 'none';
        if (!this.network.isHost || !this.network.roomId) {
          this.network.createRoom().then((roomId) => {
            if (hostRoomCodeEl) hostRoomCodeEl.textContent = roomId;
          });
        }
      });

      tabJoinBtn.addEventListener('click', () => {
        tabJoinBtn.classList.add('active');
        tabHostBtn.classList.remove('active');
        hostSection.style.display = 'none';
        joinSection.style.display = 'flex';
      });
    }

    // Fullscreen Toggle (Mobile & Desktop)
    const fullscreenBtn = document.getElementById('fullscreen-btn');
    if (fullscreenBtn) {
      fullscreenBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
        } else {
          if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
        }
      });
    }

    if (copyDuelLinkBtn) {
      copyDuelLinkBtn.addEventListener('click', async () => {
        const url = `${window.location.origin}${window.location.pathname}#room=${this.network.roomId || ''}`;
        const shareData = {
          title: 'SoulBonker 3D - Duel 1v1',
          text: `⚔️ Rejoins mon duel 1v1 sur SoulBonker 3D dans le Colisée Romain ! Code de salle : ${this.network.roomId || ''}`,
          url: url
        };

        if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
          try {
            await navigator.share(shareData);
            copyDuelLinkBtn.textContent = '✅ Lien Partagé !';
            setTimeout(() => { copyDuelLinkBtn.textContent = '📋 Partager / Copier le Lien de Duel'; }, 2500);
            return;
          } catch (e) {
            // Share cancelled or unavailable, fallback to clipboard
          }
        }

        navigator.clipboard.writeText(url).then(() => {
          copyDuelLinkBtn.textContent = '✅ Lien Copié !';
          setTimeout(() => { copyDuelLinkBtn.textContent = '📋 Partager / Copier le Lien de Duel'; }, 2500);
        }).catch(() => {
          navigator.clipboard.writeText(this.network.roomId || '');
          copyDuelLinkBtn.textContent = '✅ Code Copié !';
          setTimeout(() => { copyDuelLinkBtn.textContent = '📋 Partager / Copier le Lien de Duel'; }, 2500);
        });
      });
    }

    if (joinDuelBtn && joinRoomInput) {
      joinDuelBtn.addEventListener('click', () => {
        const code = joinRoomInput.value.trim().toUpperCase();
        if (!code) return;
        if (duelStatusText) duelStatusText.textContent = `🔄 Connexion à l'arène ${code}...`;
        this.network.joinRoom(code).catch((err) => {
          if (duelStatusText) duelStatusText.textContent = `❌ Impossible de rejoindre : ${err.message || err}`;
        });
      });
    }

    this.network.on('connected', ({ isHost, roomId }) => {
      if (duelStatusText) {
        duelStatusText.classList.add('connected');
        duelStatusText.textContent = `🟢 Adversaire connecté ! Prêt au combat.`;
      }
      if (startDuelBtn) {
        startDuelBtn.style.display = 'block';
      }
      // Broadcast our selected class immediately on connection
      this.network.sendEvent('CLASS_SELECT', { classKey: this.selectedClassKey });
    });

    this.network.on('CLASS_SELECT', (data) => {
      const oppClass = CHARACTER_CLASSES[data.classKey];
      if (oppClass) {
        const oppBadge = document.getElementById('duel-opp-class-badge');
        if (oppBadge) {
          oppBadge.textContent = `Adversaire : ${oppClass.icon} ${oppClass.name}`;
        }
        if (this.duelManager.remotePlayer) {
          this.duelManager.remotePlayer.setClass(oppClass);
        }
      }
    });

    this.network.on('START_DUEL', () => {
      this.start1v1Duel();
    });

    if (startDuelBtn) {
      startDuelBtn.addEventListener('click', () => {
        this.network.sendEvent('START_DUEL', {});
        this.start1v1Duel();
      });
    }

    if (backFromDuelBtn) {
      backFromDuelBtn.addEventListener('click', () => {
        this.network.cleanup();
        if (duelModal) duelModal.style.display = 'none';
        document.getElementById('start-modal').style.display = 'flex';
      });
    }

    if (duelRematchBtn) {
      duelRematchBtn.addEventListener('click', () => {
        this.duelManager.requestRematch();
      });
    }

    if (duelQuitBtn) {
      duelQuitBtn.addEventListener('click', () => {
        this.network.cleanup();
        this.duelManager.destroy();
        document.getElementById('duel-result-modal').style.display = 'none';
        document.getElementById('start-modal').style.display = 'flex';
        this.gameState = 'START';
        this.gameMode = 'SOLO_WAVES';
      });
    }

    // Check if room hash exists in URL (e.g. #room=SB-7429)
    if (window.location.hash.startsWith('#room=')) {
      const hashRoom = window.location.hash.replace('#room=', '').trim().toUpperCase();
      if (hashRoom && openDuelBtn) {
        setTimeout(() => {
          openDuelBtn.click();
          if (tabJoinBtn) tabJoinBtn.click();
          if (joinRoomInput) joinRoomInput.value = hashRoom;
          if (joinDuelBtn) joinDuelBtn.click();
        }, 500);
      }
    }

    // Mod Menu HUD Button
    const modBtn = document.getElementById('mod-hud-btn');
    if (modBtn) {
      modBtn.addEventListener('click', () => {
        this.modMenu.toggle();
      });
    }

    // Sound Toggle Button
    const soundBtn = document.getElementById('sound-btn');
    if (soundBtn) {
      soundBtn.addEventListener('click', () => {
        this.audio.init();
        const isMuted = this.audio.toggleMute();
        soundBtn.textContent = isMuted ? '🔇 MUET' : '🔊 SON';
      });
    }

    // Pause Toggle
    const pauseBtn = document.getElementById('pause-btn');
    if (pauseBtn) {
      pauseBtn.addEventListener('click', () => {
        this.togglePause();
      });
    }
  }

  togglePause() {
    if (this.gameState === 'PLAYING') {
      this.gameState = 'PAUSED';
      document.getElementById('pause-btn').textContent = '▶️ REPRENDRE';
    } else if (this.gameState === 'PAUSED') {
      this.gameState = 'PLAYING';
      document.getElementById('pause-btn').textContent = '⏸️ PAUSE';
    }
  }

  startUpgradeSelection() {
    this.gameState = 'UPGRADE';
    const choices = this.upgradeManager.getRandomChoices(3);
    this.currentUpgradeChoices = choices;

    this.ui.showUpgradeSelection(choices, (selectedCard) => {
      this.applyUpgradeAndContinue(selectedCard);
    });
  }

  applyUpgradeAndContinue(card) {
    this.upgradeManager.applyPerk(card, this.player);
    this.particles.spawnTextPopup("✨ " + card.name, this.player.position, '#ffd700', true);
    this.gameState = 'PLAYING';
    this.waveManager.startWave(this.waveManager.currentWave + 1);
  }

  restartGame() {
    this.waveManager.enemies.forEach(e => e.destroy());
    this.waveManager.enemies.length = 0;
    this.waveManager.projectiles.forEach(p => p.destroy());
    this.waveManager.projectiles.length = 0;
    this.waveManager.totalKills = 0;

    // Reset Player according to selected class and reconnect projectile reference
    const classData = CHARACTER_CLASSES[this.selectedClassKey] || CHARACTER_CLASSES.KNIGHT;
    this.player.setClass(classData);
    this.player.setProjectilesList(this.waveManager.projectiles);
    this.player.thunderChain = 0;
    this.player.vampirism = 0;
    this.player.ghostDash = false;
    this.player.weapon.setScale(this.modMenu?.weaponScale || 1.0);
    this.player.position.set(0, 0, 0);
    this.player.velocity.set(0, 0, 0);
    this.player.state = 'IDLE';

    this.gameState = 'PLAYING';
    this.waveManager.startWave(1);
  }

  run() {
    requestAnimationFrame(() => this.run());

    const rawDt = Math.min(this.clock.getDelta(), 0.1);

    // Handle Slow-mo Bullet time timer
    if (this.slowMoTimer > 0) {
      this.slowMoTimer -= rawDt;
      if (this.slowMoTimer <= 0) {
        this.timeScale = 1.0;
        this.audio.setSlowMo(false);
      }
    }

    const dt = rawDt * this.timeScale;

    // 1. Process Global Inputs & Shortcuts
    if (this.input.actions.pause) {
      this.togglePause();
    }

    // Toggle Mod Menu (M / ² / F1)
    if (this.input.actions.toggleModMenu) {
      this.modMenu.toggle();
    }

    if (this.gameState === 'UPGRADE') {
      const choose1 = this.input.actions.selectCard1 || this.input.rawKeys['j'] || this.input.rawKeys['KeyJ'];
      const choose2 = this.input.actions.selectCard2 || this.input.rawKeys['k'] || this.input.rawKeys['KeyK'];
      const choose3 = this.input.actions.selectCard3 || this.input.rawKeys['l'] || this.input.rawKeys['KeyL'];

      if (choose1 && this.currentUpgradeChoices?.[0]) {
        document.getElementById('upgrade-modal').style.display = 'none';
        this.applyUpgradeAndContinue(this.currentUpgradeChoices[0]);
      } else if (choose2 && this.currentUpgradeChoices?.[1]) {
        document.getElementById('upgrade-modal').style.display = 'none';
        this.applyUpgradeAndContinue(this.currentUpgradeChoices[1]);
      } else if (choose3 && this.currentUpgradeChoices?.[2]) {
        document.getElementById('upgrade-modal').style.display = 'none';
        this.applyUpgradeAndContinue(this.currentUpgradeChoices[2]);
      }
    }

    if (this.gameState === 'GAMEOVER' && this.input.actions.startOrRestart) {
      document.getElementById('game-over-modal').style.display = 'none';
      this.restartGame();
    }

    // 2. Main Gameplay Update Loop
    if (this.gameState === 'PLAYING') {
      this.input.update(dt, this.raycaster, this.player.position);

      // Apply Mod Menu cheats & multipliers
      this.modMenu.update(dt, this.player);

      if (this.gameMode === 'SOLO_WAVES') {
        // Lock-On Toggle
        if (this.input.actions.lockOn) {
          this.cameraController.toggleLockOn(this.waveManager.enemies, this.player.position, this.particles);
        }

        // Update Player with lock-on target
        this.player.update(dt, this.input, this.audio, this.particles, this.waveManager.enemies, this.cameraController.yaw, this.cameraController.lockOnTarget);
        this.physics.updateEntity(this.player, dt, this.audio, this.particles);

        // Update Player Minions (Necromancer Skeletons)
        if (this.player.minionsList && this.player.minionsList.length > 0) {
          for (const minion of this.player.minionsList) {
            minion.update(dt, this.waveManager.enemies, null, this.audio);
          }
        }

        // Update Wave Manager & Enemies (Freeze enemy dt if Time Freeze cheat is ON!)
        const enemyDt = this.modMenu.timeFreezeEnemies ? 0 : dt;

        this.waveManager.update(enemyDt, this.player, this.audio, this.particles, (clearedWave) => {
          this.startUpgradeSelection();
        });

        // Update Enemy Physics & Crowd Separation
        for (const enemy of this.waveManager.enemies) {
          this.physics.updateEntity(enemy, enemyDt, this.audio, this.particles);
        }
        this.physics.resolveEntityCollisions([this.player, ...this.waveManager.enemies]);

        // Check Player Death (Skip if God mode)
        if (this.player.state === 'DEAD' && !this.modMenu.godMode) {
          this.gameState = 'GAMEOVER';
          this.ui.showGameOver(this.waveManager.currentWave, this.waveManager.totalKills, () => {
            this.restartGame();
          });
        }
      } else if (this.gameMode === 'DUEL_1V1') {
        const opponents = this.duelManager.remotePlayer ? [this.duelManager.remotePlayer] : [];

        // Lock-On Toggle in 1v1
        if (this.input.actions.lockOn && opponents.length > 0) {
          this.cameraController.toggleLockOn(opponents, this.player.position, this.particles);
        }

        // Update local player with opponent as target
        this.player.update(dt, this.input, this.audio, this.particles, opponents, this.cameraController.yaw, this.cameraController.lockOnTarget);
        this.physics.updateEntity(this.player, dt, this.audio, this.particles);

        // Update local player minions in 1v1
        if (this.player.minionsList && this.player.minionsList.length > 0) {
          for (const minion of this.player.minionsList) {
            minion.update(dt, [], this.duelManager.remotePlayer, this.audio);
          }
        }

        // Update 1v1 Duel Manager (remote sync, projectiles, hp)
        this.duelManager.update(dt, this.player);

        // Send reliable action events to opponent
        if (this.input.actions.lightAttack) {
          this.network.sendEvent('ATTACK', { isHeavy: false });
        } else if (this.input.actions.heavyAttack) {
          this.network.sendEvent('ATTACK', { isHeavy: true });
        }

        if (this.input.actions.dodgeRoll) {
          this.network.sendEvent('DODGE', {});
        }

        // Resolve collision between local player and remote opponent
        if (this.duelManager.remotePlayer) {
          this.physics.resolveEntityCollisions([this.player, this.duelManager.remotePlayer]);
        }
      }
    }

    // 3. Update Camera, World & Particles
    this.cameraController.update(rawDt, this.player.position, this.input);
    this.arena.update(rawDt, this.clock.getElapsedTime());
    this.arena.updateCameraOcclusion(this.camera.position, this.player.position, rawDt);
    this.particles.update(rawDt);

    // 4. Update 2D / 3D HUD
    this.ui.updateHUD(this.player, this.waveManager);
    this.ui.renderPopups(this.particles.getTextPopups(), window.innerWidth, window.innerHeight);

    // Flush single-frame input pulses
    this.input.flush();

    // 5. Render 3D Scene
    this.renderer.render(this.scene, this.camera);
  }
}

// Start Game Instance safely
function bootGame() {
  if (!window.game) {
    const game = new Game();
    game.run();
  }
}

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', bootGame);
} else {
  bootGame();
}
