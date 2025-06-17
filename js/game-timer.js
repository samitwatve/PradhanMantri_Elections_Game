// Timer functionality
import { gameConfig } from "./game-config.js";

export class GameTimer {
  constructor(options = {}) {
    // Use game config for default configuration
    this.totalPhases = options.totalPhases || gameConfig.getTotalPhases();
    this.phaseDuration = options.phaseDuration || gameConfig.getPhaseDuration();
    this.totalDuration = this.totalPhases * this.phaseDuration;

    // Timer state
    this.currentPhase = 1;
    this.remainingTime = this.totalDuration;
    this.phaseTimeRemaining = this.phaseDuration;
    this.intervalId = null;
    this.isRunning = false;

    // UI elements
    this.timerElement = document.getElementById("game-timer");
    this.phaseElement = document.getElementById("game-phase");

    // Callbacks
    this.callbacks = {
      onTimeUp: new Set(),
      onPhaseChange: new Set(),
    };

    // Initialize display when DOM is loaded
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () =>
        this.initializeDisplay(),
      );
    } else {
      this.initializeDisplay();
    }
  }
  initializeDisplay() {
    // Make sure UI elements are available
    this.timerElement = document.getElementById("game-timer");
    this.phaseElement = document.getElementById("game-phase");

    // Set initial display values
    this.updateDisplay();
  }

  start() {
    if (this.intervalId) return;

    this.isRunning = true;
    console.log(
      "Timer started: Phase",
      this.currentPhase,
      "Time remaining:",
      this.remainingTime,
    );

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
      console.log("Phase advanced to:", this.currentPhase);
      this.notifyPhaseChange();
      this.updateDisplay();
    }
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.isRunning = false;
      console.log("Timer stopped");
    }
  }

  pause() {
    if (this.intervalId && this.isRunning) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.isRunning = false;
      console.log("Timer paused");

      // Add paused visual indication
      if (this.timerElement) {
        this.timerElement.classList.add("paused");
      }
    }
  }

  resume() {
    if (!this.isRunning && this.remainingTime > 0) {
      this.start();
      console.log("Timer resumed");

      // Remove paused visual indication
      if (this.timerElement) {
        this.timerElement.classList.remove("paused");
      }
    }
  }

  togglePause() {
    if (this.isRunning) {
      this.pause();
    } else {
      this.resume();
    }
  }
  reset() {
    this.stop();
    this.currentPhase = 1;
    this.remainingTime = this.totalDuration;
    this.phaseTimeRemaining = this.phaseDuration;
    console.log("Timer reset");
    this.updateDisplay();
  }

  updateDisplay() {
    if (!this.timerElement) return;

    // Update timer display
    const minutes = Math.floor(this.phaseTimeRemaining / 60);
    const seconds = this.phaseTimeRemaining % 60;
    this.timerElement.textContent = `${minutes}:${seconds.toString().padStart(2, "0")}`;

    // Update phase display
    if (this.phaseElement) {
      this.phaseElement.textContent = `${this.currentPhase} / ${this.totalPhases}`;
    }

    // Add warning class when phase time is running low
    if (this.phaseTimeRemaining <= 10) {
      // Last 10 seconds of phase
      this.timerElement.classList.add("warning");
    } else {
      this.timerElement.classList.remove("warning");
    }

    // Add subtle animation during active timer
    if (this.isRunning) {
      this.timerElement.classList.add("active");
    } else {
      this.timerElement.classList.remove("active");
    }
  }

  onTimeUp(callback) {
    this.callbacks.onTimeUp.add(callback);
  }

  onPhaseChange(callback) {
    this.callbacks.onPhaseChange.add(callback);
  }
  notifyTimeUp() {
    // Play game over sound
    if (window.soundManager) {
      window.soundManager.playGameOver();
    }

    // Trigger final victory check now that all phases are complete
    this.triggerFinalVictoryCheck();

    this.callbacks.onTimeUp.forEach((callback) => callback());
  }

  // New method to trigger final victory evaluation
  async triggerFinalVictoryCheck() {
    try {
      // Import seat projection and trigger final victory check
      const { seatProjection } = await import("./seat-projection.js");

      // Get current seat counts
      const p1SeatsElement = document.getElementById("player1-seats");
      const p2SeatsElement = document.getElementById("player2-seats");
      const othersSeatsElement = document.getElementById("others-seats");

      const p1Seats = parseInt(p1SeatsElement?.textContent || "0");
      const p2Seats = parseInt(p2SeatsElement?.textContent || "0");
      const othersSeats = parseInt(othersSeatsElement?.textContent || "543");

      console.log("All phases complete - triggering final victory check");
      seatProjection.checkFinalVictoryConditions(p1Seats, p2Seats, othersSeats);
    } catch (error) {
      console.error("Error during final victory check:", error);
    }
  }
  notifyPhaseChange() {
    this.callbacks.onPhaseChange.forEach((callback) =>
      callback(this.currentPhase, this.totalPhases),
    );

    // Play phase reset sound
    if (window.soundManager) {
      window.soundManager.playPhaseReset();
    }

    // Trigger visual phase reset effect
    this.triggerPhaseResetEffect();

    // Log phase change in actions log
    import("./actions-log.js").then(({ actionsLog }) => {
      if (this.currentPhase === 1) {
        actionsLog.log(
          `New Round Started - Bonuses will be calculated`,
          "action",
        );
      } else {
        actionsLog.log(
          `Advanced to Phase ${this.currentPhase} of ${this.totalPhases}`,
          "info",
        );
      }
    });

    // Check for group domination after a short delay
    setTimeout(async () => {
      try {
        const { stateGroups } = await import("./state-groups.js");
        console.log("Checking group domination after phase change");
        await stateGroups.checkAllGroupsDomination();
      } catch (error) {
        console.error("Error checking group domination:", error);
      }
    }, 500);
  } // Getter for current phase (1-indexed)
  getCurrentPhase() {
    return this.currentPhase;
  } // Getter for phase time remaining
  getPhaseTimeRemaining() {
    return this.phaseTimeRemaining;
  }

  // Getter for total time remaining
  getTotalTimeRemaining() {
    return this.remainingTime;
  } // Public methods for external components
  pauseTimer() {
    this.pause();

    // Add visual indication that the game is paused
    document.body.classList.add("game-paused");

    // Show a pause overlay with message
    let pauseOverlay = document.getElementById("game-pause-overlay");
    if (!pauseOverlay) {
      pauseOverlay = document.createElement("div");
      pauseOverlay.id = "game-pause-overlay";

      // Create the pause message element
      const pauseMessage = document.createElement("div");
      pauseMessage.className = "pause-message";
      pauseMessage.innerHTML =
        '<div>GAME PAUSED</div><button id="resume-game-btn" class="resume-button">Resume Game</button>';

      pauseOverlay.appendChild(pauseMessage);
      document.body.appendChild(pauseOverlay);

      // Add click event listener to the resume button
      const resumeBtn = document.getElementById("resume-game-btn");
      resumeBtn.addEventListener("click", () => {
        // Import and call the toggleGameplay function
        import("./game-options.js").then(({ toggleGameplay }) => {
          toggleGameplay();
        });
      });
    } else {
      pauseOverlay.style.display = "flex";
    }
  }

  resumeTimer() {
    this.resume();

    // Remove visual indication that the game is paused
    document.body.classList.remove("game-paused");

    // Hide the pause overlay
    const pauseOverlay = document.getElementById("game-pause-overlay");
    if (pauseOverlay) {
      pauseOverlay.style.display = "none";
    }
  } // Trigger visual phase reset effect
  triggerPhaseResetEffect() {
    // Add effect to phase display
    if (this.phaseElement) {
      this.phaseElement.classList.add("phase-reset-effect");

      // Find the parent timer box for the phase element
      const phaseTimerBox = this.phaseElement.closest(".timer-box");
      if (phaseTimerBox) {
        phaseTimerBox.classList.add("phase-reset-effect");

        // Create particle effect around the phase timer box
        this.createPhaseResetParticles(phaseTimerBox);
      }

      // Remove the effect classes after animation completes
      setTimeout(() => {
        this.phaseElement.classList.remove("phase-reset-effect");
        if (phaseTimerBox) {
          phaseTimerBox.classList.remove("phase-reset-effect");
        }
      }, 1500);
    }

    // Add a subtle effect to the timer element as well
    if (this.timerElement) {
      this.timerElement.classList.add("timer-reset-highlight");

      // Find the parent timer box for the timer element
      const timerTimerBox = this.timerElement.closest(".timer-box");
      if (timerTimerBox) {
        timerTimerBox.classList.add("timer-reset-highlight");
      }

      // Remove the effect classes after animation completes
      setTimeout(() => {
        this.timerElement.classList.remove("timer-reset-highlight");
        if (timerTimerBox) {
          timerTimerBox.classList.remove("timer-reset-highlight");
        }
      }, 1000);
    }
  }

  // Create particle effect for phase reset
  createPhaseResetParticles(container) {
    const particleCount = 8;
    const containerRect = container.getBoundingClientRect();

    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement("div");
      particle.className = "phase-reset-particle";

      // Position particles around the container
      const angle = (i / particleCount) * 2 * Math.PI;
      const radius = 20;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;

      particle.style.left = `50%`;
      particle.style.top = `50%`;
      particle.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px)`;

      container.style.position = "relative";
      container.appendChild(particle);

      // Remove particle after animation
      setTimeout(() => {
        if (particle.parentNode) {
          particle.parentNode.removeChild(particle);
        }
      }, 1200);
    }
  }
}

// Create and export a single instance of GameTimer with default settings
export const gameTimer = new GameTimer();
