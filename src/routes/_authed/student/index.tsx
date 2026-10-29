import { createFileRoute } from "@tanstack/react-router"

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export const Route = createFileRoute("/_authed/student/")({
  component: StudentDashboard,
})

function StudentDashboard() {
  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-semibold tracking-tight">
        Student dashboard
      </h1>
      <Card>
        <CardHeader>
          <CardTitle>Only students can see this page</CardTitle>
          <CardDescription>
            Add student pages under <code>src/routes/_authed/student/</code> —
            they inherit the STUDENT guard from <code>route.tsx</code>.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  )
}
