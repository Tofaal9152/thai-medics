import type { WorkspaceData } from "./model"
import { totals } from "./billing"

/** Statements use the month of posted charge entries. Completion-triggered terms
 * become eligible when the case completes; they retain their invoice month. */
export function agentCommissions(
  data: WorkspaceData,
  agentId: string,
  month?: string
): Record<string, number> {
  const agent = data.collections.agents.find((a) => a.id === agentId)
  if (!agent) return {}
  const result: Record<string, number> = {}
  for (const patient of data.patients) {
    if (
      data.caseMeta[patient.id]?.agentId !== agentId ||
      data.caseMeta[patient.id]?.status === "lost"
    )
      continue
    const hospital = data.collections.hospitals.find(
      (h) => h.id === agent.values.hospitalScope
    )
    if (hospital && patient.hospital !== hospital.values.name) continue
    const entries = data.ledger.filter(
      (e) =>
        e.caseId === patient.id &&
        (!agent.values.packageScope ||
          e.fields.packageId === agent.values.packageScope)
    )
    const bill = totals(entries).posted
    if (
      bill <= 0 ||
      (agent.values.trigger === "Case completed" && patient.stage !== 8)
    )
      continue
    let amount: number
    if (agent.values.commissionType === "Fixed") {
      const first = entries
        .filter((e) => e.issued && !e.reversalOf && e.amountMinor > 0)
        .sort((a, b) => a.date.localeCompare(b.date))[0]
      if (
        patient.currency !== (agent.values.currency || "BDT") ||
        (month && first?.date.slice(0, 7) !== month)
      )
        continue
      amount = Number(agent.values.rate || 0)
    } else {
      const periodBill = month
        ? totals(entries.filter((e) => e.date.slice(0, 7) === month)).posted
        : bill
      amount = (periodBill * Number(agent.values.rate || 0)) / 10000
    }
    result[patient.currency] =
      Math.round(((result[patient.currency] || 0) + amount) * 100) / 100
  }
  return result
}
export const statementPaidKey = (currency: string, month: string) =>
  `paid${currency}_${month}`
