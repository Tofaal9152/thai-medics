import type { WorkspaceData } from "./model"

export type PromotionDraft = {
  category: "Newsletter" | "Marketing" | "WhatsApp promotion"
  channel: "Email" | "WhatsApp"
  subject: string
  body: string
}
export function promotionRecipients(
  data: WorkspaceData,
  ids: string[],
  draft: PromotionDraft
) {
  const seen = new Set<string>()
  const delivered: {
    caseId: string
    name: string
    contact: string
    body: string
  }[] = []
  const skipped: { caseId: string; name: string; reason: string }[] = []
  for (const id of new Set(ids)) {
    const patient = data.patients.find((p) => p.id === id)
    if (!patient) continue
    const contact =
      draft.channel === "Email"
        ? (data.caseMeta[id]?.email || "").trim()
        : patient.phone.trim()
    const key =
      draft.channel === "Email"
        ? contact.toLowerCase()
        : contact.replace(/\D/g, "")
    const valid =
      draft.channel === "Email"
        ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact)
        : /^\d{7,15}$/.test(key)
    if (!valid || seen.has(key)) {
      skipped.push({
        caseId: id,
        name: patient.name,
        reason: !valid
          ? `Missing or invalid ${draft.channel === "Email" ? "email" : "phone"}`
          : "Duplicate contact",
      })
      continue
    }
    seen.add(key)
    delivered.push({
      caseId: id,
      name: patient.name,
      contact,
      body: draft.body
        .replaceAll("{name}", patient.name)
        .replaceAll("{caseId}", id),
    })
  }
  return { delivered, skipped }
}
/** Demo-only delivery: append local message records and case history, no network. */
export function recordPromotion(
  data: WorkspaceData,
  ids: string[],
  draft: PromotionDraft,
  campaignId: string,
  by: string,
  at: string
): WorkspaceData {
  if (
    !draft.body.trim() ||
    (draft.channel === "Email" && !draft.subject.trim())
  )
    throw new Error("Enter a message and an email subject where applicable.")
  if (data.collections.messages.some((m) => m.values.campaignId === campaignId))
    return data
  const { delivered } = promotionRecipients(data, ids, draft)
  if (!delivered.length)
    throw new Error("No valid recipients for this channel.")
  return {
    ...data,
    collections: {
      ...data.collections,
      messages: [
        ...delivered.map((r) => ({
          id: `${campaignId}-${r.caseId}`,
          createdAt: at,
          values: {
            name: draft.subject.trim() || draft.category,
            caseId: r.caseId,
            recipient: r.contact,
            body: r.body,
            channel: draft.channel,
            language: "English",
            audience: ids.length === 1 ? "Single patient" : "Selected patients",
            status: "Sent",
            scheduled: "",
            campaignId,
            category: draft.category,
            by,
          },
        })),
        ...data.collections.messages,
      ],
    },
    patients: data.patients.map((p) => {
      const recipient = delivered.find((r) => r.caseId === p.id)
      return recipient
        ? {
            ...p,
            notes: [
              ...p.notes,
              `[${draft.channel} · ${draft.category}] ${by} · ${at}\n${draft.subject.trim() ? draft.subject.trim() + "\n" : ""}${recipient.body}`,
            ],
          }
        : p
    }),
  }
}
