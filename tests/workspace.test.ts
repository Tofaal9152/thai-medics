import { describe, expect, test } from "bun:test"
import {
  calculateCharge,
  convertMinor,
  costLocked,
  issueDraftInvoice,
  parseAmount,
  parseRate,
  reverseLedger,
  totals,
} from "../src/features/workspace/billing"
import { seedWorkspace } from "../src/features/workspace/seed"
import { validateWorkspace } from "../src/features/workspace/schema"
import { agentCommissions } from "../src/features/workspace/commissions"
import { rolePermissions } from "../src/features/workspace/model"
import type { LedgerEntry } from "../src/features/workspace/model"
function entry(overrides: Partial<LedgerEntry> = {}): LedgerEntry {
  return {
    id: "test-entry",
    caseId: "test-case",
    kind: "service",
    description: "Isolated test fixture",
    currency: "BDT",
    rate: 1000000,
    originalMinor: 10000,
    amountMinor: 10000,
    date: "2026-10-29",
    fields: {},
    issued: "",
    reversalOf: "",
    reversedBy: "",
    reason: "",
    supplierId: "supplier-test",
    costId: "",
    by: "Test",
    ...overrides,
  }
}
describe("full workspace financial rules (isolated in-memory fixtures)", () => {
  test("rejects malformed amounts and preserves decimal minor units", () => {
    expect(parseAmount("1,234.56")).toBe(123456)
    expect(parseAmount("0.01")).toBe(1)
    expect(() => parseAmount("1.005")).toThrow()
    expect(() => parseAmount("-3")).toThrow()
    expect(() => parseAmount("")).toThrow()
  })
  test("manual FX uses half-up rounding for both positive and reversing entries", () => {
    expect(convertMinor(100000, parseRate("0.028"))).toBe(2800)
    expect(convertMinor(1, parseRate("0.5"))).toBe(1)
    expect(convertMinor(-1, parseRate("0.5"))).toBe(-1)
    expect(() => convertMinor(9000000000000, parseRate("1000"))).toThrow()
    expect(() => parseRate("0")).toThrow()
    expect(() => parseRate("1.0000001")).toThrow()
  })
  test("visa, air, hotel and land formulas validate quantities and dates", () => {
    expect(
      calculateCharge("visa", { quantity: "2", unit: "50", service: "20" })
    ).toBe(12000)
    expect(calculateCharge("air", { amount: "420", service: "15" })).toBe(43500)
    expect(
      calculateCharge("hotel", {
        rooms: "2",
        checkIn: "2026-10-29",
        checkOut: "2026-11-01",
        unit: "100",
      })
    ).toBe(60000)
    expect(calculateCharge("land", { quantity: "3", unit: "25" })).toBe(7500)
    expect(() =>
      calculateCharge("hotel", {
        rooms: "1",
        checkIn: "2026-10-29",
        checkOut: "2026-10-28",
        unit: "100",
      })
    ).toThrow()
    expect(() =>
      calculateCharge("visa", { quantity: "1.5", unit: "10" })
    ).toThrow()
  })
  test("draft charges, discounts, refunds and internal profit stay distinct", () => {
    const result = totals([
      entry({ issued: "INV-TEST" }),
      entry({ id: "draft", amountMinor: 2500 }),
      entry({
        id: "discount",
        kind: "discount",
        amountMinor: 500,
        issued: "INV-TEST",
      }),
      entry({ id: "payment", kind: "payment", amountMinor: 4000 }),
      entry({ id: "refund", kind: "refund", amountMinor: 1000 }),
      entry({ id: "cost", kind: "supplier-cost", amountMinor: 2000 }),
    ])
    expect(result.billed).toBe(12000)
    expect(result.posted).toBe(9500)
    expect(result.draft).toBe(2500)
    expect(result.paid).toBe(3000)
    expect(result.balance).toBe(9000)
    expect(result.invoicedProfit).toBe(7500)
    expect(result.estimatedProfit).toBe(10000)
  })
  test("a reversal keeps the original, cancels its amount and cannot be repeated", () => {
    const input = [entry({ issued: "INV-TEST" })]
    const reversed = reverseLedger(
      input,
      "test-entry",
      "Correction",
      "reversal-test"
    )
    expect(input).toHaveLength(1)
    expect(input[0].reversedBy).toBe("")
    expect(reversed).toHaveLength(2)
    expect(reversed[0].reversedBy).toBe("reversal-test")
    expect(totals(reversed).billed).toBe(0)
    expect(() =>
      reverseLedger(reversed, "test-entry", "Again", "second")
    ).toThrow()
    expect(() => reverseLedger(input, "test-entry", "", "second")).toThrow()
  })
  test("paid supplier-cost locking follows allocated settlements and reversals", () => {
    const cost = entry({ kind: "supplier-cost" })
    const payment = entry({
      id: "pay",
      kind: "supplier-payment",
      costId: cost.id,
      amountMinor: 10000,
    })
    expect(costLocked(cost, [cost, payment])).toBe(true)
    expect(costLocked(cost, [cost, { ...payment, amountMinor: 9999 }])).toBe(
      false
    )
    expect(costLocked(cost, [cost, { ...payment, costId: "" }])).toBe(false)
    expect(
      costLocked(
        cost,
        reverseLedger([cost, payment], payment.id, "Void", "rev-pay")
      )
    ).toBe(false)
  })
  test("invoice transformation locks only drafts and saves an independent snapshot", () => {
    const data = seedWorkspace()
    const caseId = data.patients[0].id
    const charge = entry({
      id: "isolated-draft",
      caseId,
      amountMinor: 1234,
      originalMinor: 1234,
      fields: { note: "Original snapshot" },
    })
    const fixture = { ...data, ledger: [charge] }
    const next = issueDraftInvoice(fixture, caseId, "INV-ISOLATED-TEST")
    expect(fixture.ledger[0].issued).toBe("")
    expect(next.ledger[0].issued).toBe("INV-ISOLATED-TEST")
    const doc = next.documents.find((d) => d.id === "INV-ISOLATED-TEST")!
    expect(doc.totalMinor).toBe(1234)
    next.ledger[0].fields.note = "Later value"
    expect(doc.entries[0].fields.note).toBe("Original snapshot")
    expect(() => issueDraftInvoice(next, caseId, "INV-ISOLATED-TEST")).toThrow()
    expect(() =>
      issueDraftInvoice({ ...next, documents: [] }, caseId, "INV-SECOND")
    ).toThrow()
  })
})
describe("full workspace data and access", () => {
  test("all modules have valid demo records and linked cases", () => {
    const data = seedWorkspace()
    expect(validateWorkspace(data)).not.toBeNull()
    expect(Object.keys(data.collections)).toHaveLength(11)
    for (const list of Object.values(data.collections))
      expect(list.length).toBeGreaterThan(0)
    expect(
      data.files.every((f) => data.patients.some((p) => p.id === f.caseId))
    ).toBe(true)
    expect(
      data.quoteRequests.every((q) =>
        data.collections.hospitals.some((h) => h.id === q.hospitalId)
      )
    ).toBe(true)
  })
  test("corrupt persisted amounts and missing links are rejected", () => {
    const data = seedWorkspace()
    expect(
      validateWorkspace({ ...data, patients: ["not a patient"] })
    ).toBeNull()
    expect(
      validateWorkspace({
        ...data,
        ledger: [{ ...data.ledger[0], amountMinor: "not numeric" }],
      })
    ).toBeNull()
    expect(
      validateWorkspace({
        ...data,
        tasks: [{ ...data.tasks[0], caseId: "missing-case" }],
      })
    ).toBeNull()
  })
  test("commissions use invoiced charges in each case currency, not drafts", () => {
    const data = seedWorkspace()
    const patient = data.patients[0]
    data.caseMeta[patient.id].agentId = "agent-1"
    for (const [id, meta] of Object.entries(data.caseMeta))
      if (id !== patient.id) meta.agentId = ""
    data.ledger = [
      entry({ caseId: patient.id, issued: "INV-TEST", amountMinor: 100000 }),
      entry({ caseId: patient.id, id: "unissued", amountMinor: 900000 }),
    ]
    expect(agentCommissions(data, "agent-1")[patient.currency]).toBe(50)
    data.caseMeta[patient.id].status = "lost"
    expect(agentCommissions(data, "agent-1")).toEqual({})
  })
  test("monthly commissions respect invoice dates and optional hospital/package terms", () => {
    const data = seedWorkspace()
    const p = data.patients[0]
    for (const [id, meta] of Object.entries(data.caseMeta))
      meta.agentId = id === p.id ? "agent-1" : ""
    data.ledger = [
      entry({
        caseId: p.id,
        id: "oct",
        issued: "INV-OCT",
        date: "2026-10-01",
        amountMinor: 100000,
        fields: { packageId: "package-1" },
      }),
      entry({
        caseId: p.id,
        id: "nov",
        issued: "INV-NOV",
        date: "2026-11-01",
        amountMinor: 200000,
        fields: { packageId: "package-2" },
      }),
    ]
    expect(agentCommissions(data, "agent-1", "2026-10")[p.currency]).toBe(50)
    expect(agentCommissions(data, "agent-1", "2026-11")[p.currency]).toBe(100)
    const agent = data.collections.agents[0]
    agent.values.packageScope = "package-2"
    expect(agentCommissions(data, "agent-1", "2026-10")[p.currency] || 0).toBe(
      0
    )
    expect(agentCommissions(data, "agent-1", "2026-11")[p.currency]).toBe(100)
    agent.values.hospitalScope = data.collections.hospitals.find(
      (h) => h.values.name !== p.hospital
    )!.id
    expect(agentCommissions(data, "agent-1")).toEqual({})
  })
  test("role templates keep posting and staff administration separate", () => {
    expect(rolePermissions.Manager).toContain("acctView")
    expect(rolePermissions.Manager).not.toContain("acctEdit")
    expect(rolePermissions.Manager).not.toContain("staff")
    expect(rolePermissions.Accounts).toContain("acctEdit")
    expect(rolePermissions.Coordinator).not.toContain("acctView")
    expect(rolePermissions["View only"]).not.toContain("caseEdit")
    expect(rolePermissions.Patient).not.toContain("acctView")
    expect(rolePermissions.Agent).not.toContain("docsView")
  })
})
