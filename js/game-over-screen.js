// Game Over Screen Component
class GameOverScreen {
    constructor() {
        this.isVisible = false;
        this.finalResults = null;
        this.overlayElement = null;
        this.parliamentChart = null;
        
        this.initialize();
    }
    
    initialize() {
        this.createOverlayElement();
        this.setupEventListeners();
        console.log('Game Over Screen initialized');
    }
    
    createOverlayElement() {
        // Create the game over overlay
        this.overlayElement = document.createElement('div');
        this.overlayElement.id = 'game-over-overlay';
        this.overlayElement.className = 'game-over-overlay';
        this.overlayElement.style.display = 'none';
        
        // Create the game over content
        this.overlayElement.innerHTML = `            <div class="game-over-container">
                <div class="game-over-header">
                    <h1 class="game-over-title">FINAL RESULTS</h1>
                </div>
                  <div class="game-over-content">
                    <div class="results-summary">
                        <div class="winner-announcement">
                            <div class="winner-text" id="winner-text">Calculating Results...</div>
                            <div class="winner-details" id="winner-details"></div>
                        </div>
                    </div>
                      <div class="parliament-chart-container">
                        <div id="parliament-chart" class="parliament-chart"></div>
                        <div class="chart-legend">
                            <div class="legend-item">
                                <div class="legend-color player1-color"></div>
                                <span id="legend-bjp-text">BJP: 0 seats</span>
                            </div>
                            <div class="legend-item">
                                <div class="legend-color others-color"></div>
                                <span id="legend-others-text">Others: 543 seats</span>
                            </div>
                            <div class="legend-item">
                                <div class="legend-color player2-color"></div>
                                <span id="legend-inc-text">INC: 0 seats</span>
                            </div>
                        </div>
                    </div>
                </div>                <div class="game-over-actions">
                    <button id="play-again-btn" class="game-over-btn primary">Play Again</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(this.overlayElement);
        this.setupButtonListeners();
    }
    
    setupEventListeners() {
        // Listen for game timer end
        window.addEventListener('gameTimeUp', () => {
            this.handleGameEnd('timeUp');
        });
        
        // Listen for victory conditions
        window.addEventListener('gameVictory', (event) => {
            this.handleGameEnd('victory', event.detail);
        });
        
        // Listen for parliament status changes to get final results
        window.addEventListener('parliamentStatusChanged', (event) => {
            this.finalResults = event.detail;
        });
    }
      setupButtonListeners() {
        const playAgainBtn = document.getElementById('play-again-btn');
        
        if (playAgainBtn) {
            playAgainBtn.addEventListener('click', () => this.restartGame());
        }
        
        // Allow clicking overlay background to close
        this.overlayElement.addEventListener('click', (event) => {
            if (event.target === this.overlayElement) {
                this.hide();
            }
        });
        
        // ESC key to close
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && this.isVisible) {
                this.hide();
            }
        });
    }
    
    handleGameEnd(reason, victoryDetails = null) {
        console.log('Game ended:', reason, victoryDetails);
        
        // Get final seat counts from seat projection
        const finalResults = this.getFinalResults();
        
        // Determine winner and show results
        this.showResults(finalResults, reason, victoryDetails);
    }
    
    getFinalResults() {
        // Get final seat counts from the seat projection elements
        const p1SeatsElement = document.getElementById('player1-seats');
        const p2SeatsElement = document.getElementById('player2-seats');
        const othersSeatsElement = document.getElementById('others-seats');
        
        const p1Seats = parseInt(p1SeatsElement?.textContent || '0');
        const p2Seats = parseInt(p2SeatsElement?.textContent || '0');
        const othersSeats = parseInt(othersSeatsElement?.textContent || '543');
        
        return {
            player1Seats: p1Seats,
            player2Seats: p2Seats,
            othersSeats: othersSeats,
            totalSeats: 543
        };
    }
      showResults(results, reason, victoryDetails = null) {
        // Update legend with seat counts
        document.getElementById('legend-bjp-text').textContent = `BJP: ${results.player1Seats} seats`;
        document.getElementById('legend-inc-text').textContent = `INC: ${results.player2Seats} seats`;
        document.getElementById('legend-others-text').textContent = `Others: ${results.othersSeats} seats`;
        
        // Determine winner and update text
        this.updateWinnerText(results, reason, victoryDetails);
        
        // Create parliament chart
        this.createParliamentChart(results);
        
        // Show the overlay
        this.show();
    }
      updateWinnerText(results, reason, victoryDetails) {
        const winnerTextEl = document.getElementById('winner-text');
        const winnerDetailsEl = document.getElementById('winner-details');
        const majorityThreshold = 272;
        
        let winnerText = '';
        let detailsText = '';
        
        if (results.player1Seats >= majorityThreshold) {
            winnerText = '🎉 BJP WINS!';
            detailsText = `BJP forms majority government with ${results.player1Seats} seats`;
            winnerTextEl.className = 'winner-text player1-victory';
        } else if (results.player2Seats >= majorityThreshold) {
            winnerText = '🎉 INC WINS!';
            detailsText = `INC forms majority government with ${results.player2Seats} seats`;
            winnerTextEl.className = 'winner-text player2-victory';
        } else {
            winnerText = '🏛️ HUNG PARLIAMENT';
            detailsText = `No party achieved majority (272+ seats)`;
            winnerTextEl.className = 'winner-text hung-parliament';
        }
        
        winnerTextEl.textContent = winnerText;
        winnerDetailsEl.textContent = detailsText;
    }
      createParliamentChart(results) {
        const chartContainer = document.getElementById('parliament-chart');
        
        // Clear previous chart
        chartContainer.innerHTML = '';
        
        // Load and modify the Parliament_diagram.svg
        this.loadParliamentSVG(chartContainer, results);
    }    loadParliamentSVG(container, results) {
        // Load the Parliament_diagram.svg file
        fetch('./Parliament_diagram.svg')
            .then(response => response.text())
            .then(svgText => {
                // Parse the SVG
                const parser = new DOMParser();
                const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');
                const svgElement = svgDoc.querySelector('svg');
                  if (svgElement) {
                    // Fix SVG scaling by adding viewBox if it doesn't exist
                    if (!svgElement.getAttribute('viewBox')) {
                        const width = svgElement.getAttribute('width') || '360';
                        const height = svgElement.getAttribute('height') || '185';
                        svgElement.setAttribute('viewBox', `0 0 ${parseFloat(width)} ${parseFloat(height)}`);
                    }
                    
                    // Remove fixed width/height to allow responsive scaling
                    svgElement.removeAttribute('width');
                    svgElement.removeAttribute('height');
                    
                    // Recolor the seats based on results
                    this.recolorParliamentSeats(svgElement, results);
                    
                    // Add the SVG to the container
                    container.appendChild(svgElement);
                    
                    console.log(`Parliament chart loaded with ${results.player1Seats} BJP, ${results.player2Seats} INC, ${results.othersSeats} Others seats`);
                } else {
                    console.error('Failed to load Parliament SVG');
                    // Fallback to simple text display
                    container.innerHTML = `<div style="color: white; text-align: center; padding: 20px;">
                        BJP: ${results.player1Seats} | INC: ${results.player2Seats} | Others: ${results.othersSeats}
                    </div>`;
                }
            })
            .catch(error => {
                console.error('Error loading Parliament SVG:', error);
                // Fallback to simple text display
                container.innerHTML = `<div style="color: white; text-align: center; padding: 20px;">
                    BJP: ${results.player1Seats} | INC: ${results.player2Seats} | Others: ${results.othersSeats}
                </div>`;
            });
    }

    recolorParliamentSeats(svgElement, results) {
        // Get all circle elements (seats)
        const seats = svgElement.querySelectorAll('circle');
        const totalSeats = seats.length;
        
        console.log(`Found ${totalSeats} seats in Parliament SVG`);
        
        // Define colors for each party
        const colors = {
            bjp: '#FF8C00',      // Bright orange for BJP
            inc: '#32CD32',      // Bright green for INC  
            others: '#D3D3D3'    // Light gray for Others
        };
        
        // Calculate seat distribution
        const { player1Seats, player2Seats, othersSeats } = results;
        
        // Convert seats array to array for easier manipulation
        const seatsArray = Array.from(seats);
        
        // Arrange seats in groups: BJP (left), Others (center), INC (right)
        // This creates a more realistic parliament arrangement
        let seatIndex = 0;
        
        // Color BJP seats (first player1Seats seats)
        for (let i = 0; i < player1Seats && seatIndex < totalSeats; i++, seatIndex++) {
            seatsArray[seatIndex].style.fill = colors.bjp;
        }
        
        // Color Others seats (next othersSeats seats)
        for (let i = 0; i < othersSeats && seatIndex < totalSeats; i++, seatIndex++) {
            seatsArray[seatIndex].style.fill = colors.others;
        }
        
        // Color INC seats (remaining seats)
        for (let i = 0; i < player2Seats && seatIndex < totalSeats; i++, seatIndex++) {
            seatsArray[seatIndex].style.fill = colors.inc;
        }
        
        // Remove the group's fill style to let individual seat colors show
        const group = svgElement.querySelector('g[id="0-Bharatiya-Janata-Party"]');
        if (group) {
            group.style.fill = 'none';
        }
        
        // Add animation to seats
        seatsArray.forEach((seat, index) => {
            seat.style.transition = 'fill 0.3s ease';
            seat.style.animationDelay = `${index * 2}ms`;
        });
    }
      show() {
        if (this.isVisible) return;
        
        this.isVisible = true;
        this.overlayElement.style.display = 'flex';
        
        // Animate in
        requestAnimationFrame(() => {
            this.overlayElement.classList.add('visible');
        });
        
        // Don't pause the timer here - it should already be stopped when game ends
        // The timer's notifyTimeUp() method already stops the timer
        
        // Play game over sound if not already playing
        if (window.soundManager) {
            setTimeout(() => {
                window.soundManager.playGameOver();
            }, 500);
        }
    }
    
    hide() {
        if (!this.isVisible) return;
        
        this.isVisible = false;
        this.overlayElement.classList.remove('visible');
        
        // Wait for animation to complete before hiding
        setTimeout(() => {
            this.overlayElement.style.display = 'none';
        }, 300);
    }    restartGame() {
        // Reload the page to restart the game
        window.location.reload();
    }
}

// Create and export the game over screen instance
export const gameOverScreen = new GameOverScreen();
