// AI Player Controller
// This module handles the AI player's decision-making and actions

import { player2 } from "./player-info.js";
import { stateInfo } from "./state-info.js";
import { mapController } from "./map-controller.js";
import { gameOptions } from "./game-options.js";
import { rallyController } from "./rally-controller.js";
import { gameConfig } from "./game-config.js";
import { homeStateBonus } from "./home-state-bonus.js";
import { stateGroups } from "./state-groups.js";
import { visualEffects } from "./visual-effects.js";

class AIPlayerController {
  constructor() {
    this.aiPlayerId = 2;
    this.turnInterval = gameConfig.getAITurnInterval();
    this.aiActive = gameConfig.isAIEnabled();
    this.aiDifficulty = gameConfig.getAIDifficulty();
    this.targetStateGroups = []; // Target state groups for MEDIUM and HARD difficulty
    this.initialize();
  }

  initialize() {
    console.log("AI Player Controller initialized");

    // Initialize target state groups for MEDIUM and HARD difficulty
    this.initializeTargetStateGroups();

    // Start the AI turn loop after a short delay
    setTimeout(() => {
      this.startAITurnLoop();
    }, 2000); // Start after 2 seconds to let the game initialize

    // Listen for game timer updates
    window.addEventListener("timerUpdated", (event) => {
      // We're keeping the turn interval fixed based on difficulty
    });
    // Listen for AI difficulty changes
    window.addEventListener("aiDifficultyChanged", (event) => {
      this.aiDifficulty = event.detail.difficulty;
      this.turnInterval = gameConfig.getAITurnInterval();
      console.log(
        `AI difficulty changed to: ${this.aiDifficulty}, turn interval: ${this.turnInterval}ms`,
      );

      // Reinitialize target state groups if needed
      if (this.aiDifficulty === "MEDIUM" || this.aiDifficulty === "HARD") {
        this.initializeTargetStateGroups();
      }

      // Restart turn loop with new interval
      this.stopAITurnLoop();

      // Make sure AI is active (stopAITurnLoop sets it to false)
      this.aiActive = gameConfig.isAIEnabled();

      console.log(`AI active status after difficulty change: ${this.aiActive}`);

      // Start the turn loop again with the new interval
      this.startAITurnLoop();
    });
  }

  initializeTargetStateGroups() {
    // This will be called at game start to randomly choose 3-4 state groups to focus on
    if (this.aiDifficulty !== "MEDIUM" && this.aiDifficulty !== "HARD") {
      return; // Only needed for MEDIUM and HARD difficulties
    }

    // Get all available group names
    const allGroups = [
      "Coastal India",
      "Northeast India",
      "South India",
      "Hindi Heartland",
      "Agricultural Region",
      "Border Lands",
      "Pilgrimage",
      "Industrial Corridor",
      "Manufacturing",
      "Education",
      "Tribal Lands",
      "Travel and Tourism",
      "Natural Resources",
      "Minority Areas",
    ];

    // Reset target groups
    this.targetStateGroups = [];

    // Choose 3-4 groups randomly
    const numGroups = 3 + Math.floor(Math.random() * 2); // 3 or 4

    // Shuffle the array
    const shuffledGroups = [...allGroups].sort(() => 0.5 - Math.random());

    // Take the first 3-4 groups
    this.targetStateGroups = shuffledGroups.slice(0, numGroups);

    console.log(
      `AI (${this.aiDifficulty}) targeting state groups:`,
      this.targetStateGroups,
    );
  }
  startAITurnLoop() {
    console.log(
      `Starting AI turn loop with interval: ${this.turnInterval}ms, difficulty: ${this.aiDifficulty}, active: ${this.aiActive}`,
    );

    // Clear any existing timer to avoid duplicate timers
    if (this.turnTimer) {
      clearInterval(this.turnTimer);
      this.turnTimer = null;
      console.log("Cleared existing turn timer");
    }

    // Take first AI turn
    if (this.aiActive && gameOptions.gameplay) {
      console.log("Taking first AI turn immediately");
      this.takeAITurn();
    }

    // Set up recurring turns
    this.turnTimer = setInterval(() => {
      // Only take turn if AI is active AND game is not paused
      if (this.aiActive && gameOptions.gameplay) {
        console.log(
          `Taking AI turn (${this.aiDifficulty}) with interval: ${this.turnInterval}ms`,
        );
        this.takeAITurn();
      } else {
        console.log(
          `Skipping AI turn - active: ${this.aiActive}, gameplay: ${gameOptions.gameplay}`,
        );
      }
    }, this.turnInterval);

    console.log(`AI turn loop started with interval: ${this.turnInterval}ms`);
  }
  stopAITurnLoop() {
    console.log("Stopping AI turn loop");

    if (this.turnTimer) {
      clearInterval(this.turnTimer);
      this.turnTimer = null;
      console.log("AI turn timer cleared");
    } else {
      console.log("No AI turn timer to clear");
    }

    this.aiActive = false;
    console.log("AI set to inactive");
  }

  pauseAI() {
    this.aiActive = false;
    console.log("AI player paused");
  }

  resumeAI() {
    this.aiActive = true;
    console.log("AI player resumed");

    // Restart the turn timer if it was cleared
    if (!this.turnTimer) {
      this.startAITurnLoop();
    }
  }
  async takeAITurn() {
    // Skip turn if game is paused or AI is disabled in debug mode
    if (!gameOptions.gameplay || !gameConfig.isAIEnabled()) {
      console.log(
        "AI turn skipped - game is paused or AI disabled in debug mode",
      );
      return;
    }

    console.log(`AI player (${this.aiDifficulty}) taking turn`);

    try {
      // Load states data if needed
      if (!this.statesData) {
        try {
          console.log("Loading states data for AI...");
          const response = await fetch("states_data.json");
          if (!response.ok) {
            throw new Error(
              `Failed to fetch states data: ${response.status} ${response.statusText}`,
            );
          }
          this.statesData = await response.json();
          console.log("States data loaded successfully");
        } catch (error) {
          console.error("Error loading states data:", error);
          return; // Skip this turn if we can't load the data
        }
      }

      // Different behavior based on difficulty level
      console.log(`Processing AI turn for difficulty: ${this.aiDifficulty}`);
      switch (this.aiDifficulty) {
        case "MEDIUM":
          await this.takeMediumDifficultyTurn();
          break;
        case "HARD":
          await this.takeHardDifficultyTurn();
          break;
        case "EASY":
        default:
          await this.takeEasyDifficultyTurn();
          break;
      }
      console.log(`AI turn (${this.aiDifficulty}) completed successfully`);
    } catch (error) {
      console.error(`Error during AI turn (${this.aiDifficulty}):`, error);
    }
  }
  async takeEasyDifficultyTurn() {
    try {
      // Original AI behavior: 15% rally, 42.5% campaign state, 42.5% campaign policy
      const randomAction = Math.random();

      if (randomAction < 0.15) {
        // 15% chance to place a rally
        const rallyPlaced = await rallyController.placeAIRally();
        if (!rallyPlaced) {
          // If rally placement failed, fall back to state targeting
          this.targetRandomState();
        }
      } else if (randomAction < 0.575) {
        // 42.5% chance to target a state
        this.targetRandomState();
      } else {
        // 42.5% chance to contribute to a campaign
        this.contributeToRandomCampaign();
      }
    } catch (error) {
      console.error("Error during AI turn:", error);
    }
  }  async targetRandomState() {
    // Choose a random state for the AI to target
    const targetState = this.chooseTargetState();

    if (!targetState) {
      console.log("AI could not find a suitable target state");
      return;
    }

    console.log(`AI randomly targeting state: ${targetState.SvgId}`);

    // Calculate base cost (equal to number of seats)
    const baseCost = parseInt(targetState.LokSabhaSeats);

    // Apply home state discount if applicable
    const cost = homeStateBonus.getCampaignCost(
      this.aiPlayerId,
      targetState.State,
      baseCost,
    );

    // Check if AI has enough funds
    if (player2.canSpend(cost)) {
      // Update state popularity
      stateInfo.recordStateAction(targetState.SvgId, this.aiPlayerId, cost);

      // Deduct funds from AI player
      player2.updateFunds(-cost);

      // Find coordinates for the ripple effect (center of the state)
      const stateElement = mapController.svgDocument.getElementById(
        targetState.SvgId,
      );
      if (stateElement) {
        // Get the bounding box of the state
        const bbox = stateElement.getBBox();
        const centerX = bbox.x + bbox.width / 2;
        const centerY = bbox.y + bbox.height / 2;
        // Create a ripple effect at the center of the state
        visualEffects.createRippleEffect(centerX, centerY, this.aiPlayerId);

        // Show home state indicator if this is the AI's home state
        if (homeStateBonus.isHomeState(this.aiPlayerId, targetState.State)) {
          visualEffects.showHomeStateIndicator(stateElement);
        }
      }

      console.log(`AI player spent ${cost}M on ${targetState.State}`);
    } else {
      console.log("AI player does not have enough funds");
    }
  }

  contributeToRandomCampaign() {
    // Get all available campaign categories
    const categories = Object.keys(window.policyProgress);

    // List of all available, non-maxed campaigns
    const availableCampaigns = [];

    // Check each campaign in each category
    categories.forEach((category) => {
      window.policyProgress[category].forEach((policy, index) => {
        // Only consider campaigns that aren't maxed out
        if (policy.player1 + policy.player2 < 100) {
          availableCampaigns.push({ category, index });
        }
      });
    });

    // If no available campaigns, exit
    if (availableCampaigns.length === 0) {
      console.log("AI found no available campaigns to contribute to");
      return;
    }

    // Choose a random campaign
    const randomCampaign =
      availableCampaigns[Math.floor(Math.random() * availableCampaigns.length)];
    const { category, index } = randomCampaign;

    // Contribute to the campaign using the incrementPolicy function
    const success = window.incrementPolicy(category, index, this.aiPlayerId);

    if (success) {
      console.log(`AI player contributed to ${category}-${index + 1} campaign`);
    } else {
      console.log("AI player failed to contribute to campaign");
    }
  }
  chooseTargetState() {
    if (!this.statesData) return null;

    // Get states where AI can afford to campaign
    const affordableStates = this.statesData.filter((state) => {
      if (!state.SvgId) return false;

      // Apply home state discount if applicable
      const baseCost = parseInt(state.LokSabhaSeats);
      const cost = homeStateBonus.getCampaignCost(
        this.aiPlayerId,
        state.State,
        baseCost,
      );

      return player2.canSpend(cost);
    });

    if (affordableStates.length === 0) {
      return null;
    }

    // Check if the AI's home state is in the affordable states
    const aiHomeState = homeStateBonus.getPlayerHomeState(this.aiPlayerId);
    const homeStateTarget = affordableStates.find(
      (state) => state.State === aiHomeState,
    );

    // 40% chance to prioritize home state if available
    if (homeStateTarget && Math.random() < 0.4) {
      console.log(`AI prioritizing home state: ${homeStateTarget.State}`);
      return homeStateTarget;
    }

    // Simply choose a random state from all affordable states
    return affordableStates[
      Math.floor(Math.random() * affordableStates.length)
    ];
  }

  // Helper function to choose a state with weighting based on seat count
  weightedRandomChoice(states) {
    // Calculate total weight (seats)
    const totalWeight = states.reduce(
      (sum, state) => sum + parseInt(state.LokSabhaSeats),
      0,
    );

    // Choose a random value within the total weight
    let randomValue = Math.random() * totalWeight;

    // Find the state that corresponds to this random value
    for (const state of states) {
      randomValue -= parseInt(state.LokSabhaSeats);
      if (randomValue <= 0) {
        return state;
      }
    }

    // Fallback
    return states[0];
  }

  async takeMediumDifficultyTurn() {
    // MEDIUM difficulty: Prioritize completing campaigns where AI is leading
    // And focus on 3-4 specific state groups

    // First check if there are any campaigns where AI is leading and nearly complete
    const leadingCampaign = this.findLeadingCampaign();

    if (leadingCampaign && Math.random() < 0.6) {
      // 60% chance to prioritize leading campaign
      const { category, index } = leadingCampaign;
      const success = window.incrementPolicy(category, index, this.aiPlayerId);

      if (success) {
        console.log(
          `AI (MEDIUM) contributed to leading campaign: ${category}-${index + 1}`,
        );
        return;
      }
    }

    // Otherwise, decide between rally and state targeting
    const randomAction = Math.random();

    if (randomAction < 0.3) {
      // 30% chance to place a rally in target state groups
      const rallyPlaced = await this.placeStrategyRally();
      if (!rallyPlaced) {
        // If rally placement failed, fall back to state targeting
        this.targetStateInFocusGroup();
      }
    } else {
      // 70% chance to target a state in focus groups
      this.targetStateInFocusGroup();
    }
  }  async takeHardDifficultyTurn() {
    try {
      console.log("AI taking HARD difficulty turn...");

      // HARD difficulty: Same as MEDIUM but with more strategic campaign choices
      // and more effective state targeting with faster action rate      // High priority: Use rally tokens aggressively (25% chance at start)
      if (player2.canUseRallyToken() && Math.random() < 0.25) {
        console.log("AI prioritizing rally token usage - Current tokens:", player2.rallyTokens);
        const rallyPlaced = await this.placeStrategyRally();
        if (rallyPlaced) {
          console.log("AI successfully placed priority rally");
          return;
        } else {
          console.log("AI failed to place priority rally");
        }
      }

      // First check if there are any campaigns where AI is leading and nearly complete
      const leadingCampaign = this.findLeadingCampaign();
      console.log(
        "Leading campaign check:",
        leadingCampaign ? `Found in ${leadingCampaign.category}` : "None found",
      );if (leadingCampaign && Math.random() < 0.5) {
        // 50% chance to prioritize leading campaign (reduced from 70% to allow more rally usage)
        const { category, index } = leadingCampaign;
        console.log(
          `Attempting to contribute to leading campaign: ${category}-${index + 1}`,
        );
        const success = window.incrementPolicy(
          category,
          index,
          this.aiPlayerId,
        );

        if (success) {
          console.log(
            `AI (HARD) contributed to leading campaign: ${category}-${index + 1}`,
          );
          return;
        } else {
          console.log("Failed to contribute to leading campaign");
        }
      }

      // Strategic policy focus - look for policies close to completion (even if player is leading)
      // This simulates a "comeback" strategy
      const closeToCompletionCampaign = this.findCampaignCloseToCompletion();
      console.log(
        "Close to completion campaign check:",
        closeToCompletionCampaign
          ? `Found in ${closeToCompletionCampaign.category}`
          : "None found",
      );

      if (closeToCompletionCampaign && Math.random() < 0.25) {
        const { category, index } = closeToCompletionCampaign;
        console.log(
          `Attempting to contribute to campaign close to completion: ${category}-${index + 1}`,
        );
        const success = window.incrementPolicy(
          category,
          index,
          this.aiPlayerId,
        );

        if (success) {
          console.log(
            `AI (HARD) contributed to campaign close to completion: ${category}-${index + 1}`,
          );
          return;
        } else {
          console.log("Failed to contribute to campaign close to completion");
        }
      }      // Otherwise, decide between rally and state targeting
      const randomAction = Math.random();
      console.log(`Random action value: ${randomAction}`);      if (randomAction < 0.55) {
        // 55% chance to place a rally in target state groups (increased from 35%)
        console.log("Attempting to place strategic rally - AI tokens:", player2.rallyTokens);
        const rallyPlaced = await this.placeStrategyRally();
        if (!rallyPlaced) {
          // If rally placement failed, fall back to state targeting
          console.log(
            "Rally placement failed, falling back to state targeting",
          );
          this.targetStateInFocusGroup(true); // Pass true for more strategic targeting
        } else {
          console.log("AI successfully placed strategic rally");
        }
      } else {
        // 45% chance to target a state in focus groups
        console.log("Targeting state in focus group");
        this.targetStateInFocusGroup(true); // Pass true for more strategic targeting
      }
    } catch (error) {
      console.error("Error in HARD difficulty AI turn:", error);
    }
  }

  // Find a campaign where AI is leading and nearly complete
  findLeadingCampaign() {
    // Get all available campaign categories
    const categories = Object.keys(window.policyProgress);

    // Track best campaign to contribute to
    let bestCampaign = null;
    let bestScore = 0;

    // Check each campaign in each category
    categories.forEach((category) => {
      window.policyProgress[category].forEach((policy, index) => {
        // Only consider campaigns that aren't maxed out
        if (policy.player1 + policy.player2 < 100) {
          // Calculate AI's lead in this campaign
          const aiLead = policy.player2 - policy.player1;

          // Calculate how close it is to completion
          const aiProgress = policy.player2;
          const remainingToComplete = 100 - (policy.player1 + policy.player2);

          // Score this campaign (higher is better)
          // Prioritize campaigns where AI is leading and close to completion
          let score = 0;

          if (aiLead > 0) {
            // AI is leading
            score = aiLead * 2 + aiProgress * 3;

            // Bonus for campaigns that are close to completion
            if (remainingToComplete < 20) {
              score += 100;
            } else if (remainingToComplete < 40) {
              score += 50;
            }
          }

          // Update best campaign if this one has a higher score
          if (score > bestScore) {
            bestScore = score;
            bestCampaign = { category, index };
          }
        }
      });
    });

    return bestCampaign;
  }

  // Find a campaign that is close to completion (for HARD difficulty)
  findCampaignCloseToCompletion() {
    // Get all available campaign categories
    const categories = Object.keys(window.policyProgress);

    // Track best campaign to contribute to
    let bestCampaign = null;
    let bestScore = 0;

    // Check each campaign in each category
    categories.forEach((category) => {
      window.policyProgress[category].forEach((policy, index) => {
        // Only consider campaigns that aren't maxed out
        if (policy.player1 + policy.player2 < 100) {
          // Calculate how close it is to completion
          const totalProgress = policy.player1 + policy.player2;
          const remainingToComplete = 100 - totalProgress;

          // Calculate how competitive this policy is
          const competitiveness = Math.abs(policy.player1 - policy.player2);

          // Score this campaign (higher is better)
          // Prioritize campaigns close to completion
          let score = 0;

          // Higher score for policies close to completion
          if (remainingToComplete < 20) {
            score += 100;
          } else if (remainingToComplete < 40) {
            score += 50;
          } else {
            score += 10; // Still consider policies that need more work
          }

          // Higher score for more competitive policies
          if (competitiveness < 20) {
            score += 50; // Very competitive
          } else if (competitiveness < 40) {
            score += 25; // Somewhat competitive
          }

          // Bonus for policies where player has invested a lot
          if (policy.player1 > 40) {
            score += 30; // Counteract player's investment
          }

          // Update best campaign if this one has a higher score
          if (score > bestScore) {
            bestScore = score;
            bestCampaign = { category, index };
          }
        }
      });
    });

    return bestCampaign;
  }
  // Place a rally strategically for MEDIUM and HARD difficulties
  async placeStrategyRally() {
    console.log(
      `AI (${this.aiDifficulty}) attempting to place strategic rally`,
    );

    if (!player2.canUseRallyToken()) {
      console.log("AI has no rally tokens available");
      return false;
    }

    // Load states data if needed
    if (!this.statesData) {
      const response = await fetch("states_data.json");
      this.statesData = await response.json();
    }    // Find suitable states for rally that are in target groups
    const suitableStates = this.findSuitableStatesForStrategicRally();
    console.log(`Found ${suitableStates.length} suitable states for strategic rally`);

    if (suitableStates.length === 0) {
      console.log("No suitable states found for AI strategic rally, trying fallback");
      // Fallback to general AI rally placement
      return await rallyController.placeAIRally();
    }    // Choose state with weighted randomization (prefer higher scores but add variety)
    let targetState;
    
    if (suitableStates.length === 1) {
      targetState = suitableStates[0].stateId;
    } else {
      // Take top 3-5 states and choose randomly among them (weighted by score)
      const topStates = suitableStates.slice(0, Math.min(5, suitableStates.length));
      
      // Use weighted random selection based on scores
      const totalScore = topStates.reduce((sum, state) => sum + state.score, 0);
      let randomValue = Math.random() * totalScore;
      
      for (const state of topStates) {
        randomValue -= state.score;
        if (randomValue <= 0) {
          targetState = state.stateId;
          break;
        }
      }
      
      // Fallback to first state if something goes wrong
      if (!targetState) {
        targetState = topStates[0].stateId;
      }
    }    if (targetState) {
      console.log(`AI chose rally target: ${targetState} from ${suitableStates.length} options`);
      
      // Check if AI should use special token first (always prioritize special tokens)
      if (player2.specialTokenCount > 0) {
        console.log("AI using special rally token strategically");
        return await rallyController.handleRallyPlacement(null, this.aiPlayerId, 'special');
      }
      
      // Otherwise use regular rally token on chosen state
      return await rallyController.handleRallyPlacement(
        targetState,
        this.aiPlayerId,
        'normal'
      );
    }

    // If strategic placement fails, try general rally placement
    console.log("Strategic rally placement failed, trying fallback");
    return await rallyController.placeAIRally();
  }

  // Find suitable states for strategic rally (in target groups)
  findSuitableStatesForStrategicRally() {
    const suitableStates = [];

    for (const stateData of this.statesData || []) {
      const stateId = stateData.SvgId;

      // Skip if state already has maximum rallies
      if (!rallyController.canPlaceRallyInState(stateId)) {
        continue;
      }

      // For MEDIUM and HARD, check if the state is in one of our target groups
      if (this.aiDifficulty === "MEDIUM" || this.aiDifficulty === "HARD") {
        // Get groups for this state
        const stateGroups = this.getGroupsForState(stateData);

        // Skip if state is not in any of our target groups
        if (!this.isStateInTargetGroups(stateGroups)) {
          continue;
        }
      }

      // Get current popularity
      const popularity = stateInfo.getStatePopularity(stateId);
      const player2Popularity = popularity?.player2 || 0;
      const player1Popularity = popularity?.player1 || 0;

      // AI prefers competitive states where rallies would be effective
      const competitiveness = Math.abs(player2Popularity - player1Popularity);
      const seatValue = parseInt(stateData.LokSabhaSeats);

      // For HARD difficulty, add more strategic considerations
      let strategicValue = 0;
      if (this.aiDifficulty === "HARD") {
        // Prefer states where AI is close to winning (45-49%)
        if (player2Popularity >= 45 && player2Popularity < 50) {
          strategicValue += 50;
        }

        // Prefer states where player is leading but AI can catch up
        if (
          player1Popularity > player2Popularity &&
          player1Popularity - player2Popularity < 15
        ) {
          strategicValue += 30;
        }
      }

      suitableStates.push({
        stateId: stateId,
        competitiveness: competitiveness,
        seatValue: seatValue,
        player2Popularity: player2Popularity,
        score: seatValue * 2 + (50 - competitiveness) + strategicValue,
      });
    }

    return suitableStates.sort((a, b) => b.score - a.score);
  }
  // Target a state in one of the focus groups
  targetStateInFocusGroup(moreStrategic = false) {
    console.log(`AI (${this.aiDifficulty}) targeting state in focus group`);

    // Choose a target state from the focus groups
    const targetState = this.chooseTargetStateInFocusGroups(moreStrategic);

    if (!targetState) {
      console.log("AI could not find a suitable target state in focus groups");

      // Fall back to random state targeting
      this.targetRandomState();
      return;
    }

    console.log(`AI targeting state in focus group: ${targetState.SvgId}`);

    // Calculate base cost (equal to number of seats)
    const baseCost = parseInt(targetState.LokSabhaSeats);

    // Apply home state discount if applicable
    const cost = homeStateBonus.getCampaignCost(
      this.aiPlayerId,
      targetState.State,
      baseCost,
    );

    // Check if AI has enough funds
    if (player2.canSpend(cost)) {
      // Update state popularity
      stateInfo.recordStateAction(targetState.SvgId, this.aiPlayerId, cost);

      // Deduct funds from AI player
      player2.updateFunds(-cost);

      // Find coordinates for the ripple effect (center of the state)
      const stateElement = mapController.svgDocument.getElementById(
        targetState.SvgId,
      );
      if (stateElement) {
        // Get the bounding box of the state
        const bbox = stateElement.getBBox();
        const centerX = bbox.x + bbox.width / 2;
        const centerY = bbox.y + bbox.height / 2;
        // Create a ripple effect at the center of the state
        visualEffects.createRippleEffect(centerX, centerY, this.aiPlayerId);

        // Show home state indicator if this is the AI's home state
        if (homeStateBonus.isHomeState(this.aiPlayerId, targetState.State)) {
          visualEffects.showHomeStateIndicator(stateElement);
        }
      }

      console.log(`AI player spent ${cost}M on ${targetState.State}`);
    } else {
      console.log("AI player does not have enough funds");
    }
  }

  // Choose a target state from the focus groups
  chooseTargetStateInFocusGroups(moreStrategic = false) {
    if (!this.statesData) return null;

    // Get states where AI can afford to campaign
    const affordableStates = this.statesData.filter((state) => {
      if (!state.SvgId) return false;

      // Apply home state discount if applicable
      const baseCost = parseInt(state.LokSabhaSeats);
      const cost = homeStateBonus.getCampaignCost(
        this.aiPlayerId,
        state.State,
        baseCost,
      );

      return player2.canSpend(cost);
    });

    if (affordableStates.length === 0) {
      return null;
    }

    // Filter to states in target groups
    const targetGroupStates = affordableStates.filter((state) => {
      const stateGroups = this.getGroupsForState(state);
      return this.isStateInTargetGroups(stateGroups);
    });

    // If no states in target groups, check if home state is affordable
    if (targetGroupStates.length === 0) {
      // Check if the AI's home state is in the affordable states
      const aiHomeState = homeStateBonus.getPlayerHomeState(this.aiPlayerId);
      const homeStateTarget = affordableStates.find(
        (state) => state.State === aiHomeState,
      );

      if (homeStateTarget) {
        console.log(`AI prioritizing home state: ${homeStateTarget.State}`);
        return homeStateTarget;
      }

      // Fall back to random affordable state
      return affordableStates[
        Math.floor(Math.random() * affordableStates.length)
      ];
    }

    // For hard difficulty, add more strategic considerations
    if (moreStrategic) {
      // Score each state based on strategic value
      const scoredStates = targetGroupStates.map((state) => {
        const popularity = stateInfo.getStatePopularity(state.SvgId);
        const player2Pop = popularity?.player2 || 0;
        const player1Pop = popularity?.player1 || 0;
        const seatValue = parseInt(state.LokSabhaSeats);

        let score = seatValue * 2; // Base score is seats

        // Prioritize states where AI is close to winning
        if (player2Pop >= 45 && player2Pop < 50) {
          score += 50;
        }

        // Prioritize competitive states
        const competitiveness = Math.abs(player2Pop - player1Pop);
        if (competitiveness < 10) {
          score += 30;
        }

        // Prioritize states where player is leading but catchable
        if (player1Pop > player2Pop && player1Pop - player2Pop < 15) {
          score += 20;
        }

        return {
          state: state,
          score: score,
        };
      });      // Sort by score and pick from top states with some randomization
      scoredStates.sort((a, b) => b.score - a.score);
      
      // Choose from top 3 states to add variety
      const topStates = scoredStates.slice(0, Math.min(3, scoredStates.length));
      const randomIndex = Math.floor(Math.random() * topStates.length);
      return topStates[randomIndex].state;
    }    // For medium difficulty, choose from multiple random states in target groups for variety
    if (targetGroupStates.length <= 3) {
      // If few options, just pick randomly
      return targetGroupStates[
        Math.floor(Math.random() * targetGroupStates.length)
      ];
    } else {
      // If many options, use weighted selection based on seat count for some strategy
      return this.weightedRandomChoice(targetGroupStates);
    }
  }

  // Helper method to get all groups for a state
  getGroupsForState(stateData) {
    const groups = [];

    if (stateData.CoastalIndia === "TRUE") groups.push("Coastal India");
    if (stateData.NortheastIndia === "TRUE") groups.push("Northeast India");
    if (stateData.SouthIndia === "TRUE") groups.push("South India");
    if (stateData.HindiHeartland === "TRUE") groups.push("Hindi Heartland");
    if (stateData.AgriculturalRegion === "TRUE")
      groups.push("Agricultural Region");
    if (stateData.BorderLands === "TRUE") groups.push("Border Lands");
    if (stateData.Pilgrimage === "TRUE") groups.push("Pilgrimage");
    if (stateData.IndustrialCorridor === "TRUE")
      groups.push("Industrial Corridor");
    if (stateData.Manufacturing === "TRUE") groups.push("Manufacturing");
    if (stateData.Education === "TRUE") groups.push("Education");
    if (stateData.TribalLands === "TRUE") groups.push("Tribal Lands");
    if (stateData.TravelAndTourism === "TRUE")
      groups.push("Travel and Tourism");
    if (stateData.NaturalResources === "TRUE") groups.push("Natural Resources");
    if (stateData.MinorityAreas === "TRUE") groups.push("Minority Areas");

    return groups;
  }

  // Check if a state is in any of our target groups
  isStateInTargetGroups(stateGroups) {
    for (const group of stateGroups) {
      if (this.targetStateGroups.includes(group)) {
        return true;
      }
    }
    return false;
  }
}

// Create and export a single instance
export const aiPlayerController = new AIPlayerController();
