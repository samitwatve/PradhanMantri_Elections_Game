// Player information management
import { gameConfig } from "./game-config.js";

class PlayerInfo {
  constructor(playerId) {
    this.playerId = playerId;
    this.element = null;
    this.statsElement = null;

    // Set starting funds based on game config and player
    if (playerId === 1) {
      this.funds = gameConfig.getPlayer1StartingFunds();
    } else {
      this.funds = gameConfig.getPlayer2StartingFunds();
    }

    // Rally tokens - each player starts with maxRallyTokens (normal tokens only)
    this.maxRallyTokens = 2;
    this.rallyTokens = this.maxRallyTokens; // normal tokens
    this.specialTokenCount = 0; // special tokens

    // Initialize when DOM is ready
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => this.initializeDOM());
    } else {
      this.initializeDOM();
    }

    // Bind the event handler and listen for phase changes to replenish funds
    this.handlePhaseChange = this.handlePhaseChange.bind(this);
    window.addEventListener("gamePhaseChanged", this.handlePhaseChange);
  }

  initializeDOM() {
    this.element = document.getElementById(`player${this.playerId}-info`);
    if (this.element) {
      this.statsElement = this.element.querySelector(".player-stats");
    }

    this.initialize();
  }

  handlePhaseChange(event) {
    console.log(
      `Player ${this.playerId} received phase change event:`,
      event.detail,
    );
    this.replenishFunds();
    this.replenishRallyTokens();
  }
  initialize() {
    // Get game configuration from localStorage or use defaults
    const gameConfig = this.getGameConfig();

    const playerConfig = {
      1: {
        name: gameConfig.playerName || "Player 1",
        party: gameConfig.player1Politician?.party || "BJP",
        politician: gameConfig.player1Politician,
        primaryColor: gameConfig.player1Politician?.primaryColor || "#FF9933",
      },
      2: {
        name: "AI",
        party: gameConfig.player2Politician?.party || "INC",
        politician: gameConfig.player2Politician,
        primaryColor: gameConfig.player2Politician?.primaryColor || "#138808",
      },
    };

    const config = playerConfig[this.playerId];
    if (config) {
      // Store politician data for later use
      this.politician = config.politician;
      this.primaryColor = config.primaryColor;

      // Add (DEBUG) indicator for Player 1 when funds are set to debug levels            const debugMode = this.playerId === 1 && this.funds > 5000;
      const partyText = `(${config.party})`;

      if (!this.element) {
        console.warn(
          `Player ${this.playerId} element not found, skipping render`,
        );
        return;
      }

      this.element.innerHTML = `
                <div class="player-name">
                    <span class="name">${config.name}</span>
                    <span class="party">${partyText}</span>
                </div>
                <div class="player-stats">                    
                    <div class="player-funds">
                        <span class="funds-label">Funds:</span>
                        <span class="funds-amount">₹${this.funds} M</span>
                    </div>                      <div class="rally-tokens">
                        <span class="rally-tokens-label">Rally:</span>
                        <span class="rally-tokens-display"><!-- Tokens will be rendered by rally controller --></span>
                    </div>
                </div>
            `;
      // Update CSS custom properties for this player's color
      this.updatePlayerColors();

      // Notify that player is fully initialized
      console.log(
        `Player ${this.playerId} fully initialized with color: ${this.primaryColor}`,
      );
      window.dispatchEvent(
        new CustomEvent("playerInitialized", {
          detail: { playerId: this.playerId, primaryColor: this.primaryColor },
        }),
      );
    }
  }

  getGameConfig() {
    try {
      const stored = localStorage.getItem("gameConfig");
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.warn("Error loading game config:", error);
      return {};
    }
  }

  updatePlayerColors() {
    if (this.primaryColor) {
      const root = document.documentElement;
      root.style.setProperty(
        `--player${this.playerId}-color`,
        this.primaryColor,
      );

      // Generate lighter and darker variants
      const lightColor = this.lightenColor(this.primaryColor, 20);
      const darkColor = this.darkenColor(this.primaryColor, 20);

      root.style.setProperty(
        `--player${this.playerId}-color-light`,
        lightColor,
      );
      root.style.setProperty(`--player${this.playerId}-color-dark`, darkColor);
    }
  }
  updateFunds(amount) {
    console.log(
      `Player ${this.playerId} updating funds by ${amount}. Current funds: ${this.funds}`,
    );
    this.funds = Math.max(0, this.funds + amount);

    if (!this.element) {
      console.log(
        `Player ${this.playerId} element not found, skipping DOM update`,
      );
      return;
    }

    const fundsElement = this.element.querySelector(".funds-amount");
    if (fundsElement) {
      fundsElement.textContent = `₹${this.funds} M`;
    }
    console.log(`New funds balance: ${this.funds}`);
    // Play sound effects based on fund change (only for Player 1)
    if (window.soundManager && this.playerId === 1) {
      if (amount > 0) {
        window.soundManager.playCashAdded();
      } else if (amount < 0) {
        window.soundManager.playMoneySpent();
      }
    }

    // Show notification for both positive and negative amounts
    this.showFundChangeNotification(amount);
  }

  showFundChangeNotification(amount) {
    // Create notification element
    const notification = document.createElement("div");
    notification.className = `fund-change-notification ${amount < 0 ? "decrease" : "increase"}`;
    notification.textContent = `${amount > 0 ? "+" : ""}${amount} M`;

    // Position near funds display
    const fundsElement = this.element.querySelector(".funds-amount");
    if (fundsElement) {
      const fundsRect = fundsElement.getBoundingClientRect();

      // Append to player info container
      this.element.style.position = "relative";
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
    const popularityElement = this.element.querySelector(".popularity-amount");
    if (popularityElement) {
      popularityElement.textContent = `${this.popularity}%`;
    }
  }

  canSpend(amount) {
    console.log(
      `Checking if player ${this.playerId} can spend ${amount}. Current funds: ${this.funds}`,
    );
    return this.funds >= amount;
  }
  showInsufficientFundsError() {
    console.log(`Showing insufficient funds error for player ${this.playerId}`);

    // Play invalid action sound (only for Player 1)
    if (window.soundManager && this.playerId === 1) {
      window.soundManager.playInvalidAction();
    }

    const fundsElement = this.element.querySelector(".funds-amount");
    if (fundsElement) {
      // Add shake animation class
      fundsElement.classList.add("shake-error");
      // Remove it after animation completes
      setTimeout(() => fundsElement.classList.remove("shake-error"), 500);
    }
  }
  replenishFunds() {
    // Add funds at each phase change based on game config
    let replenishAmount;
    if (this.playerId === 1) {
      replenishAmount = gameConfig.getPlayer1RefreshFunds();
    } else {
      replenishAmount = gameConfig.getPlayer2RefreshFunds();
    }

    this.updateFunds(replenishAmount);
    console.log(
      `Player ${this.playerId} funds replenished by ${replenishAmount}M (current total: ${this.funds}M)`,
    );
  }

  showPhaseReplenishmentNotification(amount) {
    // Create notification element for phase replenishment
    const notification = document.createElement("div");
    notification.className = "phase-replenishment-notification";
    notification.textContent = `+${amount}M`;

    // Position near funds display
    const fundsElement = this.element.querySelector(".funds-amount");
    if (fundsElement) {
      const fundsRect = fundsElement.getBoundingClientRect();

      // Append to player info container
      this.element.style.position = "relative";
      notification.style.position = "absolute";
      notification.style.left = `${fundsRect.left - this.element.getBoundingClientRect().left + fundsRect.width / 2}px`;
      notification.style.top = `${fundsRect.top - this.element.getBoundingClientRect().top - 30}px`;
      notification.style.transform = "translateX(-50%)";
      notification.style.backgroundColor = "#4CAF50";
      notification.style.color = "white";
      notification.style.padding = "4px 8px";
      notification.style.borderRadius = "4px";
      notification.style.fontSize = "12px";
      notification.style.fontWeight = "bold";
      notification.style.zIndex = "1000";
      notification.style.animation = "fadeInOut 2s ease-in-out";
      this.element.appendChild(notification);

      // Remove after animation completes (same duration as regular fund notifications)
      setTimeout(() => {
        if (this.element.contains(notification)) {
          this.element.removeChild(notification);
        }
      }, 600);
    }
  }
  showGroupDominationBonusNotification(groupName, bonusAmount) {
    // Add news update to TV display with short 2-second duration
    const playerParty =
      this.politician?.party || (this.playerId === 1 ? "Player 1" : "Player 2");
    window.tvDisplay.addNewsUpdate(
      "BREAKING: " +
        playerParty +
        " dominates " +
        groupName +
        "! +" +
        bonusAmount +
        "M bonus",
      false,
      2000    );
  }

  // Rally token management methods
  // DEPRECATED: This method has flawed logic that can show more than 2 tokens
  // Use rallyController.createDraggableRallyIcons() instead for consistent display
  getRallyTokensDisplay() {
    let display = "";
    // Normal tokens
    for (let i = 0; i < this.maxRallyTokens; i++) {
      if (i < this.rallyTokens) {
        display += '<span class="rally-token-icon rally-token-bg available">📢</span>';
      } else {
        display += '<span class="rally-token-icon rally-token-bg used">📢</span>';
      }
    }
    // Special token (if any) - FLAWED: This can cause more than 2 total tokens to display
    if (this.specialTokenCount > 0) {
      display += '<span class="rally-token-icon rally-token-bg special">★</span>';
    }
    return display;
  }

  updateRallyTokensDisplay() {
    const rallyTokensElement = this.element.querySelector(
      ".rally-tokens-display",
    );
    if (rallyTokensElement) {
      // Use the rally controller's unified display function
      if (window.rallyController && window.rallyController.isReady && window.rallyController.isReady()) {
        window.rallyController.createDraggableRallyIcons(rallyTokensElement, this.playerId);
      } else {
        // Fallback to old method if rally controller not ready
        rallyTokensElement.innerHTML = this.getRallyTokensDisplay();
      }
    }
  }
  canUseRallyToken() {
    return this.rallyTokens > 0 || this.specialTokenCount > 0;
  }

  useRallyToken() {
    if (this.canUseRallyToken()) {
      this.rallyTokens--;
      this.updateRallyTokensDisplay();
      console.log(
        `Player ${this.playerId} used rally token. Remaining: ${this.rallyTokens}`,
      );
      return true;
    }
    return false;
  }

  replenishRallyTokens() {
    this.updateRallyTokensDisplay();
    // Only update the UI to reflect current values, do not assign tokens here
    console.log(
      `Player ${this.playerId} rally tokens UI refreshed (no assignment here). Current: ${this.rallyTokens}, special: ${this.specialTokenCount}`,
    );
  }
  showInsufficientRallyTokensError() {
    console.log(
      `Showing insufficient rally tokens error for player ${this.playerId}`,
    );

    // Play invalid action sound (only for Player 1)
    if (window.soundManager && this.playerId === 1) {
      window.soundManager.playInvalidAction();
    }

    const rallyTokensElement = this.element.querySelector(
      ".rally-tokens-display",
    );
    if (rallyTokensElement) {
      // Add shake animation class
      rallyTokensElement.classList.add("shake-error");
      // Remove it after animation completes
      setTimeout(() => rallyTokensElement.classList.remove("shake-error"), 500);
    }
  }

  update(data) {
    // Future updates to player info can be handled here
    if (!this.statsElement) return;
  }

  updateDisplay() {
    // Update the display to reflect current funds
    if (!this.element) {
      console.log(
        `Player ${this.playerId} element not found, skipping DOM update`,
      );
      return;
    }

    const fundsElement = this.element.querySelector(".funds-amount");
    if (fundsElement) {
      fundsElement.textContent = `₹${this.funds} M`;
    }    const rallyTokensElement = this.element.querySelector(
      ".rally-tokens-display",
    );
    if (rallyTokensElement) {
      // Use the rally controller's unified display function
      if (window.rallyController && window.rallyController.isReady && window.rallyController.isReady()) {
        window.rallyController.createDraggableRallyIcons(rallyTokensElement, this.playerId);
      } else {
        // Fallback to old method if rally controller not ready
        rallyTokensElement.innerHTML = this.getRallyTokensDisplay();
      }
    }

    console.log(
      `Player ${this.playerId} display updated - Funds: ${this.funds}M, Rally Tokens: ${this.rallyTokens}`,
    );
  }

  // Color utility functions
  lightenColor(color, percent) {
    const num = parseInt(color.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = ((num >> 8) & 0x00ff) + amt;
    const B = (num & 0x0000ff) + amt;
    return (
      "#" +
      (
        0x1000000 +
        (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
        (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
        (B < 255 ? (B < 1 ? 0 : B) : 255)
      )
        .toString(16)
        .slice(1)
    );
  }

  darkenColor(color, percent) {
    const num = parseInt(color.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) - amt;
    const G = ((num >> 8) & 0x00ff) - amt;
    const B = (num & 0x0000ff) - amt;
    return (
      "#" +
      (
        0x1000000 +
        (R > 0 ? (R > 255 ? 255 : R) : 0) * 0x10000 +
        (G > 0 ? (G > 255 ? 255 : G) : 0) * 0x100 +
        (B > 0 ? (B > 255 ? 255 : B) : 0)
      )
        .toString(16)
        .slice(1)
    );
  }
}

// Helper function to get the current player number
export function getCurrentPlayerNumber() {
  // Import gameState to get current player
  // For now, assume Player 1 is the human player (can be enhanced later)
  return 1; // This could be made dynamic based on turn-based gameplay
}

// Create and export instances for both players
export const player1 = new PlayerInfo(1);
export const player2 = new PlayerInfo(2);
