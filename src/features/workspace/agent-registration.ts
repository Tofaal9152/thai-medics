import { z } from "zod"
import type { Values, WorkspaceData } from "./model"

export const agentRegistrationSchema = z
  .object({
    name: z.string().trim().min(2, "Enter your full name.").max(100),
    agentType: z.enum(["Individual agent", "Partner clinic"]),
    organization: z.string().trim().max(120).default(""),
    district: z.string().trim().min(2, "Enter your district.").max(80),
    phone: z
      .string()
      .trim()
      .regex(/^\+?[\d\s()-]{7,24}$/, "Enter a valid phone number.")
      .refine(
        (v) => /^\d{7,15}$/.test(v.replace(/\D/g, "")),
        "Enter a valid phone number."
      ),
    email: z
      .string()
      .trim()
      .email("Enter a valid email address.")
      .toLowerCase(),
    address: z.string().trim().max(300).default(""),
    notes: z.string().trim().max(1000).default(""),
  })
  .refine((v) => v.agentType !== "Partner clinic" || !!v.organization, {
    path: ["organization"],
    message: "Enter the clinic name.",
  })

/** Public applications are always pending. Commission and access are staff-managed. */
export function registerAgent(
  data: WorkspaceData,
  input: Values,
  id: string,
  at: string
): WorkspaceData {
  const result = agentRegistrationSchema.safeParse(input)
  if (!result.success) throw new Error(result.error.issues[0].message)
  const v = result.data
  if (
    data.collections.agents.some(
      (a) =>
        (a.values.email || "").trim().toLowerCase() === v.email ||
        (a.values.phone || "").replace(/\D/g, "") === v.phone.replace(/\D/g, "")
    )
  )
    throw new Error(
      "This email or phone already has an agent record. Please contact the desk about your application."
    )
  if (data.collections.agents.some((a) => a.id === id))
    throw new Error("Application reference already exists.")
  return {
    ...data,
    collections: {
      ...data.collections,
      agents: [
        {
          id,
          createdAt: at,
          values: {
            ...v,
            status: "Pending approval",
            submittedVia: "Public registration",
            commissionType: "Percentage",
            rate: "0",
            currency: "BDT",
            trigger: "Invoice issued",
            hospitalScope: "",
            packageScope: "",
            terms: "Pending agreement with the desk",
          },
        },
        ...data.collections.agents,
      ],
    },
  }
}
