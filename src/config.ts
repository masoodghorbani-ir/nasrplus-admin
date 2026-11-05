/**
 * Runtime + build-time config helpers.
 * Production: edit /config.js after deploy (no rebuild).
 * Local dev: VITE_API_BASE_URL in .env wins when present.
 */

export interface AppConfig {
  API_BASE_URL: string;
}

declare global {
  interface Window {
    __APP_CONFIG__?: Partial<AppConfig>;
  }
}

const DEFAULT_API_BASE_URL = 'https://api.nasrplus.ir/api/v1';

function normalizeBaseUrl(url: string): string {
  return url.trim().replace(/\/+$/, '');
}

/** API base URL, e.g. https://api.nasrplus.ir/api/v1 */
export function getApiBaseUrl(): string {
  const fromVite = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim();
  // Prefer .env during local Vite dev so public/config.js can stay on production defaults
  if (import.meta.env.DEV && fromVite) {
    return normalizeBaseUrl(fromVite);
  }

  const fromRuntime = window.__APP_CONFIG__?.API_BASE_URL?.trim();
  if (fromRuntime) {
    return normalizeBaseUrl(fromRuntime);
  }

  if (fromVite) {
    return normalizeBaseUrl(fromVite);
  }

  return DEFAULT_API_BASE_URL;
}

/** Server origin without /api/v1 — used for static file / upload URLs */
export function getServerUrl(): string {
  const fromVite = (import.meta.env.VITE_SERVER_URL as string | undefined)?.trim();
  if (import.meta.env.DEV && fromVite) {
    return normalizeBaseUrl(fromVite);
  }

  if (fromVite) {
    return normalizeBaseUrl(fromVite);
  }

  return getApiBaseUrl().replace(/\/api\/v1\/?$/, '') || DEFAULT_API_BASE_URL.replace(/\/api\/v1\/?$/, '');
}
