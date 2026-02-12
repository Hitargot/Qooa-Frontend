// QOOA Control Tower - Mock Data & Telemetry Database

// ========== SHIPMENTS ARRAY ==========
const shipments = [
  {
    id: "SHP-001",
    origin: "Kano Agricultural Hub",
    destination: "Oshodi Market, Lagos",
    truckId: "TRK-101",
    driverName: "Musa Ibrahim",
    crateCount: 450,
    crateIds: ["CRT-K001", "CRT-K002", "CRT-K003"], // QR-scanned crate IDs
    hubGasReading: 52, // ppm (Green: < 100ppm)
    hubTemperature: 18.5, // °C (Green: 12-20°C)
    hubHumidity: 88, // % (Green: 85-95%)
    fieldHeatDetected: false, // Initial temp was < 25°C
    hubTriageDecision: "APPROVED", // GREEN LED - Proceed to Lagos
    hubTriageTimestamp: "2026-02-03T06:25:00",
    bioShieldApplied: true,
    status: "In Transit",
    qualityStatus: "Green",
    departureTime: "2026-02-03T06:30:00",
    estimatedArrival: "2026-02-04T14:00:00",
    currentLocation: "Lokoja Junction", // LOKOJA GAP - Offline Zone
    networkStatus: "offline", // CRITICAL: Lokoja Gap Feature
    sdSyncStatus: {
      lastSyncTime: "2026-02-03T12:20:00",
      pendingRecords: 12, // Records cached to SD, awaiting sync
      totalRecordsLogged: 24,
    },
    alerts: [], // No alerts - smooth journey so far
  },
  {
    id: "SHP-002",
    origin: "Jos Tomato Farms",
    destination: "Mile 12 Market, Lagos",
    truckId: "TRK-208",
    driverName: "Fatima Bello",
    crateCount: 320,
    crateIds: ["CRT-J101", "CRT-J102"], // QR-scanned crate IDs
    hubGasReading: 85, // ppm (Green: < 100ppm)
    hubTemperature: 19.8, // °C (Green: 12-20°C)
    hubHumidity: 90, // % (Green: 85-95%)
    fieldHeatDetected: false, // Initial temp was < 25°C
    hubTriageDecision: "APPROVED", // GREEN LED - Proceed to Lagos
    hubTriageTimestamp: "2026-02-03T07:10:00",
    bioShieldApplied: true,
    status: "In Transit",
    qualityStatus: "Green",
    departureTime: "2026-02-03T07:15:00",
    estimatedArrival: "2026-02-04T16:30:00",
    currentLocation: "Abuja - Kaduna Highway",
    networkStatus: "online",
    sdSyncStatus: {
      lastSyncTime: "2026-02-03T13:50:00",
      pendingRecords: 0, // All synced - network stable
      totalRecordsLogged: 18,
    },
    alerts: [], // No alerts - optimal conditions
  },
  {
    id: "SHP-003",
    origin: "Kano Agricultural Hub",
    destination: "Ikeja Wholesale Market, Lagos",
    truckId: "TRK-315",
    driverName: "Ahmed Yusuf",
    crateCount: 510,
    crateIds: ["CRT-K050", "CRT-K051", "CRT-K052", "CRT-K053"], // QR-scanned crate IDs
    hubGasReading: 320, // ppm (Red: > 300ppm) - DANGER
    hubTemperature: 29.2, // °C (Red: > 28°C) - DANGER
    hubHumidity: 68, // % (Red: < 70% - Drying out)
    fieldHeatDetected: true, // Initial temp was 26°C - LCD showed "EXTRACT HEAT"
    hubTriageDecision: "REJECTED_BUT_SHIPPED", // RED LED - Should NOT ship, but vendor overrode
    hubTriageTimestamp: "2026-02-03T04:55:00",
    bioShieldApplied: false,
    status: "In Transit",
    qualityStatus: "Red", // CRITICAL: Danger Mode
    departureTime: "2026-02-03T05:00:00",
    estimatedArrival: "2026-02-04T12:00:00",
    currentLocation: "Ibadan Interchange",
    networkStatus: "online",
    sdSyncStatus: {
      lastSyncTime: "2026-02-03T14:20:00",
      pendingRecords: 0, // All synced
      totalRecordsLogged: 28,
    },
    alerts: [
      {
        timestamp: "2026-02-03T11:45:00",
        type: "WARNING",
        severity: "orange",
        message: "Temperature approaching critical threshold (27.1°C)",
        location: "Abuja Expressway",
        smsStatus: "sent",
      },
      {
        timestamp: "2026-02-03T14:20:00",
        type: "OVERHEAT",
        severity: "red",
        message:
          "CRITICAL: Temperature exceeded 28°C. Gas level >300ppm. CHECK VENTILATION NOW.",
        location: "Ibadan Interchange",
        smsStatus: "sent",
        driverResponse: "acknowledged",
      },
    ],
  },
];

// ========== TELEMETRY DATABASE (Sensor History) ==========
const telemetryDatabase = {
  "SHP-001": [
    {
      timestamp: "2026-02-03T06:30:00",
      location: { lat: 12.0022, lng: 8.5919, name: "Kano Agricultural Hub" },
      temperature: 18.5,
      humidity: 65,
      gasLevel: 52,
      networkStatus: "online",
    },
    {
      timestamp: "2026-02-03T09:45:00",
      location: { lat: 10.5225, lng: 7.439, name: "Kaduna Checkpoint" },
      temperature: 18.9,
      humidity: 63,
      gasLevel: 55,
      networkStatus: "online",
    },
    {
      timestamp: "2026-02-03T12:20:00",
      location: { lat: 9.082, lng: 7.4914, name: "Abuja Expressway" },
      temperature: 19.3,
      humidity: 61,
      gasLevel: 58,
      networkStatus: "online",
    },
    {
      timestamp: "2026-02-03T15:40:00",
      location: { lat: 7.7985, lng: 6.7385, name: "Lokoja Junction" },
      temperature: 19.1,
      humidity: 62,
      gasLevel: 52,
      networkStatus: "offline", // LOKOJA GAP - Last Reading Before Offline
    },
  ],
  "SHP-002": [
    {
      timestamp: "2026-02-03T07:15:00",
      location: { lat: 9.8965, lng: 8.8583, name: "Jos Tomato Farms" },
      temperature: 19.8,
      humidity: 68,
      gasLevel: 85,
      networkStatus: "online",
    },
    {
      timestamp: "2026-02-03T10:30:00",
      location: { lat: 9.0579, lng: 7.4951, name: "Abuja - Kaduna Highway" },
      temperature: 19.5,
      humidity: 66,
      gasLevel: 88,
      networkStatus: "online",
    },
    {
      timestamp: "2026-02-03T13:50:00",
      location: { lat: 8.9896, lng: 7.1872, name: "Niger State Border" },
      temperature: 19.2,
      humidity: 64,
      gasLevel: 82,
      networkStatus: "online",
    },
  ],
  "SHP-003": [
    {
      timestamp: "2026-02-03T05:00:00",
      location: { lat: 12.0022, lng: 8.5919, name: "Kano Agricultural Hub" },
      temperature: 22.3,
      humidity: 70,
      gasLevel: 145, // Orange range initially
      networkStatus: "online",
    },
    {
      timestamp: "2026-02-03T08:15:00",
      location: { lat: 10.5225, lng: 7.439, name: "Kaduna Checkpoint" },
      temperature: 24.8,
      humidity: 72,
      gasLevel: 210, // Orange range - Warning
      networkStatus: "online",
    },
    {
      timestamp: "2026-02-03T11:45:00",
      location: { lat: 9.082, lng: 7.4914, name: "Abuja Expressway" },
      temperature: 27.1,
      humidity: 74,
      gasLevel: 285, // Still Orange but climbing
      networkStatus: "online",
    },
    {
      timestamp: "2026-02-03T14:20:00",
      location: { lat: 7.3775, lng: 3.947, name: "Ibadan Interchange" },
      temperature: 29.2, // RED ZONE: > 28°C
      humidity: 76,
      gasLevel: 320, // RED ZONE: > 300ppm
      networkStatus: "online", // DANGER MODE - Bio-Shield Not Applied!
    },
  ],
};

// ========== HELPER FUNCTIONS ==========

/**
 * Get the latest telemetry reading for a shipment
 * @param {string} shipmentId - The shipment ID (e.g., 'SHP-001')
 * @returns {object|null} - Latest telemetry data or null if not found
 */
function getLatestTelemetry(shipmentId) {
  const history = telemetryDatabase[shipmentId];
  if (!history || history.length === 0) {
    return null;
  }
  return history[history.length - 1];
}

/**
 * Get the full telemetry history for a shipment
 * @param {string} shipmentId - The shipment ID
 * @returns {array} - Array of telemetry readings (oldest to newest)
 */
function getShipmentTelemetryHistory(shipmentId) {
  return telemetryDatabase[shipmentId] || [];
}

/**
 * Get a shipment by ID
 * @param {string} shipmentId - The shipment ID
 * @returns {object|null} - Shipment object or null if not found
 */
function getShipmentById(shipmentId) {
  return shipments.find((s) => s.id === shipmentId) || null;
}

/**
 * Create a new order (B2B vendor placement)
 * @param {object} orderData - Order details {origin, destination, crates, bioShield}
 * @returns {object} - New shipment object
 */
function createNewOrder(orderData) {
  const newShipmentId = `SHP-${String(shipments.length + 1).padStart(3, "0")}`;
  const newTruckId = `TRK-${Math.floor(Math.random() * 900) + 100}`;

  const newShipment = {
    id: newShipmentId,
    origin: orderData.origin,
    destination: orderData.destination,
    truckId: newTruckId,
    driverName: "Pending Assignment",
    crateCount: orderData.crates,
    crateIds: [], // Will be assigned during processing
    hubGasReading: 0,
    hubTemperature: 0,
    hubHumidity: 0,
    fieldHeatDetected: false,
    hubTriageDecision: "PENDING",
    hubTriageTimestamp: null,
    bioShieldApplied:
      orderData.bioShield === "true" || orderData.bioShield === true,
    status: "Pending",
    qualityStatus: "Green",
    departureTime: null,
    estimatedArrival: null,
    currentLocation: orderData.origin,
    networkStatus: "online",
    sdSyncStatus: {
      lastSyncTime: null,
      pendingRecords: 0,
      totalRecordsLogged: 0,
    },
    alerts: [],
  };

  shipments.push(newShipment);
  telemetryDatabase[newShipmentId] = [];

  return newShipment;
}

/**
 * Get all shipments
 * @returns {array} - Array of all shipments
 */
function getShipments() {
  return shipments;
}

/**
 * Get statistics summary
 * @returns {object} - Stats object with counts
 */
function getStats() {
  const inTransit = shipments.filter((s) => s.status === "In Transit").length;
  const bioShieldActive = shipments.filter((s) => s.bioShieldApplied).length;
  const completed = shipments.filter((s) => s.status === "Completed").length;

  return {
    totalShipments: shipments.length,
    inTransit: inTransit,
    bioShieldActive: bioShieldActive,
    completed: completed,
  };
}

// ========== EXPORT FOR USE IN OTHER FILES ==========
// Note: In production, you'd use ES6 modules. For vanilla JS, these are globally accessible.
