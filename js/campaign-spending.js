// Campaign Spending Service
// Centralized service for handling campaign fund expenditures

import { player1 } from "./player-info.js";
import { stateInfo } from "./state-info.js";
import { homeStateBonus } from "./home-state-bonus.js";
import { visualEffects } from "./visual-effects.js";

class CampaignSpending {
  constructor() {
    // Standard spending multipliers
    this.SINGLE_SPEND_MULTIPLIER = 1;
    this.BURST_SPEND_MULTIPLIER = 3;
  }

  /**
   * Calculate the base campaign cost for a state
   * @param {Object} stateData - State data object containing LokSabhaSeats
   * @param {number} playerId - Player ID (1 or 2)
   * @returns {number} Base cost for campaigning in this state
   */
  calculateBaseCost(stateData, playerId = 1) {
    const seats = parseInt(stateData.LokSabhaSeats);
    const baseCost = seats;
    
    // Apply home state discount if applicable
    return homeStateBonus.getCampaignCost(playerId, stateData.State, baseCost);
  }

  /**
   * Single campaign spend - equivalent to one click
   * @param {string} stateId - State ID to spend on
   * @param {Object} stateData - State data object
   * @param {number} playerId - Player ID (default: 1)
   * @param {Object} visualContext - Context for visual effects (optional)
   * @returns {boolean} True if spending was successful
   */
  async singleCampaignSpend(stateId, stateData, playerId = 1, visualContext = null) {
    const player = playerId === 1 ? player1 : player2;
    const cost = this.calculateBaseCost(stateData, playerId);

    if (!player.canSpend(cost)) {
      this.handleInsufficientFunds(player, stateData, visualContext);
      return false;
    }

    // Execute the spending
    player.updateFunds(-cost);
    stateInfo.recordStateAction(stateId, playerId, cost);

    // Show visual feedback for successful spending
    this.showSuccessfulSpending(stateData, visualContext, playerId);

    console.log(`Single campaign spend: Player ${playerId} spent ${cost}M on ${stateId}`);
    return true;
  }

  /**
   * Burst campaign spend - equivalent to 3 clicks (Shift + click)
   * @param {string} stateId - State ID to spend on
   * @param {Object} stateData - State data object
   * @param {number} playerId - Player ID (default: 1)
   * @param {Object} visualContext - Context for visual effects (optional)
   * @returns {boolean} True if spending was successful
   */
  async burstCampaignSpend(stateId, stateData, playerId = 1, visualContext = null) {
    const player = playerId === 1 ? player1 : player2;
    const singleCost = this.calculateBaseCost(stateData, playerId);
    const totalCost = singleCost * this.BURST_SPEND_MULTIPLIER;

    if (!player.canSpend(totalCost)) {
      this.handleInsufficientFunds(player, stateData, visualContext);
      return false;
    }    // Execute the burst spending as multiple campaign actions
    player.updateFunds(-totalCost);
    
    // Record as 3 separate campaign actions for proper popularity calculation
    for (let i = 0; i < this.BURST_SPEND_MULTIPLIER; i++) {
      stateInfo.recordStateAction(stateId, playerId, singleCost);
    }

    // Play burst spending sound effects (3 times, staggered)
    this.playBurstSpendingSounds(playerId);

    // Show enhanced visual feedback for burst spending
    this.showBurstSpendingFeedback(stateData, visualContext, playerId);

    console.log(`Burst campaign spend: Player ${playerId} spent ${totalCost}M (${this.BURST_SPEND_MULTIPLIER}x ${singleCost}M) on ${stateId}`);
    return true;
  }

  /**
   * Main spending method that determines single vs burst based on event
   * @param {Event} event - The click event (checks for shiftKey)
   * @param {string} stateId - State ID to spend on
   * @param {Object} stateData - State data object
   * @param {number} playerId - Player ID (default: 1)
   * @param {Object} visualContext - Context for visual effects (optional)
   * @returns {boolean} True if spending was successful
   */
  async handleCampaignSpend(event, stateId, stateData, playerId = 1, visualContext = null) {
    // Check if this is a burst spend (Shift + click)
    if (event && event.shiftKey) {
      return await this.burstCampaignSpend(stateId, stateData, playerId, visualContext);
    } else {
      return await this.singleCampaignSpend(stateId, stateData, playerId, visualContext);
    }
  }

  /**
   * Handle insufficient funds error with consistent feedback
   * @param {Object} player - Player object
   * @param {Object} stateData - State data object
   * @param {Object} visualContext - Context for visual effects
   */
  handleInsufficientFunds(player, stateData, visualContext) {
    player.showInsufficientFundsError();

    // Show visual error feedback if context is provided
    if (visualContext && visualContext.element) {
      visualEffects.showErrorFeedback(visualContext.element);
    }

    console.log(`Insufficient funds: Player ${player.playerId} cannot afford campaign in ${stateData.State}`);
  }

  /**
   * Show visual feedback for successful single spending
   * @param {Object} stateData - State data object
   * @param {Object} visualContext - Context for visual effects
   * @param {number} playerId - Player ID
   */
  showSuccessfulSpending(stateData, visualContext, playerId) {
    if (!visualContext) return;

    // Show ripple effect if coordinates are provided
    if (visualContext.point) {
      visualEffects.createRippleEffect(visualContext.point.x, visualContext.point.y, playerId);
    }

    // Show home state indicator if applicable
    if (visualContext.element && homeStateBonus.isHomeState(playerId, stateData.State)) {
      visualEffects.showHomeStateIndicator(visualContext.element);
    }
  }

  /**
   * Show enhanced visual feedback for burst spending
   * @param {Object} stateData - State data object
   * @param {Object} visualContext - Context for visual effects
   * @param {number} playerId - Player ID
   */
  showBurstSpendingFeedback(stateData, visualContext, playerId) {
    if (!visualContext) return;

    // Show multiple ripple effects for burst spending
    if (visualContext.point) {
      for (let i = 0; i < this.BURST_SPEND_MULTIPLIER; i++) {
        setTimeout(() => {
          visualEffects.createRippleEffect(visualContext.point.x, visualContext.point.y, playerId);
        }, i * 100); // Stagger the effects
      }
    }

    // Show home state indicator if applicable
    if (visualContext.element && homeStateBonus.isHomeState(playerId, stateData.State)) {
      visualEffects.showHomeStateIndicator(visualContext.element);
    }

    console.log(`Burst spending visual feedback for ${stateData.State}`);
  }

  /**
   * Play burst spending sound effects (3 times, staggered)
   * @param {number} playerId - Player ID
   */
  playBurstSpendingSounds(playerId) {
    // Only play sounds for Player 1 (human player)
    if (window.soundManager && playerId === 1) {
      for (let i = 0; i < this.BURST_SPEND_MULTIPLIER; i++) {
        setTimeout(() => {
          window.soundManager.playMoneySpent();
        }, i * 150); // Stagger the sounds by 150ms
      }
    }
  }

  /**
   * Get preview of spending costs for UI display
   * @param {Object} stateData - State data object
   * @param {number} playerId - Player ID
   * @returns {Object} Object with single and burst costs
   */
  getSpendingPreview(stateData, playerId = 1) {
    const singleCost = this.calculateBaseCost(stateData, playerId);
    return {
      single: singleCost,
      burst: singleCost * this.BURST_SPEND_MULTIPLIER,
      isHomeState: homeStateBonus.isHomeState(playerId, stateData.State)
    };
  }
}

// Create and export the singleton instance
export const campaignSpending = new CampaignSpending();

// Expose to window for global access
window.campaignSpending = campaignSpending;
