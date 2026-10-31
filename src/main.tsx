import { StrictMode } from "react"
import { QueryClientProvider } from "@tanstack/react-query"
import { RouterProvider } from "@tanstack/react-router"
import { createRoot } from "react-dom/client"

import "./index.css"
import "./i18n"
import { ThemeProvider } from "@/components/theme-provider"
import { queryClient } from "@/lib/query-client"
import { router } from "./router"

// The public dashboard is a browser-only demo. Protected routes restore their
// sessions through their own guards when the backend is connected later.

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider forcedTheme="light">
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </ThemeProvider>
  </StrictMode>
)
