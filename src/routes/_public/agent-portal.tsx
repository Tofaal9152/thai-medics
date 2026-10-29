import { createFileRoute } from "@tanstack/react-router"
import { AgentPortal } from "@/features/workspace/pages/portals"
export const Route = createFileRoute("/_public/agent-portal")({
  component: AgentPortal,
})
