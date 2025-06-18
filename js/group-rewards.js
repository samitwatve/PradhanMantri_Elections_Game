// Group rewards functionality
import { stateGroups } from "./state-groups.js";

class GroupRewards {
  constructor() {
    // Initialize any class properties if needed
  }

  // Calculate the total number of Lok Sabha seats in a state group
  getTotalSeatsInGroup(groupName) {
    if (!stateGroups.groups.has(groupName)) {
      console.log(`Group "${groupName}" not found in groups map`);
      return 0;
    }

    const states = stateGroups.getStatesInGroup(groupName);
    if (states.length === 0) {
      console.log(`Group "${groupName}" has no states`);
      return 0;
    }

    let totalSeats = 0;

    // Sum up the seats from all states in the group
    for (const stateId of states) {
      const stateData = stateGroups.statesData.find(
        (state) => state.SvgId === stateId,
      );
      if (stateData) {
        totalSeats += parseInt(stateData.LokSabhaSeats, 10) || 0;
      }
    }

    return totalSeats;
  }

  // Award bonus to player for dominating a state group
  awardGroupDominationBonus(groupName, playerId) {
    const totalSeats = this.getTotalSeatsInGroup(groupName);
    if (totalSeats === 0) {
      console.log(`No bonus awarded for group "${groupName}" - 0 seats`);
      return;
    }

    // Calculate bonus as 50% of seats value (e.g., 130 seats = 65M bonus)
    const bonusAmount = Math.round(totalSeats * 0.5);

    console.log(
      `Awarding ${bonusAmount}M bonus to Player ${playerId} for dominating group "${groupName}" (${totalSeats} seats)`,
    );

    // Import player info to award the bonus
    import("./player-info.js").then(({ player1, player2 }) => {
      const player = playerId === 1 ? player1 : player2;
      player.updateFunds(bonusAmount);

      // Play fanfare sound for Player 1 group domination
      if (playerId === 1 && window.soundManager) {
        window.soundManager.playFanfare();
      }

      // Show a special notification for the group domination bonus
      player.showGroupDominationBonusNotification(groupName, bonusAmount);

      // Also show a message in the actions log
      import("./actions-log.js").then(({ actionsLog }) => {
        actionsLog.addAction(
          `Player ${playerId} received ${bonusAmount}M bonus for dominating ${groupName} (${totalSeats} seats)`,
        );
      });
    });
  }
}

// Create and export a single instance
export const groupRewards = new GroupRewards();
