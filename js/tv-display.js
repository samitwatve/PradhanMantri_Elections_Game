// TV Display functionality
class TVDisplay {
    constructor() {
        this.tvScreen = document.querySelector('.tv-screen');
        this.tvText = document.querySelector('.tv-text');
        this.messages = [
            "Welcome to Election Coverage",
            "Exit polls predict close race",
            "Voter turnout at 65% nationwide",
            "Key battleground states still counting",
            "Campaign rallies draw record crowds",
            "Political analysts predict swing in south",
            "First-time voters make significant impact",
            "Rural areas show strong participation"
        ];
        this.currentMessageIndex = 0;
        this.initialize();
    }

    initialize() {
        // Start the message rotation
        this.startMessageRotation();
        
        // Add click event for the TV buttons
        const tvButtons = document.querySelectorAll('.tv-button');
        tvButtons.forEach((button, index) => {
            button.addEventListener('click', () => this.handleTVButtonClick(index));
        });
    }

    startMessageRotation() {
        // Change message every 5 seconds
        setInterval(() => {
            this.currentMessageIndex = (this.currentMessageIndex + 1) % this.messages.length;
            this.updateTVDisplay();
        }, 5000);
    }

    updateTVDisplay() {
        // Create a "typing" effect for new messages
        const message = this.messages[this.currentMessageIndex];
        this.tvText.textContent = "";
        
        let charIndex = 0;
        const typeInterval = setInterval(() => {
            if (charIndex < message.length) {
                this.tvText.textContent += message.charAt(charIndex);
                charIndex++;
            } else {
                clearInterval(typeInterval);
            }
        }, 50);
    }

    handleTVButtonClick(buttonIndex) {
        // First button: toggle channel (change message)
        if (buttonIndex === 0) {
            this.currentMessageIndex = (this.currentMessageIndex + 1) % this.messages.length;
            this.updateTVDisplay();
        } 
        // Second button: static effect
        else if (buttonIndex === 1) {
            this.showStaticEffect();
        }
    }

    showStaticEffect() {
        const originalContent = this.tvText.textContent;
        this.tvScreen.classList.add('static-effect');
        this.tvText.textContent = "NO SIGNAL";
        
        // Return to normal after a short time
        setTimeout(() => {
            this.tvScreen.classList.remove('static-effect');
            this.tvText.textContent = originalContent;
        }, 1500);
    }

    // Add a method to add new messages from game events
    addNewsUpdate(message) {
        this.messages.push(message);
        // Show the new message immediately
        this.currentMessageIndex = this.messages.length - 1;
        this.updateTVDisplay();
    }
}

// Initialize the TV display when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.tvDisplay = new TVDisplay();
});

export default TVDisplay;
