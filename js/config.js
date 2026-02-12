// Global frontend configuration
// Set backend URL used across the frontend. If an environment or page already
// sets window.BACKEND_URL, we respect that (helps local development).
window.BACKEND_URL = window.BACKEND_URL || 'https://qooa-865bc6c8db3f.herokuapp.com';

// Expose a helper to get the backend base URL trimmed of trailing slash
window.getBackendUrl = function () {
  try { return (window.BACKEND_URL || '').replace(/\/$/, ''); } catch (e) { return ''; }
};
