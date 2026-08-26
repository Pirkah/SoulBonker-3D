import * as THREE from '../../libs/three.module.js';
import { RemotePlayer } from '../entities/RemotePlayer.js';
import { PlayerArrowProjectile, PlayerMagicOrbProjectile } from '../entities/Projectile.js';
import { MathUtils } from '../utils/MathUtils.js';

export class DuelManager {
  constructor(scene, networkManager, audio, particles) {
    this.scene = scene;
    this.net = networkManager;
    this.audio = audio;
    this.particles = particles;

    this.remotePlayer = null;
    this.isActive = false;
    this.projectiles = [];
    this.matchState = 'WAITING'; // WAITING, FIGHTING, OVER

    this.localPlayer = null;
    this.setupNetworkListeners();
  }

  setupNetworkListeners() {
    this.net.on('HANDSHAKE', () => {
      if (this.localPlayer) {
        this.net.sendEvent('CLASS_SELECT', {
          classKey: this.localPlayer.currentClass.id
        });
      }
    });

    this.net.on('CLASS_SELECT', (data) => {
      if (this.remotePlayer && data.classKey) {
        this.remotePlayer.applyNetworkState({ classKey: data.classKey });
        this.updateHUD();
      }
    });

    this.net.on('state', (stateData) => {
      if (this.remotePlayer) {
        this.remotePlayer.applyNetworkState(stateData);
        this.updateHUD();

        // If opponent's authoritative HP is 0 and we are fighting, we won!
        if (this.matchState === 'FIGHTING' && stateData.hp !== undefined && stateData.hp <= 0) {
          this.matchState = 'OVER';
          this.showResult(true);
        }
      }
    });

    this.net.on('ATTACK', (data) => {
      if (this.remotePlayer) {
        this.remotePlayer.triggerAttack(data.isHeavy, this.audio);
      }
    });

    this.net.on('DODGE', () => {
      if (this.remotePlayer) {
        this.remotePlayer.triggerDodge(this.audio);
      }
    });

    this.net.on('PROJECTILE', (data) => {
      this.spawnRemoteProjectile(data);
    });

    // Authoritative incoming damage handler
    this.net.on('HIT', (data) => {
      if (!this.localPlayer || this.matchState !== 'FIGHTING') return;

      if (!this.localPlayer.isInvulnerable && this.localPlayer.state !== 'DEAD') {
        this.localPlayer.takeDamage(data.damage, this.audio, this.particles);

        if (data.knock) {
          this.localPlayer.velocity.x += data.knock[0];
          this.localPlayer.velocity.z += data.knock[1];
        }

        // Broadcast updated state immediately so attacker's HUD updates
        this.net.sendState({
          pos: [this.localPlayer.position.x, this.localPlayer.position.y, this.localPlayer.position.z],
          rot: this.localPlayer.rotationY,
          vel: [this.localPlayer.velocity.x, this.localPlayer.velocity.z],
          state: this.localPlayer.state,
          hp: this.localPlayer.hp,
          classKey: this.localPlayer.currentClass.id
        });

        // Check if local player died
        if (this.localPlayer.hp <= 0) {
          this.matchState = 'OVER';
          this.net.sendEvent('MATCH_OVER', { winner: 'OPPONENT' });
          this.showResult(false); // Defeat for local player
        }
      }
    });

    this.net.on('MATCH_OVER', (data) => {
      if (this.matchState === 'FIGHTING') {
        this.matchState = 'OVER';
        if (data.winner === 'OPPONENT') {
          this.showResult(true); // Opponent surrendered / died
        } else {
          this.showResult(false);
        }
      }
    });

    this.net.on('REMATCH_REQUEST', () => {
      this.particles.spawnTextPopup("⚡ L'ADVERSAIRE DEMANDE UNE REVANCHE !", this.remotePlayer?.position || {x:0, y:0, z:0}, '#00f0ff', true);
      const rematchBtn = document.getElementById('duel-rematch-btn');
      if (rematchBtn) rematchBtn.style.boxShadow = '0 0 35px rgba(0, 240, 255, 0.9)';
    });

    this.net.on('REMATCH_START', () => {
      this.startDuel(this.localPlayer);
    });
  }

  initDuel(localPlayer) {
    this.localPlayer = localPlayer;
    if (!this.remotePlayer) {
      this.remotePlayer = new RemotePlayer(this.scene);
    }
    this.startDuel(localPlayer);
  }

  startDuel(localPlayer) {
    this.localPlayer = localPlayer;
    this.localPlayer.isInvulnerable = false;
    this.isActive = true;
    this.matchState = 'FIGHTING';

    // Host spawns at (0, 0, -14), Client spawns at (0, 0, 14)
    const isHost = this.net.isHost;
    const startZ = isHost ? -14 : 14;
    const oppZ = isHost ? 14 : -14;

    this.localPlayer.position.set(0, 0, startZ);
    this.localPlayer.velocity.set(0, 0, 0);
    this.localPlayer.rotationY = isHost ? 0 : Math.PI;
    this.localPlayer.targetRotationY = this.localPlayer.rotationY;
    this.localPlayer.hp = this.localPlayer.maxHp;
    this.localPlayer.state = 'IDLE';

    if (this.remotePlayer) {
      this.remotePlayer.position.set(0, 0, oppZ);
      this.remotePlayer.targetPosition.set(0, 0, oppZ);
      this.remotePlayer.rotationY = isHost ? Math.PI : 0;
      this.remotePlayer.targetRotationY = this.remotePlayer.rotationY;
      this.remotePlayer.hp = this.remotePlayer.maxHp;
      this.remotePlayer.isDead = false;
      this.remotePlayer.state = 'IDLE';
    }

    // Clear old projectiles
    this.projectiles.forEach(p => p.destroy());
    this.projectiles = [];

    // Hook local player projectile and melee hit callbacks
    this.localPlayer.setProjectilesList(this.projectiles);
    this.localPlayer.setDuelOpponent(this.remotePlayer);

    this.localPlayer.onProjectileSpawned = (type, startPos, targetPos, speed, damage) => {
      this.net.sendEvent('PROJECTILE', {
        type,
        start: [startPos.x, startPos.y, startPos.z],
        target: [targetPos.x, targetPos.y, targetPos.z],
        speed,
        damage
      });
    };

    // Single Authoritative Melee Hit Hook (Runs exactly ONCE per swing)
    this.localPlayer.onMeleeHit = (target, dmg, dirX, dirZ, knockForce, isCrit) => {
      if (this.matchState !== 'FIGHTING' || !this.remotePlayer || this.remotePlayer.isDead) return;

      // Send single hit packet to opponent
      this.net.sendEvent('HIT', {
        damage: dmg,
        isCrit,
        knock: [dirX * knockForce, dirZ * knockForce]
      });
    };

    // Notify opponent of our selected class
    this.net.sendEvent('CLASS_SELECT', {
      classKey: this.localPlayer.currentClass.id
    });

    this.updateHUD();

    // Hide result modal if open
    const resultModal = document.getElementById('duel-result-modal');
    if (resultModal) resultModal.style.display = 'none';

    this.particles.spawnTextPopup("⚔️ DUEL 1v1 COMMENCE !", { x: 0, y: 1.5, z: 0 }, '#00f0ff', true);
    this.audio.playThunder();
  }

  spawnRemoteProjectile(data) {
    const startPos = new THREE.Vector3(data.start[0], data.start[1], data.start[2]);
    const targetPos = new THREE.Vector3(data.target[0], data.target[1], data.target[2]);

    let proj = null;
    if (data.type === 'ARROW') {
      proj = new PlayerArrowProjectile(this.scene, startPos, targetPos, data.speed || 26, data.damage || 28);
    } else if (data.type === 'ORB') {
      proj = new PlayerMagicOrbProjectile(this.scene, startPos, targetPos, data.speed || 18, data.damage || 32, data.isMega || false);
      this.audio.playMagicCast(true);
    }

    if (proj) {
      proj.isEnemy = true; // Treats local player as target
      this.projectiles.push(proj);
    }
  }

  update(dt, player) {
    if (!this.isActive) return;

    // Send local player state to remote opponent at 30Hz
    this.net.sendState({
      pos: [player.position.x, player.position.y, player.position.z],
      rot: player.rotationY,
      vel: [player.velocity.x, player.velocity.z],
      state: player.state,
      hp: player.hp,
      classKey: player.currentClass.id
    });

    // Update Remote Player Avatar
    if (this.remotePlayer) {
      this.remotePlayer.update(dt, this.audio, this.particles);
    }

    // Update Duel Projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];
      proj.update(dt, player, [], this.audio, this.particles);
      if (proj.isDead) {
        this.projectiles.splice(i, 1);
      }
    }

    this.updateHUD();

    // Check if local player HP reached 0
    if (this.matchState === 'FIGHTING' && player.hp <= 0) {
      this.matchState = 'OVER';
      this.net.sendEvent('MATCH_OVER', { winner: 'OPPONENT' });
      this.showResult(false); // Defeat
    }
  }

  updateHUD() {
    const duelHud = document.getElementById('duel-hud');
    if (!duelHud) return;

    if (this.isActive) {
      duelHud.style.display = 'flex';
      const opp = this.remotePlayer;
      if (opp) {
        const nameEl = document.getElementById('duel-opp-name');
        const hpBar = document.getElementById('duel-opp-hp-fill');
        const hpText = document.getElementById('duel-opp-hp-text');

        if (nameEl) nameEl.textContent = `${opp.currentClass.icon} ${opp.currentClass.name.toUpperCase()}`;
        if (hpBar) {
          const pct = Math.max(0, Math.min(100, (opp.hp / opp.maxHp) * 100));
          hpBar.style.width = `${pct}%`;
        }
        if (hpText) hpText.textContent = `${Math.ceil(opp.hp)} / ${opp.maxHp} PV`;
      }
    } else {
      duelHud.style.display = 'none';
    }
  }

  showResult(isVictory) {
    this.matchState = 'OVER';
    if (this.localPlayer) {
      this.localPlayer.isInvulnerable = true;
      if (!isVictory) {
        this.localPlayer.state = 'DEAD';
      }
    }

    const resultModal = document.getElementById('duel-result-modal');
    const titleEl = document.getElementById('duel-result-title');
    const subEl = document.getElementById('duel-result-subtitle');

    if (resultModal) {
      resultModal.style.display = 'flex';
      if (titleEl) {
        titleEl.textContent = isVictory ? "👑 VICTOIRE ÉCLATANTE !" : "💀 DÉFAITE...";
        titleEl.style.color = isVictory ? "var(--gold)" : "var(--accent)";
      }
      if (subEl) {
        subEl.textContent = isVictory
          ? "Vous avez terrassé votre adversaire dans l'arène !"
          : "Votre adversaire vous a bonké hors du combat !";
      }

      if (isVictory) {
        this.audio.playLevelUp();
      } else {
        this.audio.playDeath();
      }
    }
  }

  requestRematch() {
    this.net.sendEvent('REMATCH_REQUEST');
    this.particles.spawnTextPopup("⚡ DEMANDE DE REVANCHE ENVOYÉE !", this.localPlayer?.position || {x:0, y:0, z:0}, '#ffd700', true);

    // If host, trigger start after 0.5s
    if (this.net.isHost) {
      setTimeout(() => {
        this.net.sendEvent('REMATCH_START');
        this.startDuel(this.localPlayer);
      }, 500);
    }
  }

  destroy() {
    this.isActive = false;
    if (this.remotePlayer) {
      this.remotePlayer.destroy();
      this.remotePlayer = null;
    }
    this.projectiles.forEach(p => p.destroy());
    this.projectiles = [];
    const duelHud = document.getElementById('duel-hud');
    if (duelHud) duelHud.style.display = 'none';
  }
}
