// Random Events System
// Handles random positive and negative events that affect state popularity

import { stateInfo } from "./state-info.js";
import { gameConfig } from "./game-config.js";
import { visualEffects } from "./visual-effects.js";
import { mapController } from "./map-controller.js";

class RandomEvents {
  constructor() {
    this.isEnabled = false;
    this.eventQueue = [];
    this.currentPhase = 1;
    this.lastEventPhase = 0;
    this.statesData = null;
    
    // Event templates
    this.positiveEvents = [
      "Major infrastructure project announced",
      "New tech hub established",
      "Agricultural subsidy program launched",
      "Educational excellence award received",
      "Tourism boost from international recognition",
      "Industrial investment secured",
      "Healthcare facility modernization completed",
      "Sports victory brings national pride",
      "Cultural festival celebrates heritage",
      "Green energy project inaugurated"
    ];
    
    this.negativeEvents = [
      "Natural disaster causes widespread damage",
      "Economic downturn hits local industries",
      "Corruption scandal emerges",
      "Infrastructure project faces delays",
      "Agricultural crisis affects farmers",
      "Healthcare system overwhelmed",
      "Environmental concerns raised",
      "Educational funding cuts announced",
      "Industrial accident sparks safety concerns",
      "Religious tensions create unrest"
    ];
    
    this.initialize();
  }
  
  async initialize() {
    console.log("Random Events System initialized");
    
    // Load states data
    try {
      const response = await fetch("states_data.json");
      if (response.ok) {
        this.statesData = await response.json();
        console.log("States data loaded for random events");
      }
    } catch (error) {
      console.error("Error loading states data for random events:", error);
    }
    
    // Listen for phase changes
    window.addEventListener("phaseChanged", (event) => {
      this.onPhaseChange(event.detail.currentPhase);
    });
  }
  
  // Enable or disable random events
  setEnabled(enabled) {
    this.isEnabled = enabled;
    console.log(`Random events ${enabled ? 'enabled' : 'disabled'}`);
  }
  
  // Check if random events are enabled
  getEnabled() {
    return this.isEnabled;
  }
  
  // Handle phase changes
  onPhaseChange(newPhase) {
    this.currentPhase = newPhase;
    
    // Trigger random event every other phase (phases 2, 4, 6, 8, 10...)
    if (this.isEnabled && newPhase > 1 && newPhase % 2 === 0) {
      if (this.lastEventPhase !== newPhase) {
        this.lastEventPhase = newPhase;
        setTimeout(() => {
          this.triggerRandomEvent();
        }, 2000); // Delay to let phase transition complete
      }
    }
  }
  
  // Trigger a random event
  triggerRandomEvent() {
    if (!this.statesData || this.statesData.length === 0) {
      console.log("Cannot trigger random event: No states data available");
      return;
    }
    
    // Choose random event type (50% positive, 50% negative)
    const isPositive = Math.random() < 0.5;
    const eventList = isPositive ? this.positiveEvents : this.negativeEvents;
    const eventDescription = eventList[Math.floor(Math.random() * eventList.length)];
    
    // Choose random state
    const randomState = this.statesData[Math.floor(Math.random() * this.statesData.length)];
    
    // Generate random magnitude (5-20%)
    const magnitude = Math.floor(Math.random() * 16) + 5; // 5 to 20
    
    // Apply the event
    this.applyRandomEvent(randomState, eventDescription, isPositive, magnitude);
  }
    // Apply random event to a state
  applyRandomEvent(stateData, eventDescription, isPositive, magnitude) {
    const stateId = stateData.SvgId;
    const stateName = stateData.State;
    
    // Get current popularity
    const popularity = stateInfo.getStatePopularity(stateId);
    const player1Pop = popularity?.player1 || 0;
    const player2Pop = popularity?.player2 || 0;
    
    let newPlayer1Pop = player1Pop;
    let newPlayer2Pop = player2Pop;
    
    // Simple logic: positive events always help Player 1, negative events always hurt Player 1
    if (isPositive) {
      newPlayer1Pop = Math.min(100, player1Pop + magnitude);
    } else {
      newPlayer1Pop = Math.max(0, player1Pop - magnitude);
    }
    
    // Update state popularity
    stateInfo.setStatePopularity(stateId, newPlayer1Pop, newPlayer2Pop);
    
    // Create visual effect
    this.createEventVisualEffect(stateId, isPositive);
    
    // Show notification
    this.showEventNotification(stateName, eventDescription, isPositive, magnitude);
    
    console.log(`Random event in ${stateName}: ${eventDescription} (${isPositive ? 'positive' : 'negative'}, ${magnitude}%)`);
  }
  
  // Create visual effect for random event
  createEventVisualEffect(stateId, isPositive) {
    try {
      const stateElement = mapController.svgDocument.getElementById(stateId);
      if (stateElement) {
        // Get the bounding box of the state
        const bbox = stateElement.getBBox();
        const centerX = bbox.x + bbox.width / 2;
        const centerY = bbox.y + bbox.height / 2;
        
        // Create a special event effect
        const effectColor = isPositive ? '#4ade80' : '#ef4444'; // Green for positive, red for negative
        visualEffects.createEventEffect(centerX, centerY, effectColor, isPositive);
      }
    } catch (error) {
      console.error("Error creating event visual effect:", error);
    }
  }  // Show event notification in TV display
  showEventNotification(stateName, eventDescription, isPositive, magnitude) {
    const sign = isPositive ? '+' : '-';
    
    // Get current timestamp
    const now = new Date();
    const time = now.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    
    // Create rich HTML content for TV display
    const eventClass = isPositive ? 'positive' : 'negative';
    const eventType = isPositive ? 'Positive' : 'Negative';
    const magnitudeColor = isPositive ? '#4ade80' : '#ef4444';
    
    const htmlContent = `
      <div class="event-notification ${eventClass}">
        <div class="event-header">
          <span class="event-magnitude">${sign}${magnitude}%</span>
        </div>
        <div class="event-description">${eventDescription}</div>
        <div class="event-location">📍 ${stateName}</div>
        <div class="event-timestamp">[${time}] BREAKING NEWS</div>
      </div>
    `;
    
    // Add to TV display if available
    if (window.tvDisplay && typeof window.tvDisplay.addNewsUpdate === 'function') {
      // Use HTML content with 30 second duration for random events
      window.tvDisplay.addNewsUpdate(htmlContent, true, 30000);
      console.log(`Random event added to TV: ${eventDescription} in ${stateName}`);
    } else {
      // Fallback: log to console if TV display not available
      console.log(`TV Display not available. Event: ${eventDescription} affects ${stateName}. ${sign}${magnitude}% impact.`);
    }
    
    console.log(`🎲 RANDOM EVENT: ${eventDescription} affects ${stateName}. ${sign}${magnitude}% impact.`);
  }
    // Note: repositionNotifications is no longer needed since we use TV display
  repositionNotifications(container = null) {
    // This method is kept for compatibility but not used with TV display
    return;
  }
  
  // Manual trigger for testing
  triggerTestEvent(stateId = null, isPositive = null) {
    if (!this.statesData) {
      console.log("Cannot trigger test event: No states data available");
      return;
    }
    
    const state = stateId ? 
      this.statesData.find(s => s.SvgId === stateId) : 
      this.statesData[Math.floor(Math.random() * this.statesData.length)];
    
    const positive = isPositive !== null ? isPositive : Math.random() < 0.5;
    const eventList = positive ? this.positiveEvents : this.negativeEvents;
    const eventDescription = eventList[Math.floor(Math.random() * eventList.length)];
    const magnitude = Math.floor(Math.random() * 16) + 5;
    
    this.applyRandomEvent(state, eventDescription, positive, magnitude);
  }
  
  // Debug/testing functions
  debugTriggerEvent(stateId = null, isPositive = null) {
    console.log("Manually triggering random event for testing");
    this.triggerTestEvent(stateId, isPositive);
  }
  
  // Debug: Show current status
  debugStatus() {
    console.log("Random Events Status:", {
      enabled: this.isEnabled,
      currentPhase: this.currentPhase,
      lastEventPhase: this.lastEventPhase,
      statesDataLoaded: !!this.statesData
    });
  }
}

// Create and export a single instance
export const randomEvents = new RandomEvents();

// Expose to global window for debugging
if (typeof window !== 'undefined') {
  window.randomEvents = randomEvents;
}
