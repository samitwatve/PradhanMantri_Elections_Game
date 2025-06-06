// State information display controller
class StateInfo {
    constructor() {
        this.statesData = null;
        this.statesDetails = document.querySelector('.states-details');
        this.initialize();
    }

    async initialize() {
        try {
            const response = await fetch('states_data.json');
            this.statesData = await response.json();
            this.setupEventListeners();
        } catch (error) {
            console.error('Failed to load states data:', error);
        }
    }    setupEventListeners() {
        // Listen for state hovers from map
        window.addEventListener('stateHover', (event) => {
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

    getUTFullName(utId) {
        const utNames = {
            'puducherry': 'Puducherry',
            'chandigarh': 'Chandigarh',
            'dadra-and-nagar-haveli': 'Dadra And Nagar Haveli',
            'daman-and-diu': 'Daman And Diu'
        };
        return utNames[utId] || utId;
    }

    updateStateInfo(stateId) {
        const stateData = this.statesData.find(state => state.SvgId === stateId);
        if (!stateData || !this.statesDetails) return;

        // Get the state groups
        const groups = Object.entries(stateData)
            .filter(([key, value]) => value === "TRUE" && key !== "UnionTerritory")
            .map(([key]) => this.formatGroupName(key));

        // Mock data for popularity and rallies (to be replaced with actual game state)
        const player1Popularity = Math.floor(Math.random() * 100);
        const player2Popularity = Math.floor(Math.random() * (100 - player1Popularity));
        const othersPopularity = 100 - player1Popularity - player2Popularity;        this.statesDetails.innerHTML = `
            <div class="state-info">
                <h4>${stateData.State} (${stateData.LokSabhaSeats} seats)</h4>
                
                <div class="popularity-section">
                    <h5>Current Popularity</h5>
                    <div class="info-row">
                        <span>P1: ${player1Popularity}%</span>
                        <span>P2: ${player2Popularity}%</span>
                        <span>Others: ${othersPopularity}%</span>
                    </div>
                </div>

                <div class="rallies-section">
                    <h5>Rallies (This Phase)</h5>
                    <div class="info-row">
                        <span>P1: ${this.getRandomRallies()}/2</span>
                        <span>P2: ${this.getRandomRallies()}/2</span>
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

    getRandomRallies() {
        return Math.floor(Math.random() * 3); // Returns 0, 1, or 2
    }
}

// Create and export a single instance
export const stateInfo = new StateInfo();
