// TV Display functionality
class TVDisplay {
  constructor() {
    this.tvScreen = document.querySelector(".tv-screen");
    this.notifications = [];
    this.maxNotifications = 8; // Maximum number of notifications to keep visible
    this.initialize();
  }

  initialize() {
    // Add click event for the TV buttons
    const tvButtons = document.querySelectorAll(".tv-button");
    tvButtons.forEach((button, index) => {
      button.addEventListener("click", () => this.handleTVButtonClick(index));
    });

    // Show initial welcome message
    this.addWelcomeMessage();
  }

  addWelcomeMessage() {
    const welcomeNotification = this.createNotification({
      type: 'system',
      title: 'Election Coverage Live',
      details: 'Welcome to the India Elections Game live coverage system',
      timestamp: new Date(),
      duration: 10000
    });
    
    this.tvScreen.appendChild(welcomeNotification);
  }

  createNotification(data) {
    const notification = document.createElement('div');
    notification.className = `notification ${data.type ? 'notification-' + data.type : ''}`;
    
    // Create a simpler, flatter structure with larger text
    let content = `
      ${data.magnitude ? `<span class="notification-magnitude">${data.magnitude}</span>` : ''}
      <strong class="notification-title">${data.title}</strong>
      ${data.location ? `<br><span class="notification-location">📍 ${data.location}</span>` : ''}
      ${data.details ? `<br><span class="notification-details">${data.details}</span>` : ''}
      <br><small class="notification-timestamp">[${this.formatTime(data.timestamp)}] LIVE</small>
    `;

    // Add progress bar for timed notifications
    if (data.duration) {
      content += `<div class="notification-progress"><div class="notification-progress-bar" style="animation-duration: ${data.duration}ms;"></div></div>`;
    }

    notification.innerHTML = content;

    // Auto-remove notification after duration
    if (data.duration) {
      setTimeout(() => {
        this.removeNotification(notification);
      }, data.duration);
    }

    return notification;
  }

  getNotificationTypeLabel(type) {
    const labels = {
      'event-positive': '📈 POSITIVE EVENT',
      'event-negative': '📉 NEGATIVE EVENT',
      'policy-update': '📋 POLICY UPDATE',
      'campaign-update': '🗳️ CAMPAIGN NEWS',
      'system': '⚡ SYSTEM'
    };
    return labels[type] || '📺 UPDATE';
  }

  formatTime(date) {
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  addNotification(data) {
    const notification = this.createNotification(data);
    
    // Add to the top of the container
    this.tvScreen.insertBefore(notification, this.tvScreen.firstChild);
    
    // Add news flash effect
    this.tvScreen.classList.add('news-flash');
    setTimeout(() => {
      this.tvScreen.classList.remove('news-flash');
    }, 1500);

    // Keep only the maximum number of notifications
    this.trimNotifications();

    // Scroll to top to show new notification
    this.tvScreen.scrollTop = 0;
  }

  removeNotification(notification) {
    if (notification && notification.parentNode) {
      notification.style.animation = 'slideOutLeft 0.5s ease-out forwards';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 500);
    }
  }

  trimNotifications() {
    const notifications = this.tvScreen.querySelectorAll('.notification');
    if (notifications.length > this.maxNotifications) {
      // Remove oldest notifications (from the bottom)
      for (let i = this.maxNotifications; i < notifications.length; i++) {
        this.removeNotification(notifications[i]);
      }
    }
  }

  handleTVButtonClick(buttonIndex) {
    // First button: Add test notification
    if (buttonIndex === 0) {
      this.addTestNotification();
    }
    // Second button: Clear all notifications
    else if (buttonIndex === 1) {
      this.clearAllNotifications();
    }
  }

  addTestNotification() {
    const testNotifications = [
      {
        type: 'campaign-update',
        title: 'Rally draws massive crowd in Mumbai',
        location: 'Maharashtra',
        details: 'Over 50,000 supporters gather for major campaign event',
        timestamp: new Date(),
        duration: 8000
      },
      {
        type: 'policy-update',
        title: 'New healthcare initiative announced',
        details: 'Free medical coverage for rural areas proposed',
        timestamp: new Date(),
        duration: 8000
      }
    ];

    const randomNotification = testNotifications[Math.floor(Math.random() * testNotifications.length)];
    this.addNotification(randomNotification);
  }

  clearAllNotifications() {
    const notifications = this.tvScreen.querySelectorAll('.notification');
    notifications.forEach(notification => {
      this.removeNotification(notification);
    });
  }

  // Main method used by other modules to add news updates
  addNewsUpdate(data, isHtml = false, duration = 8000) {
    let notificationData;

    if (isHtml) {
      // Parse HTML content from old format and convert to new format
      notificationData = this.parseHtmlContent(data, duration);
    } else {
      // Handle plain text messages
      notificationData = {
        type: 'system',
        title: data,
        timestamp: new Date(),
        duration: duration
      };
    }

    this.addNotification(notificationData);
  }

  parseHtmlContent(htmlContent, duration) {
    // Create a temporary element to parse the HTML
    const temp = document.createElement('div');
    temp.innerHTML = htmlContent;

    // Extract information from the old HTML format
    const eventNotification = temp.querySelector('.event-notification');
    if (eventNotification) {
      const isPositive = eventNotification.classList.contains('positive');
      const isNegative = eventNotification.classList.contains('negative');
      
      const magnitude = temp.querySelector('.event-magnitude')?.textContent || '';
      const description = temp.querySelector('.event-description')?.textContent || '';
      const location = temp.querySelector('.event-location')?.textContent?.replace('📍 ', '') || '';
      const affected = temp.querySelector('.event-affected')?.textContent?.replace('⚡ ', '') || '';

      return {
        type: isPositive ? 'event-positive' : (isNegative ? 'event-negative' : 'system'),
        title: description,
        location: location,
        details: affected,
        magnitude: magnitude,
        timestamp: new Date(),
        duration: duration
      };
    }

    // Fallback for non-event HTML content
    return {
      type: 'system',
      title: temp.textContent || htmlContent,
      timestamp: new Date(),
      duration: duration
    };
  }
}

// Add slideOutLeft animation to CSS dynamically
const style = document.createElement('style');
style.textContent = `
  @keyframes slideOutLeft {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(-100%);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);

// Initialize the TV display when the page loads
document.addEventListener("DOMContentLoaded", () => {
  window.tvDisplay = new TVDisplay();
});

export default TVDisplay;
