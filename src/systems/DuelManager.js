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
    this.net.on('HANDSHAKE', (data) => {
      if (this.localPlayer) {
        // Send our chosen class
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

    this.net.on('HIT', (data) => {
      if (this.localPlayer && !this.localPlayer.isInvulnerable) {
        this.localPlayer.takeDamage(data.damage, this.audio, this.particles);
        if (data.knock) {
          this.localPlayer.velocity.x += data.knock[0];
          this.localPlayer.velocity.z += data.knock[1];
        }
      }
    });

    this.net.on('REMATCH_REQUEST', () => {
      this.particles.spawnTextPopup("⚡ L'ADVERSAIRE DEMANDE UNE REVANCHE !", this.remotePlayer?.position || {x:0, y:0, z:0}, '#00f0ff', true);
      const rematchBanner = document.getElementById('duel-rematch-btn');
      if (rematchBanner) rematchBanner.classList.add('pulse');
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

    this.localPlayer.setProjectilesList(this.projectiles);
    this.localPlayer.onProjectileSpawned = (type, startPos, targetPos, speed, damage) => {
      this.net.sendEvent('PROJECTILE', {
        type,
        start: [startPos.x, startPos.y, startPos.z],
        target: [targetPos.x, targetPos.y, targetPos.z],
        speed,
        damage
      });
    };

    // Notify opponent
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

  checkLocalHitsOnRemote(isHeavy = false) {
    if (!this.remotePlayer || this.remotePlayer.isDead || !this.isActive) return;

    const dx = this.remotePlayer.position.x - this.localPlayer.position.x;
    const dz = this.remotePlayer.position.z - this.localPlayer.position.z;
    const distSq = dx * dx + dz * dz;

    const hitRange = (isHeavy ? 3.8 : 2.8) * (this.localPlayer.weapon?.rangeMultiplier || 1.0);

    if (distSq <= hitRange * hitRange) {
      const angleToOpp = Math.atan2(dx, dz);
      const angleDiff = Math.abs(MathUtils.angleDiff(angleToOpp, this.localPlayer.rotationY));

      if (angleDiff <= (isHeavy ? 2.4 : 1.8) * 0.5) {
        const isCrit = Math.random() < this.localPlayer.critChance || this.localPlayer.megaBonkBuff;
        let dmg = this.localPlayer.getCalculatedDamage(isHeavy);
        if (isCrit) dmg = Math.floor(dmg * this.localPlayer.critMultiplier);

        const len = Math.sqrt(distSq) || 1;
        const dirX = dx / len;
        const dirZ = dz / len;
        const knockForce = (isHeavy ? 24 : 14) * this.localPlayer.knockbackBonus;

        this.remotePlayer.takeDamage(dmg, dirX, dirZ, knockForce, isCrit, this.audio, this.particles);

        // Send reliable HIT packet to opponent
        this.net.sendEvent('HIT', {
          damage: dmg,
          isCrit,
          knock: [dirX * knockForce, dirZ * knockForce]
        });

        this.updateHUD();
      }
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

    // Check Round Winner
    if (this.matchState === 'FIGHTING') {
      if (player.hp <= 0) {
        this.matchState = 'OVER';
        this.showResult(false); // Defeat
      } else if (this.remotePlayer && this.remotePlayer.hp <= 0) {
        this.matchState = 'OVER';
        this.showResult(true); // Victory!
      }
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

    // If host, trigger start after 1s
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
