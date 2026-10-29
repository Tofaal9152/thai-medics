import { afterEach, describe, expect, test } from "bun:test"
import { createElement } from "react"
import { renderToString } from "react-dom/server"
import {
  createDemoData,
  dashboardSchema,
  dayOffset,
  inOffice,
  loadDemoData,
  saveDemoData,
  today,
} from "../src/features/dashboard/data"
import {
  accountSummary,
  searchPatients,
} from "../src/features/dashboard/selectors"
import Dashboard from "../src/features/dashboard/pages/overview"
import WorkspaceProvider from "../src/features/workspace/provider"

const originalStorage = Object.getOwnPropertyDescriptor(
  globalThis,
  "localStorage"
)
afterEach(() => {
  if (originalStorage)
    Object.defineProperty(globalThis, "localStorage", originalStorage)
  else Reflect.deleteProperty(globalThis, "localStorage")
})

function installStorage(initial?: string) {
  const entries = new Map<string, string>()
  if (initial) entries.set("thai-medics-dashboard-demo-v1", initial)
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem: (key: string) => entries.get(key) ?? null,
      setItem: (key: string, value: string) => entries.set(key, value),
    },
  })
}

describe("dashboard demo", () => {
  test("every case and follow-up links to valid, unique data across all nine stages", () => {
    const data = createDemoData()
    expect(dashboardSchema.safeParse(data).success).toBe(true)
    expect(data.patients).toHaveLength(32)
    expect(new Set(data.patients.map((p) => p.id)).size).toBe(32)
    expect(new Set(data.patients.map((p) => p.stage)).size).toBe(9)
    expect(data.patients.filter((p) => p.stage < 8)).toHaveLength(29)
    expect(
      data.tasks.every((task) =>
        data.patients.some((p) => p.id === task.caseId)
      )
    ).toBe(true)
    expect(
      data.tasks.filter((task) => !task.done && task.due === today())
    ).toHaveLength(4)
    expect(
      data.tasks.filter((task) => !task.done && task.due < today())
    ).toHaveLength(3)
  })

  test("search normalizes phone formatting and composes with stage, owner and office filters", () => {
    const { patients } = createDemoData()
    const patient = patients[0]
    expect(
      searchPatients(patients, patient.phone.replace(/[\s+]/g, ""), "", "")
    ).toEqual([patient])
    expect(
      searchPatients(patients, "SHIRIN", "3", patient.coordinator)
    ).toEqual([patient])
    expect(
      searchPatients(patients, "SHIRIN", "0", patient.coordinator)
    ).toEqual([])
    expect(searchPatients(patients, "+ - ( )", "", "")).toEqual([])
    const bd = patients.filter((p) => inOffice(p, "Bangladesh"))
    const th = patients.filter((p) => inOffice(p, "Thailand"))
    expect(bd.length + th.length).toBe(patients.length)
    expect(bd.some((p) => th.some((other) => p.id === other.id))).toBe(false)
  })

  test("account summaries never combine different currencies and preserve an overpayment credit", () => {
    const base = createDemoData().patients[0]
    const cases = [
      {
        ...base,
        currency: "BDT" as const,
        billed: 1000,
        paid: 1200,
        supplierDue: 75,
      },
      {
        ...base,
        currency: "USD" as const,
        billed: 999999,
        paid: 100,
        supplierDue: 20,
      },
    ]
    expect(accountSummary(cases, "BDT")).toEqual({
      billed: 1000,
      paid: 1200,
      due: 0,
      credit: 200,
      supplier: 75,
    })
    expect(accountSummary(cases, "THB")).toEqual({
      billed: 0,
      paid: 0,
      due: 0,
      credit: 0,
      supplier: 0,
    })
  })

  test("changes survive a storage round trip; corrupt data falls back to a usable demo", () => {
    installStorage()
    const changed = createDemoData()
    changed.tasks[0].done = true
    changed.patients[0].stage = 4
    changed.patients[0].notes.push(
      "A fictional note for the persistence check."
    )
    expect(saveDemoData(changed)).toBe(true)
    expect(loadDemoData()).toEqual(changed)
    installStorage('{"patients": ["invalid"]}')
    expect(loadDemoData().patients).toHaveLength(32)
  })

  test("storage failures do not prevent the frontend from loading", () => {
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      get() {
        throw new Error("Storage blocked")
      },
    })
    expect(loadDemoData().patients).toHaveLength(32)
    expect(saveDemoData(createDemoData())).toBe(false)
    expect(dayOffset(0)).toBe(today())
    expect(dayOffset(1) > today()).toBe(true)
  })

  test("the dashboard renders patient data, task actions and financial controls without a backend", () => {
    installStorage()
    const html = renderToString(
      createElement(WorkspaceProvider, { children: createElement(Dashboard) })
    )
    expect(html).toContain("Patient cases")
    expect(html).toContain("Shirin Akter")
    expect(html).toContain("Complete Collect remaining imaging reports")
    expect(html).toContain("Export CSV")
    expect(html).toContain("Account currency")
    expect(html).toContain("Fictional demo data")
  })
})
