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

    // Assign exactly 2 tokens (regular or special) at game start (phase 1)
    if (typeof player1.specialTokenCount !== 'number') player1.specialTokenCount = 0;
    if (typeof player1.rallyTokens !== 'number') player1.rallyTokens = 0;
    player1.specialTokenCount = 0;
    player1.rallyTokens = 0;
    let specialAwarded = 0, regularAwarded = 0;
    for (let i = 0; i < 2; i++) {
      if (Math.random() < 0.5) {
        player1.specialTokenCount++;
        specialAwarded++;
      } else {
        player1.rallyTokens++;
        regularAwarded++;
      }
    }
    if (typeof player1.updateRallyTokensDisplay === 'function') {
      player1.updateRallyTokensDisplay();
    } else {
      // fallback: re-render tokens if method missing
      const player1Info = document.getElementById("player1-info");
      if (player1Info) {
        const rallyTokensDisplay = player1Info.querySelector(".rally-tokens-display");
        if (rallyTokensDisplay && typeof this.createDraggableRallyIcons === 'function') {
          this.createDraggableRallyIcons(rallyTokensDisplay);
        }
      }
    }
    // Optional: show a notification or sound if any special token awarded
    if (specialAwarded > 0) {
      if (window.tvDisplay && typeof window.tvDisplay.addNotification === 'function') {
        window.tvDisplay.addNotification({
          type: 'event-positive',
          title: 'Special Rally Token Awarded!',
          details: `You received ${specialAwarded} Special Rally Token${specialAwarded > 1 ? 's' : ''} (★) at game start!`,
          timestamp: new Date(),
          duration: 4000
        });
      }
      if (window.soundManager && typeof window.soundManager.playFanfare === 'function') {
        window.soundManager.playFanfare();
      }
    }

    // Set up drag-and-drop for SVG map and states
    this.setupMapDragAndDrop();

    // Set up event listeners
    this.setupEventListeners();

    // Set up drag and drop functionality
    this.setupDragAndDrop();
    
    // Mark as initialized
    this.initialized = true;
    console.log("Rally Controller fully initialized");
  }

  // Add drag-and-drop listeners to SVG map and state paths
  setupMapDragAndDrop() {
    if (!this.svgDocument) return;
    const svgRoot = this.svgDocument.documentElement;
    // Get all state elements (paths with id)
    const stateElements = Array.from(this.svgDocument.querySelectorAll('[id]'));

    // Allow special tokens to be dropped anywhere on the map
    svgRoot.addEventListener('dragover', (e) => {
      const tokenType = this._getDraggedTokenType(e);
      if (tokenType === 'special') {
        e.preventDefault();
        svgRoot.style.cursor = 'copy';
      }
    });
    svgRoot.addEventListener('dragleave', () => {
      svgRoot.style.cursor = '';
    });
    svgRoot.addEventListener('drop', (e) => {
      const tokenType = this._getDraggedTokenType(e);
      if (tokenType === 'special') {
        e.preventDefault();
        svgRoot.style.cursor = '';
        this._flashScreen('green');
        // Use a special rally (player 1 for demo)
        this.handleRallyPlacement(null, 1, 'special');
      }
    });

    // Allow regular tokens to be dropped only on state elements
    stateElements.forEach((el) => {
      el.addEventListener('dragover', (e) => {
        const tokenType = this._getDraggedTokenType(e);
        if (tokenType === 'normal') {
          e.preventDefault();
          el.style.cursor = 'copy';
        }
      });
      el.addEventListener('dragleave', () => {
        el.style.cursor = '';
      });
      el.addEventListener('drop', (e) => {
        const tokenType = this._getDraggedTokenType(e);
        if (tokenType === 'normal') {
          e.preventDefault();
          el.style.cursor = '';
          this._flashScreen('red');
          // Use a regular rally (player 1 for demo)
          this.handleRallyPlacement(el.id, 1, 'normal');
        }
      });
    });
  }

  // Helper to get the dragged token type from the event
  _getDraggedTokenType(e) {
    let type = null;
    try {
      type = e.dataTransfer.getData('tokenType');
    } catch {}
    return type;
  }

  // Visual feedback for drop
  _flashScreen(color) {
    const flash = document.createElement('div');
    flash.className = 'screen-flash';
    flash.style.background = color === 'green' ? 'rgba(0,255,0,0.3)' : 'rgba(255,0,0,0.3)';
    flash.style.position = 'fixed';
    flash.style.top = 0;
    flash.style.left = 0;
    flash.style.width = '100vw';
    flash.style.height = '100vh';
    flash.style.zIndex = 9999;
    flash.style.pointerEvents = 'none';
    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), 350);
  }

  setupEventListeners() {
    // Listen for drop events on states
    window.addEventListener("rallyDrop", async (event) => {
      const { stateId, tokenType } = event.detail;
      // Default to 'normal' if not provided
      await this.handleRallyPlacement(stateId, 1, tokenType || 'normal');
    });

    // Listen for game phase changes to reset AI rally behavior and assign 2 tokens (regular or special)
    window.addEventListener("gamePhaseChanged", () => {
      console.log("Rally controller received phase change event");
      // Always reset both counts to 0 before assignment
      player1.rallyTokens = 0;
      player1.specialTokenCount = 0;
      let specialAwarded = 0, regularAwarded = 0;
      for (let i = 0; i < 2; i++) {
        if (Math.random() < 0.5) {
          player1.specialTokenCount++;
          specialAwarded++;
        } else {
          player1.rallyTokens++;
          regularAwarded++;
        }
      }
      // Now update the display exactly once, after assignment
      if (typeof player1.updateRallyTokensDisplay === 'function') {
        player1.updateRallyTokensDisplay();
      } else {
        // fallback: re-render tokens if method missing
        const player1Info = document.getElementById("player1-info");
        if (player1Info) {
          const rallyTokensDisplay = player1Info.querySelector(".rally-tokens-display");
          if (rallyTokensDisplay && typeof this.createDraggableRallyIcons === 'function') {
            this.createDraggableRallyIcons(rallyTokensDisplay);
          }
        }
      }
      // Only show notification if any special token awarded
      if (specialAwarded > 0) {
        if (window.tvDisplay && typeof window.tvDisplay.addNotification === 'function') {
          window.tvDisplay.addNotification({
            type: 'event-positive',
            title: 'Special Rally Token Awarded!',
            details: `You received ${specialAwarded} Special Rally Token${specialAwarded > 1 ? 's' : ''} (★) this phase!`,
            timestamp: new Date(),
            duration: 4000
          });
        }
        if (window.soundManager && typeof window.soundManager.playFanfare === 'function') {
          window.soundManager.playFanfare();
        }
      }
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
    // Always render exactly 2 slots: fill with available tokens, then used/greyed out
    let regularLeft = player1.rallyTokens || 0;
    let specialLeft = player1.specialTokenCount || 0;
    let rendered = 0;
    // Render regular tokens first
    while (regularLeft > 0 && rendered < 2) {
      const tokenElement = document.createElement("span");
      tokenElement.setAttribute("data-token-index", rendered);
      tokenElement.classList.add("rally-token-icon", "rally-token-bg");
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
      container.appendChild(tokenElement);
      regularLeft--;
      rendered++;
    }
    // Then render special tokens
    while (rendered < 2 && specialLeft > 0) {
      const specialToken = document.createElement("span");
      specialToken.setAttribute("data-token-index", "special-" + rendered);
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
      specialLeft--;
      rendered++;
    }
    // If less than 2 tokens, fill the rest as used (greyed out)
    while (rendered < 2) {
      const usedToken = document.createElement("span");
      usedToken.setAttribute("data-token-index", "used-" + rendered);
      usedToken.classList.add("rally-token-icon", "rally-token-bg", "used");
      usedToken.draggable = false;
      usedToken.textContent = "📢";
      usedToken.title = "Rally token used - replenishes next phase";
      container.appendChild(usedToken);
      rendered++;
    }
  }

  async handleRallyPlacement(stateId, playerId, tokenType = 'normal') {
    console.log(`Rally placement attempt: ${stateId}, Player: ${playerId}, TokenType: ${tokenType}`);

    while (!this.initialized) {
      await new Promise(res => setTimeout(res, 50));
    }

    const player = playerId === 1 ? player1 : player2;    // Check for special token use
    if (tokenType === 'special') {
      if (player.specialTokenCount <= 0) {
        player.showInsufficientRallyTokensError();
        return false;
      }
      player.specialTokenCount--;
      // Use our custom display update instead of player's method
      const player1Info = document.getElementById("player1-info");
      if (player1Info) {
        const rallyTokensDisplay = player1Info.querySelector(".rally-tokens-display");
        if (rallyTokensDisplay) {
          this.createDraggableRallyIcons(rallyTokensDisplay);
        }
      }

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

    // (Removed duplicate special token block)

    // Normal rally
    if (!this.canPlaceRallyInState(stateId)) {
      this.showMaxRalliesError(stateId, playerId);
      return false;
    }    player.rallyTokens--;
    // Use our custom display update instead of player's method
    const player1Info = document.getElementById("player1-info");
    if (player1Info) {
      const rallyTokensDisplay = player1Info.querySelector(".rally-tokens-display");
      if (rallyTokensDisplay) {
        this.createDraggableRallyIcons(rallyTokensDisplay);
      }
    }
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
        ?  ` (${info.rallies.map(r => this.getPlayerPartyName(r.playerId)).join(", ")})`
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