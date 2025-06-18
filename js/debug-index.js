// Expose debug methods in the global scope for debugging from console

import { debugGroups } from "./debug-groups.js";

// Register debug methods in the global scope for easy console access
window.debugGroups = debugGroups;

// Add helper functions for common debug tasks
window.debugHelpers = {
  // Show group membership information
  showGroups: async () => {
    await debugGroups.debugGroupMembership();
  },

  // Analyze domination status of all groups
  analyzeDomination: async () => {
    await debugGroups.analyzeGroupDomination();
  },

  // Force a specific group to be dominated by a player
  forceDominate: async (groupName, playerId) => {
    if (!groupName || !playerId) {
      console.error('Usage: debugHelpers.forceDominate("South India", 1)');
      return;
    }
    await debugGroups.forceGroupDomination(groupName, playerId);
  },

  // Force all groups to be dominated by a player
  forceAllDominate: async (playerId) => {
    if (!playerId) {
      console.error("Usage: debugHelpers.forceAllDominate(1)");
      return;
    }
    await debugGroups.forceAllGroupsDomination(playerId);
  },
};

console.log(
  "Debug utilities loaded. Use window.debugGroups or window.debugHelpers to access debug methods.",
);
