// AI Player Controller
// This module handles the AI player's decision-making and actions

import { player2 } from './player-info.js';
import { stateInfo } from './state-info.js';
import { mapController } from './map-controller.js';

class AIPlayerController {    
    constructor() {
        this.aiPlayerId = 2;
        this.turnInterval = 2000; // 2 seconds between AI turns
        this.aiActive = true;
        this.initialize();
    }    
    
    initialize() {
        console.log('AI Player Controller initialized');
        
        // Start the AI turn loop after a short delay
        setTimeout(() => {
            this.startAITurnLoop();
        }, 2000); // Start after 2 seconds to let the game initialize
        
        // Listen for game timer updates
        window.addEventListener('timerUpdated', (event) => {
            // We're keeping the turn interval fixed at 2 seconds
        });
    }

    startAITurnLoop() {
        console.log('Starting AI turn loop');
        
        // Take first AI turn
        this.takeAITurn();
        
        // Set up recurring turns
        this.turnTimer = setInterval(() => {
            if (this.aiActive) {
                this.takeAITurn();
            }
        }, this.turnInterval);
    }

    stopAITurnLoop() {
        if (this.turnTimer) {
            clearInterval(this.turnTimer);
            this.turnTimer = null;
        }
        this.aiActive = false;
    }    
    
    async takeAITurn() {
        console.log('AI player taking random turn');
        
        try {
            // Load states data if needed
            if (!this.statesData) {
                const response = await fetch('states_data.json');
                this.statesData = await response.json();
            }
            
            // Choose a random state for the AI to target
            const targetState = this.chooseTargetState();
            
            if (!targetState) {
                console.log('AI could not find a suitable target state');
                return;
            }
            
            console.log(`AI randomly targeting state: ${targetState.SvgId}`);
            
            // Calculate cost (equal to number of seats)
            const cost = parseInt(targetState.LokSabhaSeats);
            
            // Check if AI has enough funds
            if (player2.canSpend(cost)) {
                // Update state popularity
                stateInfo.recordStateAction(targetState.SvgId, this.aiPlayerId, cost);
                
                // Deduct funds from AI player
                player2.updateFunds(-cost);
                
                // Find coordinates for the ripple effect (center of the state)
                const stateElement = mapController.svgDocument.getElementById(targetState.SvgId);
                if (stateElement) {
                    // Get the bounding box of the state
                    const bbox = stateElement.getBBox();
                    const centerX = bbox.x + bbox.width / 2;
                    const centerY = bbox.y + bbox.height / 2;                    // Create a ripple effect at the center of the state
                    mapController.createRippleEffect(centerX, centerY, this.aiPlayerId);
                }
                
                console.log(`AI player spent ${cost}M on ${targetState.State}`);
            } else {
                console.log('AI player does not have enough funds');
            }
        } catch (error) {
            console.error('Error during AI turn:', error);
        }
    }    
    
    chooseTargetState() {
        if (!this.statesData) return null;
        
        // Get states where AI can afford to campaign
        const affordableStates = this.statesData.filter(state => {
            if (!state.SvgId) return false;
            
            const cost = parseInt(state.LokSabhaSeats);
            return player2.canSpend(cost);
        });
        
        if (affordableStates.length === 0) {
            return null;
        }
        
        // Simply choose a random state from all affordable states
        return affordableStates[Math.floor(Math.random() * affordableStates.length)];
    }
    
    // Helper function to choose a state with weighting based on seat count
    weightedRandomChoice(states) {
        // Calculate total weight (seats)
        const totalWeight = states.reduce((sum, state) => sum + parseInt(state.LokSabhaSeats), 0);
        
        // Choose a random value within the total weight
        let randomValue = Math.random() * totalWeight;
        
        // Find the state that corresponds to this random value
        for (const state of states) {
            randomValue -= parseInt(state.LokSabhaSeats);
            if (randomValue <= 0) {
                return state;
            }
        }
        
        // Fallback
        return states[0];
    }
}

// Create and export a single instance
export const aiPlayerController = new AIPlayerController();
