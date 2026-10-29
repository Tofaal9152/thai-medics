import { createContext, useContext } from "react"
import type { Dispatch, SetStateAction } from "react"
import type { Language, Office, Patient } from "@/features/dashboard/data"
import type { DemoSession, Permission, Values, WorkspaceData } from "./model"
export type WorkspaceContextValue = {
  data: WorkspaceData
  setData: Dispatch<SetStateAction<WorkspaceData>>
  session: DemoSession
  setSession: Dispatch<SetStateAction<DemoSession>>
  lang: Language
  setLang: Dispatch<SetStateAction<Language>>
  office: Office
  setOffice: Dispatch<SetStateAction<Office>>
  can: (permission: Permission) => boolean
  commit: (
    text: string,
    update: (data: WorkspaceData) => WorkspaceData,
    kind?: string
  ) => void
  reset: () => void
  createCase: (values: Values) => Patient
}
export const WorkspaceContext = createContext<WorkspaceContextValue | null>(
  null
)
export function useWorkspace() {
  const value = useContext(WorkspaceContext)
  if (!value) throw new Error("Workspace provider is missing.")
  return value
}
