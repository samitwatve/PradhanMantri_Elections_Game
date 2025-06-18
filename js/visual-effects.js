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
  }
  injectSvgStyles() {
    if (!this.svgDocument) return;
    const style = this.svgDocument.createElementNS(
      "http://www.w3.org/2000/svg",
      "style",
    );
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
            
            .home-state-star {
                pointer-events: none;
                z-index: 1000;
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

    const svgElement = this.svgDocument.querySelector("svg");
    if (svgElement) {
      svgElement.insertBefore(style, svgElement.firstChild);
    }
  }

  createRippleContainer() {
    if (!this.svgDocument) return;

    const svgElement = this.svgDocument.querySelector("svg");
    if (!svgElement) return;

    this.rippleContainer = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "g",
    );
    this.rippleContainer.setAttribute("class", "ripple-container");
    svgElement.appendChild(this.rippleContainer);
  }

  createRippleEffect(x, y, playerId) {
    if (!this.rippleContainer) return;

    const ripple = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "circle",
    );
    ripple.setAttribute("class", `ripple player${playerId}`);
    ripple.setAttribute("cx", x);
    ripple.setAttribute("cy", y);
    ripple.setAttribute("r", "10");

    // Set color based on player
    if (playerId === 1) {
      ripple.setAttribute(
        "fill",
        getComputedStyle(document.documentElement)
          .getPropertyValue("--player1-color")
          .trim(),
      );
    } else {
      ripple.setAttribute(
        "fill",
        getComputedStyle(document.documentElement)
          .getPropertyValue("--player2-color")
          .trim(),
      );
    }

    // Add animations
    const animation = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "animate",
    );
    animation.setAttribute("attributeName", "r");
    animation.setAttribute("from", "10");
    animation.setAttribute("to", "50");
    animation.setAttribute("dur", "0.6s");
    animation.setAttribute("fill", "freeze");

    const opacityAnimation = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "animate",
    );
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

  // Create event effect for random events
  createEventEffect(x, y, color, isPositive) {
    if (!this.rippleContainer) return;

    // Create event effect element
    const eventEffect = this.svgDocument.createElementNS(
      "http://www.w3.org/2000/svg",
      "g",
    );
    eventEffect.setAttribute("class", "event-effect");

    // Create outer ring
    const outerRing = this.svgDocument.createElementNS(
      "http://www.w3.org/2000/svg",
      "circle",
    );
    outerRing.setAttribute("cx", x);
    outerRing.setAttribute("cy", y);
    outerRing.setAttribute("r", "5");
    outerRing.setAttribute("fill", "none");
    outerRing.setAttribute("stroke", color);
    outerRing.setAttribute("stroke-width", "3");
    outerRing.setAttribute("opacity", "0.8");

    // Create inner circle
    const innerCircle = this.svgDocument.createElementNS(
      "http://www.w3.org/2000/svg",
      "circle",
    );
    innerCircle.setAttribute("cx", x);
    innerCircle.setAttribute("cy", y);
    innerCircle.setAttribute("r", "2");
    innerCircle.setAttribute("fill", color);
    innerCircle.setAttribute("opacity", "0.9");

    // Create event symbol (+ for positive, - for negative)
    const symbol = this.svgDocument.createElementNS(
      "http://www.w3.org/2000/svg",
      "text",
    );
    symbol.setAttribute("x", x);
    symbol.setAttribute("y", y + 2);
    symbol.setAttribute("text-anchor", "middle");
    symbol.setAttribute("font-family", "Arial, sans-serif");
    symbol.setAttribute("font-size", "8");
    symbol.setAttribute("font-weight", "bold");
    symbol.setAttribute("fill", "white");
    symbol.textContent = isPositive ? "+" : "−";

    eventEffect.appendChild(outerRing);
    eventEffect.appendChild(innerCircle);
    eventEffect.appendChild(symbol);
    this.rippleContainer.appendChild(eventEffect);

    // Animate the effect
    const animation = this.svgDocument.createElementNS(
      "http://www.w3.org/2000/svg",
      "animateTransform",
    );
    animation.setAttribute("attributeName", "transform");
    animation.setAttribute("type", "scale");
    animation.setAttribute("values", "1;3;1");
    animation.setAttribute("dur", "2s");
    animation.setAttribute("repeatCount", "2");

    const fadeAnimation = this.svgDocument.createElementNS(
      "http://www.w3.org/2000/svg",
      "animate",
    );
    fadeAnimation.setAttribute("attributeName", "opacity");
    fadeAnimation.setAttribute("values", "0.8;1;0.8;0");
    fadeAnimation.setAttribute("dur", "4s");
    fadeAnimation.setAttribute("repeatCount", "1");

    eventEffect.appendChild(animation);
    eventEffect.appendChild(fadeAnimation);

    // Remove after animation
    setTimeout(() => {
      if (eventEffect.parentNode) {
        eventEffect.parentNode.removeChild(eventEffect);
      }
    }, 4000);
  }

  toggleStateHighlight(
    stateId,
    forceState = null,
    forceOff = false,
    highlightType = "default",
  ) {
    if (!this.svgDocument) return;

    const statePath = this.svgDocument.getElementById(stateId);
    if (!statePath) return;

    // Force off takes precedence
    if (forceOff) {
      this.highlightedStates.delete(stateId);
      this.clearStateHighlight(statePath);
      return;
    }

    const shouldHighlight =
      forceState !== null ? forceState : !this.highlightedStates.has(stateId);

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
      case "leading":
        statePath.style.stroke = "#ffffff";
        statePath.style.strokeWidth = "3";
        statePath.style.filter = "drop-shadow(0 0 5px rgba(76, 175, 80, 0.8))";
        statePath.classList.remove("shimmer-missing");
        break;
      case "missing":
        statePath.style.stroke = "#ffffff";
        statePath.style.strokeWidth = "3";
        statePath.style.filter = "drop-shadow(0 0 8px rgba(255, 107, 53, 0.9))";
        if (!statePath.classList.contains("shimmer-missing")) {
          statePath.classList.add("shimmer-missing");
        }
        break;
      default:
        statePath.style.stroke = "#ffffff";
        statePath.style.strokeWidth = "3";
        statePath.style.filter =
          "drop-shadow(0 0 3px rgba(255, 255, 255, 0.7))";
        statePath.classList.remove("shimmer-missing");
        break;
    }
  }

  clearStateHighlight(statePath) {
    statePath.style.stroke = "";
    statePath.style.strokeWidth = "";
    statePath.style.filter = "";
    statePath.classList.remove("shimmer-missing");
  }

  showErrorFeedback(stateElement) {
    stateElement.classList.add("error");
    setTimeout(() => stateElement.classList.remove("error"), 500);
  }
  showHomeStateIndicator(stateElement) {
    if (!stateElement || !this.svgDocument) return;

    // Create a glow effect for the home state
    stateElement.classList.add("home-state");

    // Add animation to make it pulse
    const animation = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "animate",
    );
    animation.setAttribute("attributeName", "filter");
    animation.setAttribute(
      "values",
      "drop-shadow(0 0 5px gold) brightness(1.1); drop-shadow(0 0 10px gold) brightness(1.3); drop-shadow(0 0 5px gold) brightness(1.1)",
    );
    animation.setAttribute("dur", "2s");
    animation.setAttribute("repeatCount", "2");
    stateElement.appendChild(animation);

    // Restore state to normal after highlight
    setTimeout(() => {
      stateElement.classList.remove("home-state");
    }, 2000);
  }

  addPermanentHomeStateIndicator(stateId, playerId) {
    if (!this.svgDocument) return;

    const stateElement = this.svgDocument.getElementById(stateId);
    if (!stateElement) return;

    // Check if the star already exists to avoid duplicates
    const existingStars = this.svgDocument.querySelectorAll(
      `.home-state-star-${stateId}-p${playerId}`,
    );
    if (existingStars.length > 0) return; // Star already exists

    // Calculate position for the star
    const bbox = stateElement.getBBox();
    const iconX = bbox.x + bbox.width / 2;
    const iconY = bbox.y + bbox.height / 2;

    // Create the star icon
    const homeIcon = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "text",
    );
    homeIcon.setAttribute("x", iconX);
    homeIcon.setAttribute("y", iconY);
    homeIcon.setAttribute("text-anchor", "middle");
    homeIcon.setAttribute("dominant-baseline", "middle");
    homeIcon.setAttribute("font-family", "Arial");
    homeIcon.setAttribute("font-size", "15");
    homeIcon.setAttribute(
      "class",
      `home-state-star home-state-star-${stateId}-p${playerId}`,
    );
    homeIcon.textContent = "★"; // Star symbol for home state

    // Set color based on player
    if (playerId === 1) {
      homeIcon.setAttribute("fill", "orange");
      homeIcon.setAttribute("stroke", "#000");
      homeIcon.setAttribute("filter", "drop-shadow(0 0 3px gold)");
    } else {
      homeIcon.setAttribute("fill", "green");
      homeIcon.setAttribute("stroke", "#000");
      homeIcon.setAttribute("filter", "drop-shadow(0 0 3px lightgreen)");
    }

    homeIcon.setAttribute("stroke-width", "0.5");
    homeIcon.setAttribute("pointer-events", "none"); // Make sure it doesn't interfere with clicks

    // Add the icon to the SVG
    const svgElement = this.svgDocument.querySelector("svg");
    if (svgElement) {
      svgElement.appendChild(homeIcon);
    }
  }

  // Remove a permanent home state indicator
  removePermanentHomeStateIndicator(stateId, playerId) {
    if (!this.svgDocument) return;

    const existingStars = this.svgDocument.querySelectorAll(
      `.home-state-star-${stateId}-p${playerId}`,
    );
    existingStars.forEach((star) => {
      star.parentNode.removeChild(star);
    });
  }

  // Add permanent home state indicators for all home states
  addAllHomeStateIndicators() {
    if (!this.svgDocument) return;

    import("./home-state-bonus.js").then(({ homeStateBonus }) => {
      import("./state-info.js").then(({ stateInfo }) => {
        // Make sure home state bonus is initialized
        homeStateBonus.initialize().then(() => {
          // Process all states
          const states = this.svgDocument.querySelectorAll("path");
          states.forEach((state) => {
            if (!state.id) return;

            // Find the state data
            const stateData = stateInfo.statesData.find(
              (data) => data.SvgId === state.id,
            );
            if (!stateData) return;

            // Check if this is a home state for either player
            const isP1HomeState = homeStateBonus.isHomeState(
              1,
              stateData.State,
            );
            const isP2HomeState = homeStateBonus.isHomeState(
              2,
              stateData.State,
            );

            // Add permanent indicators
            if (isP1HomeState) {
              this.addPermanentHomeStateIndicator(state.id, 1);
            }

            if (isP2HomeState) {
              this.addPermanentHomeStateIndicator(state.id, 2);
            }
          });
        });
      });
    });
  }
}

export const visualEffects = new VisualEffects();
