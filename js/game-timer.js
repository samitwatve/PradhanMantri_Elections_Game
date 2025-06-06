// Timer functionality
class GameTimer {
    constructor(duration = 300) { // 5 minutes by default
        this.duration = duration;
        this.remainingTime = duration;
        this.timerElement = document.getElementById('game-timer');
        this.intervalId = null;
        this.callbacks = new Set();
    }

    start() {
        if (this.intervalId) return;

        this.intervalId = setInterval(() => {
            this.remainingTime--;
            this.updateDisplay();

            if (this.remainingTime <= 0) {
                this.stop();
                this.notifyTimeUp();
            }
        }, 1000);

        this.updateDisplay();
    }

    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    reset() {
        this.remainingTime = this.duration;
        this.updateDisplay();
    }

    updateDisplay() {
        if (!this.timerElement) return;

        const minutes = Math.floor(this.remainingTime / 60);
        const seconds = this.remainingTime % 60;
        this.timerElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;

        // Add warning class when time is running low
        if (this.remainingTime <= 60) { // Last minute
            this.timerElement.classList.add('warning');
        }
    }

    onTimeUp(callback) {
        this.callbacks.add(callback);
    }

    notifyTimeUp() {
        this.callbacks.forEach(callback => callback());
    }
}

// Create and export a single instance of GameTimer
export const gameTimer = new GameTimer();
