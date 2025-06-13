// State information display controller
import { popularityInitializer } from './popularity-initializer.js';

class StateInfo {
    constructor() {
        this.statesData = null;
        this.statesDetails = document.querySelector('.states-details');
        this.statePopularity = new Map(); // Store popularity for each state
        this.stateActions = new Map(); // Store actions taken in each state
        this.stateGroups = null; // Cache state groups module
        this.currentStateId = null; // Track currently displayed state
        this.stateInfoElements = null; // Cache DOM elements for faster updates
        this.gameConfig = null; // Store game configuration
        this.initialize();
    }async initialize() {
        try {
            const response = await fetch('states_data.json');
            this.statesData = await response.json();
            
            // Pre-load state groups module for better performance
            const { stateGroups } = await import('./state-groups.js');
            this.stateGroups = stateGroups;
            
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
        });        // Listen for state clicks to update info immediately
        window.addEventListener('stateClick', (event) => {
            console.log('Click event received for state:', event.detail.stateId);
            const stateId = event.detail.stateId;
            // Update state info immediately after click (no delay needed now)
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
    }    updateStatePopularity(stateId, popularity) {
        this.statePopularity.set(stateId, popularity);
        
        // Emit an event to notify the map controller
        window.dispatchEvent(new CustomEvent('popularityChanged', {
            detail: {
                stateId,
                popularity
            }
        }));
        
        // Check for group domination after direct popularity updates
        setTimeout(async () => {
            try {
                const { stateGroups } = await import('./state-groups.js');
                stateGroups.scheduleGroupDominationCheck();
            } catch (error) {
                console.error('Error scheduling group domination check after popularity update:', error);
            }
        }, 100);
    }    updateStatePopularity(stateId, playerId, popularityBoost) {
        if (!this.statePopularity.has(stateId)) {
            this.initializeState(stateId);
        }

        const popularity = this.statePopularity.get(stateId);
        
        // Create a new object to ensure reactivity
        const newPopularity = { ...popularity };

        // Rally gives fixed percentage boost
        if (playerId === 1) {
            // Player 1 gets the rally boost
            newPopularity.player1 = Math.min(100, Math.round(popularity.player1 + popularityBoost));
            
            // The boost comes proportionally from player2 and others
            const totalOthers = popularity.player2 + popularity.others;
            
            if (totalOthers > 0) {
                const p2Share = popularity.player2 / totalOthers;
                const othersShare = popularity.others / totalOthers;
                
                const p2Decrease = Math.round(popularityBoost * p2Share * 10) / 10;
                const othersDecrease = Math.round(popularityBoost * othersShare * 10) / 10;
                
                newPopularity.player2 = Math.max(0, Math.round((popularity.player2 - p2Decrease) * 10) / 10);
                newPopularity.others = Math.max(0, Math.round((popularity.others - othersDecrease) * 10) / 10);
            } else {
                newPopularity.player2 = 0;
                newPopularity.others = 0;
            }
            
        } else if (playerId === 2) {
            // Player 2 gets the rally boost
            newPopularity.player2 = Math.min(100, Math.round(popularity.player2 + popularityBoost));
            
            // The boost comes proportionally from player1 and others
            const totalOthers = popularity.player1 + popularity.others;
            
            if (totalOthers > 0) {
                const p1Share = popularity.player1 / totalOthers;
                const othersShare = popularity.others / totalOthers;
                
                const p1Decrease = Math.round(popularityBoost * p1Share * 10) / 10;
                const othersDecrease = Math.round(popularityBoost * othersShare * 10) / 10;
                
                newPopularity.player1 = Math.max(0, Math.round((popularity.player1 - p1Decrease) * 10) / 10);
                newPopularity.others = Math.max(0, Math.round((popularity.others - othersDecrease) * 10) / 10);
            } else {
                newPopularity.player1 = 0;
                newPopularity.others = 0;
            }
        }

        // Ensure total equals exactly 100%
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

        console.log(`Rally popularity update for ${stateId}: Player ${playerId} +${popularityBoost}%`);
        console.log('Old popularity:', popularity);
        console.log('New popularity:', newPopularity);

        // Update the popularity
        this.statePopularity.set(stateId, newPopularity);
        
        // Emit an event to notify the map controller
        window.dispatchEvent(new CustomEvent('popularityChanged', {
            detail: {
                stateId,
                popularity: newPopularity
            }
        }));
        
        // Record rally action
        this.recordRallyAction(stateId, playerId);
        
        // Check for group domination after rally
        setTimeout(async () => {
            try {
                const { stateGroups } = await import('./state-groups.js');
                stateGroups.scheduleGroupDominationCheck();
            } catch (error) {
                console.error('Error scheduling group domination check after rally:', error);
            }
        }, 100);
    }
    
    recordRallyAction(stateId, playerId) {
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
            actions.player1Rallies++;
        } else if (playerId === 2) {
            actions.player2Rallies++;
        }
        
        this.stateActions.set(stateId, actions);
        console.log(`Recorded rally action for player ${playerId} in ${stateId}. Total rallies: P1=${actions.player1Rallies}, P2=${actions.player2Rallies}`);
    }

    recordStateAction(stateId, playerId, cost) {
        console.log(`Recording state action for player ${playerId} in state ${stateId} with cost ${cost}`);
        
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
            actions.player1Spent += cost;
        } else if (playerId === 2) {
            actions.player2Spent += cost;
        }

        this.stateActions.set(stateId, actions);
        console.log(`Updated state actions for ${stateId}. P1 spent: ${actions.player1Spent}M, P2 spent: ${actions.player2Spent}M`);        // Calculate popularity boost based on spending
        // Base boost of 5% per campaign action, with minimal diminishing returns
        const totalSpent = playerId === 1 ? actions.player1Spent : actions.player2Spent;
        const diminishingFactor = Math.max(0.8, 1 - (totalSpent * 0.005)); // Very mild reduction over time
        const popularityBoost = 5 * diminishingFactor;        // Update state popularity
        this.updateStatePopularityFromCampaign(stateId, playerId, popularityBoost);

        // Log the action
        const playerName = this.getPlayerPartyName(playerId);
        const stateData = this.statesData.find(state => state.SvgId === stateId);
        const stateName = stateData ? stateData.State : stateId;
        
        try {
            import('./actions-log.js').then(({ actionsLog }) => {
                actionsLog.addAction(`${playerName} campaigned in ${stateName} (${cost}M spent, +${popularityBoost.toFixed(1)}% popularity)`);
            });
        } catch (error) {
            console.log(`${playerName} campaigned in ${stateName} (${cost}M spent, +${popularityBoost.toFixed(1)}% popularity)`);
        }
    }

    updateStatePopularityFromCampaign(stateId, playerId, popularityBoost) {
        if (!this.statePopularity.has(stateId)) {
            this.initializeState(stateId);
        }

        const popularity = this.statePopularity.get(stateId);
        
        // Create a new object to ensure reactivity
        const newPopularity = { ...popularity };

        // Campaign gives a fixed percentage boost with diminishing returns
        if (playerId === 1) {
            // Player 1 gets the campaign boost
            newPopularity.player1 = Math.min(100, Math.round(popularity.player1 + popularityBoost));
            
            // The boost comes proportionally from player2 and others
            const totalOthers = popularity.player2 + popularity.others;
            
            if (totalOthers > 0) {
                const p2Share = popularity.player2 / totalOthers;
                const othersShare = popularity.others / totalOthers;
                
                const p2Decrease = Math.round(popularityBoost * p2Share * 10) / 10;
                const othersDecrease = Math.round(popularityBoost * othersShare * 10) / 10;
                
                newPopularity.player2 = Math.max(0, Math.round((popularity.player2 - p2Decrease) * 10) / 10);
                newPopularity.others = Math.max(0, Math.round((popularity.others - othersDecrease) * 10) / 10);
            } else {
                newPopularity.player2 = 0;
                newPopularity.others = 0;
            }
            
        } else if (playerId === 2) {
            // Player 2 gets the campaign boost
            newPopularity.player2 = Math.min(100, Math.round(popularity.player2 + popularityBoost));
            
            // The boost comes proportionally from player1 and others
            const totalOthers = popularity.player1 + popularity.others;
            
            if (totalOthers > 0) {
                const p1Share = popularity.player1 / totalOthers;
                const othersShare = popularity.others / totalOthers;
                
                const p1Decrease = Math.round(popularityBoost * p1Share * 10) / 10;
                const othersDecrease = Math.round(popularityBoost * othersShare * 10) / 10;
                
                newPopularity.player1 = Math.max(0, Math.round((popularity.player1 - p1Decrease) * 10) / 10);
                newPopularity.others = Math.max(0, Math.round((popularity.others - othersDecrease) * 10) / 10);
            } else {
                newPopularity.player1 = 0;
                newPopularity.others = 0;
            }
        }

        // Ensure total equals exactly 100%
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

        console.log(`Campaign popularity update for ${stateId}: Player ${playerId} +${popularityBoost.toFixed(1)}%`);
        console.log('Old popularity:', popularity);
        console.log('New popularity:', newPopularity);

        // Update the popularity
        this.statePopularity.set(stateId, newPopularity);
        
        // Emit an event to notify the map controller
        window.dispatchEvent(new CustomEvent('popularityChanged', {
            detail: {
                stateId,
                popularity: newPopularity
            }
        }));
        
        // Check for group domination after campaign
        setTimeout(async () => {
            try {
                const { stateGroups } = await import('./state-groups.js');
                stateGroups.scheduleGroupDominationCheck();
            } catch (error) {
                console.error('Error scheduling group domination check after campaign:', error);
            }
        }, 100);
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

        // Initialize or get state data
        const state = this.initializeState(stateId);
        const popularity = state.popularity;
        
        // Get state groups list and domination status (synchronously now)
        let groupsWithStatus = [];
        if (this.stateGroups) {
            const stateGroupsList = this.stateGroups.getGroupsForState(stateId);
            
            // Format the groups list with domination status
            groupsWithStatus = stateGroupsList.map(groupName => {
                const dominationStatus = this.stateGroups.groupDominationStatus.get(groupName);
                let marker = '';
                if (dominationStatus === 1) {
                    marker = ' 🟠'; // Orange circle for Player 1
                } else if (dominationStatus === 2) {
                    marker = ' 🟢'; // Green circle for Player 2
                }
                return `${groupName}${marker}`;
            });
        }

        // If this is the same state as currently displayed, just update the values
        if (this.currentStateId === stateId && this.stateInfoElements) {
            this.stateInfoElements.p1Value.textContent = `P1: ${Math.round(popularity.player1)}%`;
            this.stateInfoElements.p2Value.textContent = `P2: ${Math.round(popularity.player2)}%`;
            this.stateInfoElements.othersValue.textContent = `Others: ${Math.round(popularity.others)}%`;
            this.stateInfoElements.groupsList.textContent = groupsWithStatus.join(' • ');
            this.stateInfoElements.groupsCount.textContent = `Groups (${groupsWithStatus.length})`;
            return;
        }

        // Full rebuild for new state
        this.currentStateId = stateId;
        this.statesDetails.innerHTML = `
            <div class="state-info">
                <h4>${stateData.State} (${stateData.LokSabhaSeats} seats)</h4>
                  <div class="popularity-section">
                    <h5>Current Popularity</h5>
                    <div class="info-row">
                        <span class="p1-value">P1: ${Math.round(popularity.player1)}%</span>
                        <span class="p2-value">P2: ${Math.round(popularity.player2)}%</span>
                        <span class="others-value">Others: ${Math.round(popularity.others)}%</span>
                    </div>
                </div>

                <div class="groups-section">
                    <h5 class="groups-count">Groups (${groupsWithStatus.length})</h5>
                    <div class="groups-list">
                        ${groupsWithStatus.join(' • ')}
                    </div>
                </div>
            </div>
        `;
        
        // Cache DOM elements for faster future updates
        this.stateInfoElements = {
            p1Value: this.statesDetails.querySelector('.p1-value'),
            p2Value: this.statesDetails.querySelector('.p2-value'),
            othersValue: this.statesDetails.querySelector('.others-value'),
            groupsList: this.statesDetails.querySelector('.groups-list'),
            groupsCount: this.statesDetails.querySelector('.groups-count')
        };
    }

    formatGroupName(key) {
        return key.replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase())
            .trim();
    }    // Force immediate update of state popularity and color
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
        
        // Check for group domination after all states have been updated
        setTimeout(async () => {
            try {
                console.log("Force checking all groups domination after updating all states");
                const { stateGroups } = await import('./state-groups.js');
                await stateGroups.checkAllGroupsDomination();
            } catch (error) {
                console.error('Error checking group domination after force update:', error);
            }
        }, 500);
    }

    // Get game configuration for dynamic party names
    loadGameConfiguration() {
        try {
            const gameConfig = localStorage.getItem('gameConfig');
            if (gameConfig) {
                this.gameConfig = JSON.parse(gameConfig);
            } else {
                console.warn('No game configuration found, using defaults');
                this.gameConfig = {
                    player1Politician: { party: 'Player 1' },
                    player2Politician: { party: 'Player 2' }
                };
            }
        } catch (error) {
            console.error('Error loading game configuration:', error);
            this.gameConfig = {
                player1Politician: { party: 'Player 1' },
                player2Politician: { party: 'Player 2' }
            };
        }
    }
    
    // Get party name for a player
    getPlayerPartyName(playerId) {
        if (!this.gameConfig) {
            this.loadGameConfiguration();
        }
        return playerId === 1 
            ? (this.gameConfig.player1Politician?.party || 'Player 1')
            : (this.gameConfig.player2Politician?.party || 'Player 2');
    }
}

// Create and export a single instance
export const stateInfo = new StateInfo();
