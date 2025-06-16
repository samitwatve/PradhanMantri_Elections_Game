// Visual Effects Utility
// Handles ripple effects, state highlighting, and visual feedback

class VisualEffects {
    constructor() {
        this.svgDocument = null;
        this.rippleContainer = null;
        this.highlightedStates = new Set();
    }

    setSvgDocument(svgDocument) {
        this.svgDocument = svgDocument;
        this.createRippleContainer();
        this.injectSvgStyles();
    }    injectSvgStyles() {
        if (!this.svgDocument) return;

        const style = this.svgDocument.createElementNS("http://www.w3.org/2000/svg", "style");
        style.textContent = `
            path, polygon {
                cursor: pointer !important;
                pointer-events: all !important;
            }
            
            path.error {
                fill: #ff0000;
                animation: shake 0.5s;
            }
            
            .shimmer-missing {
                animation: shimmer 2s infinite;
            }
            
            .home-state {
                filter: drop-shadow(0 0 5px gold) brightness(1.1);
            }
            
            .home-state-icon {
                pointer-events: none;
                filter: drop-shadow(0 0 3px gold);
            }
            
            @keyframes shake {
                0%, 100% { transform: translateX(0); }
                25% { transform: translateX(-5px); }
                75% { transform: translateX(5px); }
            }
            
            @keyframes shimmer {
                0% { 
                    filter: drop-shadow(0 0 8px rgba(255, 107, 53, 0.9)) brightness(1);
                }
                50% { 
                    filter: drop-shadow(0 0 15px rgba(255, 107, 53, 1)) brightness(1.3);
                }
                100% { 
                    filter: drop-shadow(0 0 8px rgba(255, 107, 53, 0.9)) brightness(1);
                }
            }
        `;

        const svgElement = this.svgDocument.querySelector('svg');
        if (svgElement) {
            svgElement.insertBefore(style, svgElement.firstChild);
        }
    }

    createRippleContainer() {
        if (!this.svgDocument) return;
        
        const svgElement = this.svgDocument.querySelector('svg');
        if (!svgElement) return;
        
        this.rippleContainer = document.createElementNS("http://www.w3.org/2000/svg", "g");
        this.rippleContainer.setAttribute("class", "ripple-container");
        svgElement.appendChild(this.rippleContainer);
    }
    
    createRippleEffect(x, y, playerId) {
        if (!this.rippleContainer) return;

        const ripple = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        ripple.setAttribute("class", `ripple player${playerId}`);
        ripple.setAttribute("cx", x);
        ripple.setAttribute("cy", y);
        ripple.setAttribute("r", "10");
        
        // Set color based on player
        if (playerId === 1) {
            ripple.setAttribute("fill", getComputedStyle(document.documentElement).getPropertyValue('--player1-color').trim());
        } else {
            ripple.setAttribute("fill", getComputedStyle(document.documentElement).getPropertyValue('--player2-color').trim());
        }
        
        // Add animations
        const animation = document.createElementNS("http://www.w3.org/2000/svg", "animate");
        animation.setAttribute("attributeName", "r");
        animation.setAttribute("from", "10");
        animation.setAttribute("to", "50");
        animation.setAttribute("dur", "0.6s");
        animation.setAttribute("fill", "freeze");
        
        const opacityAnimation = document.createElementNS("http://www.w3.org/2000/svg", "animate");
        opacityAnimation.setAttribute("attributeName", "opacity");
        opacityAnimation.setAttribute("from", "0.6");
        opacityAnimation.setAttribute("to", "0");
        opacityAnimation.setAttribute("dur", "0.6s");
        opacityAnimation.setAttribute("fill", "freeze");
        
        ripple.appendChild(animation);
        ripple.appendChild(opacityAnimation);
        this.rippleContainer.appendChild(ripple);
        
        // Start animations
        animation.beginElement();
        opacityAnimation.beginElement();
        
        // Clean up after animation
        setTimeout(() => {
            if (this.rippleContainer && this.rippleContainer.contains(ripple)) {
                this.rippleContainer.removeChild(ripple);
            }
        }, 600);
    }

    toggleStateHighlight(stateId, forceState = null, forceOff = false, highlightType = 'default') {
        if (!this.svgDocument) return;

        const statePath = this.svgDocument.getElementById(stateId);
        if (!statePath) return;

        // Force off takes precedence
        if (forceOff) {
            this.highlightedStates.delete(stateId);
            this.clearStateHighlight(statePath);
            return;
        }

        const shouldHighlight = forceState !== null ? forceState : !this.highlightedStates.has(stateId);

        if (shouldHighlight) {
            this.highlightedStates.add(stateId);
            this.applyStateHighlight(statePath, highlightType);
        } else {
            this.highlightedStates.delete(stateId);
            this.clearStateHighlight(statePath);
        }
    }

    applyStateHighlight(statePath, highlightType) {
        switch (highlightType) {
            case 'leading':
                statePath.style.stroke = '#ffffff';
                statePath.style.strokeWidth = '3';
                statePath.style.filter = 'drop-shadow(0 0 5px rgba(76, 175, 80, 0.8))';
                statePath.classList.remove('shimmer-missing');
                break;
            case 'missing':
                statePath.style.stroke = '#ffffff';
                statePath.style.strokeWidth = '3';
                statePath.style.filter = 'drop-shadow(0 0 8px rgba(255, 107, 53, 0.9))';
                if (!statePath.classList.contains('shimmer-missing')) {
                    statePath.classList.add('shimmer-missing');
                }
                break;
            default:
                statePath.style.stroke = '#ffffff';
                statePath.style.strokeWidth = '3';
                statePath.style.filter = 'drop-shadow(0 0 3px rgba(255, 255, 255, 0.7))';
                statePath.classList.remove('shimmer-missing');
                break;
        }
    }

    clearStateHighlight(statePath) {
        statePath.style.stroke = '';
        statePath.style.strokeWidth = '';
        statePath.style.filter = '';
        statePath.classList.remove('shimmer-missing');
    }

    showErrorFeedback(stateElement) {
        stateElement.classList.add('error');
        setTimeout(() => stateElement.classList.remove('error'), 500);
    }

    showHomeStateIndicator(stateElement) {
        if (!stateElement || !this.svgDocument) return;
        
        // Create a glow effect for the home state
        stateElement.classList.add('home-state');
        
        // Add animation to make it pulse
        const animation = document.createElementNS("http://www.w3.org/2000/svg", "animate");
        animation.setAttribute("attributeName", "filter");
        animation.setAttribute("values", "drop-shadow(0 0 5px gold) brightness(1.1); drop-shadow(0 0 10px gold) brightness(1.3); drop-shadow(0 0 5px gold) brightness(1.1)");
        animation.setAttribute("dur", "2s");
        animation.setAttribute("repeatCount", "2");
        stateElement.appendChild(animation);
        
        // Add a crown icon or star symbol to indicate home state
        const bbox = stateElement.getBBox();
        const iconX = bbox.x + bbox.width / 2;
        const iconY = bbox.y + bbox.height / 2;
        
        const homeIcon = document.createElementNS("http://www.w3.org/2000/svg", "text");
        homeIcon.setAttribute("x", iconX);
        homeIcon.setAttribute("y", iconY);
        homeIcon.setAttribute("text-anchor", "middle");
        homeIcon.setAttribute("dominant-baseline", "middle");
        homeIcon.setAttribute("font-family", "Arial");
        homeIcon.setAttribute("font-size", "15");
        homeIcon.setAttribute("fill", "gold");
        homeIcon.setAttribute("stroke", "black");
        homeIcon.setAttribute("stroke-width", "0.5");
        homeIcon.setAttribute("class", "home-state-icon");
        homeIcon.textContent = "★"; // Star symbol for home state
        
        // Add a glow effect to the icon
        homeIcon.setAttribute("filter", "drop-shadow(0 0 2px gold)");
        
        // Animate the icon opacity for a brief highlight
        const opacityAnimation = document.createElementNS("http://www.w3.org/2000/svg", "animate");
        opacityAnimation.setAttribute("attributeName", "opacity");
        opacityAnimation.setAttribute("values", "0;1;1;0");
        opacityAnimation.setAttribute("keyTimes", "0;0.1;0.9;1");
        opacityAnimation.setAttribute("dur", "3s");
        opacityAnimation.setAttribute("fill", "remove");
        homeIcon.appendChild(opacityAnimation);
        
        // Add the icon to the SVG
        const svgElement = this.svgDocument.querySelector('svg');
        if (svgElement) {
            svgElement.appendChild(homeIcon);
            
            // Remove the icon after animation
            setTimeout(() => {
                if (svgElement.contains(homeIcon)) {
                    svgElement.removeChild(homeIcon);
                }
            }, 3000);
        }
        
        // Restore state to normal after highlight
        setTimeout(() => {
            stateElement.classList.remove('home-state');
        }, 2000);
    }
}

export const visualEffects = new VisualEffects();
