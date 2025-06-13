// Rally Controller
// Manages rally token placement, visual representation, and mechanics

import { player1, player2 } from './player-info.js';
import { stateInfo } from './state-info.js';

class RallyController {
    constructor() {
        this.rallies = new Map(); // Track rallies by state: stateId -> [{playerId, tokenId}]
        this.maxRalliesPerState = 2;
        this.rallyPopularityBoost = 8; // 8% popularity boost per rally
        this.svgDocument = null;
        this.rallyMode = false;
        this.initialize();
    }

    async initialize() {
        console.log('Rally Controller initialized');
        
        // Wait for map to be loaded
        const map = document.getElementById('india-map');
        await new Promise(resolve => {
            const onLoad = () => {
                this.svgDocument = map.contentDocument;
                resolve();
            };

            if (map.contentDocument && map.contentDocument.documentElement) {
                onLoad();
            } else {
                map.addEventListener('load', onLoad);
            }
        });        // Set up event listeners
        this.setupEventListeners();
        
        // Set up drag and drop functionality
        this.setupDragAndDrop();
    }    setupEventListeners() {
        // Listen for drop events on states
        window.addEventListener('rallyDrop', async (event) => {
            const { stateId } = event.detail;
            await this.handleRallyPlacement(stateId, 1); // Player 1
        });

        // Listen for game phase changes to reset AI rally behavior
        window.addEventListener('gamePhaseChanged', (event) => {
            console.log('Rally controller received phase change event');
        });
    }

    setupDragAndDrop() {
        // Make rally tokens in player info draggable
        setTimeout(() => {
            this.setupPlayerRallyDragAndDrop();
        }, 1000); // Wait for player info to be initialized
    }

    setupPlayerRallyDragAndDrop() {
        const player1Info = document.getElementById('player1-info');
        if (!player1Info) return;

        const rallyTokensDisplay = player1Info.querySelector('.rally-tokens-display');
        if (!rallyTokensDisplay) return;

        // Create draggable rally icons
        this.createDraggableRallyIcons(rallyTokensDisplay);
    }

    createDraggableRallyIcons(container) {
        // Clear existing content
        container.innerHTML = '';
        
        // Create individual rally token elements
        for (let i = 0; i < player1.maxRallyTokens; i++) {
            const tokenElement = document.createElement('span');
            tokenElement.className = 'rally-token-icon';
            tokenElement.textContent = '📢';
            tokenElement.setAttribute('data-token-index', i);
            
            if (i < player1.rallyTokens) {
                tokenElement.classList.add('available');
                tokenElement.draggable = true;
                tokenElement.title = 'Drag to a state to place rally (+8% popularity)';
                  // Add drag event listeners
                tokenElement.addEventListener('dragstart', (e) => {
                    console.log('Rally token drag started');
                    e.dataTransfer.setData('text/plain', 'rally-token');
                    e.dataTransfer.effectAllowed = 'move';
                    tokenElement.classList.add('dragging');
                    
                    // Add visual feedback
                    document.body.classList.add('rally-dragging');
                    
                    // Add feedback to map container
                    const mapContainer = document.querySelector('.map-container');
                    if (mapContainer) {
                        mapContainer.classList.add('drag-active');
                    }
                });

                tokenElement.addEventListener('dragend', (e) => {
                    console.log('Rally token drag ended');
                    tokenElement.classList.remove('dragging');
                    document.body.classList.remove('rally-dragging');
                    
                    // Remove feedback from map container
                    const mapContainer = document.querySelector('.map-container');
                    if (mapContainer) {
                        mapContainer.classList.remove('drag-active');
                    }
                });            } else {
                tokenElement.classList.add('used');
                tokenElement.draggable = false;
                tokenElement.textContent = '⚪'; // Grey circle for used tokens
                tokenElement.title = 'Rally token used - replenishes next phase';
            }
            
            container.appendChild(tokenElement);
        }
    }

    async handleRallyPlacement(stateId, playerId) {
        console.log(`Attempting to place rally for player ${playerId} in state ${stateId}`);
        
        // Check if player has rally tokens
        const player = playerId === 1 ? player1 : player2;
        if (!player.canUseRallyToken()) {
            player.showInsufficientRallyTokensError();
            return false;
        }        // Check if state can accept more rallies
        if (!this.canPlaceRallyInState(stateId)) {
            this.showMaxRalliesError(stateId, playerId);
            return false;
        }

        // Use rally token
        if (!player.useRallyToken()) {
            return false;
        }

        // Place rally
        this.placeRally(stateId, playerId);
        
        // Apply popularity boost
        stateInfo.updateStatePopularity(stateId, playerId, this.rallyPopularityBoost);
          // Log the action
        const playerName = playerId === 1 ? 'BJP' : 'INC';
        try {
            const { actionsLog } = await import('./actions-log.js');
            actionsLog.addAction(`${playerName} held a rally in ${stateId} (+${this.rallyPopularityBoost}% popularity)`);
        } catch (error) {
            console.log(`${playerName} held a rally in ${stateId} (+${this.rallyPopularityBoost}% popularity)`);
        }
        
        // Add visual rally token to map
        this.addRallyVisualToMap(stateId, playerId);
        
        console.log(`Rally placed successfully for player ${playerId} in ${stateId}`);
        return true;
    }

    canPlaceRallyInState(stateId) {
        const stateRallies = this.rallies.get(stateId) || [];
        return stateRallies.length < this.maxRalliesPerState;
    }

    placeRally(stateId, playerId) {
        if (!this.rallies.has(stateId)) {
            this.rallies.set(stateId, []);
        }
        
        const stateRallies = this.rallies.get(stateId);
        const tokenId = `rally-${stateId}-${playerId}-${Date.now()}`;
        
        stateRallies.push({
            playerId: playerId,
            tokenId: tokenId,
            timestamp: Date.now()
        });
        
        console.log(`Rally placed in ${stateId}:`, stateRallies);
    }

    addRallyVisualToMap(stateId, playerId) {
        if (!this.svgDocument) return;

        const stateElement = this.svgDocument.getElementById(stateId);
        if (!stateElement) return;

        // Get state bounding box for positioning
        const bbox = stateElement.getBBox();
        const centerX = bbox.x + bbox.width / 2;
        const centerY = bbox.y + bbox.height / 2;

        // Calculate offset for multiple rallies
        const stateRallies = this.rallies.get(stateId) || [];
        const rallyIndex = stateRallies.length - 1;
        const offsetX = rallyIndex * 15; // Offset subsequent rallies
        const offsetY = rallyIndex * 10;

        // Create rally token circle
        const rallyToken = this.svgDocument.createElementNS('http://www.w3.org/2000/svg', 'circle');
        const tokenId = `rally-visual-${stateId}-${playerId}-${Date.now()}`;
        
        rallyToken.setAttribute('id', tokenId);
        rallyToken.setAttribute('cx', centerX + offsetX);
        rallyToken.setAttribute('cy', centerY + offsetY);
        rallyToken.setAttribute('r', '8');
        rallyToken.setAttribute('fill', playerId === 1 ? '#ff6b35' : '#4ecdc4');
        rallyToken.setAttribute('stroke', '#ffffff');
        rallyToken.setAttribute('stroke-width', '2');
        rallyToken.setAttribute('class', 'rally-token');
        
        // Add megaphone text
        const rallyText = this.svgDocument.createElementNS('http://www.w3.org/2000/svg', 'text');
        rallyText.setAttribute('id', `${tokenId}-text`);
        rallyText.setAttribute('x', centerX + offsetX);
        rallyText.setAttribute('y', centerY + offsetY + 3);
        rallyText.setAttribute('text-anchor', 'middle');
        rallyText.setAttribute('font-size', '10');
        rallyText.setAttribute('fill', '#ffffff');
        rallyText.setAttribute('font-weight', 'bold');
        rallyText.textContent = '📢';

        // Add to SVG
        this.svgDocument.documentElement.appendChild(rallyToken);
        this.svgDocument.documentElement.appendChild(rallyText);

        // Add hover tooltip
        const tooltip = `Rally by ${playerId === 1 ? 'BJP' : 'INC'} (+${this.rallyPopularityBoost}% popularity)`;
        rallyToken.setAttribute('title', tooltip);
        rallyText.setAttribute('title', tooltip);    }    showMaxRalliesError(stateId, playerId) {
        console.log(`Maximum rallies reached for state ${stateId}`);
        
        // Play invalid action sound (only for Player 1)
        if (window.soundManager && playerId === 1) {
            window.soundManager.playInvalidAction();
        }
        
        // Show temporary error message
        const errorMsg = document.createElement('div');
        errorMsg.className = 'rally-error-message';
        errorMsg.innerHTML = `
            <i class="fas fa-exclamation-triangle"></i>
            <span>Maximum rallies (${this.maxRalliesPerState}) reached for this state</span>
        `;
        
        document.body.appendChild(errorMsg);
        
        setTimeout(() => {
            if (document.body.contains(errorMsg)) {
                document.body.removeChild(errorMsg);
            }
        }, 2000);
    }

    // AI rally placement method
    async placeAIRally() {
        console.log('AI attempting to place rally');
        
        if (!player2.canUseRallyToken()) {
            console.log('AI has no rally tokens available');
            return false;
        }

        // Load states data if needed
        if (!this.statesData) {
            const response = await fetch('states_data.json');
            this.statesData = await response.json();
        }

        // Find suitable states for rally
        const suitableStates = this.findSuitableStatesForAIRally();
        
        if (suitableStates.length === 0) {
            console.log('No suitable states found for AI rally');
            return false;
        }

        // Choose best state based on AI strategy
        const targetState = this.chooseAIRallyTarget(suitableStates);
        
        if (targetState) {
            return await this.handleRallyPlacement(targetState, 2);
        }
        
        return false;
    }

    findSuitableStatesForAIRally() {
        const suitableStates = [];
        
        for (const stateData of this.statesData || []) {
            const stateId = stateData.SvgId;
            
            // Skip if state already has maximum rallies
            if (!this.canPlaceRallyInState(stateId)) {
                continue;
            }

            // Get current popularity
            const popularity = stateInfo.getStatePopularity(stateId);
            const player2Popularity = popularity?.player2 || 0;
            const player1Popularity = popularity?.player1 || 0;
            
            // AI prefers competitive states where rallies would be effective
            const competitiveness = Math.abs(player2Popularity - player1Popularity);
            const seatValue = parseInt(stateData.LokSabhaSeats);
            
            suitableStates.push({
                stateId: stateId,
                competitiveness: competitiveness,
                seatValue: seatValue,
                player2Popularity: player2Popularity,
                score: (seatValue * 2) + (50 - competitiveness) // Higher score for valuable and competitive states
            });
        }
        
        return suitableStates.sort((a, b) => b.score - a.score);
    }

    chooseAIRallyTarget(suitableStates) {
        // Choose from top 5 most suitable states with some randomness
        const topStates = suitableStates.slice(0, Math.min(5, suitableStates.length));
        const randomIndex = Math.floor(Math.random() * topStates.length);
        return topStates[randomIndex]?.stateId;
    }

    // Get rally information for state tooltips
    getStateRallyInfo(stateId) {
        const stateRallies = this.rallies.get(stateId) || [];
        const rallyCount = stateRallies.length;
        const maxRallies = this.maxRalliesPerState;
        const canPlaceMore = rallyCount < maxRallies;
        
        return {
            count: rallyCount,
            max: maxRallies,
            canPlace: canPlaceMore,
            rallies: stateRallies
        };
    }

    // Update state tooltip to include rally information
    updateStateTooltip(stateId, tooltip) {
        const rallyInfo = this.getStateRallyInfo(stateId);
        
        if (rallyInfo.count > 0) {
            tooltip += `\nRallies: ${rallyInfo.count}/${rallyInfo.max}`;
            
            // Show which players have rallies
            const players = rallyInfo.rallies.map(r => r.playerId === 1 ? 'BJP' : 'INC');
            tooltip += ` (${players.join(', ')})`;
        } else if (rallyInfo.canPlace) {
            tooltip += `\nRallies: ${rallyInfo.count}/${rallyInfo.max} (Available)`;
        } else {
            tooltip += `\nRallies: ${rallyInfo.count}/${rallyInfo.max} (Full)`;
        }
        
        return tooltip;
    }
}

// Create and export the rally controller instance
export const rallyController = new RallyController();

// Expose to window for player info access
window.rallyController = rallyController;
