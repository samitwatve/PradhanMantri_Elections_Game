// Map interaction and state management
class MapController {
    constructor() {
        this.svgDocument = null;
        this.selectedStates = new Set();
        this.initialize();
    }

    initialize() {
        const map = document.getElementById('india-map');
        map.addEventListener('load', () => {
            this.svgDocument = map.contentDocument;
            this.setupStateInteractions();
        });
    }

    setupStateInteractions() {
        if (!this.svgDocument) return;

        const states = this.svgDocument.querySelectorAll('path[id]');
        states.forEach(state => {
            state.addEventListener('click', (e) => this.handleStateClick(e));
            state.addEventListener('mouseover', (e) => this.handleStateHover(e));
            state.addEventListener('mouseout', (e) => this.handleStateUnhover(e));
        });
    }

    handleStateClick(event) {
        const stateElement = event.target;
        const stateId = stateElement.id;

        if (this.selectedStates.has(stateId)) {
            this.deselectState(stateId);
        } else {
            this.selectState(stateId);
        }
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
    }

    handleStateHover(event) {
        const stateElement = event.target;
        stateElement.classList.add('hover');

        // Emit hover event with state ID
        window.dispatchEvent(new CustomEvent('stateHover', {
            detail: {
                stateId: stateElement.id
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
