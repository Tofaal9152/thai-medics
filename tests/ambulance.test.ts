import { describe, expect, test } from "bun:test"
import {
  addAmbulanceUpdate,
  saveAmbulanceRequest,
} from "../src/features/workspace/ambulance"
import { seedWorkspace } from "../src/features/workspace/seed"
import { validateWorkspace } from "../src/features/workspace/schema"
const at = "2026-10-31T10:00:00Z"
function fixture() {
  const data = seedWorkspace()
  const values = {
    caseId: data.patients[0].id,
    pickup: "Demo hospital Dhaka",
    destination: "Demo hospital Bangkok",
    date: "2026-11-01",
    time: "10:30",
    timeZone: "Asia/Dhaka",
    familyContact: "Demo family",
    familyPhone: "+880 1700 009999",
    hospitalContact: "Demo coordination desk",
    coordinatorId: "staff-3",
    notes: "Fictional request",
    status: "New request",
  }
  return { data, values }
}
describe("air ambulance coordination", () => {
  test("creates a linked request and retains document links without changing patient stage or billing", () => {
    const { data, values } = fixture()
    const file = data.files.find((f) => f.caseId === values.caseId)!
    const next = saveAmbulanceRequest(
      data,
      values,
      [file.id, file.id],
      "AA-TEST",
      "Demo coordinator",
      at
    )
    const request = next.ambulanceRequests[0]
    expect(request.status).toBe("New request")
    expect(request.fileIds).toEqual([file.id])
    expect(request.updates[0].by).toBe("Demo coordinator")
    expect(next.patients).toEqual(data.patients)
    expect(next.ledger).toEqual(data.ledger)
    expect(data.ambulanceRequests.some((r) => r.id === "AA-TEST")).toBe(false)
    expect(validateWorkspace(JSON.parse(JSON.stringify(next)))).not.toBeNull()
  })
  test("status edits and append-only notes preserve request history", () => {
    const { data, values } = fixture()
    const created = saveAmbulanceRequest(
      data,
      values,
      [],
      "AA-TEST",
      "Demo",
      at
    )
    const edited = saveAmbulanceRequest(
      created,
      { ...values, status: "Confirmed" },
      [],
      "AA-TEST",
      "Demo reviewer",
      "2026-11-01T11:00:00Z"
    )
    const noted = addAmbulanceUpdate(
      edited,
      "AA-TEST",
      "Demo team confirmed pickup details",
      "Demo",
      "2026-11-01T12:00:00Z"
    )
    const request = noted.ambulanceRequests.find((r) => r.id === "AA-TEST")!
    expect(request.createdAt).toBe(at)
    expect(request.status).toBe("Confirmed")
    expect(request.updates).toHaveLength(3)
    expect(request.updates[1].text).toContain("New request → Confirmed")
    expect(created.ambulanceRequests[0].updates).toHaveLength(1)
    expect(() =>
      addAmbulanceUpdate(noted, "AA-TEST", " ", "Demo", at)
    ).toThrow()
  })
  test("rejects missing patients, cross-patient documents and invalid transfer fields", () => {
    const { data, values } = fixture()
    const wrongFile = data.files.find((f) => f.caseId !== values.caseId)!
    expect(() =>
      saveAmbulanceRequest(data, values, [wrongFile.id], "bad", "Demo", at)
    ).toThrow("selected patient")
    for (const invalid of [
      { caseId: "missing" },
      { coordinatorId: "missing" },
      { familyPhone: "123" },
      { date: "2026-02-31" },
      { time: "25:10" },
      { destination: values.pickup },
      { status: "Dispatched automatically" },
    ])
      expect(() =>
        saveAmbulanceRequest(
          data,
          { ...values, ...invalid },
          [],
          "bad",
          "Demo",
          at
        )
      ).toThrow()
  })
  test("older browser data gains an empty request list without resetting saved patients", () => {
    const data = seedWorkspace()
    data.patients[0].notes.push("Existing saved patient note")
    const old: Record<string, unknown> = { ...data }
    delete old.ambulanceRequests
    const migrated = validateWorkspace(old)!
    expect(migrated).not.toBeNull()
    expect(migrated.ambulanceRequests).toEqual([])
    expect(migrated.patients[0].notes).toContain("Existing saved patient note")
  })
})
