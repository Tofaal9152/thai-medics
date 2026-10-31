import { describe, expect, test } from "bun:test"
import { registerAgent } from "../src/features/workspace/agent-registration"
import { seedWorkspace } from "../src/features/workspace/seed"
import { validateWorkspace } from "../src/features/workspace/schema"
const input = {
  name: "Demo Registration Agent",
  agentType: "Individual agent",
  organization: "",
  district: "Dhaka",
  phone: "+880 1700 009999",
  email: "Agent.Registration@example.test",
  address: "Demo address",
  notes: "Fictional application",
}
const at = "2026-10-31T10:00:00Z"
describe("public agent registration", () => {
  test("creates a pending application without granting access or public commission control", () => {
    const data = seedWorkspace()
    const next = registerAgent(
      data,
      { ...input, status: "Active", rate: "90", permissions: "staff" },
      "application-test",
      at
    )
    const agent = next.collections.agents[0]
    expect(agent.values.status).toBe("Pending approval")
    expect(agent.values.rate).toBe("0")
    expect(agent.values.permissions).toBeUndefined()
    expect(agent.values.email).toBe("agent.registration@example.test")
    expect(agent.values.submittedVia).toBe("Public registration")
    expect(next.collections.agents.length).toBe(
      data.collections.agents.length + 1
    )
    expect(validateWorkspace(JSON.parse(JSON.stringify(next)))).not.toBeNull()
    expect(data.collections.agents.some((a) => a.id === agent.id)).toBe(false)
  })
  test("rejects duplicate emails and phone numbers despite casing or formatting", () => {
    const data = registerAgent(seedWorkspace(), input, "application-test", at)
    expect(() =>
      registerAgent(
        data,
        {
          ...input,
          email: "AGENT.REGISTRATION@EXAMPLE.TEST",
          phone: "+880 1700 008888",
        },
        "second",
        at
      )
    ).toThrow("already has an agent record")
    expect(() =>
      registerAgent(
        data,
        { ...input, email: "other@example.test", phone: "8801700009999" },
        "second",
        at
      )
    ).toThrow("already has an agent record")
  })
  test("validates required contacts and clinic information", () => {
    const data = seedWorkspace()
    for (const invalid of [
      { email: "invalid" },
      { phone: "letters" },
      { district: "" },
      { name: "" },
      { agentType: "Partner clinic", organization: "" },
    ])
      expect(() =>
        registerAgent(data, { ...input, ...invalid }, "invalid", at)
      ).toThrow()
    const clinic = registerAgent(
      data,
      { ...input, agentType: "Partner clinic", organization: "Demo clinic" },
      "clinic",
      at
    )
    expect(clinic.collections.agents[0].values.organization).toBe("Demo clinic")
  })
})
