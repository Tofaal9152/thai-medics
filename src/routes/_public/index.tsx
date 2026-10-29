import { createFileRoute } from "@tanstack/react-router"
import Dashboard from "@/features/dashboard/pages/overview"

export const Route = createFileRoute("/_public/")({ component: Dashboard })
