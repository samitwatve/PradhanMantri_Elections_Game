// Map interaction and state management
import { player1, player2 } from "./player-info.js";
import { stateInfo } from "./state-info.js";
import { gameOptions, isGamePaused } from "./game-options.js";
import { rallyController } from "./rally-controller.js";
import { gameConfig } from "./game-config.js";
import { visualEffects } from "./visual-effects.js";
import { ColorUtils } from "./color-utils.js";
import { dragDropUtils } from "./drag-drop-utils.js";
import { homeStateBonus } from "./home-state-bonus.js";
import { campaignSpending } from "./campaign-spending.js";
import { keyTracker } from "./key-tracker.js";

class MapController {
  constructor() {
    this.svgDocument = null;
    this.selectedStates = new Set();
    this.statesData = null;
    this.playersInitialized = { 1: false, 2: false };
    this.initialize();
  }

  async initialize() {
    try {
      // Load states data
      const response = await fetch("states_data.json");
      this.statesData = await response.json();

      // Initialize home state bonus module
      await homeStateBonus.initialize();

      // Get map object and wait for it to load
      const map = document.getElementById("india-map");
      await new Promise((resolve) => {
        const onLoad = () => {
          this.svgDocument = map.contentDocument;
          visualEffects.setSvgDocument(this.svgDocument);
          dragDropUtils.setSvgDocument(this.svgDocument);
          resolve();
        };

        if (map.contentDocument && map.contentDocument.documentElement) {
          onLoad();
        } else {
          map.addEventListener("load", onLoad);
        }
      });

      // Setup interactions after SVG is loaded
      this.setupStateInteractions();
      dragDropUtils.setupStateDropZones();

      // Listen for player initialization events
      window.addEventListener("playerInitialized", (event) => {
        const { playerId } = event.detail;
        this.playersInitialized[playerId] = true;

        if (this.playersInitialized[1] && this.playersInitialized[2]) {
          setTimeout(() => this.refreshAllStateColors(), 100);
        }
      });

      // Listen for popularity changes
      window.addEventListener("popularityChanged", async (event) => {
        const { stateId, popularity } = event.detail;
        this.updateStateColor(stateId, popularity);

        // Check for group domination
        setTimeout(async () => {
          try {
            const { stateGroups } = await import("./state-groups.js");
            stateGroups.scheduleGroupDominationCheck();
          } catch (error) {
            console.error("Error checking group domination:", error);
          }
        }, 100);
      });

      // Initialize all states with colors
      setTimeout(async () => {
        await this.initializeAllStates();
      }, 500);
    } catch (error) {
      console.error("Failed to initialize map:", error);
    }

    // Add event listener for state highlighting
    window.addEventListener("toggleStateHighlight", (event) => {
      const { stateId, forceState, forceOff, highlightType } = event.detail;
      visualEffects.toggleStateHighlight(
        stateId,
        forceState,
        forceOff,
        highlightType,
      );
    });
  }

  async initializeAllStates() {
    const { stateInfo } = await import("./state-info.js");

    const states = this.svgDocument.querySelectorAll("path");
    states.forEach((state) => {
      if (state.id) {
        let popularity = stateInfo.getStatePopularity(state.id);
        if (!popularity) {
          const stateData = stateInfo.initializeState(state.id);
          popularity = stateData.popularity;
        }
        this.updateStateColor(state.id, popularity);
      }
    });
    // Check for group domination once all states are colored
    setTimeout(async () => {
      try {
        const { stateGroups } = await import("./state-groups.js");
        await stateGroups.checkAllGroupsDomination();

        // Add permanent home state indicators
        visualEffects.addAllHomeStateIndicators();
      } catch (error) {
        console.error("Error checking group domination:", error);
      }
    }, 1000);
  }  setupStateInteractions() {
    if (!this.svgDocument) return;

    const states = this.svgDocument.querySelectorAll("path, polygon");
    states.forEach((state) => {
      if (!state.id) return;

      state.addEventListener("mousedown", (e) => this.handleStateClick(e));
      state.addEventListener("mouseover", (e) => this.handleStateHover(e));
      state.addEventListener("mouseout", (e) => this.handleStateUnhover(e));
    });

    // Add interaction for Lakshadweep bounding box
    const lakshadweepBbox = this.svgDocument.getElementById("bbox-lakshadweep");
    if (lakshadweepBbox) {
      lakshadweepBbox.addEventListener("mousedown", (e) =>
        this.handleLakshadweepClick(e),
      );
      lakshadweepBbox.addEventListener("mouseover", (e) => {
        const syntheticEvent = { ...e, target: { ...e.target, id: "INLD" } };
        this.handleStateHover(syntheticEvent);
      });
      lakshadweepBbox.addEventListener("mouseout", (e) => {
        const syntheticEvent = { ...e, target: { ...e.target, id: "INLD" } };
        this.handleStateUnhover(syntheticEvent);
      });
    }

    // Listen for events from UT buttons
    this.setupUTButtonEvents();
    this.setupHoverEvents();
  }  setupUTButtonEvents() {
    window.addEventListener("stateClick", async (event) => {
      if (isGamePaused()) return;

      const { stateId } = event.detail;
      if (!stateId) return;

      try {
        if (!this.statesData) {
          const response = await fetch("states_data.json");
          this.statesData = await response.json();
        }

        const stateData = this.statesData.find(
          (state) => state.SvgId === stateId,
        );
        if (!stateData) return;

        // Debug mode: One-click max popularity
        if (gameConfig.isDebugMode() && gameConfig.isOneClickMaxPopularity()) {
          const newPopularity = { player1: 100, player2: 0, others: 0 };
          stateInfo.setStatePopularity(stateId, newPopularity);

          window.dispatchEvent(
            new CustomEvent("stateHover", {
              detail: { stateId: stateId },
            }),
          );          return;
        }        // Check if this is a rally deployment (R + click)
        if (keyTracker.isRPressed()) {
          console.log(`=== R + CLICK DETECTED IN setupUTButtonEvents ===`);
          console.log(`State: ${stateId}`);
          console.log(`Rally controller available: ${!!rallyController}`);
          
          const success = await rallyController.handleRallyPlacement(stateId, 1);
          console.log(`Rally placement result: ${success}`);
          
          if (success) {
            // Dispatch hover event for state info update
            window.dispatchEvent(
              new CustomEvent("stateHover", {
                detail: { stateId: stateId },
              }),
            );
          }
          return;
        }

        // Use the new centralized campaign spending service
        // Extract the original event from detail if available
        const originalEvent = event.detail?.originalEvent || event;
        await campaignSpending.handleCampaignSpend(
          originalEvent,
          stateId,
          stateData,
          1 // Player 1
        );

      } catch (error) {
        console.error("Error processing state click:", error);
      }
    });
  }
  setupHoverEvents() {
    window.addEventListener("stateHover", (event) => {
      const { stateId } = event.detail;
      if (!stateId) return;

      // Don't call handleStateHover here as it would create infinite recursion
      // This event is for other components to listen to state hover events
      // The actual hover handling is done in setupStateInteractions
    });

    window.addEventListener("stateUnhover", (event) => {
      const { stateId } = event.detail;
      if (!stateId) return;      // Don't call handleStateUnhover here as it would create infinite recursion
      // This event is for other components to listen to state unhover events
    });
  }

  async handleStateClick(event) {
    if (isGamePaused()) return;

    const stateElement = event.target;
    const stateId = stateElement.id;
    const stateData = this.statesData.find((state) => state.SvgId === stateId);

    if (!stateData) return;

    // Debug mode: One-click max popularity
    if (gameConfig.isDebugMode() && gameConfig.isOneClickMaxPopularity()) {
      const newPopularity = { player1: 100, player2: 0, others: 0 };
      stateInfo.setStatePopularity(stateId, newPopularity);

      // Create ripple effect
      const svgPoint = this.svgDocument.querySelector("svg").createSVGPoint();
      svgPoint.x = event.clientX;
      svgPoint.y = event.clientY;
      const point = svgPoint.matrixTransform(
        stateElement.getScreenCTM().inverse(),
      );
      visualEffects.createRippleEffect(point.x, point.y, 1);

      window.dispatchEvent(
        new CustomEvent("stateHover", {
          detail: { stateId: stateId },
        }),
      );      return;    }    // Check if this is a rally deployment (R + click)
    if (keyTracker.isRPressed()) {
      console.log(`=== R + CLICK DETECTED IN handleStateClick ===`);
      console.log(`State: ${stateId}`);
      console.log(`Rally controller available: ${!!rallyController}`);
      
      const success = await rallyController.handleRallyPlacement(stateId, 1);
      console.log(`Rally placement result: ${success}`);
      
      if (success) {
        // Handle selection state
        const isSelected = this.selectedStates.has(stateId);
        if (!isSelected) {
          this.selectState(stateId);
        }

        // Dispatch hover event for state info update
        window.dispatchEvent(
          new CustomEvent("stateHover", {
            detail: { stateId: stateId },
          }),
        );
      }
      return;
    }

    // Get click coordinates for visual effects
    const svgPoint = this.svgDocument.querySelector("svg").createSVGPoint();
    svgPoint.x = event.clientX;
    svgPoint.y = event.clientY;
    const point = svgPoint.matrixTransform(
      stateElement.getScreenCTM().inverse(),
    );

    // Prepare visual context for campaign spending
    const visualContext = {
      element: stateElement,
      point: point
    };

    // Use the new centralized campaign spending service
    const success = await campaignSpending.handleCampaignSpend(
      event,
      stateId,
      stateData,
      1, // Player 1
      visualContext
    );

    if (success) {
      // Handle selection state
      const isSelected = this.selectedStates.has(stateId);
      if (!isSelected) {
        this.selectState(stateId);
      } else {
        this.deselectState(stateId);
      }

      // Dispatch hover event for state info update
      window.dispatchEvent(
        new CustomEvent("stateHover", {
          detail: { stateId: stateId },
        }),
      );
    }
  }
  selectState(stateId) {
    const stateElement = this.svgDocument.getElementById(stateId);
    if (stateElement) {
      const currentLeader = stateElement.getAttribute("data-leader");
      stateElement.setAttribute("data-prev-leader", currentLeader || "others");
      stateElement.setAttribute("data-selected", "true");
      this.selectedStates.add(stateId);
      this.triggerStateSelectionEvent(stateId, true);
    }
  }

  deselectState(stateId) {
    const stateElement = this.svgDocument.getElementById(stateId);
    if (stateElement) {
      stateElement.removeAttribute("data-selected");
      this.selectedStates.delete(stateId);

      Promise.all([import("./state-info.js")]).then(([stateModule]) => {
        const stateInfo = stateModule.stateInfo;
        const popularity = stateInfo.getStatePopularity(stateId);

        if (popularity) {
          this.updateStateColor(stateId, popularity);
        } else {
          stateElement.setAttribute("fill", "#9E9E9E");
          stateElement.setAttribute("data-leader", "others");
        }

        this.triggerStateSelectionEvent(stateId, false);
      });
    }
  }

  resetStateSelection(stateId) {
    const stateElement = this.svgDocument.getElementById(stateId);
    if (stateElement && this.selectedStates.has(stateId)) {
      this.selectedStates.delete(stateId);
      stateElement.removeAttribute("data-selected");

      Promise.all([import("./state-info.js")]).then(([stateModule]) => {
        const stateInfo = stateModule.stateInfo;
        const popularity = stateInfo.getStatePopularity(stateId);
        if (popularity) {
          this.updateStateColor(stateId, popularity);
        }
      });

      this.triggerStateSelectionEvent(stateId, false);
    }
  }

  resetAllSelections() {
    const selectedStatesCopy = [...this.selectedStates];
    selectedStatesCopy.forEach((stateId) => {
      this.resetStateSelection(stateId);
    });
  }
  handleStateHover(event) {
    const stateElement = event.target;
    const stateId = stateElement.id;

    window.dispatchEvent(
      new CustomEvent("stateHover", {
        detail: { stateId: stateId },
      }),
    );
  }

  handleStateUnhover(event) {
    // Colors are maintained by data attributes, no action needed
  }

  updateStateColor(stateId, popularityData) {
    const stateElement = this.svgDocument.getElementById(stateId);
    if (!stateElement) return;

    // Check if player colors are available
    if (!player1.primaryColor || !player2.primaryColor) {
      setTimeout(() => this.updateStateColor(stateId, popularityData), 200);
      return;
    }

    // Calculate color and leader
    const { color, leader } = ColorUtils.getStateColor(
      popularityData,
      player1.primaryColor,
      player2.primaryColor,
    );

    // Update state element
    stateElement.setAttribute("data-leader", leader);
    stateElement.setAttribute("fill", color);

    // Update UT button
    ColorUtils.updateUTButtonColor(stateId, popularityData);

    // Schedule group domination check
    setTimeout(async () => {
      try {
        const { stateGroups } = await import("./state-groups.js");
        stateGroups.scheduleGroupDominationCheck();
      } catch (error) {
        console.error("Error scheduling group domination check:", error);
      }
    }, 100);
  }
  triggerStateSelectionEvent(stateId, selected) {
    window.dispatchEvent(
      new CustomEvent("stateSelection", {
        detail: { stateId: stateId, selected: selected },
      }),
    );
  }
  async handleLakshadweepClick(event) {
    if (isGamePaused()) return;

    const stateId = "INLD";
    const stateData = this.statesData.find((state) => state.SvgId === stateId);
    if (!stateData) return;

    // Debug mode
    if (gameConfig.isDebugMode() && gameConfig.isOneClickMaxPopularity()) {
      const newPopularity = { player1: 100, player2: 0, others: 0 };
      stateInfo.setStatePopularity(stateId, newPopularity);

      const bbox = event.target.getBBox();
      const centerX = bbox.x + bbox.width / 2;
      const centerY = bbox.y + bbox.height / 2;
      visualEffects.createRippleEffect(centerX, centerY, 1);

      window.dispatchEvent(
        new CustomEvent("stateHover", {
          detail: { stateId: stateId },
        }),
      );      return;
    }

    // Check if this is a rally deployment (R + click)
    if (keyTracker.isRPressed()) {
      const success = await rallyController.handleRallyPlacement(stateId, 1);
      
      if (success) {
        // Handle selection state
        const isSelected = this.selectedStates.has(stateId);
        if (!isSelected) {
          this.selectState(stateId);
        }

        // Dispatch hover event for state info update
        window.dispatchEvent(
          new CustomEvent("stateHover", {
            detail: { stateId: stateId },
          }),
        );
      }
      return;
    }

    // Prepare visual context for Lakshadweep
    const bbox = event.target.getBBox();
    const centerX = bbox.x + bbox.width / 2;
    const centerY = bbox.y + bbox.height / 2;
    const stateElement = this.svgDocument.getElementById(stateId);
    
    const visualContext = {
      element: stateElement,
      point: { x: centerX, y: centerY }
    };

    // Use the new centralized campaign spending service
    const success = await campaignSpending.handleCampaignSpend(
      event,
      stateId,
      stateData,
      1, // Player 1
      visualContext
    );

    if (success) {
      // Handle selection state
      const isSelected = this.selectedStates.has(stateId);
      if (!isSelected) {
        this.selectState(stateId);
      } else {
        this.deselectState(stateId);
      }
    }
  }
  async refreshAllStateColors() {
    if (!this.svgDocument) return;

    const { stateInfo } = await import("./state-info.js");

    const states = this.svgDocument.querySelectorAll("path");
    states.forEach((state) => {
      if (state.id) {
        const popularity = stateInfo.getStatePopularity(state.id);
        if (popularity) {
          this.updateStateColor(state.id, popularity);
        }
      }
    });

    // Add permanent home state indicators
    visualEffects.addAllHomeStateIndicators();
  }
}
// Create and export a single instance of MapController
export const mapController = new MapController();
