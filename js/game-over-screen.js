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
        this.overlayElement.innerHTML = `
            <div class="game-over-container">
                <div class="game-over-header">
                    <h1 class="game-over-title">ELECTION RESULTS</h1>
                    <div class="game-over-subtitle">Final Parliament Composition</div>
                </div>
                  <div class="game-over-content">
                    <div class="results-summary">
                        <div class="winner-announcement">
                            <div class="winner-text" id="winner-text">Calculating Results...</div>
                            <div class="winner-details" id="winner-details"></div>
                        </div>
                    </div>
                    
                    <div class="parliament-chart-container">
                        <h3>Parliament Composition</h3>
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
                </div>
                
                <div class="game-over-actions">
                    <button id="play-again-btn" class="game-over-btn primary">Play Again</button>
                    <button id="close-results-btn" class="game-over-btn secondary">Close</button>
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
        const closeBtn = document.getElementById('close-results-btn');
        
        if (playAgainBtn) {
            playAgainBtn.addEventListener('click', () => this.restartGame());
        }
        
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.hide());
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
            if (results.player1Seats > results.player2Seats) {
                detailsText = `BJP leads with ${results.player1Seats} seats but needs coalition support`;
            } else if (results.player2Seats > results.player1Seats) {
                detailsText = `INC leads with ${results.player2Seats} seats but needs coalition support`;
            } else {
                detailsText = `Perfect tie! Both parties have ${results.player1Seats} seats each`;
            }
            winnerTextEl.className = 'winner-text hung-parliament';
        }
        
        winnerTextEl.textContent = winnerText;
        winnerDetailsEl.textContent = detailsText;
    }
    
    createParliamentChart(results) {
        const chartContainer = document.getElementById('parliament-chart');
        
        // Clear previous chart
        chartContainer.innerHTML = '';
        
        // Create parliament chart using D3.js-like visualization
        this.createSimpleParliamentChart(chartContainer, results);
    }
      createSimpleParliamentChart(container, results) {
        const totalSeats = 543;
        const { player1Seats, player2Seats, othersSeats } = results;
        
        // Create semicircle parliament layout
        const width = 400;
        const height = 250;
        const centerX = width / 2;
        const centerY = height - 20;
        
        // Create SVG
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', width);
        svg.setAttribute('height', height);
        svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
          // Calculate seat positions in semicircle
        const seats = [];
        const rows = 12; // More rows to accommodate all 543 seats
        const maxRadius = 180;
        const minRadius = 40;
        
        // Calculate how many seats per row to fit all 543 seats
        const totalSeatsToPlace = Math.min(totalSeats, 543);
        const baseSeatsPerRow = Math.ceil(totalSeatsToPlace / rows);
        
        let seatIndex = 0;
        for (let row = 0; row < rows && seatIndex < totalSeatsToPlace; row++) {
            const radius = minRadius + (maxRadius - minRadius) * (row / (rows - 1));
            
            // Calculate seats for this row - outer rows have more seats
            const seatsInRow = Math.floor(baseSeatsPerRow * (1 + row * 0.3));
            const actualSeatsInRow = Math.min(seatsInRow, totalSeatsToPlace - seatIndex);
            
            const angleStep = Math.PI / (actualSeatsInRow + 1); // +1 for better spacing
            
            for (let seat = 0; seat < actualSeatsInRow; seat++) {
                const angle = Math.PI - ((seat + 1) * angleStep);
                const x = centerX + radius * Math.cos(angle);
                const y = centerY + radius * Math.sin(angle);
                
                seats.push({ x, y, index: seatIndex });
                seatIndex++;
            }
        }
          // Assign colors to seats in grouped arrangement (like real parliament)
        this.arrangeSeatsInGroups(seats, player1Seats, player2Seats, othersSeats);
        
        console.log(`Parliament chart created with ${seats.length} seats (should be 543)`);
        console.log(`Party distribution: BJP=${player1Seats}, INC=${player2Seats}, Others=${othersSeats}`);
        
        // Draw seats
        seats.forEach(seat => {
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', seat.x);
            circle.setAttribute('cy', seat.y);
            circle.setAttribute('r', '1.8'); // Smaller radius to fit more seats
            circle.setAttribute('fill', seat.color);
            circle.setAttribute('stroke', '#000');
            circle.setAttribute('stroke-width', '0.2');
            circle.setAttribute('opacity', '0.95');
            svg.appendChild(circle);
        });
        
        // Add majority line
        const majorityLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        majorityLine.setAttribute('x1', centerX);
        majorityLine.setAttribute('y1', centerY);
        majorityLine.setAttribute('x2', centerX);
        majorityLine.setAttribute('y2', centerY - maxRadius);
        majorityLine.setAttribute('stroke', '#fff');
        majorityLine.setAttribute('stroke-width', '2');
        majorityLine.setAttribute('stroke-dasharray', '5,5');
        majorityLine.setAttribute('opacity', '0.5');
        svg.appendChild(majorityLine);
        
        // Add majority text
        const majorityText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        majorityText.setAttribute('x', centerX + 10);
        majorityText.setAttribute('y', centerY - maxRadius + 10);
        majorityText.setAttribute('fill', '#fff');
        majorityText.setAttribute('font-size', '12');
        majorityText.setAttribute('font-family', 'Arial, sans-serif');
        majorityText.textContent = '272 majority';
        svg.appendChild(majorityText);
        
        container.appendChild(svg);
    }    arrangeSeatsInGroups(seats, p1Count, p2Count, othersCount) {
        // Sort seats by their angle position (left to right in semicircle)
        // Calculate angle for each seat for sorting
        const centerX = 200; // width / 2
        const centerY = 230; // height - 20
        
        seats.forEach(seat => {
            seat.angle = Math.atan2(seat.y - centerY, seat.x - centerX);
        });
        
        // Sort seats from left to right (negative angle to positive angle)
        seats.sort((a, b) => a.angle - b.angle);
        
        // Assign colors in groups: BJP (left), Others (center), INC (right)
        // This creates a more realistic parliament arrangement
        for (let i = 0; i < seats.length; i++) {
            if (i < p1Count) {
                seats[i].color = '#FF8C00'; // Bright orange for BJP
            } else if (i < p1Count + othersCount) {
                seats[i].color = '#D3D3D3'; // Light gray for Others
            } else {
                seats[i].color = '#32CD32'; // Bright green for INC
            }
        }
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
    }
    
    restartGame() {
        // Reload the page to restart the game
        window.location.reload();
    }
}

// Create and export the game over screen instance
export const gameOverScreen = new GameOverScreen();
