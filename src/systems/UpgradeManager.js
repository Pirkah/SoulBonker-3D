/**
 * Rogue-Lite Upgrade Perk Deck for SoulBonker 3D
 */

export class UpgradeManager {
  constructor() {
    this.deck = [
      {
        id: 'DIPLOME_HONNEUR',
        name: '🎓 Diplôme Major de Promo',
        rarity: 'legendary',
        description: 'Dégâts +45% et les Esquives Parfaites soignent +20 PV !',
        icon: '🎓',
        apply: (player) => {
          player.baseDamage = Math.floor(player.baseDamage * 1.45);
          player.healOnPerfectDodge = 20;
        }
      },
      {
        id: 'CAFE_CROUS',
        name: '☕ Café Machine 20 Centimes',
        rarity: 'common',
        description: 'Vitesse de déplacement +30% et Régénération d\'Endurance +60% !',
        icon: '☕',
        apply: (player) => {
          player.moveSpeed *= 1.3;
          player.staminaRegenRate *= 1.6;
        }
      },
      {
        id: 'STYLO_4_COULEURS',
        name: '🖊️ Stylo 4 Couleurs Maudit',
        rarity: 'epic',
        description: 'Chaque coup critique déclenche une onde de choc explosive 360°.',
        icon: '🖊️',
        apply: (player) => {
          player.critChance += 0.35;
          player.critExplosion = true;
        }
      },
      {
        id: 'THUNDER_BONK',
        name: '⚡ Éclair en Chaîne',
        rarity: 'epic',
        description: 'Chaque coup déclenche des éclairs en chaîne vers 3 ennemis proches.',
        icon: '⚡',
        apply: (player) => {
          player.thunderChain = (player.thunderChain || 0) + 3;
        }
      },
      {
        id: 'COLOSSAL_CLUB',
        name: '🔨 Masse Colossale',
        rarity: 'rare',
        description: 'Taille et portée de l\'arme +40%, dégâts de base +25%.',
        icon: '🔨',
        apply: (player) => {
          player.weapon.setScale(player.weapon.rangeMultiplier * 1.4);
          player.baseDamage = Math.floor(player.baseDamage * 1.25);
        }
      },
      {
        id: 'ADRENALINE_OVERDRIVE',
        name: '⏱️ Adrénaline Suprême',
        rarity: 'legendary',
        description: 'Esquive Parfaite : Endurance infinie et +50% Vitesse d\'attaque pendant 3.5s !',
        icon: '⚡',
        apply: (player) => {
          player.perfectDodgeBuffMultiplier = 1.5;
        }
      },
      {
        id: 'VAMPIRIC_BONK',
        name: '🩸 Bonk Vampirique',
        rarity: 'rare',
        description: '25% de chance de restaurer +8 PV à chaque coup porté.',
        icon: '🩸',
        apply: (player) => {
          player.vampirism = (player.vampirism || 0) + 0.25;
        }
      },
      {
        id: 'GHOST_DASH',
        name: '👻 Dash Fantôme',
        rarity: 'epic',
        description: 'L\'esquive traverse les ennemis et leur inflige 25 dégâts tranchants.',
        icon: '👻',
        apply: (player) => {
          player.ghostDash = true;
        }
      },
      {
        id: 'KINETIC_LAUNCHER',
        name: '💥 Propulsion Megabonk',
        rarity: 'rare',
        description: 'Force de projection +60% et dégâts de collision contre les piliers augmentés.',
        icon: '💥',
        apply: (player) => {
          player.knockbackBonus = (player.knockbackBonus || 1.0) * 1.6;
        }
      },
      {
        id: 'TITAN_HEALTH',
        name: '❤️ Vitalité de Titan',
        rarity: 'common',
        description: 'Santé Max +40 PV et soin complet instantané.',
        icon: '❤️',
        apply: (player) => {
          player.maxHp += 40;
          player.hp = player.maxHp;
        }
      },
      {
        id: 'STAMINA_VESSEL',
        name: '🟢 Souffle Infatigable',
        rarity: 'common',
        description: 'Endurance Max +35 et régénération d\'endurance accélérée de 40%.',
        icon: '🟢',
        apply: (player) => {
          player.maxStamina += 35;
          player.stamina = player.maxStamina;
          player.staminaRegenRate *= 1.4;
        }
      },
      {
        id: 'SWIFT_STRIKES',
        name: '⚔️ Frappes Éclair',
        rarity: 'common',
        description: 'Vitesse d\'attaque augmentée de +30%.',
        icon: '⚔️',
        apply: (player) => {
          player.attackSpeed *= 1.3;
        }
      },
      {
        id: 'CRITICAL_MASTERY',
        name: '🎯 Maîtrise Critique',
        rarity: 'common',
        description: 'Chances de coup critique +25% et dégâts critiques +50%.',
        icon: '🎯',
        apply: (player) => {
          player.critChance += 0.25;
          player.critMultiplier += 0.5;
        }
      }
    ];

    this.selectedPerks = [];
  }

  getRandomChoices(count = 3) {
    const shuffled = [...this.deck].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  applyPerk(perk, player) {
    if (perk && perk.apply) {
      perk.apply(player);
      this.selectedPerks.push(perk);
    }
  }
}
