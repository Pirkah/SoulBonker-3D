/**
 * Character Classes System for SoulBonker 3D
 * 4 Playable Classes: Chevalier, Archer, Mage, Space Marine (Black Templars)
 */

export const CHARACTER_CLASSES = {
  KNIGHT: {
    id: 'KNIGHT',
    name: 'Chevalier Bonkeur',
    title: 'Guerrier Souls-Like',
    icon: '🛡️',
    color: '#00f0ff',
    modelPath: 'assets/models/player.obj',
    mtlPath: 'assets/models/player.mtl',
    weaponModel: 'assets/models/megabonk_club.obj',
    weaponMtl: 'assets/models/megabonk_club.mtl',
    maxHp: 120,
    maxStamina: 100,
    moveSpeed: 10.0,
    baseDamage: 38,
    attackSpeed: 1.0,
    knockbackMultiplier: 1.0,
    isRanged: false,
    weaponType: 'CLUB',
    heavyName: 'Slam Sismique Megabonk',
    dodgeType: 'ROLL',
    stats: {
      hp: '⭐⭐⭐⭐',
      speed: '⭐⭐⭐',
      damage: '⭐⭐⭐⭐',
      range: '⭐'
    },
    desc: 'Robuste et équilibré. Coups de massue colossale au corps-à-corps, esquives parfaites et Bullet Time.'
  },
  ARCHER: {
    id: 'ARCHER',
    name: 'Rôdeur Sylvestre',
    title: 'Tireur d\'Élite à l\'Arc',
    icon: '🏹',
    color: '#00ff88',
    modelPath: 'assets/models/archer.obj',
    mtlPath: 'assets/models/archer.mtl',
    weaponModel: 'assets/models/bow_weapon.obj',
    weaponMtl: 'assets/models/bow_weapon.mtl',
    maxHp: 85,
    maxStamina: 120,
    moveSpeed: 11.8,
    baseDamage: 28,
    attackSpeed: 1.4,
    knockbackMultiplier: 0.75,
    isRanged: true,
    weaponType: 'BOW',
    heavyName: 'Pluie de Flèches Perforantes',
    dodgeType: 'ACROBATIC_DASH',
    stats: {
      hp: '⭐⭐',
      speed: '⭐⭐⭐⭐⭐',
      damage: '⭐⭐⭐',
      range: '⭐⭐⭐⭐⭐'
    },
    desc: 'Ultra agile et rapide. Tire des flèches perçantes à distance pour faucher les ennemis avant qu\'ils n\'approchent.'
  },
  MAGE: {
    id: 'MAGE',
    name: 'Archimage Arcanique',
    title: 'Maître des Sorts',
    icon: '🧙',
    color: '#bb44ff',
    modelPath: 'assets/models/mage.obj',
    mtlPath: 'assets/models/mage.mtl',
    weaponModel: 'assets/models/mage_staff.obj',
    weaponMtl: 'assets/models/mage_staff.mtl',
    maxHp: 75,
    maxStamina: 110,
    moveSpeed: 9.5,
    baseDamage: 32,
    attackSpeed: 1.15,
    knockbackMultiplier: 0.9,
    isRanged: true,
    weaponType: 'STAFF',
    heavyName: 'Supernova Arcanique Éclatante',
    dodgeType: 'TELEPORT_BLINK',
    stats: {
      hp: '⭐',
      speed: '⭐⭐⭐',
      damage: '⭐⭐⭐⭐⭐',
      range: '⭐⭐⭐⭐'
    },
    desc: 'Lance des orbes arcaniques explosives à tête chercheuse. Se téléporte instantanément lors des esquives.'
  },
  SPACEMARINE: {
    id: 'SPACEMARINE',
    name: 'Black Templar',
    title: 'Space Marine de l\'Imperium',
    icon: '⚔️',
    color: '#ff3300',
    modelPath: 'assets/models/spacemarine.obj',
    mtlPath: 'assets/models/spacemarine.mtl',
    weaponModel: 'assets/models/chainsword.obj',
    weaponMtl: 'assets/models/chainsword.mtl',
    maxHp: 180,
    maxStamina: 80,
    moveSpeed: 8.8,
    baseDamage: 54,
    attackSpeed: 1.25,
    knockbackMultiplier: 1.6,
    isRanged: false,
    weaponType: 'CHAINSWORD',
    heavyName: 'Frappe Tronçonneuse & Bolter Explosif',
    dodgeType: 'POWER_STOMP',
    stats: {
      hp: '⭐⭐⭐⭐⭐',
      speed: '⭐⭐',
      damage: '⭐⭐⭐⭐⭐',
      range: '⭐⭐'
    },
    desc: 'Pour l\'Empereur ! Armure énergétique ultra-lourde, épée-tronçonneuse dévastatrice et tirs de Bolter destructeurs.'
  }
};
