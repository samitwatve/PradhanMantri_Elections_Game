// Key Tracker - Global key state management for shortcuts
class KeyTracker {
  constructor() {
    this.keys = {
      r: false,
      shift: false
    };
    
    this.initialize();
  }  initialize() {
    document.addEventListener("keydown", (e) => {
      // Prevent default to avoid browser shortcuts
      if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        this.keys.r = true;
        console.log("R key pressed - Rally mode activated");
        document.body.classList.add('rally-mode-active');
      }
      if (e.key === 'Shift') {
        this.keys.shift = true;
      }
    });

    document.addEventListener("keyup", (e) => {
      if (e.key === 'r' || e.key === 'R') {
        this.keys.r = false;
        console.log("R key released - Rally mode deactivated");
        document.body.classList.remove('rally-mode-active');
      }
      if (e.key === 'Shift') {
        this.keys.shift = false;
      }
    });

    // Clear all keys when window loses focus
    window.addEventListener("blur", () => {
      this.keys.r = false;
      this.keys.shift = false;
      document.body.classList.remove('rally-mode-active');
    });
  }
  isRPressed() {
    return this.keys.r;
  }

  isShiftPressed() {
    return this.keys.shift;
  }
}

export const keyTracker = new KeyTracker();
