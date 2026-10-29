import { createFileRoute, Outlet } from "@tanstack/react-router"

import { requireGuest } from "@/features/auth/guards"

// Guest-only area: login, signup, password reset. A logged-in user is sent on to
// ?redirect= or their role's home — which is also how a successful login leaves
// this page (the auth store change re-runs this guard).
export const Route = createFileRoute("/auth")({
  beforeLoad: ({ context, location }) =>
    requireGuest(context.auth, location.search),
  component: Outlet,
})
