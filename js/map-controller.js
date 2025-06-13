// Map interaction and state management
import { player1 } from './player-info.js';
import { stateInfo } from './state-info.js';
import { gameOptions, isGamePaused } from './game-options.js';
import { rallyController } from './rally-controller.js';

class MapController {
    constructor() {
        this.svgDocument = null;
        this.selectedStates = new Set();
        this.statesData = null;
        this.rippleContainer = null;
        this.highlightedStates = new Set();
        this.initialize();
    }async initialize() {
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
            });            // Setup interactions after SVG is loaded
            this.setupStateInteractions();
            this.setupStateDropZones();
            
            // Create ripple container
            this.createRippleContainer();
              // Listen for popularity changes
            window.addEventListener('popularityChanged', async (event) => {
                const { stateId, popularity } = event.detail;
                console.log(`Popularity changed for ${stateId}:`, popularity);
                this.updateStateColor(stateId, popularity);
                
                // Check for group domination after a short delay
                setTimeout(async () => {
                    try {
                        const { stateGroups } = await import('./state-groups.js');
                        stateGroups.scheduleGroupDominationCheck();
                    } catch (error) {
                        console.error('Error checking group domination:', error);
                    }
                }, 100);
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
                
                // Check for group domination once all states are colored
                setTimeout(async () => {
                    try {
                        const { stateGroups } = await import('./state-groups.js');
                        console.log('Initial check for group domination after all states are colored');
                        await stateGroups.checkAllGroupsDomination();
                    } catch (error) {
                        console.error('Error checking group domination:', error);
                    }
                }, 1000);
            }, 500);

        } catch (error) {
            console.error('Failed to initialize map:', error);
        }        // Add event listener for state highlighting
        window.addEventListener('toggleStateHighlight', (event) => {
            const { stateId, forceState, forceOff } = event.detail;
            this.toggleStateHighlight(stateId, forceState, forceOff);
        });
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
    }    setupStateInteractions() {
        if (!this.svgDocument) return;

        const states = this.svgDocument.querySelectorAll('path, polygon');        states.forEach(state => {
            if (!state.id) return;
              state.addEventListener('mousedown', (e) => this.handleStateClick(e));
            state.addEventListener('mouseover', (e) => this.handleStateHover(e));
            state.addEventListener('mouseout', (e) => this.handleStateUnhover(e));
        });        // Add interaction for Lakshadweep bounding box
        const lakshadweepBbox = this.svgDocument.getElementById('bbox-lakshadweep');
        if (lakshadweepBbox) {
            lakshadweepBbox.addEventListener('mousedown', (e) => {
                this.handleLakshadweepClick(e);
            });
            lakshadweepBbox.addEventListener('mouseover', (e) => {
                const syntheticEvent = {
                    ...e,
                    target: { ...e.target, id: 'INLD' }
                };
                this.handleStateHover(syntheticEvent);
            });
            lakshadweepBbox.addEventListener('mouseout', (e) => {
                const syntheticEvent = {
                    ...e,
                    target: { ...e.target, id: 'INLD' }
                };
                this.handleStateUnhover(syntheticEvent);
            });
        }        // Listen for events from UT buttons
        window.addEventListener('stateClick', async (event) => {
            console.log('Received stateClick event:', event);
            
            // Check if game is paused - prevent state interaction while paused
            if (isGamePaused()) {
                console.log('Game is paused - state click event ignored');
                return;
            }
            
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
                const stateInfo = stateModule.stateInfo;                // Check if player 1 has enough funds
                if (player1.canSpend(cost)) {
                    console.log('Player has enough funds, processing action...');
                    
                    // Regular campaign action
                    // Deduct funds and record the action
                    player1.updateFunds(-cost);
                    stateInfo.recordStateAction(stateId, 1, cost);
                    console.log('Campaign action processed successfully');
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
    }    async handleStateClick(event) {
        // Check if game is paused - prevent state interaction while paused
        if (isGamePaused()) {
            console.log('Game is paused - state click ignored');
            return;
        }
        
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

        // Regular campaign logic
        // Check if state is already selected
        const isSelected = this.selectedStates.has(stateId);
        console.log(`${stateId} is currently selected:`, isSelected);        // Check if player 1 has enough funds
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
            
            // Immediately update state info panel to show changes
            window.dispatchEvent(new CustomEvent('stateHover', {
                detail: { stateId: stateId }
            }));
        } else {
            // Visual feedback for insufficient funds
            stateElement.classList.add('error');
            setTimeout(() => stateElement.classList.remove('error'), 500);
            
            // Show shake animation on funds display
            player1.showInsufficientFundsError();
        }
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
        
        // After updating the color, check for group domination
        // This ensures that if a state becomes > 50% for a player, groups are checked
        setTimeout(async () => {
            try {
                const { stateGroups } = await import('./state-groups.js');
                stateGroups.scheduleGroupDominationCheck();
            } catch (error) {
                console.error('Error scheduling group domination check after color update:', error);
            }
        }, 100);
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
    }    toggleStateHighlight(stateId, forceState = null, forceOff = false) {
        if (!this.svgDocument) return;

        const statePath = this.svgDocument.getElementById(stateId);
        if (!statePath) {
            console.warn(`State path not found for ID: ${stateId}`);
            return;
        }

        // Force off takes precedence
        if (forceOff) {
            console.log(`Force removing highlight from state: ${stateId}`);
            this.highlightedStates.delete(stateId);
            statePath.style.stroke = '';
            statePath.style.strokeWidth = '';
            statePath.style.filter = '';
            return;
        }

        // If forceState is provided, use it; otherwise toggle
        const shouldHighlight = forceState !== null ? forceState : !this.highlightedStates.has(stateId);

        if (shouldHighlight) {
            console.log(`Adding highlight to state: ${stateId}`);
            this.highlightedStates.add(stateId);
            statePath.style.stroke = '#ffffff'; // White color for highlight
            statePath.style.strokeWidth = '3';
            statePath.style.filter = 'drop-shadow(0 0 3px rgba(255, 255, 255, 0.7))';
        } else {
            console.log(`Removing highlight from state: ${stateId}`);
            this.highlightedStates.delete(stateId);
            statePath.style.stroke = '';
            statePath.style.strokeWidth = '';
            statePath.style.filter = '';
        }    }

    handleLakshadweepClick(event) {
        // Handle click on Lakshadweep bounding box
        const stateId = 'INLD'; // Lakshadweep's SVG ID
        const stateData = this.statesData.find(state => state.SvgId === stateId);
        
        if (!stateData) return;

        const seats = parseInt(stateData.LokSabhaSeats);
        const cost = seats; // Cost in millions = number of seats

        // Get the actual state element for visual feedback
        const stateElement = this.svgDocument.getElementById(stateId);
        if (!stateElement) return;

        // For ripple effect, use the center of the bounding box
        const bbox = event.target.getBBox();
        const centerX = bbox.x + bbox.width / 2;
        const centerY = bbox.y + bbox.height / 2;

        // Check if state is already selected
        const isSelected = this.selectedStates.has(stateId);
        console.log(`${stateId} is currently selected:`, isSelected);

        // Check if player 1 has enough funds
        if (player1.canSpend(cost)) {
            // Create ripple effect at the center of the bounding box
            this.createRippleEffect(centerX, centerY, 1);
              
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
    }    setupStateDropZones() {
        console.log('Setting up simplified drop zone for rally tokens');
        
        // Set up the main map container as the primary drop zone
        const mapContainer = document.querySelector('.map-container');
        if (!mapContainer) {
            console.log('Map container not found');
            return;
        }
          // Remove existing event listeners to avoid duplicates
        mapContainer.removeEventListener('dragover', this.handleMapDragOver);
        mapContainer.removeEventListener('dragenter', this.handleMapDragEnter);
        mapContainer.removeEventListener('drop', this.handleMapDrop);
        
        // Add drag enter event
        this.handleMapDragEnter = (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Drag enter map container');
        };
          // Add drag over event to allow dropping
        this.handleMapDragOver = (e) => {
            e.preventDefault();
            e.stopPropagation();
            e.dataTransfer.dropEffect = 'move';
            console.log('Drag over map container - drop effect set to move');
        };
        
        // Add drop event to handle rally placement
        this.handleMapDrop = async (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const dragData = e.dataTransfer.getData('text/plain');
            console.log('Drop on map container, drag data:', dragData);
            
            if (dragData === 'rally-token') {
                // Get the element under the mouse cursor
                const elementUnderMouse = document.elementFromPoint(e.clientX, e.clientY);
                console.log('Element under mouse:', elementUnderMouse);
                
                // Check if we need to look inside the SVG
                let targetStateId = null;
                
                if (elementUnderMouse && elementUnderMouse.tagName === 'OBJECT') {
                    // We dropped on the SVG object, need to find the state inside it
                    const svgDoc = elementUnderMouse.contentDocument;
                    if (svgDoc) {
                        // Get the SVG's bounding rect and calculate relative position
                        const svgRect = elementUnderMouse.getBoundingClientRect();
                        const relativeX = e.clientX - svgRect.left;
                        const relativeY = e.clientY - svgRect.top;
                        
                        // Find element at position in SVG document
                        const svgElement = svgDoc.elementFromPoint(relativeX, relativeY);
                        console.log('SVG element found:', svgElement);
                        
                        if (svgElement && svgElement.tagName === 'path' && svgElement.id) {
                            targetStateId = svgElement.id;
                        }
                    }
                } else if (elementUnderMouse && elementUnderMouse.id) {
                    // Direct hit on a state element
                    targetStateId = elementUnderMouse.id;
                }
                
                console.log('Target state ID:', targetStateId);
                
                if (targetStateId) {
                    // Dispatch rally drop event
                    const rallyEvent = new CustomEvent('rallyDrop', {
                        detail: { stateId: targetStateId }
                    });
                    window.dispatchEvent(rallyEvent);
                    console.log(`Dispatched rallyDrop event for ${targetStateId}`);
                } else {
                    console.log('No valid state found under drop location');
                }
            }
        };
          mapContainer.addEventListener('dragenter', this.handleMapDragEnter);
        mapContainer.addEventListener('dragover', this.handleMapDragOver);
        mapContainer.addEventListener('drop', this.handleMapDrop);
          console.log('Map container drop zone set up successfully');
        
        // ALSO set up drop zones directly on the SVG document
        this.setupSVGDropZones();
        
        // Also set up drop zones for UT buttons
        this.setupUTDropZones();
    }
    
    setupSVGDropZones() {
        if (!this.svgDocument) {
            console.log('SVG document not available for direct drop zone setup');
            return;
        }
        
        console.log('Setting up direct SVG drop zones');
        
        // Make the entire SVG accept drops
        const svgElement = this.svgDocument.querySelector('svg');
        if (svgElement) {
            svgElement.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.stopPropagation();
                e.dataTransfer.dropEffect = 'move';
                console.log('Drag over SVG element');
            });
            
            svgElement.addEventListener('dragenter', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Drag enter SVG element');
            });
            
            svgElement.addEventListener('drop', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Drop directly on SVG element');
                
                const dragData = e.dataTransfer.getData('text/plain');
                if (dragData === 'rally-token') {
                    // Find the state under the cursor
                    const target = e.target;
                    if (target && target.tagName === 'path' && target.id) {
                        console.log('Direct SVG drop on state:', target.id);
                        const rallyEvent = new CustomEvent('rallyDrop', {
                            detail: { stateId: target.id }
                        });
                        window.dispatchEvent(rallyEvent);
                    }
                }
            });
        }
        
        // Also set up individual state drops
        const states = this.svgDocument.querySelectorAll('path[id]');
        states.forEach(state => {
            state.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.stopPropagation();
                e.dataTransfer.dropEffect = 'move';
                state.style.filter = 'brightness(1.3)';
            });
            
            state.addEventListener('dragenter', (e) => {
                e.preventDefault();
                e.stopPropagation();
            });
            
            state.addEventListener('dragleave', (e) => {
                state.style.filter = '';
            });
            
            state.addEventListener('drop', (e) => {
                e.preventDefault();
                e.stopPropagation();
                state.style.filter = '';
                
                console.log('Drop directly on state path:', state.id);
                
                const dragData = e.dataTransfer.getData('text/plain');
                if (dragData === 'rally-token') {
                    const rallyEvent = new CustomEvent('rallyDrop', {
                        detail: { stateId: state.id }
                    });
                    window.dispatchEvent(rallyEvent);
                }
            });
        });
    }
    
    setupUTDropZones() {
        const utButtons = document.querySelectorAll('[data-ut]');
        console.log(`Setting up ${utButtons.length} UT buttons as drop zones`);
        
        utButtons.forEach(button => {
            button.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.stopPropagation();
                e.dataTransfer.dropEffect = 'move';
                button.style.backgroundColor = 'rgba(255, 107, 53, 0.3)';
                console.log(`Drag over UT: ${button.getAttribute('data-ut')}`);
            });

            button.addEventListener('dragenter', (e) => {
                e.preventDefault();
                e.stopPropagation();
            });

            button.addEventListener('dragleave', (e) => {
                e.preventDefault();
                e.stopPropagation();
                button.style.backgroundColor = '';
                console.log(`Drag leave UT: ${button.getAttribute('data-ut')}`);
            });

            button.addEventListener('drop', (e) => {
                e.preventDefault();
                e.stopPropagation();
                button.style.backgroundColor = '';
                
                console.log(`Drop event on UT: ${button.getAttribute('data-ut')}`);
                
                const dragData = e.dataTransfer.getData('text/plain');
                console.log('UT Drag data:', dragData);
                
                if (dragData === 'rally-token') {
                    const stateId = button.getAttribute('data-ut');
                    const rallyEvent = new CustomEvent('rallyDrop', {
                        detail: { stateId: stateId }
                    });
                    window.dispatchEvent(rallyEvent);
                    console.log(`Dispatched rallyDrop event for UT ${stateId}`);
                }
            });
        });
    }
}

// Create and export a single instance of MapController
export const mapController = new MapController();
