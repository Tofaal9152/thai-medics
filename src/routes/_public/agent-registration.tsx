import { createFileRoute } from "@tanstack/react-router"
import AgentRegistrationPage from "@/features/workspace/pages/agent-registration"
export const Route = createFileRoute("/_public/agent-registration")({
  component: AgentRegistrationPage,
})
