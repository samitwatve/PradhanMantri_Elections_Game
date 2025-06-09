// Object to store progress for each policy and player
const policyProgress = {
    social: Array(4).fill({ player1: 0, player2: 0, completed: false }),
    justice: Array(4).fill({ player1: 0, player2: 0, completed: false }),
    infra: Array(4).fill({ player1: 0, player2: 0, completed: false }),
    economic: Array(4).fill({ player1: 0, player2: 0, completed: false }),
    agri: Array(4).fill({ player1: 0, player2: 0, completed: false }),
    health: Array(4).fill({ player1: 0, player2: 0, completed: false })
};

// Fix the initialization issue - Arrays are filled with references to the same object
Object.keys(policyProgress).forEach(category => {
    policyProgress[category] = Array(4).fill(0).map(() => ({ player1: 0, player2: 0, completed: false }));
});

// Import player information
import { player1, player2 } from './player-info.js';

// Constants
const CAMPAIGN_CLICK_COST = 10; // 10M per click
const CAMPAIGN_MAX_COST = 100; // 100M total cost
const CAMPAIGN_COMPLETION_BONUS = 15; // 15M bonus for completing a campaign
const CAMPAIGN_MAX_CLICKS = 10; // 10 clicks to complete (100M total)

// Function to update progress bar
function updateProgressBar(category, index) {
    const progressBar = document.getElementById(`${category}-${index + 1}`);
    const policy = policyProgress[category][index];
    const player1Progress = policy.player1;
    const player2Progress = policy.player2;
    
    // Calculate total progress (combined from both players)
    const totalProgress = Math.min(100, player1Progress + player2Progress);
    
    if (progressBar) {
        // Update progress width
        progressBar.style.width = `${totalProgress}%`;
        
        // Determine which player has contributed more
        if (player1Progress > player2Progress) {
            progressBar.className = 'progress-fill player1';
        } else if (player2Progress > player1Progress) {
            progressBar.className = 'progress-fill player2';
        } else if (player1Progress > 0) {
            // Equal non-zero contributions
            progressBar.className = 'progress-fill player1';
        }
        
        // Add complete class if fully funded
        if (totalProgress === 100) {
            progressBar.classList.add('complete');
        } else {
            progressBar.classList.remove('complete');
        }
    }
}

// Function to update all progress bars
function updateAllProgressBars() {
    Object.entries(policyProgress).forEach(([category, policies]) => {
        policies.forEach((policy, index) => {
            updateProgressBar(category, index);
        });
    });
    updateProgressItemUI();
}

// Function to increment progress for a specific policy
function incrementPolicy(category, index, playerId) {
    const policy = policyProgress[category][index];
    const player = playerId === 1 ? player1 : player2;
    
    // Check if campaign is already completed
    if (policy.player1 + policy.player2 >= 100) {
        console.log(`Campaign ${category}-${index + 1} is already completed`);
        return false;
    }
    
    // Check if player has enough funds
    if (!player.canSpend(CAMPAIGN_CLICK_COST)) {
        player.showInsufficientFundsError();
        return false;
    }
    
    // Spend funds
    player.updateFunds(-CAMPAIGN_CLICK_COST);
    
    // Increment player's contribution
    if (playerId === 1) {
        policy.player1 = Math.min(100, policy.player1 + 10);
    } else {
        policy.player2 = Math.min(100, policy.player2 + 10);
    }
      // Update the progress bar
    updateProgressBar(category, index);
    updateProgressItemUI();
    
    // Check if campaign is now completed
    if (policy.player1 + policy.player2 >= 100 && !policy.completed) {
        policy.completed = true;
        
        // Award completion bonus to the player who contributed more
        const dominantPlayer = policy.player1 > policy.player2 ? 1 : 2;
        const dominantPlayerObj = dominantPlayer === 1 ? player1 : player2;
          // Award one-time bonus
        dominantPlayerObj.updateFunds(CAMPAIGN_COMPLETION_BONUS);
        
        // Show completion notification
        showCampaignCompletionNotification(category, index, dominantPlayer);
        
        // Log completion
        console.log(`Campaign ${category}-${index + 1} completed! Player ${dominantPlayer} awarded ${CAMPAIGN_COMPLETION_BONUS}M bonus.`);
        
        // Record that this policy is now eligible for phase bonuses
        if (!window.completedPolicies) {
            window.completedPolicies = [];
        }
        window.completedPolicies.push({
            category,
            index,
            dominantPlayer
        });
        
        // Show completion notification
        showCampaignCompletionNotification(category, index, dominantPlayer);
    }
    
    // Log action
    console.log(`Player ${playerId} contributed ${CAMPAIGN_CLICK_COST}M to ${category}-${index + 1}`);
    return true;
}

// Function to show campaign completion notification
function showCampaignCompletionNotification(category, index, playerId) {
    const progressId = `${category}-${index + 1}`;
    const progressItem = document.getElementById(progressId).closest('.progress-item');
    const policyLabel = progressItem.querySelector('.progress-item-label').textContent;
    
    // Add news update to TV display
    const playerName = playerId === 1 ? "BJP" : "INC";
    window.tvDisplay.addNewsUpdate(`🎉 ${playerName} completes ${policyLabel}! +${CAMPAIGN_COMPLETION_BONUS}M`);
}

// Function to show phase bonus notification
function showPhaseBonusNotification(playerId, amount, completedCount) {
    // Add news update to TV display
    const playerName = playerId === 1 ? "BJP" : "INC";
    const totalBonus = amount * completedCount;
    window.tvDisplay.addNewsUpdate(`💰 Phase Bonus: ${playerName} gains +${totalBonus}M for ${completedCount} campaigns`);
}

// Function to award phase bonuses for completed policies
function awardPhaseCompletionBonuses() {
    if (!window.completedPolicies) return;
    
    // Group by player
    const player1Policies = window.completedPolicies.filter(p => p.dominantPlayer === 1);
    const player2Policies = window.completedPolicies.filter(p => p.dominantPlayer === 2);
    
    // Award bonuses for player 1
    if (player1Policies.length > 0) {
        const totalBonus = CAMPAIGN_COMPLETION_BONUS * player1Policies.length;
        player1.updateFunds(totalBonus);
        showPhaseBonusNotification(1, CAMPAIGN_COMPLETION_BONUS, player1Policies.length);
        console.log(`Phase bonus: Player 1 awarded ${totalBonus}M for ${player1Policies.length} completed policies`);
    }
    
    // Award bonuses for player 2
    if (player2Policies.length > 0) {
        const totalBonus = CAMPAIGN_COMPLETION_BONUS * player2Policies.length;
        player2.updateFunds(totalBonus);
        showPhaseBonusNotification(2, CAMPAIGN_COMPLETION_BONUS, player2Policies.length);
        console.log(`Phase bonus: Player 2 awarded ${totalBonus}M for ${player2Policies.length} completed policies`);
    }
}

// Add contribution indicators to progress items
function updateProgressItemUI() {
    Object.entries(policyProgress).forEach(([category, policies]) => {
        policies.forEach((policy, index) => {
            const progressId = `${category}-${index + 1}`;
            const progressItem = document.getElementById(progressId).closest('.progress-item');
            
            // Remove any existing contribution info
            const existingInfo = progressItem.querySelector('.contribution-info');
            if (existingInfo) {
                progressItem.removeChild(existingInfo);
            }
            
            // Add or remove completed class
            if (policy.completed) {
                progressItem.classList.add('completed');
            } else {
                progressItem.classList.remove('completed');
            }
        });
    });
}

// Initialize progress bars when the page loads
document.addEventListener('DOMContentLoaded', () => {
    updateAllProgressBars();
    
    // Add click handlers to all progress items
    document.querySelectorAll('.progress-item').forEach((item, idx) => {
        // Get category and index
        const categoryMatch = item.querySelector('.progress-fill').id.match(/^([a-z]+)-(\d+)$/);
        if (categoryMatch) {
            const category = categoryMatch[1];
            const index = parseInt(categoryMatch[2]) - 1;
              // Add click handler
            item.addEventListener('click', (e) => {
                // Determine which player clicked based on keyboard modifiers
                // Shift key = Player 2, otherwise Player 1
                const playerId = e.shiftKey ? 2 : 1;
                incrementPolicy(category, index, playerId);
            });
        }
    });
    
    // Listen for phase changes to award bonuses
    window.addEventListener('gamePhaseChanged', awardPhaseCompletionBonuses);
});

// Export functions for use in other modules
window.policyProgress = policyProgress;
window.incrementPolicy = incrementPolicy;
window.updateAllProgressBars = updateAllProgressBars;
