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

export function getApiBaseUrl(): string {
  const raw =
    import.meta.env.VITE_API_BASE_URL ||
    'https://ticketing-backend-general.vercel.app/api';
  return raw.replace(/\/+$/, '');
}

/** Same key as RegisterCompany reads for landing → app handoff */
export const REGISTER_PREFILL_STORAGE_KEY = 'tik_register_prefill';

/** Set from pricing CTAs; appended to register URL and read in the dashboard after signup */
export const SELECTED_PLAN_STORAGE_KEY = 'tik_selected_plan';
