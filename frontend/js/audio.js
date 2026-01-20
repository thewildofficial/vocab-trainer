export class AudioEngine {
    constructor() {
        this.context = null;
        this.enabled = true;
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;
        try {
            this.context = new (window.AudioContext || window.webkitAudioContext)();
            this.initialized = true;
        } catch (e) {
            console.warn('Web Audio API not supported');
        }
    }

    setEnabled(enabled) {
        this.enabled = enabled;
    }

    playTone(freq, type, duration, volume = 0.3) {
        if (!this.enabled || !this.context) return;
        
        if (this.context.state === 'suspended') {
            this.context.resume();
        }

        const osc = this.context.createOscillator();
        const gain = this.context.createGain();
        
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.context.currentTime);
        gain.gain.setValueAtTime(volume, this.context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + duration);
        
        osc.connect(gain);
        gain.connect(this.context.destination);
        
        osc.start(this.context.currentTime);
        osc.stop(this.context.currentTime + duration);
    }

    playCorrect() {
        if (!this.enabled) return;
        this.init();
        this.playTone(523.25, 'sine', 0.1, 0.2);
        setTimeout(() => this.playTone(659.25, 'sine', 0.1, 0.2), 80);
        setTimeout(() => this.playTone(783.99, 'sine', 0.15, 0.25), 160);
    }

    playWrong() {
        if (!this.enabled) return;
        this.init();
        this.playTone(200, 'sawtooth', 0.15, 0.15);
        setTimeout(() => this.playTone(150, 'sawtooth', 0.2, 0.12), 120);
    }

    playClick() {
        if (!this.enabled) return;
        this.init();
        this.playTone(800, 'sine', 0.05, 0.1);
    }

    playStreak(streakCount) {
        if (!this.enabled) return;
        this.init();
        const notes = [523.25, 587.33, 659.25, 783.99, 880];
        const noteCount = Math.min(streakCount, notes.length);
        for (let i = 0; i < noteCount; i++) {
            setTimeout(() => this.playTone(notes[i], 'sine', 0.12, 0.2), i * 70);
        }
    }

    playLevelUp() {
        if (!this.enabled) return;
        this.init();
        const notes = [392, 440, 523.25, 587.33, 659.25, 783.99, 880, 1046.5];
        notes.forEach((freq, i) => {
            setTimeout(() => this.playTone(freq, 'triangle', 0.15, 0.25), i * 60);
        });
    }

    playSessionComplete() {
        if (!this.enabled) return;
        this.init();
        const notes = [523.25, 659.25, 783.99, 1046.5];
        notes.forEach((freq, i) => {
            setTimeout(() => this.playTone(freq, 'sine', 0.2, 0.2), i * 100);
        });
    }

    vibrate(pattern) {
        if (!this.enabled) return;
        if (navigator.vibrate) {
            navigator.vibrate(pattern);
        }
    }

    vibrateCorrect() {
        this.vibrate(50);
    }

    vibrateWrong() {
        this.vibrate([50, 50, 100]);
    }
}

export const Audio = new AudioEngine();
