/**
 * Web Audio Engine for POP Claymorphism Player
 * Synthesizes melodic chords and musical pulses for playback.
 */

class SynthAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isPlaying = false;
  private intervalId: any = null;
  private currentSongId: string | null = null;
  private volume = 0.8;
  private step = 0;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public playSong(songId: string, songColor: string) {
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    this.currentSongId = songId;
    this.isPlaying = true;
    this.stopMelody();

    // Map song characteristics to musical scales
    const scales: Record<string, number[]> = {
      '#00f0ff': [261.63, 329.63, 392.00, 523.25, 659.25], // C Major bright pop
      '#00e5ff': [261.63, 329.63, 392.00, 523.25, 659.25], // C Major cyber pulse
      '#7fe0c4': [293.66, 369.99, 440.00, 587.33, 739.99], // D Major breezy mint
      '#ffd66b': [349.23, 440.00, 523.25, 698.46, 880.00], // F Major sunny bounce
      '#a5b4fc': [220.00, 261.63, 329.63, 440.00, 523.25], // A Minor cozy dream
    };

    const notes = scales[songColor] || [261.63, 329.63, 392.00, 523.25];
    this.step = 0;

    this.intervalId = setInterval(() => {
      if (!this.isPlaying || !this.ctx || !this.masterGain) return;

      const now = this.ctx.currentTime;
      const noteFreq = notes[this.step % notes.length];
      const bassFreq = notes[0] / 2;

      // Play soft melodic chime
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = this.step % 3 === 0 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(noteFreq, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(0.18, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.38);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.4);

      // Play subtle warm bass pulse on beats
      if (this.step % 2 === 0) {
        const bassOsc = this.ctx.createOscillator();
        const bassGain = this.ctx.createGain();
        bassOsc.type = 'sine';
        bassOsc.frequency.setValueAtTime(bassFreq, now);

        bassGain.gain.setValueAtTime(0.001, now);
        bassGain.gain.exponentialRampToValueAtTime(0.15, now + 0.05);
        bassGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

        bassOsc.connect(bassGain);
        bassGain.connect(this.masterGain);
        bassOsc.start(now);
        bassOsc.stop(now + 0.5);
      }

      this.step = (this.step + 1) % 16;
    }, 420);
  }

  public pause() {
    this.isPlaying = false;
    this.stopMelody();
  }

  public resume(songColor = '#00f0ff') {
    if (this.currentSongId) {
      this.playSong(this.currentSongId, songColor);
    }
  }

  private stopMelody() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}

export const audioEngine = new SynthAudioEngine();
