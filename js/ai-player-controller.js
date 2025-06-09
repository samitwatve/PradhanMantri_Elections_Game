// AI Player Controller
// This module handles the AI player's decision-making and actions

import { player2 } from './player-info.js';
import { stateInfo } from './state-info.js';
import { mapController } from './map-controller.js';
import { gameOptions } from './game-options.js';

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
            // Only take turn if AI is active AND game is not paused
            if (this.aiActive && gameOptions.gameplay) {
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
    
    pauseAI() {
        this.aiActive = false;
        console.log('AI player paused');
    }
    
    resumeAI() {
        this.aiActive = true;
        console.log('AI player resumed');
        
        // Restart the turn timer if it was cleared
        if (!this.turnTimer) {
            this.startAITurnLoop();
        }
    }    
    
    async takeAITurn() {
        // Skip turn if game is paused
        if (!gameOptions.gameplay) {
            console.log('AI turn skipped - game is paused');
            return;
        }
        
        console.log('AI player taking random turn');
        
        try {
            // Load states data if needed
            if (!this.statesData) {
                const response = await fetch('states_data.json');
                this.statesData = await response.json();
            }
            
            // 50% chance to target a state, 50% chance to contribute to a campaign
            if (Math.random() < 0.5) {
                this.targetRandomState();
            } else {
                this.contributeToRandomCampaign();
            }
        } catch (error) {
            console.error('Error during AI turn:', error);
        }
    }
    
    async targetRandomState() {
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
                const centerY = bbox.y + bbox.height / 2;
                // Create a ripple effect at the center of the state
                mapController.createRippleEffect(centerX, centerY, this.aiPlayerId);
            }
            
            console.log(`AI player spent ${cost}M on ${targetState.State}`);
        } else {
            console.log('AI player does not have enough funds');
        }
    }

    contributeToRandomCampaign() {
        // Get all available campaign categories
        const categories = Object.keys(window.policyProgress);
        
        // List of all available, non-maxed campaigns
        const availableCampaigns = [];
        
        // Check each campaign in each category
        categories.forEach(category => {
            window.policyProgress[category].forEach((policy, index) => {
                // Only consider campaigns that aren't maxed out
                if (policy.player1 + policy.player2 < 100) {
                    availableCampaigns.push({ category, index });
                }
            });
        });
        
        // If no available campaigns, exit
        if (availableCampaigns.length === 0) {
            console.log('AI found no available campaigns to contribute to');
            return;
        }
        
        // Choose a random campaign
        const randomCampaign = availableCampaigns[Math.floor(Math.random() * availableCampaigns.length)];
        const { category, index } = randomCampaign;
        
        // Contribute to the campaign using the incrementPolicy function
        const success = window.incrementPolicy(category, index, this.aiPlayerId);
        
        if (success) {
            console.log(`AI player contributed to ${category}-${index + 1} campaign`);
        } else {
            console.log('AI player failed to contribute to campaign');
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
