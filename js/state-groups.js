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

        // Initialize small UTs panel with both click and hover handlers
        const utButtons = document.querySelectorAll('.small-uts-grid button');
        utButtons.forEach(button => {
            button.addEventListener('click', (e) => this.handleUTClick(e));
            button.addEventListener('mouseover', (e) => this.handleUTHover(e));
            button.addEventListener('mouseout', (e) => this.handleUTUnhover(e));
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
    }

    handleUTClick(event) {
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
