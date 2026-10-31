import { describe, expect, test } from "bun:test"
import {
  promotionRecipients,
  recordPromotion,
} from "../src/features/workspace/promotions"
import type { PromotionDraft } from "../src/features/workspace/promotions"
import { seedWorkspace } from "../src/features/workspace/seed"
import { validateWorkspace } from "../src/features/workspace/schema"
const draft: PromotionDraft = {
  category: "Newsletter",
  channel: "Email",
  subject: "Demo newsletter",
  body: "Hello {name}, your reference is {caseId}.",
}

describe("promotion delivery in local demo mode", () => {
  test("personalises selected recipients and skips invalid or duplicate contacts", () => {
    const data = seedWorkspace(),
      [a, b, c] = data.patients
    data.caseMeta[a.id].email = "demo@example.test"
    data.caseMeta[b.id].email = "DEMO@example.test"
    data.caseMeta[c.id].email = ""
    const result = promotionRecipients(
      data,
      [a.id, b.id, c.id, a.id, "missing-case"],
      draft
    )
    expect(result.delivered).toHaveLength(1)
    expect(result.delivered[0].body).toBe(
      `Hello ${a.name}, your reference is ${a.id}.`
    )
    expect(result.skipped.map((r) => r.reason)).toEqual([
      "Duplicate contact",
      "Missing or invalid email",
    ])
  })
  test("WhatsApp deduplicates phone formatting and does not require email", () => {
    const data = seedWorkspace(),
      [a, b] = data.patients
    a.phone = "+880 1700 000111"
    b.phone = "8801700000111"
    data.caseMeta[a.id].email = ""
    const result = promotionRecipients(data, [a.id, b.id], {
      ...draft,
      category: "WhatsApp promotion",
      channel: "WhatsApp",
    })
    expect(result.delivered).toHaveLength(1)
    expect(result.skipped[0].reason).toBe("Duplicate contact")
  })
  test("bulk delivery saves valid message records and only updates recipient cases", () => {
    const data = seedWorkspace(),
      [a, b, other] = data.patients,
      ids = [a.id, b.id]
    const next = recordPromotion(
      data,
      ids,
      draft,
      "campaign-isolated-test",
      "Demo staff",
      "2026-10-31T10:00:00Z"
    )
    const records = next.collections.messages.filter(
      (m) => m.values.campaignId === "campaign-isolated-test"
    )
    expect(records).toHaveLength(2)
    expect(records.every((r) => r.values.status === "Sent")).toBe(true)
    expect(records[0].values.body).toContain(a.name)
    expect(next.patients.find((p) => p.id === a.id)!.notes.length).toBe(
      a.notes.length + 1
    )
    expect(next.patients.find((p) => p.id === other.id)!.notes).toEqual(
      other.notes
    )
    expect(
      data.collections.messages.some(
        (r) => r.values.campaignId === "campaign-isolated-test"
      )
    ).toBe(false)
    expect(validateWorkspace(JSON.parse(JSON.stringify(next)))).not.toBeNull()
    expect(
      recordPromotion(
        next,
        ids,
        draft,
        "campaign-isolated-test",
        "Demo staff",
        "2026-10-31T10:00:00Z"
      )
    ).toBe(next)
  })
  test("single delivery works and empty messages or recipients are rejected", () => {
    const data = seedWorkspace(),
      p = data.patients[0]
    const next = recordPromotion(
      data,
      [p.id],
      draft,
      "single",
      "Demo staff",
      "2026-10-31T10:00:00Z"
    )
    expect(next.collections.messages[0].values.audience).toBe("Single patient")
    expect(() =>
      recordPromotion(
        data,
        [p.id],
        { ...draft, body: " " },
        "empty",
        "Demo",
        "now"
      )
    ).toThrow()
    expect(() =>
      recordPromotion(data, [], draft, "none", "Demo", "now")
    ).toThrow()
  })
})
