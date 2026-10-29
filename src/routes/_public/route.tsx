import { createFileRoute, Outlet } from "@tanstack/react-router"
import WorkspaceProvider from "@/features/workspace/provider"
import WorkspaceLayout from "@/features/workspace/components/layout"
export const Route = createFileRoute("/_public")({ component: PublicLayout })
function PublicLayout() {
  return (
    <WorkspaceProvider>
      <WorkspaceLayout>
        <Outlet />
      </WorkspaceLayout>
    </WorkspaceProvider>
  )
}
