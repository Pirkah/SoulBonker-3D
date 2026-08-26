import { Bonkling, HammerBrute, VoidMage, ProfesseurAmphi, Gargoyle, ToxicGromp, CursedKnight, DemonLordBoss, LichKingBoss, TitanGolemBoss } from '../entities/EnemyTypes.js';

export class WaveManager {
  constructor(scene, arenaRadius = 30) {
    this.scene = scene;
    this.arenaRadius = arenaRadius;

    this.currentWave = 1;
    this.enemiesRemainingToSpawn = [];
    this.spawnTimer = 0;
    this.spawnInterval = 0.50;
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
      for (let i = 0; i < 6; i++) queue.push('BONKLING');
      queue.push('GARGOYLE');
      queue.push('GARGOYLE');
      queue.push('VOID_MAGE');
    } else if (wave === 4) {
      for (let i = 0; i < 8; i++) queue.push('BONKLING');
      queue.push('GARGOYLE');
      queue.push('HAMMER_BRUTE');
      queue.push('VOID_MAGE');
    } else if (wave === 5) {
      // 🎓 BOSS 1: LE PROFESSEUR D'AMPHI !
      queue.push('BOSS_PROF');
      for (let i = 0; i < 4; i++) queue.push('BONKLING');
    } else if (wave === 6) {
      for (let i = 0; i < 8; i++) queue.push('BONKLING');
      queue.push('TOXIC_GROMP');
      queue.push('TOXIC_GROMP');
      queue.push('CURSED_KNIGHT');
    } else if (wave === 7) {
      for (let i = 0; i < 8; i++) queue.push('BONKLING');
      queue.push('GARGOYLE');
      queue.push('GARGOYLE');
      queue.push('TOXIC_GROMP');
      queue.push('HAMMER_BRUTE');
    } else if (wave === 8) {
      for (let i = 0; i < 9; i++) queue.push('BONKLING');
      queue.push('CURSED_KNIGHT');
      queue.push('CURSED_KNIGHT');
      queue.push('VOID_MAGE');
      queue.push('VOID_MAGE');
    } else if (wave === 9) {
      for (let i = 0; i < 10; i++) queue.push('BONKLING');
      queue.push('GARGOYLE');
      queue.push('GARGOYLE');
      queue.push('TOXIC_GROMP');
      queue.push('CURSED_KNIGHT');
    } else if (wave === 10) {
      // 😈 BOSS 2: LE SEIGNEUR DÉMON MALAKOR !
      queue.push('BOSS_DEMON');
      queue.push('GARGOYLE');
      queue.push('GARGOYLE');
      queue.push('CURSED_KNIGHT');
    } else if (wave === 15) {
      // 💀 BOSS 3: LE ROI LICHE MORTIS !
      queue.push('BOSS_LICH');
      queue.push('CURSED_KNIGHT');
      queue.push('CURSED_KNIGHT');
      queue.push('TOXIC_GROMP');
    } else if (wave === 20) {
      // 🗿 BOSS 4: LE TITAN ANCIEN DE PIERRE !
      queue.push('BOSS_TITAN');
      queue.push('HAMMER_BRUTE');
      queue.push('GARGOYLE');
      queue.push('GARGOYLE');
    } else if (wave % 5 === 0) {
      // Endless Boss Cycles
      const bosses = ['BOSS_PROF', 'BOSS_DEMON', 'BOSS_LICH', 'BOSS_TITAN'];
      const boss = bosses[(wave / 5 - 1) % bosses.length];
      queue.push(boss);
      for (let i = 0; i < 5; i++) queue.push('BONKLING');
      queue.push('CURSED_KNIGHT');
    } else {
      // Endless Scaling Wave
      const bonklingCount = 8 + wave * 2;
      const gargoyleCount = Math.floor(wave / 3);
      const grompCount = Math.floor(wave / 4);
      const knightCount = Math.floor(wave / 4);
      const bruteCount = Math.floor(wave / 5);
      const mageCount = Math.floor(wave / 5);

      for (let i = 0; i < bonklingCount; i++) queue.push('BONKLING');
      for (let i = 0; i < gargoyleCount; i++) queue.push('GARGOYLE');
      for (let i = 0; i < grompCount; i++) queue.push('TOXIC_GROMP');
      for (let i = 0; i < knightCount; i++) queue.push('CURSED_KNIGHT');
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
    } else if (type === 'GARGOYLE') {
      enemy = new Gargoyle(this.scene, x, z);
    } else if (type === 'TOXIC_GROMP') {
      enemy = new ToxicGromp(this.scene, x, z, this.projectiles);
    } else if (type === 'CURSED_KNIGHT') {
      enemy = new CursedKnight(this.scene, x, z);
    } else if (type === 'BOSS_PROF') {
      enemy = new ProfesseurAmphi(this.scene, 0, -12, this.projectiles);
    } else if (type === 'BOSS_DEMON') {
      enemy = new DemonLordBoss(this.scene, 0, -12, this.projectiles);
    } else if (type === 'BOSS_LICH') {
      enemy = new LichKingBoss(this.scene, 0, -12, this.projectiles);
    } else if (type === 'BOSS_TITAN') {
      enemy = new TitanGolemBoss(this.scene, 0, -12, this.projectiles);
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
