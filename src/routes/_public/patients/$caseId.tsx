import { createFileRoute } from "@tanstack/react-router"
import CaseWorkspace from "@/features/workspace/pages/case-workspace"
export const Route = createFileRoute("/_public/patients/$caseId")({
  component: Page,
})
function Page() {
  const { caseId } = Route.useParams()
  return <CaseWorkspace key={caseId} caseId={caseId} />
}
