// Color Utilities
// Handles state color calculations and updates

class ColorUtils {
  // Convert hex color to RGB with intensity
  static hexToRgbWithIntensity(hexColor, intensity) {
    const hex = hexColor.replace("#", "");

    if (!/^[0-9A-Fa-f]{6}$/.test(hex)) {
      return "rgb(153, 153, 153)"; // Grey fallback
    }

    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    const normalizedIntensity = Math.max(0.3, Math.min(1, intensity / 100));

    // Blend with white for lighter colors
    const lightR = Math.round(r + (255 - r) * (1 - normalizedIntensity));
    const lightG = Math.round(g + (255 - g) * (1 - normalizedIntensity));
    const lightB = Math.round(b + (255 - b) * (1 - normalizedIntensity));

    return `rgb(${lightR}, ${lightG}, ${lightB})`;
  }

  // Calculate state color based on popularity data
  static getStateColor(popularityData, player1Color, player2Color) {
    const {
      player1: p1Pop = 0,
      player2: p2Pop = 0,
      others = 0,
    } = popularityData;
    const roundedP1 = Math.round(p1Pop);
    const roundedP2 = Math.round(p2Pop);
    const roundedOthers = Math.round(others);

    let leader = "others";
    if (roundedP1 > roundedP2 && roundedP1 > roundedOthers) {
      leader = "player1";
    } else if (roundedP2 > roundedP1 && roundedP2 > roundedOthers) {
      leader = "player2";
    }

    let color;
    if (leader === "player1") {
      const intensity = Math.max(30, Math.min(100, roundedP1));
      const primaryColor = player1Color || "#FF9933";
      color = this.hexToRgbWithIntensity(primaryColor, intensity);
    } else if (leader === "player2") {
      const intensity = Math.max(30, Math.min(100, roundedP2));
      const primaryColor = player2Color || "#138808";
      color = this.hexToRgbWithIntensity(primaryColor, intensity);
    } else {
      const intensity = Math.max(30, Math.min(100, roundedOthers));
      const normalizedIntensity = intensity / 100;
      const colorValue = Math.round(
        112 + (224 - 112) * (1 - normalizedIntensity),
      );
      color = `rgb(${colorValue}, ${colorValue}, ${colorValue})`;
    }

    return { color, leader };
  }

  // Update UT button color based on popularity
  static updateUTButtonColor(stateId, popularity) {
    const button = document.querySelector(
      `.small-uts-grid button[data-ut="${stateId}"]`,
    );
    if (!button) return;

    const roundedP1 = Math.round(popularity.player1);
    const roundedP2 = Math.round(popularity.player2);
    const roundedOthers = Math.round(popularity.others);

    let leader = "others";
    if (roundedP1 > roundedP2 && roundedP1 > roundedOthers) {
      leader = "player1";
    } else if (roundedP2 > roundedP1 && roundedP2 > roundedOthers) {
      leader = "player2";
    }

    button.setAttribute("data-leading", leader);
  }
}

export { ColorUtils };
