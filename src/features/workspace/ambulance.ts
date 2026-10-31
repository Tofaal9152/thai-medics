import { z } from "zod"
import type { Values, WorkspaceData } from "./model"
export const ambulanceStatuses = [
  "New request",
  "Coordinating",
  "Confirmed",
  "In transit",
  "Completed",
  "Cancelled",
] as const
export const ambulanceRequestSchema = z.object({
  id: z.string(),
  caseId: z.string(),
  pickup: z.string().trim().min(2),
  destination: z.string().trim().min(2),
  requestedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/),
  timeZone: z.enum(["Asia/Dhaka", "Asia/Bangkok"]),
  familyContact: z.string().trim().min(2),
  familyPhone: z.string().trim().min(7),
  hospitalContact: z.string(),
  coordinatorId: z.string().min(1),
  notes: z.string(),
  status: z.enum(ambulanceStatuses),
  fileIds: z.array(z.string()),
  createdAt: z.string(),
  updatedAt: z.string(),
  updates: z.array(
    z.object({ text: z.string(), by: z.string(), at: z.string() })
  ),
})
export type AmbulanceRequest = z.infer<typeof ambulanceRequestSchema>
function validateLinks(data: WorkspaceData, request: AmbulanceRequest) {
  if (!data.patients.some((p) => p.id === request.caseId))
    throw new Error("Select an existing patient case.")
  if (
    !data.collections.staff.some(
      (s) => s.id === request.coordinatorId && s.values.status === "Active"
    )
  )
    throw new Error("Choose an active coordinator.")
  if (request.pickup.toLowerCase() === request.destination.toLowerCase())
    throw new Error("Pickup and destination must be different.")
  if (!/^\d{7,15}$/.test(request.familyPhone.replace(/\D/g, "")))
    throw new Error("Enter a valid family contact phone.")
  const [date, time] = request.requestedAt.split("T")
  const parsed = new Date(date + "T00:00:00Z")
  if (
    !Number.isFinite(parsed.getTime()) ||
    parsed.toISOString().slice(0, 10) !== date ||
    !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)
  )
    throw new Error("Enter a valid requested date and time.")
  if (
    request.fileIds.some(
      (id) =>
        !data.files.some((f) => f.id === id && f.caseId === request.caseId)
    )
  )
    throw new Error("Linked documents must belong to the selected patient.")
}
export function saveAmbulanceRequest(
  data: WorkspaceData,
  values: Values,
  fileIds: string[],
  id: string,
  by: string,
  at: string
): WorkspaceData {
  const previous = data.ambulanceRequests.find((r) => r.id === id)
  const parsed = ambulanceRequestSchema.safeParse({
    id,
    caseId: values.caseId,
    pickup: values.pickup,
    destination: values.destination,
    requestedAt: `${values.date}T${values.time}`,
    timeZone: values.timeZone,
    familyContact: values.familyContact,
    familyPhone: values.familyPhone,
    hospitalContact: values.hospitalContact || "",
    coordinatorId: values.coordinatorId,
    notes: values.notes || "",
    status: values.status || "New request",
    fileIds: [...new Set(fileIds)],
    createdAt: previous?.createdAt || at,
    updatedAt: at,
    updates: previous?.updates || [],
  })
  if (!parsed.success)
    throw new Error(
      "Complete the required patient, transfer, contact, coordinator and status fields."
    )
  const request = parsed.data
  validateLinks(data, request)
  request.updates = [
    ...request.updates,
    {
      text: previous
        ? previous.status !== request.status
          ? `Status changed: ${previous.status} → ${request.status}`
          : "Transfer arrangements updated"
        : "Emergency air ambulance request recorded",
      by,
      at,
    },
  ]
  return {
    ...data,
    ambulanceRequests: previous
      ? data.ambulanceRequests.map((r) => (r.id === id ? request : r))
      : [request, ...data.ambulanceRequests],
  }
}
export function addAmbulanceUpdate(
  data: WorkspaceData,
  id: string,
  text: string,
  by: string,
  at: string
): WorkspaceData {
  if (!text.trim()) throw new Error("Enter an update note.")
  if (!data.ambulanceRequests.some((r) => r.id === id))
    throw new Error("Request not found.")
  return {
    ...data,
    ambulanceRequests: data.ambulanceRequests.map((r) =>
      r.id === id
        ? {
            ...r,
            updatedAt: at,
            updates: [...r.updates, { text: text.trim(), by, at }],
          }
        : r
    ),
  }
}
