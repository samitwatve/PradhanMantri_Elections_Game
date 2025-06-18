// Seat projection calculator

class SeatProjection {
  constructor() {
    this.statesData = null;
    this.totalSeats = 543;
    this.player1Element = document.getElementById("player1-seats");
    this.player2Element = document.getElementById("player2-seats");
    this.othersElement = document.getElementById("others-seats");

    this.initialize();
  }

  async initialize() {
    try {
      // Load states data
      const response = await fetch("states_data.json");
      this.statesData = await response.json();

      // Set up event listeners
      this.setupEventListeners();

      // Initial calculation
      setTimeout(() => this.updateProjection(), 1000);

      console.log("SeatProjection initialized successfully");
    } catch (error) {
      console.error("Failed to initialize seat projection:", error);
    }
  }

  setupEventListeners() {
    // Listen for popularity changes
    window.addEventListener("popularityChanged", () => {
      this.updateProjection();
    });

    // Listen for phase changes
    window.addEventListener("gamePhaseChanged", () => {
      this.updateProjection();
    });
  }
  updateProjection() {
    if (!this.statesData) return;

    // Get popularity data from stateInfo
    let totalP1Seats = 0;
    let totalP2Seats = 0;
    let totalOthersSeats = 0;

    this.statesData.forEach((state) => {
      const stateId = state.SvgId;
      const seats = parseInt(state.LokSabhaSeats) || 0;

      if (stateId && seats > 0) {
        // Get state popularity from stateInfo
        const popularity = window.stateInfo?.getStatePopularity(stateId);

        if (popularity) {
          // Calculate proportional seats
          const p1Seats = Math.round(seats * (popularity.player1 / 100));
          const p2Seats = Math.round(seats * (popularity.player2 / 100));
          let othersSeats = seats - p1Seats - p2Seats;

          // Handle rounding errors
          if (othersSeats < 0) {
            // Adjust p1 and p2 seats to ensure total is correct
            if (p1Seats > p2Seats) {
              totalP1Seats += p1Seats + othersSeats;
              totalP2Seats += p2Seats;
            } else {
              totalP1Seats += p1Seats;
              totalP2Seats += p2Seats + othersSeats;
            }
            othersSeats = 0;
          } else {
            totalP1Seats += p1Seats;
            totalP2Seats += p2Seats;
            totalOthersSeats += othersSeats;
          }
        }
      }
    });

    // Update the display
    this.updateDisplay(totalP1Seats, totalP2Seats, totalOthersSeats);

    // Log the projection
    console.log(
      `Seat projection updated - P1: ${totalP1Seats}, P2: ${totalP2Seats}, Others: ${totalOthersSeats}`,
    );

    // Check victory conditions
    this.checkVictoryConditions(totalP1Seats, totalP2Seats, totalOthersSeats);
  }
  updateDisplay(p1Seats, p2Seats, othersSeats) {
    if (this.player1Element) {
      this.player1Element.textContent = p1Seats;
    }

    if (this.player2Element) {
      this.player2Element.textContent = p2Seats;
    }

    if (this.othersElement) {
      this.othersElement.textContent = othersSeats;
    }

    // Update progress bars
    this.updateProgressBars(p1Seats, p2Seats, othersSeats);

    // Add victory threshold indicators
    const majorityThreshold = 272;

    if (p1Seats >= majorityThreshold) {
      this.player1Element.classList.add("majority");
      this.player2Element.classList.remove("majority");
    } else if (p2Seats >= majorityThreshold) {
      this.player1Element.classList.remove("majority");
      this.player2Element.classList.add("majority");
    } else {
      this.player1Element.classList.remove("majority");
      this.player2Element.classList.remove("majority");
    }

    // Analyze parliament composition
    this.analyzeParliamentComposition(p1Seats, p2Seats, othersSeats);
  }

  updateProgressBars(p1Seats, p2Seats, othersSeats) {
    const p1Bar = document.querySelector(".seats-progress-bar .p1-bar");
    const p2Bar = document.querySelector(".seats-progress-bar .p2-bar");
    const othersBar = document.querySelector(".seats-progress-bar .others-bar");

    if (p1Bar && p2Bar && othersBar) {
      const totalSeats = this.totalSeats;
      const p1Percent = (p1Seats / totalSeats) * 100;
      const p2Percent = (p2Seats / totalSeats) * 100;
      const othersPercent = (othersSeats / totalSeats) * 100;

      p1Bar.style.width = `${p1Percent}%`;
      p2Bar.style.width = `${p2Percent}%`;
      othersBar.style.width = `${othersPercent}%`;
    }
  }
  checkVictoryConditions(p1Seats, p2Seats, othersSeats) {
    // Analyze the parliament composition for display purposes only
    const analysis = this.analyzeParliamentComposition(
      p1Seats,
      p2Seats,
      othersSeats,
    );

    // Update status description if enabled
    const statusElement = document.querySelector(".parliament-status");
    if (statusElement) {
      statusElement.textContent = analysis.description;
      statusElement.className = "parliament-status " + analysis.status;
    }

    // Victory conditions are now only checked at the end of all phases
    // This method now only updates the display
  }

  // New method to check victory only at game end
  checkFinalVictoryConditions(p1Seats, p2Seats, othersSeats) {
    const majorityThreshold = 272;

    console.log(
      `Final victory check - P1: ${p1Seats}, P2: ${p2Seats}, Others: ${othersSeats}`,
    );

    // Check for outright victory
    if (p1Seats >= majorityThreshold) {
      // Player 1 wins
      window.dispatchEvent(
        new CustomEvent("gameVictory", {
          detail: { winner: 1, seats: p1Seats, type: "majority" },
        }),
      );
    } else if (p2Seats >= majorityThreshold) {
      // Player 2 wins
      window.dispatchEvent(
        new CustomEvent("gameVictory", {
          detail: { winner: 2, seats: p2Seats, type: "majority" },
        }),
      );
    } else {
      // Hung parliament - no clear winner
      window.dispatchEvent(
        new CustomEvent("gameVictory", {
          detail: {
            winner: null,
            seats: { p1: p1Seats, p2: p2Seats },
            type: "hung-parliament",
          },
        }),
      );
    }
  }
  analyzeParliamentComposition(p1Seats, p2Seats, othersSeats) {
    const majorityThreshold = 272;
    let status = "";
    let description = "";

    // Analyze the current composition
    if (p1Seats >= majorityThreshold) {
      status = "player1-majority";
      description = "Player 1 majority government";
    } else if (p2Seats >= majorityThreshold) {
      status = "player2-majority";
      description = "Player 2 majority government";
    } else if (
      p1Seats + othersSeats >= majorityThreshold &&
      p1Seats > p2Seats
    ) {
      status = "player1-coalition";
      description = "";
    } else if (
      p2Seats + othersSeats >= majorityThreshold &&
      p2Seats > p1Seats
    ) {
      status = "player2-coalition";
      description = "";
    } else {
      status = "hung-parliament";
      description = "Hung Parliament";
    }

    // Emit an event with the parliament status
    window.dispatchEvent(
      new CustomEvent("parliamentStatusChanged", {
        detail: {
          status,
          description,
          player1Seats: p1Seats,
          player2Seats: p2Seats,
          othersSeats: othersSeats,
        },
      }),
    );

    return { status, description };
  }
}

// Create and export a single instance
export const seatProjection = new SeatProjection();
