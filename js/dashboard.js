// QOOA Control Tower - Dashboard Logic

// ========== AUTHENTICATION CHECK ==========
// Return parsed session if present (supports both keys used across the app),
// otherwise return null. Do not redirect here so pages can choose behavior.
function checkAuthentication() {
  const raw = localStorage.getItem('qooa_vendor_session') || localStorage.getItem('qooa_session');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (err) {
    // Malformed session: remove keys and return null
    localStorage.removeItem('qooa_vendor_session');
    localStorage.removeItem('qooa_session');
    return null;
  }
}

// Guard to prevent multiple concurrent navigator.share calls
let _shareInProgress = false;

// ========== DASHBOARD INITIALIZATION ==========
// Helper: determine current route from either hash or path (/dashboard or /dashboard/shipments)
function getRouteFromLocation() {
  const hash = window.location.hash.replace('#', '').toLowerCase();
  if (hash) return hash;

  const path = window.location.pathname.replace(/\/+$|^\/+/, ''); // trim leading/trailing slashes
  // look for 'dashboard' segment
  const parts = path.split('/');
  const idx = parts.indexOf('dashboard');
  if (idx !== -1) {
    const sub = parts[idx + 1] || '';
    if (!sub) return 'dashboard';
    // user-friendly mapping: /dashboard/sidebar -> settings view
    if (sub.toLowerCase() === 'sidebar' || sub.toLowerCase() === 'settings') return 'settings';
    return sub.toLowerCase();
  }

  return '';
}

document.addEventListener("DOMContentLoaded", function () {
  // Ensure event listeners are attached (sidebar loader will call this again after injection)
  try { setupEventListeners(); } catch (e) { /* ignore */ }

  // Apply modal style preference from saved settings
  try { applyModalStyleFromSettings(); } catch (e) { /* ignore */ }

  // Load initial view based on hash or path (e.g. /dashboard/shipments) or default to Dashboard
  const mapping = {
    'dashboard': 'Dashboard',
    'shipments': 'Shipments',
    'telemetry': 'Live Telemetry',
    'reports': 'Reports',
    'settings': 'Settings'
  };
  const route = getRouteFromLocation();
  const initialView = mapping[route] || 'Dashboard';
  try { switchView(initialView); } catch (e) { console.error('Failed to switch initial view', e); }
});

// ========== SETUP EVENT LISTENERS ==========
function setupEventListeners() {
  // New Order Button
  const newOrderBtn = document.getElementById("newOrderBtn");
  if (newOrderBtn) {
    newOrderBtn.addEventListener("click", openOrderModal);
  }

  // Sidebar Navigation
  const navItems = document.querySelectorAll(".nav-item");
  
  navItems.forEach((item) => {
    item.addEventListener("click", function (e) {
      e.preventDefault();

      // Remove active class from all items
      navItems.forEach((nav) => nav.classList.remove("active"));

      // Add active class to clicked item
      this.classList.add("active");

      // Get the navigation text (from the span, not the emoji)
      const navText = this.querySelector("span:last-child").textContent.trim();

      // Route name used by the SPA
      const route = this.getAttribute('data-route') || navText.toLowerCase().replace(/\s+/g, '-');

      // Update the browser URL using pushState so we get clean paths like /dashboard or /dashboard/shipments
      try {
        const path = route === 'dashboard' ? '/dashboard' : `/dashboard/${route}`;
        history.pushState({}, '', path);
      } catch (err) {
        // Fallback to hash for older browsers
        try { window.location.hash = route; } catch (e) { /* ignore */ }
      }

      // Switch view based on section
      switchView(navText);
    });
  });

  // Unified handler for route changes (supports hash and history API)
  function handleRouteChange() {
    const r = getRouteFromLocation();
    const map = {
      'dashboard': 'Dashboard',
      'shipments': 'Shipments',
      'telemetry': 'Live Telemetry',
      'reports': 'Reports',
      'settings': 'Settings'
    };
    const view = map[r] || 'Dashboard';

    // Update active nav item visually
    navItems.forEach((nav) => {
      const rr = nav.getAttribute('data-route');
      if (rr === r) nav.classList.add('active'); else nav.classList.remove('active');
    });

    switchView(view);
  }

  // React to back/forward navigation (history) and hashchanges
  window.addEventListener('popstate', handleRouteChange);
  window.addEventListener('hashchange', handleRouteChange);

  // Modal Close Buttons
  const closeButtons = document.querySelectorAll(".modal-close");
  closeButtons.forEach((btn) => {
    btn.addEventListener("click", closeAllModals);
  });

  // Click outside modal to close
  window.addEventListener("click", function (e) {
    if (e.target.classList.contains("modal")) {
      closeAllModals();
    }
  });

  // Order Form Submit
  const orderForm = document.getElementById("orderForm");
  if (orderForm) {
    orderForm.addEventListener("submit", handleNewOrder);
  }

  // Logout Button
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", handleLogout);
  }

  // Change Password Form (modal exists in page)
  const changeForm = document.getElementById('changePasswordForm');
  if (changeForm) {
    changeForm.addEventListener('submit', handleChangePasswordSubmit);
  }

  // Hook reusable modal close button if present
  const reusableClose = document.getElementById('reusableModalClose');
  if (reusableClose) {
    reusableClose.addEventListener('click', closeReusableModal);
  }

  // Close modals with Esc
  window.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeAllModals();
  });
}

// ========== RENDER DASHBOARD ==========
function renderDashboard() {
  updateStats();
  renderShipments();
}

// ========== SWITCH VIEW ==========
function switchView(viewName) {
  console.log("switchView called with:", viewName);
  const mainContent = document.querySelector('.main-content');

  // Try to load a file-based view first (components/views/<route>.html)
  const nameToRoute = {
    'Dashboard': 'dashboard',
    'Shipments': 'shipments',
    'Live Telemetry': 'telemetry',
    'Reports': 'reports',
    'Settings': 'settings'
  };

  const routeKey = nameToRoute[viewName] || viewName.toLowerCase().replace(/\s+/g, '-');
  const viewPath = `/components/views/${routeKey}.html`;

  if (mainContent) {
    // attempt fetch but don't block; if it fails, fall back to render functions
    try {
      fetch(viewPath, { cache: 'no-cache' })
        .then((res) => {
          if (!res.ok) throw new Error('not found');
          return res.text();
        })
        .then((html) => {
          mainContent.innerHTML = html;
          setupDynamicEventListeners();
          // Populate vendor greeting and stats from data.js
          try { populateVendorGreeting(); } catch (e) { /* ignore */ }
          updateStats();
          // If the view file was loaded, call the matching renderer when needed
          if (routeKey === 'dashboard') {
            try { renderShipments(); } catch (e) { /* ignore */ }
          } else if (routeKey === 'shipments') {
            try { renderShipmentsView(); } catch (e) { /* ignore */ }
          } else if (routeKey === 'telemetry') {
            try { renderTelemetryView(); } catch (e) { /* ignore */ }
          } else if (routeKey === 'reports') {
            try { renderReportsView(); } catch (e) { /* ignore */ }
          }
          // update 'last updated' timestamp if present
          try { setLastUpdated(new Date()); } catch (e) { /* ignore */ }
        })
        .catch(() => {
          // fall back to render functions below
          doRenderSwitch(viewName);
        });
    } catch (err) {
      doRenderSwitch(viewName);
    }
  } else {
    doRenderSwitch(viewName);
  }

  // helper to call existing render functions
  function doRenderSwitch(name) {
  try {
    switch (viewName) {
      case "Dashboard":
        renderDashboard();
        break;
      case "Shipments":
        renderShipmentsView();
        break;
      case "Live Telemetry":
        renderTelemetryView();
        break;
      case "Reports":
        renderReportsView();
        break;
      case "Settings":
        renderSettingsView();
        break;
      default:
        renderDashboard();
    }
  } catch (error) {
    console.error("Error in switchView:", error);
    customAlert("An error occurred while switching views. Please refresh the page.", "Navigation Error");
  }

  // Re-setup event listeners for dynamic content and refresh stats
  setupDynamicEventListeners();
  updateStats();
  }
}

// ========== RENDER SHIPMENTS VIEW ==========
function renderShipmentsView() {
  const mainContent = document.querySelector(".main-content");
  
  mainContent.innerHTML = `
    <header class="dashboard-header">
      <div class="header-left">
        <h1>📦 All Shipments</h1>
        <p>Manage and track all shipments</p>
      </div>
      <div class="header-right">
        <button id="newOrderBtn" class="btn-primary">➕ New Order</button>
      </div>
    </header>
    
    <section class="shipments-section">
      <div id="shipmentsContainer">
        <div class="loading">Loading shipments...</div>
      </div>
    </section>
  `;
  
  setupDynamicEventListeners();
  renderShipments();
}

// ========== RENDER TELEMETRY VIEW ==========
function renderTelemetryView() {
  const mainContent = document.querySelector(".main-content");
  const shipments = getShipments();

  mainContent.innerHTML = `
    <header class="dashboard-header">
      <div class="header-left">
        <h1>📡 Live Telemetry</h1>
        <p>Real-time sensor monitoring for all shipments</p>
      </div>
    </header>

    <section class="shipments-section">
      <div class="telemetry-grid">
        ${shipments.map(shipment => {
          const telemetry = getLatestTelemetry(shipment.id);
          if (!telemetry) return '';

          const tempStatus = getTempStatus(telemetry.temperature);
          const gasStatus = getGasStatus(telemetry.gasLevel);
          const humidityStatus = getHumidityStatus ? getHumidityStatus(telemetry.humidity) : { class: '' };
          const qualityBadge = shipment.qualityStatus === 'Green' ? 'badge-green' : shipment.qualityStatus === 'Orange' ? 'badge-orange' : 'badge-red';

          return `
            <div class="sensor-card">
              <div class="sensor-icon">📡</div>
              <div class="sensor-data">
                <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;">
                  <div>
                    <div class="shipment-id" style="font-weight:700;">${shipment.id}</div>
                    <div style="font-size:12px;color:var(--gray);margin-top:6px;">🚛 ${shipment.truckId} • ${telemetry.location.name}</div>
                  </div>
                  <span class="badge ${qualityBadge}">${shipment.qualityStatus}</span>
                </div>

                <div style="display:flex;gap:18px;margin-top:12px;align-items:end;">
                  <div>
                    <div style="font-size:11px;color:var(--gray);">Temperature</div>
                    <div class="sensor-value ${tempStatus.class}">${telemetry.temperature}°C</div>
                    <div class="sensor-unit">°C</div>
                  </div>
                  <div>
                    <div style="font-size:11px;color:var(--gray);">Ethylene Gas</div>
                    <div class="sensor-value ${gasStatus.class}">${telemetry.gasLevel} ppm</div>
                    <div class="sensor-unit">ppm</div>
                  </div>
                  <div>
                    <div style="font-size:11px;color:var(--gray);">Humidity</div>
                    <div class="sensor-value ${humidityStatus.class || ''}">${telemetry.humidity}%</div>
                    <div class="sensor-unit">%</div>
                  </div>
                </div>

                <div style="margin-top:12px;display:flex;gap:8px;">
                  <button class="btn-small" onclick="openTruckModal('${shipment.id}')">View Details</button>
                  <button class="btn-small" onclick="shareTelemetry('${shipment.id}')" style="background:#3b82f6;color:#fff;">📤 Share</button>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </section>
  `;
}

// ========== RENDER REPORTS VIEW ==========
function renderReportsView() {
  const mainContent = document.querySelector(".main-content");
  const shipments = getShipments();
  const stats = getStats();
  
  mainContent.innerHTML = `
    <header class="dashboard-header">
      <div class="header-left">
        <h1>📋 Reports & Analytics</h1>
        <p>Performance metrics and quality reports</p>
      </div>
    </header>
    
    <section class="stats-section">
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">📦</div>
          <div class="stat-info">
            <h3>${stats.totalShipments}</h3>
            <p>Total Shipments</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">🚛</div>
          <div class="stat-info">
            <h3>${stats.inTransit}</h3>
            <p>In Transit</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">✅</div>
          <div class="stat-info">
            <h3>${stats.completed}</h3>
            <p>Completed</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">🛡️</div>
          <div class="stat-info">
            <h3>${stats.bioShieldActive}</h3>
            <p>Bio-Shield Active</p>
          </div>
        </div>
      </div>
    </section>
    
    <section class="shipments-section" style="margin-top: 24px;">
      <h2>Quality Reports</h2>
      <div style="background: white; border-radius: 8px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="border-bottom: 2px solid #e5e7eb;">
              <th style="text-align: left; padding: 12px;">Shipment ID</th>
              <th style="text-align: left; padding: 12px;">Route</th>
              <th style="text-align: left; padding: 12px;">Quality Status</th>
              <th style="text-align: left; padding: 12px;">Hub Triage</th>
              <th style="text-align: left; padding: 12px;">Bio-Shield</th>
              <th style="text-align: left; padding: 12px;">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${shipments.map(shipment => `
              <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 12px; font-weight: 500;">${shipment.id}</td>
                <td style="padding: 12px;">${shipment.origin} → ${shipment.destination}</td>
                <td style="padding: 12px;">
                  <span class="badge ${shipment.qualityStatus === 'Green' ? 'badge-green' : shipment.qualityStatus === 'Orange' ? 'badge-orange' : 'badge-red'}">${shipment.qualityStatus}</span>
                </td>
                <td style="padding: 12px;">
                  <span class="badge ${getHubTriageDisplay(shipment.hubTriageDecision).class}">${getHubTriageDisplay(shipment.hubTriageDecision).label}</span>
                </td>
                <td style="padding: 12px;">
                  ${shipment.bioShieldApplied ? '✅' : '❌'}
                </td>
                <td style="padding: 12px;">
                  <button class="btn-small" onclick="${shipment.qualityStatus === 'Green' ? `generateFreshnessReport('${shipment.id}')` : 'customAlert(\'Report unavailable for this shipment\')'}" ${shipment.qualityStatus !== 'Green' ? 'disabled' : ''}>
                    📄 Report
                  </button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

// ========== RENDER SETTINGS VIEW ==========
function renderSettingsView() {
  const mainContent = document.querySelector(".main-content");
  
  // Load saved settings from localStorage
  const settings = JSON.parse(localStorage.getItem('qooa_settings')) || {
    emailAlerts: true,
    smsAlerts: true,
    whatsappAlerts: false,
    overlayModals: true,
    defaultModalSize: 'regular',
    criticalTemp: 28,
    criticalGas: 300
  };
  
  mainContent.innerHTML = `
    <header class="dashboard-header">
      <div class="header-left">
        <h1>⚙️ Settings</h1>
        <p>Configure your dashboard preferences</p>
      </div>
    </header>
    
    <section class="shipments-section">
      <div style="background: white; border-radius: 8px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); max-width: 800px;">
        <h3 style="margin-bottom: 20px;">System Configuration</h3>
        
        <form id="settingsForm" style="display: grid; gap: 20px;">
          <div>
            <label style="display: block; font-weight: 500; margin-bottom: 8px;">Notification Preferences</label>
            <label style="display: block; margin-bottom: 8px;">
              <input type="checkbox" id="emailAlerts" ${settings.emailAlerts ? 'checked' : ''}> Email alerts for critical temperature
            </label>
            <label style="display: block; margin-bottom: 8px;">
              <input type="checkbox" id="smsAlerts" ${settings.smsAlerts ? 'checked' : ''}> SMS alerts for gas level warnings
            </label>
            <label style="display: block; margin-bottom: 8px;">
              <input type="checkbox" id="whatsappAlerts" ${settings.whatsappAlerts ? 'checked' : ''}> WhatsApp notifications
            </label>
            <label style="display: block; margin-bottom: 8px;">
              <input type="checkbox" id="overlayModals" ${settings.overlayModals !== false ? 'checked' : ''}> Use overlay-style modals (centered)
            </label>
            <div style="margin-top:8px; margin-bottom:8px;">
              <label style="display:block; font-weight:500; margin-bottom:6px;">Default modal size</label>
              <select id="defaultModalSize" style="padding:8px; border:1px solid #d1d5db; border-radius:6px;">
                <option value="regular" ${settings.defaultModalSize === 'regular' ? 'selected' : ''}>Regular (centered)</option>
                <option value="small" ${settings.defaultModalSize === 'small' ? 'selected' : ''}>Small (compact)</option>
              </select>
            </div>
          </div>
          
          <div>
            <label style="display: block; font-weight: 500; margin-bottom: 8px;">Quality Thresholds</label>
            <div style="display: grid; gap: 12px;">
              <div>
                <label style="display: block; font-size: 13px; color: #6b7280; margin-bottom: 4px;">Critical Temperature (°C)</label>
                <input type="number" id="criticalTemp" value="${settings.criticalTemp}" min="15" max="35" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">
              </div>
              <div>
                <label style="display: block; font-size: 13px; color: #6b7280; margin-bottom: 4px;">Critical Gas Level (ppm)</label>
                <input type="number" id="criticalGas" value="${settings.criticalGas}" min="50" max="500" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">
              </div>
            </div>
          </div>
          
          <div>
            <label style="display: block; font-weight: 500; margin-bottom: 8px;">Hub Configuration</label>
            <div style="background: #f9fafb; padding: 12px; border-radius: 4px;">
              <p style="font-size: 13px; color: #6b7280; margin-bottom: 8px;">Active Hubs:</p>
              <p style="font-size: 14px;">📍 Kano Hub - Active</p>
              <p style="font-size: 14px;">📍 Jos Hub - Active</p>
            </div>
          </div>
          
          <div style="padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <div style="display:flex;gap:12px;align-items:center;">
              <button type="submit" class="btn-primary" id="saveSettingsBtn">Save Settings</button>
              <button type="button" class="btn-secondary" onclick="resetSettings()">Reset to Default</button>
              <button type="button" id="changePasswordBtn" class="btn-secondary" style="margin-left:auto;">Change Password</button>
            </div>
          </div>
        </form>
      </div>
    </section>
  `;
  
  // Note: dynamic event listeners (form submit, change password button) are
  // registered by setupDynamicEventListeners to avoid duplicate handlers.
}

// Apply modal style based on saved settings
function applyModalStyleFromSettings() {
  const settings = JSON.parse(localStorage.getItem('qooa_settings')) || {};
  const overlay = settings.overlayModals === undefined ? true : !!settings.overlayModals;
  if (!overlay) {
    document.body.classList.add('modal-side');
  } else {
    document.body.classList.remove('modal-side');
  }
}

// ========== SETUP DYNAMIC EVENT LISTENERS ==========
function setupDynamicEventListeners() {
  // New Order Button
  const newOrderBtn = document.getElementById("newOrderBtn");
  if (newOrderBtn) {
    newOrderBtn.addEventListener("click", openOrderModal);
  }

  // Settings change password button (inside file-based settings view)
  const changeBtn = document.getElementById('changePasswordBtn');
  if (changeBtn) {
    // Ensure clicking the settings view button opens the authenticated
    // change-password flow (no reset token). Pass an explicit empty string
    // so the modal will include the current-password field.
    changeBtn.addEventListener('click', () => openChangePasswordModal(''));
  }

  // Settings form submit (file-based settings view)
  const settingsForm = document.getElementById('settingsForm');
  if (settingsForm) {
    // Prevent duplicate handler attachments
    settingsForm.removeEventListener && settingsForm.removeEventListener('submit', saveSettings);
    settingsForm.addEventListener('submit', saveSettings);
  }
}

// ========== UPDATE STATISTICS ==========
function updateStats() {
  const stats = getStats();

  const totalShipmentsEl = document.getElementById("totalShipments");
  const inTransitEl = document.getElementById("inTransit");
  const bioShieldActiveEl = document.getElementById("bioShieldActive");
  const completedEl = document.getElementById("completed");

  if (totalShipmentsEl) totalShipmentsEl.textContent = stats.totalShipments;
  if (inTransitEl) inTransitEl.textContent = stats.inTransit;
  if (bioShieldActiveEl) bioShieldActiveEl.textContent = stats.bioShieldActive;
  if (completedEl) completedEl.textContent = stats.completed;
}

// ========== RENDER SHIPMENTS (Main Function) ==========
function renderShipments() {
  const container = document.getElementById("shipmentsContainer");

  if (!container) {
    console.error("Shipments container not found!");
    return;
  }

  // Clear existing content
  container.innerHTML = "";

  // Fetch shipments from data.js
  const list = typeof getShipments === 'function' ? getShipments() : (window.shipments || []);

  // Check if there are shipments
  if (!list || list.length === 0) {
    container.innerHTML = '<p class="loading">No shipments available</p>';
    return;
  }

  // Loop through shipments and create HTML cards
  list.forEach((shipment) => {
    const latestTelemetry = typeof getLatestTelemetry === 'function' ? getLatestTelemetry(shipment.id) : null;
    const card = createShipmentCard(shipment, latestTelemetry);
    container.appendChild(card);
  });
}

// ========== CREATE SHIPMENT CARD HTML ==========
function createShipmentCard(shipment, telemetry) {
  const card = document.createElement("div");
  card.className = "shipment-card";

  // Determine quality status badge color
  const qualityBadgeClass =
    shipment.qualityStatus === "Green"
      ? "badge-green"
      : shipment.qualityStatus === "Orange"
        ? "badge-orange"
        : "badge-red";

  // Hub Triage Decision Badge
  const triageDisplay = getHubTriageDisplay(shipment.hubTriageDecision);
  const triageBadge = `<span class="badge ${triageDisplay.class}">${triageDisplay.icon} ${triageDisplay.label}</span>`;

  // Field Heat Detection Badge
  const fieldHeatBadge = shipment.fieldHeatDetected
    ? '<span class="badge" style="background: #fef3c7; color: #92400e;">🌡️ Field Heat Extracted</span>'
    : "";

  // Network Status Badge (CRITICAL: Lokoja Gap Feature)
  let networkBadge = "";
  let sdSyncBadge = "";
  if (shipment.networkStatus === "offline") {
    networkBadge = '<span class="badge badge-offline">📡 Cached to SD</span>';
    if (shipment.sdSyncStatus && shipment.sdSyncStatus.pendingRecords > 0) {
      sdSyncBadge = `<span class="badge" style="background: #fef3c7; color: #92400e;">⏳ ${shipment.sdSyncStatus.pendingRecords} records pending sync</span>`;
    }
  } else {
    networkBadge = '<span class="badge badge-online">🌐 Online</span>';
    if (shipment.sdSyncStatus && shipment.sdSyncStatus.lastSyncTime) {
      const syncTime = formatTime(shipment.sdSyncStatus.lastSyncTime);
      sdSyncBadge = `<span class="badge" style="background: #d1fae5; color: #065f46;">✅ Synced at ${syncTime}</span>`;
    }
  }

  // Bio-Shield Badge
  const bioShieldBadge = shipment.bioShieldApplied
    ? '<span class="badge badge-green">🛡️ Bio-Shield</span>'
    : '<span class="badge" style="background: #fee2e2; color: #991b1b;">⚠️ No Bio-Shield</span>';

  // Alerts Badge
  let alertsBadge = "";
  if (shipment.alerts && shipment.alerts.length > 0) {
    const criticalAlerts = shipment.alerts.filter(
      (a) => a.severity === "red",
    ).length;
    const warningAlerts = shipment.alerts.filter(
      (a) => a.severity === "orange",
    ).length;
    if (criticalAlerts > 0) {
      alertsBadge = `<span class="badge badge-red">🚨 ${criticalAlerts} Critical Alert${criticalAlerts > 1 ? "s" : ""}</span>`;
    } else if (warningAlerts > 0) {
      alertsBadge = `<span class="badge badge-orange">⚠️ ${warningAlerts} Warning${warningAlerts > 1 ? "s" : ""}</span>`;
    }
  }

  card.innerHTML = `
        <div class="shipment-header">
            <div>
                <div class="shipment-id">${shipment.id}</div>
                <div class="shipment-route">
                    📍 ${shipment.origin} → ${shipment.destination}
                </div>
            </div>
            <span class="badge ${qualityBadgeClass}">${shipment.qualityStatus}</span>
        </div>

        <div class="shipment-details">
            <div class="detail-item">
                <span class="detail-label">Truck ID</span>
                <div class="detail-value">${shipment.truckId}</div>
            </div>
            <div class="detail-item">
                <span class="detail-label">Driver</span>
                <div class="detail-value">${shipment.driverName}</div>
            </div>
            <div class="detail-item">
                <span class="detail-label">Crates</span>
                <div class="detail-value">${shipment.crateCount} (${shipment.crateIds ? shipment.crateIds.length : 0} IDs)</div>
            </div>
            <div class="detail-item">
                <span class="detail-label">Current Location</span>
                <div class="detail-value">${shipment.currentLocation}</div>
            </div>
        </div>

        <!-- Hub Triage Section -->
        <div style="margin-top: 12px; padding: 8px; background: #f9fafb; border-radius: 6px;">
            <div style="font-size: 11px; color: #6b7280; margin-bottom: 4px;">Hub Triage Result:</div>
            ${triageBadge}
            ${fieldHeatBadge}
        </div>

        <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-top: 12px;">
            ${networkBadge}
            ${sdSyncBadge}
            ${bioShieldBadge}
            ${alertsBadge}
            <span class="badge badge-in-transit">${shipment.status}</span>
        </div>

        <div class="shipment-actions">
            <button class="btn-small" onclick="openTruckModal('${shipment.id}')">
                View Telemetry
            </button>
            ${
              alertsBadge
                ? `<button class="btn-small" style="background: #f59e0b;" onclick="viewAlerts('${shipment.id}')">
                📋 View Alerts
              </button>`
                : ""
            }
            ${
              shipment.qualityStatus === "Green" &&
              shipment.networkStatus === "online"
                ? `<button class="btn-small" style="background: #10b981;" onclick="generateFreshnessReport('${shipment.id}')">
                    📋 Freshness Report
                  </button>`
                : `<button class="btn-small" style="background: #d1d5db; color: #6b7280; cursor: not-allowed;" disabled>
                    📋 Report Unavailable
                  </button>`
            }
        </div>
    `;

  return card;
}

// ========== MODAL LOGIC: OPEN TRUCK TELEMETRY MODAL ==========
function openTruckModal(shipmentId) {
  const shipment = getShipmentById(shipmentId);
  const latestTelemetry = getLatestTelemetry(shipmentId);
  const telemetryHistory = getShipmentTelemetryHistory(shipmentId);

  if (!shipment) {
    customAlert("Shipment not found!", "Shipment");
    return;
  }

  const modal = document.getElementById("truckModal");

  // Populate modal header
  document.getElementById("modalShipmentId").textContent = shipment.id;
  document.getElementById("modalTruckId").textContent = shipment.truckId;

  // Populate Current Readings (Latest Telemetry)
  if (latestTelemetry) {
    populateCurrentReadings(latestTelemetry, shipment);
  } else {
    document.getElementById("currentReadings").innerHTML =
      "<p>No telemetry data available</p>";
  }

  // Populate Timeline (Full History)
  populateTelemetryTimeline(telemetryHistory);

  // Show modal
  modal.style.display = "flex";
}

// ========== POPULATE CURRENT SENSOR READINGS ==========
function populateCurrentReadings(telemetry, shipment) {
  const container = document.getElementById("currentReadings");

  // Calculate status for each sensor
  const tempStatus = getTempStatus(telemetry.temperature);
  const gasStatus = getGasStatus(telemetry.gasLevel);
  const humidityStatus = getHumidityStatus(telemetry.humidity);

  // Network Status
  const networkDisplay =
    shipment.networkStatus === "offline"
      ? '📡 <span style="color: #f59e0b;">Cached to SD (Offline)</span>'
      : '🌐 <span style="color: #10b981;">Online</span>';

  container.innerHTML = `
        <div class="sensor-card">
            <div class="sensor-icon">🌡️</div>
            <div class="sensor-data">
                <h4>Temperature</h4>
                <div class="sensor-value ${tempStatus.class}">${telemetry.temperature}°C</div>
                <div class="sensor-unit">${tempStatus.label}</div>
            </div>
        </div>

        <div class="sensor-card">
            <div class="sensor-icon">💨</div>
            <div class="sensor-data">
                <h4>Ethylene Gas</h4>
                <div class="sensor-value ${gasStatus.class}">${telemetry.gasLevel} ppm</div>
                <div class="sensor-unit">${gasStatus.label}</div>
            </div>
        </div>

        <div class="sensor-card">
            <div class="sensor-icon">💧</div>
            <div class="sensor-data">
                <h4>Humidity</h4>
                <div class="sensor-value ${humidityStatus.class}">${telemetry.humidity}%</div>
                <div class="sensor-unit">${humidityStatus.label}</div>
            </div>
        </div>

        <div class="sensor-card">
            <div class="sensor-icon">📡</div>
            <div class="sensor-data">
                <h4>Network Status</h4>
                <div class="sensor-value">${networkDisplay}</div>
                <div class="sensor-unit">${telemetry.location.name}</div>
            </div>
        </div>

        <!-- Hub Entry Data Section -->
        <div class="sensor-card" style="grid-column: 1 / -1; background: #f9fafb;">
            <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                <div>
                    <h4 style="color: #374151; margin-bottom: 8px;">🏭 Hub Triage Results</h4>
                    <div style="display: flex; gap: 16px; flex-wrap: wrap;">
                        <div>
                            <span style="font-size: 12px; color: #6b7280;">Initial Temp:</span>
                            <strong style="margin-left: 4px; color: #111827;">${shipment.hubTemperature}°C</strong>
                        </div>
                        <div>
                            <span style="font-size: 12px; color: #6b7280;">Initial Gas:</span>
                            <strong style="margin-left: 4px; color: #111827;">${shipment.hubGasReading} ppm</strong>
                        </div>
                        <div>
                            <span style="font-size: 12px; color: #6b7280;">Initial Humidity:</span>
                            <strong style="margin-left: 4px; color: #111827;">${shipment.hubHumidity}%</strong>
                        </div>
                    </div>
                </div>
                <div style="text-align: right;">
                    ${getHubTriageDisplay(shipment.hubTriageDecision).icon}
                    <div style="font-size: 11px; color: #6b7280; margin-top: 4px;">${formatTime(shipment.hubTriageTimestamp)}</div>
                </div>
            </div>
        </div>
    `;
}

// ========== POPULATE TELEMETRY TIMELINE ==========
function populateTelemetryTimeline(history) {
  const container = document.getElementById("telemetryTimeline");

  if (!history || history.length === 0) {
    container.innerHTML = "<p>No historical data available</p>";
    return;
  }

  container.innerHTML = '<div class="timeline">';

  // Reverse to show most recent first
  const reversedHistory = [...history].reverse();

  reversedHistory.forEach((reading) => {
    const tempStatus = getTempStatus(reading.temperature);
    const gasStatus = getGasStatus(reading.gasLevel);
    const overallStatus = getOverallStatus(
      reading.temperature,
      reading.gasLevel,
    );

    const timeFormatted = new Date(reading.timestamp).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    container.innerHTML += `
            <div class="timeline-item">
                <div class="timeline-marker ${overallStatus}"></div>
                <div class="timeline-content">
                    <h4>${reading.location.name}</h4>
                    <div class="timeline-time">${timeFormatted}</div>
                    <div class="timeline-readings">
                        <span class="${tempStatus.class}">🌡️ ${reading.temperature}°C</span>
                        <span class="${gasStatus.class}">💨 ${reading.gasLevel} ppm</span>
                        <span>💧 ${reading.humidity}%</span>
                        <span>${reading.networkStatus === "online" ? "🌐 Online" : "📡 Offline"}</span>
                    </div>
                </div>`;
  });

  container.innerHTML += '</div>';
}

// ========== MODAL FUNCTIONS ==========
function openOrderModal() {
  const modal = document.getElementById("orderModal");
  if (modal) {
    modal.style.display = "flex";
  }
}

function closeOrderModal() {
  const modal = document.getElementById("orderModal");
  if (modal) {
    modal.style.display = "none";
  }
}

function closeTruckModal() {
  const modal = document.getElementById("truckModal");
  if (modal) {
    modal.style.display = "none";
  }
}

function closeAllModals() {
  const modals = document.querySelectorAll(".modal");
  modals.forEach((modal) => {
    modal.style.display = "none";
  });
}

// Reusable modal API
let _reusableOnOpen = null;
function openReusableModal(opts) {
  // opts: { title, body, footer, onOpen }
  const modal = document.getElementById('reusableModal');
  if (!modal) return;
  const titleEl = document.getElementById('reusableModalTitle');
  const bodyEl = document.getElementById('reusableModalBody');
  const footerEl = document.getElementById('reusableModalFooter');
  const contentEl = document.getElementById('reusableModalContent');

  titleEl.innerHTML = opts.title || '';
  bodyEl.innerHTML = opts.body || '';
  footerEl.innerHTML = opts.footer || '';

  // size handling: opts.size === 'small' -> add modal-small class
  if (contentEl) {
    let size = (opts && opts.size) || null;
    if (!size) {
      // read default from settings
      try {
        const s = JSON.parse(localStorage.getItem('qooa_settings') || '{}');
        size = s.defaultModalSize || null;
      } catch (e) {
        size = null;
      }
    }
    if (size === 'small') contentEl.classList.add('modal-small'); else contentEl.classList.remove('modal-small');
  }

  modal.style.display = 'flex';
  modal.setAttribute('aria-hidden', 'false');

  // store onOpen to allow cleanup if needed
  _reusableOnOpen = typeof opts.onOpen === 'function' ? opts.onOpen : null;
  if (_reusableOnOpen) {
    try { _reusableOnOpen(); } catch (e) { console.error('reusableModal onOpen error', e); }
  }
}

function closeReusableModal() {
  const modal = document.getElementById('reusableModal');
  if (!modal) return;
  modal.style.display = 'none';
  modal.setAttribute('aria-hidden', 'true');
  // clear contents to avoid stale handlers/elements
  const titleEl = document.getElementById('reusableModalTitle');
  const bodyEl = document.getElementById('reusableModalBody');
  const footerEl = document.getElementById('reusableModalFooter');
  const contentEl = document.getElementById('reusableModalContent');
  if (titleEl) titleEl.innerHTML = '';
  if (bodyEl) bodyEl.innerHTML = '';
  if (footerEl) footerEl.innerHTML = '';
  if (contentEl) contentEl.classList.remove('modal-small');
  _reusableOnOpen = null;
}

// ========== MODAL HELPERS ==========
function openChangePasswordModal(token) {
  // Use the reusable modal to show change-password form
  // Prefer an explicit argument. If `token` is provided (even an empty string)
  // use it; otherwise fall back to the token in the URL (reset link flow).
  let tokenVal;
  if (typeof token !== 'undefined') {
    tokenVal = token || '';
  } else {
    tokenVal = new URLSearchParams(window.location.search).get('token') || '';
  }
  // Add an inline error container so server-side messages can appear in the modal
  let body = `<div id="reusableChangePwdErr" style="color:#b00020;font-size:13px;display:none;margin-bottom:8px;"></div><form id="changePasswordForm">`;
  body += `<input type="hidden" id="changeToken" name="token" value="${tokenVal}" />`;

  // If no token is provided (logged in flow), ask for the current password
  if (!tokenVal) {
    body += `
      <div class="form-group">
        <label for="currentPassword">Old password</label>
        <div style="display:flex;gap:8px;align-items:center;">
          <input type="password" id="currentPassword" required style="flex:1;" />
          <button type="button" class="btn-secondary" onclick="togglePasswordVisibility('currentPassword')">👁️</button>
        </div>
      </div>`;
  }

  body += `
    <div class="form-group">
      <label for="newPassword">New password</label>
      <div style="display:flex;gap:8px;align-items:center;">
        <input type="password" id="newPassword" required style="flex:1;" />
        <button type="button" class="btn-secondary" onclick="togglePasswordVisibility('newPassword')">👁️</button>
      </div>
    </div>
  `;

  // Only ask for confirm password when using token-based reset (public flow)
  if (tokenVal) {
    body += `
      <div class="form-group">
        <label for="confirmPassword">Confirm new password</label>
        <div style="display:flex;gap:8px;align-items:center;">
          <input type="password" id="confirmPassword" required style="flex:1;" />
          <button type="button" class="btn-secondary" onclick="togglePasswordVisibility('confirmPassword')">👁️</button>
        </div>
      </div>
    `;
  }

  body += `</form>`;
  const footer = `<button class="btn-primary" onclick="(function(e){ e.preventDefault && e.preventDefault(); document.getElementById('changePasswordForm').dispatchEvent(new Event('submit',{cancelable:true})); })(event)">Save password</button> <button class="btn-secondary" onclick="closeReusableModal()">Cancel</button>`;
  openReusableModal({ title: 'Change Password', body: body, footer: footer, size: 'small', onOpen: () => {
    const f = document.getElementById('changePasswordForm');
    if (f) f.addEventListener('submit', handleChangePasswordSubmit);
    const first = document.getElementById('currentPassword') || document.getElementById('newPassword'); if (first) first.focus();
  }});
}

function closeChangePasswordModal() {
  // change password now uses the reusable modal
  closeReusableModal();
}

function togglePasswordVisibility(fieldId) {
  const f = document.getElementById(fieldId);
  if (!f) return;
  f.type = (f.type === 'password') ? 'text' : 'password';
}

function handleChangePasswordSubmit(e) {
  e.preventDefault();
  try{ console && console.log && console.log('[pwd] handleChangePasswordSubmit called'); }catch(e){}
  const newP = document.getElementById('newPassword') ? document.getElementById('newPassword').value : '';
  const confirmEl = document.getElementById('confirmPassword');
  const confirmP = confirmEl ? confirmEl.value : null;
  // If confirm field is present (token reset flow) require confirmation
  if (!newP || (confirmEl && !confirmP)) {
    showToast('Please fill the required password fields');
    return;
  }
  if (confirmEl && newP !== confirmP) {
    showToast('New passwords do not match');
    return;
  }
  const backend = window.BACKEND_URL || 'https://qooa-865bc6c8db3f.herokuapp.com';

  // Determine the form and prefer authenticated change endpoint when the form contains a current-password input
  const formEl = document.getElementById('changePasswordForm');
  const currentEl = (formEl && (formEl.querySelector('#currentPassword') || formEl.querySelector('#settingsCurrentPassword') || formEl.querySelector('[name=currentPassword]'))) || null;

  // helper to display errors inside the reusable modal (fallback to toast)
  function setModalError(msg) {
    try {
      const el = document.getElementById('reusableChangePwdErr');
      if (el) { el.textContent = msg; el.style.display = 'block'; return; }
    } catch (e) { /* ignore */ }
    showToast(msg);
  }

  if (currentEl) {
    const current = (currentEl.value || '').trim();
    if (!current) {
      setModalError('Please enter your old password');
      return;
    }

    (async () => {
      try {
        const session = checkAuthentication();
        console && console.log && console.log('[pwd] session from checkAuthentication', session);
        const token = session && session.token ? session.token : null;
        console && console.log && console.log('[pwd] using token', token);
        if (!token) {
          setModalError('Not authenticated');
          return;
        }

        const res = await fetch(`${backend.replace(/\/$/, '')}/api/vendors/change-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ currentPassword: current, newPassword: newP }),
        });
        console && console.log && console.log('[pwd] change-password response status', res.status);

        const body = await res.json().catch(() => ({}));
        console && console.log && console.log('[pwd] change-password response body', body);
        if (!res.ok) {
          setModalError(body.message || 'Failed to change password');
          return;
        }
        closeChangePasswordModal();
        showToast(body.message || 'Password changed successfully');
      } catch (err) {
        console.error('Change password error', err);
        setModalError('Network error while changing password');
      }
    })();
    return;
  }

  // Otherwise this is a token-based reset flow
  const tokenInput = document.getElementById('changeToken');
  const tokenVal = tokenInput ? tokenInput.value : '';
  if (tokenVal) {
    // Try to include email if present in querystring
    const email = new URLSearchParams(window.location.search).get('email') || '';
    (async () => {
      try {
        const res = await fetch(`${backend.replace(/\/$/, '')}/api/auth/reset-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: tokenVal, email, newPassword: newP }),
        });
        console && console.log && console.log('[pwd] reset-password response status', res.status);
        const body = await res.json().catch(() => ({}));
        console && console.log && console.log('[pwd] reset-password response body', body);
        if (!res.ok) {
          setModalError(body.message || 'Failed to reset password');
          return;
        }
        // Clear token and close modal
        if (tokenInput) tokenInput.value = '';
        closeChangePasswordModal();
        showToast('Password has been reset. You can now login.');
      } catch (err) {
        console.error('Reset password error', err);
        setModalError('Network error while resetting password');
      }
    })();
    return;
  }

  // No further fallback — token-based reset and authenticated change are handled above.
}

// Simple toast utility
function showToast(message, duration = 3000) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = message;
  el.classList.add('show');
  el.style.display = 'block';
  setTimeout(() => {
    el.classList.remove('show');
    el.style.display = 'none';
  }, duration);
}

// Custom alert dialog that uses the reusable modal for consistent styling
function customAlert(message, title = 'Alert') {
  // If reusable modal isn't available, fallback to toast
  if (typeof openReusableModal !== 'function') {
    showToast(message);
    return;
  }

  const body = `<div style="padding:8px 0;">${message}</div>`;
  const footer = `<button class="btn-primary" onclick="closeReusableModal()">OK</button>`;
  openReusableModal({ title, body, footer, size: 'small' });
}

// ========== UI HELPERS ==========
function populateVendorGreeting() {
  const el = document.getElementById('vendorGreeting');
  if (!el) return;
  const session = checkAuthentication();
  if (session && session.vendor && session.vendor.name) {
    el.textContent = `Welcome back, ${session.vendor.name}`;
  } else if (session && session.name) {
    el.textContent = `Welcome back, ${session.name}`;
  } else {
    el.textContent = 'Welcome to QOOA Control Tower';
  }
}

function setLastUpdated(date) {
  const el = document.getElementById('lastUpdated');
  if (!el) return;
  try {
    el.textContent = 'Last updated: ' + new Date(date).toLocaleString();
  } catch (e) {
    el.textContent = 'Last updated: —';
  }
}

// ========== ADDITIONAL FUNCTIONS ==========
function handleNewOrder(e) {
  e.preventDefault();
  const origin = document.getElementById("orderOrigin").value;
  const destination = document.getElementById("orderDestination").value;
  const crates = parseInt(document.getElementById("orderCrates").value, 10) || 0;
  const bioShield = document.getElementById("orderBioShield").checked;

  // Use the data.js helper to create a new order
  let created = null;
  try {
    created = createNewOrder({ origin, destination, crates, bioShield });
  } catch (err) {
    console.error('Failed to create order:', err);
  }

  // Refresh UI: if on shipments/dashboard view, re-render shipments
  try {
    // Close modal first
    closeOrderModal();
    // Show confirmation toast
    if (created) {
      showToast(`Order ${created.id} created successfully`);
    } else {
      showToast('Order created');
    }
    // If current view is shipments or dashboard, refresh list
    const h = window.location.hash.replace('#', '').toLowerCase();
    if (h === 'shipments' || h === '' || h === 'dashboard') {
      try { renderShipments(); } catch (e) { /* ignore */ }
    }
  } catch (e) {
    console.error(e);
  }
}

function handleLogout() {
  localStorage.removeItem("qooa_session");
  window.location.href = "index.html";
}

function viewAlerts(shipmentId) {
  const shipment = getShipmentById(shipmentId);
  if (shipment && shipment.alerts) {
    let alertMessage = `Alerts for ${shipment.id}:\n\n`;
    shipment.alerts.forEach((alert, index) => {
      alertMessage += `${index + 1}. [${alert.severity.toUpperCase()}] ${alert.message}\n`;
    });
    customAlert(alertMessage.replace(/\n/g, '<br>'), `Alerts — ${shipment.id}`);
  }
}

function generateFreshnessReport(shipmentId) {
  const shipment = getShipmentById(shipmentId);
  if (shipment) {
    const cert = `Freshness Certificate Generated!\n\nShipment: ${shipment.id}\nQuality Status: ${shipment.qualityStatus}\nTemperature: Maintained within range\nGas Levels: Within acceptable limits\n\nCertificate ID: FC-${Date.now()}`;
    customAlert(cert.replace(/\n/g,'<br>'), 'Freshness Certificate');
  }
}

// Share telemetry: use Web Share API when available, otherwise copy to clipboard
function shareTelemetry(shipmentId) {
  const shipment = getShipmentById(shipmentId);
  const telemetry = getLatestTelemetry(shipmentId);
  if (!shipment || !telemetry) {
    showToast('Telemetry not available to share');
    return;
  }

  const title = `Telemetry — ${shipment.id}`;
  const text = `Shipment: ${shipment.id}\nTruck: ${shipment.truckId}\nLocation: ${telemetry.location.name}\nTemperature: ${telemetry.temperature}°C\nEthylene Gas: ${telemetry.gasLevel} ppm\nHumidity: ${telemetry.humidity}%\nStatus: ${shipment.qualityStatus}`;
  const url = window.location.origin + window.location.pathname + '#telemetry';

  // Use Web Share API if available
  if (navigator.share) {
    if (_shareInProgress) {
      showToast('Previous share still in progress. Please complete it before sharing again.');
      return;
    }
    _shareInProgress = true;
    navigator.share({ title, text, url }).then(() => {
      showToast('Telemetry shared');
      _shareInProgress = false;
    }).catch((err) => {
      console.warn('Share failed', err);
      _shareInProgress = false;
      // If share failed due to an earlier share still pending, try a short retry
      if (err && err.name === 'InvalidStateError') {
        // attempt fallback to clipboard with a small delay to allow native share to settle
        setTimeout(() => tryCopyTelemetry(text), 300);
      } else {
        // immediate fallback to clipboard
        tryCopyTelemetry(text);
      }
    });
    return;
  }

  // Fallback: copy to clipboard
  tryCopyTelemetry(text);

  function tryCopyTelemetry(t) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(t).then(() => {
        showToast('Telemetry copied to clipboard');
      }).catch((err) => {
        console.error('Clipboard failed', err);
        showToast('Unable to copy telemetry');
      });
    } else {
      // Last resort: prompt
      window.prompt('Copy telemetry data', t);
    }
  }
}

function showWhatsAppDemo() {
  // Render a WhatsApp sample conversation inside the reusable modal
  const body = `
    <div class="whatsapp-sample-body">
      <div class="chat-window">
        <div class="chat-message incoming">
          <div class="chat-meta">QOOA Bot • 09:12</div>
          <div class="chat-text">Hello! Send 'Order &lt;qty&gt; crates from &lt;origin&gt; to &lt;destination&gt;'</div>
        </div>
        <div class="chat-message outgoing">
          <div class="chat-meta">You • 09:13</div>
          <div class="chat-text">Order 30 crates from Kano Hub to Mile 12 Market</div>
        </div>
        <div class="chat-message incoming">
          <div class="chat-meta">QOOA Bot • 09:13</div>
          <div class="chat-text">Order received ✅. Pickup scheduled. Tracking: SHP-004</div>
        </div>
      </div>
    </div>
  `;
  openReusableModal({ title: 'WhatsApp — Sample Order', body: body, footer: '<button class="btn-secondary" onclick="closeReusableModal()">Close</button>', size: 'small' });
}

function openWhatsAppSampleModal() {
  // Use the reusable modal to show the WhatsApp sample
  showWhatsAppDemo();
}

function closeWhatsAppSampleModal() {
  closeReusableModal();
}

function saveSettings(e) {
  e.preventDefault();
  
  const settings = {
    emailAlerts: document.getElementById('emailAlerts').checked,
    smsAlerts: document.getElementById('smsAlerts').checked,
    whatsappAlerts: document.getElementById('whatsappAlerts').checked,
    overlayModals: document.getElementById('overlayModals') ? document.getElementById('overlayModals').checked : true,
    defaultModalSize: document.getElementById('defaultModalSize') ? document.getElementById('defaultModalSize').value : 'regular',
    criticalTemp: parseInt(document.getElementById('criticalTemp').value),
    criticalGas: parseInt(document.getElementById('criticalGas').value)
  };
  
  localStorage.setItem('qooa_settings', JSON.stringify(settings));
  
  // Apply modal style immediately
  try { applyModalStyleFromSettings(); } catch (e) { /* ignore */ }

  customAlert('✅ Settings saved successfully!<br><br>Your preferences have been updated.', 'Settings');
}

function resetSettings() {
  const defaultSettings = {
    emailAlerts: true,
    smsAlerts: true,
    whatsappAlerts: false,
    criticalTemp: 28,
    criticalGas: 300
  };
  
  localStorage.setItem('qooa_settings', JSON.stringify(defaultSettings));
  
  // Re-render the settings view
  renderSettingsView();
  
  customAlert('✅ Settings reset to default values!', 'Settings');
}