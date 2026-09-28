// Audio & Speech Utilities for Mindful Experience

class AudioManager {
  constructor() {
    this.ctx = null;
    this.ambientSource = null;
    this.ambientGain = null;
    this.isAmbientPlaying = false;
  }

  initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Play peaceful Tibetan singing bowl chime
  playBowlChime() {
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const baseFreq = 432; // Healing 432 Hz frequency

      // Fundamental and harmonic tones
      const frequencies = [baseFreq, baseFreq * 1.5, baseFreq * 2.02, baseFreq * 2.76];
      const gains = [0.4, 0.25, 0.15, 0.08];

      frequencies.forEach((freq, index) => {
        const osc = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        // Gentle envelope with long soothing decay
        gainNode.gain.setValueAtTime(0.001, now);
        gainNode.gain.exponentialRampToValueAtTime(gains[index], now + 0.08);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 3.8);

        osc.connect(gainNode);
        gainNode.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 4);
      });
    } catch (e) {
      console.warn('Web Audio error:', e);
    }
  }

  // Play distinct sound cues for Breathing phases (Eyes-closed practice)
  playBreathSound(phase) {
    try {
      this.initContext();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      if (phase === 'inhale') {
        // ВДОХ: Мягкий восходящий кристальный звук (расширение)
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc1.type = 'sine';
        osc2.type = 'triangle';

        // Ascending harmonic sweep (330Hz -> 528Hz Solfeggio Love frequency)
        osc1.frequency.setValueAtTime(330, now);
        osc1.frequency.exponentialRampToValueAtTime(528, now + 0.9);

        osc2.frequency.setValueAtTime(495, now);
        osc2.frequency.exponentialRampToValueAtTime(792, now + 0.9);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.28, now + 0.3);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.6);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.ctx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 1.7);
        osc2.stop(now + 1.7);

      } else if (phase === 'hold') {
        // ЗАДЕРЖКА: Чистый тон колокольчика (тишина и концентрация)
        const osc = this.ctx.createOscillator();
        const oscHarmonic = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(659.25, now); // E5
        
        oscHarmonic.type = 'sine';
        oscHarmonic.frequency.setValueAtTime(1318.5, now); // E6

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.22, now + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.8);

        osc.connect(gain);
        oscHarmonic.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        oscHarmonic.start(now);
        osc.stop(now + 1.9);
        oscHarmonic.stop(now + 1.9);

      } else if (phase === 'exhale') {
        // ВЫДОХ: Теплый нисходящий глубокий тон (отпускание и расслабление)
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc1.type = 'sine';
        osc2.type = 'sine';

        // Descending relaxing sweep (432Hz -> 216Hz)
        osc1.frequency.setValueAtTime(432, now);
        osc1.frequency.exponentialRampToValueAtTime(216, now + 1.2);

        osc2.frequency.setValueAtTime(288, now);
        osc2.frequency.exponentialRampToValueAtTime(144, now + 1.2);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.3, now + 0.2);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 2.0);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.ctx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 2.1);
        osc2.stop(now + 2.1);

      } else if (phase === 'pause') {
        // ПАУЗА: Мягкий басовый колокольчик
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(261.63, now); // C4

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.18, now + 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 1.3);
      }
    } catch (e) {
      console.warn('Breath audio error:', e);
    }
  }

  // Play a soft tap/like chime
  playLikeSound() {
    try {
      this.initContext();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.18); // A5

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.2, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.45);
    } catch (e) {
      console.warn('Audio play error:', e);
    }
  }

  // Toggle ambient ocean/meditation generator
  toggleAmbient(enable) {
    try {
      this.initContext();
      if (!this.ctx) return;

      if (!enable) {
        if (this.ambientGain) {
          this.ambientGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 1);
        }
        this.isAmbientPlaying = false;
        return;
      }

      // Generate soft pink/brown noise for ocean surf
      const bufferSize = 2 * this.ctx.sampleRate;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.04;
        b6 = white * 0.115926;
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(400, this.ctx.currentTime);

      this.ambientGain = this.ctx.createGain();
      this.ambientGain.gain.setValueAtTime(0.001, this.ctx.currentTime);
      this.ambientGain.gain.linearRampToValueAtTime(0.15, this.ctx.currentTime + 1.5);

      whiteNoise.connect(filter);
      filter.connect(this.ambientGain);
      this.ambientGain.connect(this.ctx.destination);

      whiteNoise.start();
      this.ambientSource = whiteNoise;
      this.isAmbientPlaying = true;
    } catch (e) {
      console.warn('Ambient error:', e);
    }
  }

  // Text to Speech for Affirmation reading
  speakAffirmation(text, onEnd) {
    if (!('speechSynthesis' in window)) {
      alert('Синтез речи не поддерживается вашим браузером');
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ru-RU';
    utterance.rate = 0.85;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const ruVoice = voices.find(v => v.lang.startsWith('ru') || v.lang.includes('RU'));
    if (ruVoice) {
      utterance.voice = ruVoice;
    }

    if (onEnd) {
      utterance.onend = onEnd;
      utterance.onerror = onEnd;
    }

    window.speechSynthesis.speak(utterance);
  }

  stopSpeech() {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  // Mobile Haptic Feedback
  triggerHaptic(pattern = [20, 30, 20]) {
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch (e) {
        // Ignore
      }
    }
  }
}

export const audioManager = new AudioManager();
