import { stateInfo } from './state-info.js';
import { gameTimer } from './game-timer.js';
import { mapController } from './map-controller.js';
import { aiPlayerController } from './ai-player-controller.js';
import { seatProjection } from './seat-projection.js';
import { player1, player2 } from './player-info.js';

// Main game initialization and setup
document.addEventListener('DOMContentLoaded', () => {
    // Initialize all game components
    initializeMap();
    initializePlayerInfo(); // Initialize player info first so event listeners are set up
    
    // Configure the game timer with 8 phases of 30 seconds each
    gameTimer.totalPhases = 8;
    gameTimer.phaseDuration = 30;
    gameTimer.totalDuration = gameTimer.totalPhases * gameTimer.phaseDuration;
    gameTimer.remainingTime = gameTimer.totalDuration;
    gameTimer.phaseTimeRemaining = gameTimer.phaseDuration;
      // Set up phase change listener
    gameTimer.onPhaseChange((currentPhase, totalPhases) => {
        console.log(`Phase changed: ${currentPhase} of ${totalPhases}`);
        gameState.updatePhase(currentPhase);
        
        // Dispatch gamePhaseChanged event for other components to listen to
        const event = new CustomEvent('gamePhaseChanged', { 
            detail: { phase: currentPhase, totalPhases: totalPhases }
        });
        window.dispatchEvent(event);
        
        console.log(`Dispatched gamePhaseChanged event for phase ${currentPhase}`);
    });    
    // Start the timer
    gameTimer.start();
    initializeStateGroups();
    initializeActionsLog();
    // stateInfo initializes itself
    // aiPlayerController initializes itself
    
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
        
        const testProjectionsButton = document.createElement('button');
        testProjectionsButton.textContent = 'Test Seat Projections';
        testProjectionsButton.onclick = function() {
            window.testSeatProjections();
        };
        debugDiv.appendChild(testProjectionsButton);
        
        document.body.appendChild(debugDiv);
    };
    
    // Run the test function after a delay
    setTimeout(() => {
        window.testStateColors();
    }, 1500);
    
    // DEBUG: Add test function for seat projections
    window.testSeatProjections = function() {
        console.log("Testing seat projections...");
        
        // Get all states
        const stateIds = Array.from(stateInfo.statePopularity.keys());
        
        // Simulate different popularity distributions for testing
        let currentPhase = 1;
        let scenario = 0; // Different electoral scenarios
        
        function simulateNextPhase() {
            if (currentPhase > 8) {
                currentPhase = 1;
                scenario = (scenario + 1) % 5; // Cycle through 5 different scenarios
            }
            
            console.log(`Simulating phase ${currentPhase} popularity changes (Scenario ${scenario})`);
            
            // Change popularity based on phase and scenario
            stateIds.forEach(stateId => {
                const popularity = stateInfo.statePopularity.get(stateId);
                if (!popularity) return;
                
                // Find the state data
                const stateData = stateInfo.statesData.find(s => s.SvgId === stateId);
                if (!stateData) return;
                
                // Different scenarios for different regions
                let newP1, newP2, newOthers;
                let randomFactor = Math.random();
                
                // Base values depending on scenario
                switch(scenario) {
                    case 0: // Player 1 wave election
                        newP1 = 50 + Math.floor(randomFactor * 20);
                        newP2 = 30 - Math.floor(randomFactor * 10);
                        break;
                    case 1: // Player 2 wave election
                        newP1 = 30 - Math.floor(randomFactor * 10);
                        newP2 = 50 + Math.floor(randomFactor * 20);
                        break;
                    case 2: // Regionally divided (South vs North)
                        if (stateData.SouthIndia === "TRUE") {
                            newP1 = 30 - Math.floor(randomFactor * 10);
                            newP2 = 50 + Math.floor(randomFactor * 15);
                        } else if (stateData.HindiHeartland === "TRUE") {
                            newP1 = 50 + Math.floor(randomFactor * 15);
                            newP2 = 30 - Math.floor(randomFactor * 10);
                        } else {
                            newP1 = 35 + Math.floor(randomFactor * 10);
                            newP2 = 35 + Math.floor(randomFactor * 10);
                        }
                        break;
                    case 3: // Close election
                        newP1 = 40 + Math.floor(randomFactor * 10) - 5;
                        newP2 = 40 + Math.floor(randomFactor * 10) - 5;
                        break;
                    case 4: // Strong third party presence
                        newP1 = 30 + Math.floor(randomFactor * 10);
                        newP2 = 30 + Math.floor(randomFactor * 10);
                        break;
                }
                
                // Phase progression - seats gradually shifting as campaign continues
                const phaseProgress = currentPhase / 8;
                
                // In some scenarios, votes consolidate toward major parties as election progresses
                if (scenario !== 4) {
                    newP1 += Math.floor(phaseProgress * 10 * randomFactor);
                    newP2 += Math.floor(phaseProgress * 10 * (1 - randomFactor));
                }
                
                // Ensure total is 100
                newOthers = Math.max(0, 100 - newP1 - newP2);
                
                // Adjust for invalid values
                newP1 = Math.max(0, Math.min(100, newP1));
                newP2 = Math.max(0, Math.min(100, newP2));
                
                // Make final adjustment to ensure total is 100
                const total = newP1 + newP2 + newOthers;
                if (total !== 100) {
                    // Adjust others
                    newOthers = Math.max(0, 100 - newP1 - newP2);
                    
                    // If others is 0 and we're still not at 100, adjust the larger of P1/P2
                    if (newOthers === 0) {
                        if (newP1 >= newP2) {
                            newP1 = 100 - newP2;
                        } else {
                            newP2 = 100 - newP1;
                        }
                    }
                }
                
                // Update popularity
                stateInfo.updateStatePopularity(stateId, {
                    player1: newP1,
                    player2: newP2,
                    others: newOthers
                });
            });
            
            // Update game phase
            gameState.updatePhase(currentPhase);
            
            // Update game timer display
            if (window.gameTimer) {
                gameTimer.currentPhase = currentPhase;
                gameTimer.updateDisplay();
            }
            
            currentPhase++;
        }
        
        // Run the simulation immediately and then every 5 seconds
        simulateNextPhase();
        setInterval(simulateNextPhase, 5000);
    };
});

function initializeMap() {
    const map = document.getElementById('india-map');
    map.addEventListener('load', () => {
        // Map initialization code will be handled by map-controller.js
        console.log('Map loaded successfully');
    });
}

function initializePlayerInfo() {
    // Player instances are created when the module is imported
    // This function ensures they are properly initialized
    console.log('Player info initialized:', player1, player2);
    return { player1, player2 };
}

function initializeStateGroups() {
    // Initialize state groups functionality
    console.log('State groups initialized');
}

function initializeActionsLog() {
    // Initialize actions log functionality
    console.log('Actions log initialized');
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
    gamePhase: 1,
    totalPhases: 8,
    phaseDuration: 30,
    // Add more game state properties as needed
      // Update the current phase
    updatePhase(newPhase) {
        this.gamePhase = newPhase;
        // Note: gamePhaseChanged event is dispatched from main.js timer callback
        // to avoid duplicate events
    }
};
