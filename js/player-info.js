// Player information management
class PlayerInfo {
    constructor(playerId) {
        this.playerId = playerId;
        this.element = document.getElementById(`player${playerId}-info`);
        this.statsElement = this.element.querySelector('.player-stats');
        this.initialize();
    }    initialize() {
        const playerConfig = {
            1: {
                name: 'Sam',
                party: 'BJP'
            },
            2: {
                name: 'AI',
                party: 'INC'
            }
        };

        const config = playerConfig[this.playerId];
        if (config) {
            this.element.innerHTML = `
                <div class="player-name">
                    <span class="name">${config.name}</span>
                    <span class="party">(${config.party})</span>
                </div>
                <div class="player-stats">
                    <div class="player-funds">
                        <span class="funds-label">Funds:</span>
                        <span class="funds-amount">₹250 M</span>
                    </div>
                    <div class="rally-tokens">
                        <span class="rally-tokens-label">Rallies:</span>
                        <span class="rally-tokens-display">O O</span>
                    </div>
                </div>
            `;
        }
    }

    update(data) {
        // Future updates to player info can be handled here
        if (!this.statsElement) return;
    }
}

// Create and export instances for both players
export const player1 = new PlayerInfo(1);
export const player2 = new PlayerInfo(2);
