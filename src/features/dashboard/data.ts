import { z } from "zod"

export const stages = [
  { name: "New inquiry", bn: "নতুন অনুসন্ধান", color: "#8a86a2" },
  { name: "Reports collection", bn: "রিপোর্ট সংগ্রহ", color: "#a69bc2" },
  { name: "Hospital review", bn: "হাসপাতাল পর্যালোচনা", color: "#8a9dc4" },
  {
    name: "Appointment confirmed",
    bn: "অ্যাপয়েন্টমেন্ট নিশ্চিত",
    color: "#6a9fbb",
  },
  { name: "Visa processing", bn: "ভিসা প্রক্রিয়া", color: "#d7ae64" },
  { name: "Travel arrangements", bn: "ভ্রমণ ব্যবস্থা", color: "#c992a7" },
  { name: "Treatment", bn: "চিকিৎসা", color: "#ad6387" },
  { name: "Follow-up", bn: "ফলো-আপ", color: "#83a89a" },
  { name: "Completed", bn: "সম্পন্ন", color: "#4c917b" },
] as const

export const staff = [
  {
    name: "Mahi Ahmed",
    initials: "MA",
    role: "Operations Manager",
    office: "Management",
    color: "rose",
  },
  {
    name: "Rahim Uddin",
    initials: "RU",
    role: "Patient Coordinator",
    office: "Bangladesh",
    color: "blue",
  },
  {
    name: "Nusrat Jahan",
    initials: "NJ",
    role: "Patient Coordinator",
    office: "Bangladesh",
    color: "rose",
  },
  {
    name: "Somchai S.",
    initials: "SS",
    role: "Thailand Coordinator",
    office: "Thailand",
    color: "green",
  },
  {
    name: "Ploy Anan",
    initials: "PA",
    role: "Hospital Liaison",
    office: "Thailand",
    color: "violet",
  },
  {
    name: "Shathi Akter",
    initials: "SA",
    role: "Accounts Officer",
    office: "Bangladesh",
    color: "amber",
  },
] as const

export const patientSchema = z.object({
  id: z.string(),
  name: z.string().min(2),
  phone: z.string().min(5),
  city: z.string(),
  hospital: z.string(),
  department: z.string(),
  need: z.string(),
  coordinator: z.string(),
  thaiCoordinator: z.string(),
  office: z.enum(["Bangladesh", "Thailand"]),
  stage: z.number().int().min(0).max(8),
  source: z.string(),
  created: z.string(),
  appointment: z.string(),
  time: z.string(),
  doctor: z.string(),
  arrival: z.string(),
  currency: z.enum(["BDT", "THB", "USD"]),
  billed: z.number().nonnegative(),
  paid: z.number().nonnegative(),
  supplierDue: z.number().nonnegative(),
  notes: z.array(z.string()),
})
export const taskSchema = z.object({
  id: z.string(),
  caseId: z.string(),
  title: z.string(),
  due: z.string(),
  assignee: z.string(),
  done: z.boolean(),
})
export const activitySchema = z.object({
  id: z.string(),
  text: z.string(),
  at: z.string(),
  kind: z.string(),
})
export const dashboardSchema = z.object({
  patients: z.array(patientSchema),
  tasks: z.array(taskSchema),
  activity: z.array(activitySchema),
})
export type Patient = z.infer<typeof patientSchema>
export type Task = z.infer<typeof taskSchema>
export type DashboardData = z.infer<typeof dashboardSchema>
export type Office = "All offices" | "Bangladesh" | "Thailand"
export type Language = "en" | "bn"

export const today = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date())
export function dayOffset(days: number) {
  const date = new Date(`${today()}T12:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}
export const dateLabel = (value: string, lang: Language = "en", full = false) =>
  new Intl.DateTimeFormat(lang === "bn" ? "bn-BD" : "en-GB", {
    day: "numeric",
    month: "short",
    ...(full ? { year: "numeric" } : {}),
    timeZone: "UTC",
  }).format(new Date(`${value}T12:00:00Z`))
export const formatMoney = (value: number, currency: string) =>
  `${currency} ${value.toLocaleString("en-US", { maximumFractionDigits: 0 })}`
export const initials = (name: string) =>
  name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
export function inOffice(patient: Patient, office: Office) {
  return office === "All offices" || patient.office === office
}

export function createDemoData(): DashboardData {
  const names = [
    "Shirin Akter",
    "Abdul Karim",
    "Fatema Begum",
    "Mizanur Rahman",
    "Habibur Rahman",
    "Rokeya Khatun",
    "Jamal Uddin",
    "Salma Ahmed",
    "Tanvir Hasan",
    "Farhana Islam",
    "Kamal Hossain",
    "Ayesha Siddiqua",
    "Nazmul Haque",
    "Rumana Akter",
    "Sabbir Rahman",
    "Tahmina Begum",
    "Arif Chowdhury",
    "Nadia Sultana",
    "Mahmud Hasan",
    "Shamima Akter",
    "Imran Kabir",
    "Nasima Khan",
    "Rafiq Ahmed",
    "Tasnim Jahan",
    "Saiful Islam",
    "Rasheda Begum",
    "Anisur Rahman",
    "Sadia Afrin",
    "Faisal Ahmed",
    "Nargis Begum",
    "Jahangir Alam",
    "Laila Rahman",
  ]
  const stageIndexes = [
    3, 0, 1, 2, 5, 7, 8, 4, 6, 2, 0, 1, 3, 4, 5, 0, 1, 2, 3, 0, 1, 4, 6, 5, 0,
    2, 1, 7, 3, 8, 0, 8,
  ]
  const departments = [
    "Gynaecology",
    "Orthopaedics",
    "General medicine",
    "Cardiology",
    "Orthopaedics",
    "General medicine",
    "Health check-up",
    "Neurology",
  ]
  const patients: Patient[] = names.map((name, i) => {
    const stage = stageIndexes[i]
    const currency = i % 3 === 0 ? "USD" : i % 3 === 1 ? "BDT" : "THB"
    const billed =
      stage < 3
        ? 0
        : currency === "USD"
          ? 1500 + i * 80
          : currency === "BDT"
            ? 124000 + i * 1500
            : 48000 + i * 800
    return {
      id: `TMD-${today().slice(0, 4)}-${String(i + 1).padStart(4, "0")}`,
      name,
      phone: `+880 17${String(10000101 + i).slice(0, 8)}`,
      city: ["Dhaka", "Chattogram", "Sylhet", "Khulna"][i % 4],
      hospital:
        stage > 1
          ? [
              "Sample Bangkok Hospital",
              "Sample Medical Centre",
              "Sample International Hospital",
            ][i % 3]
          : "Not assigned",
      department: departments[i % departments.length],
      need: `${departments[i % departments.length]} consultation, as stated by the patient.`,
      coordinator: i % 2 === 0 ? "Nusrat Jahan" : "Rahim Uddin",
      thaiCoordinator:
        stage > 1 ? (i % 2 === 0 ? "Ploy Anan" : "Somchai S.") : "Not assigned",
      office: [2, 5, 6].includes(stage) ? "Thailand" : "Bangladesh",
      stage,
      source: ["Website", "Agent", "Walk-in", "Facebook"][i % 4],
      created: dayOffset(-i - 1),
      appointment: i < 9 && stage > 1 && stage < 7 ? dayOffset(i % 4) : "",
      time: ["09:30", "10:00", "11:15", "14:00"][i % 4],
      doctor: ["Dr. Ananda", "Dr. Siri", "Dr. Chai"][i % 3],
      arrival: stage === 5 ? dayOffset((i % 3) + 1) : "",
      currency,
      billed,
      paid: Math.round(billed * (stage === 8 ? 1 : 0.45)),
      supplierDue: Math.round(billed * (stage === 8 ? 0 : 0.28)),
      notes:
        i < 6
          ? [
              "Patient and family updated on the next steps.",
              "Existing reports received. Coordinator to follow up with the hospital.",
            ]
          : [],
    }
  })
  const tasks: Task[] = [
    {
      id: "task-1",
      caseId: patients[2].id,
      title: "Collect remaining imaging reports",
      due: dayOffset(-2),
      assignee: "Nusrat Jahan",
      done: false,
    },
    {
      id: "task-2",
      caseId: patients[4].id,
      title: "Send hotel confirmation to family",
      due: dayOffset(-1),
      assignee: "Somchai S.",
      done: false,
    },
    {
      id: "task-3",
      caseId: patients[7].id,
      title: "Follow up on visa invitation letter",
      due: dayOffset(-1),
      assignee: "Rahim Uddin",
      done: false,
    },
    {
      id: "task-4",
      caseId: patients[0].id,
      title: "Confirm appointment with patient",
      due: today(),
      assignee: "Nusrat Jahan",
      done: false,
    },
    {
      id: "task-5",
      caseId: patients[1].id,
      title: "Call back to collect medical reports",
      due: today(),
      assignee: "Rahim Uddin",
      done: false,
    },
    {
      id: "task-6",
      caseId: patients[3].id,
      title: "Request hospital review update",
      due: today(),
      assignee: "Somchai S.",
      done: false,
    },
    {
      id: "task-7",
      caseId: patients[5].id,
      title: "Post-return check-in call",
      due: today(),
      assignee: "Mahi Ahmed",
      done: false,
    },
    {
      id: "task-8",
      caseId: patients[4].id,
      title: "Share arrival briefing",
      due: dayOffset(1),
      assignee: "Mahi Ahmed",
      done: false,
    },
    {
      id: "task-9",
      caseId: patients[8].id,
      title: "Confirm interpreter schedule",
      due: dayOffset(2),
      assignee: "Ploy Anan",
      done: false,
    },
    {
      id: "task-10",
      caseId: patients[0].id,
      title: "Upload hospital quotation",
      due: today(),
      assignee: "Nusrat Jahan",
      done: true,
    },
  ]
  return {
    patients,
    tasks,
    activity: [
      {
        id: "a-1",
        text: "Nusrat confirmed Shirin Akter’s appointment",
        at: new Date(Date.now() - 15 * 60000).toISOString(),
        kind: "appointment",
      },
      {
        id: "a-2",
        text: "Rahim added a communication note for Abdul Karim",
        at: new Date(Date.now() - 42 * 60000).toISOString(),
        kind: "note",
      },
      {
        id: "a-3",
        text: "Shathi recorded a payment for Habibur Rahman",
        at: new Date(Date.now() - 90 * 60000).toISOString(),
        kind: "payment",
      },
      {
        id: "a-4",
        text: "Somchai updated a Thailand handover",
        at: new Date(Date.now() - 120 * 60000).toISOString(),
        kind: "note",
      },
    ],
  }
}

const storageKey = "thai-medics-dashboard-demo-v1"
export function loadDemoData() {
  try {
    const raw = localStorage.getItem(storageKey)
    if (raw) {
      const parsed = dashboardSchema.safeParse(JSON.parse(raw))
      if (parsed.success) return parsed.data
    }
  } catch {
    /* A fresh demo is still usable when browser storage is unavailable. */
  }
  return createDemoData()
}
export function saveDemoData(data: DashboardData) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(data))
    return true
  } catch {
    return false
  }
}
