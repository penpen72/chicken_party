class SoundManager {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.enabled = true;
    }

    playTone(freq, type, duration, vol = 0.1) {
        if (!this.enabled) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

        gain.gain.setValueAtTime(vol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    playBuildSound() {
        // High pitched pleasant beep
        this.playTone(600, 'sine', 0.1, 0.1);
        setTimeout(() => this.playTone(800, 'sine', 0.2, 0.1), 50);
    }

    playDeleteSound() {
        // Lower pitch "removal" sound
        this.playTone(300, 'square', 0.1, 0.1);
        setTimeout(() => this.playTone(200, 'square', 0.2, 0.1), 50);
    }

    playErrorSound() {
        // Buzz
        this.playTone(150, 'sawtooth', 0.3, 0.1);
    }

    playCashSound() {
        // Coin-like sound
        this.playTone(1200, 'sine', 0.1, 0.05);
        setTimeout(() => this.playTone(1600, 'sine', 0.3, 0.05), 50);
    }

    playEventSound() {
        // Attention grabber
        this.playTone(400, 'triangle', 0.2, 0.1);
        setTimeout(() => this.playTone(400, 'triangle', 0.4, 0.1), 200);
    }
}
