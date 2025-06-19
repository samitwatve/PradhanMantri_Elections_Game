// Game Configuration
// Centralized configuration for game settings and debug mode

class GameConfig {
  constructor() {
    this.debugMode = false;
    this.init();
  }

  init() {
    // Default game settings
    this.settings = {
      // Timer settings
      totalPhases: 10,
      phaseDuration: 30, // seconds per phase

      // Player starting funds (in millions)
      player1StartingFunds: 300,
      player2StartingFunds: 300,

      // Player funds refresh per phase
      player1RefreshFunds: 300,
      player2RefreshFunds: 300,

      // Rally settings
      maxRallyTokens: 2,

      // AI settings
      aiEnabled: true,
      aiTurnInterval: 2000, // milliseconds between AI actions
      aiDifficulty: "EASY", // 'EASY', 'MEDIUM', 'HARD'

      // Debug settings
      debug: {
        totalPhases: 4,
        player1StartingFunds: 50000,
        player2StartingFunds: 0,
        player1RefreshFunds: 0,
        player2RefreshFunds: 0,
        aiEnabled: false,
        oneClickMaxPopularity: true,
      },
    };

    // Set up keyboard listener for debug mode toggle
    this.setupDebugKeyListener();
  }
  setupDebugKeyListener() {
    const addListener = () => {
      document.addEventListener("keydown", (event) => {
        // Check for Ctrl + Shift + D
        if (
          event.ctrlKey &&
          event.shiftKey &&
          event.key.toLowerCase() === "d"
        ) {
          event.preventDefault();
          this.toggleDebugMode();
        }
      });
    };

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", addListener);
    } else {
      addListener();
    }
  }
  toggleDebugMode() {
    this.debugMode = !this.debugMode;

    console.log(`Debug mode toggled: ${this.debugMode ? "ON" : "OFF"}`);
    console.log("Current debug settings:", this.settings.debug);

    // Show debug mode status
    const statusDiv = this.getOrCreateDebugStatusDiv();
    if (statusDiv) {
      statusDiv.textContent = `Debug Mode: ${this.debugMode ? "ON" : "OFF"}`;
      statusDiv.className = `debug-status ${this.debugMode ? "debug-on" : "debug-off"}`;

      // Auto-hide status after 3 seconds
      setTimeout(() => {
        if (statusDiv.parentNode) {
          statusDiv.style.opacity = "0";
          setTimeout(() => {
            if (statusDiv.parentNode) {
              statusDiv.parentNode.removeChild(statusDiv);
            }
          }, 500);
        }
      }, 3000);
    }

    // Apply debug settings immediately
    this.applyDebugSettings();

    console.log(`Debug mode ${this.debugMode ? "enabled" : "disabled"}`);
  }
  getOrCreateDebugStatusDiv() {
    if (!document.body) {
      console.warn("Document body not ready for debug status display");
      return null;
    }

    let statusDiv = document.getElementById("debug-status");
    if (!statusDiv) {
      statusDiv = document.createElement("div");
      statusDiv.id = "debug-status";
      statusDiv.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                padding: 10px 20px;
                border-radius: 5px;
                font-family: 'Segoe UI', sans-serif;
                font-weight: bold;
                font-size: 14px;
                color: white;
                transition: opacity 0.5s;
                box-shadow: 0 2px 10px rgba(0,0,0,0.3);
            `;
      document.body.appendChild(statusDiv);
    }

    // Set colors based on debug state
    if (this.debugMode) {
      statusDiv.style.backgroundColor = "#4CAF50";
      statusDiv.style.border = "2px solid #45a049";
    } else {
      statusDiv.style.backgroundColor = "#f44336";
      statusDiv.style.border = "2px solid #da190b";
    }

    return statusDiv;
  }

  applyDebugSettings() {
    if (this.debugMode) {
      // Apply debug settings
      this.applyDebugFunds();
      this.applyDebugAI();
      this.applyDebugTimer();
      this.setupDebugMapController();
    } else {
      // Restore normal settings
      this.restoreNormalSettings();
    }
  }

  applyDebugFunds() {
    // Update player funds
    if (window.player1) {
      window.player1.funds = this.settings.debug.player1StartingFunds;
      window.player1.updateDisplay();
    }

    if (window.player2) {
      window.player2.funds = this.settings.debug.player2StartingFunds;
      window.player2.updateDisplay();
    }
  }

  applyDebugAI() {
    // Disable AI if in debug mode
    if (window.aiPlayerController) {
      if (this.debugMode && this.settings.debug.aiEnabled === false) {
        window.aiPlayerController.pauseAI();
      } else if (!this.debugMode) {
        window.aiPlayerController.resumeAI();
      }
    }
  }
  applyDebugTimer() {
    // Update timer phases if needed
    if (window.gameTimer && this.debugMode) {
      console.log(
        `Debug mode: Updating timer from ${window.gameTimer.totalPhases} to ${this.settings.debug.totalPhases} phases`,
      );

      // Store old values for debugging
      const oldTotalPhases = window.gameTimer.totalPhases;
      const oldCurrentPhase = window.gameTimer.currentPhase;

      // Update timer properties
      window.gameTimer.totalPhases = this.settings.debug.totalPhases;
      window.gameTimer.totalDuration =
        window.gameTimer.totalPhases * window.gameTimer.phaseDuration;

      // If we're in the middle of the game, adjust remaining time proportionally
      const currentPhaseProgress =
        1 -
        window.gameTimer.phaseTimeRemaining / window.gameTimer.phaseDuration;
      const newPhaseNumber = Math.min(
        window.gameTimer.currentPhase,
        this.settings.debug.totalPhases,
      );

      // Recalculate remaining time based on new total phases
      const remainingPhases = this.settings.debug.totalPhases - newPhaseNumber;
      const remainingTimeInCurrentPhase =
        window.gameTimer.phaseDuration * (1 - currentPhaseProgress);
      window.gameTimer.remainingTime =
        remainingPhases * window.gameTimer.phaseDuration +
        remainingTimeInCurrentPhase;

      // Update display
      window.gameTimer.updateDisplay();

      console.log(`Timer debug update complete:`);
      console.log(
        `- Old total phases: ${oldTotalPhases}, New total phases: ${window.gameTimer.totalPhases}`,
      );
      console.log(
        `- Current phase: ${window.gameTimer.currentPhase}/${window.gameTimer.totalPhases}`,
      );
      console.log(`- Remaining time: ${window.gameTimer.remainingTime}s`);
    } else if (!window.gameTimer) {
      console.log("Debug mode: gameTimer not available yet");
    }
  }
  setupDebugMapController() {
    // The map controller already checks gameConfig.isDebugMode() and gameConfig.isOneClickMaxPopularity()
    // in its handleStateClick method, so we don't need to override anything here.
    // Just log that debug mode is active for map interactions
    if (this.debugMode && this.settings.debug.oneClickMaxPopularity) {
      console.log(
        "Debug mode: One-click max popularity enabled for map interactions",
      );
    } else {
      console.log("Debug mode: Normal map interactions restored");
    }
  }

  enableOneClickMaxPopularity() {
    // This method is no longer needed since map controller handles debug mode internally
    console.log("Debug: One-click max popularity is handled by map controller");
  }

  disableOneClickMaxPopularity() {
    // This method is no longer needed since map controller handles debug mode internally
    console.log("Debug: Normal click behavior restored");
  }
  restoreNormalSettings() {
    // Restore normal funds
    if (window.player1) {
      window.player1.funds = this.settings.player1StartingFunds;
      window.player1.updateDisplay();
    }

    if (window.player2) {
      window.player2.funds = this.settings.player2StartingFunds;
      window.player2.updateDisplay();
    }

    // Re-enable AI
    if (window.aiPlayerController) {
      window.aiPlayerController.resumeAI();
    }

    // Restore normal timer settings
    if (window.gameTimer) {
      console.log(
        `Restoring normal timer: ${this.settings.totalPhases} phases`,
      );

      window.gameTimer.totalPhases = this.settings.totalPhases;
      window.gameTimer.totalDuration =
        window.gameTimer.totalPhases * window.gameTimer.phaseDuration;

      // Recalculate remaining time
      const currentPhaseProgress =
        1 -
        window.gameTimer.phaseTimeRemaining / window.gameTimer.phaseDuration;
      const remainingPhases =
        this.settings.totalPhases - window.gameTimer.currentPhase;
      const remainingTimeInCurrentPhase =
        window.gameTimer.phaseDuration * (1 - currentPhaseProgress);
      window.gameTimer.remainingTime =
        remainingPhases * window.gameTimer.phaseDuration +
        remainingTimeInCurrentPhase;

      window.gameTimer.updateDisplay();
    }
  }

  // Getter methods for other modules to use
  getTotalPhases() {
    return this.debugMode
      ? this.settings.debug.totalPhases
      : this.settings.totalPhases;
  }

  getPhaseDuration() {
    return this.settings.phaseDuration; // Same for both modes
  }

  getPlayer1StartingFunds() {
    return this.debugMode
      ? this.settings.debug.player1StartingFunds
      : this.settings.player1StartingFunds;
  }

  getPlayer2StartingFunds() {
    return this.debugMode
      ? this.settings.debug.player2StartingFunds
      : this.settings.player2StartingFunds;
  }

  getPlayer1RefreshFunds() {
    return this.debugMode
      ? this.settings.debug.player1RefreshFunds
      : this.settings.player1RefreshFunds;
  }

  getPlayer2RefreshFunds() {
    return this.debugMode
      ? this.settings.debug.player2RefreshFunds
      : this.settings.player2RefreshFunds;
  }

  isAIEnabled() {
    return this.debugMode
      ? this.settings.debug.aiEnabled
      : this.settings.aiEnabled;
  }

  getAITurnInterval() {
    return this.settings.aiTurnInterval;
  }

  isDebugMode() {
    return this.debugMode;
  }

  isOneClickMaxPopularity() {
    return this.debugMode && this.settings.debug.oneClickMaxPopularity;
  }

  getAIDifficulty() {
    return this.settings.aiDifficulty;
  }
  setAIDifficulty(difficulty) {
    if (["EASY", "MEDIUM", "HARD"].includes(difficulty)) {
      this.settings.aiDifficulty = difficulty;
      console.log(`AI difficulty set to: ${difficulty}`);

      // Update turn interval for HARD difficulty
      if (difficulty === "HARD") {
        this.settings.aiTurnInterval = 1500; // 1.5 seconds
      } else {
        this.settings.aiTurnInterval = 2000; // 2 seconds
      }

      // Notify any listeners
      window.dispatchEvent(
        new CustomEvent("aiDifficultyChanged", {
          detail: { difficulty: difficulty },
        }),
      );

      return true;
    }
    return false;
  }
}

// Create global instance
export const gameConfig = new GameConfig();

// Make it available globally for other modules
window.gameConfig = gameConfig;
