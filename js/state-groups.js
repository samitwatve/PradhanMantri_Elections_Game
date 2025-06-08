// State grouping functionality
class StateGroups {
    constructor() {
        this.groups = new Map();
        this.statesData = null;
        this.initialize();
    }

    async initialize() {
        try {
            // Load states data
            const response = await fetch('states_data.json');
            this.statesData = await response.json();
            
            // Initialize groups from states data
            this.initializeGroups();
            
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
        } catch (error) {
            console.error('Failed to load states data:', error);
        }
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
    }

    handleGroupClick(event) {
        const button = event.target;
        const groupName = button.textContent;
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
                    const otherGroupName = otherButton.textContent;
                    const otherStates = this.getStatesInGroup(otherGroupName);
                    otherStates.forEach(stateId => {
                        window.dispatchEvent(new CustomEvent('toggleStateHighlight', {
                            detail: { stateId, forceOff: true }
                        }));
                    });
                }
            });
        }
        
        // Toggle highlight for states in this group
        states.forEach(stateId => {
            window.dispatchEvent(new CustomEvent('toggleStateHighlight', {
                detail: { stateId, forceState: isActive }
            }));
        });
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

    // Add more methods as needed for group management
}

// Create and export a single instance
export const stateGroups = new StateGroups();
