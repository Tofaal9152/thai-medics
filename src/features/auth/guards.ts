import { redirect } from "@tanstack/react-router"

import { roleHome, safeRedirect } from "@/features/auth/roles"
import type { AuthRole } from "@/features/auth/schema"
import type { AuthContext } from "@/features/auth/session"

// Route guards, called from `beforeLoad`. They run before the page renders and
// before its loaders fire, so a blocked user never sees a flash of the page and
// never triggers its API calls. Nested layouts compose them: `_authed` checks
// login, and `admin` / `student` under it check the role.
//
// These gate what the UI shows. They are not security — the backend must still
// authorize every request by role.

export async function requireAuth(auth: AuthContext, href: string) {
  await auth.ready()

  if (auth.getState().status !== "authenticated") {
    throw redirect({ to: "/auth/login", search: { redirect: href } })
  }
}

export async function requireRole(auth: AuthContext, role: AuthRole) {
  await auth.ready()

  const state = auth.getState()
  if (state.role !== role) {
    // Send them to their own area, never to login — they *are* logged in, and
    // login would bounce them straight back here in a loop.
    throw redirect({ to: roleHome(state.role) })
  }
}

// For /auth/*: a logged-in user has no business on login/signup, so send them to
// where they were headed (?redirect=) or to their role's home. This is also what
// completes a login: the store change re-runs this guard (see router.tsx).
export async function requireGuest(auth: AuthContext, search: unknown) {
  await auth.ready()

  const state = auth.getState()
  if (state.status !== "authenticated") return

  const target = safeRedirect((search as { redirect?: unknown }).redirect)
  if (target) {
    throw redirect({ href: target })
  }
  throw redirect({ to: roleHome(state.role) })
}
