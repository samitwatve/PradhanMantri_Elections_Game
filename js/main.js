import { stateInfo } from './state-info.js';
import { GameTimer } from './game-timer.js';
import { mapController } from './map-controller.js';

// Main game initialization and setup
document.addEventListener('DOMContentLoaded', () => {
    // Initialize all game components
    initializeMap();
    const gameTimer = new GameTimer();
    gameTimer.start();
    initializePlayerInfo();
    initializeStateGroups();
    initializeActionsLog();
    // stateInfo initializes itself
    
    // Set up event listeners for game-wide events
    setupGameEventListeners();
    
    // DEBUG: Add testing function to window
    window.testStateColors = function() {
        console.log("Testing state colors...");
        
        // Force update all state colors
        stateInfo.forceUpdateAllStates();
        
        // Add a test button to the UI
        const debugDiv = document.createElement('div');
        debugDiv.style.position = 'fixed';
        debugDiv.style.bottom = '10px';
        debugDiv.style.right = '10px';
        debugDiv.style.zIndex = '9999';
        debugDiv.style.display = 'flex';
        debugDiv.style.flexDirection = 'column';
        debugDiv.style.gap = '5px';
        
        const testButton = document.createElement('button');
        testButton.textContent = 'Update All Colors';
        testButton.onclick = function() {
            stateInfo.forceUpdateAllStates();
        };
        debugDiv.appendChild(testButton);
        
        const resetSelectionsButton = document.createElement('button');
        resetSelectionsButton.textContent = 'Reset Selections';
        resetSelectionsButton.onclick = function() {
            mapController.resetAllSelections();
        };
        debugDiv.appendChild(resetSelectionsButton);
        
        document.body.appendChild(debugDiv);
    };
    
    // Run the test function after a delay
    setTimeout(() => {
        window.testStateColors();
    }, 1500);
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
