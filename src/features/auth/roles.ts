import type { AuthRole } from "@/features/auth/schema"

// Where each role lands after login, and where it is sent back to when it opens a
// page it is not allowed on. The one place that maps roles to areas — add a role's
// area here rather than comparing roles inline across the app.
const ROLE_HOME = {
  ADMIN: "/admin",
  STUDENT: "/student",
  TEACHER: "/",
  UNKNOWN: "/",
} as const satisfies Record<AuthRole, string>

export function roleHome(role: AuthRole | null) {
  return role ? ROLE_HOME[role] : "/"
}

// Only same-site paths are honored for ?redirect=, so a crafted login link can't
// bounce a freshly logged-in user off to another origin.
export function safeRedirect(value: unknown): string | null {
  if (typeof value !== "string") return null
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) {
    return null
  }
  if (value === "/auth" || value.startsWith("/auth/")) return null

  return value
}
