import { createDemoAuth } from './demoAuth';
import { createApiAuth } from './apiAuth';
export const isDemo = import.meta.env.VITE_DEMO_MODE === 'true';
export const auth = isDemo ? createDemoAuth() : createApiAuth({
  base: (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, ''),
  storage: window.sessionStorage,
});
