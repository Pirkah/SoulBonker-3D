import { Bonkling, HammerBrute, VoidMage, ProfesseurAmphi, Gargoyle, ToxicGromp, CursedKnight, DemonLordBoss, LichKingBoss, TitanGolemBoss } from '../entities/EnemyTypes.js';
import { CHARACTER_CLASSES } from './ClassManager.js';

export class ModMenu {
  constructor(game) {
    this.game = game;
    this.isOpen = false;

    // Mod Settings State
    this.godMode = false;
    this.infiniteStamina = false;
    this.timeFreezeEnemies = false;
    this.oneHitKill = false;
    this.speedMultiplier = 1.0;
    this.damageMultiplier = 1.0;
    this.knockbackMultiplier = 1.0;
    this.weaponScale = 1.0;

    this.createDOM();
    this.bindEvents();
  }

  createDOM() {
    this.menuEl = document.createElement('div');
    this.menuEl.id = 'mod-menu-modal';
    this.menuEl.className = 'mod-menu-container';
    this.menuEl.innerHTML = `
      <div class="mod-menu-header">
        <div class="mod-menu-title">🛠️ MOD MENU / CHEATS (Touche [M] ou [²])</div>
        <button class="mod-close-btn" id="mod-close-btn">✖</button>
      </div>

      <div class="mod-menu-body">
        <!-- SECTION 1: POUVOIRS JOUEUR -->
        <div class="mod-section">
          <div class="mod-section-title">⚡ POUVOIRS DU JOUEUR</div>
          <div class="mod-grid">
            <button class="mod-btn toggle-btn" id="mod-freeze-btn">⏱️ Figer les Mobs : OFF</button>
            <button class="mod-btn toggle-btn" id="mod-god-btn">🛡️ Mode Dieu (Invincible) : OFF</button>
            <button class="mod-btn toggle-btn" id="mod-stamina-btn">🟢 Endurance Infinie : OFF</button>
            <button class="mod-btn toggle-btn" id="mod-onehit-btn">💥 One-Hit Kill : OFF</button>
          </div>

          <div class="mod-slider-group">
            <div class="mod-slider-row">
              <label>💨 Vitesse de déplacement : <span id="speed-val">1.0x</span></label>
              <input type="range" id="speed-slider" min="1.0" max="4.0" step="0.2" value="1.0">
            </div>
            <div class="mod-slider-row">
              <label>⚔️ Multiplicateur de Dégâts : <span id="dmg-val">1.0x</span></label>
              <input type="range" id="dmg-slider" min="1.0" max="10.0" step="0.5" value="1.0">
            </div>
            <div class="mod-slider-row">
              <label>🚀 Force de Projection : <span id="knock-val">1.0x</span></label>
              <input type="range" id="knock-slider" min="1.0" max="8.0" step="0.5" value="1.0">
            </div>
            <div class="mod-slider-row">
              <label>🔨 Taille de l'Arme : <span id="weapon-val">1.0x</span></label>
              <input type="range" id="weapon-slider" min="1.0" max="4.0" step="0.2" value="1.0">
            </div>
          </div>
        </div>

        <!-- SECTION 2: SPAWNER DE MONSTRES & BOSS -->
        <div class="mod-section">
          <div class="mod-section-title">👾 SPAWNER DE MONSTRES & BOSS</div>
          <div class="mod-grid">
            <button class="mod-btn spawn-btn boss" id="spawn-prof-btn">🎓 Boss : Professeur d'Amphi</button>
            <button class="mod-btn spawn-btn boss" id="spawn-demon-btn">😈 Boss : Démon Malakor</button>
            <button class="mod-btn spawn-btn boss" id="spawn-lich-btn">💀 Boss : Roi Liche Mortis</button>
            <button class="mod-btn spawn-btn boss" id="spawn-titan-btn">🗿 Boss : Titan de Pierre</button>
            <button class="mod-btn spawn-btn" id="spawn-gargoyle-btn">🦇 Gargouille Ailée</button>
            <button class="mod-btn spawn-btn" id="spawn-gromp-btn">🐸 Gromp Vénéneux</button>
            <button class="mod-btn spawn-btn" id="spawn-knight-mob-btn">🛡️ Chevalier Maudit</button>
            <button class="mod-btn spawn-btn" id="spawn-brute-btn">🔨 Brute au Marteau</button>
            <button class="mod-btn spawn-btn" id="spawn-mage-btn">🧙 Mage du Vide</button>
            <button class="mod-btn spawn-btn" id="spawn-bonkling-btn">👺 1 Bonkling</button>
            <button class="mod-btn spawn-btn horde" id="spawn-horde-btn">🔥 HORDE (15 Mobs)</button>
            <button class="mod-btn kill-btn" id="kill-all-btn">🧹 BONK TOUT LE MONDE (Kill All)</button>
          </div>
        </div>

        <!-- SECTION 3: VAGUES & BONUS -->
        <div class="mod-section">
          <div class="mod-section-title">🌊 GESTION DES VAGUES & CARTES</div>
          <div class="mod-grid">
            <button class="mod-btn" id="clear-wave-btn">⏭️ Terminer la Vague</button>
            <button class="mod-btn" id="open-upgrades-btn">🃏 Ouvrir Deck d'Améliorations</button>
            <button class="mod-btn" id="wave-5-btn">🎓 Sauter Vague 5 (Boss Prof)</button>
            <button class="mod-btn" id="wave-10-btn">😈 Sauter Vague 10 (Boss Démon)</button>
            <button class="mod-btn" id="wave-15-btn">💀 Sauter Vague 15 (Boss Liche)</button>
            <button class="mod-btn" id="wave-20-btn">🗿 Sauter Vague 20 (Boss Titan)</button>
          </div>
        </div>

        <!-- SECTION 4: CHANGEMENT DE CLASSE EN DIRECT -->
        <div class="mod-section">
          <div class="mod-section-title">🎭 CHANGER DE CLASSE EN DIRECT (EN PLEINE GAME)</div>
          <div class="mod-grid" style="grid-template-columns: repeat(3, 1fr);">
            <button class="mod-btn" id="switch-knight-btn">🛡️ Chevalier</button>
            <button class="mod-btn" id="switch-archer-btn">🏹 Archer</button>
            <button class="mod-btn" id="switch-mage-btn">🧙 Mage</button>
            <button class="mod-btn" id="switch-sm-btn">⚔️ Black Templar</button>
            <button class="mod-btn" id="switch-angel-btn">👼 Ange</button>
            <button class="mod-btn" id="switch-rogue-btn">🗡️ Voleur</button>
            <button class="mod-btn" id="switch-ork-btn">🧌 Ork</button>
            <button class="mod-btn" id="switch-reaper-btn">💀 Faucheur</button>
            <button class="mod-btn" id="switch-necro-btn">🧟 Nécromancien</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(this.menuEl);
  }

  bindEvents() {
    // Close button
    const closeBtn = document.getElementById('mod-close-btn');
    if (closeBtn) {
      closeBtn.onclick = () => {
        this.toggle(false);
        window.focus();
        this.game.input.flush();
      };
    }

    // Toggle Time Freeze
    const freezeBtn = document.getElementById('mod-freeze-btn');
    freezeBtn.onclick = () => {
      this.timeFreezeEnemies = !this.timeFreezeEnemies;
      freezeBtn.classList.toggle('active', this.timeFreezeEnemies);
      freezeBtn.textContent = `⏱️ Figer les Mobs : ${this.timeFreezeEnemies ? 'ON (FIGÉS)' : 'OFF'}`;
      this.game.particles.spawnTextPopup(
        this.timeFreezeEnemies ? "⏱️ TEMPS FIGÉ POUR LES MONSTRES !" : "▶️ REPRISE DU TEMPS",
        this.game.player.position,
        '#00ffff',
        true
      );
    };

    // Toggle God Mode
    const godBtn = document.getElementById('mod-god-btn');
    godBtn.onclick = () => {
      this.godMode = !this.godMode;
      godBtn.classList.toggle('active', this.godMode);
      godBtn.textContent = `🛡️ Mode Dieu : ${this.godMode ? 'ON (INVINCIBLE)' : 'OFF'}`;
      if (this.godMode) {
        this.game.player.hp = this.game.player.maxHp = 9999;
      } else {
        this.game.player.maxHp = 100;
        this.game.player.hp = 100;
      }
    };

    // Toggle Infinite Stamina
    const staminaBtn = document.getElementById('mod-stamina-btn');
    staminaBtn.onclick = () => {
      this.infiniteStamina = !this.infiniteStamina;
      staminaBtn.classList.toggle('active', this.infiniteStamina);
      staminaBtn.textContent = `🟢 Endurance Infinie : ${this.infiniteStamina ? 'ON' : 'OFF'}`;
    };

    // Toggle One-Hit Kill
    const onehitBtn = document.getElementById('mod-onehit-btn');
    onehitBtn.onclick = () => {
      this.oneHitKill = !this.oneHitKill;
      onehitBtn.classList.toggle('active', this.oneHitKill);
      onehitBtn.textContent = `💥 One-Hit Kill : ${this.oneHitKill ? 'ON (x999 DÉGÂTS)' : 'OFF'}`;
    };

    // Sliders
    const speedSlider = document.getElementById('speed-slider');
    speedSlider.oninput = (e) => {
      this.speedMultiplier = parseFloat(e.target.value);
      document.getElementById('speed-val').textContent = `${this.speedMultiplier.toFixed(1)}x`;
      this.game.player.moveSpeed = 10.0 * this.speedMultiplier;
    };

    const dmgSlider = document.getElementById('dmg-slider');
    dmgSlider.oninput = (e) => {
      this.damageMultiplier = parseFloat(e.target.value);
      document.getElementById('dmg-val').textContent = `${this.damageMultiplier.toFixed(1)}x`;
    };

    const knockSlider = document.getElementById('knock-slider');
    knockSlider.oninput = (e) => {
      this.knockbackMultiplier = parseFloat(e.target.value);
      document.getElementById('knock-val').textContent = `${this.knockbackMultiplier.toFixed(1)}x`;
    };

    const weaponSlider = document.getElementById('weapon-slider');
    weaponSlider.oninput = (e) => {
      this.weaponScale = parseFloat(e.target.value);
      document.getElementById('weapon-val').textContent = `${this.weaponScale.toFixed(1)}x`;
      this.game.player.weapon.setScale(this.weaponScale);
    };

    // Spawners - Bosses & Mobs
    document.getElementById('spawn-prof-btn').onclick = () => {
      const boss = new ProfesseurAmphi(this.game.scene, 0, -10, this.game.waveManager.projectiles);
      this.game.waveManager.enemies.push(boss);
      this.game.particles.spawnTextPopup("🎓 LE PROFESSEUR D'AMPHI EST ARRIVÉ !", boss.position, '#ff0033', true);
      this.game.audio.playGroundSlam();
    };

    document.getElementById('spawn-demon-btn').onclick = () => {
      const boss = new DemonLordBoss(this.game.scene, 0, -10, this.game.waveManager.projectiles);
      this.game.waveManager.enemies.push(boss);
      this.game.particles.spawnTextPopup("😈 MALAKOR SEIGNEUR DÉMON EST ARRIVÉ !", boss.position, '#ff2200', true);
      this.game.audio.playGroundSlam();
    };

    document.getElementById('spawn-lich-btn').onclick = () => {
      const boss = new LichKingBoss(this.game.scene, 0, -10, this.game.waveManager.projectiles);
      this.game.waveManager.enemies.push(boss);
      this.game.particles.spawnTextPopup("💀 MORTIS ROI LICHE EST ARRIVÉ !", boss.position, '#00e5ff', true);
      this.game.audio.playMagicCast(true);
    };

    document.getElementById('spawn-titan-btn').onclick = () => {
      const boss = new TitanGolemBoss(this.game.scene, 0, -10, this.game.waveManager.projectiles);
      this.game.waveManager.enemies.push(boss);
      this.game.particles.spawnTextPopup("🗿 LE TITAN ANCIEN S'ÉVEILLE !", boss.position, '#ffd700', true);
      this.game.audio.playGroundSlam();
    };

    document.getElementById('spawn-gargoyle-btn').onclick = () => {
      const m = new Gargoyle(this.game.scene, Math.random() * 20 - 10, Math.random() * 20 - 10);
      this.game.waveManager.enemies.push(m);
    };

    document.getElementById('spawn-gromp-btn').onclick = () => {
      const m = new ToxicGromp(this.game.scene, Math.random() * 20 - 10, Math.random() * 20 - 10, this.game.waveManager.projectiles);
      this.game.waveManager.enemies.push(m);
    };

    document.getElementById('spawn-knight-mob-btn').onclick = () => {
      const m = new CursedKnight(this.game.scene, Math.random() * 20 - 10, Math.random() * 20 - 10);
      this.game.waveManager.enemies.push(m);
    };

    document.getElementById('spawn-brute-btn').onclick = () => {
      const brute = new HammerBrute(this.game.scene, Math.random() * 20 - 10, Math.random() * 20 - 10);
      this.game.waveManager.enemies.push(brute);
    };

    document.getElementById('spawn-mage-btn').onclick = () => {
      const mage = new VoidMage(this.game.scene, Math.random() * 20 - 10, Math.random() * 20 - 10, this.game.waveManager.projectiles);
      this.game.waveManager.enemies.push(mage);
    };

    document.getElementById('spawn-bonkling-btn').onclick = () => {
      const b = new Bonkling(this.game.scene, Math.random() * 20 - 10, Math.random() * 20 - 10);
      this.game.waveManager.enemies.push(b);
    };

    document.getElementById('spawn-horde-btn').onclick = () => {
      for (let i = 0; i < 15; i++) {
        const angle = (i / 15) * Math.PI * 2;
        const b = new Bonkling(this.game.scene, Math.sin(angle) * 22, Math.cos(angle) * 22);
        this.game.waveManager.enemies.push(b);
      }
      this.game.particles.spawnTextPopup("🔥 HORDE DE 15 BONKLINGS !", this.game.player.position, '#ff9900', true);
    };

    // Kill All / Purge
    document.getElementById('kill-all-btn').onclick = () => {
      const count = this.game.waveManager.enemies.length;
      this.game.waveManager.enemies.forEach((e) => {
        e.takeDamage(99999, Math.random() * 2 - 1, Math.random() * 2 - 1, 40, true);
        this.game.particles.spawnHitSparks(e.position, 0, 0, 16, true);
      });
      this.game.audio.playBonk(2.0, true);
      this.game.particles.spawnTextPopup(`💥 ${count} MOBS BONKÉS !`, this.game.player.position, '#00ffcc', true);
    };

    // Wave controls
    document.getElementById('clear-wave-btn').onclick = () => {
      this.game.waveManager.enemies.forEach(e => e.die());
      this.game.waveManager.enemiesRemainingToSpawn = [];
      this.game.startUpgradeSelection();
      this.toggle(false);
    };

    document.getElementById('open-upgrades-btn').onclick = () => {
      this.game.startUpgradeSelection();
      this.toggle(false);
    };

    document.getElementById('wave-5-btn').onclick = () => {
      this.game.waveManager.enemies.forEach(e => e.destroy());
      this.game.waveManager.enemies = [];
      this.game.waveManager.startWave(5);
      this.toggle(false);
    };

    document.getElementById('wave-10-btn').onclick = () => {
      this.game.waveManager.enemies.forEach(e => e.destroy());
      this.game.waveManager.enemies = [];
      this.game.waveManager.startWave(10);
      this.toggle(false);
    };

    document.getElementById('wave-15-btn').onclick = () => {
      this.game.waveManager.enemies.forEach(e => e.destroy());
      this.game.waveManager.enemies = [];
      this.game.waveManager.startWave(15);
      this.toggle(false);
    };

    document.getElementById('wave-20-btn').onclick = () => {
      this.game.waveManager.enemies.forEach(e => e.destroy());
      this.game.waveManager.enemies = [];
      this.game.waveManager.startWave(20);
      this.toggle(false);
    };

    // Live Class Switching (all 9 classes)
    const switchClasses = [
      { id: 'switch-knight-btn', key: 'KNIGHT' },
      { id: 'switch-archer-btn', key: 'ARCHER' },
      { id: 'switch-mage-btn', key: 'MAGE' },
      { id: 'switch-sm-btn', key: 'SPACEMARINE' },
      { id: 'switch-angel-btn', key: 'ANGEL' },
      { id: 'switch-rogue-btn', key: 'ROGUE' },
      { id: 'switch-ork-btn', key: 'ORK' },
      { id: 'switch-reaper-btn', key: 'REAPER' },
      { id: 'switch-necro-btn', key: 'NECROMANCER' }
    ];

    switchClasses.forEach(({ id, key }) => {
      const btn = document.getElementById(id);
      if (btn) {
        btn.onclick = () => {
          this.game.selectCharacterClass(key, false);
          this.toggle(false);
          window.focus();
          this.game.input.flush();
        };
      }
    });
  }

  toggle(forceState) {
    this.isOpen = (forceState !== undefined) ? forceState : !this.isOpen;
    this.menuEl.style.display = this.isOpen ? 'flex' : 'none';
  }

  update(dt, player) {
    if (this.godMode) {
      player.hp = player.maxHp = 9999;
      player.isInvulnerable = true;
    }

    if (this.infiniteStamina) {
      player.stamina = player.maxStamina;
      player.isExhausted = false;
    }

    player.damageModMultiplier = this.oneHitKill ? 999 : this.damageMultiplier;
    player.knockbackModMultiplier = this.knockbackMultiplier;
  }
}
