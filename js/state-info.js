// State information display controller
import { popularityInitializer } from './popularity-initializer.js';

class StateInfo {
    constructor() {
        this.statesData = null;
        this.statesDetails = document.querySelector('.states-details');
        this.statePopularity = new Map(); // Store popularity for each state
        this.stateActions = new Map(); // Store actions taken in each state
        this.initialize();
    }    async initialize() {
        try {
            const response = await fetch('states_data.json');
            this.statesData = await response.json();
            this.setupEventListeners();
            
            // Initialize states with balanced popularity values
            console.log('Initializing states with balanced popularity values...');
            const popularityMap = await popularityInitializer.initializeStatePopularity();
            
            if (popularityMap) {
                this.statesData.forEach(state => {
                    if (state.SvgId) {
                        if (popularityMap.has(state.SvgId)) {
                            // Use the pre-calculated popularity
                            this.statePopularity.set(state.SvgId, popularityMap.get(state.SvgId));
                            
                            // Initialize actions tracking
                            this.stateActions.set(state.SvgId, {
                                player1Spent: 0,
                                player2Spent: 0,
                                player1Rallies: 0,
                                player2Rallies: 0
                            });
                        } else if (!this.statePopularity.has(state.SvgId)) {
                            // Fallback to default initialization if not in the map
                            this.initializeState(state.SvgId);
                        }
                    }
                });
            } else {
                // Fallback to default initialization if popularity initializer failed
                console.warn('Falling back to default state initialization');
                this.statesData.forEach(state => {
                    if (state.SvgId && !this.statePopularity.has(state.SvgId)) {
                        this.initializeState(state.SvgId);
                    }
                });
            }
            
            // Force initial update
            setTimeout(() => this.forceUpdateAllStates(), 500);
            
            console.log('StateInfo initialized successfully');
        } catch (error) {
            console.error('Failed to load states data:', error);
        }
    }

    setupEventListeners() {
        // Listen for state hovers from map
        window.addEventListener('stateHover', (event) => {
            console.log('Hover event received for state:', event.detail.stateId);
            const stateId = event.detail.stateId;
            this.updateStateInfo(stateId);
        });

        // Listen for small UT button hovers
        const utButtons = document.querySelectorAll('.small-uts-grid button');
        utButtons.forEach(button => {
            button.addEventListener('mouseenter', () => {
                const utName = this.getUTFullName(button.dataset.ut);
                const stateData = this.statesData.find(state => 
                    state.State.toLowerCase().replace(/[^a-z]/g, '') === utName.toLowerCase().replace(/[^a-z]/g, '')
                );
                if (stateData) {
                    this.updateStateInfo(stateData.SvgId);
                }
            });
        });
    }
      initializeState(stateId) {
        if (!this.statePopularity.has(stateId)) {
            // Default initialization with balanced values
            this.statePopularity.set(stateId, {
                player1: this.getRandomInt(15, 30),
                player2: this.getRandomInt(15, 30),
                others: 40
            });
            
            // Ensure total is 100%
            const popularity = this.statePopularity.get(stateId);
            const total = popularity.player1 + popularity.player2 + popularity.others;
            if (total !== 100) {
                // Adjust others to make total 100
                popularity.others = 100 - popularity.player1 - popularity.player2;
            }
            
            this.stateActions.set(stateId, {
                player1Spent: 0,
                player2Spent: 0,
                player1Rallies: 0,
                player2Rallies: 0
            });
        }
        return {
            popularity: this.statePopularity.get(stateId),
            actions: this.stateActions.get(stateId)
        };
    }
    
    // Helper method to get random integer between min and max (inclusive)
    getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    getUTFullName(utId) {
        const utNames = {
            'puducherry': 'Puducherry',
            'chandigarh': 'Chandigarh',
            'dadra-and-nagar-haveli': 'Dadra And Nagar Haveli',
            'daman-and-diu': 'Daman And Diu'
        };
        return utNames[utId] || utId;
    }

    getStatePopularity(stateId) {
        return this.statePopularity.get(stateId);
    }

    updateStatePopularity(stateId, popularity) {
        this.statePopularity.set(stateId, popularity);
        
        // Emit an event to notify the map controller
        window.dispatchEvent(new CustomEvent('popularityChanged', {
            detail: {
                stateId,
                popularity
            }
        }));
    }    

    recordStateAction(stateId, playerId, amount) {
        if (!this.statePopularity.has(stateId)) {
            this.initializeState(stateId);
        }

        const popularity = this.statePopularity.get(stateId);
        const popularityIncrease = Math.floor(Math.min(5, amount / 10)); // Convert amount to popularity points, round down

        // Create a new object to ensure reactivity
        const newPopularity = { ...popularity };

        if (playerId === 1) {
            // Calculate new values
            const increase = Math.round(popularityIncrease);
            const decrease = Math.round(popularityIncrease / 2);
            
            newPopularity.player1 = Math.min(100, Math.round(popularity.player1 + increase));
            newPopularity.others = Math.max(0, Math.round(popularity.others - decrease));
            
            // Ensure total stays at 100%
            const total = newPopularity.player1 + newPopularity.player2 + newPopularity.others;
            if (total > 100) {
                const excess = total - 100;
                newPopularity.others = Math.max(0, newPopularity.others - excess);
            }
        } else if (playerId === 2) {
            // Calculate new values
            const increase = Math.round(popularityIncrease);
            const decrease = Math.round(popularityIncrease / 2);
            
            newPopularity.player2 = Math.min(100, Math.round(popularity.player2 + increase));
            newPopularity.others = Math.max(0, Math.round(popularity.others - decrease));
            
            // Ensure total stays at 100%
            const total = newPopularity.player1 + newPopularity.player2 + newPopularity.others;
            if (total > 100) {
                const excess = total - 100;
                newPopularity.others = Math.max(0, newPopularity.others - excess);
            }
        }

        // Update the state with new values
        this.updateStatePopularity(stateId, newPopularity);
        
        // Log the update for debugging
        console.log(`Updated ${stateId} popularity:`, newPopularity);
        
        // Force an immediate re-render of the state info
        this.updateStateInfo(stateId);
    }

    refreshStateDisplay(stateId) {
        const currentStateElement = this.statesDetails.querySelector('.state-info h4');
        if (currentStateElement) {
            const currentState = this.statesData.find(state => 
                currentStateElement.textContent.startsWith(state.State)
            );
            if (currentState && currentState.SvgId === stateId) {
                this.updateStateInfo(stateId);
            }
        }
    }

    updateStateInfo(stateId) {
        if (!this.statesData || !this.statesDetails) {
            console.log('Missing statesData or statesDetails');
            return;
        }
        
        const stateData = this.statesData.find(state => state.SvgId === stateId);
        if (!stateData) {
            console.log('No state data found for:', stateId);
            return;
        }

        console.log('Updating state info for:', stateData.State);

        // Get the state groups
        const groups = Object.entries(stateData)
            .filter(([key, value]) => value === "TRUE" && key !== "UnionTerritory")
            .map(([key]) => this.formatGroupName(key));

        // Initialize or get state data
        const state = this.initializeState(stateId);
        const popularity = state.popularity;

        this.statesDetails.innerHTML = `
            <div class="state-info">
                <h4>${stateData.State} (${stateData.LokSabhaSeats} seats)</h4>
                  <div class="popularity-section">
                    <h5>Current Popularity</h5>
                    <div class="info-row">
                        <span>P1: ${Math.round(popularity.player1)}%</span>
                        <span>P2: ${Math.round(popularity.player2)}%</span>
                        <span>Others: ${Math.round(popularity.others)}%</span>
                    </div>
                </div>

                <div class="groups-section">
                    <h5>Groups</h5>
                    <div class="groups-list">
                        ${groups.join(' • ')}
                    </div>
                </div>
            </div>
        `;
    }

    formatGroupName(key) {
        return key.replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase())
            .trim();
    }

    // Force immediate update of state popularity and color
    forceUpdateAllStates() {
        console.log("Forcing update of all states");
        
        // Get all states with existing popularity data
        this.statePopularity.forEach((popularity, stateId) => {
            // Create a copy of the popularity object to ensure reactivity
            const popularityCopy = JSON.parse(JSON.stringify(popularity));
            
            // Emit an event to update state color
            window.dispatchEvent(new CustomEvent('popularityChanged', {
                detail: {
                    stateId,
                    popularity: popularityCopy
                }
            }));
        });
    }
}

// Create and export a single instance
export const stateInfo = new StateInfo();
