// Timer functionality
export class GameTimer {
    constructor(options = {}) {
        // Default configuration
        this.totalPhases = options.totalPhases || 8;
        this.phaseDuration = options.phaseDuration || 30; // seconds per phase
        this.totalDuration = this.totalPhases * this.phaseDuration;
        
        // Timer state
        this.currentPhase = 1;
        this.remainingTime = this.totalDuration;
        this.phaseTimeRemaining = this.phaseDuration;
        this.intervalId = null;
        this.isRunning = false;
        
        // UI elements
        this.timerElement = document.getElementById('game-timer');
        this.phaseElement = document.getElementById('game-phase');
        
        // Callbacks
        this.callbacks = {
            onTimeUp: new Set(),
            onPhaseChange: new Set()
        };
        
        // Initialize display when DOM is loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initializeDisplay());
        } else {
            this.initializeDisplay();
        }
    }    initializeDisplay() {
        // Make sure UI elements are available
        this.timerElement = document.getElementById('game-timer');
        this.phaseElement = document.getElementById('game-phase');
        
        // Set initial display values
        this.updateDisplay();
    }

    start() {
        if (this.intervalId) return;
        
        this.isRunning = true;
        console.log('Timer started: Phase', this.currentPhase, 'Time remaining:', this.remainingTime);

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
            console.log('Phase advanced to:', this.currentPhase);
            this.notifyPhaseChange();
            this.updateDisplay();
        }
    }

    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
            this.isRunning = false;
            console.log('Timer stopped');
        }
    }

    pause() {
        if (this.intervalId && this.isRunning) {
            clearInterval(this.intervalId);
            this.intervalId = null;
            this.isRunning = false;
            console.log('Timer paused');
            
            // Add paused visual indication
            if (this.timerElement) {
                this.timerElement.classList.add('paused');
            }
        }
    }
    
    resume() {
        if (!this.isRunning && this.remainingTime > 0) {
            this.start();
            console.log('Timer resumed');
            
            // Remove paused visual indication
            if (this.timerElement) {
                this.timerElement.classList.remove('paused');
            }
        }
    }
    
    togglePause() {
        if (this.isRunning) {
            this.pause();
        } else {
            this.resume();
        }
    }    reset() {
        this.stop();
        this.currentPhase = 1;
        this.remainingTime = this.totalDuration;
        this.phaseTimeRemaining = this.phaseDuration;
        console.log('Timer reset');
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
        
        // Add subtle animation during active timer
        if (this.isRunning) {
            this.timerElement.classList.add('active');
        } else {
            this.timerElement.classList.remove('active');
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
        
        // Check for group domination after a short delay
        setTimeout(async () => {
            try {
                const { stateGroups } = await import('./state-groups.js');
                console.log('Checking group domination after phase change');
                await stateGroups.checkAllGroupsDomination();
            } catch (error) {
                console.error('Error checking group domination:', error);
            }
        }, 500);
    }    // Getter for current phase (1-indexed)
    getCurrentPhase() {
        return this.currentPhase;
    }    // Getter for phase time remaining
    getPhaseTimeRemaining() {
        return this.phaseTimeRemaining;
    }

    // Getter for total time remaining
    getTotalTimeRemaining() {
        return this.remainingTime;
    }

    // Public methods for external components
    pauseTimer() {
        this.pause();
    }

    resumeTimer() {
        this.resume();
    }
}

// Create and export a single instance of GameTimer with default settings
export const gameTimer = new GameTimer();
