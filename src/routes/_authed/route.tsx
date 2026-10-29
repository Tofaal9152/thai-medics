import { createFileRoute, Link, Outlet } from "@tanstack/react-router"

import { ModeToggle } from "@/components/mode-toggle"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { requireAuth } from "@/features/auth/guards"
import { roleHome } from "@/features/auth/roles"
import { logout } from "@/features/auth/session"
import { useAuth } from "@/features/auth/store/auth-store"

// Everything under this pathless layout requires a login — any role. The role
// checks live one level down, in admin/route.tsx and student/route.tsx.
export const Route = createFileRoute("/_authed")({
  beforeLoad: ({ context, location }) =>
    requireAuth(context.auth, location.href),
  component: AuthedLayout,
})

function AuthedLayout() {
  const { user, role } = useAuth()
  const name = [user?.first_name, user?.last_name].filter(Boolean).join(" ")

  return (
    <div className="min-h-svh bg-background text-foreground">
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-6 py-3">
          <Link to={roleHome(role)} className="font-heading text-sm font-semibold">
            vite/stack
          </Link>
          {role && <Badge variant="secondary">{role.toLowerCase()}</Badge>}

          <div className="ml-auto flex items-center gap-2">
            <span className="hidden text-sm text-muted-foreground sm:inline">
              {name || user?.email}
            </span>
            <ModeToggle />
            <Button variant="outline" onClick={() => void logout()}>
              Log out
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        <Outlet />
      </main>
    </div>
  )
}
