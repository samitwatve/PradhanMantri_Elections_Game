// Game Options Controller

// Track the state of each option
const gameOptions = {
  randomEvents: true,
  sound: true, // Sound ON by default
  music: true, // Music ON by default
  gameplay: true, // true = playing, false = paused
  help: false,
};

// Check if game is paused - utility function for other modules
function isGamePaused() {
  return !gameOptions.gameplay;
}

// Cache DOM elements
let randomEventsButton;
let soundButton;
let musicButton;
let gameplayButton;
let helpButton;
let aiDifficultyDisplay;

// Audio elements for later implementation
let backgroundMusic;
let soundEffects = {};

document.addEventListener("DOMContentLoaded", () => {  // Initialize DOM elements
  randomEventsButton = document.getElementById("random-events-toggle");
  soundButton = document.getElementById("sound-toggle");
  musicButton = document.getElementById("music-toggle");
  gameplayButton = document.getElementById("gameplay-toggle");
  helpButton = document.getElementById("help-toggle");
  aiDifficultyDisplay = document.getElementById("ai-difficulty-display");

  // Set up event listeners
  if (randomEventsButton) {
    randomEventsButton.addEventListener("click", toggleRandomEvents);
  }

  if (soundButton) {
    soundButton.addEventListener("click", toggleSound);
  }

  if (musicButton) {
    musicButton.addEventListener("click", toggleMusic);
  }

  if (gameplayButton) {
    gameplayButton.addEventListener("click", toggleGameplay);
  }

  if (helpButton) {
    helpButton.addEventListener("click", toggleHelp);
  }
  // Add new game button listener
  const newGameButton = document.getElementById("new-game-button");
  if (newGameButton) {
    newGameButton.addEventListener("click", startNewGame);
  }
  // Set up AI difficulty display
  if (aiDifficultyDisplay) {
    aiDifficultyDisplay.addEventListener("click", showAIDifficultyInfo);
    updateAIDifficultyDisplay();
  }

  // Initialize states based on stored preferences (future enhancement)
  // For now, just sync the UI with default values
  updateButtonStates();
  
  // Update AI difficulty display after a short delay to ensure game config is loaded
  setTimeout(() => {
    updateAIDifficultyDisplay();
  }, 500);

  // Add debug options
  addDebugOptions();

  // Set up keyboard shortcuts for play/pause (Space bar), sound (S), and music (M)
  document.addEventListener("keydown", (event) => {
    // Only process when not in an input field
    if (
      event.target.tagName !== "INPUT" &&
      event.target.tagName !== "TEXTAREA"
    ) {
      if (event.code === "Space") {
        event.preventDefault(); // Prevent scrolling the page
        toggleGameplay();
      } else if (event.key === "s" || event.key === "S") {
        event.preventDefault();
        toggleSound();
      } else if (event.key === "m" || event.key === "M") {
        event.preventDefault();
        toggleMusic();
      }
    }
  });
});

// Toggle functions
function toggleRandomEvents() {
  gameOptions.randomEvents = !gameOptions.randomEvents;
  updateButtonStates();
  // Additional functionality to actually enable/disable random events
  console.log(
    `Random events are now ${gameOptions.randomEvents ? "enabled" : "disabled"}`,
  );
}

function toggleSound() {
  gameOptions.sound = !gameOptions.sound;
  updateButtonStates();

  // If sound is disabled and any sounds are playing, stop them
  if (!gameOptions.sound && window.soundManager) {
    window.soundManager.stopAllSounds();
  }

  console.log(
    `Sound effects are now ${gameOptions.sound ? "enabled" : "disabled"}`,
  );
}

function toggleMusic() {
  gameOptions.music = !gameOptions.music;
  updateButtonStates();

  // Control background music through sound manager
  if (window.soundManager) {
    if (gameOptions.music) {
      window.soundManager.startBackgroundMusic();
    } else {
      window.soundManager.stopBackgroundMusic();
    }
  }

  console.log(`Music is now ${gameOptions.music ? "playing" : "stopped"}`);
}

function toggleGameplay() {
  gameOptions.gameplay = !gameOptions.gameplay;
  updateButtonStates();

  // Integration with game timer
  if (window.gameTimer) {
    if (gameOptions.gameplay) {
      window.gameTimer.resumeTimer();
    } else {
      window.gameTimer.pauseTimer();
    }
  } else {
    // Fallback if gameTimer not initialized yet
    if (gameOptions.gameplay) {
      document.body.classList.remove("game-paused");
      const pauseOverlay = document.getElementById("game-pause-overlay");
      if (pauseOverlay) pauseOverlay.style.display = "none";
    } else {
      document.body.classList.add("game-paused");
      showPauseOverlay();
    }
  }

  // Pause or resume AI player
  import("./ai-player-controller.js").then(({ aiPlayerController }) => {
    if (gameOptions.gameplay) {
      aiPlayerController.resumeAI();
    } else {
      aiPlayerController.pauseAI();
    }
  });

  // Log the action in the actions log
  import("./actions-log.js").then(({ actionsLog }) => {
    if (gameOptions.gameplay) {
      actionsLog.log("Game resumed", "info");
    } else {
      actionsLog.log("Game paused", "info");
    }
  });

  console.log(`Game is now ${gameOptions.gameplay ? "playing" : "paused"}`);
}

// Helper function to create and show pause overlay
function showPauseOverlay() {
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
      toggleGameplay();
    });
  } else {
    pauseOverlay.style.display = "flex";
  }
}

function toggleHelp() {
  gameOptions.help = !gameOptions.help;
  updateButtonStates();

  const helpOverlay = document.getElementById("help-overlay");
  if (helpOverlay) {
    if (gameOptions.help) {
      showHelpOverlay();
    } else {
      hideHelpOverlay();
    }
  }

  console.log(`Help is now ${gameOptions.help ? "shown" : "hidden"}`);
}

// Function to show help overlay
function showHelpOverlay() {
  const helpOverlay = document.getElementById("help-overlay");
  if (helpOverlay) {
    helpOverlay.style.display = "flex";
    // Small delay to ensure display is set before adding show class
    setTimeout(() => {
      helpOverlay.classList.add("show");
    }, 10);

    // Set up help tab functionality
    initializeHelpTabs();

    // Set up close button
    const closeButton = document.getElementById("close-help");
    if (closeButton) {
      closeButton.addEventListener("click", () => {
        toggleHelp();
      });
    }

    // Close on escape key
    const escapeHandler = (event) => {
      if (event.key === "Escape") {
        toggleHelp();
        document.removeEventListener("keydown", escapeHandler);
      }
    };
    document.addEventListener("keydown", escapeHandler);

    // Close on overlay click (but not container click)
    helpOverlay.addEventListener("click", (event) => {
      if (event.target === helpOverlay) {
        toggleHelp();
      }
    });
  }
}

// Function to hide help overlay
function hideHelpOverlay() {
  const helpOverlay = document.getElementById("help-overlay");
  if (helpOverlay) {
    helpOverlay.classList.remove("show");
    // Wait for animation to complete before hiding
    setTimeout(() => {
      helpOverlay.style.display = "none";
    }, 300);
  }
}

// Function to initialize help tab functionality
function initializeHelpTabs() {
  const helpTabs = document.querySelectorAll(".help-tab");
  const helpSections = document.querySelectorAll(".help-section");

  helpTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const targetTab = tab.getAttribute("data-tab");

      // Remove active class from all tabs and sections
      helpTabs.forEach((t) => t.classList.remove("active"));
      helpSections.forEach((s) => s.classList.remove("active"));

      // Add active class to clicked tab and corresponding section
      tab.classList.add("active");
      const targetSection = document.getElementById(`help-${targetTab}`);
      if (targetSection) {
        targetSection.classList.add("active");
      }
    });
  });
}

// Update the UI based on current states
function updateButtonStates() {
  // Update Random Events button
  if (randomEventsButton) {
    randomEventsButton.setAttribute(
      "data-state",
      gameOptions.randomEvents ? "on" : "off",
    );
    randomEventsButton.querySelector(".option-icon").className =
      `option-icon fas ${gameOptions.randomEvents ? "fa-dice" : "fa-dice-d6"}`;
  }

  // Update Sound button
  if (soundButton) {
    soundButton.setAttribute("data-state", gameOptions.sound ? "on" : "off");
    soundButton.querySelector(".option-icon").className =
      `option-icon fas ${gameOptions.sound ? "fa-volume-high" : "fa-volume-xmark"}`;
  }

  // Update Music button
  if (musicButton) {
    musicButton.setAttribute("data-state", gameOptions.music ? "on" : "off");
    // No icon change needed for music
  }
  // Update Gameplay button
  if (gameplayButton) {
    gameplayButton.setAttribute(
      "data-state",
      gameOptions.gameplay ? "on" : "off",
    );
    // Show pause icon when game is playing, play icon when game is paused
    gameplayButton.querySelector(".option-icon").className =
      `option-icon fas ${gameOptions.gameplay ? "fa-pause" : "fa-play"}`;
    // Update the label text based on state
    gameplayButton.querySelector(".option-label").textContent =
      gameOptions.gameplay ? "Pause" : "Play";
  }

  // Update Help button
  if (helpButton) {
    helpButton.setAttribute("data-state", gameOptions.help ? "on" : "off");
    // No icon change needed for help
  }
}

// Update AI difficulty display
function updateAIDifficultyDisplay() {
  if (!aiDifficultyDisplay) return;
  
  // Import game config dynamically to avoid circular dependencies
  import("./game-config.js").then(({ gameConfig }) => {
    const difficulty = gameConfig.getAIDifficulty();
    const difficultyLabel = document.getElementById("ai-difficulty-label");
    
    if (difficultyLabel) {
      // Capitalize first letter and make rest lowercase
      const displayText = difficulty.charAt(0).toUpperCase() + difficulty.slice(1).toLowerCase();
      difficultyLabel.textContent = displayText;
      
      // Update tooltip to show more detail
      const descriptions = {
        'EASY': 'AI makes moves slowly and randomly',
        'MEDIUM': 'AI makes strategic moves at moderate speed',
        'HARD': 'AI makes quick strategic moves and aggressive plays'
      };
      
      aiDifficultyDisplay.setAttribute('data-tooltip', `AI Difficulty: ${displayText} - ${descriptions[difficulty] || 'Current AI difficulty level'}`);
    }
  }).catch(error => {
    console.error("Error loading game config for AI difficulty:", error);
  });
}

// Show AI difficulty information when clicked
function showAIDifficultyInfo() {
  import("./game-config.js").then(({ gameConfig }) => {
    const difficulty = gameConfig.getAIDifficulty();
    const descriptions = {
      'EASY': 'AI makes moves slowly and randomly, giving you more time to strategize.',
      'MEDIUM': 'AI makes strategic moves at moderate speed with some planning.',
      'HARD': 'AI makes quick strategic moves with aggressive campaign tactics.'
    };
    
    const displayText = difficulty.charAt(0).toUpperCase() + difficulty.slice(1).toLowerCase();
    const description = descriptions[difficulty] || 'Current AI difficulty level';
    
    // Show an alert with AI difficulty info
    alert(`Current AI Difficulty: ${displayText}\n\n${description}\n\nThis setting was selected in the welcome screen and affects how the AI opponent plays throughout the game.`);
  }).catch(error => {
    console.error("Error showing AI difficulty info:", error);
    alert("Unable to retrieve AI difficulty information.");
  });
}

// Listen for AI difficulty changes from other parts of the game
window.addEventListener("aiDifficultyChanged", () => {
  updateAIDifficultyDisplay();
});

// Add a debug button for checking group domination
function addDebugOptions() {
  // Only add in development environment
  if (
    window.location.hostname !== "localhost" &&
    window.location.hostname !== "127.0.0.1"
  ) {
    console.log("Debug options only available in development environment");
    return;
  }

  // Create debug section
  const debugSection = document.createElement("div");
  debugSection.className = "debug-section";
  debugSection.innerHTML = `
        <h3>Debug Tools</h3>
        <button id="check-domination" class="debug-button">Check Group Domination</button>
    `;

  // Add to options section
  const optionsSection = document.querySelector(".options-section");
  if (optionsSection) {
    optionsSection.appendChild(debugSection);

    // Add event listener
    const checkDominationButton = document.getElementById("check-domination");
    if (checkDominationButton) {
      checkDominationButton.addEventListener("click", async () => {
        console.log("Manual check for group domination triggered");
        try {
          const { stateGroups } = await import("./state-groups.js");
          await stateGroups.checkAllGroupsDomination();

          // Also import actions log to add a message
          const { actionsLog } = await import("./actions-log.js");
          actionsLog.log("Manual group domination check triggered", "info");
        } catch (error) {
          console.error("Error during manual domination check:", error);
        }
      });
    }
  }
}

// Start a new game by clearing config and redirecting to welcome screen
function startNewGame() {
  if (
    confirm(
      "Are you sure you want to start a new game? This will reset your current progress.",
    )
  ) {
    // Clear the stored game configuration
    localStorage.removeItem("gameConfig");

    // Check if user is already signed in
    const signInSuccessful = localStorage.getItem("signInSuccessful");
    
    if (signInSuccessful === "true") {
      // User is already signed in, redirect to candidate selection
      window.location.href = "welcome-screen.html#step-2";
    } else {
      // User is not signed in, redirect to sign-in screen
      window.location.href = "welcome-screen.html";
    }
  }
}

// Export functions and state for use in other modules
export {
  gameOptions,
  isGamePaused,
  toggleRandomEvents,
  toggleSound,
  toggleMusic,
  toggleGameplay,
  toggleHelp,
  showHelpOverlay,
  hideHelpOverlay,
  startNewGame,
};
