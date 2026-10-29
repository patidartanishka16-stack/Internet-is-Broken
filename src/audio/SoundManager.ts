/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Web Audio API procedural synthesizer for "Internet Is Broken"
 * Provides zero-dependency, zero-404 audio for music, cyber sound effects, and glitches.
 */
export class SoundManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private musicInterval: number | null = null;
  private bassGain: GainNode | null = null;
  private musicVolume: number = 0.22;
  private sfxVolume: number = 0.4;
  private isRunningMusic: boolean = false;
  private step: number = 0;

  constructor() {
    // AudioContext will be initialized on first user interaction
  }

  public init(): void {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (this.isMuted) {
      this.stopMusic();
    } else if (this.isRunningMusic) {
      this.startMusic();
    }
  }

  public toggleMute(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Start dynamic synthwave background music loop
   */
  public startMusic(): void {
    this.isRunningMusic = true;
    if (this.isMuted || !this.ctx) return;
    if (this.musicInterval) return;

    // Cyberpunk synth notes (frequencies in Hz, scale: D Minor Pentatonic / Cyber scale)
    const arpNotes = [
      146.83, // D3
      174.61, // F3
      196.00, // G3
      220.00, // A3
      261.63, // C4
      293.66, // D4
      349.23, // F4
      392.00, // G4
      440.00, // A4
      523.25, // C5
    ];

    const bassNotes = [
      73.42, // D2
      73.42,
      65.41, // C2
      82.41, // E2
      65.41,
      73.42,
    ];

    // 130 BPM = 16th notes every ~115ms
    const intervalMs = 115;
    this.step = 0;

    this.musicInterval = window.setInterval(() => {
      if (!this.ctx || this.isMuted || this.ctx.state !== 'running') return;
      const t = this.ctx.currentTime;

      // Bass pulse on every 4th 16th note (quarter beat)
      if (this.step % 4 === 0) {
        const bassFreq = bassNotes[Math.floor(this.step / 16) % bassNotes.length];
        this.playBassPluck(bassFreq, t);
      }

      // Arpeggio note
      if (this.step % 2 === 0) {
        const noteIdx = (this.step % 8) < 4 ? (this.step % 8) : (8 - (this.step % 8));
        const freq = arpNotes[(noteIdx + Math.floor(this.step / 32)) % arpNotes.length];
        this.playArpNote(freq, t);
      }

      // Hi-hat noise click on off-beats
      if (this.step % 4 === 2) {
        this.playCyberHat(t);
      }

      this.step = (this.step + 1) % 64;
    }, intervalMs);
  }

  public stopMusic(): void {
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
  }

  private playBassPluck(freq: number, startTime: number): void {
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, startTime);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450, startTime);
      filter.frequency.exponentialRampToValueAtTime(80, startTime + 0.25);

      gain.gain.setValueAtTime(this.musicVolume * 0.7, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.28);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.3);
    } catch {
      // Audio fallback guard
    }
  }

  private playArpNote(freq: number, startTime: number): void {
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, startTime);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(freq * 1.5, startTime);
      filter.Q.value = 3.0;

      gain.gain.setValueAtTime(this.musicVolume * 0.3, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.12);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.14);
    } catch {
      // Audio fallback guard
    }
  }

  private playCyberHat(startTime: number): void {
    if (!this.ctx) return;
    try {
      // Procedural white noise burst for cyber hi-hat
      const bufferSize = this.ctx.sampleRate * 0.04;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(7000, startTime);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(this.musicVolume * 0.25, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.04);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start(startTime);
    } catch {
      // Audio fallback guard
    }
  }

  // --- Sound Effects ---

  /**
   * Two-tone urgent beep for "CONNECTION UNSTABLE" warning
   */
  public playWarningBeep(): void {
    if (this.isMuted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      // High beep 1
      this.playTone(880, 'sine', now, 0.12, this.sfxVolume * 0.8);
      // High beep 2
      this.playTone(1174, 'sine', now + 0.14, 0.18, this.sfxVolume * 0.9);
    } catch {
      // Audio fallback guard
    }
  }

  /**
   * Harsh digital glitch / static modem buzz when glitch activates
   */
  public playGlitchTrigger(): void {
    if (this.isMuted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.linearRampToValueAtTime(1200, now + 0.15);
      osc.frequency.setValueAtTime(220, now + 0.2);

      gain.gain.setValueAtTime(this.sfxVolume * 0.7, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.36);
    } catch {
      // Audio fallback guard
    }
  }

  /**
   * Jump jetpack swoosh
   */
  public playJump(): void {
    if (this.isMuted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(620, now + 0.18);

      gain.gain.setValueAtTime(this.sfxVolume * 0.6, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.24);
    } catch {
      // Audio fallback guard
    }
  }

  /**
   * Slide thruster hiss
   */
  public playSlide(): void {
    if (this.isMuted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.25);

      gain.gain.setValueAtTime(this.sfxVolume * 0.5, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.3);
    } catch {
      // Audio fallback guard
    }
  }

  /**
   * Crash collision explosion / impact
   */
  public playCrash(): void {
    if (this.isMuted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      
      // Heavy low boom
      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 0.4);
      oscGain.gain.setValueAtTime(this.sfxVolume * 1.0, now);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc.connect(oscGain);
      oscGain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.46);

      // Noise crackle
      const bufferSize = this.ctx.sampleRate * 0.35;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.35));
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(this.sfxVolume * 0.9, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      noise.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);
      noise.start(now);
    } catch {
      // Audio fallback guard
    }
  }

  /**
   * Data bit collectible chime
   */
  public playCollect(): void {
    if (this.isMuted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      this.playTone(987.77, 'sine', now, 0.08, this.sfxVolume * 0.45);
      this.playTone(1318.51, 'sine', now + 0.07, 0.14, this.sfxVolume * 0.5);
    } catch {
      // Audio fallback guard
    }
  }

  /**
   * Connection restored chime
   */
  public playRestored(): void {
    if (this.isMuted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      this.playTone(523.25, 'triangle', now, 0.1, this.sfxVolume * 0.5);
      this.playTone(659.25, 'triangle', now + 0.09, 0.1, this.sfxVolume * 0.5);
      this.playTone(783.99, 'triangle', now + 0.18, 0.18, this.sfxVolume * 0.6);
    } catch {
      // Audio fallback guard
    }
  }

  /**
   * Victory triumphant synth chord
   */
  public playVictory(): void {
    if (this.isMuted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const chord = [293.66, 369.99, 440.00, 587.33]; // D Major 7th
      chord.forEach((freq, idx) => {
        this.playTone(freq, 'sawtooth', now + idx * 0.05, 1.2, this.sfxVolume * 0.4);
      });
    } catch {
      // Audio fallback guard
    }
  }

  private playTone(freq: number, type: OscillatorType, startTime: number, duration: number, vol: number): void {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);
    gain.gain.setValueAtTime(vol, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.02);
  }

  public dispose(): void {
    this.stopMusic();
    if (this.ctx) {
      this.ctx.close().catch(() => {});
      this.ctx = null;
    }
  }
}

export const soundManager = new SoundManager();
