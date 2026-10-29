import type { QueryClient } from "@tanstack/react-query"
import {
  createRootRouteWithContext,
  Link,
  Outlet,
} from "@tanstack/react-router"

import { Toaster } from "@/components/ui/toast"
import type { AuthContext } from "@/features/auth/session"

export type RouterContext = {
  queryClient: QueryClient
  auth: AuthContext
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
  notFoundComponent: NotFound,
})

// Deliberately bare: page chrome belongs to layout routes (_public, _authed)
// so the auth pages can render full-screen without a nav bar over them.
function RootLayout() {
  return (
    <>
      <Outlet />
      <Toaster />
    </>
  )
}

function NotFound() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-2 p-8">
      <h1 className="text-xl font-semibold">Page not found</h1>
      <p className="text-sm text-muted-foreground">
        That route does not exist.{" "}
        <Link to="/" className="underline underline-offset-4">
          Go home
        </Link>
        .
      </p>
    </div>
  )
}
