// QOOA Control Tower - Utility Functions

// ========== TELEMETRY ACCESS ==========
/**
 * Get the latest telemetry reading for a shipment
 * Note: This function is already defined in data.js and globally accessible
 * Included here as a reference for consistency
 * @param {string} shipmentId - The shipment ID
 * @returns {object|null} - Latest telemetry data
 */
function getLatestTelemetryUtil(shipmentId) {
  // This wraps the function from data.js
  return getLatestTelemetry(shipmentId);
}

// ========== DATE & TIME FORMATTING ==========
/**
 * Format ISO timestamp to readable date/time
 * @param {string} isoDate - ISO 8601 date string (e.g., '2026-02-03T15:40:00')
 * @returns {string} - Formatted date string
 */
function formatTimestamp(isoDate) {
  if (!isoDate) return "N/A";

  const date = new Date(isoDate);

  // Format: "Feb 3, 2026 at 3:40 PM"
  const options = {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  };

  return date.toLocaleString("en-US", options);
}

/**
 * Format timestamp to short time only
 * @param {string} isoDate - ISO date string
 * @returns {string} - Time only (e.g., "3:40 PM")
 */
function formatTime(isoDate) {
  if (!isoDate) return "N/A";

  const date = new Date(isoDate);
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

/**
 * Format timestamp to date only
 * @param {string} isoDate - ISO date string
 * @returns {string} - Date only (e.g., "Feb 3, 2026")
 */
function formatDate(isoDate) {
  if (!isoDate) return "N/A";

  const date = new Date(isoDate);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Get relative time (e.g., "2 hours ago")
 * @param {string} isoDate - ISO date string
 * @returns {string} - Relative time
 */
function getRelativeTime(isoDate) {
  if (!isoDate) return "N/A";

  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
}

// ========== QUALITY STATUS CALCULATION ==========
/**
 * Calculate quality status based on Hardware Workflow thresholds
 * CRITICAL THRESHOLDS:
 * - Green (Safe): Temp 12-20°C, Gas < 100ppm, Humidity 85-95%
 * - Orange (Warning): Temp 21-27°C, Gas 100-300ppm, Humidity 70-84%
 * - Red (Danger): Temp > 28°C, Gas > 300ppm, Humidity < 70%
 *
 * @param {number} temperature - Temperature in Celsius
 * @param {number} gasLevel - Ethylene gas level in ppm
 * @param {number} humidity - Relative humidity in percentage (optional)
 * @returns {string} - 'Green', 'Orange', or 'Red'
 */
function calculateQualityStatus(temperature, gasLevel, humidity = null) {
  // Check for Red (Danger) conditions first
  if (temperature > 28 || gasLevel > 300) {
    return "Red";
  }

  // Check humidity if provided
  if (humidity !== null && humidity < 70) {
    return "Red"; // Critical: Drying out / Weight loss
  }

  // Check for Orange (Warning) conditions
  if (
    (temperature >= 21 && temperature <= 27) ||
    (gasLevel >= 100 && gasLevel <= 300)
  ) {
    return "Orange";
  }

  // Check humidity warning range
  if (humidity !== null && humidity >= 70 && humidity < 85) {
    return "Orange"; // Warning range
  }

  // Green (Safe) conditions: Temp 12-20°C AND Gas < 100ppm AND Humidity 85-95%
  if (temperature >= 12 && temperature <= 20 && gasLevel < 100) {
    if (humidity === null || (humidity >= 85 && humidity <= 95)) {
      return "Green";
    }
  }

  // Edge case: Temperature below 12°C (too cold)
  if (temperature < 12) {
    return "Orange"; // Warning - below optimal range
  }

  return "Green"; // Default to Green if all checks pass
}

/**
 * Get humidity status based on Hardware Workflow thresholds
 * @param {number} humidity - Relative humidity percentage
 * @returns {object} - Status object with class and label
 */
function getHumidityStatus(humidity) {
  if (humidity >= 85 && humidity <= 95) {
    return { class: "status-green", label: "Optimal Range", color: "#10b981" };
  } else if (humidity >= 70 && humidity < 85) {
    return { class: "status-orange", label: "Below Optimal", color: "#f59e0b" };
  } else if (humidity < 70) {
    return {
      class: "status-red",
      label: "CRITICAL - Dehydration",
      color: "#ef4444",
    };
  } else {
    return { class: "status-orange", label: "Too Humid", color: "#f59e0b" };
  }
}

/**
 * Get temperature status based on Hardware Workflow thresholds
 * @param {number} temperature - Temperature in Celsius
 * @returns {object} - Status object with class and label
 */
function getTempStatus(temperature) {
  if (temperature >= 12 && temperature <= 20) {
    return { class: "status-green", label: "Optimal", color: "#10b981" };
  } else if (temperature >= 21 && temperature <= 27) {
    return { class: "status-orange", label: "Warning", color: "#f59e0b" };
  } else if (temperature > 27) {
    return { class: "status-red", label: "CRITICAL", color: "#ef4444" };
  } else {
    return { class: "status-orange", label: "Too Cold", color: "#f59e0b" };
  }
}

/**
 * Get gas level status based on Hardware Workflow thresholds
 * @param {number} gasLevel - Ethylene gas level in ppm
 * @returns {object} - Status object with class and label
 */
function getGasStatus(gasLevel) {
  if (gasLevel < 100) {
    return { class: "status-green", label: "Safe", color: "#10b981" };
  } else if (gasLevel >= 100 && gasLevel <= 300) {
    return { class: "status-orange", label: "Warning", color: "#f59e0b" };
  } else {
    return { class: "status-red", label: "CRITICAL", color: "#ef4444" };
  }
}

/**
 * Get overall status for a reading
 * @param {number} temperature - Temperature in Celsius
 * @param {number} gasLevel - Gas level in ppm
 * @returns {string} - CSS class for timeline marker
 */
function getOverallStatus(temperature, gasLevel) {
  if (temperature > 27 || gasLevel > 300) {
    return "status-red";
  } else if ((temperature >= 21 && temperature <= 27) || (gasLevel >= 100 && gasLevel <= 300)) {
    return "status-orange";
  }
  return "status-green";
}

/**
 * Get hub triage display information
 * @param {string} decision - Hub triage decision
 * @returns {object} - Display info with icon, label, and class
 */
function getHubTriageDisplay(decision) {
  switch (decision) {
    case "APPROVED":
      return { icon: "🟢", label: "Approved", class: "badge-green" };
    case "REJECTED":
      return { icon: "🔴", label: "Rejected", class: "badge-red" };
    case "FIELD_HEAT_EXTRACTED":
      return { icon: "🟡", label: "Heat Extracted", class: "badge-orange" };
    default:
      return { icon: "⚪", label: "Pending", class: "badge" };
  }
}

// ========== STATUS BADGE HELPERS ==========
/**
 * Get HTML class for status badge
 * @param {string} status - 'Green', 'Orange', or 'Red'
 * @returns {string} - CSS class name
 */
function getStatusBadgeClass(status) {
  switch (status.toLowerCase()) {
    case "green":
      return "badge-green";
    case "orange":
      return "badge-orange";
    case "red":
      return "badge-red";
    default:
      return "badge";
  }
}

/**
 * Get status color hex code
 * @param {string} status - 'Green', 'Orange', or 'Red'
 * @returns {string} - Hex color code
 */
function getStatusColor(status) {
  switch (status.toLowerCase()) {
    case "green":
      return "#10b981";
    case "orange":
      return "#f59e0b";
    case "red":
      return "#ef4444";
    default:
      return "#6b7280";
  }
}

// ========== NETWORK STATUS HELPERS ==========
/**
 * Get network status display text
 * Implements Lokoja Gap feature: offline shows "Cached to SD"
 * @param {string} networkStatus - 'online' or 'offline'
 * @returns {string} - Display text
 */
function getNetworkStatusText(networkStatus) {
  return networkStatus === "offline" ? "Cached to SD" : "Online";
}

/**
 * Get network status icon
 * @param {string} networkStatus - 'online' or 'offline'
 * @returns {string} - Emoji icon
 */
function getNetworkStatusIcon(networkStatus) {
  return networkStatus === "offline" ? "📡" : "🌐";
}

// ========== HUB TRIAGE HELPERS ==========
/**
 * Get hub triage decision display info
 * @param {string} decision - Hub triage decision (APPROVED, REJECTED, SHORT_HAUL_ONLY, etc.)
 * @returns {object} - Display object with icon, label, and class
 */
function getHubTriageDisplay(decision) {
  switch (decision) {
    case "APPROVED":
      return {
        icon: "🟢",
        label: "Approved for Long-Haul",
        class: "badge-green",
        color: "#10b981",
      };
    case "SHORT_HAUL_ONLY":
      return {
        icon: "🟠",
        label: "Short-Haul Only",
        class: "badge-orange",
        color: "#f59e0b",
      };
    case "REJECTED":
      return {
        icon: "🔴",
        label: "Rejected - Local Sale",
        class: "badge-red",
        color: "#ef4444",
      };
    case "REJECTED_BUT_SHIPPED":
      return {
        icon: "⚠️",
        label: "OVERRIDE - Shipped Despite Rejection",
        class: "badge-red",
        color: "#dc2626",
      };
    default:
      return {
        icon: "❓",
        label: "Pending Triage",
        class: "badge",
        color: "#6b7280",
      };
  }
}

/**
 * Get alert severity display info
 * @param {string} severity - Alert severity (red, orange, yellow)
 * @returns {object} - Display object
 */
function getAlertSeverityDisplay(severity) {
  switch (severity) {
    case "red":
      return { icon: "🚨", class: "alert-critical", label: "CRITICAL" };
    case "orange":
      return { icon: "⚠️", class: "alert-warning", label: "WARNING" };
    case "yellow":
      return { icon: "⚡", class: "alert-info", label: "INFO" };
    default:
      return { icon: "ℹ️", class: "alert-info", label: "NOTICE" };
  }
}

// ========== NUMBER FORMATTING ==========
/**
 * Format number with commas (e.g., 1000 → 1,000)
 * @param {number} num - Number to format
 * @returns {string} - Formatted number
 */
function formatNumber(num) {
  return num.toLocaleString("en-US");
}

/**
 * Format temperature with unit
 * @param {number} temp - Temperature value
 * @returns {string} - Formatted temperature (e.g., "18.5°C")
 */
function formatTemperature(temp) {
  return `${temp}°C`;
}

/**
 * Format gas level with unit
 * @param {number} gasLevel - Gas level value
 * @returns {string} - Formatted gas level (e.g., "52 ppm")
 */
function formatGasLevel(gasLevel) {
  return `${gasLevel} ppm`;
}

/**
 * Format humidity with unit
 * @param {number} humidity - Humidity percentage
 * @returns {string} - Formatted humidity (e.g., "65%")
 */
function formatHumidity(humidity) {
  return `${humidity}%`;
}

/**
 * Validate temperature reading
 * @param {number} temp - Temperature value
 * @returns {boolean} - True if valid
 */
function isValidTemperature(temp) {
  return typeof temp === "number" && temp >= -20 && temp <= 50;
}

/**
 * Validate gas level reading
 * @param {number} gasLevel - Gas level value
 * @returns {boolean} - True if valid
 */
function isValidGasLevel(gasLevel) {
  return typeof gasLevel === "number" && gasLevel >= 0 && gasLevel <= 1000;
}

/**
 * Validate email format
 * @param {string} email - Email address
 * @returns {boolean} - True if valid
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Sort shipments by quality status (Red first, then Orange, then Green)
 * @param {array} shipments - Array of shipment objects
 * @returns {array} - Sorted array
 */
function sortByPriority(shipments) {
  const priority = { Red: 1, Orange: 2, Green: 3 };
  return [...shipments].sort((a, b) => {
    return priority[a.qualityStatus] - priority[b.qualityStatus];
  });
}

/**
 * Filter shipments by status
 * @param {array} shipments - Array of shipment objects
 * @param {string} status - Status to filter by
 * @returns {array} - Filtered array
 */
function filterByStatus(shipments, status) {
  return shipments.filter((s) => s.qualityStatus === status);
}

// ========== EXPORT NOTE ==========
// All functions are globally accessible in vanilla JS
// No module exports needed for browser environment
