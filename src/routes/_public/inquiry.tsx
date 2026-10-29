import { createFileRoute } from "@tanstack/react-router"
import { InquiryPage } from "@/features/workspace/pages/portals"
export const Route = createFileRoute("/_public/inquiry")({
  component: InquiryPage,
})
