// Player information management
class PlayerInfo {
    constructor(playerId) {
        this.playerId = playerId;
        this.element = document.getElementById(`player${playerId}-info`);
        this.statsElement = this.element.querySelector('.player-stats');
        this.initialize();
    }

    initialize() {
        this.update({
            name: `Player ${this.playerId}`,
            states: 0,
            seats: 0,
            influence: 0
        });
    }

    update(data) {
        if (!this.statsElement) return;

        this.statsElement.innerHTML = `
            <div class="player-stat">
                <strong>Name:</strong> ${data.name}
            </div>
            <div class="player-stat">
                <strong>States Controlled:</strong> ${data.states}
            </div>
            <div class="player-stat">
                <strong>Projected Seats:</strong> ${data.seats}
            </div>
            <div class="player-stat">
                <strong>Influence Level:</strong> ${data.influence}%
            </div>
        `;
    }
}

// Create and export instances for both players
export const player1 = new PlayerInfo(1);
export const player2 = new PlayerInfo(2);
