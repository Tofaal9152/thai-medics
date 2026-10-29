import { createFileRoute, Outlet } from "@tanstack/react-router"

import { requireRole } from "@/features/auth/guards"

// Every page under /student/* is STUDENT-only. Add pages next to index.tsx.
export const Route = createFileRoute("/_authed/student")({
  beforeLoad: ({ context }) => requireRole(context.auth, "STUDENT"),
  component: Outlet,
})
