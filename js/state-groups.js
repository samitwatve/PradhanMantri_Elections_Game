// State grouping functionality
class StateGroups {
  constructor() {
    this.groups = new Map();
    this.statesData = null;
    this.groupDominationStatus = new Map(); // Track which groups are dominated by a player
    this.previousDominationStatus = new Map(); // Track previous domination status to identify changes
    this.dominationCheckTimeout = null; // For debouncing
    this.checkingDomination = false; // Prevent concurrent checks
    this.uiController = null; // Reference to the UI controller
    this.initialize();
  }

  async initialize() {
    try {
      // Load states data
      const response = await fetch("states_data.json");
      this.statesData = await response.json();

      // Initialize groups from states data
      this.initializeGroups();

      // Add data-group attributes to the buttons
      const buttons = document.querySelectorAll(".button-grid button");
      buttons.forEach((button) => {
        const groupName = button.textContent.trim();
        if (this.groups.has(groupName)) {
          button.setAttribute("data-group", groupName);
        }
      });

      // Import and initialize UI controller
      const { groupUIController } = await import("./group-ui-controller.js");
      this.uiController = groupUIController;
      this.uiController.initialize(this);

      // Listen for popularity changes to check group domination (with debouncing)
      window.addEventListener("popularityChanged", () => {
        this.scheduleGroupDominationCheck();
      });
    } catch (error) {
      console.error("Failed to load states data:", error);
    }
  }

  // Schedule a check with debouncing to prevent too many checks
  scheduleGroupDominationCheck() {
    // Clear any existing timeout
    if (this.dominationCheckTimeout) {
      clearTimeout(this.dominationCheckTimeout);
    }

    // Set a new timeout
    this.dominationCheckTimeout = setTimeout(async () => {
      // Prevent concurrent checks
      if (this.checkingDomination) {
        // Try again in a moment
        setTimeout(() => this.scheduleGroupDominationCheck(), 500);
        return;
      }

      try {
        this.checkingDomination = true;
        await this.checkAllGroupsDomination();

        // Also refresh any manually selected groups to update shimmer effects
        if (this.uiController) {
          await this.uiController.refreshManuallySelectedGroups();
          await this.uiController.refreshManuallySelectedUTs();
        }
      } catch (error) {
        console.error("Error during scheduled group domination check:", error);
      } finally {
        this.checkingDomination = false;
      }
    }, 500); // Wait for 500ms after the last change before checking
  }

  initializeGroups() {
    // Clear existing groups
    this.groups.clear();

    // Define the group names based on the JSON properties
    const groupNames = [
      "Union Territory",
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

    // Initialize empty arrays for each group
    groupNames.forEach((groupName) => {
      this.groups.set(groupName, []);
    });

    // Populate groups based on states data
    this.statesData.forEach((state) => {
      if (state.UnionTerritory === "TRUE")
        this.groups.get("Union Territory").push(state.SvgId);
      if (state.CoastalIndia === "TRUE")
        this.groups.get("Coastal India").push(state.SvgId);
      if (state.NortheastIndia === "TRUE")
        this.groups.get("Northeast India").push(state.SvgId);
      if (state.SouthIndia === "TRUE")
        this.groups.get("South India").push(state.SvgId);
      if (state.HindiHeartland === "TRUE")
        this.groups.get("Hindi Heartland").push(state.SvgId);
      if (state.AgriculturalRegion === "TRUE")
        this.groups.get("Agricultural Region").push(state.SvgId);
      if (state.BorderLands === "TRUE")
        this.groups.get("Border Lands").push(state.SvgId);
      if (state.Pilgrimage === "TRUE")
        this.groups.get("Pilgrimage").push(state.SvgId);
      if (state.IndustrialCorridor === "TRUE")
        this.groups.get("Industrial Corridor").push(state.SvgId);
      if (state.Manufacturing === "TRUE")
        this.groups.get("Manufacturing").push(state.SvgId);
      if (state.Education === "TRUE")
        this.groups.get("Education").push(state.SvgId);
      if (state.TribalLands === "TRUE")
        this.groups.get("Tribal Lands").push(state.SvgId);
      if (state.TravelAndTourism === "TRUE")
        this.groups.get("Travel and Tourism").push(state.SvgId);
      if (state.NaturalResources === "TRUE")
        this.groups.get("Natural Resources").push(state.SvgId);
      if (state.MinorityAreas === "TRUE")
        this.groups.get("Minority Areas").push(state.SvgId);
    });
  }

  getStatesInGroup(groupName) {
    return this.groups.get(groupName) || [];
  }

  // Find all groups that a state belongs to
  getGroupsForState(stateId) {
    const groups = [];

    this.groups.forEach((states, groupName) => {
      if (states.includes(stateId)) {
        groups.push(groupName);
      }
    });

    return groups;
  }

  // Simplified method to check if a group is dominated by a player
  async checkGroupDomination(groupName) {
    if (!this.groups.has(groupName)) {
      return null;
    }

    const states = this.getStatesInGroup(groupName);
    if (states.length === 0) {
      return null;
    }

    // Import stateInfo to get popularity data
    const { stateInfo } = await import("./state-info.js");

    // Count states with >50% for each player
    let p1DominatingStates = 0;
    let p2DominatingStates = 0;

    // Check each state in the group
    for (const stateId of states) {
      const popularity = stateInfo.getStatePopularity(stateId);
      if (!popularity) continue;

      // Round the values to ensure consistent comparisons
      const p1 = Math.round(popularity.player1);
      const p2 = Math.round(popularity.player2);

      // Check if player1 has >50% popularity
      if (p1 >= 50) {
        p1DominatingStates++;
      }

      // Check if player2 has >50% popularity
      if (p2 >= 50) {
        p2DominatingStates++;
      }
    }

    // Return the dominating player (1, 2) or null if none
    if (p1DominatingStates === states.length) {
      return 1;
    }
    if (p2DominatingStates === states.length) {
      return 2;
    }
    return null;
  }

  // Check domination for all groups
  async checkAllGroupsDomination() {
    // Get all group names
    const groupNames = Array.from(this.groups.keys());

    // Copy current domination status to previous status before updating
    this.previousDominationStatus = new Map(this.groupDominationStatus);

    for (const groupName of groupNames) {
      try {
        const dominatingPlayer = await this.checkGroupDomination(groupName);
        const previousStatus = this.groupDominationStatus.get(groupName);

        // If domination status changed
        if (dominatingPlayer !== previousStatus) {
          this.groupDominationStatus.set(groupName, dominatingPlayer);

          // Apply highlight
          if (this.uiController) {
            this.uiController.highlightGroupDomination(
              groupName,
              dominatingPlayer,
            );
          }

          // If a player gained domination, award initial bonus
          if (dominatingPlayer !== null) {
            this.awardGroupDominationBonus(groupName, dominatingPlayer);
          }
        } else {
          // If still dominated by a player, award carry-forward bonus
          if (dominatingPlayer !== null) {
            const { gameTimer } = await import("./game-timer.js");
            // Only award carry-forward bonuses at the start of a new round (phase 1)
            if (gameTimer.currentPhase === 1) {
              this.awardGroupDominationBonus(groupName, dominatingPlayer);
            }
          }
        }
      } catch (error) {
        console.error(
          `Error checking domination for group ${groupName}:`,
          error,
        );
      }
    }
  }

  // Force refresh the highlighting for a specific group
  async refreshGroupHighlighting(groupName) {
    // Check if this group is currently manually selected
    const button =
      document.querySelector(
        `.button-grid button[data-group="${groupName}"]`,
      ) ||
      Array.from(document.querySelectorAll(".button-grid button")).find(
        (btn) => btn.textContent.trim() === groupName,
      );

    if (button && button.classList.contains("active")) {
      console.log(
        `🔄 Refreshing highlighting for manually selected group: ${groupName}`,
      );
      // Re-apply smart highlighting
      await this.highlightGroupWithStatus(groupName);
    }
  }

  // Show detailed analysis of a group to help players identify missing states
  async showGroupAnalysis(groupName) {
    if (!this.groups.has(groupName)) {
      return;
    }

    const states = this.getStatesInGroup(groupName);
    if (states.length === 0) {
      return;
    }

    const { stateInfo } = await import("./state-info.js");
    const { getCurrentPlayerNumber } = await import("./player-info.js");
    const { debugGroups } = await import("./debug-groups.js");

    const currentPlayer = getCurrentPlayerNumber();

    // Analyze each state in the group
    const leadingStates = [];
    const missingStates = [];

    for (const stateId of states) {
      const popularity = stateInfo.getStatePopularity(stateId);
      if (!popularity) continue;

      const currentPlayerPop =
        currentPlayer === 1 ? popularity.player1 : popularity.player2;
      const stateData = stateInfo.statesData.find((s) => s.SvgId === stateId);
      const stateName = stateData ? stateData.State : stateId;

      if (Math.round(currentPlayerPop) >= 50) {
        leadingStates.push({
          id: stateId,
          name: stateName,
          popularity: Math.round(currentPlayerPop),
        });
      } else {
        missingStates.push({
          id: stateId,
          name: stateName,
          popularity: Math.round(currentPlayerPop),
          needed: 50 - Math.round(currentPlayerPop),
        });
      }
    }

    // Show analysis in console for now (could be enhanced with UI popup later)
    if (debugGroups.verbose) {
      console.log(`\n🎯 GROUP ANALYSIS: ${groupName}`);
      console.log(`📊 Total states: ${states.length}`);
      console.log(`✅ Leading in: ${leadingStates.length} states`);
      console.log(`❌ Missing: ${missingStates.length} states`);

      if (leadingStates.length > 0) {
        console.log(`\n✅ STATES YOU LEAD (≥50%):`);
        leadingStates.forEach((state) => {
          console.log(`  • ${state.name}: ${state.popularity}%`);
        });
      }

      if (missingStates.length > 0) {
        console.log(`\n❌ STATES YOU NEED TO WORK ON (<50%):`);
        missingStates.forEach((state) => {
          console.log(
            `  • ${state.name}: ${state.popularity}% (need +${state.needed}%)`,
          );
        });
      }

      if (missingStates.length === 0) {
        console.log(`\n🎉 GROUP DOMINATED! You lead in all states.`);
      } else {
        console.log(
          `\n🎯 Focus on the ${missingStates.length} missing states to dominate this group.`,
        );
        console.log(`✨ Missing states will have a shimmer effect on the map.`);
      }
    }

    // Import actions log to show the analysis
    const { actionsLog } = await import("./actions-log.js");
    if (missingStates.length === 0) {
      actionsLog.addAction(
        `${groupName}: DOMINATED! Leading in all ${leadingStates.length} states`,
      );
    } else {
      const missingNames = missingStates.map((s) => s.name).join(", ");
      actionsLog.addAction(
        `${groupName}: Leading in ${leadingStates.length}/${states.length} states. Shimmering: ${missingNames}`,
      );
    }
  }

  // Highlight group with different colors for leading vs missing states
  async highlightGroupWithStatus(groupName) {
    if (!this.groups.has(groupName)) {
      return;
    }

    const states = this.getStatesInGroup(groupName);
    if (states.length === 0) {
      return;
    }

    const { stateInfo } = await import("./state-info.js");
    const { getCurrentPlayerNumber } = await import("./player-info.js");

    const currentPlayer = getCurrentPlayerNumber();

    // Categorize states based on current player's popularity
    for (const stateId of states) {
      const popularity = stateInfo.getStatePopularity(stateId);
      if (!popularity) continue;

      const currentPlayerPop =
        currentPlayer === 1 ? popularity.player1 : popularity.player2;

      if (Math.round(currentPlayerPop) >= 50) {
        // State where current player is leading (≥50%) - white border + green glow, NO shimmer
        window.dispatchEvent(
          new CustomEvent("toggleStateHighlight", {
            detail: {
              stateId,
              forceState: true,
              highlightType: "leading", // White border + green glow, removes shimmer
            },
          }),
        );

        // Also update UT button if this is a UT
        if (this.uiController) {
          this.uiController.updateUTButtonHighlight(stateId, "leading");
        }
      } else {
        // State where current player needs to work (<50%) - white border + orange glow + shimmer
        window.dispatchEvent(
          new CustomEvent("toggleStateHighlight", {
            detail: {
              stateId,
              forceState: true,
              highlightType: "missing", // White border + orange glow + shimmer
            },
          }),
        );

        // Also update UT button if this is a UT
        if (this.uiController) {
          this.uiController.updateUTButtonHighlight(stateId, "missing");
        }
      }
    }
  }

  // Refresh highlighting for a specific UT button
  async refreshUTHighlighting(utId) {
    const { stateInfo } = await import("./state-info.js");
    const { getCurrentPlayerNumber } = await import("./player-info.js");

    const currentPlayer = getCurrentPlayerNumber();
    const popularity = stateInfo.getStatePopularity(utId);

    if (!popularity) {
      console.log(`No popularity data found for UT: ${utId}`);
      return;
    }

    const currentPlayerPop =
      currentPlayer === 1 ? popularity.player1 : popularity.player2;
    const stateData = stateInfo.statesData.find((s) => s.SvgId === utId);
    const stateName = stateData ? stateData.State : utId;

    console.log(
      `🔄 Refreshing UT "${stateName}" with smart visual indicators:`,
    );

    if (Math.round(currentPlayerPop) >= 50) {
      // UT where current player is leading (≥50%) - white border + green glow, NO shimmer
      console.log(
        `✅ ${stateName}: ${Math.round(currentPlayerPop)}% (leading - white border + green glow)`,
      );
      window.dispatchEvent(
        new CustomEvent("toggleStateHighlight", {
          detail: {
            stateId: utId,
            forceState: true,
            highlightType: "leading", // White border + green glow, removes shimmer
          },
        }),
      );
    } else {
      // UT where current player needs to work (<50%) - white border + orange glow + shimmer
      console.log(
        `❌ ${stateName}: ${Math.round(currentPlayerPop)}% (missing - white border + orange glow + shimmer)`,
      );
      window.dispatchEvent(
        new CustomEvent("toggleStateHighlight", {
          detail: {
            stateId: utId,
            forceState: true,
            highlightType: "missing", // White border + orange glow + shimmer
          },
        }),
      );
    }
  }

  // Method moved to group-rewards.js
  getTotalSeatsInGroup(groupName) {
    // Import groupRewards to get the total seats
    return import("./group-rewards.js").then(({ groupRewards }) => {
      return groupRewards.getTotalSeatsInGroup(groupName);
    });
  }

  // Award bonus to player for dominating a state group
  // Delegating to group-rewards.js
  awardGroupDominationBonus(groupName, playerId) {
    import("./group-rewards.js").then(({ groupRewards }) => {
      groupRewards.awardGroupDominationBonus(groupName, playerId);
    });
  }
}

// Create and export a single instance
export const stateGroups = new StateGroups();
