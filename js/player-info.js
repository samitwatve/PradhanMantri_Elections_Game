// Player information management
class PlayerInfo {    
    constructor(playerId) {
        this.playerId = playerId;
        this.element = document.getElementById(`player${playerId}-info`);
        this.statsElement = this.element.querySelector('.player-stats');
        this.funds = 250; // Starting funds in millions
        this.initialize();
    }

    initialize() {
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
                        <span class="funds-amount">₹${this.funds} M</span>
                    </div>
                    <div class="rally-tokens">
                        <span class="rally-tokens-label">Rallies:</span>
                        <span class="rally-tokens-display">O O</span>
                    </div>
                </div>
            `;
        }
    }

    updateFunds(amount) {
        this.funds += amount;
        const fundsElement = this.element.querySelector('.funds-amount');
        if (fundsElement) {
            fundsElement.textContent = `₹${this.funds} M`;
            
            // Create and display transient notification
            this.showFundChangeNotification(amount);
        }
    }
    
    showFundChangeNotification(amount) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `fund-change-notification ${amount < 0 ? 'decrease' : 'increase'}`;
        notification.textContent = `${amount > 0 ? '+' : ''}${amount} M`;
        
        // Position near funds display
        const fundsElement = this.element.querySelector('.funds-amount');
        if (fundsElement) {
            const fundsRect = fundsElement.getBoundingClientRect();
            
            // Append to player info container
            this.element.style.position = 'relative';
            notification.style.left = `${fundsRect.left - this.element.getBoundingClientRect().left + fundsRect.width / 2}px`;
            notification.style.top = `${fundsRect.top - this.element.getBoundingClientRect().top}px`;
            
            this.element.appendChild(notification);
              // Remove after animation completes
            setTimeout(() => {
                if (this.element.contains(notification)) {
                    this.element.removeChild(notification);
                }
            }, 600);
        }
    }

    updatePopularity(amount) {
        this.popularity = Math.min(100, Math.max(0, this.popularity + amount));
        const popularityElement = this.element.querySelector('.popularity-amount');
        if (popularityElement) {
            popularityElement.textContent = `${this.popularity}%`;
        }
    }

    canSpend(amount) {
        return this.funds >= amount;
    }
    
    showInsufficientFundsError() {
        const fundsElement = this.element.querySelector('.funds-amount');
        if (fundsElement) {
            // Add shake animation
            fundsElement.classList.add('shake-animation');
            
            // Temporarily highlight in red
            const originalColor = fundsElement.style.color;
            fundsElement.style.color = 'red';
            
            // Remove shake and restore color after animation completes
            setTimeout(() => {
                fundsElement.classList.remove('shake-animation');
                fundsElement.style.color = originalColor;
            }, 500);
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
