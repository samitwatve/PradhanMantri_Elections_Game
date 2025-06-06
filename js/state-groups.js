// State grouping functionality
class StateGroups {
    constructor() {
        this.groups = new Map();
        this.initialize();
    }

    initialize() {
        // Initialize event listeners for group buttons
        const buttons = document.querySelectorAll('.button-grid button');
        buttons.forEach(button => {
            button.addEventListener('click', (e) => this.handleGroupClick(e));
        });

        // Initialize small UTs panel
        const utButtons = document.querySelectorAll('.small-uts-grid button');
        utButtons.forEach(button => {
            button.addEventListener('click', (e) => this.handleUTClick(e));
        });
    }

    handleGroupClick(event) {
        const button = event.target;
        const groupName = button.textContent;
        
        // Toggle active state of the button
        button.classList.toggle('active');
        
        // Highlight states in this group on the map
        this.toggleGroupHighlight(groupName);
    }

    handleUTClick(event) {
        const button = event.target;
        const utId = button.dataset.ut;
        
        // Handle UT selection
        this.selectUT(utId);
    }

    toggleGroupHighlight(groupName) {
        const states = this.getStatesInGroup(groupName);
        states.forEach(stateId => {
            // This will be handled by map-controller.js
            window.dispatchEvent(new CustomEvent('toggleStateHighlight', {
                detail: { stateId }
            }));
        });
    }

    selectUT(utId) {
        // This will be handled by map-controller.js
        window.dispatchEvent(new CustomEvent('selectUT', {
            detail: { utId }
        }));
    }

    getStatesInGroup(groupName) {
        // Return array of state IDs for the given group
        return this.groups.get(groupName) || [];
    }

    // Add more methods as needed for group management
}

// Create and export a single instance
export const stateGroups = new StateGroups();
