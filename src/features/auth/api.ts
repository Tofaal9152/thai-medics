import axios, { AxiosError } from "axios"

import { env } from "@/lib/env"
import {
  loginRequestSchema,
  loginResponseSchema,
  forgotPasswordRequestSchema,
  resetPasswordRequestSchema,
  type ClientAuthSession,
  type ForgotPasswordRequest,
  type LoginRequest,
  type ResetPasswordRequest,
} from "@/features/auth/schema"
import {
  clearStoredProfile,
  setStoredProfile,
} from "@/features/auth/profile-storage"
import {
  clearRefreshToken,
  getRefreshToken,
  setRefreshToken,
} from "@/features/auth/token-storage"

// A bare axios client on purpose: these calls must not pass through the shared
// apiClient, whose 401 interceptor calls back into refreshAccessFn() below.
const authClient = axios.create()

function backendUrl(path: string) {
  const base = (env.BACKEND_URL ?? "").replace(/\/+$/, "")
  return `${base}/${path.replace(/^\/+/, "")}`
}

// These were `createServerFn` handlers in the Start template. The bodies are the
// same; what changed is that they now run in the browser, so the refresh token is
// handed to token-storage.ts instead of a server-side session cookie. The
// `{ data }` argument shape is kept so callers read identically either way.

export async function loginFn({
  data,
}: {
  data: LoginRequest
}): Promise<
  ClientAuthSession | { success: false; status: string; message: string }
> {
  const payload = loginRequestSchema.parse(data)

  try {
    const res = await authClient.post(backendUrl("rest-auth/login/"), payload)
    const { refresh, ...clientSession } = loginResponseSchema.parse(res.data)

    // An unverified student gets tokens too, but must finish OTP first — keep
    // nothing, or a reload would quietly restore them as logged in.
    if (clientSession.status === "LOGIN_SUCCESS") {
      setRefreshToken(refresh)
      setStoredProfile({ user: clientSession.user, role: clientSession.role })
    }

    return clientSession
  } catch (err) {
    if (err instanceof AxiosError && err.response?.data) {
      const body = err.response.data as { status?: string; message?: string }
      return {
        success: false,
        status: body.status ?? "UNKNOWN_ERROR",
        message: body.message ?? "Something went wrong",
      }
    }
    throw err
  }
}

export async function logoutFn() {
  const refresh = getRefreshToken()

  if (refresh) {
    try {
      const { access } = await refreshAccess(refresh)
      await authClient.post(
        backendUrl("rest-auth/logout/"),
        {},
        { headers: { Authorization: `Bearer ${access}` } }
      )
    } catch {
      // best-effort: the stored token is cleared below regardless
    }
  }

  clearRefreshToken()
  clearStoredProfile()
  return { success: true }
}

async function refreshAccess(refresh: string) {
  const res = await authClient.post<{ access: string }>(
    backendUrl("get-access-token/"),
    { refresh }
  )
  return res.data
}

export async function refreshAccessFn(): Promise<{ access: string | null }> {
  const refresh = getRefreshToken()

  if (!refresh) {
    return { access: null }
  }

  try {
    const { access } = await refreshAccess(refresh)
    return { access }
  } catch {
    clearRefreshToken()
    clearStoredProfile()
    return { access: null }
  }
}

export async function requestPasswordResetFn({
  data,
}: {
  data: ForgotPasswordRequest
}): Promise<{ success: true }> {
  const payload = forgotPasswordRequestSchema.parse(data)

  try {
    await authClient.post(backendUrl("rest-auth/password/reset/"), payload)
  } catch (err) {
    // A 400 here almost always means "no account with this email/reg number" —
    // swallow it on purpose so this endpoint never reveals whether an
    // email/registration number is registered. Only real infra failures (5xx,
    // network) propagate, so the client can tell the user to actually retry.
    if (
      !(err instanceof AxiosError) ||
      !err.response ||
      err.response.status >= 500
    ) {
      throw err
    }
  }

  return { success: true }
}

type ResetPasswordResult =
  | { success: true }
  | { success: false; errors: Record<string, Array<string>> }

export async function confirmPasswordResetFn({
  data,
}: {
  data: ResetPasswordRequest
}): Promise<ResetPasswordResult> {
  const payload = resetPasswordRequestSchema.parse(data)

  try {
    await authClient.post(
      backendUrl("rest-auth/password/reset/confirm/"),
      payload
    )
    return { success: true }
  } catch (err) {
    if (err instanceof AxiosError && err.response?.data) {
      return {
        success: false,
        errors: err.response.data as Record<string, Array<string>>,
      }
    }
    throw err
  }
}
