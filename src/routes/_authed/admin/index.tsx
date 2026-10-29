import { createFileRoute } from "@tanstack/react-router"

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export const Route = createFileRoute("/_authed/admin/")({
  component: AdminDashboard,
})

function AdminDashboard() {
  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-semibold tracking-tight">
        Admin dashboard
      </h1>
      <Card>
        <CardHeader>
          <CardTitle>Only admins can see this page</CardTitle>
          <CardDescription>
            Add admin pages under <code>src/routes/_authed/admin/</code> — they
            inherit the ADMIN guard from <code>route.tsx</code>.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  )
}
