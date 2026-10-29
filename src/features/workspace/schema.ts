import { z } from "zod"
import { dashboardSchema } from "@/features/dashboard/data"
import { blankMeta } from "./model"
import type { CaseMeta, WorkspaceData } from "./model"
const currency = z.enum(["BDT", "THB", "USD"])
const record = z.object({
  id: z.string(),
  values: z.record(z.string(), z.string()),
  createdAt: z.string(),
})
const entry = z.object({
  id: z.string(),
  caseId: z.string(),
  kind: z.enum([
    "visa",
    "air",
    "hotel",
    "land",
    "service",
    "discount",
    "payment",
    "refund",
    "supplier-cost",
    "supplier-payment",
  ]),
  description: z.string(),
  currency,
  rate: z.number().int().positive(),
  originalMinor: z.number().int(),
  amountMinor: z.number().int(),
  date: z.string(),
  fields: z.record(z.string(), z.string()),
  issued: z.string(),
  reversalOf: z.string(),
  reversedBy: z.string(),
  reason: z.string(),
  supplierId: z.string(),
  costId: z.string(),
  by: z.string(),
})
const meta = z.custom<CaseMeta>((value) => {
  if (!value || typeof value !== "object") return false
  const v = value as CaseMeta
  if (!["active", "lost"].includes(v.status)) return false
  for (const key of Object.keys(blankMeta()) as (keyof CaseMeta)[]) {
    if (key === "handovers") continue
    if (typeof v[key] !== "string") return false
  }
  return (
    Array.isArray(v.handovers) &&
    v.handovers.every(
      (h) =>
        h &&
        typeof h.text === "string" &&
        typeof h.by === "string" &&
        typeof h.office === "string" &&
        typeof h.at === "string"
    )
  )
})
export const workspaceSchema = dashboardSchema
  .extend({
    version: z.literal(1),
    collections: z.object({
      hospitals: z.array(record),
      doctors: z.array(record),
      agents: z.array(record),
      visas: z.array(record),
      leads: z.array(record),
      messages: z.array(record),
      packages: z.array(record),
      suppliers: z.array(record),
      ground: z.array(record),
      aftercare: z.array(record),
      staff: z.array(record),
    }),
    caseMeta: z.record(z.string(), meta),
    files: z.array(
      z.object({
        id: z.string(),
        caseId: z.string(),
        name: z.string(),
        category: z.string(),
        date: z.string(),
        by: z.string(),
        size: z.number().nonnegative(),
        mime: z.string(),
        demo: z.boolean(),
      })
    ),
    ledger: z.array(entry),
    documents: z.array(
      z.object({
        id: z.string(),
        caseId: z.string(),
        type: z.enum(["Quotation", "Invoice", "Receipt", "Statement"]),
        date: z.string(),
        entries: z.array(entry),
        totalMinor: z.number().int(),
        currency,
      })
    ),
    settings: z.record(z.string(), z.string()),
    quoteRequests: z.array(
      z.object({
        id: z.string(),
        caseId: z.string(),
        hospitalId: z.string(),
        packageId: z.string(),
        price: z.string(),
        currency,
        doctorId: z.string(),
        replyDays: z.string(),
        status: z.enum(["Awaiting reply", "Received", "Selected"]),
        date: z.string(),
      })
    ),
  })
  .refine((data) => {
    const ids = new Set(data.patients.map((p) => p.id))
    return (
      ids.size === data.patients.length &&
      data.ledger.every((e) => ids.has(e.caseId)) &&
      data.files.every((f) => ids.has(f.caseId)) &&
      data.tasks.every((t) => ids.has(t.caseId))
    )
  }, "Patient links must refer to unique existing cases.")
export function validateWorkspace(value: unknown): WorkspaceData | null {
  const result = workspaceSchema.safeParse(value)
  return result.success ? result.data : null
}
