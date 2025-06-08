// Map interaction and state management
class MapController {
    constructor() {
        this.svgDocument = null;
        this.selectedStates = new Set();
        this.statesData = null;
        this.rippleContainer = null;
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
            
            // Create ripple container
            this.createRippleContainer();
            
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
        const style = this.svgDocument.createElementNS("http://www.w3.org/2000/svg", "style");        style.textContent = `
            path, polygon {
                cursor: pointer !important;
                pointer-events: all !important;
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
              state.addEventListener('click', (e) => this.handleStateClick(e));
            state.addEventListener('mouseover', (e) => this.handleStateHover(e));
            state.addEventListener('mouseout', (e) => this.handleStateUnhover(e));
        });

        // Listen for events from UT buttons
        window.addEventListener('stateClick', async (event) => {
            console.log('Received stateClick event:', event);
            
            const { stateId } = event.detail;
            if (!stateId) {
                console.error('No stateId in event detail');
                return;
            }

            console.log('Processing click for state:', stateId);

            try {
                // Get state data and calculate cost
                if (!this.statesData) {
                    const response = await fetch('states_data.json');
                    this.statesData = await response.json();
                }

                const stateData = this.statesData.find(state => state.SvgId === stateId);
                if (!stateData) {
                    console.error('No state data found for:', stateId);
                    return;
                }

                console.log('Found state data:', stateData);

                const seats = parseInt(stateData.LokSabhaSeats);
                const cost = seats; // Cost in millions = number of seats

                console.log('State cost:', cost);

                // Import required modules
                const [playerModule, stateModule] = await Promise.all([
                    import('./player-info.js'),
                    import('./state-info.js')
                ]);

                const player1 = playerModule.player1;
                const stateInfo = stateModule.stateInfo;

                // Check if player 1 has enough funds
                if (player1.canSpend(cost)) {
                    console.log('Player has enough funds, processing action...');
                    
                    // Deduct funds and record the action
                    player1.updateFunds(-cost);
                    stateInfo.recordStateAction(stateId, 1, cost);
                    
                    console.log('Action processed successfully');
                } else {
                    console.log('Insufficient funds. Required:', cost, 'Available:', player1.funds);
                    player1.showInsufficientFundsError();
                }
            } catch (error) {
                console.error('Error processing state click:', error);
            }
        });

        // Add hover event listeners for UT buttons
        window.addEventListener('stateHover', (event) => {
            const { stateId } = event.detail;
            if (!stateId) return;
            
            const stateElement = this.svgDocument.getElementById(stateId);
            if (stateElement) {
                this.handleStateHover({ target: stateElement });
            }
        });

        window.addEventListener('stateUnhover', (event) => {
            const { stateId } = event.detail;
            if (!stateId) return;
            
            const stateElement = this.svgDocument.getElementById(stateId);
            if (stateElement) {
                this.handleStateUnhover({ target: stateElement });
            }
        });
    }    handleStateClick(event) {
        const stateElement = event.target;
        const stateId = stateElement.id;
        const stateData = this.statesData.find(state => state.SvgId === stateId);
        
        if (!stateData) return;

        const seats = parseInt(stateData.LokSabhaSeats);
        const cost = seats; // Cost in millions = number of seats

        // Get click coordinates for ripple effect
        const svgPoint = this.svgDocument.querySelector('svg').createSVGPoint();
        svgPoint.x = event.clientX;
        svgPoint.y = event.clientY;
        const point = svgPoint.matrixTransform(stateElement.getScreenCTM().inverse());

        // Import required modules
        Promise.all([
            import('./player-info.js'),
            import('./state-info.js')
        ]).then(([playerModule, stateModule]) => {
            const player1 = playerModule.player1;
            const stateInfo = stateModule.stateInfo;
            
            // Check if state is already selected
            const isSelected = this.selectedStates.has(stateId);
            console.log(`${stateId} is currently selected:`, isSelected);

            // Check if player 1 has enough funds
            if (player1.canSpend(cost)) {
                // Create ripple effect
                this.createRippleEffect(point.x, point.y, 1);
                
                // Deduct funds and record the action
                player1.updateFunds(-cost);
                stateInfo.recordStateAction(stateId, 1, cost);
                
                // Visual feedback - select only if not already selected
                if (!isSelected) {
                    console.log(`Selecting state: ${stateId}`);
                    this.selectState(stateId);
                } else {
                    // If already selected, toggle selection state
                    console.log(`Deselecting state: ${stateId}`);
                    this.deselectState(stateId);
                }
            } else {
                // Visual feedback for insufficient funds
                stateElement.classList.add('error');
                setTimeout(() => stateElement.classList.remove('error'), 500);
                
                // Show shake animation on funds display
                player1.showInsufficientFundsError();
            }
        });
    }

    selectState(stateId) {
        const stateElement = this.svgDocument.getElementById(stateId);
        if (stateElement) {
            console.log(`Selecting state: ${stateId}`);
            
            // Store original leader data before selection
            const currentLeader = stateElement.getAttribute('data-leader');
            stateElement.setAttribute('data-prev-leader', currentLeader || 'others');
            
            // Mark as selected
            stateElement.setAttribute('data-selected', 'true');
            this.selectedStates.add(stateId);
            
            this.triggerStateSelectionEvent(stateId, true);
        }
    }

    deselectState(stateId) {
        const stateElement = this.svgDocument.getElementById(stateId);
        if (stateElement) {
            console.log(`Deselecting state: ${stateId}`);
            
            // Remove selected marker
            stateElement.removeAttribute('data-selected');
            this.selectedStates.delete(stateId);
            
            // Get current popularity data and update color
            Promise.all([
                import('./state-info.js')
            ]).then(([stateModule]) => {
                const stateInfo = stateModule.stateInfo;
                const popularity = stateInfo.getStatePopularity(stateId);
                
                if (popularity) {
                    // Update state color based on current popularity data
                    this.updateStateColor(stateId, popularity);
                } else {
                    console.log(`No popularity data found for ${stateId}, using fallback`);
                    // This is just a fallback that should rarely be needed
                    stateElement.setAttribute('fill', '#9E9E9E'); // Grey for Others
                    stateElement.setAttribute('data-leader', 'others');
                }
                
                this.triggerStateSelectionEvent(stateId, false);
            });
        }
    }

    resetStateSelection(stateId) {
        const stateElement = this.svgDocument.getElementById(stateId);
        if (stateElement && this.selectedStates.has(stateId)) {
            console.log(`Resetting selection for state: ${stateId}`);
            
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

        // Determine the leader based on popularity
        let leader = 'others';
        if (roundedP1 > roundedP2 && roundedP1 > roundedOthers) {
            leader = 'player1';
        } else if (roundedP2 > roundedP1 && roundedP2 > roundedOthers) {
            leader = 'player2';
        }
        
        console.log(`${stateId} leader determined as: ${leader}`);
        
        // Always update the data-leader attribute
        stateElement.setAttribute('data-leader', leader);
        
        // Update UT button if this state has one
        this.updateUTButtonColor(stateId, popularityData);

        // Set fill color based on who's leading with intensity proportional to popularity
        if (leader === 'player1') {
            // Calculate color intensity for Player 1 (orange) based on popularity percentage
            const intensity = Math.max(30, Math.min(100, roundedP1)); // Clamp between 30-100%
            const normalizedIntensity = intensity / 100;
            
            // Start with light orange (#FFEBCC) and go to deep orange (#FF7700)
            const r = Math.round(255);
            const g = Math.round(119 + (235 - 119) * (1 - normalizedIntensity));
            const b = Math.round(0 + (204 - 0) * (1 - normalizedIntensity));
            
            const color = `rgb(${r}, ${g}, ${b})`;
            console.log(`${stateId}: Setting to Player 1 color (${color}) with ${roundedP1}%`);
            
            stateElement.setAttribute('fill', color);
        } else if (leader === 'player2') {
            // Calculate color intensity for Player 2 (green) based on popularity percentage
            const intensity = Math.max(30, Math.min(100, roundedP2)); // Clamp between 30-100%
            const normalizedIntensity = intensity / 100;
            
            // Start with light green (#E0F2E0) and go to deep green (#00A000)
            const r = Math.round(0 + (224 - 0) * (1 - normalizedIntensity));
            const g = Math.round(160 + (242 - 160) * (1 - normalizedIntensity));
            const b = Math.round(0 + (224 - 0) * (1 - normalizedIntensity));
            
            const color = `rgb(${r}, ${g}, ${b})`;
            console.log(`${stateId}: Setting to Player 2 color (${color}) with ${roundedP2}%`);
            
            stateElement.setAttribute('fill', color);
        } else {
            // Others is leading
            const intensity = Math.max(30, Math.min(100, roundedOthers)); // Clamp between 30-100%
            const normalizedIntensity = intensity / 100;
            
            // Start with light grey (#E0E0E0) and go to darker grey (#707070)
            const colorValue = Math.round(112 + (224 - 112) * (1 - normalizedIntensity));
            const color = `rgb(${colorValue}, ${colorValue}, ${colorValue})`;
            
            console.log(`${stateId}: Setting to Others color (${color}) with ${roundedOthers}%`);
            stateElement.setAttribute('fill', color);
        }
    }

    updateUTButtonColor(stateId, popularity) {
        const button = document.querySelector(`.small-uts-grid button[data-ut="${stateId}"]`);
        if (!button) return;

        const roundedP1 = Math.round(popularity.player1);
        const roundedP2 = Math.round(popularity.player2);
        const roundedOthers = Math.round(popularity.others);

        // Determine who's leading
        let leader = 'others';
        if (roundedP1 > roundedP2 && roundedP1 > roundedOthers) {
            leader = 'player1';
        } else if (roundedP2 > roundedP1 && roundedP2 > roundedOthers) {
            leader = 'player2';
        }

        // Update button appearance
        button.setAttribute('data-leading', leader);
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
    
    createRippleContainer() {
        if (!this.svgDocument) return;
        
        const svgElement = this.svgDocument.querySelector('svg');
        if (!svgElement) return;
        
        // Create ripple container
        this.rippleContainer = document.createElementNS("http://www.w3.org/2000/svg", "g");
        this.rippleContainer.setAttribute("class", "ripple-container");
        
        // Add to SVG
        svgElement.appendChild(this.rippleContainer);
    }
    
    createRippleEffect(x, y, playerId) {
        if (!this.rippleContainer) return;
          // Create ripple circle
        const ripple = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        ripple.setAttribute("class", `ripple player${playerId}`);
        ripple.setAttribute("cx", x);
        ripple.setAttribute("cy", y);
        ripple.setAttribute("r", "10");
        
        // Set color based on player
        if (playerId === 1) {
            ripple.setAttribute("fill", getComputedStyle(document.documentElement).getPropertyValue('--player1-color').trim());
        } else {
            ripple.setAttribute("fill", getComputedStyle(document.documentElement).getPropertyValue('--player2-color').trim());
        }
        
        // Add animation
        const animation = document.createElementNS("http://www.w3.org/2000/svg", "animate");
        animation.setAttribute("attributeName", "r");
        animation.setAttribute("from", "10");
        animation.setAttribute("to", "50");
        animation.setAttribute("dur", "0.6s");
        animation.setAttribute("fill", "freeze");
        
        const opacityAnimation = document.createElementNS("http://www.w3.org/2000/svg", "animate");
        opacityAnimation.setAttribute("attributeName", "opacity");
        opacityAnimation.setAttribute("from", "0.6");
        opacityAnimation.setAttribute("to", "0");
        opacityAnimation.setAttribute("dur", "0.6s");
        opacityAnimation.setAttribute("fill", "freeze");
        
        ripple.appendChild(animation);
        ripple.appendChild(opacityAnimation);
        
        // Add to container
        this.rippleContainer.appendChild(ripple);
        
        // Start animation
        animation.beginElement();
        opacityAnimation.beginElement();
        
        // Remove after animation completes
        setTimeout(() => {
            if (this.rippleContainer.contains(ripple)) {
                this.rippleContainer.removeChild(ripple);
            }
        }, 600);
    }
}

// Create and export a single instance of MapController
export const mapController = new MapController();
