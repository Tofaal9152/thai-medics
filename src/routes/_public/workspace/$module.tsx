import { createFileRoute } from "@tanstack/react-router"
import ModulePage from "@/features/workspace/pages/module"
export const Route = createFileRoute("/_public/workspace/$module")({
  validateSearch: (
    search: Record<string, unknown>
  ): { q?: string; tab?: string; caseId?: string } => ({
    q: typeof search.q === "string" ? search.q : undefined,
    tab: search.tab === "ambulance" ? "ambulance" : undefined,
    caseId: typeof search.caseId === "string" ? search.caseId : undefined,
  }),
  component: Page,
})
function Page() {
  const { module } = Route.useParams()
  return <ModulePage module={module} />
}
