import { createRouter } from "@tanstack/react-router"

import { authContext } from "@/features/auth/session"
import { authStore } from "@/features/auth/store/auth-store"
import { queryClient } from "@/lib/query-client"
import { routeTree } from "./routeTree.gen"

export const router = createRouter({
  routeTree,
  context: { queryClient, auth: authContext },
  defaultPreload: "intent",
  defaultPreloadStaleTime: 0,
  scrollRestoration: true,
})

// Re-run route guards whenever who-is-logged-in changes: logging in moves the user
// off /auth/*, logging out (or a failed token refresh) moves them off protected
// pages — immediately, not on their next click. Token rotations that keep the same
// user and role are ignored.
let previous = authStore.getState()
authStore.subscribe(() => {
  const next = authStore.getState()
  if (next.status !== previous.status || next.role !== previous.role) {
    void router.invalidate()
  }
  previous = next
})

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router
  }
}
