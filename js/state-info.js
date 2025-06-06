// State information display controller
class StateInfo {
    constructor() {
        this.statesData = null;
        this.statesDetails = document.querySelector('.states-details');
        this.statePopularity = new Map(); // Store popularity for each state
        this.stateActions = new Map(); // Store actions taken in each state
        this.initialize();
    }

    async initialize() {
        try {
            const response = await fetch('states_data.json');
            this.statesData = await response.json();
            this.setupEventListeners();
            console.log('StateInfo initialized successfully');
        } catch (error) {
            console.error('Failed to load states data:', error);
        }
    }

    setupEventListeners() {
        // Listen for state hovers from map
        window.addEventListener('stateHover', (event) => {
            console.log('Hover event received for state:', event.detail.stateId);
            const stateId = event.detail.stateId;
            this.updateStateInfo(stateId);
        });

        // Listen for small UT button hovers
        const utButtons = document.querySelectorAll('.small-uts-grid button');
        utButtons.forEach(button => {
            button.addEventListener('mouseenter', () => {
                const utName = this.getUTFullName(button.dataset.ut);
                const stateData = this.statesData.find(state => 
                    state.State.toLowerCase().replace(/[^a-z]/g, '') === utName.toLowerCase().replace(/[^a-z]/g, '')
                );
                if (stateData) {
                    this.updateStateInfo(stateData.SvgId);
                }
            });
        });
    }
    
    initializeState(stateId) {
        if (!this.statePopularity.has(stateId)) {
            // Initialize popularity and actions for new state
            this.statePopularity.set(stateId, {
                player1: 30,
                player2: 30,
                others: 40
            });
            
            this.stateActions.set(stateId, {
                player1Spent: 0,
                player2Spent: 0,
                player1Rallies: 0,
                player2Rallies: 0
            });
        }
        return {
            popularity: this.statePopularity.get(stateId),
            actions: this.stateActions.get(stateId)
        };
    }

    getUTFullName(utId) {
        const utNames = {
            'puducherry': 'Puducherry',
            'chandigarh': 'Chandigarh',
            'dadra-and-nagar-haveli': 'Dadra And Nagar Haveli',
            'daman-and-diu': 'Daman And Diu'
        };
        return utNames[utId] || utId;
    }

    recordStateAction(stateId, player, spentAmount) {
        const state = this.initializeState(stateId);
        const actions = state.actions;
        const popularity = state.popularity;
        const key = `player${player}`;
        
        // Record spending
        actions[`${key}Spent`] += spentAmount;
        
        // Calculate popularity change based on total investment
        const seats = parseInt(this.statesData.find(s => s.SvgId === stateId).LokSabhaSeats);
        const totalPossibleSpend = seats * 2; // Maximum reasonable spending
        const spendEfficiency = Math.min(1, spentAmount / totalPossibleSpend);
        const popularityGain = Math.round(5 * spendEfficiency);
        
        // Update popularity
        const oldValue = popularity[key];
        const newValue = Math.min(100, Math.max(0, oldValue + popularityGain));
        const diff = newValue - oldValue;
        
        if (diff !== 0) {
            popularity[key] = newValue;
            // Take from others first, then from the opponent if necessary
            const othersDiff = Math.min(popularity.others, diff);
            popularity.others -= othersDiff;
            
            if (diff > othersDiff) {
                const remainingDiff = diff - othersDiff;
                const otherPlayer = `player${player === 1 ? 2 : 1}`;
                popularity[otherPlayer] = Math.max(0, popularity[otherPlayer] - remainingDiff);
            }
        }

        // Update the display if this state is currently being shown
        this.refreshStateDisplay(stateId);
    }
    
    refreshStateDisplay(stateId) {
        const currentStateElement = this.statesDetails.querySelector('.state-info h4');
        if (currentStateElement) {
            const currentState = this.statesData.find(state => 
                currentStateElement.textContent.startsWith(state.State)
            );
            if (currentState && currentState.SvgId === stateId) {
                this.updateStateInfo(stateId);
            }
        }
    }

    updateStateInfo(stateId) {
        if (!this.statesData || !this.statesDetails) {
            console.log('Missing statesData or statesDetails');
            return;
        }
        
        const stateData = this.statesData.find(state => state.SvgId === stateId);
        if (!stateData) {
            console.log('No state data found for:', stateId);
            return;
        }

        console.log('Updating state info for:', stateData.State);

        // Get the state groups
        const groups = Object.entries(stateData)
            .filter(([key, value]) => value === "TRUE" && key !== "UnionTerritory")
            .map(([key]) => this.formatGroupName(key));

        // Initialize or get state data
        const state = this.initializeState(stateId);
        const popularity = state.popularity;

        this.statesDetails.innerHTML = `
            <div class="state-info">
                <h4>${stateData.State} (${stateData.LokSabhaSeats} seats)</h4>
                
                <div class="popularity-section">
                    <h5>Current Popularity</h5>
                    <div class="info-row">
                        <span>P1: ${popularity.player1}%</span>
                        <span>P2: ${popularity.player2}%</span>
                        <span>Others: ${popularity.others}%</span>
                    </div>
                </div>

                <div class="groups-section">
                    <h5>Groups</h5>
                    <div class="groups-list">
                        ${groups.join(' • ')}
                    </div>
                </div>
            </div>
        `;
    }

    formatGroupName(key) {
        return key.replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase())
            .trim();
    }
}

// Create and export a single instance
export const stateInfo = new StateInfo();
