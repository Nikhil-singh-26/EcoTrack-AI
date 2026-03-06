// Notification utility functions for EcoTrack AI

export const requestNotificationPermission = async () => {
  // Safety check for browser support
  if (!("Notification" in window)) {
    console.warn("This browser does not support notifications");
    return false;
  }

  // Return if permission is already granted
  if (Notification.permission === "granted") {
    return true;
  }

  // Return if permission is denied
  if (Notification.permission === "denied") {
    console.warn("Notification permission has been denied");
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  } catch (error) {
    console.error("Error requesting notification permission:", error);
    return false;
  }
};

export const sendEnergyAlertNotification = (title, message, options = {}) => {
  // Safety check for browser support and permission
  if (!("Notification" in window)) {
    console.warn("This browser does not support notifications");
    return false;
  }

  if (Notification.permission !== "granted") {
    console.warn("Notification permission not granted");
    return false;
  }

  try {
    const notification = new Notification(title, {
      body: message,
      icon: "/icon.jpeg",
      badge: "/icon.jpeg",
      tag: "energy-alert", // Prevents duplicate notifications
      requireInteraction: true,
      ...options
    });

    // Auto-close notification after 5 seconds
    setTimeout(() => {
      notification.close();
    }, 5000);

    // Handle notification click
    notification.onclick = () => {
      window.focus();
      notification.close();
      // Navigate to dashboard if user clicks notification
      window.location.href = "/dashboard";
    };

    return true;
  } catch (error) {
    console.error("Error sending notification:", error);
    return false;
  }
};

export const checkEnergyUsageThreshold = (currentUsage, threshold = 10) => {
  // Check if energy usage exceeds threshold and send notification
  if (currentUsage > threshold) {
    sendEnergyAlertNotification(
      "⚡ High Energy Usage Alert",
      `Your current energy usage is ${currentUsage.toFixed(2)} kWh, which exceeds the recommended threshold of ${threshold} kWh.`,
      {
        actions: [
          {
            action: "view-details",
            title: "View Details"
          },
          {
            action: "dismiss",
            title: "Dismiss"
          }
        ]
      }
    );
  }
};

export const sendDailyEnergySummary = (dailyUsage, dailyCost, efficiencyScore) => {
  const efficiencyText = efficiencyScore > 70 ? "Great job!" : "Room for improvement";
  
  sendEnergyAlertNotification(
    "📊 Daily Energy Summary",
    `Today's usage: ${dailyUsage.toFixed(2)} kWh | Cost: $${dailyCost.toFixed(2)} | Efficiency: ${efficiencyText}`,
    {
      icon: "/icon.jpeg",
      tag: "daily-summary"
    }
  );
};

export const sendAchievementNotification = (achievement) => {
  sendEnergyAlertNotification(
    "🏆 Achievement Unlocked!",
    achievement.description,
    {
      icon: "/icon.jpeg",
      tag: "achievement",
      requireInteraction: false
    }
  );
};

// Initialize notifications after user login
export const initializeNotifications = async () => {
  const hasPermission = await requestNotificationPermission();
  
  if (hasPermission) {
    console.log("Notifications initialized successfully");
    
    // Send welcome notification
    setTimeout(() => {
      sendEnergyAlertNotification(
        "👋 Welcome to EcoTrack AI!",
        "Stay tuned for real-time energy insights and alerts to help you save energy and reduce costs."
      );
    }, 2000);
  }
  
  return hasPermission;
};
