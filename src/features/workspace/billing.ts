import type {
  Currency,
  EntryKind,
  LedgerEntry,
  Values,
  WorkspaceData,
} from "./model"
export const chargeKinds: EntryKind[] = [
  "visa",
  "air",
  "hotel",
  "land",
  "service",
  "discount",
]
export function parseAmount(value: string): number {
  const text = value.replace(/[,\s]/g, "")
  if (!/^\d+(\.\d{1,2})?$/.test(text))
    throw new Error(
      "Use a non-negative amount with at most two decimal places."
    )
  const [whole, fraction = ""] = text.split(".")
  const n = Number(whole) * 100 + Number(fraction.padEnd(2, "0"))
  if (!Number.isSafeInteger(n) || n > 9e12)
    throw new Error("Amount is too large.")
  return n
}
export function parseRate(value: string): number {
  if (!/^\d+(\.\d{1,6})?$/.test(value))
    throw new Error(
      "Enter a positive exchange rate with up to six decimal places."
    )
  const n = Math.round(Number(value) * 1000000)
  if (!Number.isSafeInteger(n) || n <= 0 || n > 1e12)
    throw new Error("Invalid exchange rate.")
  return n
}
export function convertMinor(amount: number, rate: number): number {
  const product = BigInt(amount) * BigInt(rate),
    sign = product < 0n ? -1n : 1n
  const result = Number(sign * ((product * sign + 500000n) / 1000000n))
  if (!Number.isSafeInteger(result) || Math.abs(result) > 9e12)
    throw new Error("Converted amount is too large.")
  return result
}
export const displayMoney = (minor: number, currency: Currency) =>
  `${currency} ${(minor / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
export function calculateCharge(kind: EntryKind, values: Values): number {
  const amount = (key: string) => parseAmount(values[key] || "0")
  const quantity = (key: string) => {
    const n = Number(values[key])
    if (!Number.isInteger(n) || n < 1 || n > 99999)
      throw new Error("Quantity must be a positive whole number.")
    return n
  }
  let result: number
  if (kind === "visa")
    result = quantity("quantity") * amount("unit") + amount("service")
  else if (kind === "air") result = amount("amount") + amount("service")
  else if (kind === "hotel") {
    const nights =
      (Date.parse(values.checkOut) - Date.parse(values.checkIn)) / 86400000
    if (!Number.isInteger(nights) || nights < 1)
      throw new Error("Check-out must be after check-in.")
    result = quantity("rooms") * nights * amount("unit")
  } else if (kind === "land") result = quantity("quantity") * amount("unit")
  else result = amount("amount")
  if (!Number.isSafeInteger(result) || result > 9e12)
    throw new Error("Calculated amount is too large.")
  return result
}
export function totals(entries: LedgerEntry[]) {
  let billed = 0,
    posted = 0,
    paid = 0,
    cost = 0,
    supplierPaid = 0
  for (const e of entries) {
    if (chargeKinds.includes(e.kind)) {
      const value = e.amountMinor * (e.kind === "discount" ? -1 : 1)
      billed += value
      if (e.issued) posted += value
    } else if (e.kind === "payment" || e.kind === "refund")
      paid += e.amountMinor * (e.kind === "refund" ? -1 : 1)
    else if (e.kind === "supplier-cost") cost += e.amountMinor
    else if (e.kind === "supplier-payment") supplierPaid += e.amountMinor
  }
  return {
    billed,
    posted,
    draft: billed - posted,
    paid,
    balance: billed - paid,
    cost,
    supplierPaid,
    supplierDue: cost - supplierPaid,
    estimatedProfit: billed - cost,
    invoicedProfit: posted - cost,
  }
}
export function syncAccounts(data: WorkspaceData): WorkspaceData {
  return {
    ...data,
    patients: data.patients.map((p) => {
      const t = totals(data.ledger.filter((e) => e.caseId === p.id))
      return {
        ...p,
        billed: t.billed / 100,
        paid: t.paid / 100,
        supplierDue: t.supplierDue / 100,
      }
    }),
  }
}
export function costLocked(entry: LedgerEntry, entries: LedgerEntry[]) {
  return (
    entry.kind === "supplier-cost" &&
    entries
      .filter((e) => e.kind === "supplier-payment" && e.costId === entry.id)
      .reduce((n, e) => n + e.amountMinor, 0) >= entry.amountMinor &&
    entry.amountMinor > 0
  )
}
export function reverseLedger(
  entries: LedgerEntry[],
  id: string,
  reason: string,
  newId: string
): LedgerEntry[] {
  const original = entries.find((e) => e.id === id)
  if (!original || original.reversedBy || original.reversalOf)
    throw new Error("This entry cannot be reversed twice.")
  if (!reason.trim()) throw new Error("A reversal reason is required.")
  return [
    ...entries.map((e) => (e.id === id ? { ...e, reversedBy: newId } : e)),
    {
      ...original,
      id: newId,
      originalMinor: -original.originalMinor,
      amountMinor: -original.amountMinor,
      issued: "",
      reversalOf: id,
      reversedBy: "",
      reason,
      date: new Date().toISOString().slice(0, 10),
    },
  ]
}

/** Pure invoice transformation. No storage, provider or payment-service access. */
export function issueDraftInvoice(
  data: WorkspaceData,
  caseId: string,
  id: string
): WorkspaceData {
  const patient = data.patients.find((p) => p.id === caseId)
  if (!patient) throw new Error("Patient account not found.")
  if (data.documents.some((doc) => doc.id === id))
    throw new Error("Document number already exists.")
  const drafts = data.ledger.filter(
    (entry) =>
      entry.caseId === caseId &&
      chargeKinds.includes(entry.kind) &&
      !entry.issued
  )
  if (!drafts.length) throw new Error("No draft charges to invoice.")
  const date = new Date().toISOString().slice(0, 10)
  return {
    ...data,
    ledger: data.ledger.map((entry) =>
      drafts.some((draft) => draft.id === entry.id)
        ? { ...entry, issued: id }
        : entry
    ),
    documents: [
      ...data.documents,
      {
        id,
        caseId,
        type: "Invoice",
        date,
        currency: patient.currency,
        totalMinor: totals(drafts).billed,
        entries: drafts.map((entry) => ({
          ...entry,
          issued: id,
          fields: { ...entry.fields },
        })),
      },
    ],
  }
}
