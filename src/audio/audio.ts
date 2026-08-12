/**
 * Audio engine — every sound is synthesized with WebAudio (zero asset
 * files, instant load). In the native build this module keeps the same
 * API but plays bundled mp3s / runs the haptics pairing.
 */

export interface AudioSettings {
  music: boolean;
  sfx: boolean;
  musicVol: number;
  sfxVol: number;
}

interface ToneOpts {
  f: number;
  f2?: number;
  d?: number;
  type?: OscillatorType;
  v?: number;
  at?: number;
}

const CHORDS: number[][] = [
  [220, 261.63, 329.63, 440],
  [174.61, 220, 261.63, 349.23],
  [261.63, 329.63, 392, 523.25],
  [196, 246.94, 293.66, 392],
];

class AudioEngine {
  private ctx: AudioContext | null = null;
  private sfxG: GainNode | null = null;
  private musicG: GainNode | null = null;
  private musicTimer: number | null = null;
  private chordIdx = 0;
  private cfg: AudioSettings = { music: true, sfx: true, musicVol: 0.55, sfxVol: 0.85 };

  /** Must be called from a user gesture (autoplay policy). */
  unlock(): void {
    if (!this.ctx) {
      try {
        const AC: typeof AudioContext =
          window.AudioContext ??
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        this.ctx = new AC();
        const master = this.ctx.createGain();
        master.connect(this.ctx.destination);
        this.sfxG = this.ctx.createGain();
        this.musicG = this.ctx.createGain();
        this.sfxG.connect(master);
        this.musicG.connect(master);
        this.applyGains();
      } catch {
        this.ctx = null;
        return;
      }
    }
    this.ctx.resume().catch(() => undefined);
    if (this.cfg.music) this.startMusic();
  }

  configure(cfg: Partial<AudioSettings>): void {
    this.cfg = { ...this.cfg, ...cfg };
    this.applyGains();
    if (!this.cfg.music) this.stopMusic();
    else if (this.ctx && this.ctx.state === 'running') this.startMusic();
  }

  private applyGains(): void {
    if (!this.sfxG || !this.musicG) return;
    this.sfxG.gain.value = this.cfg.sfx ? this.cfg.sfxVol : 0;
    this.musicG.gain.value = this.cfg.music ? this.cfg.musicVol * 0.5 : 0;
  }

  private tone({ f, f2, d = 0.12, type = 'sine', v = 0.3, at = 0 }: ToneOpts): void {
    if (!this.ctx || !this.sfxG || !this.cfg.sfx) return;
    try {
      const t0 = this.ctx.currentTime + at;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(Math.max(1, f), t0);
      if (f2) osc.frequency.exponentialRampToValueAtTime(Math.max(1, f2), t0 + d);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(Math.max(0.001, v), t0 + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
      osc.connect(g);
      g.connect(this.sfxG);
      osc.start(t0);
      osc.stop(t0 + d + 0.05);
    } catch {
      /* never let audio break gameplay */
    }
  }

  tap(): void { this.tone({ f: 660, f2: 880, d: 0.06, type: 'triangle', v: 0.2 }); }
  click(): void { this.tone({ f: 520, f2: 640, d: 0.05, type: 'triangle', v: 0.16 }); }
  slide(step = 0): void { this.tone({ f: 330 + step * 18, f2: 520 + step * 18, d: 0.09, v: 0.26 }); }
  invalid(): void {
    this.tone({ f: 150, f2: 110, d: 0.13, type: 'square', v: 0.13 });
    this.tone({ f: 130, f2: 92, d: 0.13, type: 'square', v: 0.11, at: 0.09 });
  }
  hint(): void {
    this.tone({ f: 1046, d: 0.3, v: 0.18 });
    this.tone({ f: 1568, d: 0.45, v: 0.09, at: 0.06 });
  }
  coin(): void {
    this.tone({ f: 988, d: 0.07, type: 'triangle', v: 0.22 });
    this.tone({ f: 1319, d: 0.16, type: 'triangle', v: 0.22, at: 0.07 });
  }
  star(i = 0): void { this.tone({ f: 620 * (1 + i * 0.25), f2: 830 * (1 + i * 0.25), d: 0.22, type: 'triangle', v: 0.26 }); }
  win(): void {
    [523, 659, 784, 1047].forEach((f, i) => this.tone({ f, d: 0.32, type: 'triangle', v: 0.24, at: i * 0.1 }));
    this.tone({ f: 1568, d: 0.6, v: 0.1, at: 0.42 });
  }
  chest(): void {
    this.tone({ f: 120, f2: 60, d: 0.25, v: 0.45 });
    this.tone({ f: 300, f2: 900, d: 0.4, type: 'triangle', v: 0.18, at: 0.18 });
  }
  jingle(): void { [392, 523, 659].forEach((f, i) => this.tone({ f, d: 0.25, type: 'triangle', v: 0.2, at: i * 0.09 })); }

  /* --------------------------- ambient music loop --------------------------- */

  private startMusic(): void {
    if (this.musicTimer !== null || !this.ctx || !this.musicG) return;
    this.playChord();
    this.musicTimer = window.setInterval(() => this.playChord(), 3400);
  }

  private stopMusic(): void {
    if (this.musicTimer !== null) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }

  private playChord(): void {
    if (!this.ctx || !this.musicG || !this.cfg.music) return;
    try {
      const chord = CHORDS[this.chordIdx % CHORDS.length];
      this.chordIdx += 1;
      const t0 = this.ctx.currentTime;
      chord.forEach((f, i) => {
        const osc = this.ctx!.createOscillator();
        const g = this.ctx!.createGain();
        osc.type = 'triangle';
        osc.frequency.value = f;
        osc.detune.value = i % 2 === 0 ? 4 : -4;
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.linearRampToValueAtTime(0.05, t0 + 1.1);
        g.gain.linearRampToValueAtTime(0.0001, t0 + 3.3);
        osc.connect(g);
        g.connect(this.musicG!);
        osc.start(t0);
        osc.stop(t0 + 3.4);
      });
      if (Math.random() < 0.75) {
        const notes = [523.25, 587.33, 659.25, 783.99, 880];
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = notes[Math.floor(Math.random() * notes.length)];
        g.gain.setValueAtTime(0.0001, t0 + 1.4);
        g.gain.exponentialRampToValueAtTime(0.06, t0 + 1.45);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + 2.3);
        osc.connect(g);
        g.connect(this.musicG);
        osc.start(t0 + 1.4);
        osc.stop(t0 + 2.4);
      }
    } catch {
      /* non-fatal */
    }
  }
}

export const audio = new AudioEngine();
