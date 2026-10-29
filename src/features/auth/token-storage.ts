// The single place the refresh token is persisted: a first-party cookie written
// from the browser.
//
// This is NOT the httpOnly cookie the Start template used. Only a server's
// Set-Cookie header can mark a cookie httpOnly, so a cookie written here is
// readable by any script on this origin — the same XSS exposure as localStorage.
// What the flags below do buy:
//   - SameSite=Strict: never sent on cross-site requests (no CSRF surface).
//   - Secure (on https): never sent over plain http.
//   - Max-Age: expires on its own, like the old session (30 days).
//
// To move to a real httpOnly cookie later, the backend must set it on login and
// accept it on refresh (CORS with credentials). Then every function here becomes
// a no-op and the calls in api.ts switch to `withCredentials: true` — nothing
// outside this file and api.ts needs to change.
const REFRESH_TOKEN_COOKIE = "auth_refresh_token"
const MAX_AGE_SECONDS = 30 * 24 * 60 * 60

function cookieAttributes(maxAge: number) {
  const attributes = [`Max-Age=${maxAge}`, "Path=/", "SameSite=Strict"]

  // Plain-http dev servers would silently drop a Secure cookie in some browsers.
  if (window.location.protocol === "https:") {
    attributes.push("Secure")
  }

  return attributes.join("; ")
}

export function getRefreshToken(): string | null {
  const prefix = `${REFRESH_TOKEN_COOKIE}=`
  const entry = document.cookie
    .split("; ")
    .find((part) => part.startsWith(prefix))

  const value = entry ? decodeURIComponent(entry.slice(prefix.length)) : ""

  // A cleared cookie can linger as `name=` until the browser drops it.
  return value || null
}

export function setRefreshToken(refresh: string) {
  document.cookie = `${REFRESH_TOKEN_COOKIE}=${encodeURIComponent(refresh)}; ${cookieAttributes(MAX_AGE_SECONDS)}`
}

export function clearRefreshToken() {
  document.cookie = `${REFRESH_TOKEN_COOKIE}=; Expires=Thu, 01 Jan 1970 00:00:00 GMT; ${cookieAttributes(0)}`
}
