// Player information management
class PlayerInfo {    
    constructor(playerId) {
        this.playerId = playerId;
        this.element = document.getElementById(`player${playerId}-info`);
        this.statsElement = this.element.querySelector('.player-stats');
        this.funds = 250; // Starting funds in millions
        this.initialize();
        
        // Bind the event handler and listen for phase changes to replenish funds
        this.handlePhaseChange = this.handlePhaseChange.bind(this);
        window.addEventListener('gamePhaseChanged', this.handlePhaseChange);
    }

    handlePhaseChange(event) {
        console.log(`Player ${this.playerId} received phase change event:`, event.detail);
        this.replenishFunds();
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
        console.log(`Player ${this.playerId} updating funds by ${amount}. Current funds: ${this.funds}`);
        this.funds = Math.max(0, this.funds + amount);
        const fundsElement = this.element.querySelector('.funds-amount');
        if (fundsElement) {
            fundsElement.textContent = `₹${this.funds} M`;
        }
        console.log(`New funds balance: ${this.funds}`);
        
        if (amount < 0) {
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
        console.log(`Checking if player ${this.playerId} can spend ${amount}. Current funds: ${this.funds}`);
        return this.funds >= amount;
    }
    
    showInsufficientFundsError() {
        console.log(`Showing insufficient funds error for player ${this.playerId}`);
        const fundsElement = this.element.querySelector('.funds-amount');
        if (fundsElement) {
            // Add shake animation class
            fundsElement.classList.add('shake-error');
            // Remove it after animation completes
            setTimeout(() => fundsElement.classList.remove('shake-error'), 500);
        }
    }    
    replenishFunds() {
        // Add 250M funds at each phase change (as per roadmap)
        const replenishAmount = 250;
        this.updateFunds(replenishAmount);
        console.log(`Player ${this.playerId} funds replenished by ${replenishAmount}M (current total: ${this.funds}M)`);
    }
      showPhaseReplenishmentNotification(amount) {
        // Create notification element for phase replenishment
        const notification = document.createElement('div');
        notification.className = 'phase-replenishment-notification';
        notification.textContent = `+${amount}M`;
        
        // Position near funds display
        const fundsElement = this.element.querySelector('.funds-amount');
        if (fundsElement) {
            const fundsRect = fundsElement.getBoundingClientRect();
            
            // Append to player info container
            this.element.style.position = 'relative';
            notification.style.position = 'absolute';
            notification.style.left = `${fundsRect.left - this.element.getBoundingClientRect().left + fundsRect.width / 2}px`;
            notification.style.top = `${fundsRect.top - this.element.getBoundingClientRect().top - 30}px`;
            notification.style.transform = 'translateX(-50%)';
            notification.style.backgroundColor = '#4CAF50';
            notification.style.color = 'white';
            notification.style.padding = '4px 8px';
            notification.style.borderRadius = '4px';
            notification.style.fontSize = '12px';
            notification.style.fontWeight = 'bold';
            notification.style.zIndex = '1000';
            notification.style.animation = 'fadeInOut 2s ease-in-out';
              this.element.appendChild(notification);
            
            // Remove after animation completes (same duration as regular fund notifications)
            setTimeout(() => {
                if (this.element.contains(notification)) {
                    this.element.removeChild(notification);
                }
            }, 600);
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
