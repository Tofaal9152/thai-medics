import { createFileRoute, Outlet } from "@tanstack/react-router"

import { requireRole } from "@/features/auth/guards"

// Every page under /admin/* is ADMIN-only. Add pages next to index.tsx.
export const Route = createFileRoute("/_authed/admin")({
  beforeLoad: ({ context }) => requireRole(context.auth, "ADMIN"),
  component: Outlet,
})
