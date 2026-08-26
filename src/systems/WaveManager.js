import { Bonkling, HammerBrute, VoidMage, ProfesseurAmphi } from '../entities/EnemyTypes.js';

export class WaveManager {
  constructor(scene, arenaRadius = 30) {
    this.scene = scene;
    this.arenaRadius = arenaRadius;

    this.currentWave = 1;
    this.enemiesRemainingToSpawn = [];
    this.spawnTimer = 0;
    this.spawnInterval = 0.55;
    this.isWaveActive = false;
    this.waveCooldown = 0;

    this.totalKills = 0;
    this.enemies = [];
    this.projectiles = [];
  }

  startWave(waveNumber) {
    this.currentWave = waveNumber;
    this.isWaveActive = true;
    this.enemiesRemainingToSpawn = this.generateWaveComposition(waveNumber);
    this.spawnTimer = this.spawnInterval; // Immediate initial mob spawn!
  }

  generateWaveComposition(wave) {
    const queue = [];

    if (wave === 1) {
      for (let i = 0; i < 5; i++) queue.push('BONKLING');
    } else if (wave === 2) {
      for (let i = 0; i < 7; i++) queue.push('BONKLING');
      queue.push('HAMMER_BRUTE');
    } else if (wave === 3) {
      for (let i = 0; i < 8; i++) queue.push('BONKLING');
      queue.push('VOID_MAGE');
      queue.push('VOID_MAGE');
      queue.push('HAMMER_BRUTE');
    } else if (wave === 4) {
      for (let i = 0; i < 14; i++) queue.push('BONKLING');
      queue.push('HAMMER_BRUTE');
      queue.push('HAMMER_BRUTE');
      queue.push('VOID_MAGE');
    } else if (wave % 5 === 0) {
      // 🎓 BOSS WAVE: LE PROFESSEUR D'AMPHI !
      queue.push('BOSS_PROF');
      for (let i = 0; i < 3; i++) queue.push('BONKLING');
    } else {
      // Endless Scaling Wave
      const bonklingCount = 10 + wave * 2;
      const bruteCount = Math.floor(wave / 2);
      const mageCount = Math.floor(wave / 3);

      for (let i = 0; i < bonklingCount; i++) queue.push('BONKLING');
      for (let i = 0; i < bruteCount; i++) queue.push('HAMMER_BRUTE');
      for (let i = 0; i < mageCount; i++) queue.push('VOID_MAGE');
    }

    return queue;
  }

  spawnNextEnemy() {
    if (this.enemiesRemainingToSpawn.length === 0) return;

    const type = this.enemiesRemainingToSpawn.shift();
    const spawnRadius = this.arenaRadius - 3;
    const angle = Math.random() * Math.PI * 2;
    const x = Math.sin(angle) * spawnRadius;
    const z = Math.cos(angle) * spawnRadius;

    let enemy = null;
    if (type === 'BONKLING') {
      enemy = new Bonkling(this.scene, x, z);
    } else if (type === 'HAMMER_BRUTE') {
      enemy = new HammerBrute(this.scene, x, z);
    } else if (type === 'VOID_MAGE') {
      enemy = new VoidMage(this.scene, x, z, this.projectiles);
    } else if (type === 'BOSS_PROF' || type === 'BOSS_GOLEM') {
      enemy = new ProfesseurAmphi(this.scene, 0, -12, this.projectiles);
    }

    if (enemy) {
      this.enemies.push(enemy);
    }
  }

  update(dt, player, audio, particles, onWaveClear) {
    // 1. Spawning Queue
    if (this.isWaveActive && this.enemiesRemainingToSpawn.length > 0) {
      this.spawnTimer += dt;
      if (this.spawnTimer >= this.spawnInterval) {
        this.spawnTimer = 0;
        this.spawnNextEnemy();
      }
    }

    // 2. Update active enemies
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      enemy.update(dt, player, audio, particles);

      if (enemy.isDead && enemy.deathTimer > 0.4) {
        this.totalKills++;
        enemy.destroy();
        this.enemies.splice(i, 1);
      }
    }

    // 3. Update all Projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];
      proj.update(dt, player, this.enemies, audio, particles);
      if (proj.isDead) {
        this.projectiles.splice(i, 1);
      }
    }

    // 4. Check Wave Completion
    if (this.isWaveActive && this.enemiesRemainingToSpawn.length === 0 && this.enemies.length === 0) {
      this.isWaveActive = false;
      if (audio) audio.playLevelUp();
      if (onWaveClear) onWaveClear(this.currentWave);
    }
  }
}
