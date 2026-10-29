import type { FieldDef } from "./components/form"
import { choices } from "./form-options"
import type { ModuleKey, WorkspaceData } from "./model"
export const moduleInfo: Record<
  ModuleKey,
  { title: string; description: string; singular: string }
> = {
  hospitals: {
    title: "Hospital directory",
    description:
      "Partner hospitals, international desks and package validity, together.",
    singular: "hospital",
  },
  doctors: {
    title: "Doctor management",
    description: "Find the right specialist using the patient’s stated needs.",
    singular: "doctor",
  },
  agents: {
    title: "Agent network",
    description:
      "Referrals, agreed terms and commissions linked to the same patient case.",
    singular: "agent",
  },
  visas: {
    title: "Medical visa desk",
    description:
      "Patient and attendant documents, letters and embassy decisions.",
    singular: "visa record",
  },
  leads: {
    title: "Lead & inquiry hub",
    description: "Every inquiry captured, sourced and followed through.",
    singular: "inquiry",
  },
  messages: {
    title: "Messaging & reminders",
    description:
      "Bilingual case messages, reminders and broadcasts. Delivery is simulated.",
    singular: "message",
  },
  packages: {
    title: "Packages & quote comparison",
    description:
      "Compare hospital proposals and carry the chosen reply into a patient quotation.",
    singular: "package",
  },
  suppliers: {
    title: "Supplier & vendor hub",
    description:
      "Negotiated rates, contract validity and case-linked bookings.",
    singular: "supplier",
  },
  ground: {
    title: "Thailand ground services",
    description:
      "Airport pickups, hospital transfers, interpreters and on-call support.",
    singular: "service booking",
  },
  aftercare: {
    title: "Aftercare & feedback",
    description:
      "Keep the connection after return: check-ins, consultations and feedback.",
    singular: "aftercare plan",
  },
  staff: {
    title: "Staff & permissions",
    description: "The right access for each person across both offices.",
    singular: "staff member",
  },
}
export function fieldsFor(key: ModuleKey, data: WorkspaceData): FieldDef[] {
  const reference = (
    type: "patients" | "hospitals" | "suppliers" | "agents" | "staff"
  ) =>
    type === "patients"
      ? data.patients.map((p) => ({
          value: p.id,
          label: `${p.name} · ${p.id}`,
        }))
      : data.collections[type].map((r) => ({
          value: r.id,
          label: r.values.name,
        }))
  const f = (
    key: string,
    label: string,
    type: FieldDef["type"] = "text",
    required = false,
    options?: FieldDef["options"]
  ): FieldDef => ({ key, label, type, required, options })
  const status = (...options: string[]) =>
    f("status", "Status", "select", true, choices(...options))
  const patient = f(
    "caseId",
    "Patient case",
    "select",
    true,
    reference("patients")
  )
  const hospital = f(
    "hospital",
    "Hospital",
    "select",
    true,
    reference("hospitals")
  )
  const currency = f(
    "currency",
    "Currency",
    "select",
    true,
    choices("BDT", "THB", "USD")
  )
  const common = [f("name", "Name", "text", true)]
  switch (key) {
    case "hospitals":
      return [
        ...common,
        f("departments", "Departments", "text", true),
        f("accreditation", "Accreditation"),
        f("location", "Location", "text", true),
        f("contact", "International desk contact"),
        f("email", "Email", "email"),
        f("phone", "Phone", "tel"),
        { ...f("replyDays", "Typical reply time (days)", "number"), min: 0 },
        f("validUntil", "Price list valid until", "date"),
        status("Active", "Inactive"),
      ]
    case "doctors":
      return [
        ...common,
        hospital,
        f("specialty", "Specialty", "text", true),
        f("languages", "Languages", "text", true),
        f("clinicDays", "Clinic days"),
        f("outcomes", "Treatment and outcome notes", "textarea"),
        status("Available", "Unavailable"),
      ]
    case "agents":
      return [
        ...common,
        f("district", "District", "text", true),
        f("phone", "Phone", "tel", true),
        f("email", "Email", "email"),
        f(
          "commissionType",
          "Commission type",
          "select",
          true,
          choices("Percentage", "Fixed")
        ),
        f("rate", "Percentage or fixed amount", "number", true),
        currency,
        f(
          "trigger",
          "Earn commission when",
          "select",
          true,
          choices("Invoice issued", "Case completed")
        ),
        f("hospitalScope", "Commission hospital (optional)", "select", false, [
          { value: "", label: "All hospitals" },
          ...reference("hospitals"),
        ]),
        f("packageScope", "Commission package (optional)", "select", false, [
          { value: "", label: "All packages" },
          ...data.collections.packages.map((p) => ({
            value: p.id,
            label: p.values.name,
          })),
        ]),
        f("terms", "Agreed terms", "textarea"),
        status("Active", "Inactive"),
      ]
    case "suppliers":
      return [
        ...common,
        f(
          "category",
          "Category",
          "select",
          true,
          choices(
            "Accommodation",
            "Airline",
            "Transport",
            "Interpreter",
            "Visa",
            "Other"
          )
        ),
        f("location", "Location"),
        f("phone", "Phone", "tel"),
        f("rate", "Negotiated rate", "number", true),
        currency,
        f("validUntil", "Contract valid until", "date", true),
        status("Active", "Inactive"),
      ]
    case "packages":
      return [
        ...common,
        hospital,
        f("specialty", "Specialty", "text", true),
        f("price", "Package estimate", "number", true),
        currency,
        f("validUntil", "Quote valid until", "date", true),
        f("description", "Package details", "textarea"),
        status("Available", "Unavailable"),
      ]
    case "leads":
      return [
        ...common,
        f("phone", "Phone", "tel", true),
        f(
          "source",
          "Inquiry source",
          "select",
          true,
          choices(
            "Website",
            "Facebook",
            "Phone",
            "Agent",
            "Walk-in",
            "Referral"
          )
        ),
        f("agentId", "Referring agent", "select", false, [
          { value: "", label: "No agent" },
          ...reference("agents"),
        ]),
        f("need", "Medical need, as stated", "textarea", true),
        f(
          "coordinator",
          "Coordinator",
          "select",
          true,
          choices("Nusrat Jahan", "Rahim Uddin", "Somchai S.")
        ),
        f("responseMinutes", "Response time (minutes)", "number"),
        status("New", "Contacted", "Qualified", "Lost"),
        f(
          "lostReason",
          "Lost lead reason",
          "select",
          false,
          choices(
            "",
            "Price",
            "Another provider",
            "Medical advice",
            "Visa refused",
            "Other"
          )
        ),
      ]
    case "visas":
      return [
        patient,
        ...common,
        f(
          "relation",
          "Traveller type",
          "select",
          true,
          choices("Patient", "Attendant")
        ),
        f("passport", "Passport number (demo)", "text", true),
        f("expiry", "Passport expiry", "date", true),
        f("submission", "Embassy submission", "date"),
        f("appointment", "Appointment date", "date"),
        status(
          "Collecting documents",
          "Ready to submit",
          "Submitted",
          "Approved",
          "Refused"
        ),
        f("notes", "Visa notes", "textarea"),
      ]
    case "ground":
      return [
        ...common,
        patient,
        f("date", "Service date", "date", true),
        f("time", "Service time (Bangkok)", "time", true),
        f(
          "service",
          "Service",
          "select",
          true,
          choices(
            "Airport pickup",
            "Airport departure",
            "Hospital transfer",
            "Interpreter",
            "Other"
          )
        ),
        f("supplier", "Supplier", "select", true, reference("suppliers")),
        f("interpreter", "Interpreter / staff"),
        f("pickup", "Pickup location", "text", true),
        f("destination", "Destination", "text", true),
        f("emergency", "Emergency contact", "tel"),
        f("onCall", "On-call staff"),
        status("Pending", "Confirmed", "Completed", "Cancelled"),
      ]
    case "aftercare":
      return [
        ...common,
        patient,
        f("returnDate", "Return date", "date", true),
        f("consultDate", "Video follow-up date", "date"),
        f("consultLink", "Consultation link"),
        f("medicationReminder", "Medication reminder", "textarea"),
        f("nextVisit", "Next visit", "date"),
        {
          ...f("hospitalRating", "Hospital rating (1–5)", "number"),
          min: 1,
          step: "1",
        },
        {
          ...f("staffRating", "Staff rating (1–5)", "number"),
          min: 1,
          step: "1",
        },
        f("review", "Patient feedback", "textarea"),
        status("Scheduled", "In progress", "Completed"),
      ]
    case "messages":
      return [
        ...common,
        f(
          "audience",
          "Audience",
          "select",
          true,
          choices(
            "Single patient",
            "Assigned patients",
            "Health camp broadcast"
          )
        ),
        patient,
        f("channel", "Channel", "select", true, choices("WhatsApp", "Email")),
        f("language", "Language", "select", true, choices("English", "Bangla")),
        f("recipient", "Recipient (demo)"),
        f("scheduled", "Send later", "datetime-local"),
        { ...f("body", "Message", "textarea", true), full: true },
        status("Draft", "Scheduled"),
      ]
    case "staff":
      return [
        ...common,
        f("email", "Email", "email", true),
        f("phone", "Phone", "tel"),
        f("position", "Position", "text", true),
        f(
          "office",
          "Office",
          "select",
          true,
          choices("Bangladesh", "Thailand", "Management")
        ),
        f(
          "role",
          "Role template",
          "select",
          true,
          choices(
            "Admin",
            "Manager",
            "Accounts",
            "Coordinator",
            "View only",
            "Custom"
          )
        ),
        status("Invited", "Active", "Inactive"),
      ]
  }
}
