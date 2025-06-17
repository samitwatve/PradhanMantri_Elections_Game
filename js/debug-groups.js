// Debug utilities for state groups functionality

// Import stateGroups to use its methods and access its data
import { stateGroups } from "./state-groups.js";

class DebugGroups {
  constructor() {
    this.verbose = false; // Flag to toggle verbose logging
  }

  // Toggle verbose logging mode
  toggleVerboseLogging(enable) {
    this.verbose = enable;
    console.log(
      `Verbose group logging ${this.verbose ? "enabled" : "disabled"}`,
    );
  }

  // Debug method to log all groups and their members
  async debugGroupMembership() {
    console.log("===== DEBUG: GROUP MEMBERSHIP =====");
    console.log(`Total groups: ${stateGroups.groups.size}`);

    stateGroups.groups.forEach((states, groupName) => {
      console.log(`Group "${groupName}": ${states.length} states`);
      if (this.verbose) {
        console.log(states);
      }
    });

    console.log("===== END DEBUG =====");
  }

  // Debug method to analyze what's missing for group domination
  async analyzeGroupDomination() {
    const { stateInfo } = await import("./state-info.js");

    console.log("===== GROUP DOMINATION ANALYSIS =====");

    // For each group
    for (const [groupName, states] of stateGroups.groups.entries()) {
      if (states.length === 0) continue;

      console.log(
        `\n----- Group "${groupName}" (${states.length} states) -----`,
      );

      // Count states with adequate popularity
      let p1States = 0;
      let p2States = 0;

      // Track states that don't meet the threshold for each player
      const p1MissingStates = [];
      const p2MissingStates = [];

      for (const stateId of states) {
        const popularity = stateInfo.getStatePopularity(stateId);
        if (!popularity) continue;

        const p1 = Math.round(popularity.player1);
        const p2 = Math.round(popularity.player2);

        // Check each player's popularity
        if (p1 >= 50) {
          p1States++;
        } else {
          const stateData = stateInfo.statesData.find(
            (s) => s.SvgId === stateId,
          );
          const stateName = stateData ? stateData.State : stateId;
          p1MissingStates.push({
            id: stateId,
            name: stateName,
            popularity: p1,
          });
        }

        if (p2 >= 50) {
          p2States++;
        } else {
          const stateData = stateInfo.statesData.find(
            (s) => s.SvgId === stateId,
          );
          const stateName = stateData ? stateData.State : stateId;
          p2MissingStates.push({
            id: stateId,
            name: stateName,
            popularity: p2,
          });
        }
      }

      // Report results
      console.log(
        `Player 1: ${p1States}/${states.length} states with >=50% popularity`,
      );
      console.log(
        `Player 2: ${p2States}/${states.length} states with >=50% popularity`,
      );

      if (p1States === states.length) {
        console.log("Group is DOMINATED by Player 1");
      } else if (p1MissingStates.length > 0 && this.verbose) {
        console.log("Player 1 missing domination in these states:");
        p1MissingStates.forEach((state) => {
          console.log(`  - ${state.name} (${state.id}): ${state.popularity}%`);
        });
      }

      if (p2States === states.length) {
        console.log("Group is DOMINATED by Player 2");
      } else if (p2MissingStates.length > 0 && this.verbose) {
        console.log("Player 2 missing domination in these states:");
        p2MissingStates.forEach((state) => {
          console.log(`  - ${state.name} (${state.id}): ${state.popularity}%`);
        });
      }
    }

    console.log("===== END ANALYSIS =====");
  }

  // Debug method to force domination of a group by a player
  async forceGroupDomination(groupName, playerId) {
    if (!stateGroups.groups.has(groupName)) {
      console.log(`Group "${groupName}" not found`);
      return;
    }

    const states = stateGroups.getStatesInGroup(groupName);
    if (states.length === 0) {
      console.log(`Group "${groupName}" has no states`);
      return;
    }

    console.log(
      `Forcing Player ${playerId} to dominate group "${groupName}" (${states.length} states)`,
    );

    const { stateInfo } = await import("./state-info.js");

    // For each state in the group
    for (const stateId of states) {
      const currentPopularity = stateInfo.getStatePopularity(stateId);
      if (!currentPopularity) continue;

      // Create new popularity object
      const newPopularity = { ...currentPopularity };

      // Set the specified player to 60%, distribute rest between other player and others
      if (playerId === 1) {
        newPopularity.player1 = 60;
        newPopularity.player2 = 20;
        newPopularity.others = 20;
      } else {
        newPopularity.player2 = 60;
        newPopularity.player1 = 20;
        newPopularity.others = 20;
      }

      // Update the state
      stateInfo.updateStatePopularity(stateId, newPopularity);
      console.log(
        `Set ${stateId} popularity to P1=${newPopularity.player1}, P2=${newPopularity.player2}, Others=${newPopularity.others}`,
      );
    }

    // Check domination after a short delay
    setTimeout(() => stateGroups.checkAllGroupsDomination(), 500);
  }

  // Debug method to force domination of all groups by a player
  async forceAllGroupsDomination(playerId) {
    console.log(
      `===== FORCING ALL GROUPS DOMINATION FOR PLAYER ${playerId} =====`,
    );

    const groupNames = Array.from(stateGroups.groups.keys());
    for (const groupName of groupNames) {
      await this.forceGroupDomination(groupName, playerId);
    }

    console.log(`===== COMPLETED FORCING ALL GROUPS DOMINATION =====`);

    // Final check
    setTimeout(() => stateGroups.checkAllGroupsDomination(), 1000);
  }
}

// Create and export a single instance
export const debugGroups = new DebugGroups();
