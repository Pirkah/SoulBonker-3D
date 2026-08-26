# 🔨 SoulBonker 3D — Guide de Création & Architecture Étape par Étape

Ce document retrace de manière complète, pédagogique et structurée toutes les étapes techniques qui ont permis de concevoir, développer et déployer le jeu **SoulBonker 3D** depuis une page blanche jusqu'à un Action-RPG 3D complet jouable dans le navigateur.

---

## 📑 Table des Matières
1. [Vision & Spécifications du Projet](#1-vision--spécifications-du-projet)
2. [Étape 1 : Moteur Graphique WebGL & Environnement 3D](#étape-1--moteur-graphique-webgl--environnement-3d)
3. [Étape 2 : Physique, Déplacements & Système de Combat "Bonk"](#étape-2--physique-déplacements--système-de-combat-bonk)
4. [Étape 3 : Synthétiseur Audio Procédural (Web Audio API)](#étape-3--synthétiseur-audio-procédural-web-audio-api)
5. [Étape 4 : Système de Classes Héroïques Asymétriques](#étape-4--système-de-classes-héroïques-asymétriques)
6. [Étape 5 : Intelligence Artificielle & Système de Vagues Procédurales](#étape-5--intelligence-artificielle--système-de-vagues-procédurales)
7. [Étape 6 : Multijoueur Temps Réel P2P (WebRTC / PeerJS)](#étape-6--multijoueur-temps-réel-p2p-webrtc--peerjs)
8. [Étape 7 : Pipeline de Modélisation 3D IA & Décimation Blender](#étape-7--pipeline-de-modélisation-3d-ia--décimation-blender)
9. [Étape 8 : Interface Utilisateur (HUD Glassmorphism) & Menu Mods](#étape-8--interface-utilisateur-hud-glassmorphism--menu-mods)
10. [Étape 9 : Déploiement & Optimisations Finales](#étape-9--déploiement--optimisations-finales)

---

## 1. Vision & Spécifications du Projet

*SoulBonker 3D* est né avec une ambition claire :
- **Expérience Joueur** : Un jeu d'action nerveux en 3D vue du dessus (top-down / 3/4 TPS), inspiré de *Dark Souls* et de *Hades*, où chaque coup a un impact satisfaisant ("Bonk !").
- **Accessibilité Universelle** : Zéro installation requise — le jeu tourne directement dans n'importe quel navigateur moderne (PC, Mac, Mobile, Tablette) à 60 FPS constants.
- **Autonomie Zéro Dépendance Lourde** : Pas de moteur externe lourd (Unity/Unreal), tout est codé en **JavaScript ES6 pur** avec la bibliothèque **Three.js** pour le rendu WebGL et l'API **Web Audio** pour les effets sonores synthétisés en temps réel.

---

## Étape 1 : Moteur Graphique WebGL & Environnement 3D

La première étape a consisté à poser les bases du moteur de rendu 3D :

1. **Initialisation de la Scène Three.js (`Engine.js`)** :
   - Création de la scène (`THREE.Scene`), du moteur de rendu WebGL (`THREE.WebGLRenderer`) avec antialiasing et mappage tonal (ACESFilmicToneMapping).
   - Gestion dynamique du redimensionnement de l'écran (`window.onresize`) et du ratio de pixels (DPI) pour une netteté maximale sur écrans Retina/4K.

2. **Éclairage Réaliste & Ombres Douces** :
   - Éclairage directionnel simulant le soleil avec ombres projetées dynamiques (`PCFSoftShadowMap`).
   - Lumière d'ambiance bleutée et lumières ponctuelles d'appoint (pour faire ressortir les reflets métalliques des armures).

3. **L'Arène de Combat** :
   - Conception d'une arène circulaire stylisée avec un sol texturé en grille dynamique et bordures d'enceinte lumineuses.
   - Système de particules ambiantes flottantes (étincelles, poussières magiques).

4. **Caméra TPS Dynamique (`CameraController.js`)** :
   - Caméra fluide avec amorti exponentiel (*lerp*) qui suit le héros en temps réel.
   - Gestion de l'angle de vue, du zoom à la molette et de la rotation orbitale.

---

## Étape 2 : Physique, Déplacements & Système de Combat "Bonk"

Pour donner au jeu son dynamisme et son intensité :

1. **Contrôles Multi-Supports (`InputManager.js`)** :
   - Clavier (ZQSD / WASD / Flèches directionnelles).
   - Souris (Clic gauche = Attaque Légère, Clic droit = Attaque Lourde, Espace = Roulade, Verrouillage Cible = Molette).
   - Joysticks virtuels tactiles sur écran pour les joueurs smartphone / tablette.

2. **Physique & Mouvement (`Player.js`)** :
   - Vélocité, friction et accélération vectorielle.
   - Système de projection par recul (*knockback*) physique appliqué lors des chocs.
   - Gestion de l'endurance (*Stamina*) se rechargeant passivement.

3. **Le Système de Roulade / Dash (i-frames)** :
   - Pendant une esquive, le joueur bénéficie de frames d'invulnérabilité (*i-frames*), lui permettant de traverser les attaques ennemies au bon timing.

4. **Système de Combat "Bonk" & Hitboxes** :
   - **Attaque Légère Rapide** : Combo à cadence élevée pour harceler les ennemis.
   - **Attaque Lourde Sismique** : Frappe puissante chargée générant une onde de choc au sol, projetant et étourdissant les ennemis aux alentours.
   - **Lock-On Automatique (Cible)** : Système d'aim-assist verrouillant la cible la plus proche pour un ciblage précis.

---

## Étape 3 : Synthétiseur Audio Procédural (Web Audio API)

Plutôt que de charger des mégaoctets de fichiers `.mp3` ou `.wav` qui ralentiraient le chargement de la page, nous avons créé un **moteur audio 100% procédural (`AudioManager.js`)** :

- **Le "Bonk !" Mythique** : Synthétisé en combinant une impulsion basse fréquence (onde sinusoïdale 80Hz décroissante) avec un bruit blanc filtré simulant l'impact métallique.
- **Ondes de Choc & Slams** : Oscillateurs graves avec distorsion douce pour ressentir la lourdeur des marteaux.
- **Sorts Magiques & Tirs de Flèches** : Glissandos de fréquences aiguës et résonance arcanique.
- **Alertes de Dégâts & Mort** : Sons d'impact organiques et bruits d'écrasement.

---

## Étape 4 : Système de Classes Héroïques Asymétriques

Pour offrir une grande rejouabilité, un gestionnaire de classes modulaire a été conçu (`ClassManager.js`), proposant **9 héros uniques** avec leurs propres caractéristiques :

1. **Chevalier Paladin** : Titan de mêlée avec armure d'acier, marteau de guerre runique et écrasement sismique.
2. **Faucheuse / Nécromancien** : Maître de la mort en lévitation spectrale avec grande faux et siphon d'âmes.
3. **Archange Céleste** : Guerrier divin avec vol stationnaire, battements d'ailes et frappes d'estoc saintes.
4. **Archer Rôdeur** : Tireur d'élite agile décochant des salves perçantes et pluie de flèches.
5. **Archimage Sorcière** : Incantatrice arcanique projetant des orbes téléguidées et se téléportant par *Blink*.
6. **Voleur de l'Ombre** : Assassin supersonique aux enchaînements de dagues ultra-rapides et coups critiques.
7. **Space Marine** : Guerrier blindé armé d'une épée-tronçonneuse déchiquetant les hordes.
8. **Ork Berserker** : Mastodonte furieux aux haches massives et charge dévastatrice.
9. **Prêtre Sacré** : Protecteur canalisant la foudre divine et des boucliers de lumière.

---

## Étape 5 : Intelligence Artificielle & Système de Vagues Procédurales

Pour créer un défi progressif et immersif (`EnemyTypes.js` & `WaveManager.js`) :

1. **Machine à États Finis (FSM)** :
   Chaque monstre est piloté par un arbre de comportements :
   - `IDLE` : Repérage du joueur.
   - `CHASE` : Poursuite avec évitement d'obstacles et contournement de groupe.
   - `TELEGRAPH` : Préparation de l'attaque avec indicateur visuel au sol (cercle rouge / onde lumineuse).
   - `ATTACK` : Exécution du coup avec déclenchement de la hitbox.
   - `COOLDOWN` / `STAGGER` : Temps de récupération ou étourdissement si frappé violemment.

2. **Diversité du Bestiaire** :
   - **Bonklings** : Gobelins rapides attaquant en meute.
   - **Hammer Brutes** : Colosses armurés provoquant des séismes au sol.
   - **Mages du Néant** : Ennemis à distance tirant des projectiles ténébreux.
   - **Gargouilles & Crapauds Toxiques** : Unités mobiles volantes et cracheurs de poison.

3. **Boss Fights Multi-Phases** :
   - **Professeur Amphi, Démon Suprême, Roi Liche, Golem Titan** disposant de barres de vie titanesques, d'attaques de zone (AoE) et d'invocations de sbires.

---

## Étape 6 : Multijoueur Temps Réel P2P (WebRTC / PeerJS)

Pour permettre le jeu à deux en Duel 1v1 ou Co-op sans avoir besoin d'un serveur dédié coûteux (`NetworkManager.js`) :

- **Architecture Peer-to-Peer** : Connexion directe de navigateur à navigateur via **WebRTC / PeerJS**.
- **Code de Salle Instantané** : Le joueur 1 crée un salon qui génère un code à 5 caractères (ex: `BONK7`). Le joueur 2 entre ce code et rejoint la partie en une seconde.
- **Réplication d'État & Interpolation** : Synchronisation des positions (30 paquets/sec), rotation, états d'attaques, points de vie et animations avec lissage visuel pour masquer la latence.

---

## Étape 7 : Pipeline de Modélisation 3D IA & Décimation Blender

L'un des accomplissements majeurs du projet est le pipeline d'intégration 3D haute qualité :

```
┌─────────────────┐     ┌───────────────────┐     ┌───────────────────┐     ┌──────────────────┐
│  Génération IA  │ ──> │   Déchiffrement   │ ──> │ Décimation & Cut  │ ──> │ Shaders Stylisés │
│   (Meshy.ai)    │     │  Headless (.GLB)  │     │ (Blender Headless)│     │  & Rendu WebGL   │
└─────────────────┘     └───────────────────┘     └───────────────────┘     └──────────────────┘
```

1. **Génération de Haute Précision** : Création de modèles détaillés sur *Meshy.ai*.
2. **Extraction Automatisée** : Script Node/Python inspectant et extrayant le conteneur binaire du modèle (`model.meshy`) pour le reconstituer en fichier `.glb` complet.
3. **Décimation Automatisée dans Blender Headless** :
   - Réduction du maillage originel (300k+ polygones) vers un budget optimisé de **25 000 à 30 000 polygones** via le modificateur `DECIMATE` (ratio `0.015`).
4. **Séparation Morphologique Corps / Arme** :
   - Découpe par filtrage géométrique (bmesh) pour isoler les armes (Marteau, Épée Sainte, Arc, Bâton, Dagues) du corps du personnage.
   - Recalcul du pivot d'attache au niveau de la poignée en main.
5. **Multi-Matériaux & Émissifs Stylisés** :
   - Création de fichiers `.mtl` personnalisés associant reflets métalliques (spécularité haute), cuir brossé, capuches d'ombre et yeux/runes émissives néon.

---

## Étape 8 : Interface Utilisateur (HUD Glassmorphism) & Menu Mods

Pour que le jeu soit agréable à prendre en main :

1. **Interface Moderne en Glassmorphism** :
   - Barre de santé avec animation de tremblement lors des coups subis.
   - Jauge d'endurance dynamique.
   - Boutons tactiles circulaires néon avec retour haptique visuel.
   - Compteur de vagues et d'ennemis restants.

2. **Menu Mods [Touche M]** :
   - Outil de test interactif permettant d'ajuster en temps réel la vitesse de déplacement, les dégâts, d'activer le mode invincibilité (*God Mode*) ou de faire spawner instantanément n'importe quel monstre ou boss.

---

## Étape 9 : Déploiement & Optimisations Finales

1. **Optimisations WebGL** :
   - Mise en cache globale des modèles (`GlobalModelLoader.js`) pour ne charger chaque géométrie 3D qu'une seule fois en mémoire vidéo (VRAM).
   - Recyclage des particules et géométries temporaires pour éliminer les saccades du Garbage Collector.

2. **Déploiement Continu sur GitHub Pages** :
   - Chaque fonctionnalité est versionnée sur `main` puis fusionnée et déployée automatiquement sur la branche `gh-pages`.
   - Le jeu est immédiatement jouable par toute la communauté à l'adresse officielle :  
     👉 **https://pirkah.github.io/SoulBonker-3D/**

---

## 🏆 Résumé de la Stack Technique

| Domaine | Technologie Utilisée | Rôle |
|---|---|---|
| **Moteur 3D** | `Three.js (WebGL)` | Rendu graphique 3D, éclairage dynamique, ombres et caméras |
| **Langage** | `JavaScript ES6 (Modules)` | Architecture modulaire orientée objet (sans framework lourd) |
| **Audio** | `Web Audio API` | Moteur audio procédural générant 100% des sons en temps réel |
| **Réseau** | `WebRTC / PeerJS` | Multijoueur P2P à très faible latence pour duels 1v1 |
| **Pipeline 3D** | `Blender Headless + Meshy.ai` | Décimation, découpe des armes et multi-matériaux |
| **Hébergement** | `GitHub Pages` | Déploiement statique ultra rapide et sécurisé |
