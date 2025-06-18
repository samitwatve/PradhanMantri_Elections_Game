// Sound effects management system
class SoundManager {
  constructor() {
    // Initialize sound objects
    this.sounds = {
      cashAdded: new Audio("sounds/cash_added.mp3"),
      gameOver: new Audio("sounds/game_over.mp3"),
      invalidAction: new Audio("sounds/invalid_action.mp3"),
      moneySpent: new Audio("sounds/money_spent.mp3"),
      phaseReset: new Audio("sounds/phase_reset.mp3"),
      fanfare: new Audio("sounds/fanfare.mp3"),
    };

    // Initialize background music
    this.bgMusic = new Audio("sounds/bg_music.mp3");
    this.bgMusic.loop = true; // Loop the background music
    this.bgMusic.volume = 0.3; // Lower volume for background music
    this.isBgMusicPlaying = false;

    // Preload all sounds
    this.preloadSounds();

    // Import game options to check sound toggle
    this.gameOptions = null;
    this.initializeGameOptions();
  }

  async initializeGameOptions() {
    try {
      const { gameOptions } = await import("./game-options.js");
      this.gameOptions = gameOptions;
    } catch (error) {
      console.error("Error importing game options:", error);
      // Fallback: assume sounds are enabled
      this.gameOptions = { sound: true };
    }
  }
  preloadSounds() {
    // Set volume and preload all sounds
    Object.values(this.sounds).forEach((sound) => {
      sound.volume = 0.5; // Default volume at 50%
      sound.preload = "auto";

      // Handle loading errors gracefully
      sound.addEventListener("error", (e) => {
        console.warn(`Failed to load sound: ${sound.src}`, e);
      });
    });

    // Preload background music
    this.bgMusic.preload = "auto";
    this.bgMusic.addEventListener("error", (e) => {
      console.warn("Failed to load background music:", e);
    });
  } // Check if sounds are enabled in game options
  isSoundEnabled() {
    return this.gameOptions && this.gameOptions.sound;
  }

  // Check if music is enabled in game options
  isMusicEnabled() {
    return this.gameOptions && this.gameOptions.music;
  }

  // Play a sound if sounds are enabled
  playSound(soundName) {
    if (!this.isSoundEnabled()) {
      return;
    }

    const sound = this.sounds[soundName];
    if (sound) {
      // Reset the sound to beginning in case it's already playing
      sound.currentTime = 0;
      sound.play().catch((error) => {
        console.warn(`Failed to play sound ${soundName}:`, error);
      });
    } else {
      console.warn(`Sound '${soundName}' not found`);
    }
  } // Individual sound methods for easy access
  playCashAdded() {
    this.playSound("cashAdded");
  }

  playGameOver() {
    this.playSound("gameOver");
  }

  playInvalidAction() {
    this.playSound("invalidAction");
  }

  playMoneySpent() {
    this.playSound("moneySpent");
  }

  playPhaseReset() {
    this.playSound("phaseReset");
  }
  playFanfare() {
    this.playSound("fanfare");
  } // Background music controls
  startBackgroundMusic() {
    if (
      !this.isSoundEnabled() ||
      !this.isMusicEnabled() ||
      this.isBgMusicPlaying
    ) {
      return;
    }

    this.bgMusic.currentTime = 0;
    this.bgMusic
      .play()
      .then(() => {
        this.isBgMusicPlaying = true;
        console.log("Background music started");
      })
      .catch((error) => {
        console.warn("Failed to start background music:", error);
      });
  }

  stopBackgroundMusic() {
    if (!this.isBgMusicPlaying) {
      return;
    }

    this.bgMusic.pause();
    this.bgMusic.currentTime = 0;
    this.isBgMusicPlaying = false;
    console.log("Background music stopped");
  }

  // Toggle background music based on sound settings
  toggleBackgroundMusic() {
    if (this.isSoundEnabled()) {
      this.startBackgroundMusic();
    } else {
      this.stopBackgroundMusic();
    }
  } // Set volume for all sounds (0.0 to 1.0)
  setVolume(volume) {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    Object.values(this.sounds).forEach((sound) => {
      sound.volume = clampedVolume;
    });
    // Keep background music at a lower volume
    this.bgMusic.volume = clampedVolume * 0.6;
  }

  // Stop all currently playing sounds
  stopAllSounds() {
    Object.values(this.sounds).forEach((sound) => {
      sound.pause();
      sound.currentTime = 0;
    });
    this.stopBackgroundMusic();
  }
}

// Create and export a singleton instance
export const soundManager = new SoundManager();

// Make it available globally for other modules
window.soundManager = soundManager;
