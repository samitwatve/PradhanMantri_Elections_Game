// Object to store progress for each policy and player
const policyProgress = {
  social: Array(4).fill({ player1: 0, player2: 0, completed: false }),
  land: Array(4).fill({ player1: 0, player2: 0, completed: false }),
  economy: Array(4).fill({ player1: 0, player2: 0, completed: false }),
  justice: Array(4).fill({ player1: 0, player2: 0, completed: false }),
  culture: Array(4).fill({ player1: 0, player2: 0, completed: false }),
  governance: Array(4).fill({ player1: 0, player2: 0, completed: false }),
};

// Fix the initialization issue - Arrays are filled with references to the same object
Object.keys(policyProgress).forEach((category) => {
  policyProgress[category] = Array(4)
    .fill(0)
    .map(() => ({ player1: 0, player2: 0, completed: false }));
});

// Import player information
import { player1, player2 } from "./player-info.js";
import { isGamePaused } from "./game-options.js";

// Game configuration for dynamic party names
let gameConfig = null;

// Get game configuration for dynamic party names
function loadGameConfiguration() {
  try {
    const config = localStorage.getItem("gameConfig");
    if (config) {
      gameConfig = JSON.parse(config);
    } else {
      console.warn("No game configuration found, using defaults");
      gameConfig = {
        player1Politician: { party: "Player 1" },
        player2Politician: { party: "Player 2" },
      };
    }
  } catch (error) {
    console.error("Error loading game configuration:", error);
    gameConfig = {
      player1Politician: { party: "Player 1" },
      player2Politician: { party: "Player 2" },
    };
  }
}

// Get party name for a player
function getPlayerPartyName(playerId) {
  if (!gameConfig) {
    loadGameConfiguration();
  }
  return playerId === 1
    ? gameConfig.player1Politician?.party || "Player 1"
    : gameConfig.player2Politician?.party || "Player 2";
}

// Constants
const CAMPAIGN_CLICK_COST = 10; // 10M per click
const CAMPAIGN_MAX_COST = 100; // 100M total cost
const CAMPAIGN_COMPLETION_BONUS = 15; // 15M bonus for completing a campaign
const CAMPAIGN_MAX_CLICKS = 10; // 10 clicks to complete (100M total)

// Function to update progress bar
function updateProgressBar(category, index) {
  const progressBar = document.getElementById(`${category}-${index + 1}`);
  const policy = policyProgress[category][index];
  const player1Progress = policy.player1;
  const player2Progress = policy.player2;

  // Calculate total progress (combined from both players)
  const totalProgress = Math.min(100, player1Progress + player2Progress);

  if (progressBar) {
    // Update progress width
    progressBar.style.width = `${totalProgress}%`;

    // Determine which player has contributed more
    if (player1Progress > player2Progress) {
      progressBar.className = "progress-fill player1";
    } else if (player2Progress > player1Progress) {
      progressBar.className = "progress-fill player2";
    } else if (player1Progress > 0) {
      // Equal non-zero contributions
      progressBar.className = "progress-fill player1";
    }

    // Add complete class if fully funded
    if (totalProgress === 100) {
      progressBar.classList.add("complete");
    } else {
      progressBar.classList.remove("complete");
    }
  }
}

// Function to update all progress bars
function updateAllProgressBars() {
  Object.entries(policyProgress).forEach(([category, policies]) => {
    policies.forEach((policy, index) => {
      updateProgressBar(category, index);
    });
  });
  updateProgressItemUI();
}

// Function to increment progress for a specific policy
// Function to increment progress for a specific policy
function incrementPolicy(category, index, playerId) {
  console.log(
    `incrementPolicy called: ${category}-${index + 1}, player ${playerId}`,
  );

  // Check if game is paused - prevent policy contributions while paused
  if (isGamePaused()) {
    console.log("Game is paused - policy contribution ignored");
    return false;
  }

  const policy = policyProgress[category][index];
  if (!policy) {
    console.error(`Policy not found: ${category}-${index}`);
    return false;
  }

  const player = playerId === 1 ? player1 : player2;

  // Check if campaign is already completed
  if (policy.player1 + policy.player2 >= 100) {
    console.log(`Campaign ${category}-${index + 1} is already completed`);
    return false;
  }
  // Check if player has enough funds
  if (!player.canSpend(CAMPAIGN_CLICK_COST)) {
    // Play invalid action sound (only for Player 1)
    if (window.soundManager && playerId === 1) {
      window.soundManager.playInvalidAction();
    }

    player.showInsufficientFundsError();
    return false;
  }

  // Spend funds
  player.updateFunds(-CAMPAIGN_CLICK_COST);

  // Increment player's contribution
  if (playerId === 1) {
    policy.player1 = Math.min(100, policy.player1 + 10);
  } else {
    policy.player2 = Math.min(100, policy.player2 + 10);
  }

  // Update the progress bar
  updateProgressBar(category, index);
  updateProgressItemUI();

  // Check if campaign is now completed
  if (policy.player1 + policy.player2 >= 100 && !policy.completed) {
    policy.completed = true;
    // Award completion bonus to the player who contributed more
    const dominantPlayer = policy.player1 > policy.player2 ? 1 : 2;
    const dominantPlayerObj = dominantPlayer === 1 ? player1 : player2;

    // Award one-time bonus
    dominantPlayerObj.updateFunds(CAMPAIGN_COMPLETION_BONUS);

    // Play fanfare sound for Player 1 campaign completion
    if (dominantPlayer === 1 && window.soundManager) {
      window.soundManager.playFanfare();
    }

    // Show completion notification
    showCampaignCompletionNotification(category, index, dominantPlayer);

    // Log completion
    console.log(
      `Campaign ${category}-${index + 1} completed! Player ${dominantPlayer} awarded ${CAMPAIGN_COMPLETION_BONUS}M bonus.`,
    );

    // Record that this policy is now eligible for phase bonuses
    if (!window.completedPolicies) {
      window.completedPolicies = [];
    }
    window.completedPolicies.push({
      category,
      index,
      dominantPlayer,
    });
  }

  // Log action
  console.log(
    `Player ${playerId} contributed ${CAMPAIGN_CLICK_COST}M to ${category}-${index + 1}`,
  );
  return true;
}

// Function to show campaign completion notification
function showCampaignCompletionNotification(category, index, playerId) {
  const progressId = `${category}-${index + 1}`;
  const progressItem = document
    .getElementById(progressId)
    .closest(".progress-item");
  const policyLabel = progressItem.querySelector(
    ".progress-item-label",
  ).textContent;

  // Add news update to TV display with short 2-second duration
  const playerName = getPlayerPartyName(playerId);
  window.tvDisplay.addNewsUpdate(
    `🎉 ${playerName} completes ${policyLabel}! +${CAMPAIGN_COMPLETION_BONUS}M`,
    false,
    2000
  );
}

// Function to show phase bonus notification
function showPhaseBonusNotification(playerId, amount, completedCount) {
  // Add news update to TV display with short 1.5-second duration
  const playerName = getPlayerPartyName(playerId);
  const totalBonus = amount * completedCount;
  window.tvDisplay.addNewsUpdate(
    `💰 Phase Bonus: ${playerName} gains +${totalBonus}M for ${completedCount} campaigns`,
    false,
    1500
  );
}

// Function to award phase bonuses for completed policies
function awardPhaseCompletionBonuses() {
  if (!window.completedPolicies) return;

  // Group by player
  const player1Policies = window.completedPolicies.filter(
    (p) => p.dominantPlayer === 1,
  );
  const player2Policies = window.completedPolicies.filter(
    (p) => p.dominantPlayer === 2,
  );

  // Award bonuses for player 1
  if (player1Policies.length > 0) {
    const totalBonus = CAMPAIGN_COMPLETION_BONUS * player1Policies.length;
    player1.updateFunds(totalBonus);
    showPhaseBonusNotification(
      1,
      CAMPAIGN_COMPLETION_BONUS,
      player1Policies.length,
    );
    console.log(
      `Phase bonus: Player 1 awarded ${totalBonus}M for ${player1Policies.length} completed policies`,
    );
  }

  // Award bonuses for player 2
  if (player2Policies.length > 0) {
    const totalBonus = CAMPAIGN_COMPLETION_BONUS * player2Policies.length;
    player2.updateFunds(totalBonus);
    showPhaseBonusNotification(
      2,
      CAMPAIGN_COMPLETION_BONUS,
      player2Policies.length,
    );
    console.log(
      `Phase bonus: Player 2 awarded ${totalBonus}M for ${player2Policies.length} completed policies`,
    );
  }
}

// Add contribution indicators to progress items
function updateProgressItemUI() {
  Object.entries(policyProgress).forEach(([category, policies]) => {
    policies.forEach((policy, index) => {
      const progressId = `${category}-${index + 1}`;
      const progressItem = document
        .getElementById(progressId)
        .closest(".progress-item");

      // Remove any existing contribution info
      const existingInfo = progressItem.querySelector(".contribution-info");
      if (existingInfo) {
        progressItem.removeChild(existingInfo);
      }

      // Add or remove completed class
      if (policy.completed) {
        progressItem.classList.add("completed");
      } else {
        progressItem.classList.remove("completed");
      }
    });
  });
}

// Initialize progress bars when the page loads
document.addEventListener("DOMContentLoaded", () => {
  updateAllProgressBars();

  // Add click handlers to all progress items
  document.querySelectorAll(".progress-item").forEach((item, idx) => {
    // Get category and index
    const progressFill = item.querySelector(".progress-fill");
    if (progressFill && progressFill.id) {
      const categoryMatch = progressFill.id.match(/^([a-z]+)-(\d+)$/);
      if (categoryMatch) {
        const category = categoryMatch[1];
        const index = parseInt(categoryMatch[2]) - 1;

        console.log(`Setting up click handler for ${category}-${index + 1}`);

        // Add click handler
        item.addEventListener("click", (e) => {
          console.log(`Clicked on ${category}-${index + 1}`);
          // Determine which player clicked based on keyboard modifiers
          // Shift key = Player 2, otherwise Player 1
          const playerId = e.shiftKey ? 2 : 1;
          incrementPolicy(category, index, playerId);
        });
      } else {
        console.log(
          `No category match for progress fill ID: ${progressFill.id}`,
        );
      }
    } else {
      console.log(`No progress fill found for item at index ${idx}`);
    }
  });

  // Listen for phase changes to award bonuses
  window.addEventListener("gamePhaseChanged", awardPhaseCompletionBonuses);

  // Initialize campaign progress from politician bonuses after a short delay
  setTimeout(initializeCampaignProgressFromPoliticianBonuses, 500);
});

// Export functions for use in other modules
window.policyProgress = policyProgress;
window.incrementPolicy = incrementPolicy;
window.updateAllProgressBars = updateAllProgressBars;
window.initializeCampaignProgressFromPoliticianBonuses =
  initializeCampaignProgressFromPoliticianBonuses;

// Function to initialize campaign progress based on politician bonuses
function initializeCampaignProgressFromPoliticianBonuses() {
  console.log("Initializing campaign progress from politician bonuses");

  try {
    // Get game configuration with selected politicians
    const config = localStorage.getItem("gameConfig");
    if (!config) {
      console.warn(
        "No game configuration found, skipping bonus initialization",
      );
      return;
    }

    const gameConfig = JSON.parse(config);
    const player1PoliticianName = gameConfig.player1Politician;
    const player2PoliticianName = gameConfig.player2Politician;

    if (!player1PoliticianName || !player2PoliticianName) {
      console.warn("Missing politician names in game configuration");
      return;
    }

    // Load politicians data to get their policies
    fetch("./politicians-data.json")
      .then((response) => response.json())
      .then((politiciansData) => {
        // Find politician objects by name
        const player1Politician = politiciansData.politicians.find(
          politician => politician.name === player1PoliticianName
        );
        const player2Politician = politiciansData.politicians.find(
          politician => politician.name === player2PoliticianName
        );

        if (!player1Politician || !player2Politician) {
          console.warn("Could not find politician data for:", {
            player1: player1PoliticianName,
            player2: player2PoliticianName
          });
          return;
        }

        console.log("Player 1 politician:", player1Politician.name);
        console.log("Player 2 politician:", player2Politician.name);

        // Debug: Log all policies for both politicians
        console.log("Player 1 policies:", player1Politician.policies);
        console.log("Player 2 policies:", player2Politician.policies);

        // Continue with the rest of the initialization...
        initializePoliciesWithBonuses(player1Politician, player2Politician);
      })
      .catch((error) => {
        console.error("Error loading politicians data for policy initialization:", error);
      });
  } catch (error) {
    console.error(
      "Error initializing campaign progress from politician bonuses:",
      error,
    );
  }
}

// Separate function to handle the actual policy initialization
function initializePoliciesWithBonuses(player1Politician, player2Politician) {
  // Reset all progress to ensure we start fresh
  Object.keys(policyProgress).forEach((category) => {
    policyProgress[category].forEach((policy) => {
      policy.player1 = 0;
      policy.player2 = 0;
      policy.completed = false;
    });
  });
  // Define mapping from politician policy names to UI campaign categories and indices
  const policyToCampaignMap = {
    Education: { category: "social", index: 0 },
    "Rural Development": { category: "social", index: 1 },
    "Women's Empowerment": { category: "social", index: 2 },
    Healthcare: { category: "social", index: 3 },

    "Land Reforms": { category: "land", index: 0 },
    "Agricultural Reforms": { category: "land", index: 1 },
    "Water and Mineral Rights": { category: "land", index: 2 },
    Infrastructure: { category: "land", index: 3 },

    "Economic Liberalization": { category: "economy", index: 0 },
    Privatization: { category: "economy", index: 1 },
    "Public Sector": { category: "economy", index: 2 },
    "Digital Transformation": { category: "economy", index: 3 },

    "Anti-Corruption": { category: "justice", index: 0 },
    "Judicial Activism": { category: "justice", index: 1 },
    "Press Freedom": { category: "justice", index: 2 },
    "Law and Order": { category: "justice", index: 3 },

    "Hindi Language": { category: "culture", index: 0 },
    Hindutva: { category: "culture", index: 1 },
    Secularism: { category: "culture", index: 2 },
    "Indigenous Rights": { category: "culture", index: 3 },

    "Caste Reservation": { category: "governance", index: 0 },
    "Uniform Civil Code": { category: "governance", index: 1 },
    "State's Rights": { category: "governance", index: 2 },
    "National Defense": { category: "governance", index: 3 }
  };
  // Process player 1 politician bonuses
  if (player1Politician.policies) {
    player1Politician.policies.forEach((policy) => {
      const mapping = policyToCampaignMap[policy.name];
      if (mapping) {
        const { category, index } = mapping;
        // Set initial progress for player 1
        if (policyProgress[category] && policyProgress[category][index]) {
          policyProgress[category][index].player1 = policy.bonus;
          console.log(
            `Player 1: Set ${policy.name} (${category}-${index + 1}) to ${policy.bonus}%`,
          );
        }
      } else {
        console.warn(`Player 1: No mapping found for policy "${policy.name}"`);
      }
    });
  }

  // Process player 2 politician bonuses
  if (player2Politician.policies) {
    player2Politician.policies.forEach((policy) => {
      const mapping = policyToCampaignMap[policy.name];
      if (mapping) {
        const { category, index } = mapping;
        // Set initial progress for player 2
        if (policyProgress[category] && policyProgress[category][index]) {
          policyProgress[category][index].player2 = policy.bonus;
          console.log(
            `Player 2: Set ${policy.name} (${category}-${index + 1}) to ${policy.bonus}%`,
          );
        }
      } else {
        console.warn(`Player 2: No mapping found for policy "${policy.name}"`);
      }
    });
  }

  // Update all progress bars to reflect the initial bonuses
  updateAllProgressBars();

  // Check for any campaigns that are now complete due to initial bonuses
  Object.entries(policyProgress).forEach(([category, policies]) => {
    policies.forEach((policy, index) => {
      // Check if campaign is now completed
      if (policy.player1 + policy.player2 >= 100 && !policy.completed) {
        policy.completed = true;

        // Award completion bonus to the player who contributed more
        const dominantPlayer = policy.player1 > policy.player2 ? 1 : 2;
        const dominantPlayerObj = dominantPlayer === 1 ? player1 : player2;

        // Award one-time bonus
        dominantPlayerObj.updateFunds(CAMPAIGN_COMPLETION_BONUS);

        // Show completion notification
        showCampaignCompletionNotification(category, index, dominantPlayer);

        // Log completion
        console.log(
          `Campaign ${category}-${index + 1} completed from initial politician bonuses! Player ${dominantPlayer} awarded ${CAMPAIGN_COMPLETION_BONUS}M bonus.`,
        );

        // Record that this policy is now eligible for phase bonuses
        if (!window.completedPolicies) {
          window.completedPolicies = [];
        }
        window.completedPolicies.push({
          category,
          index,
          dominantPlayer,
        });
      }
    });
  });

  console.log("Campaign progress initialization complete");
}

// Initialize campaign progress from politician bonuses when game loads
document.addEventListener("DOMContentLoaded", () => {
  // Wait a short moment to ensure other initialization is complete
  setTimeout(initializeCampaignProgressFromPoliticianBonuses, 500);
});

// Export the initialization function
window.initializeCampaignProgressFromPoliticianBonuses =
  initializeCampaignProgressFromPoliticianBonuses;
