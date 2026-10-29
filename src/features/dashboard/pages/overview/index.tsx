import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  ArrowDownLeft,
  ArrowDownToLine,
  ArrowRight,
  ArrowUpRight,
  Building2,
  CalendarDays,
  Check,
  CheckCheck,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock3,
  Cross,
  MessageSquare,
  Plus,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Users,
  Wallet,
  X,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/toast"
import DataTable from "@/components/shared/data-table"
import Pagination from "@/components/shared/pagination"
import DashboardDialog, {
  CaseDetails,
  NewCaseForm,
  NewTaskForm,
} from "../../components/dashboard-dialog"
import type { NewCaseValues } from "../../components/dashboard-dialog"
import { patientColumns } from "../../components/patient-columns"
import {
  dateLabel,
  dayOffset,
  formatMoney,
  inOffice,
  staff,
  stages,
  today,
} from "../../data"
import type { Office, Patient, Task } from "../../data"
import { accountSummary, searchPatients } from "../../selectors"
import "../../dashboard.css"
import { useWorkspace } from "@/features/workspace/context"

type DialogState =
  | "new-case"
  | "new-task"
  | "calendar"
  | "staff"
  | "activity"
  | "info"
  | "reset"
  | null
type TaskFilter = "pending" | "today" | "overdue" | "done"

function StatCard({
  icon: Icon,
  title,
  value,
  note,
  color,
  onClick,
}: {
  icon: LucideIcon
  title: string
  value: number
  note: string
  color: string
  onClick: () => void
}) {
  return (
    <button className={`stat-card ${color}`} onClick={onClick}>
      <div className="stat-top">
        <span>{title}</span>
        <span className="stat-icon">
          <Icon size={18} />
        </span>
      </div>
      <div className="stat-value">
        {value.toString().padStart(2, "0")}
        <ArrowUpRight size={19} />
      </div>
      <span className="stat-note">
        <i />
        {note}
      </span>
    </button>
  )
}

export default function Dashboard() {
  const { data, setData, lang, office, setOffice, can, reset, createCase } =
    useWorkspace()
  const [dialog, setDialog] = useState<DialogState>(null)
  const [caseId, setCaseId] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  const [stageFilter, setStageFilter] = useState("")
  const [coordinator, setCoordinator] = useState("")
  const [page, setPage] = useState(1)
  const [taskFilter, setTaskFilter] = useState<TaskFilter>("pending")
  const [mineOnly, setMineOnly] = useState(false)
  const [currency, setCurrency] = useState<"BDT" | "THB" | "USD">("BDT")
  const [appointmentDays, setAppointmentDays] = useState(30)
  const [calendarDay, setCalendarDay] = useState(today())
  const [showAllCases, setShowAllCases] = useState(false)
  const [clock, setClock] = useState(() => Date.now())
  const casesRef = useRef<HTMLElement>(null)
  const tasksRef = useRef<HTMLElement>(null)
  const accountsRef = useRef<HTMLElement>(null)
  const appointmentsRef = useRef<HTMLElement>(null)
  const t = (en: string, bn: string) => (lang === "bn" ? bn : en)

  useEffect(() => {
    const timer = window.setInterval(() => setClock(Date.now()), 60000)
    return () => window.clearInterval(timer)
  }, [])
  const closeDialog = useCallback(() => {
    setDialog(null)
    setCaseId(null)
  }, [])
  const patients = useMemo(
    () => data.patients.filter((p) => inOffice(p, office)),
    [data.patients, office]
  )
  const patientIds = new Set(patients.map((p) => p.id))
  const tasks = data.tasks.filter((task) => patientIds.has(task.caseId))
  const openTasks = tasks.filter((task) => !task.done)
  const dueToday = openTasks.filter((task) => task.due === today())
  const overdue = openTasks.filter((task) => task.due < today())
  const appointments = patients
    .filter(
      (p) =>
        p.appointment &&
        p.appointment >= today() &&
        p.appointment <= dayOffset(appointmentDays)
    )
    .sort((a, b) =>
      `${a.appointment}${a.time}`.localeCompare(`${b.appointment}${b.time}`)
    )
  const stageCounts = stages.map(
    (_, i) => patients.filter((p) => p.stage === i).length
  )
  const visibleTasks = tasks
    .filter(
      (task) =>
        (!mineOnly || task.assignee === "Mahi Ahmed") &&
        (taskFilter === "done"
          ? task.done
          : !task.done &&
            (taskFilter === "pending"
              ? task.due <= today()
              : taskFilter === "today"
                ? task.due === today()
                : task.due < today()))
    )
    .sort((a, b) => a.due.localeCompare(b.due))
  const filteredPatients = useMemo(
    () => searchPatients(patients, query, stageFilter, coordinator),
    [patients, query, stageFilter, coordinator]
  )
  const currentCase = data.patients.find((p) => p.id === caseId)
  const openCase = useCallback((patient: Patient) => {
    setDialog(null)
    setCaseId(patient.id)
  }, [])
  const columns = useMemo(
    () => patientColumns(openCase, lang),
    [openCase, lang]
  )
  const account = accountSummary(patients, currency)
  const daysLabel = (date: string) =>
    date === today()
      ? t("Today", "আজ")
      : date === dayOffset(1)
        ? t("Tomorrow", "আগামীকাল")
        : dateLabel(date, lang)

  function activity(text: string, kind: string) {
    return { id: crypto.randomUUID(), text, kind, at: new Date().toISOString() }
  }
  function toggleTask(id: string) {
    if (!can("tasks")) {
      toast.add({
        title: "Your demo role cannot perform this action.",
        type: "error",
      })
      return
    }
    const task = data.tasks.find((item) => item.id === id)
    if (!task) return
    setData((prev) => ({
      ...prev,
      tasks: prev.tasks.map((item) =>
        item.id === id ? { ...item, done: !item.done } : item
      ),
      activity: [
        activity(
          `${task.done ? "Reopened" : "Completed"}: ${task.title}`,
          "task"
        ),
        ...prev.activity,
      ].slice(0, 100),
    }))
    toast.add({
      title: task.done
        ? t("Follow-up reopened", "ফলো-আপ পুনরায় খোলা হয়েছে")
        : t(
            "One less thing to do. Follow-up completed!",
            "ফলো-আপ সম্পন্ন হয়েছে!"
          ),
      type: "success",
    })
  }
  function addCase(values: NewCaseValues) {
    if (!can("caseCreate")) {
      toast.add({
        title: "Your demo role cannot perform this action.",
        type: "error",
      })
      return
    }
    const patient = createCase(values)
    setDialog(null)
    setCaseId(patient.id)
    toast.add({
      title: t("New patient case created", "নতুন রোগীর কেস তৈরি হয়েছে"),
      description: patient.id,
      type: "success",
    })
  }
  function addTask(task: Omit<Task, "id" | "done">) {
    if (!can("tasks")) {
      toast.add({
        title: "Your demo role cannot perform this action.",
        type: "error",
      })
      return
    }
    setData((prev) => ({
      ...prev,
      tasks: [...prev.tasks, { ...task, id: crypto.randomUUID(), done: false }],
      activity: [
        activity(`Added follow-up: ${task.title}`, "task"),
        ...prev.activity,
      ],
    }))
    setDialog(null)
    setTaskFilter("pending")
    toast.add({
      title: t("Follow-up added", "ফলো-আপ যোগ হয়েছে"),
      description: `${task.title} · ${dateLabel(task.due, lang)}`,
      type: "success",
    })
  }
  function advanceCase() {
    if (!can("stage")) {
      toast.add({
        title: "Your demo role cannot perform this action.",
        type: "error",
      })
      return
    }
    if (!currentCase || currentCase.stage === 8) return
    setData((prev) => ({
      ...prev,
      patients: prev.patients.map((p) =>
        p.id === currentCase.id ? { ...p, stage: p.stage + 1 } : p
      ),
      activity: [
        activity(
          `${currentCase.name} moved to ${stages[currentCase.stage + 1].name}`,
          "case"
        ),
        ...prev.activity,
      ],
    }))
    toast.add({
      title: t("Case stage updated", "কেসের ধাপ পরিবর্তন হয়েছে"),
      type: "success",
    })
  }
  function addNote(note: string) {
    if (!can("notes")) {
      toast.add({
        title: "Your demo role cannot perform this action.",
        type: "error",
      })
      return
    }
    if (!currentCase) return
    setData((prev) => ({
      ...prev,
      patients: prev.patients.map((p) =>
        p.id === currentCase.id ? { ...p, notes: [...p.notes, note] } : p
      ),
      activity: [
        activity(`Added a note for ${currentCase.name}`, "note"),
        ...prev.activity,
      ],
    }))
    toast.add({
      title: t("Communication note saved", "যোগাযোগ নোট সংরক্ষিত হয়েছে"),
      type: "success",
    })
  }
  function exportCases() {
    // Prefix formula-leading values so patient input stays text in spreadsheet apps.
    const csvCell = (value: string) =>
      `"${(/^[=+\-@\t\r]/.test(value) ? `'${value}` : value).replace(/"/g, '""')}"`
    const rows = [
      [
        "Case ID",
        "Patient",
        "Phone",
        "Hospital",
        "Stage",
        "Coordinator",
        "Office",
        "Source",
      ],
      ...filteredPatients.map((p) => [
        p.id,
        p.name,
        p.phone,
        p.hospital,
        stages[p.stage].name,
        p.coordinator,
        p.office,
        p.source,
      ]),
    ]
    const url = URL.createObjectURL(
      new Blob(
        ["\uFEFF" + rows.map((row) => row.map(csvCell).join(",")).join("\r\n")],
        { type: "text/csv;charset=utf-8;" }
      )
    )
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = `thai-medics-demo-cases-${today()}.csv`
    anchor.click()
    URL.revokeObjectURL(url)
    toast.add({
      title: t("Patient list exported", "রোগীর তালিকা এক্সপোর্ট হয়েছে"),
      description: t(
        `${filteredPatients.length} demo cases · CSV file`,
        `${filteredPatients.length} ডেমো কেস · CSV ফাইল`
      ),
      type: "success",
    })
  }
  function showCases(stage = "") {
    setStageFilter(stage)
    setPage(1)
    setShowAllCases(true)
    casesRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }
  function relativeTime(iso: string) {
    const minutes = Math.max(
      0,
      Math.floor((clock - new Date(iso).getTime()) / 60000)
    )
    return minutes < 1
      ? t("Just now", "এইমাত্র")
      : minutes < 60
        ? t(`${minutes}m ago`, `${minutes} মিনিট আগে`)
        : minutes < 1440
          ? t(
              `${Math.floor(minutes / 60)}h ago`,
              `${Math.floor(minutes / 60)} ঘণ্টা আগে`
            )
          : dateLabel(iso.slice(0, 10), lang)
  }
  const activityList = (
    <div className="activity-list">
      {data.activity.slice(0, dialog === "activity" ? 30 : 3).map((item) => (
        <div className="activity-row" key={item.id}>
          <span
            className={`activity-icon ${item.kind === "payment" ? "green" : item.kind === "appointment" ? "blue" : "rose"}`}
          >
            {item.kind === "payment" ? (
              <Wallet size={14} />
            ) : item.kind === "task" ? (
              <CheckCheck size={14} />
            ) : item.kind === "appointment" ? (
              <CalendarDays size={14} />
            ) : (
              <MessageSquare size={14} />
            )}
          </span>
          <p>
            {item.text}
            <small>{relativeTime(item.at)}</small>
          </p>
        </div>
      ))}
    </div>
  )
  const taskRow = (task: Task) => {
    const p = data.patients.find((item) => item.id === task.caseId)
    return (
      <div
        key={task.id}
        className={`followup-row ${task.done ? "is-done" : ""}`}
      >
        <label className="task-checkbox">
          <input
            type="checkbox"
            aria-label={`${task.done ? "Reopen" : "Complete"} ${task.title}`}
            checked={task.done}
            disabled={!can("tasks")}
            onChange={() => toggleTask(task.id)}
          />
          <span>
            <Check size={12} />
          </span>
        </label>
        <div className="followup-content">
          <strong>{task.title}</strong>
          <div>
            <button onClick={() => p && openCase(p)}>
              {p?.name ?? task.caseId}
            </button>
            <span className="dot-separator">·</span>
            <span>{task.assignee.split(" ")[0]}</span>
          </div>
        </div>
        <span
          className={`due-badge ${task.done ? "due-done" : task.due < today() ? "due-overdue" : "due-today"}`}
        >
          {task.done
            ? t("Done", "সম্পন্ন")
            : task.due < today()
              ? t(
                  `${Math.round((new Date(`${today()}T12:00:00Z`).getTime() - new Date(`${task.due}T12:00:00Z`).getTime()) / 86400000)}d overdue`,
                  "বিলম্বিত"
                )
              : daysLabel(task.due)}
        </span>
      </div>
    )
  }

  return (
    <div className="dashboard-page">
      <main className="dashboard-main">
        <section className="page-heading">
          <div>
            <div className="page-eyebrow">
              <span />
              {t("YOUR DAILY PULSE", "আপনার প্রতিদিনের আপডেট")}
            </div>
            <h1>{t("Dashboard overview", "ড্যাশবোর্ডের সংক্ষিপ্ত বিবরণ")}</h1>
            <p>
              {t(
                "Here’s what’s happening across your medical desk today.",
                "আজ আপনার মেডিকেল ডেস্কের সব আপডেট এখানে।"
              )}
            </p>
          </div>
          <div className="heading-actions">
            <label className="office-select">
              <Building2 size={15} />
              <select
                aria-label="Filter by office"
                value={office}
                onChange={(e) => {
                  setOffice(e.target.value as Office)
                  setPage(1)
                }}
              >
                <option value="All offices">
                  {t("All offices", "সব অফিস")}
                </option>
                <option value="Bangladesh">
                  {t("Bangladesh", "বাংলাদেশ")}
                </option>
                <option value="Thailand">{t("Thailand", "থাইল্যান্ড")}</option>
              </select>
            </label>
            <Button
              className="new-case-button"
              disabled={!can("caseCreate")}
              onClick={() => setDialog("new-case")}
            >
              <Plus size={17} />
              {t("New patient case", "নতুন রোগীর কেস")}
            </Button>
          </div>
        </section>

        <div className="greeting-strip">
          <div>
            <span className="greeting-icon">
              <Sparkles size={17} />
            </span>
            <p>
              <strong>
                {t("Welcome back, Mahi", "স্বাগতম, মাহি")}{" "}
                <span className="greeting-wave">✦</span>
                <span className="greeting-divider" />
                {t(
                  "Your team is making care happen.",
                  "আপনার টিম রোগীদের পাশে আছে।"
                )}
              </strong>
              <span>
                {dueToday.length + overdue.length
                  ? t(
                      `You have ${overdue.length} overdue and ${dueToday.length} today’s follow-ups to keep an eye on.`,
                      `${overdue.length}টি বিলম্বিত ও আজকের ${dueToday.length}টি ফলো-আপ দেখুন।`
                    )
                  : t(
                      "You’re all caught up with today’s follow-ups.",
                      "আজকের সব ফলো-আপ সম্পন্ন।"
                    )}
              </span>
            </p>
          </div>
          <time dateTime={today()}>
            <CalendarDays size={15} />
            {new Intl.DateTimeFormat(lang === "bn" ? "bn-BD" : "en-GB", {
              weekday: "short",
              day: "numeric",
              month: "short",
              year: "numeric",
              timeZone: "Asia/Dhaka",
            }).format(new Date())}
          </time>
        </div>

        <section className="stats-grid" aria-label="Dashboard statistics">
          <StatCard
            icon={Users}
            title={t("Active patient cases", "সক্রিয় রোগীর কেস")}
            value={
              patients.filter(
                (p) => p.stage < 8 && data.caseMeta[p.id]?.status !== "lost"
              ).length
            }
            note={t(
              `${patients.length} total cases in your workspace`,
              `ওয়ার্কস্পেসে মোট ${patients.length}টি কেস`
            )}
            color="rose"
            onClick={() => showCases("active")}
          />
          <StatCard
            icon={CheckCheck}
            title={t("Today’s follow-ups", "আজকের ফলো-আপ")}
            value={dueToday.length}
            note={t(
              "A little follow-up goes a long way",
              "নিয়মিত যোগাযোগ, সুন্দর সমন্বয়"
            )}
            color="blue"
            onClick={() => {
              setTaskFilter("today")
              tasksRef.current?.scrollIntoView({
                behavior: "smooth",
                block: "center",
              })
            }}
          />
          <StatCard
            icon={Clock3}
            title={t("Overdue tasks", "বিলম্বিত কাজ")}
            value={overdue.length}
            note={t("Need a little extra attention", "আপনার মনোযোগ প্রয়োজন")}
            color="amber"
            onClick={() => {
              setTaskFilter("overdue")
              tasksRef.current?.scrollIntoView({
                behavior: "smooth",
                block: "center",
              })
            }}
          />
          <StatCard
            icon={CalendarDays}
            title={t("Upcoming appointments", "আসন্ন অ্যাপয়েন্টমেন্ট")}
            value={appointments.length}
            note={t(
              `Scheduled in the next ${appointmentDays} days`,
              `আগামী ${appointmentDays} দিনের অ্যাপয়েন্টমেন্ট`
            )}
            color="green"
            onClick={() =>
              appointmentsRef.current?.scrollIntoView({
                behavior: "smooth",
                block: "center",
              })
            }
          />
        </section>

        <section className="panel pipeline-panel">
          <div className="panel-heading">
            <div>
              <h2>
                {t("The patient journey", "রোগীর যাত্রা")}
                <span className="subtle-count">
                  {patients.length} {t("cases", "কেস")}
                </span>
              </h2>
              <p>
                {t(
                  "From the first hello to a healthy return. Every step, connected.",
                  "প্রথম যোগাযোগ থেকে চিকিৎসা শেষে ফেরা, প্রতিটি ধাপ সংযুক্ত।"
                )}
              </p>
            </div>
            <button className="text-button" onClick={() => showCases()}>
              {t("View all cases", "সব কেস দেখুন")}
              <ArrowUpRight size={14} />
            </button>
          </div>
          <div className="pipeline-track">
            {stages.map((stage, i) => (
              <button
                key={stage.name}
                className={`pipeline-stage ${stageFilter === String(i) ? "pipeline-selected" : ""}`}
                aria-pressed={stageFilter === String(i)}
                onClick={() =>
                  showCases(stageFilter === String(i) ? "" : String(i))
                }
              >
                <div className="pipeline-step">
                  <span style={{ background: stage.color }} />
                  <i />
                  <span className="pipeline-number">
                    {stageCounts[i].toString().padStart(2, "0")}
                  </span>
                </div>
                <span className="pipeline-label">
                  {lang === "bn" ? stage.bn : stage.name}
                </span>
                <div
                  className="pipeline-bar"
                  style={{ background: `${stage.color}20` }}
                >
                  <i
                    style={{
                      background: stage.color,
                      width: `${Math.max(10, (stageCounts[i] / Math.max(1, ...stageCounts)) * 100)}%`,
                    }}
                  />
                </div>
              </button>
            ))}
          </div>
        </section>

        <div className="operations-grid">
          <section className="panel followup-panel" ref={tasksRef}>
            <div className="panel-heading">
              <div>
                <h2>
                  <span className="section-icon rose">
                    <ClipboardList size={17} />
                  </span>
                  {t("A little follow-through", "ফলো-আপের খবর")}
                  <span className="subtle-count">
                    {openTasks.filter((task) => task.due <= today()).length}
                  </span>
                </h2>
                <p>
                  {t(
                    "The next steps that keep your patients moving.",
                    "রোগীর কাজ এগিয়ে নিতে পরবর্তী পদক্ষেপ।"
                  )}
                </p>
              </div>
              <button
                className="small-add"
                aria-label="Add follow-up task"
                onClick={() => setDialog("new-task")}
              >
                <Plus size={17} />
              </button>
            </div>
            <div className="task-toolbar">
              <div className="task-tabs">
                {(
                  [
                    [
                      "pending",
                      t("Due now", "এখনকার কাজ"),
                      dueToday.length + overdue.length,
                    ],
                    ["today", t("Today", "আজ"), dueToday.length],
                    ["overdue", t("Overdue", "বিলম্বিত"), overdue.length],
                    [
                      "done",
                      t("Done", "সম্পন্ন"),
                      tasks.filter((task) => task.done).length,
                    ],
                  ] as const
                ).map(([key, label, count]) => (
                  <button
                    key={key}
                    className={taskFilter === key ? "selected" : ""}
                    onClick={() => setTaskFilter(key)}
                  >
                    {label}
                    <span>{count}</span>
                  </button>
                ))}
              </div>
              <label className="mine-only">
                <input
                  type="checkbox"
                  checked={mineOnly}
                  onChange={(e) => setMineOnly(e.target.checked)}
                />
                {t("Mine", "আমার")}
              </label>
            </div>
            <div className="followup-list">
              {visibleTasks.slice(0, 5).map(taskRow)}
              {!visibleTasks.length && (
                <div className="empty-state">
                  <CheckCheck size={28} />
                  <strong>{t("All clear here", "এখানে কোনো কাজ নেই")}</strong>
                  <span>
                    {t(
                      "No follow-ups match this view.",
                      "এই ফিল্টারে কোনো ফলো-আপ নেই।"
                    )}
                  </span>
                  <button
                    className="text-button"
                    onClick={() => {
                      setMineOnly(false)
                      setTaskFilter("pending")
                    }}
                  >
                    {t("Show due follow-ups", "বাকি ফলো-আপ দেখুন")}
                    <ArrowRight size={14} />
                  </button>
                </div>
              )}
            </div>
            <footer className="panel-footer">
              <span>
                <ShieldCheck size={13} />
                {t("Small actions. Better care.", "ছোট পদক্ষেপে সুন্দর সেবা।")}
              </span>
              <button
                className="text-button"
                onClick={() => setDialog("calendar")}
              >
                {t("Open calendar", "ক্যালেন্ডার খুলুন")}
                <ArrowRight size={14} />
              </button>
            </footer>
          </section>

          <section className="panel appointments-panel" ref={appointmentsRef}>
            <div className="panel-heading">
              <div>
                <h2>
                  <span className="section-icon green">
                    <CalendarDays size={17} />
                  </span>
                  {t("Coming up next", "পরবর্তী অ্যাপয়েন্টমেন্ট")}
                </h2>
                <p>
                  {t(
                    "Hospital appointments on the horizon.",
                    "হাসপাতালের আসন্ন অ্যাপয়েন্টমেন্ট।"
                  )}
                </p>
              </div>
              <label className="period-select">
                <select
                  aria-label="Appointment period"
                  value={appointmentDays}
                  onChange={(e) => setAppointmentDays(Number(e.target.value))}
                >
                  <option value={30}>
                    {t("Next 30 days", "আগামী ৩০ দিন")}
                  </option>
                  <option value={7}>{t("Next 7 days", "আগামী ৭ দিন")}</option>
                  <option value={1}>
                    {t("Today & tomorrow", "আজ ও আগামীকাল")}
                  </option>
                </select>
                <ChevronDown size={12} />
              </label>
            </div>
            <div className="appointment-list">
              {appointments.slice(0, 3).map((p) => (
                <button
                  className="appointment-row"
                  key={p.id}
                  onClick={() => openCase(p)}
                >
                  <span
                    className={`appointment-date ${p.appointment === today() ? "is-today" : ""}`}
                  >
                    <small>
                      {new Date(
                        `${p.appointment}T12:00:00Z`
                      ).toLocaleDateString("en-GB", {
                        month: "short",
                        timeZone: "UTC",
                      })}
                    </small>
                    <strong>{Number(p.appointment.slice(-2))}</strong>
                  </span>
                  <span className="appointment-content">
                    <strong>
                      {p.name}
                      {p.appointment === today() && (
                        <span className="today-dot">{t("Today", "আজ")}</span>
                      )}
                    </strong>
                    <span>{p.hospital}</span>
                    <small>
                      {p.department} <i />
                      {p.time} · BKK
                    </small>
                  </span>
                  <ArrowUpRight size={15} />
                </button>
              ))}
              {!appointments.length && (
                <div className="empty-state">
                  <CalendarDays size={28} />
                  <strong>
                    {t("Nothing scheduled", "কিছু নির্ধারিত নেই")}
                  </strong>
                  <span>
                    {t(
                      "No appointments in this period.",
                      "এই সময়ে কোনো অ্যাপয়েন্টমেন্ট নেই।"
                    )}
                  </span>
                </div>
              )}
            </div>
            <div className="appointment-note">
              <span>
                <Building2 size={15} />
              </span>
              <p>
                {t("Across offices, always in sync.", "দুই অফিস, একই আপডেট।")}
                <small>
                  {t(
                    "Appointment times are shown in Bangkok time.",
                    "অ্যাপয়েন্টমেন্টের সময় ব্যাংককের সময় অনুযায়ী।"
                  )}
                </small>
              </p>
            </div>
            <footer className="panel-footer">
              <span>
                {appointments.length}{" "}
                {t("upcoming appointments", "আসন্ন অ্যাপয়েন্টমেন্ট")}
              </span>
              <button
                className="text-button"
                onClick={() => setDialog("calendar")}
              >
                {t("View schedule", "সময়সূচি দেখুন")}
                <ArrowRight size={14} />
              </button>
            </footer>
          </section>
        </div>

        <section className="panel cases-panel" ref={casesRef}>
          <div className="panel-heading">
            <div>
              <h2>
                {t("Patient cases", "রোগীর কেস")}
                <span className="subtle-count">{filteredPatients.length}</span>
              </h2>
              <p>
                {t(
                  "A shared view of every patient in your care.",
                  "সেবাধীন প্রতিটি রোগীর তথ্য একসাথে।"
                )}
              </p>
            </div>
            <button className="export-button" onClick={exportCases}>
              <ArrowDownToLine size={14} />
              {t("Export CSV", "CSV এক্সপোর্ট")}
            </button>
          </div>
          <div className="case-filters">
            <label className="case-search">
              <Search size={16} />
              <input
                aria-label="Filter patients"
                value={query}
                placeholder={t(
                  "Search name, case ID, phone or hospital…",
                  "নাম, কেস আইডি, ফোন বা হাসপাতাল দিয়ে খুঁজুন…"
                )}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setPage(1)
                }}
              />
              {query && (
                <button
                  aria-label="Clear search"
                  onClick={() => {
                    setQuery("")
                    setPage(1)
                  }}
                >
                  <X size={14} />
                </button>
              )}
            </label>
            <div className="filter-select">
              <SlidersHorizontal size={14} />
              <select
                aria-label="Filter by stage"
                value={stageFilter}
                onChange={(e) => {
                  setStageFilter(e.target.value)
                  setPage(1)
                }}
              >
                <option value="">{t("All stages", "সব ধাপ")}</option>
                <option value="active">
                  {t("Active cases only", "শুধু সক্রিয় কেস")}
                </option>
                {stages.map((stage, i) => (
                  <option key={stage.name} value={i}>
                    {lang === "bn" ? stage.bn : stage.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="filter-select">
              <Users size={14} />
              <select
                aria-label="Filter by coordinator"
                value={coordinator}
                onChange={(e) => {
                  setCoordinator(e.target.value)
                  setPage(1)
                }}
              >
                <option value="">
                  {t("All coordinators", "সব কোঅর্ডিনেটর")}
                </option>
                {[...new Set(data.patients.map((p) => p.coordinator))].map(
                  (name) => (
                    <option key={name}>{name}</option>
                  )
                )}
              </select>
            </div>
            {(query || stageFilter || coordinator) && (
              <button
                className="reset-filters"
                onClick={() => {
                  setQuery("")
                  setStageFilter("")
                  setCoordinator("")
                  setPage(1)
                }}
              >
                {t("Reset", "রিসেট")}
                <X size={12} />
              </button>
            )}
          </div>
          <DataTable
            data={filteredPatients}
            page={page}
            pageSize={showAllCases ? 10 : 5}
            columns={columns}
            emptyMessage={t(
              "No patients match these filters. Try another search.",
              "এই ফিল্টারে কোনো রোগী পাওয়া যায়নি।"
            )}
          />
          {showAllCases ? (
            <Pagination
              page={page}
              total={filteredPatients.length}
              onPageChange={setPage}
            />
          ) : (
            <footer className="panel-footer">
              <span>
                {t(
                  `Showing ${Math.min(5, filteredPatients.length)} of ${filteredPatients.length} patient cases`,
                  `${filteredPatients.length}টি কেসের মধ্যে ${Math.min(5, filteredPatients.length)}টি দেখানো হচ্ছে`
                )}
              </span>
              <button
                className="text-button"
                onClick={() => {
                  setShowAllCases(true)
                  setPage(1)
                }}
              >
                {t("View all patient cases", "সব রোগীর কেস দেখুন")}
                <ArrowRight size={14} />
              </button>
            </footer>
          )}
        </section>

        <div className="bottom-grid">
          {can("acctView") && (
            <section className="panel accounts-panel" ref={accountsRef}>
              <div className="panel-heading">
                <div>
                  <h2>
                    <span className="section-icon violet">
                      <Wallet size={17} />
                    </span>
                    {t("The financial picture", "হিসাবের চিত্র")}
                    <span className="internal-label">
                      {t("INTERNAL", "অভ্যন্তরীণ")}
                    </span>
                  </h2>
                  <p>
                    {t(
                      "Patient accounts at a glance. Each currency stays separate.",
                      "প্রতিটি মুদ্রার হিসাব আলাদাভাবে দেখুন।"
                    )}
                  </p>
                </div>
                <div className="currency-tabs" aria-label="Account currency">
                  {(["BDT", "THB", "USD"] as const).map((cur) => (
                    <button
                      key={cur}
                      aria-pressed={currency === cur}
                      className={currency === cur ? "selected" : ""}
                      onClick={() => setCurrency(cur)}
                    >
                      {cur}
                    </button>
                  ))}
                </div>
              </div>
              <div className="account-metrics">
                <div>
                  <span>{t("Total charges", "মোট চার্জ")}</span>
                  <strong>{formatMoney(account.billed, currency)}</strong>
                  <small>
                    {t("Including draft estimates", "খসড়া প্রাক্কলনসহ")}
                  </small>
                </div>
                <div>
                  <span>
                    <ArrowDownLeft size={13} />
                    {t("Payments received", "পেমেন্ট গ্রহণ")}
                  </span>
                  <strong className="text-green">
                    {formatMoney(account.paid, currency)}
                  </strong>
                  <small>
                    {t("Recorded demo payments", "ডেমো পেমেন্টের রেকর্ড")}
                  </small>
                </div>
                <div>
                  <span>{t("Patient outstanding", "রোগীর বকেয়া")}</span>
                  <strong className="text-rose">
                    {formatMoney(account.due, currency)}
                  </strong>
                  <small>
                    {t("Across patient accounts", "সব রোগীর হিসাব মিলিয়ে")}
                  </small>
                </div>
              </div>
              <footer className="panel-footer">
                <span>
                  {t("Supplier outstanding", "সাপ্লায়ার বকেয়া")}
                  <strong>{formatMoney(account.supplier, currency)}</strong>
                </span>
                <button
                  className="text-button"
                  onClick={() => {
                    setQuery("")
                    setStageFilter("")
                    setCoordinator("")
                    showCases()
                  }}
                >
                  {t("View patient cases", "রোগীর কেস দেখুন")}
                  <ArrowRight size={14} />
                </button>
              </footer>
            </section>
          )}
          <section className="panel recent-panel">
            <div className="panel-heading">
              <h2>{t("Around the desk", "ডেস্কের সাম্প্রতিক খবর")}</h2>
              <button
                className="text-button"
                onClick={() => setDialog("activity")}
              >
                {t("View all", "সব দেখুন")}
                <ArrowUpRight size={14} />
              </button>
            </div>
            {activityList}
          </section>
        </div>

        <footer className="dashboard-footer">
          <p>
            <span className="footer-dot" />
            {t(
              "Fictional demo data · Saved only in this browser",
              "কাল্পনিক ডেমো তথ্য · শুধু এই ব্রাউজারে সংরক্ষিত"
            )}
          </p>
          <span>
            Thai Medical Desk <i />
            {t("Made for connected care", "একসাথে সেবার জন্য")}
          </span>
        </footer>
      </main>
      {currentCase && (
        <DashboardDialog
          title={t("Patient case", "রোগীর কেস")}
          onClose={closeDialog}
          wide
        >
          <a
            className="ws-inline-link ws-quick-case-link"
            href={`/patients/${currentCase.id}`}
          >
            Open full patient workspace →
          </a>
          <CaseDetails
            key={currentCase.id}
            patient={currentCase}
            lang={lang}
            tasks={data.tasks.filter((task) => task.caseId === currentCase.id)}
            onToggleTask={toggleTask}
            onAdvance={advanceCase}
            onAddNote={addNote}
          />
        </DashboardDialog>
      )}
      {dialog === "new-case" && (
        <DashboardDialog
          title={t(
            "Start a new patient journey",
            "নতুন রোগীর যাত্রা শুরু করুন"
          )}
          description={t(
            "A few details to bring your team onto the same page.",
            "আপনার টিমের কাজ শুরু করতে কিছু তথ্য দিন।"
          )}
          onClose={closeDialog}
        >
          <NewCaseForm
            patients={data.patients}
            onSave={addCase}
            onCancel={closeDialog}
            lang={lang}
          />
        </DashboardDialog>
      )}
      {dialog === "new-task" && (
        <DashboardDialog
          title={t("Add a follow-up", "ফলো-আপ যোগ করুন")}
          description={t(
            "A clear next step makes all the difference.",
            "পরবর্তী কাজ ও দায়িত্ব নির্ধারণ করুন।"
          )}
          onClose={closeDialog}
        >
          <NewTaskForm
            patients={patients.filter((p) => p.stage < 8)}
            onSave={addTask}
            onCancel={closeDialog}
            lang={lang}
          />
        </DashboardDialog>
      )}
      {dialog === "calendar" && (
        <DashboardDialog
          title={t("Your care calendar", "আপনার সেবার ক্যালেন্ডার")}
          description={t(
            "Follow-ups, hospital appointments and arrivals, together.",
            "ফলো-আপ, হাসপাতালের অ্যাপয়েন্টমেন্ট ও আগমনের খবর একসাথে।"
          )}
          onClose={closeDialog}
          wide
        >
          <div className="calendar-dialog">
            <div className="calendar-navigation">
              <button
                className="icon-button"
                aria-label="Previous day"
                onClick={() => {
                  const d = new Date(`${calendarDay}T12:00:00Z`)
                  d.setUTCDate(d.getUTCDate() - 1)
                  setCalendarDay(d.toISOString().slice(0, 10))
                }}
              >
                <ChevronLeft size={18} />
              </button>
              <input
                aria-label="Calendar date"
                type="date"
                value={calendarDay}
                onChange={(e) =>
                  e.target.value && setCalendarDay(e.target.value)
                }
              />
              <button
                className="icon-button"
                aria-label="Next day"
                onClick={() => {
                  const d = new Date(`${calendarDay}T12:00:00Z`)
                  d.setUTCDate(d.getUTCDate() + 1)
                  setCalendarDay(d.toISOString().slice(0, 10))
                }}
              >
                <ChevronRight size={18} />
              </button>
              <button
                className="text-button"
                onClick={() => setCalendarDay(today())}
              >
                {t("Today", "আজ")}
              </button>
              <Button
                className="calendar-add"
                onClick={() => setDialog("new-task")}
              >
                <Plus size={14} />
                {t("Add task", "কাজ যোগ করুন")}
              </Button>
            </div>
            <h3>{dateLabel(calendarDay, lang, true)}</h3>
            {tasks.filter((task) => task.due === calendarDay).map(taskRow)}
            {patients
              .filter((p) => p.appointment === calendarDay)
              .map((p) => (
                <button
                  key={p.id}
                  className="calendar-event"
                  onClick={() => openCase(p)}
                >
                  <CalendarDays size={18} />
                  <span>
                    <strong>{p.name}</strong>
                    <small>
                      {p.time} BKK · {p.hospital}
                    </small>
                  </span>
                  <span className="stage-pill stage-3">
                    {t("Appointment", "অ্যাপয়েন্টমেন্ট")}
                  </span>
                </button>
              ))}
            {patients
              .filter((p) => p.arrival === calendarDay)
              .map((p) => (
                <button
                  key={p.id}
                  className="calendar-event"
                  onClick={() => openCase(p)}
                >
                  <ArrowDownLeft size={18} />
                  <span>
                    <strong>{p.name}</strong>
                    <small>
                      {t("Arrival in Thailand", "থাইল্যান্ডে আগমন")}
                    </small>
                  </span>
                  <span className="stage-pill stage-5">
                    {t("Travel", "ভ্রমণ")}
                  </span>
                </button>
              ))}
            {!tasks.some((task) => task.due === calendarDay) &&
              !patients.some(
                (p) =>
                  p.appointment === calendarDay || p.arrival === calendarDay
              ) && (
                <div className="empty-state">
                  <CalendarDays size={28} />
                  <strong>
                    {t("A little breathing room", "এই দিনে কোনো কাজ নেই")}
                  </strong>
                  <span>
                    {t(
                      "Nothing scheduled for this date.",
                      "এই তারিখে কিছু নির্ধারিত নেই।"
                    )}
                  </span>
                </div>
              )}
            <h3>
              {t("Needs attention · overdue", "মনোযোগ প্রয়োজন · বিলম্বিত")}
            </h3>
            {overdue.map(taskRow)}
            {!overdue.length && (
              <p className="form-note">
                {t(
                  "No overdue follow-ups. Nicely done!",
                  "কোনো বিলম্বিত ফলো-আপ নেই।"
                )}
              </p>
            )}
          </div>
        </DashboardDialog>
      )}
      {dialog === "staff" && (
        <DashboardDialog
          title={t("One team, two offices", "এক টিম, দুই অফিস")}
          description={t(
            "Fictional team members for this demo workspace.",
            "এই ডেমো ওয়ার্কস্পেসের কাল্পনিক টিম সদস্য।"
          )}
          onClose={closeDialog}
        >
          <div className="staff-list">
            {staff.map((s) => (
              <div className="staff-row" key={s.name}>
                <span className={`patient-avatar avatar-${s.color}`}>
                  {s.initials}
                </span>
                <div>
                  <strong>{s.name}</strong>
                  <small>{s.role}</small>
                </div>
                <span className="stage-pill stage-8">{s.office}</span>
              </div>
            ))}
          </div>
        </DashboardDialog>
      )}
      {dialog === "activity" && (
        <DashboardDialog
          title={t("Around the desk", "ডেস্কের সাম্প্রতিক খবর")}
          description={t(
            "Demo activity history. Changes are stored in this browser only.",
            "ডেমো কাজের ইতিহাস। পরিবর্তন শুধু এই ব্রাউজারে সংরক্ষিত।"
          )}
          onClose={closeDialog}
        >
          {activityList}
        </DashboardDialog>
      )}
      {dialog === "info" && (
        <DashboardDialog
          title={t(
            "A shared desk. A demo for now.",
            "একটি ডেস্ক। আপাতত একটি ডেমো।"
          )}
          onClose={closeDialog}
        >
          <div className="system-info">
            <span className="system-info-symbol">
              <Cross size={30} />
            </span>
            <p>
              {t(
                "Thai Medical Desk helps Bangladesh and Thailand teams coordinate patient cases, appointments, follow-ups and accounts.",
                "Thai Medical Desk বাংলাদেশ ও থাইল্যান্ডের টিমকে রোগীর কেস, অ্যাপয়েন্টমেন্ট, ফলো-আপ ও হিসাব সমন্বয়ে সাহায্য করে।"
              )}
            </p>
            <ul>
              <li>
                <Check size={15} />
                {t(
                  "Search and filter fictional patient cases",
                  "কাল্পনিক রোগীর কেস খুঁজুন ও ফিল্টার করুন"
                )}
              </li>
              <li>
                <Check size={15} />
                {t(
                  "Create cases and follow-ups; complete tasks",
                  "কেস ও ফলো-আপ তৈরি করুন, কাজ সম্পন্ন করুন"
                )}
              </li>
              <li>
                <Check size={15} />
                {t(
                  "Update case stages and add permanent notes",
                  "কেসের ধাপ বদলান ও নোট যোগ করুন"
                )}
              </li>
              <li>
                <Check size={15} />
                {t(
                  "Export CSV, switch languages and review balances",
                  "CSV এক্সপোর্ট, ভাষা পরিবর্তন ও ব্যালেন্স দেখুন"
                )}
              </li>
            </ul>
            <div className="demo-explanation">
              <ShieldCheck size={20} />
              <p>
                {t("Frontend demonstration only", "শুধু ফ্রন্টএন্ড ডেমো")}
                <small>
                  {t(
                    "No server, real authentication, hospital connection or payments. Please use fictional information only. Your demo changes stay in this browser until you reset them.",
                    "কোনো সার্ভার, আসল লগইন, হাসপাতাল সংযোগ বা পেমেন্ট নেই। শুধু কাল্পনিক তথ্য ব্যবহার করুন। রিসেট না করা পর্যন্ত পরিবর্তন এই ব্রাউজারে থাকবে।"
                  )}
                </small>
              </p>
            </div>
            <Button variant="outline" onClick={() => setDialog("reset")}>
              {t("Reset demo data", "ডেমো তথ্য রিসেট করুন")}
            </Button>
          </div>
        </DashboardDialog>
      )}
      {dialog === "reset" && (
        <DashboardDialog
          title={t("Start fresh?", "নতুন করে শুরু করবেন?")}
          description={t(
            "This removes your demo changes and restores the original fictional cases and tasks.",
            "ডেমো পরিবর্তন মুছে শুরুর কাল্পনিক কেস ও কাজ ফিরিয়ে আনা হবে।"
          )}
          onClose={closeDialog}
        >
          <footer className="modal-footer">
            <Button variant="outline" onClick={closeDialog}>
              {t("Keep my changes", "পরিবর্তন রাখুন")}
            </Button>
            <Button
              onClick={() => {
                reset()

                setQuery("")
                setStageFilter("")
                setCoordinator("")
                setPage(1)
                setMineOnly(false)
                setTaskFilter("pending")
                closeDialog()
                toast.add({
                  title: t(
                    "Demo workspace reset",
                    "ডেমো ওয়ার্কস্পেস রিসেট হয়েছে"
                  ),
                  type: "success",
                })
              }}
            >
              {t("Reset demo", "ডেমো রিসেট")}
            </Button>
          </footer>
        </DashboardDialog>
      )}
    </div>
  )
}
