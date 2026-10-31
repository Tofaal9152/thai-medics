import { useEffect, useState } from "react"
import type { ReactNode } from "react"
import { toast } from "@/components/ui/toast"
import { today } from "@/features/dashboard/data"
import type { Language, Office, Patient } from "@/features/dashboard/data"
import { blankMeta, rolePermissions, uid } from "./model"
import type { DemoSession, Permission, Values, WorkspaceData } from "./model"
import { loadWorkspace, seedWorkspace } from "./seed"
import { WorkspaceContext } from "./context"
import { syncAccounts } from "./billing"
import i18n from "@/i18n"
export default function WorkspaceProvider({
  children,
}: {
  children: ReactNode
}) {
  const [data, setData] = useState(loadWorkspace)
  const [session, setSession] = useState<DemoSession>(() => {
    try {
      const saved = JSON.parse(
        sessionStorage.getItem("thai-medics-demo-session") || "null"
      ) as DemoSession | null
      if (saved && saved.role in rolePermissions) return saved
    } catch {
      /* Use the default demo persona. */
    }
    return {
      authenticated: true,
      role: "Admin",
      name: "Mahi Ahmed",
      office: "Management",
      staffId: "staff-1",
      caseId: "",
      agentId: "agent-1",
    }
  })
  const [lang, setLang] = useState<Language>("en"),
    [office, setOffice] = useState<Office>("All offices")
  useEffect(() => {
    try {
      localStorage.setItem("thai-medics-full-demo-v1", JSON.stringify(data))
    } catch {
      toast.add({
        title: "Storage could not be saved",
        description: "Your current changes will last until reload.",
        type: "warning",
      })
    }
  }, [data])
  useEffect(() => {
    try {
      sessionStorage.setItem(
        "thai-medics-demo-session",
        JSON.stringify(session)
      )
    } catch {
      /* The session still works in memory. */
    }
  }, [session])
  useEffect(() => {
    document.documentElement.lang = lang
    void i18n.changeLanguage(lang)
  }, [lang])
  const currentStaff = data.collections.staff.find(
    (s) => s.id === session.staffId
  )
  function can(permission: Permission) {
    if (!session.authenticated || currentStaff?.values.status === "Inactive")
      return false
    if (session.role === "Custom")
      return (currentStaff?.values.permissions || "")
        .split("|")
        .includes(permission)
    return rolePermissions[session.role].includes(permission)
  }
  function commit(
    text: string,
    update: (d: WorkspaceData) => WorkspaceData,
    kind = "update"
  ) {
    setData((prev) => {
      const next = syncAccounts(update(prev))
      return {
        ...next,
        activity: [
          {
            id: uid("audit"),
            text: `${session.name}: ${text}`,
            at: new Date().toISOString(),
            kind,
          },
          ...next.activity,
        ].slice(0, 1000),
      }
    })
    toast.add({ title: text, type: "success" })
  }
  function createCase(values: Values): Patient {
    const serial =
      Math.max(
        0,
        ...data.patients.map((p) => Number(p.id.split("-").at(-1)) || 0)
      ) + 1
    const patient: Patient = {
      id: `TMD-${today().slice(0, 4)}-${String(serial).padStart(4, "0")}`,
      name: values.name.trim(),
      phone: values.phone.trim(),
      city: values.city || "",
      hospital: "Not assigned",
      department: values.department || "General medicine",
      need: values.need || "",
      coordinator: values.coordinator || "Nusrat Jahan",
      thaiCoordinator: "Not assigned",
      office: values.office === "Thailand" ? "Thailand" : "Bangladesh",
      stage: 0,
      source: values.source || "Website",
      created: today(),
      appointment: "",
      time: "",
      doctor: "",
      arrival: "",
      currency:
        (values.currency || data.settings.currency) === "USD"
          ? "USD"
          : (values.currency || data.settings.currency) === "THB"
            ? "THB"
            : "BDT",
      billed: 0,
      paid: 0,
      supplierDue: 0,
      notes: [],
    }
    commit(
      `Created patient case ${patient.id}`,
      (prev) => ({
        ...prev,
        patients: [patient, ...prev.patients],
        caseMeta: {
          ...prev.caseMeta,
          [patient.id]: {
            ...blankMeta(),
            agentId: values.agentId || "",
            passport: values.passport || "",
            email: values.email || "",
            companion: values.companion || "",
          },
        },
      }),
      "case"
    )
    return patient
  }
  function reset() {
    setData(seedWorkspace())
    setOffice("All offices")
    toast.add({ title: "All fictional records restored", type: "success" })
  }
  return (
    <WorkspaceContext.Provider
      value={{
        data,
        setData,
        session,
        setSession,
        lang,
        setLang,
        office,
        setOffice,
        can,
        commit,
        reset,
        createCase,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  )
}
