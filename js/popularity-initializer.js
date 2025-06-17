// Popularity Initialization Module
// This module handles the initialization of state popularity scores
// according to the specifications in the roadmap

class PopularityInitializer {
  constructor() {
    this.statesData = null;
    this.politiciansData = null;
  }
  async initialize() {
    try {
      // Load states data
      const response = await fetch("states_data.json");
      this.statesData = await response.json();

      // Load politicians data for home state bonus
      const politiciansResponse = await fetch("politicians-data.json");
      this.politiciansData = await politiciansResponse.json();
      console.log("Loaded politicians data:", this.politiciansData);

      return this.statesData;
    } catch (error) {
      console.error("Failed to load states data:", error);
      return null;
    }
  }

  /**
   * Initialize state popularity scores according to the roadmap specifications
   * - Player 1 leads in 3-5 territories (100 seats)
   * - Player 2 leads in 3-5 territories (100 seats)
   * - All other states have player 1 and 2 < 35% popularity
   */ async initializeStatePopularity() {
    if (!this.statesData) {
      await this.initialize();
    }

    // Group states by seat count for better distribution
    const highSeatStates = this.statesData.filter(
      (state) => parseInt(state.LokSabhaSeats) > 20,
    );
    const mediumSeatStates = this.statesData.filter(
      (state) =>
        parseInt(state.LokSabhaSeats) > 5 &&
        parseInt(state.LokSabhaSeats) <= 20,
    );
    const lowSeatStates = this.statesData.filter(
      (state) => parseInt(state.LokSabhaSeats) <= 5,
    );

    // Track total seats allocated to each player
    let player1LeadingSeats = 0;
    let player2LeadingSeats = 0;

    // Set to track states where players are leading
    const player1LeadingStates = new Set();
    const player2LeadingStates = new Set();

    // Track allocated states
    const allocatedStates = new Set();

    // Initialize home state bonus module
    const { homeStateBonus } = await import("./home-state-bonus.js");
    await homeStateBonus.initialize();

    // Get home states for players from the home state bonus module
    const player1HomeState = homeStateBonus.getPlayerHomeState(1);
    const player2HomeState = homeStateBonus.getPlayerHomeState(2);

    console.log(
      `Using home states - Player 1: ${player1HomeState}, Player 2: ${player2HomeState}`,
    );

    // Debug: print out all state names for comparison
    console.log("All state names for home state comparison:");
    this.statesData.forEach((state) => {
      const isP1Home = homeStateBonus.isHomeState(1, state.State);
      const isP2Home = homeStateBonus.isHomeState(2, state.State);
      console.log(
        `- ${state.State} (SvgId: ${state.SvgId}) - P1 Home: ${isP1Home}, P2 Home: ${isP2Home}`,
      );
    });

    // Helper function to randomly select states until we reach target seats
    const allocateLeadingStates = (targetSeats, playerSet, otherPlayerSet) => {
      let currentSeats = 0;

      // Try high seat states first
      for (const state of this.shuffleArray([...highSeatStates])) {
        if (currentSeats >= targetSeats) break;

        // Skip if already allocated
        if (allocatedStates.has(state.SvgId)) continue;

        const seats = parseInt(state.LokSabhaSeats);
        playerSet.add(state.SvgId);
        allocatedStates.add(state.SvgId);
        currentSeats += seats;
      }

      // If we need more, try medium seat states
      if (currentSeats < targetSeats) {
        for (const state of this.shuffleArray([...mediumSeatStates])) {
          if (currentSeats >= targetSeats) break;

          // Skip if already allocated
          if (allocatedStates.has(state.SvgId)) continue;

          const seats = parseInt(state.LokSabhaSeats);
          playerSet.add(state.SvgId);
          allocatedStates.add(state.SvgId);
          currentSeats += seats;
        }
      }

      return currentSeats;
    };

    // Allocate 100 seats to player 1
    player1LeadingSeats = allocateLeadingStates(
      100,
      player1LeadingStates,
      player2LeadingStates,
    );

    // Allocate 100 seats to player 2
    player2LeadingSeats = allocateLeadingStates(
      100,
      player2LeadingStates,
      player1LeadingStates,
    );

    console.log(
      `Allocated ${player1LeadingSeats} seats to Player 1 in ${player1LeadingStates.size} states`,
    );
    console.log(
      `Allocated ${player2LeadingSeats} seats to Player 2 in ${player2LeadingStates.size} states`,
    ); // Generate popularity scores for all states
    const popularityMap = new Map();

    for (const state of this.statesData) {
      if (!state.SvgId) continue;

      let player1Pop, player2Pop, othersPop;

      if (player1LeadingStates.has(state.SvgId)) {
        // Player 1 leading with 35-60%
        player1Pop = this.getRandomInt(35, 60);
        player2Pop = this.getRandomInt(10, 35);
        othersPop = 100 - player1Pop - player2Pop;
      } else if (player2LeadingStates.has(state.SvgId)) {
        // Player 2 leading with 35-60%
        player2Pop = this.getRandomInt(35, 60);
        player1Pop = this.getRandomInt(10, 35);
        othersPop = 100 - player1Pop - player2Pop;
      } else {
        // Neither player leading
        player1Pop = this.getRandomInt(10, 35);
        player2Pop = this.getRandomInt(10, 35);
        othersPop = 100 - player1Pop - player2Pop;
      }

      // Store the initial popularity values before home state bonus
      const initialPopularity = {
        player1: player1Pop,
        player2: player2Pop,
        others: othersPop,
      };

      // Apply home state bonus using the dedicated module
      const finalPopularity = homeStateBonus.applyHomeStateBonus(
        state.SvgId,
        state.State,
        initialPopularity,
      );

      // Log the before and after values if there was a change
      if (
        initialPopularity.player1 !== finalPopularity.player1 ||
        initialPopularity.player2 !== finalPopularity.player2
      ) {
        console.log(
          `%cHome state bonus applied for ${state.State}`,
          "color: gold; font-weight: bold",
        );
        console.log(
          `Initial: P1=${initialPopularity.player1}%, P2=${initialPopularity.player2}%, Others=${initialPopularity.others}%`,
        );
        console.log(
          `After bonus: P1=${finalPopularity.player1}%, P2=${finalPopularity.player2}%, Others=${finalPopularity.others}%`,
        );
      }

      // Store the final popularity values
      popularityMap.set(state.SvgId, finalPopularity);
    }

    return popularityMap;
  }

  // Helper method to get random integer between min and max (inclusive)
  getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  // Helper method to shuffle an array
  shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
}

export const popularityInitializer = new PopularityInitializer();
