import axios, { AxiosError } from "axios"
import type { InternalAxiosRequestConfig } from "axios"

import { refreshAccessFn } from "@/features/auth/api"
import { authStore } from "@/features/auth/store/auth-store"
import { env } from "@/lib/env"

export type ApiError = {
  status: number | null
  message: string
  details?: unknown
}

const apiClient = axios.create({
  baseURL: env.BACKEND_URL,
  timeout: 15_000,
})

apiClient.interceptors.request.use((config) => {
  const { access } = authStore.getState()

  if (access) {
    config.headers.Authorization = `Bearer ${access}`
  }

  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (!(error instanceof AxiosError) || !error.config) {
      return Promise.reject(error)
    }

    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const { access } = await refreshAccessFn()

        if (!access) {
          authStore.setUnauthenticated()
          return Promise.reject(error)
        }

        authStore.setAccess(access)
        originalRequest.headers.Authorization = `Bearer ${access}`
        return apiClient(originalRequest)
      } catch (refreshError) {
        authStore.setUnauthenticated()
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

// Normalizes an unknown thrown value into something renderable. Kept separate
// from the interceptor so AxiosError still reaches useMutationHandler intact.
export function toApiError(error: unknown): ApiError {
  if (error instanceof AxiosError) {
    const data = error.response?.data as { message?: string } | undefined

    return {
      status: error.response?.status ?? null,
      message: data?.message ?? error.message,
      details: error.response?.data,
    }
  }

  return { status: null, message: "Something went wrong. Please try again." }
}

export default apiClient
