import { QueryClient } from "@tanstack/react-query"

import type { ApiError } from "@/lib/http/api-client"

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

// Errors reaching queries come from the axios response interceptor.
declare module "@tanstack/react-query" {
  interface Register {
    defaultError: ApiError
  }
}
