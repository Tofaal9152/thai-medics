import { createFileRoute } from "@tanstack/react-router"
import LoginPage from "@/features/workspace/pages/portals"
export const Route = createFileRoute("/_public/login")({ component: LoginPage })
