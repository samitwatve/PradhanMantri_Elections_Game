// Actions logging functionality
class ActionsLog {
  constructor() {
    this.logElement = document.getElementById("actions-log");
    this.maxLogs = 100; // Maximum number of logs to keep
    this.logs = [];
  }

  addAction(message, type = "action") {
    this.log(message, type);
  }

  log(message, type = "info") {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = {
      timestamp,
      message,
      type,
    };

    this.logs.unshift(logEntry); // Add to beginning of array
    if (this.logs.length > this.maxLogs) {
      this.logs.pop(); // Remove oldest log
    }

    this.updateDisplay();
  }

  updateDisplay() {
    if (!this.logElement) return;

    this.logElement.innerHTML = this.logs
      .map(
        (log) => `
                <div class="log-entry ${log.type}">
                    <span class="timestamp">[${log.timestamp}]</span>
                    <span class="message">${log.message}</span>
                </div>
            `,
      )
      .join("");
  }

  clear() {
    this.logs = [];
    this.updateDisplay();
  }
}

// Create and export a single instance
export const actionsLog = new ActionsLog();
