// Rally Controller
// Manages rally token placement, visual representation, and mechanics

import { player1, player2 } from "./player-info.js";
import { stateInfo } from "./state-info.js";

class RallyController {
  constructor() {
    this.rallies = new Map(); // Track rallies by state: stateId -> [{playerId, tokenId}]
    this.maxRalliesPerState = 2;
    this.rallyPopularityBoost = 8; // 8% popularity boost per rally
    this.svgDocument = null;
    this.rallyMode = false;
    this.gameConfig = null; // Store game configuration
    this.initialized = false; // Track initialization status
    this.initialize();
  }

  async initialize() {
    console.log("Rally Controller initialized");

    // Wait for map to be loaded
    const map = document.getElementById("india-map");
    await new Promise((resolve) => {
      const onLoad = () => {
        this.svgDocument = map.contentDocument;
        resolve();
      };

      if (map.contentDocument && map.contentDocument.documentElement) {
        onLoad();
      } else {
        map.addEventListener("load", onLoad);
      }
    });

    // Set up event listeners
    this.setupEventListeners();

    // Set up drag and drop functionality
    this.setupDragAndDrop();
    
    // Mark as initialized
    this.initialized = true;
    console.log("Rally Controller fully initialized");
  }

  setupEventListeners() {
    // Listen for drop events on states
    window.addEventListener("rallyDrop", async (event) => {
      const { stateId, tokenType } = event.detail;
      // Default to 'normal' if not provided
      await this.handleRallyPlacement(stateId, 1, tokenType || 'normal');
    });

    // Listen for game phase changes to reset AI rally behavior
    window.addEventListener("gamePhaseChanged", () => {
      console.log("Rally controller received phase change event");
    });
  }

  setupDragAndDrop() {
    // Make rally tokens in player info draggable
    const setupWhenReady = () => {
      const player1Info = document.getElementById("player1-info");
      const rallyTokensDisplay = player1Info?.querySelector(".rally-tokens-display");
      
      if (player1Info && rallyTokensDisplay) {
        this.setupPlayerRallyDragAndDrop();
      } else {
        setTimeout(setupWhenReady, 100);
      }
    };
    
    setupWhenReady();
  }

  setupPlayerRallyDragAndDrop() {
    const player1Info = document.getElementById("player1-info");
    if (!player1Info) return;

    const rallyTokensDisplay = player1Info.querySelector(".rally-tokens-display");
    if (!rallyTokensDisplay) return;

    // Create draggable rally icons
    this.createDraggableRallyIcons(rallyTokensDisplay);
  }

  createDraggableRallyIcons(container) {
    container.innerHTML = "";
    // Normal tokens (not draggable, not special)
    for (let i = 0; i < player1.maxRallyTokens; i++) {
      const tokenElement = document.createElement("span");
      tokenElement.setAttribute("data-token-index", i);
      tokenElement.classList.add("rally-token-icon", "rally-token-bg");
      if (i < player1.rallyTokens) {
        tokenElement.draggable = true;
        tokenElement.title = "Drag to use Rally Token (📢) - State effect";
        tokenElement.textContent = "📢";
        tokenElement.classList.add("available");
        tokenElement.addEventListener("dragstart", (e) => {
          e.dataTransfer.setData("text/plain", "rally-token");
          e.dataTransfer.setData("rally-token", "normal");
          e.dataTransfer.setData("tokenType", "normal");
          e.dataTransfer.effectAllowed = "move";
          tokenElement.classList.add("dragging");
          document.body.classList.add("rally-dragging");
          const mapContainer = document.querySelector(".map-container");
          if (mapContainer) mapContainer.classList.add("drag-active");
        });
        tokenElement.addEventListener("dragend", () => {
          tokenElement.classList.remove("dragging");
          document.body.classList.remove("rally-dragging");
          const mapContainer = document.querySelector(".map-container");
          if (mapContainer) mapContainer.classList.remove("drag-active");
        });
      } else {
        tokenElement.draggable = false;
        tokenElement.textContent = "📢";
        tokenElement.title = "Rally token used - replenishes next phase";
        tokenElement.classList.add("used");
      }
      container.appendChild(tokenElement);
    }
    // Special token (if any)
    if (player1.specialTokenCount > 0) {
      const specialToken = document.createElement("span");
      specialToken.setAttribute("data-token-index", "special");
      specialToken.classList.add("rally-token-icon", "rally-token-bg", "special");
      specialToken.draggable = true;
      specialToken.title = "Drag to use Special Rally Token (★) - Nationwide effect";
      specialToken.textContent = "★";
      specialToken.addEventListener("dragstart", (e) => {
        e.dataTransfer.setData("text/plain", "special-rally-token");
        e.dataTransfer.setData("rally-token", "special");
        e.dataTransfer.setData("tokenType", "special");
        e.dataTransfer.effectAllowed = "move";
        specialToken.classList.add("dragging");
        document.body.classList.add("rally-dragging");
        const mapContainer = document.querySelector(".map-container");
        if (mapContainer) mapContainer.classList.add("drag-active");
      });
      specialToken.addEventListener("dragend", () => {
        specialToken.classList.remove("dragging");
        document.body.classList.remove("rally-dragging");
        const mapContainer = document.querySelector(".map-container");
        if (mapContainer) mapContainer.classList.remove("drag-active");
      });
      container.appendChild(specialToken);
    }
  }

  async handleRallyPlacement(stateId, playerId, tokenType = 'normal') {
    console.log(`Rally placement attempt: ${stateId}, Player: ${playerId}, TokenType: ${tokenType}`);

    while (!this.initialized) {
      await new Promise(res => setTimeout(res, 50));
    }

    const player = playerId === 1 ? player1 : player2;
    // Check for special token use
    if (tokenType === 'special') {
      if (player.specialTokenCount <= 0) {
        player.showInsufficientRallyTokensError();
        return false;
      }
      player.specialTokenCount = 0;
      player.updateRallyTokensDisplay();

      if (!this.statesData) {
        const response = await fetch("states_data.json");
        this.statesData = await response.json();
      }
      for (const state of this.statesData) {
        stateInfo.updateStatePopularity(state.SvgId, playerId, 5);
      }

      const playerName = this.getPlayerPartyName(playerId);
      try {
        const { actionsLog } = await import("./actions-log.js");
        actionsLog.addAction(`${playerName} used a Special Rally Token! (+5% popularity in all states)`);
      } catch {
        console.log(`${playerName} used a Special Rally Token! (+5% popularity in all states)`);
      }

      // Add special notification to LIVE updates (TV display)
      if (window.tvDisplay && typeof window.tvDisplay.addNotification === 'function') {
        window.tvDisplay.addNotification({
          type: 'event-positive',
          title: 'Special Rally Token Activated!',
          details: `${playerName} used a Special Rally Token! (+5% popularity in all states)`,
          timestamp: new Date(),
          duration: 5000
        });
      }

      this.triggerSpecialRallyShimmer();
      console.log(`Special Rally Token used by player ${playerId}`);
      return true;
    }
    // Check for normal token use
    if (player.rallyTokens <= 0) {
      console.log(`Player ${playerId} has no rally tokens (${player.rallyTokens})`);
      player.showInsufficientRallyTokensError();
      return false;
    }

    if (tokenType === 'special') {
      player.rallyTokens--;
      player.updateRallyTokensDisplay();

      if (!this.statesData) {
        const response = await fetch("states_data.json");
        this.statesData = await response.json();
      }
      for (const state of this.statesData) {
        stateInfo.updateStatePopularity(state.SvgId, playerId, 5);
      }

      const playerName = this.getPlayerPartyName(playerId);
      try {
        const { actionsLog } = await import("./actions-log.js");
        actionsLog.addAction(`${playerName} used a Special Rally Token! (+5% popularity in all states)`);
      } catch {
        console.log(`${playerName} used a Special Rally Token! (+5% popularity in all states)`);
      }

      // Add special notification to LIVE updates (TV display)
      if (window.tvDisplay && typeof window.tvDisplay.addNotification === 'function') {
        window.tvDisplay.addNotification({
          type: 'event-positive',
          title: 'Special Rally Token Activated!',
          details: `${playerName} used a Special Rally Token! (+5% popularity in all states)`,
          timestamp: new Date(),
          duration: 5000
        });
      }

      this.triggerSpecialRallyShimmer();
      console.log(`Special Rally Token used by player ${playerId}`);
      return true;
    }

    // Normal rally
    if (!this.canPlaceRallyInState(stateId)) {
      this.showMaxRalliesError(stateId, playerId);
      return false;
    }

    player.rallyTokens--;
    player.updateRallyTokensDisplay();
    this.placeRally(stateId, playerId);
    stateInfo.updateStatePopularity(stateId, playerId, this.rallyPopularityBoost);

    const playerName = this.getPlayerPartyName(playerId);
    try {
      const { actionsLog } = await import("./actions-log.js");
      actionsLog.addAction(`${playerName} held a rally in ${stateId} (+${this.rallyPopularityBoost}% popularity)`);
    } catch {
      console.log(`${playerName} held a rally in ${stateId} (+${this.rallyPopularityBoost}% popularity)`);
    }

    this.addRallyVisualToMap(stateId, playerId);
    console.log(`Rally placed successfully for player ${playerId} in ${stateId}`);
    return true;
  }

  // Show nationwide gold shimmer effect
  triggerSpecialRallyShimmer() {
    const old = document.querySelector('.special-rally-shimmer');
    if (old) old.remove();

    const shimmer = document.createElement('div');
    shimmer.className = 'special-rally-shimmer';
    document.body.appendChild(shimmer);

    shimmer.addEventListener('animationend', () => shimmer.remove());
  }

  canPlaceRallyInState(stateId) {
    const stateRallies = this.rallies.get(stateId) || [];
    return stateRallies.length < this.maxRalliesPerState;
  }

  placeRally(stateId, playerId) {
    if (!this.rallies.has(stateId)) this.rallies.set(stateId, []);
    const stateRallies = this.rallies.get(stateId);
    stateRallies.push({ playerId, tokenId: `rally-${stateId}-${playerId}-${Date.now()}`, timestamp: Date.now() });
    console.log(`Rally placed in ${stateId}:`, stateRallies);
  }

  addRallyVisualToMap(stateId, playerId) {
    if (!this.svgDocument) return;
    const stateEl = this.svgDocument.getElementById(stateId);
    if (!stateEl) return;

    const bbox = stateEl.getBBox();
    const centerX = bbox.x + bbox.width / 2;
    const centerY = bbox.y + bbox.height / 2;
    const rallies = this.rallies.get(stateId) || [];
    const idx = rallies.length - 1;
    const offsetX = idx * 15, offsetY = idx * 10;

    const circle = this.svgDocument.createElementNS("http://www.w3.org/2000/svg", "circle");
    const id = `rally-visual-${stateId}-${playerId}-${Date.now()}`;
    circle.setAttribute("id", id);
    circle.setAttribute("cx", centerX + offsetX);
    circle.setAttribute("cy", centerY + offsetY);
    circle.setAttribute("r", "8");
    // Use player primary color for rally fill
    const fillColor = playerId === 1 ? player1.primaryColor : player2.primaryColor;
    circle.setAttribute("fill", fillColor);
    circle.setAttribute("stroke", "#ffffff");
    circle.setAttribute("stroke-width", "2");
    circle.setAttribute("class", "rally-token");
    circle.setAttribute("pointer-events", "none");

    const text = this.svgDocument.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("id", `${id}-text`);
    text.setAttribute("x", centerX + offsetX);
    text.setAttribute("y", centerY + offsetY + 3);
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("font-size", "10");
    text.setAttribute("fill", "#ffffff");
    text.setAttribute("font-weight", "bold");
    text.textContent = "📢";
    text.setAttribute("pointer-events", "none");

    const tooltip = `Rally by ${this.getPlayerPartyName(playerId)} (+${this.rallyPopularityBoost}% popularity)`;
    circle.setAttribute("title", tooltip);
    text.setAttribute("title", tooltip);

    this.svgDocument.documentElement.append(circle, text);
  }

  showMaxRalliesError(stateId, playerId) {
    console.log(`Maximum rallies reached for state ${stateId}`);
    if (window.soundManager && playerId === 1) {
      window.soundManager.playInvalidAction();
    }

    const errorMsg = document.createElement("div");
    errorMsg.className = "rally-error-message";
    errorMsg.innerHTML = `
      <i class="fas fa-exclamation-triangle"></i>
      <span>Maximum rallies (${this.maxRalliesPerState}) reached for this state</span>
    `;
    document.body.appendChild(errorMsg);
    setTimeout(() => errorMsg.remove(), 2000);
  }

  async placeAIRally() {
    console.log("AI attempting to place rally");
    if (!player2.canUseRallyToken()) {
      console.log("AI has no rally tokens available");
      return false;
    }

    if (!this.statesData) {
      const resp = await fetch("states_data.json");
      this.statesData = await resp.json();
    }

    const suitable = this.findSuitableStatesForAIRally();
    if (!suitable.length) return false;

    const target = this.chooseAIRallyTarget(suitable);
    return target ? this.handleRallyPlacement(target, 2) : false;
  }

  findSuitableStatesForAIRally() {
    const out = [];
    for (const sd of this.statesData || []) {
      const id = sd.SvgId;
      if (!this.canPlaceRallyInState(id)) continue;
      const pop = stateInfo.getStatePopularity(id) || {};
      const diff = Math.abs((pop.player2 || 0) - (pop.player1 || 0));
      const seats = parseInt(sd.LokSabhaSeats, 10);
      out.push({ stateId: id, score: seats * 2 + (50 - diff) });
    }
    return out.sort((a, b) => b.score - a.score);
  }

  chooseAIRallyTarget(states) {
    const top = states.slice(0, Math.min(5, states.length));
    return top[Math.floor(Math.random() * top.length)]?.stateId;
  }

  getStateRallyInfo(stateId) {
    const list = this.rallies.get(stateId) || [];
    return {
      count: list.length,
      max: this.maxRalliesPerState,
      canPlace: list.length < this.maxRalliesPerState,
      rallies: list
    };
  }

  updateStateTooltip(stateId, tooltip) {
    const info = this.getStateRallyInfo(stateId);
    tooltip += `\nRallies: ${info.count}/${info.max}` +
      (info.count
        ? ` (${info.rallies.map(r => this.getPlayerPartyName(r.playerId)).join(", ")})`
        : info.canPlace ? " (Available)" : " (Full)");
    return tooltip;
  }

  loadGameConfiguration() {
    try {
      const cfg = localStorage.getItem("gameConfig");
      this.gameConfig = cfg ? JSON.parse(cfg) : {
        player1Politician: { party: "Player 1" },
        player2Politician: { party: "Player 2" }
      };
    } catch {
      this.gameConfig = {
        player1Politician: { party: "Player 1" },
        player2Politician: { party: "Player 2" }
      };
    }
  }

  getPlayerPartyName(playerId) {
    if (!this.gameConfig) this.loadGameConfiguration();
    return playerId === 1
      ? this.gameConfig.player1Politician.party
      : this.gameConfig.player2Politician.party;
  }

  isReady() {
    return this.initialized;
  }
}

// Create and export the rally controller instance
export const rallyController = new RallyController();
window.rallyController = rallyController;
