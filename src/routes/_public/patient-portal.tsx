import { createFileRoute } from "@tanstack/react-router"
import { PatientPortal } from "@/features/workspace/pages/portals"
export const Route = createFileRoute("/_public/patient-portal")({
  component: PatientPortal,
})
