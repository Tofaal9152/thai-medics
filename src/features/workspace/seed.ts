import { validateWorkspace } from "./schema"
import {
  createDemoData,
  dayOffset,
  loadDemoData,
  staff,
  today,
} from "@/features/dashboard/data"
import type { DashboardData } from "@/features/dashboard/data"
import { blankMeta } from "./model"
import type {
  Collections,
  FinancialDoc,
  LedgerEntry,
  ModuleKey,
  RecordItem,
  Values,
  WorkspaceData,
} from "./model"
const record = (id: string, values: Values): RecordItem => ({
  id,
  values,
  createdAt: new Date().toISOString(),
})
export function seedWorkspace(
  base: DashboardData = createDemoData()
): WorkspaceData {
  const collections: Collections = {
    hospitals: [],
    doctors: [],
    agents: [],
    visas: [],
    leads: [],
    messages: [],
    packages: [],
    suppliers: [],
    ground: [],
    aftercare: [],
    staff: [],
  }
  collections.hospitals = [
    record("hospital-1", {
      name: "Sample Bangkok Hospital",
      departments: "Cardiology, Orthopaedics",
      accreditation: "Demo accreditation record",
      location: "Bangkok, Thailand",
      contact: "International Patient Desk",
      email: "desk@hospital-a.example.test",
      phone: "+66 00 000 0000",
      replyDays: "2",
      validUntil: dayOffset(90),
      status: "Active",
    }),
    record("hospital-2", {
      name: "Sample Medical Centre",
      departments: "General medicine, Gynaecology",
      accreditation: "Demo partner record",
      location: "Bangkok, Thailand",
      contact: "International Care Team",
      email: "care@hospital-b.example.test",
      phone: "+66 00 000 0001",
      replyDays: "1",
      validUntil: dayOffset(120),
      status: "Active",
    }),
    record("hospital-3", {
      name: "Sample International Hospital",
      departments: "Neurology, Health check-up",
      accreditation: "Demo accreditation record",
      location: "Bangkok, Thailand",
      contact: "Hospital Liaison Desk",
      email: "liaison@hospital-c.example.test",
      phone: "+66 00 000 0002",
      replyDays: "4",
      validUntil: dayOffset(60),
      status: "Active",
    }),
  ]
  collections.doctors = ["Ananda", "Siri", "Chai", "Pim", "Narin", "Kanya"].map(
    (name, i) =>
      record(`doctor-${i + 1}`, {
        name: `Dr. ${name} (Demo)`,
        hospital: collections.hospitals[i % 3].id,
        specialty: [
          "Cardiology",
          "Orthopaedics",
          "General medicine",
          "Gynaecology",
          "Neurology",
          "Health check-up",
        ][i],
        languages: i % 2 ? "Thai, English" : "Thai, English, Bengali",
        clinicDays: ["Mon, Wed, Fri", "Tue, Thu, Sat"][i % 2],
        outcomes: "Follow-up information recorded by the coordinator.",
        status: "Available",
      })
  )
  collections.agents = [
    record("agent-1", {
      name: "Dhaka Care Partners (Demo)",
      district: "Dhaka",
      phone: "+880 1700 000901",
      email: "dhaka@agent.example.test",
      commissionType: "Percentage",
      rate: "5",
      trigger: "Invoice issued",
      terms: "Commission on invoiced net patient charges.",
      status: "Active",
    }),
    record("agent-2", {
      name: "Sylhet Referral Desk (Demo)",
      district: "Sylhet",
      phone: "+880 1700 000902",
      email: "sylhet@agent.example.test",
      commissionType: "Fixed",
      rate: "1500",
      currency: "BDT",
      trigger: "Case completed",
      terms: "Fixed commission per completed BDT case.",
      status: "Active",
    }),
  ]
  collections.suppliers = [
    "Bangkok Stay Apartments",
    "Demo Air Services",
    "Care Transfer Team",
    "Bengali–Thai Interpreters",
  ].map((name, i) =>
    record(`supplier-${i + 1}`, {
      name: `${name} (Demo)`,
      category: ["Accommodation", "Airline", "Transport", "Interpreter"][i],
      location: "Bangkok",
      phone: "+66 00 000 001" + i,
      rate: String([1800, 14000, 900, 2500][i]),
      currency: "THB",
      validUntil: dayOffset(120),
      status: "Active",
    })
  )
  collections.packages = [
    "Complete health check-up",
    "Orthopaedic consultation",
    "Cardiac assessment",
    "IVF consultation",
  ].map((name, i) =>
    record(`package-${i + 1}`, {
      name,
      hospital: collections.hospitals[i % 3].id,
      specialty: ["Health check-up", "Orthopaedics", "Cardiology", "IVF"][i],
      price: String([18000, 45000, 65000, 120000][i]),
      currency: "THB",
      validUntil: dayOffset(60),
      description:
        "Illustrative package. Final treatment decisions and charges come from the hospital.",
      status: "Available",
    })
  )
  collections.leads = [
    record("lead-1", {
      name: "[DEMO] Farida Hasan",
      phone: "+880 1700 000801",
      source: "Facebook",
      need: "Family requests a general consultation.",
      coordinator: "Nusrat Jahan",
      responseMinutes: "18",
      status: "New",
      lostReason: "",
      caseId: "",
    }),
    record("lead-2", {
      name: "[DEMO] Hasan Ali",
      phone: "+880 1700 000802",
      source: "Website",
      need: "Orthopaedic second opinion.",
      coordinator: "Rahim Uddin",
      responseMinutes: "42",
      status: "Contacted",
      lostReason: "",
      caseId: "",
    }),
    record("lead-3", {
      name: "[DEMO] Rima Akter",
      phone: "+880 1700 000803",
      source: "Walk-in",
      need: "Health check-up.",
      coordinator: "Nusrat Jahan",
      responseMinutes: "15",
      status: "Lost",
      lostReason: "Another provider",
      caseId: "",
    }),
  ]
  collections.staff = staff.map((s, i) =>
    record(`staff-${i + 1}`, {
      name: s.name,
      email: `${s.initials.toLowerCase()}@staff.example.test`,
      phone: "+880 1700 00070" + i,
      position: s.role,
      office: s.office,
      role: i === 0 ? "Admin" : i === 5 ? "Accounts" : "Coordinator",
      permissions: "",
      status: "Active",
    })
  )
  collections.staff.push(
    record("staff-7", {
      name: "Amina (Demo invite)",
      email: "amina@staff.example.test",
      phone: "",
      position: "Patient Coordinator",
      office: "Bangladesh",
      role: "Coordinator",
      permissions: "",
      status: "Invited",
    })
  )
  const caseMeta: WorkspaceData["caseMeta"] = {}
  base.patients.forEach((p, i) => {
    caseMeta[p.id] = {
      ...blankMeta(),
      email: `patient${i + 1}@example.test`,
      age: String(35 + (i % 30)),
      gender: i % 2 ? "Male" : "Female",
      passport: `DEMO-P${String(i + 1).padStart(5, "0")}`,
      companion: i % 2 ? "[DEMO] Family member" : "",
      agentId:
        p.source === "Agent" ? `agent-${(Math.floor(i / 4) % 2) + 1}` : "",
      proposal: p.stage >= 3 ? "Accepted" : "Awaiting decision",
      submitted: p.stage > 1 ? dayOffset(-5) : "",
      responded: p.stage > 2 ? dayOffset(-3) : "",
      departure: p.arrival ? dayOffset(12) : "",
      flight: p.arrival ? "XX 101 (Demo)" : "",
      returnFlight: p.arrival ? "XX 102 (Demo)" : "",
      accommodation: p.stage >= 4 ? "Bangkok Stay Apartments (Demo)" : "",
      interpreter: p.stage >= 4 ? "Bengali–Thai" : "",
      airport: p.stage >= 5 ? "Arranged" : "Pending",
      transport: p.stage >= 5 ? "Arranged" : "Pending",
    }
  })
  collections.visas = base.patients
    .filter((p) => p.stage >= 3 && p.stage < 7)
    .slice(0, 7)
    .map((p, i) =>
      record(`visa-${i + 1}`, {
        caseId: p.id,
        name: p.name,
        relation: "Patient",
        passport: caseMeta[p.id].passport,
        expiry: dayOffset(i === 0 ? 45 : 400),
        submission: dayOffset(-3),
        appointment: p.appointment || dayOffset(10),
        status:
          i % 3 === 0
            ? "Submitted"
            : i % 3 === 1
              ? "Approved"
              : "Collecting documents",
        checked:
          i % 3 === 1
            ? "Passport copy|Photo|Appointment letter|Invitation letter|Application form"
            : "Passport copy|Photo",
        notes: "Fictional visa record; checklist is for demonstration.",
      })
    )
  if (collections.visas[0])
    collections.visas.push(
      record("visa-attendant", {
        ...collections.visas[0].values,
        name: "[DEMO] Accompanying family member",
        relation: "Attendant",
        passport: "DEMO-ATTENDANT",
        status: "Collecting documents",
        checked: "Passport copy",
      })
    )
  collections.ground = base.patients
    .filter((p) => p.stage >= 4 && p.stage < 7)
    .slice(0, 4)
    .map((p, i) =>
      record(`ground-${i + 1}`, {
        name: i % 2 ? "Hospital transfer" : "Airport pickup",
        caseId: p.id,
        date: dayOffset(i),
        time: "09:00",
        service: i % 2 ? "Hospital transfer" : "Airport pickup",
        supplier: "supplier-3",
        interpreter: "Ploy Anan",
        pickup: "Demo arrival hall",
        destination: p.hospital,
        emergency: "+66 00 000 0099",
        onCall: "Somchai S.",
        status: i === 0 ? "Confirmed" : "Pending",
      })
    )
  collections.aftercare = base.patients
    .filter((p) => p.stage >= 7)
    .slice(0, 4)
    .map((p, i) =>
      record(`aftercare-${i + 1}`, {
        name: `Aftercare · ${p.name}`,
        caseId: p.id,
        returnDate: dayOffset(-7 - i * 3),
        consultDate: dayOffset(7),
        consultLink: "",
        medicationReminder: "Check with patient about hospital instructions.",
        nextVisit: dayOffset(30),
        hospitalRating: i ? "4" : "",
        staffRating: i ? "5" : "",
        review: i ? "Good coordination between both offices." : "",
        status: i ? "In progress" : "Scheduled",
      })
    )
  collections.messages = [
    record("message-1", {
      name: "Appointment confirmation",
      caseId: base.patients[0].id,
      channel: "WhatsApp",
      language: "English",
      body: "Your hospital appointment is confirmed. Please bring your reports and passport copy.",
      recipient: base.patients[0].phone,
      scheduled: "",
      audience: "Single patient",
      status: "Demo sent",
    }),
    record("message-2", {
      name: "Document reminder",
      caseId: base.patients[2].id,
      channel: "Email",
      language: "Bangla",
      body: "আপনার বাকি মেডিকেল রিপোর্ট পাঠানোর অনুরোধ করছি।",
      recipient: "patient3@example.test",
      scheduled: dayOffset(1) + "T10:00",
      audience: "Single patient",
      status: "Scheduled",
    }),
  ]
  const ledger: LedgerEntry[] = [],
    documents: FinancialDoc[] = []
  base.patients
    .filter((p) => p.billed > 0)
    .forEach((p, i) => {
      const entry = (
        kind: LedgerEntry["kind"],
        amount: number,
        issued = ""
      ): LedgerEntry => ({
        id: `seed-${i}-${kind}`,
        caseId: p.id,
        kind,
        description:
          kind === "service"
            ? "Demo coordination and travel charges"
            : kind === "payment"
              ? "Demo patient payment"
              : "Demo supplier account",
        currency: p.currency,
        rate: 1000000,
        originalMinor: Math.round(amount * 100),
        amountMinor: Math.round(amount * 100),
        date: today(),
        fields: {},
        issued,
        reversalOf: "",
        reversedBy: "",
        reason: "",
        supplierId: "supplier-1",
        costId: "",
        by: "Shathi Akter",
      })
      const charge = entry(
        "service",
        p.billed,
        `INV-${yearNumber()}-${String(i + 1).padStart(4, "0")}`
      )
      ledger.push(
        charge,
        entry("payment", p.paid),
        entry("supplier-cost", Math.round(p.billed * 0.4)),
        entry("supplier-payment", Math.round(p.billed * 0.4) - p.supplierDue)
      )
      documents.push({
        id: charge.issued,
        caseId: p.id,
        type: "Invoice",
        date: today(),
        entries: [{ ...charge }],
        totalMinor: charge.amountMinor,
        currency: p.currency,
      })
    })
  return {
    ...base,
    version: 1,
    quoteRequests: collections.hospitals.map((h, i) => ({
      id: `quote-demo-${i}`,
      caseId: base.patients[3].id,
      hospitalId: h.id,
      packageId: collections.packages[i].id,
      price: String([180000, 165000, 210000][i]),
      currency: "THB",
      doctorId: collections.doctors[i].id,
      replyDays: String([2, 1, 4][i]),
      status: "Received",
      date: dayOffset(-3),
    })),
    collections,
    caseMeta,
    files: base.patients.slice(0, 7).flatMap((p, i) =>
      p.stage > 0
        ? [
            {
              id: `file-demo-${i}`,
              caseId: p.id,
              name: "Sample_medical_report_DEMO.pdf",
              category: "Medical report",
              date: dayOffset(-i - 1),
              by: p.coordinator,
              size: 150000 + i * 1000,
              mime: "application/pdf",
              demo: true,
            },
          ]
        : []
    ),
    ledger,
    documents,
    settings: {
      company: "Thai Medics",
      address: "Bangkok, Thailand · Dhaka, Bangladesh",
      phone: "+880 1700 000000",
      email: "desk@example.test",
      currency: "BDT",
      footer: "DEMO DOCUMENT — fictional information only. Not a tax invoice.",
    },
  }
}
function yearNumber() {
  return today().slice(0, 4)
}
export function loadWorkspace(): WorkspaceData {
  try {
    const text = localStorage.getItem("thai-medics-full-demo-v1")
    if (text) {
      const data = validateWorkspace(JSON.parse(text))
      if (data) return data
    }
  } catch {
    /* Start a usable demo if storage is unavailable. */
  }
  return seedWorkspace(loadDemoData())
}
export const modules: ModuleKey[] = [
  "hospitals",
  "doctors",
  "agents",
  "visas",
  "leads",
  "messages",
  "packages",
  "suppliers",
  "ground",
  "aftercare",
  "staff",
]
