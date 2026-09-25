/**
 * Adversarial Spoof Attack Simulation and Audio Synthesis
 */

export class SpoofSimulator {
  private synthCtx: AudioContext | null = null;

  private getContext(): AudioContext {
    if (!this.synthCtx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      this.synthCtx = new AudioCtxClass();
    }
    return this.synthCtx;
  }

  /**
   * Generates a synthetic robotic text-to-speech audio sample with flat fundamental frequency
   * and harsh harmonic vocoder buzz to simulate a generative AI deepfake or cheap TTS attack.
   */
  public async playSyntheticTtsAttack(phrase: string): Promise<void> {
    const ctx = this.getContext();
    if (ctx.state === 'suspended') await ctx.resume();

    // Use Web Speech API with pitch manipulation or audio oscillator vocoder
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(phrase);
      utterance.pitch = 0.4; // Unnaturally robotic pitch
      utterance.rate = 0.95;
      utterance.volume = 1.0;

      // Try to find a synthetic-sounding voice or default
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        utterance.voice = voices[0];
      }
      window.speechSynthesis.speak(utterance);
    } else {
      // Audio oscillator robotic buzz fallback
      this.playRoboticTone(150, 2.5);
    }
  }

  /**
   * Simulates a Replay Attack by playing back audio filtered through a narrow
   * phone speaker transfer function (steep cutoff <350Hz and >3800Hz) and room reverberation.
   */
  public playReplayImpulse(): void {
    const ctx = this.getContext();
    if (ctx.state === 'suspended') ctx.resume();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    // Bandpass mimicking cheap phone speaker transducer (400Hz - 3400Hz)
    const bandpass = ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.value = 1800;
    bandpass.Q.value = 1.4;

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(140, ctx.currentTime + 0.8);

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.9);

    osc.connect(bandpass);
    bandpass.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.9);
  }

  /**
   * Generates background cafe / environmental noise to test real-time DSP noise cancellation
   */
  public playBackgroundNoise(durationSeconds = 6): { stop: () => void } {
    const ctx = this.getContext();
    if (ctx.state === 'suspended') ctx.resume();

    const bufferSize = ctx.sampleRate * durationSeconds;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    // Brown noise + restaurant rumble simulation
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = data[i];
      data[i] *= 1.8; // Gain
    }

    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = buffer;

    // Filter to sound like distant traffic / cafe rumble
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 450;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.25, ctx.currentTime);

    noiseSource.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noiseSource.start();

    return {
      stop: () => {
        try {
          noiseSource.stop();
        } catch {
          // ignore if already stopped
        }
      },
    };
  }

  private playRoboticTone(freq: number, duration: number) {
    const ctx = this.getContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'square';
    osc.frequency.value = freq;

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duration);
  }
}

export const spoofSimulator = new SpoofSimulator();
