import { expect, test } from "bun:test"
import { cleanSavedPresentation } from "../src/features/workspace/presentation-text"

test("retired display labels are removed while saved references stay intact", () => {
  const saved = {
    id: "AA-DEMO-001",
    caseId: "case-demo-1",
    fileIds: ["file-demo-1"],
    name: "[DEMO] Rima Akter",
    doctor: "Dr. Siri (Demo)",
    status: "Demo sent",
    demo: true,
  }
  expect(cleanSavedPresentation(saved)).toEqual({
    ...saved,
    name: "Rima Akter",
    doctor: "Dr. Siri",
    status: "Sent",
  })
  expect(saved.name).toBe("[DEMO] Rima Akter")
})
