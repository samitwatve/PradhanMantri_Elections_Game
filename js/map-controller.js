// Map interaction and state management
class MapController {
    constructor() {
        this.svgDocument = null;
        this.selectedStates = new Set();
        this.statesData = null;
        this.initialize();
    }    async initialize() {
        try {
            // Load states data
            const response = await fetch('states_data.json');
            this.statesData = await response.json();
            
            // Get map object and wait for it to load
            const map = document.getElementById('india-map');
            await new Promise(resolve => {
                const onLoad = () => {
                    this.svgDocument = map.contentDocument;
                    this.injectSvgStyles();
                    resolve();
                };

                if (map.contentDocument && map.contentDocument.documentElement) {
                    onLoad();
                } else {
                    map.addEventListener('load', onLoad);
                }
            });

            // Setup interactions after SVG is loaded
            this.setupStateInteractions();
            
            // Listen for popularity changes
            window.addEventListener('popularityChanged', (event) => {
                const { stateId, popularity } = event.detail;
                console.log(`Popularity changed for ${stateId}:`, popularity);
                this.updateStateColor(stateId, popularity);
            });

            // Import state info and initialize all states with colors after a short delay
            setTimeout(async () => {
                const { stateInfo } = await import('./state-info.js');
                
                // Find all states in the SVG
                const states = this.svgDocument.querySelectorAll('path');
                states.forEach(state => {
                    if (state.id) {
                        // Initialize state if needed
                        let popularity = stateInfo.getStatePopularity(state.id);
                        if (!popularity) {
                            const stateData = stateInfo.initializeState(state.id);
                            popularity = stateData.popularity;
                        }
                        
                        // Apply color immediately
                        this.updateStateColor(state.id, popularity);
                        console.log(`Initialized ${state.id} with popularity:`, popularity);
                    }
                });
                
                console.log("All states should now be colored");
            }, 500);

        } catch (error) {
            console.error('Failed to initialize map:', error);
        }
    }

    injectSvgStyles() {
        if (!this.svgDocument) return;

        // Create a style element
        const style = this.svgDocument.createElementNS("http://www.w3.org/2000/svg", "style");
        style.textContent = `
            path, polygon {
                cursor: pointer;
            }
            
            path.error {
                fill: #ff0000;
                animation: shake 0.5s;
            }
            
            @keyframes shake {
                0%, 100% { transform: translateX(0); }
                25% { transform: translateX(-5px); }
                75% { transform: translateX(5px); }
            }
        `;

        // Insert the style element into the SVG
        const svgElement = this.svgDocument.querySelector('svg');
        if (svgElement) {
            svgElement.insertBefore(style, svgElement.firstChild);
        }
    }

    setupStateInteractions() {
        if (!this.svgDocument) return;

        const states = this.svgDocument.querySelectorAll('path, polygon');
        states.forEach(state => {
            if (!state.id) return;
            
            // Ensure pointer cursor is visible
            state.style.cursor = 'pointer';
            
            state.addEventListener('click', (e) => this.handleStateClick(e));
            state.addEventListener('mouseover', (e) => this.handleStateHover(e));
            state.addEventListener('mouseout', (e) => this.handleStateUnhover(e));
        });
    }

    handleStateClick(event) {
        const stateElement = event.target;
        const stateId = stateElement.id;
        const stateData = this.statesData.find(state => state.SvgId === stateId);
        
        if (!stateData) return;

        const seats = parseInt(stateData.LokSabhaSeats);
        const cost = seats; // Cost in millions = number of seats

        // Import required modules
        Promise.all([
            import('./player-info.js'),
            import('./state-info.js')
        ]).then(([playerModule, stateModule]) => {
            const player1 = playerModule.player1;
            const stateInfo = stateModule.stateInfo;
            
            // Check if state is already selected
            const isSelected = this.selectedStates.has(stateId);

            // Check if player 1 has enough funds
            if (player1.canSpend(cost)) {
                // Deduct funds and record the action
                player1.updateFunds(-cost);
                stateInfo.recordStateAction(stateId, 1, cost);
                
                // Visual feedback - select only if not already selected
                if (!isSelected) {
                    this.selectState(stateId);
                } else {
                    // If already selected, do not toggle - just update the popularity
                    const popularity = stateInfo.getStatePopularity(stateId);
                    this.updateStateColor(stateId, popularity);
                }
            } else {
                // Visual feedback for insufficient funds
                stateElement.classList.add('error');
                setTimeout(() => stateElement.classList.remove('error'), 500);
            }
        });
    }

    selectState(stateId) {
        const stateElement = this.svgDocument.getElementById(stateId);
        if (stateElement) {
            // Store original leader data before selection
            const currentLeader = stateElement.getAttribute('data-leader');
            stateElement.setAttribute('data-prev-leader', currentLeader || 'others');
            
            // Mark as selected but DO NOT change data-leader attribute
            // This way we maintain the proper leader information
            stateElement.setAttribute('data-selected', 'true');
            stateElement.setAttribute('fill', '#FF9800'); // Player 1 color for selection
            
            this.selectedStates.add(stateId);
            this.triggerStateSelectionEvent(stateId, true);
        }
    }

    deselectState(stateId) {
        const stateElement = this.svgDocument.getElementById(stateId);
        if (stateElement) {
            // Remove selected marker
            stateElement.removeAttribute('data-selected');
            
            // Instead of using prev-leader data, request a fresh update from state-info
            // This ensures we always get the most current popularity data
            Promise.all([
                import('./state-info.js')
            ]).then(([stateModule]) => {
                const stateInfo = stateModule.stateInfo;
                const popularity = stateInfo.getStatePopularity(stateId);
                
                if (popularity) {
                    // Update state color based on current popularity data
                    this.updateStateColor(stateId, popularity);
                } else {
                    // Fallback to prev-leader if no popularity data found
                    const prevLeader = stateElement.getAttribute('data-prev-leader') || 'others';
                    
                    if (prevLeader === 'player1') {
                        stateElement.setAttribute('fill', '#FF9800'); // Orange for Player 1
                        stateElement.setAttribute('data-leader', 'player1');
                    } else if (prevLeader === 'player2') {
                        stateElement.setAttribute('fill', '#4CAF50'); // Green for Player 2
                        stateElement.setAttribute('data-leader', 'player2');
                    } else {
                        stateElement.setAttribute('fill', '#9E9E9E'); // Grey for Others
                        stateElement.setAttribute('data-leader', 'others');
                    }
                }
                
                this.selectedStates.delete(stateId);
                this.triggerStateSelectionEvent(stateId, false);
            });
        }
    }

    resetStateSelection(stateId) {
        const stateElement = this.svgDocument.getElementById(stateId);
        if (stateElement && this.selectedStates.has(stateId)) {
            // Remove the state from selected states
            this.selectedStates.delete(stateId);
            
            // Remove selection data attributes
            stateElement.removeAttribute('data-selected');
            
            // Force a color update based on current popularity
            Promise.all([
                import('./state-info.js')
            ]).then(([stateModule]) => {
                const stateInfo = stateModule.stateInfo;
                const popularity = stateInfo.getStatePopularity(stateId);
                if (popularity) {
                    this.updateStateColor(stateId, popularity);
                }
            });
            
            // Trigger selection event
            this.triggerStateSelectionEvent(stateId, false);
        }
    }
    
    // Helper to reset all selected states
    resetAllSelections() {
        console.log("Resetting all state selections");
        const selectedStatesCopy = [...this.selectedStates]; // Create a copy to iterate over
        
        selectedStatesCopy.forEach(stateId => {
            this.resetStateSelection(stateId);
        });
    }

    handleStateHover(event) {
        const stateElement = event.target;
        const stateId = stateElement.id;
        
        // Don't change fill color on hover, just emit event
        console.log('Hovering over state:', stateId);

        // Emit hover event with state ID
        window.dispatchEvent(new CustomEvent('stateHover', {
            detail: {
                stateId: stateId
            }
        }));
    }

    handleStateUnhover(event) {
        // No need to do anything here - colors are maintained by data attributes
    }    updateStateColor(stateId, popularityData) {
        const stateElement = this.svgDocument.getElementById(stateId);
        if (!stateElement) {
            console.log('State element not found:', stateId);
            return;
        }

        // Compare popularities to determine leader
        const { player1 = 0, player2 = 0, others = 0 } = popularityData;
        const roundedP1 = Math.round(player1);
        const roundedP2 = Math.round(player2);
        const roundedOthers = Math.round(others);

        console.log(`State ${stateId} popularity:`, { 
            player1: roundedP1, 
            player2: roundedP2, 
            others: roundedOthers 
        });

        // Check if the state is currently selected
        const isSelected = stateElement.getAttribute('data-selected') === 'true';
        
        // If selected, don't change the fill color, but update the data-leader attribute
        if (isSelected) {
            // Just update the leader data but don't change the orange color
            if (roundedP1 > roundedP2 && roundedP1 > roundedOthers) {
                stateElement.setAttribute('data-leader', 'player1');
            } else if (roundedP2 > roundedP1 && roundedP2 > roundedOthers) {
                stateElement.setAttribute('data-leader', 'player2');
            } else {
                stateElement.setAttribute('data-leader', 'others');
            }
            // Keep the selection color (orange)
            stateElement.setAttribute('fill', '#FF9800');
            return;
        }
        
        // If not selected, set fill color directly based on who's leading
        if (roundedP1 > roundedP2 && roundedP1 > roundedOthers) {
            console.log(`${stateId}: Setting to Player 1 color (orange) with ${roundedP1}%`);
            stateElement.setAttribute('fill', '#FF9800'); // Orange for Player 1
            stateElement.setAttribute('data-leader', 'player1');
        } else if (roundedP2 > roundedP1 && roundedP2 > roundedOthers) {
            console.log(`${stateId}: Setting to Player 2 color (green) with ${roundedP2}%`);
            stateElement.setAttribute('fill', '#4CAF50'); // Green for Player 2
            stateElement.setAttribute('data-leader', 'player2');
        } else {
            console.log(`${stateId}: Setting to Others color (grey) with ${roundedOthers}%`);
            stateElement.setAttribute('fill', '#9E9E9E'); // Grey for Others
            stateElement.setAttribute('data-leader', 'others');
        }
    }

    triggerStateSelectionEvent(stateId, selected) {
        const event = new CustomEvent('stateSelection', {
            detail: {
                stateId: stateId,
                selected: selected
            }
        });
        window.dispatchEvent(event);
    }
}

// Create and export a single instance of MapController
export const mapController = new MapController();
