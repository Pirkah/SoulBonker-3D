import * as THREE from '../../libs/three.module.js';

export class UIManager {
  constructor(camera, domContainer) {
    this.camera = camera;
    this.container = domContainer;

    // DOM Elements Cache
    this.hpBarFill = document.getElementById('hp-bar-fill');
    this.hpText = document.getElementById('hp-text');
    this.staminaBarFill = document.getElementById('stamina-bar-fill');
    this.staminaContainer = document.getElementById('stamina-container');
    this.waveNumberEl = document.getElementById('wave-number');
    this.enemyCountEl = document.getElementById('enemy-count');
    this.killCountEl = document.getElementById('kill-count');
    this.bossHpContainer = document.getElementById('boss-hp-container');
    this.bossHpFill = document.getElementById('boss-hp-fill');
    this.bossNameEl = document.getElementById('boss-name');
    this.perfectDodgeBanner = document.getElementById('perfect-dodge-banner');
    this.upgradeModal = document.getElementById('upgrade-modal');
    this.upgradeCardsContainer = document.getElementById('upgrade-cards');
    this.gameOverModal = document.getElementById('game-over-modal');
    this.popupContainer = document.getElementById('popup-container');
    this.megaBonkBadge = document.getElementById('megabonk-badge');

    this.projectVec = new THREE.Vector3();
  }

  updateHUD(player, waveManager) {
    // 1. Health Bar
    const hpPercent = Math.max(0, (player.hp / player.maxHp) * 100);
    this.hpBarFill.style.width = `${hpPercent}%`;
    this.hpText.textContent = `${Math.ceil(player.hp)} / ${player.maxHp}`;

    // 2. Stamina Bar
    const staminaPercent = Math.max(0, (player.stamina / player.maxStamina) * 100);
    this.staminaBarFill.style.width = `${staminaPercent}%`;
    if (player.isExhausted) {
      this.staminaContainer.classList.add('exhausted');
    } else {
      this.staminaContainer.classList.remove('exhausted');
    }

    // 3. Mega Bonk Buff Badge
    if (player.megaBonkBuff) {
      this.megaBonkBadge.style.display = 'flex';
    } else {
      this.megaBonkBadge.style.display = 'none';
    }

    // 4. Wave & Enemy stats
    this.waveNumberEl.textContent = `VAGUE ${waveManager.currentWave}`;
    const totalRemaining = waveManager.enemies.length + waveManager.enemiesRemainingToSpawn.length;
    this.enemyCountEl.textContent = `Ennemis : ${totalRemaining}`;
    this.killCountEl.textContent = `💀 ${waveManager.totalKills}`;

    // 5. Boss Bar
    const boss = waveManager.enemies.find(e => (e.type === 'BOSS_PROF' || e.type === 'BOSS_GOLEM') && !e.isDead);
    if (boss) {
      this.bossHpContainer.style.display = 'block';
      const bossPercent = Math.max(0, (boss.hp / boss.maxHp) * 100);
      this.bossHpFill.style.width = `${bossPercent}%`;
      this.bossNameEl.textContent = `🎓 PROFESSEUR D'AMPHI : DOYEN DU RATTRAPAGE [VAGUE ${waveManager.currentWave}]`;
    } else {
      this.bossHpContainer.style.display = 'none';
    }
  }

  showPerfectDodgeBanner() {
    this.perfectDodgeBanner.classList.add('active');
    setTimeout(() => {
      this.perfectDodgeBanner.classList.remove('active');
    }, 1100);
  }

  showUpgradeSelection(choices, onSelect) {
    this.upgradeCardsContainer.innerHTML = '';
    this.upgradeModal.style.display = 'flex';

    choices.forEach((card, index) => {
      const cardEl = document.createElement('div');
      cardEl.className = `upgrade-card ${card.rarity}`;
      const letterKey = ['J', 'K', 'L'][index];
      cardEl.innerHTML = `
        <div class="card-shortcut">[${index + 1}] ou [${letterKey}]</div>
        <div class="card-icon">${card.icon}</div>
        <div class="card-rarity">${card.rarity.toUpperCase()}</div>
        <div class="card-title">${card.name}</div>
        <div class="card-desc">${card.description}</div>
        <button class="card-btn">CHOISIR [${letterKey}]</button>
      `;

      cardEl.addEventListener('click', () => {
        this.upgradeModal.style.display = 'none';
        onSelect(card);
      });

      this.upgradeCardsContainer.appendChild(cardEl);
    });
  }

  showGameOver(wave, kills, onRestart) {
    this.gameOverModal.style.display = 'flex';
    document.getElementById('final-wave').textContent = wave;
    document.getElementById('final-kills').textContent = kills;

    const restartBtn = document.getElementById('restart-btn');
    restartBtn.onclick = () => {
      this.gameOverModal.style.display = 'none';
      onRestart();
    };
  }

  renderPopups(popups, width, height) {
    this.popupContainer.innerHTML = '';

    popups.forEach((popup) => {
      this.projectVec.set(popup.x, popup.y, popup.z);
      this.projectVec.project(this.camera);

      // Check if behind camera
      if (this.projectVec.z > 1) return;

      const screenX = (this.projectVec.x * 0.5 + 0.5) * width;
      const screenY = (-(this.projectVec.y * 0.5) + 0.5) * height;

      const div = document.createElement('div');
      div.className = `damage-popup ${popup.isCrit ? 'crit' : ''}`;
      div.style.left = `${screenX}px`;
      div.style.top = `${screenY}px`;
      div.style.color = popup.color;
      div.textContent = popup.text;

      this.popupContainer.appendChild(div);
    });
  }
}
