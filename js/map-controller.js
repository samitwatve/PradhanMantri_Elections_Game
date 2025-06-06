// Map interaction and state management
class MapController {
    constructor() {
        this.svgDocument = null;
        this.selectedStates = new Set();
        this.statesData = null;
        this.initialize();
    }

    async initialize() {
        try {
            const response = await fetch('states_data.json');
            this.statesData = await response.json();
            const map = document.getElementById('india-map');
            map.addEventListener('load', () => {
                this.svgDocument = map.contentDocument;
                this.setupStateInteractions();
            });
        } catch (error) {
            console.error('Failed to load states data:', error);
        }
    }

    setupStateInteractions() {
        if (!this.svgDocument) return;

        const states = this.svgDocument.querySelectorAll('path[id]');
        states.forEach(state => {
            state.addEventListener('click', (e) => this.handleStateClick(e));
            state.addEventListener('mouseover', (e) => this.handleStateHover(e));
            state.addEventListener('mouseout', (e) => this.handleStateUnhover(e));
        });
    }    handleStateClick(event) {
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

            // Check if player 1 has enough funds
            if (player1.canSpend(cost)) {                // Deduct funds and record the action
                player1.updateFunds(-cost);
                stateInfo.recordStateAction(stateId, 1, cost);
                
                // Visual feedback
                if (this.selectedStates.has(stateId)) {
                    this.deselectState(stateId);
                } else {
                    this.selectState(stateId);
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
            stateElement.classList.add('selected');
            this.selectedStates.add(stateId);
            this.triggerStateSelectionEvent(stateId, true);
        }
    }

    deselectState(stateId) {
        const stateElement = this.svgDocument.getElementById(stateId);
        if (stateElement) {
            stateElement.classList.remove('selected');
            this.selectedStates.delete(stateId);
            this.triggerStateSelectionEvent(stateId, false);
        }
    }    handleStateHover(event) {
        const stateElement = event.target;
        const stateId = stateElement.id;
        
        stateElement.classList.add('hover');
        console.log('Hovering over state:', stateId);

        // Emit hover event with state ID
        window.dispatchEvent(new CustomEvent('stateHover', {
            detail: {
                stateId: stateId
            }
        }));
    }

    handleStateUnhover(event) {
        const stateElement = event.target;
        stateElement.classList.remove('hover');
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
