import { logoutFn, refreshAccessFn } from "@/features/auth/api"
import { clearStoredProfile, getStoredProfile } from "@/features/auth/profile-storage"
import { authStore } from "@/features/auth/store/auth-store"
import { clearRefreshToken } from "@/features/auth/token-storage"

let ready: Promise<void> | null = null

// Resolves once the auth state is known — i.e. `status` is no longer "pending".
// Started once at app boot (main.tsx) and awaited by every route guard, so a
// logged-in user reloading a protected page is not bounced to login while the
// refresh call is still in flight. Public pages never wait on it.
export function ensureAuthReady(): Promise<void> {
  ready ??= restoreSession()
  return ready
}

async function restoreSession() {
  const profile = getStoredProfile()
  const { access } = await refreshAccessFn()

  if (access && profile) {
    authStore.setAuthenticated({ access, ...profile })
    return
  }

  // A token without a profile can't be routed (no role), and a profile without a
  // token is stale. Either way start clean rather than half-logged-in.
  clearRefreshToken()
  clearStoredProfile()
  authStore.setUnauthenticated()
}

export async function logout() {
  // Flip the UI first; the backend call is best-effort and must not delay it.
  authStore.setUnauthenticated()
  await logoutFn()
}

// What route guards read through the router context.
export const authContext = {
  ready: ensureAuthReady,
  getState: authStore.getState,
}

export type AuthContext = typeof authContext
