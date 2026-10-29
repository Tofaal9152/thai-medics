// Only VITE_-prefixed vars reach the browser, and every one of them ends up in
// the built bundle — never put a secret here (the old SESSION_* vars were
// server-only and deliberately dropped).
export const env = {
  BACKEND_URL: import.meta.env.VITE_BACKEND_URL,
  isDevelopment: import.meta.env.DEV,
}
