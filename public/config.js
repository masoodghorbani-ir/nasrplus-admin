/**
 * Runtime app config — editable AFTER deploy (no rebuild needed).
 * Copied into dist/ as-is. On IIS, edit:  <site>/config.js
 *
 * After changing, hard-refresh the browser (Ctrl+F5).
 */
window.__APP_CONFIG__ = {
  // Full API base including /api/v1
  API_BASE_URL: 'https://api.nasrplus.ir/api/v1',
};
