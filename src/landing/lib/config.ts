/** Same origin as this SPA (register lives on /register-company). */
export function getMainAppOrigin(): string {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  const raw =
    import.meta.env.VITE_MAIN_APP_URL ||
    'http://localhost:3000';
  return String(raw).replace(/\/+$/, '');
}

const PRODUCTION_API_FALLBACK =
  'https://ticketing-backend-general.vercel.app/api';

/** VITE_API_BASE_URL, else localhost:9091 on local SPA host, else production API. */
export function getApiBaseUrl(): string {
  const fromEnv = import.meta.env.VITE_API_BASE_URL;
  if (fromEnv != null && String(fromEnv).trim() !== '') {
    return String(fromEnv).replace(/\/+$/, '');
  }
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      return 'http://localhost:9091/api';
    }
  }
  return PRODUCTION_API_FALLBACK.replace(/\/+$/, '');
}

/** Same key as RegisterCompany reads for landing → app handoff */
export const REGISTER_PREFILL_STORAGE_KEY = 'tik_register_prefill';

/** Set from pricing CTAs; appended to register URL and read in the dashboard after signup */
export const SELECTED_PLAN_STORAGE_KEY = 'tik_selected_plan';
