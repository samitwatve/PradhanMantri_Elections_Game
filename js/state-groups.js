// State grouping functionality
class StateGroups {    
    constructor() {
        this.groups = new Map();
        this.statesData = null;
        this.groupDominationStatus = new Map(); // Track which groups are dominated by a player
        this.previousDominationStatus = new Map(); // Track previous domination status to identify changes
        this.dominationCheckTimeout = null; // For debouncing
        this.checkingDomination = false; // Prevent concurrent checks
        this.initialize();
    }    
    async initialize() {
        try {
            // Load states data
            const response = await fetch('states_data.json');
            this.statesData = await response.json();
            
            // Initialize groups from states data
            this.initializeGroups();
            
            // Add data-group attributes to the buttons
            const buttons = document.querySelectorAll('.button-grid button');
            buttons.forEach(button => {
                const groupName = button.textContent.trim();
                if (this.groups.has(groupName)) {
                    console.log(`Setting data-group attribute for ${groupName}`);
                    button.setAttribute('data-group', groupName);
                }
            });
            
            // Initialize event listeners for group buttons
            buttons.forEach(button => {
                button.addEventListener('click', (e) => this.handleGroupClick(e));
            });

            // Initialize small UTs panel with both click and hover handlers
            const utButtons = document.querySelectorAll('.small-uts-grid button');
            utButtons.forEach(button => {
                button.addEventListener('click', (e) => this.handleUTClick(e));
                button.addEventListener('mouseover', (e) => this.handleUTHover(e));
                button.addEventListener('mouseout', (e) => this.handleUTUnhover(e));
            });
            
            // Listen for popularity changes to check group domination (with debouncing)
            window.addEventListener('popularityChanged', (event) => {
                console.log(`Popularity changed for ${event.detail.stateId}, scheduling group domination check`);
                this.scheduleGroupDominationCheck();
            });
        } catch (error) {
            console.error('Failed to load states data:', error);
        }
    }    
    // Schedule a check with debouncing to prevent too many checks
    scheduleGroupDominationCheck() {
        // Clear any existing timeout
        if (this.dominationCheckTimeout) {
            clearTimeout(this.dominationCheckTimeout);
        }
        
        // Set a new timeout
        this.dominationCheckTimeout = setTimeout(async () => {
            // Prevent concurrent checks
            if (this.checkingDomination) {
                console.log('Group domination check already in progress, will try again later');
                // Try again in a moment
                setTimeout(() => this.scheduleGroupDominationCheck(), 500);
                return;
            }            try {
                this.checkingDomination = true;
                console.log('Running scheduled group domination check');
                await this.checkAllGroupsDomination();
                
                // Also refresh any manually selected groups to update shimmer effects
                await this.refreshManuallySelectedGroups();
                
                // Also refresh any manually selected UT buttons to update shimmer effects
                await this.refreshManuallySelectedUTs();
            } catch (error) {
                console.error('Error during scheduled group domination check:', error);
            } finally {
                this.checkingDomination = false;
            }
        }, 500); // Wait for 500ms after the last change before checking
    }    
    initializeGroups() {
        // Clear existing groups
        this.groups.clear();

        // Define the group names based on the JSON properties
        const groupNames = [
            'Union Territory',
            'Coastal India',
            'Northeast India',
            'South India',
            'Hindi Heartland',
            'Agricultural Region',
            'Border Lands',
            'Pilgrimage',
            'Industrial Corridor',
            'Manufacturing',
            'Education',
            'Tribal Lands',
            'Travel and Tourism',
            'Natural Resources',
            'Minority Areas'
        ];

        // Initialize empty arrays for each group
        groupNames.forEach(groupName => {
            this.groups.set(groupName, []);
        });

        // Populate groups based on states data
        this.statesData.forEach(state => {
            if (state.UnionTerritory === "TRUE") this.groups.get('Union Territory').push(state.SvgId);
            if (state.CoastalIndia === "TRUE") this.groups.get('Coastal India').push(state.SvgId);
            if (state.NortheastIndia === "TRUE") this.groups.get('Northeast India').push(state.SvgId);
            if (state.SouthIndia === "TRUE") this.groups.get('South India').push(state.SvgId);
            if (state.HindiHeartland === "TRUE") this.groups.get('Hindi Heartland').push(state.SvgId);
            if (state.AgriculturalRegion === "TRUE") this.groups.get('Agricultural Region').push(state.SvgId);
            if (state.BorderLands === "TRUE") this.groups.get('Border Lands').push(state.SvgId);
            if (state.Pilgrimage === "TRUE") this.groups.get('Pilgrimage').push(state.SvgId);
            if (state.IndustrialCorridor === "TRUE") this.groups.get('Industrial Corridor').push(state.SvgId);
            if (state.Manufacturing === "TRUE") this.groups.get('Manufacturing').push(state.SvgId);
            if (state.Education === "TRUE") this.groups.get('Education').push(state.SvgId);
            if (state.TribalLands === "TRUE") this.groups.get('Tribal Lands').push(state.SvgId);            
            if (state.TravelAndTourism === "TRUE") this.groups.get('Travel and Tourism').push(state.SvgId);
            if (state.NaturalResources === "TRUE") this.groups.get('Natural Resources').push(state.SvgId);
            if (state.MinorityAreas === "TRUE") this.groups.get('Minority Areas').push(state.SvgId);
        });
    }      async handleGroupClick(event) {
        const button = event.target;
        const groupName = button.textContent.trim();
        const isActive = button.classList.toggle('active');
        
        // Get states for this group
        const states = this.getStatesInGroup(groupName);
          // Clear other highlights if clicking a new button
        if (isActive) {
            // Clear all other highlights
            const allButtons = document.querySelectorAll('.button-grid button');
            allButtons.forEach(otherButton => {                
                if (otherButton !== button && otherButton.classList.contains('active')) {
                    otherButton.classList.remove('active');
                    const otherGroupName = otherButton.textContent.trim();
                    const otherStates = this.getStatesInGroup(otherGroupName);
                    otherStates.forEach(stateId => {
                        window.dispatchEvent(new CustomEvent('toggleStateHighlight', {
                            detail: { stateId, forceOff: true }
                        }));
                    });
                    
                    // Clear UT highlights if deselecting Union Territory group
                    if (otherGroupName === 'Union Territory') {
                        this.clearAllUTButtonHighlights();
                    }
                }
            });
            
            // Show detailed group analysis to help identify missing states
            await this.showGroupAnalysis(groupName);
        }
          // Toggle highlight for states in this group with smart highlighting
        if (isActive) {
            await this.highlightGroupWithStatus(groupName);        } else {
            // Clear all highlights when deselecting
            states.forEach(stateId => {
                window.dispatchEvent(new CustomEvent('toggleStateHighlight', {
                    detail: { stateId, forceOff: true }
                }));
            });
            
            // Also clear UT button highlights for this group
            if (groupName === 'Union Territory') {
                this.clearAllUTButtonHighlights();
            }
            
            // After clearing manual highlights, refresh automatic domination highlighting
            setTimeout(() => {
                this.checkAllGroupsDomination();
            }, 100);
        }
    }
    handleUTHover(event) {
        const button = event.target;
        const utId = button.dataset.ut;
        
        if (!utId) {
            console.error('No UT ID found on button for hover');
            return;
        }
        
        // Dispatch hover event
        const hoverEvent = new CustomEvent('stateHover', {
            detail: { stateId: utId }
        });
        window.dispatchEvent(hoverEvent);
    }    
    handleUTUnhover(event) {
        const button = event.target;
        const utId = button.dataset.ut;
        
        if (!utId) {
            console.error('No UT ID found on button for unhover');
            return;
        }
        
        // Dispatch unhover event
        const unhoverEvent = new CustomEvent('stateUnhover', {
            detail: { stateId: utId }
        });
        window.dispatchEvent(unhoverEvent);
    }      handleUTClick(event) {
        const button = event.target;
        const utId = button.dataset.ut;
        
        console.log('UT button clicked:', utId);
        
        if (!utId) {
            console.error('No UT ID found on button');
            return;
        }
        
        // Toggle the selection state for the button
        button.classList.toggle('selected');
        
        // Dispatch an event that will be handled like a regular state click
        const clickEvent = new CustomEvent('stateClick', {
            detail: { stateId: utId }
        });
        console.log('Dispatching stateClick event:', clickEvent);
        window.dispatchEvent(clickEvent);
        
        // Also dispatch a hover event to immediately update the state info
        const hoverEvent = new CustomEvent('stateHover', {
            detail: { stateId: utId }
        });
        window.dispatchEvent(hoverEvent);
    }    
    getStatesInGroup(groupName) {
        return this.groups.get(groupName) || [];
    }    
    toggleGroupHighlight(groupName) {
        const states = this.getStatesInGroup(groupName);
        states.forEach(stateId => {
            window.dispatchEvent(new CustomEvent('toggleStateHighlight', {
                detail: { stateId }
            }));
        });
    }    
    selectUT(utId) {
        window.dispatchEvent(new CustomEvent('selectUT', {
            detail: { utId }
        }));
    }    
    // Check if all states in a group have >50% popularity for a player
    async checkGroupDomination(groupName) {
        if (!this.groups.has(groupName)) {
            console.log(`Group "${groupName}" not found in groups map`);
            return null;
        }
        
        const states = this.getStatesInGroup(groupName);
        if (states.length === 0) {
            console.log(`Group "${groupName}" has no states`);
            return null;
        }
        
        // Import stateInfo to get popularity data
        const { stateInfo } = await import('./state-info.js');
        
        let player1Domination = true;
        let player2Domination = true;
        
        console.log(`===== GROUP DOMINATION CHECK: ${groupName} =====`);
        console.log(`Checking domination for group ${groupName} with ${states.length} states`);
        
        // Count states with >50% for each player
        let p1DominatingStates = 0;
        let p2DominatingStates = 0;
        let totalStates = states.length;
        
        // Check each state in the group
        for (const stateId of states) {
            const popularity = stateInfo.getStatePopularity(stateId);
            if (!popularity) {
                console.log(`No popularity data for state ${stateId}`);
                player1Domination = false;
                player2Domination = false;
                continue;
            }
            
            // Round the values to ensure consistent comparisons
            const p1 = Math.round(popularity.player1);
            const p2 = Math.round(popularity.player2);
            
            console.log(`State ${stateId} popularity: P1=${p1}, P2=${p2}`);
            
            // Check if player1 has >50% popularity
            if (p1 >= 50) {
                p1DominatingStates++;
            } else {
                player1Domination = false;
            }
            
            // Check if player2 has >50% popularity
            if (p2 >= 50) {
                p2DominatingStates++;
            } else {
                player2Domination = false;
            }
            
            // If neither player can dominate, we can stop checking
            if (!player1Domination && !player2Domination) {
                console.log(`No player can dominate ${groupName}, stopping check early`);
                break;
            }
        }
        
        console.log(`Group "${groupName}": P1 dominates ${p1DominatingStates}/${totalStates} states, P2 dominates ${p2DominatingStates}/${totalStates} states`);
        
        // Return the dominating player (1, 2) or null if none
        if (player1Domination) {
            console.log(`Player 1 dominates group ${groupName}`);
            return 1;
        }
        if (player2Domination) {
            console.log(`Player 2 dominates group ${groupName}`);
            return 2;
        }
        console.log(`No player dominates group ${groupName}`);
        return null;
    }      // Check domination for all groups
    async checkAllGroupsDomination() {
        // Debug log group membership first
        // this.debugGroupMembership();
        
        // Get all group names
        const groupNames = Array.from(this.groups.keys());
        
        // console.log(`===== CHECKING DOMINATION FOR ALL GROUPS =====`);
        // console.log(`Checking domination for ${groupNames.length} groups`);
        
        // Copy current domination status to previous status before updating
        this.previousDominationStatus = new Map(this.groupDominationStatus);
        
        // Count of dominated groups by each player
        let player1DominatedGroups = 0;
        let player2DominatedGroups = 0;
        
        for (const groupName of groupNames) {
            try {
                const dominatingPlayer = await this.checkGroupDomination(groupName);
                const previousStatus = this.groupDominationStatus.get(groupName);
                
                // If domination status changed
                if (dominatingPlayer !== previousStatus) {
                    console.log(`Domination status changed for ${groupName}: ${previousStatus} -> ${dominatingPlayer}`);
                    this.groupDominationStatus.set(groupName, dominatingPlayer);
                    
                    // Apply highlight
                    try {
                        this.highlightGroupDomination(groupName, dominatingPlayer);
                    } catch (highlightError) {
                        console.error(`Error highlighting group ${groupName}:`, highlightError);
                    }
                    
                    // If a player gained domination, award initial bonus
                    if (dominatingPlayer !== null) {
                        this.awardGroupDominationBonus(groupName, dominatingPlayer);
                    }
                } else {
                    console.log(`No change in domination status for ${groupName}: still ${dominatingPlayer}`);
                    
                    // If still dominated by a player, award carry-forward bonus
                    if (dominatingPlayer !== null) {
                        const { gameTimer } = await import('./game-timer.js');
                        // Only award carry-forward bonuses at the start of a new round (phase 1)
                        if (gameTimer.currentPhase === 1) {
                            this.awardGroupDominationBonus(groupName, dominatingPlayer);
                        }
                    }
                }
                
                // Count dominated groups
                if (dominatingPlayer === 1) player1DominatedGroups++;
                if (dominatingPlayer === 2) player2DominatedGroups++;
                
            } catch (error) {
                console.error(`Error checking domination for group ${groupName}:`, error);
            }
        }
        
        console.log(`===== DOMINATION SUMMARY =====`);
        console.log(`Player 1 dominates ${player1DominatedGroups} groups`);
        console.log(`Player 2 dominates ${player2DominatedGroups} groups`);
        console.log(`===== END DOMINATION CHECK =====`);
    }
    // Highlight all states in a group if dominated by a player
    highlightGroupDomination(groupName, playerId) {
        if (!this.groups.has(groupName)) {
            console.log(`Group "${groupName}" not found in groups map`);
            return;
        }
        
        const states = this.getStatesInGroup(groupName);
        console.log(`Highlighting ${states.length} states for group "${groupName}", player ${playerId}`);
        
        // Try getting button both ways - by data-group attribute or by text content
        let button = document.querySelector(`.button-grid button[data-group="${groupName}"]`);
        if (!button) {
            // Fallback to finding by text content
            console.log(`Button with data-group="${groupName}" not found, trying text content match`);
            const buttons = document.querySelectorAll('.button-grid button');
            for (const btn of buttons) {
                if (btn.textContent.trim() === groupName) {
                    button = btn;
                    // Add the data-group attribute for future use
                    btn.setAttribute('data-group', groupName);
                    console.log(`Found button by text content and set data-group attribute`);
                    break;
                }
            }
        }
        
        console.log(`Highlighting group ${groupName} for player ${playerId}, found button: ${!!button}`);
        
        // If there's a button for this group, update its appearance
        if (button) {
            // Remove previous domination classes
            button.classList.remove('player1-dominated', 'player2-dominated');
            
            // Add appropriate class if dominated
            if (playerId === 1) {
                console.log(`Adding player1-dominated class to ${groupName} button`);
                button.classList.add('player1-dominated');
            } else if (playerId === 2) {
                console.log(`Adding player2-dominated class to ${groupName} button`);
                button.classList.add('player2-dominated');
            }
        } else {
            console.warn(`Button not found for group "${groupName}"`);
        }
          // Check if this group is currently manually selected (active)
        const isManuallySelected = button && button.classList.contains('active');
        
        // Only apply automatic domination highlighting if the group is NOT manually selected
        if (!isManuallySelected) {
            // Highlight states based on domination
            if (playerId) {
                console.log(`Highlighting ${states.length} states for automatic domination by player ${playerId}`);
                states.forEach(stateId => {
                    console.log(`Auto-highlighting state ${stateId} for domination by player ${playerId}`);
                    window.dispatchEvent(new CustomEvent('toggleStateHighlight', {
                        detail: { stateId, forceState: true, highlightType: 'default' }
                    }));
                });
            } else {
                console.log(`Removing auto-highlights from ${states.length} states in group "${groupName}"`);
                states.forEach(stateId => {
                    console.log(`Removing auto-highlight from state ${stateId}`);
                    window.dispatchEvent(new CustomEvent('toggleStateHighlight', {
                        detail: { stateId, forceOff: true }
                    }));
                });
            }
        } else {
            console.log(`Group "${groupName}" is manually selected - skipping automatic highlight to preserve shimmer effects`);
        }
    }    
    // Force refresh the highlighting for a specific group (useful when popularity changes)
    async refreshGroupHighlighting(groupName) {
        // Check if this group is currently manually selected
        const button = document.querySelector(`.button-grid button[data-group="${groupName}"]`) ||
                      Array.from(document.querySelectorAll('.button-grid button'))
                           .find(btn => btn.textContent.trim() === groupName);
        
        if (button && button.classList.contains('active')) {
            console.log(`🔄 Refreshing highlighting for manually selected group: ${groupName}`);
            // Re-apply smart highlighting
            await this.highlightGroupWithStatus(groupName);
        }
    }    
    // Refresh highlighting for all manually selected groups
    async refreshManuallySelectedGroups() {
        const activeButtons = document.querySelectorAll('.button-grid button.active');
        
        for (const button of activeButtons) {
            const groupName = button.textContent.trim();
            if (this.groups.has(groupName)) {
                console.log(`🔄 Refreshing manually selected group: ${groupName}`);
                await this.refreshGroupHighlighting(groupName);
            }
        }
    }    
    // Refresh highlighting for all manually selected UT buttons
    async refreshManuallySelectedUTs() {
        const selectedUTButtons = document.querySelectorAll('.small-uts-grid button.selected');
        
        for (const button of selectedUTButtons) {
            const utId = button.dataset.ut;
            if (utId) {
                console.log(`🔄 Refreshing manually selected UT: ${utId}`);
                await this.refreshUTHighlighting(utId);
            }
        }
    }

    // Refresh highlighting for a specific UT button
    async refreshUTHighlighting(utId) {
        const { stateInfo } = await import('./state-info.js');
        const { getCurrentPlayerNumber } = await import('./player-info.js');
        
        const currentPlayer = getCurrentPlayerNumber();
        const popularity = stateInfo.getStatePopularity(utId);
        
        if (!popularity) {
            console.log(`No popularity data found for UT: ${utId}`);
            return;
        }
        
        const currentPlayerPop = currentPlayer === 1 ? popularity.player1 : popularity.player2;
        const stateData = stateInfo.statesData.find(s => s.SvgId === utId);
        const stateName = stateData ? stateData.State : utId;
        
        console.log(`🔄 Refreshing UT "${stateName}" with smart visual indicators:`);
        
        if (Math.round(currentPlayerPop) >= 50) {
            // UT where current player is leading (≥50%) - white border + green glow, NO shimmer
            console.log(`✅ ${stateName}: ${Math.round(currentPlayerPop)}% (leading - white border + green glow)`);
            window.dispatchEvent(new CustomEvent('toggleStateHighlight', {
                detail: { 
                    stateId: utId, 
                    forceState: true,
                    highlightType: 'leading' // White border + green glow, removes shimmer
                }
            }));
        } else {
            // UT where current player needs to work (<50%) - white border + orange glow + shimmer
            console.log(`❌ ${stateName}: ${Math.round(currentPlayerPop)}% (missing - white border + orange glow + shimmer)`);
            window.dispatchEvent(new CustomEvent('toggleStateHighlight', {
                detail: { 
                    stateId: utId, 
                    forceState: true,
                    highlightType: 'missing' // White border + orange glow + shimmer
                }
            }));
        }
    }

    // Update the visual appearance of a Small UT button based on highlight type
    updateUTButtonHighlight(stateId, highlightType) {
        const utButton = document.querySelector(`.small-uts-grid button[data-ut="${stateId}"]`);
        if (!utButton) {
            return; // Not a UT or button not found
        }
        
        // Remove any existing highlight classes
        utButton.classList.remove('ut-leading', 'ut-missing');
        
        // Add the appropriate class based on highlight type
        if (highlightType === 'leading') {
            console.log(`🔘 Adding leading highlight to UT button: ${stateId}`);
            utButton.classList.add('ut-leading');
        } else if (highlightType === 'missing') {
            console.log(`🔸 Adding missing highlight (shimmer) to UT button: ${stateId}`);
            utButton.classList.add('ut-missing');
        }
    }

    // Clear highlight from all UT buttons
    clearAllUTButtonHighlights() {
        const utButtons = document.querySelectorAll('.small-uts-grid button');
        utButtons.forEach(button => {
            button.classList.remove('ut-leading', 'ut-missing');
        });
    }

    // Debug method to log all groups and their members
    debugGroupMembership() {
        console.log('===== DEBUG: GROUP MEMBERSHIP =====');
        console.log(`Total groups: ${this.groups.size}`);
        
        this.groups.forEach((states, groupName) => {
            console.log(`Group "${groupName}": ${states.length} states`);
            console.log(states);
        });
        
        console.log('===== END DEBUG =====');
    }    
    // Debug method to analyze what's missing for group domination
    async analyzeGroupDomination() {
        const { stateInfo } = await import('./state-info.js');
        
        console.log('===== GROUP DOMINATION ANALYSIS =====');
        
        // For each group
        for (const [groupName, states] of this.groups.entries()) {
            if (states.length === 0) continue;
            
            console.log(`\n----- Group "${groupName}" (${states.length} states) -----`);
            
            // Count states with adequate popularity
            let p1States = 0;
            let p2States = 0;
            
            // Track states that don't meet the threshold for each player
            const p1MissingStates = [];
            const p2MissingStates = [];
            
            for (const stateId of states) {
                const popularity = stateInfo.getStatePopularity(stateId);
                if (!popularity) continue;
                
                const p1 = Math.round(popularity.player1);
                const p2 = Math.round(popularity.player2);
                
                // Check each player's popularity
                if (p1 >= 50) {
                    p1States++;
                } else {
                    const stateData = stateInfo.statesData.find(s => s.SvgId === stateId);
                    const stateName = stateData ? stateData.State : stateId;
                    p1MissingStates.push({
                        id: stateId,
                        name: stateName,
                        popularity: p1
                    });
                }
                
                if (p2 >= 50) {
                    p2States++;
                } else {
                    const stateData = stateInfo.statesData.find(s => s.SvgId === stateId);
                    const stateName = stateData ? stateData.State : stateId;
                    p2MissingStates.push({
                        id: stateId,
                        name: stateName,
                        popularity: p2
                    });
                }
            }
            
            // Report results
            console.log(`Player 1: ${p1States}/${states.length} states with >=50% popularity`);
            console.log(`Player 2: ${p2States}/${states.length} states with >=50% popularity`);
            
            if (p1States === states.length) {
                console.log("Group is DOMINATED by Player 1");
            } else if (p1MissingStates.length > 0) {
                console.log("Player 1 missing domination in these states:");
                p1MissingStates.forEach(state => {
                    console.log(`  - ${state.name} (${state.id}): ${state.popularity}%`);
                });
            }
            
            if (p2States === states.length) {
                console.log("Group is DOMINATED by Player 2");
            } else if (p2MissingStates.length > 0) {
                console.log("Player 2 missing domination in these states:");
                p2MissingStates.forEach(state => {
                    console.log(`  - ${state.name} (${state.id}): ${state.popularity}%`);
                });
            }
        }
        
        console.log('===== END ANALYSIS =====');
    }    
    // Debug method to force domination of a group by a player
    async forceGroupDomination(groupName, playerId) {
        if (!this.groups.has(groupName)) {
            console.log(`Group "${groupName}" not found`);
            return;
        }
        
        const states = this.getStatesInGroup(groupName);
        if (states.length === 0) {
            console.log(`Group "${groupName}" has no states`);
            return;
        }
        
        console.log(`Forcing Player ${playerId} to dominate group "${groupName}" (${states.length} states)`);
        
        const { stateInfo } = await import('./state-info.js');
        
        // For each state in the group
        for (const stateId of states) {
            const currentPopularity = stateInfo.getStatePopularity(stateId);
            if (!currentPopularity) continue;
            
            // Create new popularity object
            const newPopularity = { ...currentPopularity };
            
            // Set the specified player to 60%, distribute rest between other player and others
            if (playerId === 1) {
                newPopularity.player1 = 60;
                newPopularity.player2 = 20;
                newPopularity.others = 20;
            } else {
                newPopularity.player2 = 60;
                newPopularity.player1 = 20;
                newPopularity.others = 20;
            }
            
            // Update the state
            stateInfo.updateStatePopularity(stateId, newPopularity);
            console.log(`Set ${stateId} popularity to P1=${newPopularity.player1}, P2=${newPopularity.player2}, Others=${newPopularity.others}`);
        }
        
        // Check domination after a short delay
        setTimeout(() => this.checkAllGroupsDomination(), 500);
    }    
    // Debug method to force domination of all groups by a player
    async forceAllGroupsDomination(playerId) {
        console.log(`===== FORCING ALL GROUPS DOMINATION FOR PLAYER ${playerId} =====`);
        
        const groupNames = Array.from(this.groups.keys());
        for (const groupName of groupNames) {
            await this.forceGroupDomination(groupName, playerId);
        }
        
        console.log(`===== COMPLETED FORCING ALL GROUPS DOMINATION =====`);
        
        // Final check
        setTimeout(() => this.checkAllGroupsDomination(), 1000);
    }    
    // Find all groups that a state belongs to
    getGroupsForState(stateId) {
        const groups = [];
        
        this.groups.forEach((states, groupName) => {
            if (states.includes(stateId)) {
                groups.push(groupName);
            }
        });
        
        return groups;
    }    
    // Calculate total seats in a state group
    calculateTotalSeatsInGroup(groupName) {
        const states = this.getStatesInGroup(groupName);
        let totalSeats = 0;
        
        states.forEach(stateId => {
            const stateData = this.statesData.find(state => state.SvgId === stateId);
            if (stateData) {
                totalSeats += stateData.Seats;
            }
        });
        
        return totalSeats;
    }

    // Calculate the total number of Lok Sabha seats in a state group
    getTotalSeatsInGroup(groupName) {
        if (!this.groups.has(groupName)) {
            console.log(`Group "${groupName}" not found in groups map`);
            return 0;
        }
        
        const states = this.getStatesInGroup(groupName);
        if (states.length === 0) {
            console.log(`Group "${groupName}" has no states`);
            return 0;
        }
        
        let totalSeats = 0;
        
        // Sum up the seats from all states in the group
        for (const stateId of states) {
            const stateData = this.statesData.find(state => state.SvgId === stateId);
            if (stateData) {
                totalSeats += parseInt(stateData.LokSabhaSeats, 10) || 0;
            }
        }
        
        console.log(`Group "${groupName}" has ${totalSeats} total Lok Sabha seats`);
        return totalSeats;
    }    // Award bonus to player for dominating a state group
    awardGroupDominationBonus(groupName, playerId) {
        const totalSeats = this.getTotalSeatsInGroup(groupName);
        if (totalSeats === 0) {
            console.log(`No bonus awarded for group "${groupName}" - 0 seats`);
            return;
        }
        
        // Calculate bonus as 50% of seats value (e.g., 130 seats = 65M bonus)
        const bonusAmount = Math.round(totalSeats * 0.5);
        
        console.log(`Awarding ${bonusAmount}M bonus to Player ${playerId} for dominating group "${groupName}" (${totalSeats} seats)`);
          // Import player info to award the bonus
        import('./player-info.js').then(({ player1, player2 }) => {
            const player = playerId === 1 ? player1 : player2;
            player.updateFunds(bonusAmount);
            
            // Play fanfare sound for Player 1 group domination
            if (playerId === 1 && window.soundManager) {
                window.soundManager.playFanfare();
            }
            
            // Show a special notification for the group domination bonus
            player.showGroupDominationBonusNotification(groupName, bonusAmount);
            
            // Also show a message in the actions log
            import('./actions-log.js').then(({ actionsLog }) => {
                actionsLog.addAction(`Player ${playerId} received ${bonusAmount}M bonus for dominating ${groupName} (${totalSeats} seats)`);
            });
        });
    }

    // Show detailed analysis of a group to help players identify missing states
    async showGroupAnalysis(groupName) {
        if (!this.groups.has(groupName)) {
            console.log(`Group "${groupName}" not found in groups map`);
            return;
        }
        
        const states = this.getStatesInGroup(groupName);
        if (states.length === 0) {
            console.log(`Group "${groupName}" has no states`);
            return;
        }
        
        const { stateInfo } = await import('./state-info.js');
        const { getCurrentPlayerNumber } = await import('./player-info.js');
        
        const currentPlayer = getCurrentPlayerNumber();
        
        // Analyze each state in the group
        const leadingStates = [];
        const missingStates = [];
        
        for (const stateId of states) {
            const popularity = stateInfo.getStatePopularity(stateId);
            if (!popularity) continue;
            
            const currentPlayerPop = currentPlayer === 1 ? popularity.player1 : popularity.player2;
            const stateData = stateInfo.statesData.find(s => s.SvgId === stateId);
            const stateName = stateData ? stateData.State : stateId;
            
            if (Math.round(currentPlayerPop) >= 50) {
                leadingStates.push({
                    id: stateId,
                    name: stateName,
                    popularity: Math.round(currentPlayerPop)
                });
            } else {
                missingStates.push({
                    id: stateId,
                    name: stateName,
                    popularity: Math.round(currentPlayerPop),
                    needed: 50 - Math.round(currentPlayerPop)
                });
            }
        }
        
        // Show analysis in console for now (could be enhanced with UI popup later)
        console.log(`\n🎯 GROUP ANALYSIS: ${groupName}`);
        console.log(`📊 Total states: ${states.length}`);
        console.log(`✅ Leading in: ${leadingStates.length} states`);
        console.log(`❌ Missing: ${missingStates.length} states`);
        
        if (leadingStates.length > 0) {
            console.log(`\n✅ STATES YOU LEAD (≥50%):`);
            leadingStates.forEach(state => {
                console.log(`  • ${state.name}: ${state.popularity}%`);
            });
        }
        
        if (missingStates.length > 0) {
            console.log(`\n❌ STATES YOU NEED TO WORK ON (<50%):`);
            missingStates.forEach(state => {
                console.log(`  • ${state.name}: ${state.popularity}% (need +${state.needed}%)`);
            });
        }
          if (missingStates.length === 0) {
            console.log(`\n🎉 GROUP DOMINATED! You lead in all states.`);
        } else {
            console.log(`\n🎯 Focus on the ${missingStates.length} missing states to dominate this group.`);
            console.log(`✨ Missing states will have a shimmer effect on the map.`);
        }
          // Import actions log to show the analysis
        const { actionsLog } = await import('./actions-log.js');
        if (missingStates.length === 0) {
            actionsLog.addAction(`${groupName}: DOMINATED! Leading in all ${leadingStates.length} states`);
        } else {
            const missingNames = missingStates.map(s => s.name).join(', ');
            actionsLog.addAction(`${groupName}: Leading in ${leadingStates.length}/${states.length} states. Shimmering: ${missingNames}`);
        }
    }    // Highlight group with different colors for leading vs missing states
    async highlightGroupWithStatus(groupName) {
        if (!this.groups.has(groupName)) {
            console.log(`Group "${groupName}" not found in groups map`);
            return;
        }
        
        const states = this.getStatesInGroup(groupName);
        if (states.length === 0) {
            console.log(`Group "${groupName}" has no states`);
            return;
        }
        
        const { stateInfo } = await import('./state-info.js');
        const { getCurrentPlayerNumber } = await import('./player-info.js');
        
        const currentPlayer = getCurrentPlayerNumber();
        
        console.log(`\n🎯 Highlighting group "${groupName}" with smart visual indicators:`);
        
        // Categorize states based on current player's popularity
        for (const stateId of states) {
            const popularity = stateInfo.getStatePopularity(stateId);
            if (!popularity) continue;
            
            const currentPlayerPop = currentPlayer === 1 ? popularity.player1 : popularity.player2;
            const stateData = stateInfo.statesData.find(s => s.SvgId === stateId);
            const stateName = stateData ? stateData.State : stateId;
              if (Math.round(currentPlayerPop) >= 50) {
                // State where current player is leading (≥50%) - white border + green glow, NO shimmer
                console.log(`✅ ${stateName}: ${Math.round(currentPlayerPop)}% (leading - white border + green glow)`);
                window.dispatchEvent(new CustomEvent('toggleStateHighlight', {
                    detail: { 
                        stateId, 
                        forceState: true,
                        highlightType: 'leading' // White border + green glow, removes shimmer
                    }
                }));
                
                // Also update UT button if this is a UT
                this.updateUTButtonHighlight(stateId, 'leading');
            } else {
                // State where current player needs to work (<50%) - white border + orange glow + shimmer
                console.log(`❌ ${stateName}: ${Math.round(currentPlayerPop)}% (missing - white border + orange glow + shimmer)`);
                window.dispatchEvent(new CustomEvent('toggleStateHighlight', {
                    detail: { 
                        stateId, 
                        forceState: true,
                        highlightType: 'missing' // White border + orange glow + shimmer
                    }
                }));
                
                // Also update UT button if this is a UT
                this.updateUTButtonHighlight(stateId, 'missing');
            }
        }
    }
}

// Create and export a single instance
export const stateGroups = new StateGroups();
