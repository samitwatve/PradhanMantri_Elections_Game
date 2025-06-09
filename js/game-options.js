// Game Options Controller

// Track the state of each option
const gameOptions = {
    randomEvents: true,
    sound: true,
    music: false,
    gameplay: true, // true = playing, false = paused
    help: false
};

// Cache DOM elements
let randomEventsButton;
let soundButton;
let musicButton;
let gameplayButton;
let helpButton;

// Audio elements for later implementation
let backgroundMusic;
let soundEffects = {};

document.addEventListener('DOMContentLoaded', () => {
    // Initialize DOM elements
    randomEventsButton = document.getElementById('random-events-toggle');
    soundButton = document.getElementById('sound-toggle');
    musicButton = document.getElementById('music-toggle');
    gameplayButton = document.getElementById('gameplay-toggle');
    helpButton = document.getElementById('help-toggle');

    // Set up event listeners
    if (randomEventsButton) {
        randomEventsButton.addEventListener('click', toggleRandomEvents);
    }
    
    if (soundButton) {
        soundButton.addEventListener('click', toggleSound);
    }
    
    if (musicButton) {
        musicButton.addEventListener('click', toggleMusic);
    }
    
    if (gameplayButton) {
        gameplayButton.addEventListener('click', toggleGameplay);
    }
    
    if (helpButton) {
        helpButton.addEventListener('click', toggleHelp);
    }

    // Initialize states based on stored preferences (future enhancement)
    // For now, just sync the UI with default values
    updateButtonStates();

    // Add debug options
    addDebugOptions();
});

// Toggle functions
function toggleRandomEvents() {
    gameOptions.randomEvents = !gameOptions.randomEvents;
    updateButtonStates();
    // Additional functionality to actually enable/disable random events
    console.log(`Random events are now ${gameOptions.randomEvents ? 'enabled' : 'disabled'}`);
}

function toggleSound() {
    gameOptions.sound = !gameOptions.sound;
    updateButtonStates();
    // Additional functionality to mute/unmute sound effects
    console.log(`Sound effects are now ${gameOptions.sound ? 'enabled' : 'disabled'}`);
}

function toggleMusic() {
    gameOptions.music = !gameOptions.music;
    updateButtonStates();
    // Additional functionality to play/pause background music
    console.log(`Music is now ${gameOptions.music ? 'playing' : 'stopped'}`);
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
    }
    
    console.log(`Game is now ${gameOptions.gameplay ? 'playing' : 'paused'}`);
}

function toggleHelp() {
    gameOptions.help = !gameOptions.help;
    updateButtonStates();
    // Additional functionality to show/hide help overlay or guide
    console.log(`Help is now ${gameOptions.help ? 'shown' : 'hidden'}`);
}

// Update the UI based on current states
function updateButtonStates() {
    // Update Random Events button
    if (randomEventsButton) {
        randomEventsButton.setAttribute('data-state', gameOptions.randomEvents ? 'on' : 'off');
        randomEventsButton.querySelector('.option-icon').className = 
            `option-icon fas ${gameOptions.randomEvents ? 'fa-dice' : 'fa-dice-d6'}`;
    }
    
    // Update Sound button
    if (soundButton) {
        soundButton.setAttribute('data-state', gameOptions.sound ? 'on' : 'off');
        soundButton.querySelector('.option-icon').className = 
            `option-icon fas ${gameOptions.sound ? 'fa-volume-high' : 'fa-volume-xmark'}`;
    }
    
    // Update Music button
    if (musicButton) {
        musicButton.setAttribute('data-state', gameOptions.music ? 'on' : 'off');
        // No icon change needed for music
    }
    
    // Update Gameplay button
    if (gameplayButton) {
        gameplayButton.setAttribute('data-state', gameOptions.gameplay ? 'on' : 'off');
        gameplayButton.querySelector('.option-icon').className = 
            `option-icon fas ${gameOptions.gameplay ? 'fa-play' : 'fa-pause'}`;
    }
    
    // Update Help button
    if (helpButton) {
        helpButton.setAttribute('data-state', gameOptions.help ? 'on' : 'off');
        // No icon change needed for help
    }
}

// Add a debug button for checking group domination
function addDebugOptions() {
    // Only add in development environment
    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        console.log('Debug options only available in development environment');
        return;
    }
    
    // Create debug section
    const debugSection = document.createElement('div');
    debugSection.className = 'debug-section';
    debugSection.innerHTML = `
        <h3>Debug Tools</h3>
        <button id="check-domination" class="debug-button">Check Group Domination</button>
    `;
    
    // Add to options section
    const optionsSection = document.querySelector('.options-section');
    if (optionsSection) {
        optionsSection.appendChild(debugSection);
        
        // Add event listener
        const checkDominationButton = document.getElementById('check-domination');
        if (checkDominationButton) {
            checkDominationButton.addEventListener('click', async () => {
                console.log('Manual check for group domination triggered');
                try {
                    const { stateGroups } = await import('./state-groups.js');
                    await stateGroups.checkAllGroupsDomination();
                    
                    // Also import actions log to add a message
                    const { actionsLog } = await import('./actions-log.js');
                    actionsLog.log('Manual group domination check triggered', 'info');
                } catch (error) {
                    console.error('Error during manual domination check:', error);
                }
            });
        }
    }
}

// Export functions and state for use in other modules
export {
    gameOptions,
    toggleRandomEvents,
    toggleSound,
    toggleMusic,
    toggleGameplay,
    toggleHelp
};
