// Object to store progress for each policy
const policyProgress = {
    social: Array(4).fill(0),
    justice: Array(4).fill(0),
    infra: Array(4).fill(0),
    economic: Array(4).fill(0),
    agri: Array(4).fill(0),
    health: Array(4).fill(0)
};

// Function to update progress bar
function updateProgressBar(category, index, progress) {
    const progressBar = document.getElementById(`${category}-${index + 1}`);
    if (progressBar) {
        progressBar.style.width = `${progress}%`;
        if (progress === 100) {
            progressBar.classList.add('complete');
        } else {
            progressBar.classList.remove('complete');
        }
    }
}

// Function to update all progress bars
function updateAllProgressBars() {
    Object.entries(policyProgress).forEach(([category, progresses]) => {
        progresses.forEach((progress, index) => {
            updateProgressBar(category, index, progress);
        });
    });
}

// Function to increment progress for a specific policy
function incrementPolicy(category, index, amount = 10) {
    if (policyProgress[category]) {
        policyProgress[category][index] = Math.min(100, policyProgress[category][index] + amount);
        updateProgressBar(category, index, policyProgress[category][index]);
    }
}

// Example usage:
// incrementPolicy('social', 0, 20); // Increments Hindutva by 20%
// incrementPolicy('economic', 2, 30); // Increments Digital India by 30%

// Initialize progress bars when the page loads
document.addEventListener('DOMContentLoaded', updateAllProgressBars);

// Export functions for use in other modules
window.policyProgress = policyProgress;
window.incrementPolicy = incrementPolicy;
window.updateAllProgressBars = updateAllProgressBars;
