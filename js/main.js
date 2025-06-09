import { stateInfo } from './state-info.js';
import { gameTimer } from './game-timer.js';
import { mapController } from './map-controller.js';
import { aiPlayerController } from './ai-player-controller.js';
import { seatProjection } from './seat-projection.js';
import { player1, player2 } from './player-info.js';
import { rallyController } from './rally-controller.js';

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
    setupGameEventListeners();    // DEBUG: Add testing function to window
    window.testStateColors = function() {
        console.log("Testing state colors...");
        
        // Force update all state colors
        stateInfo.forceUpdateAllStates();
        
        // Add a test button to the UI
        // const debugDiv = document.createElement('div');
    
    // Expose gameTimer to window object for other modules
    window.gameTimer = gameTimer;
        // debugDiv.style.position = 'fixed';
        // debugDiv.style.bottom = '10px';
        // debugDiv.style.right = '10px';
        // debugDiv.style.zIndex = '9999';
        // debugDiv.style.display = 'flex';
        // debugDiv.style.flexDirection = 'column';
        // debugDiv.style.gap = '5px';
        
        const testButton = document.createElement('button');
        testButton.textContent = 'Update All Colors';
        testButton.onclick = function() {
            stateInfo.forceUpdateAllStates();
        };
        // debugDiv.appendChild(testButton);
        
        const resetSelectionsButton = document.createElement('button');
        resetSelectionsButton.textContent = 'Reset Selections';
        resetSelectionsButton.onclick = function() {
            mapController.resetAllSelections();
        };
        // debugDiv.appendChild(resetSelectionsButton);
          const testProjectionsButton = document.createElement('button');
        testProjectionsButton.textContent = 'Test Seat Projections';
        testProjectionsButton.onclick = function() {
            window.testSeatProjections();
        };
        // debugDiv.appendChild(testProjectionsButton);
          const checkDominationButton = document.createElement('button');
        checkDominationButton.textContent = 'Check Group Domination';
        checkDominationButton.onclick = async function() {
            const { stateGroups } = await import('./state-groups.js');
            console.log('Manually checking group domination');
            await stateGroups.checkAllGroupsDomination();
        };
        // debugDiv.appendChild(checkDominationButton);
          const analyzeDominationButton = document.createElement('button');
        analyzeDominationButton.textContent = 'Analyze Group Domination';
        analyzeDominationButton.style.backgroundColor = '#ff9800';
        analyzeDominationButton.style.color = 'white';
        analyzeDominationButton.onclick = async function() {
            const { stateGroups } = await import('./state-groups.js');
            console.log('Analyzing group domination issues');
            await stateGroups.analyzeGroupDomination();
        };
        // debugDiv.appendChild(analyzeDominationButton);
        
        // Add buttons to force domination of specific groups
        const groupSelect = document.createElement('select');
        groupSelect.style.margin = '5px 0';
        groupSelect.style.padding = '5px';
        
        // Add all group options
        ['South India', 'North India', 'Hindi Heartland', 'Northeast India', 
         'Coastal India', 'Union Territory', 'Agricultural Region', 'Border Lands', 
         'Pilgrimage', 'Industrial Corridor', 'Manufacturing', 'Education', 
         'Tribal Lands', 'Travel and Tourism', 'Natural Resources', 'Minority Areas'].forEach(group => {
            const option = document.createElement('option');
            option.value = group;
            option.textContent = group;
            groupSelect.appendChild(option);
        });
        // debugDiv.appendChild(groupSelect);
        
        const forceP1Button = document.createElement('button');
        forceP1Button.textContent = 'Force P1 Domination';
        forceP1Button.style.backgroundColor = '#ff7700';
        forceP1Button.onclick = async function() {
            const { stateGroups } = await import('./state-groups.js');
            const selectedGroup = groupSelect.value;
            await stateGroups.forceGroupDomination(selectedGroup, 1);
        };
        // debugDiv.appendChild(forceP1Button);
          const forceP2Button = document.createElement('button');
        forceP2Button.textContent = 'Force P2 Domination';
        forceP2Button.style.backgroundColor = '#00a000';
        forceP2Button.style.color = 'white';
        forceP2Button.onclick = async function() {
            const { stateGroups } = await import('./state-groups.js');
            const selectedGroup = groupSelect.value;
            await stateGroups.forceGroupDomination(selectedGroup, 2);
        };
        // debugDiv.appendChild(forceP2Button);
        
        // Add a separator
        const separator = document.createElement('hr');
        separator.style.margin = '5px 0';
        // debugDiv.appendChild(separator);
        
        // Add buttons to dominate ALL groups
        const forceAllP1Button = document.createElement('button');
        forceAllP1Button.textContent = 'Force ALL Groups P1';
        forceAllP1Button.style.backgroundColor = '#d32f2f';
        forceAllP1Button.style.color = 'white';
        forceAllP1Button.style.padding = '8px';
        forceAllP1Button.style.margin = '5px 0';
        forceAllP1Button.onclick = async function() {
            if (confirm('This will set all states to P1 dominance. Continue?')) {
                const { stateGroups } = await import('./state-groups.js');
                await stateGroups.forceAllGroupsDomination(1);
            }
        };
        // debugDiv.appendChild(forceAllP1Button);
        
        const forceAllP2Button = document.createElement('button');
        forceAllP2Button.textContent = 'Force ALL Groups P2';
        forceAllP2Button.style.backgroundColor = '#388e3c';
        forceAllP2Button.style.color = 'white';
        forceAllP2Button.style.padding = '8px';
        forceAllP2Button.style.margin = '5px 0';
        forceAllP2Button.onclick = async function() {
            if (confirm('This will set all states to P2 dominance. Continue?')) {
                const { stateGroups } = await import('./state-groups.js');
                await stateGroups.forceAllGroupsDomination(2);
            }
        };
        // debugDiv.appendChild(forceAllP2Button);
        
        // document.body.appendChild(debugDiv);
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
            
            // Check for group domination
            setTimeout(async () => {
                try {
                    const { stateGroups } = await import('./state-groups.js');
                    console.log('Checking group domination after simulation');
                    await stateGroups.checkAllGroupsDomination();
                } catch (error) {
                    console.error('Error checking group domination:', error);
                }
            }, 300);
            
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
    
    // Check for group domination after a short delay
    setTimeout(async () => {
        try {
            const { stateGroups } = await import('./state-groups.js');
            console.log('Initial check for group domination');
            await stateGroups.checkAllGroupsDomination();
        } catch (error) {
            console.error('Error during initial group domination check:', error);
        }
    }, 2000); // Give more time for state data to load
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
