import { z } from "zod"

import { authRoleSchema, authUserSchema } from "@/features/auth/schema"
import type { AuthRole, AuthUser } from "@/features/auth/schema"

// Remembers who is logged in (user + role) across reloads.
//
// The backend has no /me endpoint and its JWTs carry only `user_id`, so after a
// reload the refresh call can mint a new access token but cannot say whose it is.
// This profile fills that gap. It is not a credential: editing it only changes
// which screens the UI shows — every API call is still authorized by the backend
// against the real token. It is re-validated on every read, so a corrupted or
// hand-edited value is treated as "no profile" rather than trusted.
const PROFILE_KEY = "auth-profile"

const storedProfileSchema = z.object({
  user: authUserSchema,
  role: authRoleSchema,
})

export type StoredProfile = { user: AuthUser; role: AuthRole }

export function getStoredProfile(): StoredProfile | null {
  try {
    const raw = localStorage.getItem(PROFILE_KEY)
    if (!raw) return null

    const parsed = storedProfileSchema.safeParse(JSON.parse(raw))
    return parsed.success ? parsed.data : null
  } catch {
    return null
  }
}

export function setStoredProfile(profile: StoredProfile) {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile))
  } catch {
    // Blocked storage: the session simply won't survive a reload.
  }
}

export function clearStoredProfile() {
  try {
    localStorage.removeItem(PROFILE_KEY)
  } catch {
    // Nothing to do — see above.
  }
}
