// Timer functionality
export class GameTimer {
    constructor(options = {}) {
        // Default configuration
        this.totalPhases = options.totalPhases || 8;
        this.phaseDuration = options.phaseDuration || 30; // seconds per phase
        this.totalDuration = this.totalPhases * this.phaseDuration;
        
        // Timer state
        this.currentPhase = 1;
        this.remainingTime = this.phaseDuration;
        this.phaseTimeRemaining = this.phaseDuration;
        this.intervalId = null;
        
        // UI elements
        this.timerElement = document.getElementById('game-timer');
        this.phaseElement = document.getElementById('game-phase') || this.createPhaseElement();
        
        // Callbacks
        this.callbacks = {
            onTimeUp: new Set(),
            onPhaseChange: new Set()
        };
    }    createPhaseElement() {
        // Create phase element if it doesn't exist
        const statusSection = document.querySelector('.game-status .status-grid');
        if (statusSection) {
            const phaseBox = document.createElement('div');
            phaseBox.className = 'phase-box';
            phaseBox.innerHTML = `
                <h3>Current Phase</h3>
                <div class="status-value" id="game-phase">${this.currentPhase} / ${this.totalPhases}</div>
            `;
            
            // Insert after timer box for better visual order
            const timerBox = statusSection.querySelector('.timer-box');
            if (timerBox) {
                timerBox.insertAdjacentElement('afterend', phaseBox);
            } else {
                statusSection.appendChild(phaseBox);
            }
            
            return document.getElementById('game-phase');
        }
        return null;
    }

    start() {
        if (this.intervalId) return;

        this.intervalId = setInterval(() => {
            this.remainingTime--;
            this.phaseTimeRemaining--;
            this.updateDisplay();

            // Check if phase is complete
            if (this.phaseTimeRemaining <= 0) {
                this.advancePhase();
            }

            // Check if game is complete
            if (this.remainingTime <= 0) {
                this.stop();
                this.notifyTimeUp();
            }
        }, 1000);

        this.updateDisplay();
    }

    advancePhase() {
        if (this.currentPhase < this.totalPhases) {
            this.currentPhase++;
            this.phaseTimeRemaining = this.phaseDuration;
            this.notifyPhaseChange();
            this.updateDisplay();
        }
    }

    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    reset() {
        this.currentPhase = 1;
        this.remainingTime = this.totalDuration;
        this.phaseTimeRemaining = this.phaseDuration;
        this.updateDisplay();
    }

    updateDisplay() {
        if (!this.timerElement) return;

        // Update timer display
        const minutes = Math.floor(this.phaseTimeRemaining / 60);
        const seconds = this.phaseTimeRemaining % 60;
        this.timerElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;

        // Update phase display
        if (this.phaseElement) {
            this.phaseElement.textContent = `${this.currentPhase} / ${this.totalPhases}`;
        }

        // Add warning class when phase time is running low
        if (this.phaseTimeRemaining <= 10) { // Last 10 seconds of phase
            this.timerElement.classList.add('warning');
        } else {
            this.timerElement.classList.remove('warning');
        }
    }

    onTimeUp(callback) {
        this.callbacks.onTimeUp.add(callback);
    }

    onPhaseChange(callback) {
        this.callbacks.onPhaseChange.add(callback);
    }

    notifyTimeUp() {
        this.callbacks.onTimeUp.forEach(callback => callback());
    }

    notifyPhaseChange() {
        this.callbacks.onPhaseChange.forEach(callback => 
            callback(this.currentPhase, this.totalPhases));
    }

    // Getter for current phase (1-indexed)
    getCurrentPhase() {
        return this.currentPhase;
    }

    // Getter for phase time remaining
    getPhaseTimeRemaining() {
        return this.phaseTimeRemaining;
    }

    // Getter for total time remaining
    getTotalTimeRemaining() {
        return this.remainingTime;
    }
}

// Create and export a single instance of GameTimer with default settings
export const gameTimer = new GameTimer();
