/**
 * Web Audio API Procedural Synthesizer for SoulBonker 3D
 * Generates all SFX and background music procedurally in real-time.
 * 100% offline, zero network requests, ultra-light on CPU/battery.
 */

export class AudioManager {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.masterGain = null;
    this.sfxGain = null;
    this.musicGain = null;
    this.isSlowMo = false;

    // Procedural Music State
    this.musicPlaying = false;
    this.nextBeatTime = 0;
    this.beatInterval = 0.45; // ~133 BPM
    this.step = 0;
    this.intensity = 1.0;
  }

  init() {
    if (this.ctx) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();

      // Master output
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // SFX Bus
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(0.85, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      // Music Bus with filter for slowmo
      this.musicFilter = this.ctx.createBiquadFilter();
      this.musicFilter.type = 'lowpass';
      this.musicFilter.frequency.setValueAtTime(20000, this.ctx.currentTime);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(0.35, this.ctx.currentTime);
      
      this.musicGain.connect(this.musicFilter);
      this.musicFilter.connect(this.masterGain);

      this.startBGM();
    } catch (e) {
      console.warn('AudioContext not supported or blocked:', e);
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setSlowMo(active) {
    this.isSlowMo = active;
    if (!this.ctx || !this.musicFilter) return;
    const now = this.ctx.currentTime;
    if (active) {
      this.musicFilter.frequency.setTargetAtTime(600, now, 0.05);
      this.musicGain.gain.setTargetAtTime(0.2, now, 0.05);
    } else {
      this.musicFilter.frequency.setTargetAtTime(20000, now, 0.15);
      this.musicGain.gain.setTargetAtTime(0.35, now, 0.15);
    }
  }

  // --- PROCEDURAL SFX GENERATION ---

  /**
   * The signature "BONK!" sound: punchy hollow acoustic/metallic wooden thud
   */
  playBonk(force = 1.0, isCrit = false) {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    // Base pitch modulation
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    // Resonant bandpass filter for wood/hollow thud resonance
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(isCrit ? 420 : 320, now);
    filter.Q.setValueAtTime(isCrit ? 8 : 5, now);

    const baseFreq = isCrit ? 380 : 260 + (force * 40);
    osc.type = isCrit ? 'triangle' : 'sine';
    osc.frequency.setValueAtTime(baseFreq * 1.5, now);
    osc.frequency.exponentialRampToValueAtTime(50, now + (isCrit ? 0.28 : 0.18));

    gain.gain.setValueAtTime(0.9 * Math.min(force, 1.8), now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + (isCrit ? 0.35 : 0.22));

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.4);

    // Add noise click for sharp crack impact
    this.playNoiseCrack(now, isCrit ? 0.08 : 0.04, isCrit ? 0.6 : 0.35);

    // Extra sub bass for critical mega bonks
    if (isCrit) {
      this.playSubBass(now, 0.3, 0.8);
    }
  }

  playNoiseCrack(startTime, duration, volume) {
    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(800, startTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(startTime);
  }

  playSubBass(startTime, duration = 0.3, volume = 0.5) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(90, startTime);
    osc.frequency.exponentialRampToValueAtTime(25, startTime + duration);

    gain.gain.setValueAtTime(volume, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(startTime);
    osc.stop(startTime + duration + 0.05);
  }

  /**
   * Weapon swing swoosh
   */
  playSwing(isHeavy = false) {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const duration = isHeavy ? 0.35 : 0.2;

    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1);
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.setValueAtTime(3, now);
    filter.frequency.setValueAtTime(isHeavy ? 200 : 350, now);
    filter.frequency.exponentialRampToValueAtTime(isHeavy ? 800 : 1200, now + duration * 0.5);
    filter.frequency.exponentialRampToValueAtTime(isHeavy ? 150 : 200, now + duration);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(isHeavy ? 0.45 : 0.3, now + duration * 0.3);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(now);
  }

  /**
   * PERFECT DODGE chime + bullet-time sonic boom
   */
  playPerfectDodge() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    // Harmonic bell chime 1 (High crystalline)
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(1320, now); // E6
    osc1.frequency.exponentialRampToValueAtTime(1760, now + 0.15); // A6
    gain1.gain.setValueAtTime(0.6, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
    osc1.connect(gain1);
    gain1.connect(this.sfxGain);
    osc1.start(now);
    osc1.stop(now + 0.9);

    // Harmonic bell chime 2
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(2640, now); // E7
    gain2.gain.setValueAtTime(0.35, now);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    osc2.connect(gain2);
    gain2.connect(this.sfxGain);
    osc2.start(now);
    osc2.stop(now + 0.7);

    // Bullet time whoosh warp
    const osc3 = this.ctx.createOscillator();
    const gain3 = this.ctx.createGain();
    osc3.type = 'sawtooth';
    osc3.frequency.setValueAtTime(300, now);
    osc3.frequency.exponentialRampToValueAtTime(40, now + 0.6);
    
    const filter3 = this.ctx.createBiquadFilter();
    filter3.type = 'lowpass';
    filter3.frequency.setValueAtTime(600, now);
    filter3.frequency.exponentialRampToValueAtTime(100, now + 0.6);

    gain3.gain.setValueAtTime(0.4, now);
    gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

    osc3.connect(filter3);
    filter3.connect(gain3);
    gain3.connect(this.sfxGain);
    osc3.start(now);
    osc3.stop(now + 0.75);
  }

  /**
   * Dodge roll wind rustle
   */
  playDodgeRoll() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const duration = 0.25;

    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, now);
    filter.frequency.exponentialRampToValueAtTime(200, now + duration);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(now);
  }

  /**
   * Player damaged sound
   */
  playPlayerHurt() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.25);

    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.3);
  }

  /**
   * Heavy Ground Slam Shockwave
   */
  playGroundSlam() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    this.playSubBass(now, 0.45, 0.9);
    this.playNoiseCrack(now, 0.15, 0.7);
  }

  /**
   * Lightning crackle for Thunder Bonk
   */
  playThunder() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    
    // Quick frequency modulated zap
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(900, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.15);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.2);

    this.playNoiseCrack(now + 0.02, 0.1, 0.4);
  }

  /**
   * Magic projectile shoot / reflect
   */
  playMagicCast(isReflect = false) {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    const startFreq = isReflect ? 300 : 700;
    const endFreq = isReflect ? 1200 : 250;

    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(endFreq, now + 0.25);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.3);
  }

  /**
   * Level up / Wave Clear Fanfare
   */
  playLevelUp() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const notes = [261.63, 329.63, 392.00, 523.25, 659.25]; // C4, E4, G4, C5, E5
    
    notes.forEach((freq, index) => {
      const startTime = now + index * 0.08;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.35, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(startTime);
      osc.stop(startTime + 0.45);
    });
  }

  // --- PROCEDURAL DYNAMIC SYNTH MUSIC ---

  startBGM() {
    this.musicPlaying = true;
    this.nextBeatTime = this.ctx.currentTime + 0.1;
    this.scheduleMusic();
  }

  scheduleMusic() {
    if (!this.musicPlaying || !this.ctx) return;

    const now = this.ctx.currentTime;
    const lookahead = 0.2;

    while (this.nextBeatTime < now + lookahead) {
      this.playMusicStep(this.step, this.nextBeatTime);
      this.step = (this.step + 1) % 16;
      this.nextBeatTime += this.beatInterval;
    }

    requestAnimationFrame(() => this.scheduleMusic());
  }

  playMusicStep(step, time) {
    if (this.isMuted) return;

    // Dark synth bassline notes (D minor progression: D -> F -> C -> Bb)
    const rootNotes = [73.42, 87.31, 65.41, 58.27]; // D2, F2, C2, Bb1
    const currentRoot = rootNotes[Math.floor(step / 4) % 4];

    // Kick drum on 0, 4, 8, 12
    if (step % 4 === 0) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(110, time);
      osc.frequency.exponentialRampToValueAtTime(35, time + 0.12);
      gain.gain.setValueAtTime(0.4, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);
      osc.connect(gain);
      gain.connect(this.musicGain);
      osc.start(time);
      osc.stop(time + 0.18);
    }

    // Hi-hat pulse on every odd step
    if (step % 2 === 1) {
      const buf = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * 0.03), this.ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1);
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      const f = this.ctx.createBiquadFilter();
      f.type = 'highpass';
      f.frequency.setValueAtTime(7000, time);
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.08, time);
      g.gain.exponentialRampToValueAtTime(0.001, time + 0.03);
      src.connect(f);
      f.connect(g);
      g.connect(this.musicGain);
      src.start(time);
    }

    // Arpeggiated bass synth on 16th notes
    const bassOsc = this.ctx.createOscillator();
    const bassGain = this.ctx.createGain();
    bassOsc.type = 'sawtooth';
    
    // Pattern note offset
    const offsets = [1.0, 1.5, 1.2, 2.0];
    const freq = currentRoot * offsets[step % 4];

    bassOsc.frequency.setValueAtTime(freq, time);

    const bassFilter = this.ctx.createBiquadFilter();
    bassFilter.type = 'lowpass';
    bassFilter.frequency.setValueAtTime(450, time);
    bassFilter.frequency.exponentialRampToValueAtTime(150, time + 0.2);

    bassGain.gain.setValueAtTime(0.18, time);
    bassGain.gain.exponentialRampToValueAtTime(0.001, time + 0.22);

    bassOsc.connect(bassFilter);
    bassFilter.connect(bassGain);
    bassGain.connect(this.musicGain);

    bassOsc.start(time);
    bassOsc.stop(time + 0.25);
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.7, this.ctx.currentTime);
    }
    return this.isMuted;
  }
}
