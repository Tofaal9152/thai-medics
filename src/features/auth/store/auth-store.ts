import { useSyncExternalStore } from "react";

import type { AuthRole, AuthUser } from "@/features/auth/schema";

type AuthState = {
  status: "pending" | "authenticated" | "unauthenticated";
  access: string | null;
  user: AuthUser | null;
  role: AuthRole | null;
};

const initialState: AuthState = {
  status: "pending",
  access: null,
  user: null,
  role: null,
};

let state = initialState;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

// Client-only singleton: the access token lives in memory for the lifetime of the
// tab and is never persisted. On app mount it is re-derived from the stored refresh
// token — see token-storage.ts for where that one lives and why.
export const authStore = {
  getState: () => state,

  setAuthenticated: (data: { access: string; user: AuthUser; role: AuthRole }) => {
    state = { status: "authenticated", ...data };
    emit();
  },

  setAccess: (access: string) => {
    state = { ...state, status: "authenticated", access };
    emit();
  },

  setUnauthenticated: () => {
    state = { ...initialState, status: "unauthenticated" };
    emit();
  },

  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

export function useAuth() {
  return useSyncExternalStore(authStore.subscribe, authStore.getState, () => initialState);
}
