import { registerAgent } from "../src/features/workspace/agent-registration"
import { afterEach, describe, expect, test } from "bun:test"
import { createElement } from "react"
import { renderToString } from "react-dom/server"
import { QueryClient } from "@tanstack/react-query"
import {
  createMemoryHistory,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router"
import { routeTree } from "../src/routeTree.gen"
import { authContext } from "../src/features/auth/session"
import { seedWorkspace } from "../src/features/workspace/seed"
import type { DemoSession } from "../src/features/workspace/model"
import "../src/i18n"

const originalLocal = Object.getOwnPropertyDescriptor(
  globalThis,
  "localStorage"
)
const originalSession = Object.getOwnPropertyDescriptor(
  globalThis,
  "sessionStorage"
)
afterEach(() => {
  for (const [key, descriptor] of [
    ["localStorage", originalLocal],
    ["sessionStorage", originalSession],
  ] as const) {
    if (descriptor) Object.defineProperty(globalThis, key, descriptor)
    else Reflect.deleteProperty(globalThis, key)
  }
})
function installSession(session?: Partial<DemoSession>) {
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: { getItem: () => null },
  })
  Object.defineProperty(globalThis, "sessionStorage", {
    configurable: true,
    value: {
      getItem: () =>
        session
          ? JSON.stringify({
              authenticated: true,
              role: "Admin",
              name: "Demo user",
              office: "Management",
              staffId: "staff-1",
              caseId: "",
              agentId: "",
              ...session,
            })
          : null,
    },
  })
}
async function renderRoute(path: string) {
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [path] }),
    context: { queryClient: new QueryClient(), auth: authContext },
  })
  await router.load()
  expect(router.state.matches.every((m) => m.status === "success")).toBe(true)
  return renderToString(createElement(RouterProvider, { router }))
}
describe("full frontend route rendering and demo access", () => {
  test("every staff module renders its real page without a backend", async () => {
    installSession()
    const modules: Record<string, string> = {
      patients: "Patient cases",
      calendar: "Follow-up calendar",
      accounts: "Accounts &amp; billing",
      hospitals: "Hospital directory",
      doctors: "Doctor management",
      agents: "Agent network",
      visas: "Medical visa desk",
      leads: "Lead &amp; inquiry hub",
      messages: "Messaging &amp; reminders",
      promotions: "Newsletter &amp; promotions",
      packages: "Packages &amp; quote comparison",
      ground: "Thailand ground services",
      aftercare: "Aftercare &amp; feedback",
      staff: "Staff &amp; permissions",
      reports: "Reports &amp; analytics",
      audit: "Audit history",
      settings: "System &amp; settings",
    }
    for (const [module, title] of Object.entries(modules)) {
      const html = await renderRoute(`/workspace/${module}`)
      expect(html).toContain(title)
      expect(html).not.toContain("This workspace is not available")
      expect(html).not.toContain("Something went wrong")
    }
    expect(await renderRoute("/patients/TMD-2026-0001")).toContain(
      "Shirin Akter"
    )
    expect(await renderRoute("/inquiry")).toContain("Medical need")
    expect(await renderRoute("/login")).toContain(
      "Continue to verification"
    )
  })
  test("supplier/vendor UI is on hold while patient billing and ground services remain available", async () => {
    installSession()
    const held = await renderRoute("/workspace/suppliers")
    expect(held).toContain("This section is currently on hold.")
    for (const route of [
      "/",
      "/workspace/accounts",
      "/workspace/settings",
      "/workspace/ground",
    ]) {
      const html = await renderRoute(route)
      expect(html).not.toContain('href="/workspace/suppliers"')
      expect(html).not.toContain("Supplier outstanding")
      expect(html).not.toContain("Supplier due")
      expect(html).not.toContain("Add supplier cost")
      expect(html).not.toContain("Record supplier payment")
      if (route.endsWith("accounts")) expect(html).toContain("Patient balance")
    }
  })
  test("promotions page includes patient actions, bulk selection, templates and restricted access", async () => {
    installSession()
    const html = await renderRoute("/workspace/promotions")
    expect(html).toContain("Shirin Akter")
    expect(html).toContain("Select all filtered patients")
    expect(html).toContain("Buy one, get one offer")
    expect(html).toContain("Bulk send")
    expect(html).toContain("Promotion history")
    installSession({ role: "Accounts", staffId: "staff-6" })
    const blocked = await renderRoute("/workspace/promotions")
    expect(blocked).toContain("This workspace is not available")
    expect(blocked).not.toContain("Compose a campaign")
  })
  test("public registration is available signed out, visible for staff review and cannot open the agent portal while pending", async () => {
    installSession({ authenticated: false })
    const publicPage = await renderRoute("/agent-registration")
    expect(publicPage).toContain("Register as an agent")
    expect(publicPage).toContain("Submit registration")
    expect(publicPage).toContain("Full name / contact person")
    expect(publicPage).not.toContain("You are signed out.")
    const data = registerAgent(
      seedWorkspace(),
      {
        name: "Pending Demo Agent",
        agentType: "Individual agent",
        district: "Dhaka",
        phone: "+880 1700 009999",
        email: "pending@example.test",
      },
      "pending-agent-test",
      "2026-10-31T10:00:00Z"
    )
    installSession()
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: {
        getItem: (key: string) =>
          key === "thai-medics-full-demo-v1" ? JSON.stringify(data) : null,
      },
    })
    const adminPage = await renderRoute("/workspace/agents")
    expect(adminPage).toContain("Pending Agent")
    expect(adminPage).toContain("Pending approval")
    expect(adminPage).toContain('href="/agent-registration"')
    installSession({
      role: "Agent",
      staffId: "",
      agentId: "pending-agent-test",
    })
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: {
        getItem: (key: string) =>
          key === "thai-medics-full-demo-v1" ? JSON.stringify(data) : null,
      },
    })
    const portal = await renderRoute("/agent-portal")
    expect(portal).toContain("pending approval or inactive")
    expect(portal).not.toContain("Refer a new patient")
    expect(portal).not.toContain("Your patient referrals")
  })
  test("visa desk separates visa records from air ambulance coordination and scopes linked requests", async () => {
    installSession()
    const visas = await renderRoute("/workspace/visas")
    expect(visas).toContain("Visa records")
    expect(visas).toContain("Emergency Air Ambulance")
    expect(visas).toContain("Medical visa desk")
    const ambulance = await renderRoute("/workspace/visas?tab=ambulance")
    expect(ambulance).toContain("Add emergency request")
    expect(ambulance).toContain("AA-DEMO-001")
    expect(ambulance).toContain("AA-DEMO-002")
    expect(ambulance).toContain("does not book or dispatch")
    const scoped = await renderRoute(
      "/workspace/visas?tab=ambulance&caseId=TMD-2026-0001"
    )
    expect(scoped).toContain("AA-DEMO-001")
    expect(scoped).not.toContain("AA-DEMO-002")
    installSession({ role: "Accounts", staffId: "staff-6" })
    expect(await renderRoute("/workspace/visas?tab=ambulance")).toContain(
      "This workspace is not available"
    )
  })
  test("patient portal shows one linked case and blocks the staff workspace", async () => {
    const data = seedWorkspace()
    const patient = data.patients[0]
    installSession({
      role: "Patient",
      staffId: "",
      caseId: patient.id,
      name: patient.name,
    })
    const html = await renderRoute("/patient-portal")
    expect(html).toContain(patient.name)
    expect(html).not.toContain(data.patients[1].name)
    expect(html).not.toContain("Supplier cost")
    expect(await renderRoute("/workspace/staff")).toContain(
      "This workspace is not available"
    )
  })
  test("agent portal limits referrals and hides clinical and internal financial data", async () => {
    const data = seedWorkspace()
    const own = data.patients.filter(
      (p) => data.caseMeta[p.id].agentId === "agent-1"
    )
    const other = data.patients.find((p) => !data.caseMeta[p.id].agentId)!
    installSession({ role: "Agent", staffId: "", agentId: "agent-1" })
    const html = await renderRoute("/agent-portal")
    expect(own.length).toBeGreaterThan(0)
    for (const p of own) expect(html).toContain(p.name)
    expect(html).not.toContain(other.name)
    expect(html).not.toContain("Supplier cost")
    expect(html).not.toContain("Medical report")
    expect(html).toContain('type="month"')
  })
  test("restricted roles cannot open finance or staff management directly", async () => {
    installSession({ role: "Coordinator", staffId: "staff-2" })
    expect(await renderRoute("/workspace/accounts")).toContain(
      "This workspace is not available"
    )
    expect(await renderRoute("/workspace/staff")).toContain(
      "This workspace is not available"
    )
    expect(await renderRoute("/workspace/patients")).not.toContain(
      "This workspace is not available"
    )
    installSession({ authenticated: false })
    expect(await renderRoute("/")).toContain("You are signed out.")
  })
})
