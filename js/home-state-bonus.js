// Home State Bonus Module
// This module manages the home state bonuses for politicians

class HomeStateBonus {
  constructor() {
    this.initialized = false;
    this.player1HomeState = null;
    this.player2HomeState = null;
  }
  async initialize() {
    if (this.initialized) return;

    try {
      // Get game configuration from localStorage
      const storedConfig = localStorage.getItem("gameConfig");
      if (storedConfig) {
        const gameConfig = JSON.parse(storedConfig);

        // Load politicians data to get home states
        const response = await fetch("./politicians-data.json");
        const politiciansData = await response.json();

        // Find home states from politicians data
        if (gameConfig.player1Politician) {
          const player1Data = politiciansData.politicians.find(
            politician => politician.name === gameConfig.player1Politician
          );
          if (player1Data) {
            this.player1HomeState = player1Data.homeState;
          }
        }

        if (gameConfig.player2Politician) {
          const player2Data = politiciansData.politicians.find(
            politician => politician.name === gameConfig.player2Politician
          );
          if (player2Data) {
            this.player2HomeState = player2Data.homeState;
          }
        }

        console.log(
          `Initialized home states - Player 1: ${this.player1HomeState} (${gameConfig.player1Politician}), Player 2: ${this.player2HomeState} (${gameConfig.player2Politician})`,
        );
        this.initialized = true;
      }
    } catch (error) {
      console.error("Error initializing home state bonuses:", error);
    }
  }

  /**
   * Check if a state is the home state for a player
   * @param {number} playerId - The player ID (1 or 2)
   * @param {string} stateName - The name of the state to check
   * @returns {boolean} - True if it's the player's home state
   */ isHomeState(playerId, stateName) {
    if (!this.initialized) {
      console.warn("Home state bonus module not initialized");
      return false;
    }

    const playerHomeState =
      playerId === 1 ? this.player1HomeState : this.player2HomeState;

    // Exact match check
    let isHome = playerHomeState && playerHomeState === stateName;

    // If not an exact match, try case-insensitive matching and alternative formats
    if (!isHome && playerHomeState) {
      // Try case-insensitive match
      if (playerHomeState.toLowerCase() === stateName.toLowerCase()) {
        isHome = true;
      }

      // Try with/without spaces (e.g., "UttarPradesh" vs "Uttar Pradesh")
      const normalized1 = playerHomeState.replace(/\s+/g, "").toLowerCase();
      const normalized2 = stateName.replace(/\s+/g, "").toLowerCase();
      if (normalized1 === normalized2) {
        isHome = true;
      }
    }

    console.log(
      `Checking home state for Player ${playerId}: "${stateName}" against "${playerHomeState}". Result: ${isHome}`,
    );

    return isHome;
  }

  /**
   * Get the campaign cost for a state with home state discount applied if applicable
   * @param {number} playerId - The player ID (1 or 2)
   * @param {string} stateName - The name of the state
   * @param {number} baseCost - The base cost of the campaign
   * @returns {number} - The adjusted cost with home state discount applied
   */ getCampaignCost(playerId, stateName, baseCost) {
    console.log(
      `Checking campaign cost for Player ${playerId} in ${stateName}. Base cost: ${baseCost}M`,
    );

    if (this.isHomeState(playerId, stateName)) {
      // Apply 20% discount for home state (multiply by 0.8)
      const discountedCost = Math.round(baseCost * 0.8);
      console.log(
        `%cHome state discount applied for Player ${playerId} in ${stateName}. Original cost: ${baseCost}M, Discounted: ${discountedCost}M`,
        "color: gold; font-weight: bold",
      );
      return discountedCost;
    }

    console.log(
      `No home state discount for Player ${playerId} in ${stateName}. Cost remains: ${baseCost}M`,
    );
    return baseCost;
  }

  /**
   * Get the home state of a player
   * @param {number} playerId - The player ID (1 or 2)
   * @returns {string|null} - The home state name or null
   */
  getPlayerHomeState(playerId) {
    if (!this.initialized) {
      console.warn("Home state bonus module not initialized");
      return null;
    }

    return playerId === 1 ? this.player1HomeState : this.player2HomeState;
  }

  /**
   * Manually apply home state bonus to popularity scores
   * @param {string} stateId - The state SVG ID
   * @param {string} stateName - The state name
   * @param {object} popularity - The popularity object {player1, player2, others}
   * @returns {object} - The updated popularity object with home state bonus applied
   */ applyHomeStateBonus(stateId, stateName, popularity) {
    console.log(
      `Applying home state bonus check for ${stateName} (${stateId})`,
    );

    // Make a copy of the popularity object to avoid modifying the original
    const updatedPopularity = {
      player1: popularity.player1,
      player2: popularity.player2,
      others: popularity.others,
    };

    // Apply home state bonus for Player 1
    if (this.isHomeState(1, stateName)) {
      console.log(
        `%cApplying Player 1 home state bonus for ${stateName}`,
        "color: orange; font-weight: bold",
      );

      // Apply a FIXED 20% bonus rather than calculating - ensure player gets at least 20% more
      // regardless of starting value
      const currentP1 = updatedPopularity.player1;
      const targetP1 = Math.min(100, currentP1 + 20); // Ensure we don't exceed 100%
      const bonusAmount = targetP1 - currentP1;

      console.log(
        `Current P1: ${currentP1}%, Target: ${targetP1}%, Bonus: ${bonusAmount}%`,
      );

      if (bonusAmount > 0) {
        // Take from others first
        if (updatedPopularity.others >= bonusAmount) {
          updatedPopularity.others -= bonusAmount;
          updatedPopularity.player1 += bonusAmount;
        } else {
          // Take all from others first
          const fromOthers = updatedPopularity.others;
          updatedPopularity.player1 += fromOthers;
          updatedPopularity.others = 0;

          // Then take remaining from player 2
          const remainingNeeded = bonusAmount - fromOthers;
          const fromP2 = Math.min(remainingNeeded, updatedPopularity.player2);
          updatedPopularity.player2 -= fromP2;
          updatedPopularity.player1 += fromP2;
        }
      }

      console.log(
        `Applied home state bonus for Player 1 in ${stateName}. New popularity: ${updatedPopularity.player1}%`,
      );
    }
    // Apply home state bonus for Player 2
    if (this.isHomeState(2, stateName)) {
      console.log(
        `%cApplying Player 2 home state bonus for ${stateName}`,
        "color: green; font-weight: bold",
      );

      // Apply a FIXED 20% bonus rather than calculating - ensure player gets at least 20% more
      // regardless of starting value
      const currentP2 = updatedPopularity.player2;
      const targetP2 = Math.min(100, currentP2 + 20); // Ensure we don't exceed 100%
      const bonusAmount = targetP2 - currentP2;

      console.log(
        `Current P2: ${currentP2}%, Target: ${targetP2}%, Bonus: ${bonusAmount}%`,
      );

      if (bonusAmount > 0) {
        // Take from others first
        if (updatedPopularity.others >= bonusAmount) {
          updatedPopularity.others -= bonusAmount;
          updatedPopularity.player2 += bonusAmount;
        } else {
          // Take all from others first
          const fromOthers = updatedPopularity.others;
          updatedPopularity.player2 += fromOthers;
          updatedPopularity.others = 0;

          // Then take remaining from player 1
          const remainingNeeded = bonusAmount - fromOthers;
          const fromP1 = Math.min(remainingNeeded, updatedPopularity.player1);
          updatedPopularity.player1 -= fromP1;
          updatedPopularity.player2 += fromP1;
        }
      }

      console.log(
        `Applied home state bonus for Player 2 in ${stateName}. New popularity: ${updatedPopularity.player2}%`,
      );
    }

    // Ensure all values are properly rounded
    updatedPopularity.player1 = Math.round(updatedPopularity.player1);
    updatedPopularity.player2 = Math.round(updatedPopularity.player2);
    updatedPopularity.others = Math.round(updatedPopularity.others);

    // Ensure the total is exactly 100%
    const total =
      updatedPopularity.player1 +
      updatedPopularity.player2 +
      updatedPopularity.others;
    if (total !== 100) {
      const adjustment = 100 - total;
      updatedPopularity.others += adjustment;
    }

    return updatedPopularity;
  }

  /**
   * Debug method to check all states against home states
   * @param {Array} statesData - The array of states data
   */
  debugCheckAllStates(statesData) {
    if (!this.initialized) {
      console.warn("Home state bonus module not initialized");
      return;
    }

    console.log("Checking all states against home states:");
    console.log(`Player 1 home state: ${this.player1HomeState}`);
    console.log(`Player 2 home state: ${this.player2HomeState}`);

    // Check each state against both players' home states
    statesData.forEach((state) => {
      const isP1HomeState = this.isHomeState(1, state.State);
      const isP2HomeState = this.isHomeState(2, state.State);

      if (isP1HomeState || isP2HomeState) {
        console.log(`Found match: ${state.State} (${state.SvgId})`);
        console.log(`  - Player 1 home state: ${isP1HomeState}`);
        console.log(`  - Player 2 home state: ${isP2HomeState}`);
        console.log(`  - Lok Sabha Seats: ${state.LokSabhaSeats}`);

        // Calculate campaign costs
        const baseCost = parseInt(state.LokSabhaSeats);
        const p1Cost = this.getCampaignCost(1, state.State, baseCost);
        const p2Cost = this.getCampaignCost(2, state.State, baseCost);

        console.log(
          `  - Base cost: ${baseCost}M, P1 cost: ${p1Cost}M, P2 cost: ${p2Cost}M`,
        );
      }
    });
  }
}

// Create and export a singleton instance
export const homeStateBonus = new HomeStateBonus();

// Add global test function for debugging
window.testBonusSystem = async function() {
  console.log("🔧 Testing Home State and Campaign Bonus System...");

  try {
    // Test home state bonus initialization
    await homeStateBonus.initialize();

    console.log("✅ Home State Bonus initialized");
    console.log(`Player 1 home state: ${homeStateBonus.getPlayerHomeState(1)}`);
    console.log(`Player 2 home state: ${homeStateBonus.getPlayerHomeState(2)}`);

    // Test campaign bonus initialization
    if (window.initializeCampaignProgressFromPoliticianBonuses) {
      window.initializeCampaignProgressFromPoliticianBonuses();
      console.log("✅ Campaign bonuses initialized");
    } else {
      console.log("❌ Campaign bonus initialization function not found");
    }

    // Test policy mapping
    const gameConfig = JSON.parse(localStorage.getItem("gameConfig") || "{}");
    if (gameConfig.player1Politician && gameConfig.player2Politician) {
      console.log(`Game config loaded: P1=${gameConfig.player1Politician}, P2=${gameConfig.player2Politician}`);
    } else {
      console.log("❌ Game config not properly set");
    }

    console.log("🎉 Bonus system test complete! Check console for details.");

  } catch (error) {
    console.error("❌ Error testing bonus system:", error);
  }
};

console.log("💡 Use window.testBonusSystem() to test the bonus system after selecting politicians");
