import type { AmbulanceRequest } from "./ambulance"
import type { DashboardData, Patient } from "@/features/dashboard/data"
export type Values = Record<string, string>
export type ModuleKey =
  | "hospitals"
  | "doctors"
  | "agents"
  | "visas"
  | "leads"
  | "messages"
  | "packages"
  | "suppliers"
  | "ground"
  | "aftercare"
  | "staff"
export type RecordItem = { id: string; values: Values; createdAt: string }
export type Collections = Record<ModuleKey, RecordItem[]>
export type CaseMeta = {
  email: string
  age: string
  gender: string
  passport: string
  companion: string
  companionPhone: string
  agentId: string
  status: "active" | "lost"
  lostReason: string
  proposal: string
  submitted: string
  responded: string
  departure: string
  flight: string
  returnFlight: string
  accommodation: string
  airport: string
  transport: string
  interpreter: string
  handovers: { text: string; by: string; office: string; at: string }[]
}
export type RecordFile = {
  id: string
  caseId: string
  name: string
  category: string
  date: string
  by: string
  size: number
  mime: string
  demo: boolean
}
export type Currency = Patient["currency"]
export type EntryKind =
  | "visa"
  | "air"
  | "hotel"
  | "land"
  | "service"
  | "discount"
  | "payment"
  | "refund"
  | "supplier-cost"
  | "supplier-payment"
export type LedgerEntry = {
  id: string
  caseId: string
  kind: EntryKind
  description: string
  currency: Currency
  rate: number
  originalMinor: number
  amountMinor: number
  date: string
  fields: Values
  issued: string
  reversalOf: string
  reversedBy: string
  reason: string
  supplierId: string
  costId: string
  by: string
}
export type FinancialDoc = {
  id: string
  caseId: string
  type: "Quotation" | "Invoice" | "Receipt" | "Statement"
  date: string
  entries: LedgerEntry[]
  totalMinor: number
  currency: Currency
}
export type Role =
  | "Admin"
  | "Manager"
  | "Accounts"
  | "Coordinator"
  | "View only"
  | "Custom"
  | "Patient"
  | "Agent"
export type DemoSession = {
  authenticated: boolean
  role: Role
  name: string
  office: string
  staffId: string
  caseId: string
  agentId: string
}
export type QuoteRequest = {
  id: string
  caseId: string
  hospitalId: string
  packageId: string
  price: string
  currency: Currency
  doctorId: string
  replyDays: string
  status: "Awaiting reply" | "Received" | "Selected"
  date: string
}
export type WorkspaceData = DashboardData & {
  version: 1
  ambulanceRequests: AmbulanceRequest[]
  quoteRequests: QuoteRequest[]
  collections: Collections
  caseMeta: Record<string, CaseMeta>
  files: RecordFile[]
  ledger: LedgerEntry[]
  documents: FinancialDoc[]
  settings: Values
}
export const permissionNames = {
  caseCreate: "Create cases",
  caseEdit: "Edit patient details",
  stage: "Change case stage",
  docsView: "View/download records",
  docsUpload: "Upload records",
  notes: "Add notes",
  tasks: "Manage follow-up tasks",
  hospital: "Hospital/appointment work",
  thai: "Thailand arrangements",
  acctView: "View accounts",
  acctEdit: "Post financial entries",
  staff: "Manage staff/permissions",
  audit: "View audit history",
  partners: "Manage partner directories",
  visas: "Manage visas",
  leads: "Manage leads",
  messages: "Compose messages",
  reports: "View business reports",
} as const
export type Permission = keyof typeof permissionNames
export const rolePermissions: Record<Role, readonly Permission[]> = {
  Admin: Object.keys(permissionNames) as Permission[],
  Manager: [
    "caseCreate",
    "caseEdit",
    "stage",
    "docsView",
    "docsUpload",
    "notes",
    "tasks",
    "hospital",
    "thai",
    "acctView",
    "audit",
    "partners",
    "visas",
    "leads",
    "messages",
    "reports",
  ],
  Accounts: ["docsView", "acctView", "acctEdit"],
  Coordinator: [
    "caseCreate",
    "caseEdit",
    "stage",
    "docsView",
    "docsUpload",
    "notes",
    "tasks",
    "hospital",
    "thai",
    "partners",
    "visas",
    "leads",
    "messages",
  ],
  "View only": ["docsView"],
  Custom: [],
  Patient: [],
  Agent: [],
}
export const modulePermission: Record<ModuleKey, Permission> = {
  hospitals: "partners",
  doctors: "partners",
  agents: "partners",
  visas: "visas",
  leads: "leads",
  messages: "messages",
  packages: "partners",
  suppliers: "partners",
  ground: "thai",
  aftercare: "tasks",
  staff: "staff",
}
export const blankMeta = (): CaseMeta => ({
  email: "",
  age: "",
  gender: "",
  passport: "",
  companion: "",
  companionPhone: "",
  agentId: "",
  status: "active",
  lostReason: "",
  proposal: "Not sent",
  submitted: "",
  responded: "",
  departure: "",
  flight: "",
  returnFlight: "",
  accommodation: "",
  airport: "Pending",
  transport: "Pending",
  interpreter: "",
  handovers: [],
})
export const uid = (prefix: string) =>
  `${prefix}-${crypto.randomUUID().slice(0, 8)}`
