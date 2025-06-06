import { stateInfo } from './state-info.js';

// Main game initialization and setup
document.addEventListener('DOMContentLoaded', () => {
    // Initialize all game components
    initializeMap();
    initializeGameTimer();
    initializePlayerInfo();
    initializeStateGroups();
    initializeActionsLog();
    // stateInfo initializes itself
    
    // Set up event listeners for game-wide events
    setupGameEventListeners();
});

function initializeMap() {
    const map = document.getElementById('india-map');
    map.addEventListener('load', () => {
        // Map initialization code will be handled by map-controller.js
        console.log('Map loaded successfully');
    });
}

function setupGameEventListeners() {
    // Listen for game-wide events
    window.addEventListener('resize', () => {
        // Handle window resize events
        console.log('Window resized');
    });
}

// Export game state management functions if needed
export const gameState = {
    currentPlayer: 1,
    gamePhase: 'setup',
    // Add more game state properties as needed
};
