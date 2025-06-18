// Group UI Controller - Handles UI-related functionality for state groups
class GroupUIController {
  constructor() {
    this.stateGroups = null; // Will be set during initialization
  }

  initialize(stateGroups) {
    this.stateGroups = stateGroups;

    // Initialize event listeners for group buttons
    const buttons = document.querySelectorAll(".button-grid button");
    buttons.forEach((button) => {
      button.addEventListener("click", (e) => this.handleGroupClick(e));
    });

    // Initialize small UTs panel with both click and hover handlers
    const utButtons = document.querySelectorAll(".small-uts-grid button");
    utButtons.forEach((button) => {
      button.addEventListener("click", (e) => this.handleUTClick(e));
      button.addEventListener("mouseover", (e) => this.handleUTHover(e));
      button.addEventListener("mouseout", (e) => this.handleUTUnhover(e));
    });
  }

  async handleGroupClick(event) {
    const button = event.target;
    const groupName = button.textContent.trim();
    const isActive = button.classList.toggle("active");

    // Get states for this group
    const states = this.stateGroups.getStatesInGroup(groupName);

    // Clear other highlights if clicking a new button
    if (isActive) {
      this.clearOtherGroupHighlights(button);

      // Show detailed group analysis to help identify missing states
      await this.stateGroups.showGroupAnalysis(groupName);
    }

    // Toggle highlight for states in this group with smart highlighting
    if (isActive) {
      await this.stateGroups.highlightGroupWithStatus(groupName);
    } else {
      // Clear all highlights when deselecting
      this.clearGroupHighlights(states);

      // Also clear UT button highlights for this group
      if (groupName === "Union Territory") {
        this.clearAllUTButtonHighlights();
      }

      // After clearing manual highlights, refresh automatic domination highlighting
      setTimeout(() => {
        this.stateGroups.checkAllGroupsDomination();
      }, 100);
    }
  }

  clearOtherGroupHighlights(activeButton) {
    // Clear all other highlights
    const allButtons = document.querySelectorAll(".button-grid button");
    allButtons.forEach((otherButton) => {
      if (
        otherButton !== activeButton &&
        otherButton.classList.contains("active")
      ) {
        otherButton.classList.remove("active");
        const otherGroupName = otherButton.textContent.trim();
        const otherStates = this.stateGroups.getStatesInGroup(otherGroupName);
        this.clearGroupHighlights(otherStates);

        // Clear UT highlights if deselecting Union Territory group
        if (otherGroupName === "Union Territory") {
          this.clearAllUTButtonHighlights();
        }
      }
    });
  }

  clearGroupHighlights(states) {
    states.forEach((stateId) => {
      window.dispatchEvent(
        new CustomEvent("toggleStateHighlight", {
          detail: { stateId, forceOff: true },
        }),
      );
    });
  }

  handleUTHover(event) {
    const button = event.target;
    const utId = button.dataset.ut;

    if (!utId) {
      console.error("No UT ID found on button for hover");
      return;
    }

    // Dispatch hover event
    window.dispatchEvent(
      new CustomEvent("stateHover", {
        detail: { stateId: utId },
      }),
    );
  }

  handleUTUnhover(event) {
    const button = event.target;
    const utId = button.dataset.ut;

    if (!utId) {
      console.error("No UT ID found on button for unhover");
      return;
    }

    // Dispatch unhover event
    window.dispatchEvent(
      new CustomEvent("stateUnhover", {
        detail: { stateId: utId },
      }),
    );
  }

  handleUTClick(event) {
    const button = event.target;
    const utId = button.dataset.ut;

    if (!utId) {
      console.error("No UT ID found on button");
      return;
    }

    // Toggle the selection state for the button
    button.classList.toggle("selected");

    // Create a synthetic event object that preserves the shift key state
    const syntheticEvent = {
      shiftKey: event.shiftKey,
      ctrlKey: event.ctrlKey,
      altKey: event.altKey,
      metaKey: event.metaKey,
      originalEvent: event
    };

    // Dispatch an event that will be handled like a regular state click
    // Include the synthetic event with preserved modifier keys
    window.dispatchEvent(
      new CustomEvent("stateClick", {
        detail: { stateId: utId, originalEvent: syntheticEvent },
      }),
    );

    // Also dispatch a hover event to immediately update the state info
    window.dispatchEvent(
      new CustomEvent("stateHover", {
        detail: { stateId: utId },
      }),
    );
  }

  // Update the visual appearance of a Small UT button based on highlight type
  updateUTButtonHighlight(stateId, highlightType) {
    const utButton = document.querySelector(
      `.small-uts-grid button[data-ut="${stateId}"]`,
    );
    if (!utButton) {
      return; // Not a UT or button not found
    }

    // Remove any existing highlight classes
    utButton.classList.remove("ut-leading", "ut-missing");

    // Add the appropriate class based on highlight type
    if (highlightType === "leading") {
      console.log(`🔘 Adding leading highlight to UT button: ${stateId}`);
      utButton.classList.add("ut-leading");
    } else if (highlightType === "missing") {
      console.log(
        `🔸 Adding missing highlight (shimmer) to UT button: ${stateId}`,
      );
      utButton.classList.add("ut-missing");
    }
  }

  // Clear highlight from all UT buttons
  clearAllUTButtonHighlights() {
    const utButtons = document.querySelectorAll(".small-uts-grid button");
    utButtons.forEach((button) => {
      button.classList.remove("ut-leading", "ut-missing");
    });
  }

  // Refresh highlighting for all manually selected UT buttons
  async refreshManuallySelectedUTs() {
    const selectedUTButtons = document.querySelectorAll(
      ".small-uts-grid button.selected",
    );

    for (const button of selectedUTButtons) {
      const utId = button.dataset.ut;
      if (utId) {
        console.log(`🔄 Refreshing manually selected UT: ${utId}`);
        await this.stateGroups.refreshUTHighlighting(utId);
      }
    }
  }

  // Refresh highlighting for all manually selected groups
  async refreshManuallySelectedGroups() {
    const activeButtons = document.querySelectorAll(
      ".button-grid button.active",
    );

    for (const button of activeButtons) {
      const groupName = button.textContent.trim();
      if (this.stateGroups.groups.has(groupName)) {
        console.log(`🔄 Refreshing manually selected group: ${groupName}`);
        await this.stateGroups.refreshGroupHighlighting(groupName);
      }
    }
  }

  // Highlight all states in a group if dominated by a player
  highlightGroupDomination(groupName, playerId) {
    const button =
      document.querySelector(
        `.button-grid button[data-group="${groupName}"]`,
      ) ||
      Array.from(document.querySelectorAll(".button-grid button")).find(
        (btn) => btn.textContent.trim() === groupName,
      );

    // If there's a button for this group, update its appearance
    if (button) {
      // Remove previous domination classes
      button.classList.remove("player1-dominated", "player2-dominated");

      // Add appropriate class if dominated
      if (playerId === 1) {
        button.classList.add("player1-dominated");
      } else if (playerId === 2) {
        button.classList.add("player2-dominated");
      }
    }

    // Check if this group is currently manually selected (active)
    const isManuallySelected = button && button.classList.contains("active");
    const states = this.stateGroups.getStatesInGroup(groupName);

    // Only apply automatic domination highlighting if the group is NOT manually selected
    if (!isManuallySelected) {
      // Highlight states based on domination
      if (playerId) {
        states.forEach((stateId) => {
          window.dispatchEvent(
            new CustomEvent("toggleStateHighlight", {
              detail: { stateId, forceState: true, highlightType: "default" },
            }),
          );
        });
      } else {
        states.forEach((stateId) => {
          window.dispatchEvent(
            new CustomEvent("toggleStateHighlight", {
              detail: { stateId, forceOff: true },
            }),
          );
        });
      }
    }
  }
}

// Create and export a single instance
export const groupUIController = new GroupUIController();
