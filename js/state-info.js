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
    }    setupEventListeners() {
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
        
        // Make stateInfo available globally for seat projection
        window.stateInfo = this;
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
    }    recordStateAction(stateId, playerId, amount) {
        if (!this.statePopularity.has(stateId)) {
            this.initializeState(stateId);
        }

        // Update the actions record
        if (!this.stateActions.has(stateId)) {
            this.stateActions.set(stateId, {
                player1Spent: 0,
                player2Spent: 0,
                player1Rallies: 0,
                player2Rallies: 0
            });
        }
        
        const actions = this.stateActions.get(stateId);
        if (playerId === 1) {
            actions.player1Spent += amount;
        } else if (playerId === 2) {
            actions.player2Spent += amount;
        }

        const popularity = this.statePopularity.get(stateId);
        
        // Create a new object to ensure reactivity
        const newPopularity = { ...popularity };

        // Fixed 5% increase for the active player
        const fixedIncrease = 5;
        
        if (playerId === 1) {
            // Player 1 gets a fixed 5% increase
            newPopularity.player1 = Math.min(100, Math.round(popularity.player1 + fixedIncrease));
            
            // The 5% comes proportionally from player2 and others based on their current values
            const totalOthers = popularity.player2 + popularity.others;
            
            if (totalOthers > 0) {
                const p2Share = popularity.player2 / totalOthers;
                const othersShare = popularity.others / totalOthers;
                
                const p2Decrease = Math.round(fixedIncrease * p2Share * 10) / 10;
                const othersDecrease = Math.round(fixedIncrease * othersShare * 10) / 10;
                
                newPopularity.player2 = Math.max(0, Math.round((popularity.player2 - p2Decrease) * 10) / 10);
                newPopularity.others = Math.max(0, Math.round((popularity.others - othersDecrease) * 10) / 10);
            } else {
                // Edge case: if player1 already has 100%
                newPopularity.player2 = 0;
                newPopularity.others = 0;
            }
            
        } else if (playerId === 2) {
            // Player 2 gets a fixed 5% increase
            newPopularity.player2 = Math.min(100, Math.round(popularity.player2 + fixedIncrease));
            
            // The 5% comes proportionally from player1 and others based on their current values
            const totalOthers = popularity.player1 + popularity.others;
            
            if (totalOthers > 0) {
                const p1Share = popularity.player1 / totalOthers;
                const othersShare = popularity.others / totalOthers;
                
                const p1Decrease = Math.round(fixedIncrease * p1Share * 10) / 10;
                const othersDecrease = Math.round(fixedIncrease * othersShare * 10) / 10;
                
                newPopularity.player1 = Math.max(0, Math.round((popularity.player1 - p1Decrease) * 10) / 10);
                newPopularity.others = Math.max(0, Math.round((popularity.others - othersDecrease) * 10) / 10);
            } else {
                // Edge case: if player2 already has 100%
                newPopularity.player1 = 0;
                newPopularity.others = 0;
            }
        }

        // Ensure total equals exactly 100% (fix any floating-point rounding issues)
        let total = newPopularity.player1 + newPopularity.player2 + newPopularity.others;
        
        if (Math.abs(total - 100) > 0.01) {
            // Adjust the "others" value to make total exactly 100
            newPopularity.others = Math.max(0, Math.round((100 - newPopularity.player1 - newPopularity.player2) * 10) / 10);
            
            // If others is 0 and we still need adjustment, distribute between players
            if (newPopularity.others === 0) {
                total = newPopularity.player1 + newPopularity.player2;
                if (total < 100) {
                    // Add the difference to the active player
                    if (playerId === 1) {
                        newPopularity.player1 += (100 - total);
                    } else {
                        newPopularity.player2 += (100 - total);
                    }
                } else if (total > 100) {
                    // Reduce the inactive player proportionally
                    if (playerId === 1 && newPopularity.player2 > 0) {
                        newPopularity.player2 = Math.max(0, newPopularity.player2 - (total - 100));
                    } else if (playerId === 2 && newPopularity.player1 > 0) {
                        newPopularity.player1 = Math.max(0, newPopularity.player1 - (total - 100));
                    }
                }
            }
        }

        // Update the state with new values
        this.updateStatePopularity(stateId, newPopularity);
        
        // Log the update for debugging
        console.log(`Updated ${stateId} popularity:`, newPopularity);
        console.log(`State actions:`, this.stateActions.get(stateId));
        
        // For player 1 (human player), update the state info display
        // For player 2 (AI), don't update the display to avoid interfering with hover
        if (playerId === 1) {
            this.updateStateInfo(stateId);
        }
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
    }    updateStateInfo(stateId) {
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
