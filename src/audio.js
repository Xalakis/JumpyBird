export class AudioManager {
    constructor() {
        this.sounds = {
            jump: new Audio('jump.mp3'),
            score: new Audio('score.mp3'),
            gameOver: new Audio('gameover.mp3'),
            shieldPop: new Audio('shieldPop.mp3'),
            shieldGain: new Audio('shieldGain.mp3') // NEW: Added shield gain sound
        };
    }

    play(name) {
        const sound = this.sounds[name];
        if (sound) {
            sound.currentTime = 0;
            sound.play().catch(() => console.warn(`Sound "${name}" not found.`));
        }
    }
}