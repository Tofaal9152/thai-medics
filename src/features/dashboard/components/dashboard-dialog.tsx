import { useForm } from "@tanstack/react-form"
import {
  ArrowRight,
  CalendarDays,
  Check,
  CircleUserRound,
  MapPin,
  Phone,
  Plus,
  X,
} from "lucide-react"
import { useEffect, useRef, useState } from "react"
import type { ReactNode } from "react"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { dateLabel, formatMoney, initials, staff, stages, today } from "../data"
import type { Language, Patient, Task } from "../data"

export default function DashboardDialog({
  title,
  description,
  children,
  onClose,
  wide = false,
}: {
  title: string
  description?: string
  children: ReactNode
  onClose: () => void
  wide?: boolean
}) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const dialog = ref.current
    dialog?.showModal()
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      dialog?.close()
      document.body.style.overflow = previousOverflow
    }
  }, [])
  return (
    <dialog
      ref={ref}
      className={`medical-modal ${wide ? "modal-wide" : ""}`}
      aria-labelledby="dialog-heading"
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div className="modal-content">
        <header className="modal-heading">
          <div>
            <span className="eyebrow">THAI MEDICS</span>
            <h2 id="dialog-heading">{title}</h2>
            {description && <p>{description}</p>}
          </div>
          <button
            className="icon-button"
            aria-label="Close dialog"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </header>
        {children}
      </div>
    </dialog>
  )
}

const caseSchema = z.object({
  name: z.string().trim().min(2, "Enter the patient’s full name."),
  phone: z
    .string()
    .regex(/^\+?[\d\s()-]{7,20}$/, "Enter a valid phone number."),
  city: z.string(),
  need: z.string().trim().min(3, "Describe the patient’s stated need."),
  department: z.string(),
  source: z.string(),
  coordinator: z.string(),
  office: z.enum(["Bangladesh", "Thailand"]),
})
export type NewCaseValues = z.infer<typeof caseSchema>

export function NewCaseForm({
  patients,
  onSave,
  onCancel,
  lang,
}: {
  patients: Patient[]
  onSave: (values: NewCaseValues) => void
  onCancel: () => void
  lang: Language
}) {
  const t = (en: string, bn: string) => (lang === "bn" ? bn : en)
  const [duplicate, setDuplicate] = useState(false)
  const [allowDuplicate, setAllowDuplicate] = useState(false)
  const form = useForm({
    defaultValues: {
      name: "",
      phone: "",
      city: "",
      need: "",
      department: "General medicine",
      source: "Website",
      coordinator: "Nusrat Jahan",
      office: "Bangladesh",
    } as NewCaseValues,
    validators: { onSubmit: caseSchema },
    onSubmit: ({ value }) => {
      const normalized = (s: string) => s.replace(/\D/g, "")
      if (
        !allowDuplicate &&
        patients.some((p) => normalized(p.phone) === normalized(value.phone))
      ) {
        setDuplicate(true)
        return
      }
      onSave(caseSchema.parse(value))
    },
  })
  return (
    <form
      className="modal-form"
      onSubmit={(event) => {
        event.preventDefault()
        void form.handleSubmit()
      }}
    >
      <div className="form-grid">
        <form.Field name="name">
          {(field) => (
            <label className="form-field">
              {t("Patient name", "রোগীর নাম")} <span>*</span>
              <Input
                autoFocus
                required
                minLength={2}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="e.g. Farhana Akter"
              />
            </label>
          )}
        </form.Field>
        <form.Field name="phone">
          {(field) => (
            <label className="form-field">
              {t("Phone number", "ফোন নম্বর")} <span>*</span>
              <Input
                required
                type="tel"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => {
                  field.handleChange(e.target.value)
                  setDuplicate(false)
                  setAllowDuplicate(false)
                }}
                placeholder="+880 17XX XXXXXX"
              />
            </label>
          )}
        </form.Field>
        <form.Field name="city">
          {(field) => (
            <label className="form-field">
              {t("City / district", "শহর / জেলা")}
              <Input
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="Dhaka"
              />
            </label>
          )}
        </form.Field>
        <form.Field name="department">
          {(field) => (
            <label className="form-field">
              {t("Specialty", "বিভাগ")}
              <select
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
              >
                {[
                  "General medicine",
                  "Orthopaedics",
                  "Cardiology",
                  "Gynaecology",
                  "Neurology",
                  "Health check-up",
                ].map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
          )}
        </form.Field>
        <form.Field name="source">
          {(field) => (
            <label className="form-field">
              {t("Inquiry source", "অনুসন্ধানের উৎস")}
              <select
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
              >
                {["Website", "Facebook", "Agent", "Walk-in", "Referral"].map(
                  (item) => (
                    <option key={item}>{item}</option>
                  )
                )}
              </select>
            </label>
          )}
        </form.Field>
        <form.Field name="office">
          {(field) => (
            <label className="form-field">
              {t("Handling office", "দায়িত্বপ্রাপ্ত অফিস")}
              <select
                value={field.state.value}
                onChange={(e) =>
                  field.handleChange(e.target.value as NewCaseValues["office"])
                }
              >
                <option>Bangladesh</option>
                <option>Thailand</option>
              </select>
            </label>
          )}
        </form.Field>
        <form.Field name="coordinator">
          {(field) => (
            <label className="form-field full-field">
              {t("Responsible coordinator", "দায়িত্বপ্রাপ্ত কোঅর্ডিনেটর")}
              <select
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
              >
                {staff
                  .filter((s) => s.role.includes("Coordinator"))
                  .map((s) => (
                    <option key={s.name}>{s.name}</option>
                  ))}
              </select>
            </label>
          )}
        </form.Field>
        <form.Field name="need">
          {(field) => (
            <label className="form-field full-field">
              {t(
                "Medical need, as stated by patient",
                "রোগীর বক্তব্য অনুযায়ী চিকিৎসার প্রয়োজন"
              )}{" "}
              <span>*</span>
              <textarea
                required
                minLength={3}
                rows={3}
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder={t(
                  "What is the patient seeking help with?",
                  "রোগী কী সাহায্য চাচ্ছেন?"
                )}
              />
            </label>
          )}
        </form.Field>
      </div>
      {duplicate && (
        <div className="form-warning" role="alert">
          A case with this phone number already exists.
          <label>
            <input
              type="checkbox"
              checked={allowDuplicate}
              onChange={(e) => setAllowDuplicate(e.target.checked)}
            />{" "}
            Create a separate case for this returning patient.
          </label>
        </div>
      )}
      <form.Subscribe selector={(state) => state.errors}>
        {(errors) =>
          errors.length > 0 && (
            <p className="form-error" role="alert">
              {t(
                "Please check the patient name, phone number and stated medical need.",
                "রোগীর নাম, ফোন নম্বর ও চিকিৎসার প্রয়োজন যাচাই করুন।"
              )}
            </p>
          )
        }
      </form.Subscribe>
      <p className="form-note">
        {t(
          "Fictional data only. This desk does not provide medical advice.",
          "শুধু কাল্পনিক ডেমো তথ্য। এই সিস্টেম চিকিৎসা পরামর্শ দেয় না।"
        )}
      </p>
      <footer className="modal-footer">
        <Button variant="outline" type="button" onClick={onCancel}>
          {t("Cancel", "বাতিল")}
        </Button>
        <Button type="submit">
          <Plus size={16} />
          {t("Create patient case", "রোগীর কেস তৈরি করুন")}
        </Button>
      </footer>
    </form>
  )
}

export function NewTaskForm({
  patients,
  onSave,
  onCancel,
  lang,
}: {
  patients: Patient[]
  onSave: (task: Omit<Task, "id" | "done">) => void
  onCancel: () => void
  lang: Language
}) {
  const t = (en: string, bn: string) => (lang === "bn" ? bn : en)
  const form = useForm({
    defaultValues: {
      title: "",
      caseId: patients[0]?.id ?? "",
      due: today(),
      assignee: "Nusrat Jahan",
    },
    onSubmit: ({ value }) => {
      if (value.title.trim() && value.caseId && value.due)
        onSave({ ...value, title: value.title.trim() })
    },
  })
  return (
    <form
      className="modal-form"
      onSubmit={(event) => {
        event.preventDefault()
        void form.handleSubmit()
      }}
    >
      <div className="form-grid">
        <form.Field name="title">
          {(field) => (
            <label className="form-field full-field">
              {t("What needs to be done?", "কী কাজ করতে হবে?")} <span>*</span>
              <Input
                autoFocus
                required
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="Follow up with hospital"
              />
            </label>
          )}
        </form.Field>
        <form.Field name="caseId">
          {(field) => (
            <label className="form-field full-field">
              {t("Patient case", "রোগীর কেস")}
              <select
                required
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
              >
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} · {p.id}
                  </option>
                ))}
              </select>
            </label>
          )}
        </form.Field>
        <form.Field name="due">
          {(field) => (
            <label className="form-field">
              {t("Due date", "নির্ধারিত তারিখ")}
              <Input
                required
                type="date"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
              />
            </label>
          )}
        </form.Field>
        <form.Field name="assignee">
          {(field) => (
            <label className="form-field">
              {t("Assigned to", "দায়িত্বপ্রাপ্ত")}
              <select
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
              >
                {staff.map((s) => (
                  <option key={s.name}>{s.name}</option>
                ))}
              </select>
            </label>
          )}
        </form.Field>
      </div>
      <footer className="modal-footer">
        <Button variant="outline" type="button" onClick={onCancel}>
          {t("Cancel", "বাতিল")}
        </Button>
        <Button type="submit">
          <Plus size={16} />
          {t("Add follow-up", "ফলো-আপ যোগ করুন")}
        </Button>
      </footer>
    </form>
  )
}

export function CaseDetails({
  patient: p,
  tasks,
  onAdvance,
  onToggleTask,
  onAddNote,
  lang,
}: {
  patient: Patient
  tasks: Task[]
  onAdvance: () => void
  onToggleTask: (id: string) => void
  onAddNote: (note: string) => void
  lang: Language
}) {
  const [tab, setTab] = useState("overview")
  const [note, setNote] = useState("")
  const t = (en: string, bn: string) => (lang === "bn" ? bn : en)
  return (
    <div className="case-details">
      <div className="case-profile">
        <span className="large-avatar avatar-rose">{initials(p.name)}</span>
        <div>
          <h3>{p.name}</h3>
          <p>
            {p.id} <span>·</span> {p.city}
          </p>
        </div>
        <span className={`stage-pill stage-${p.stage}`}>
          <i />
          {lang === "bn" ? stages[p.stage].bn : stages[p.stage].name}
        </span>
      </div>
      <div className="case-progress" aria-label="Patient case progress">
        {stages.map((stage, i) => (
          <div
            key={stage.name}
            className={i <= p.stage ? "reached" : ""}
            title={stage.name}
          >
            <span>{i < p.stage ? <Check size={11} /> : i + 1}</span>
            <small>{lang === "bn" ? stage.bn : stage.name}</small>
          </div>
        ))}
      </div>
      <div className="modal-tabs" role="tablist" aria-label="Case details">
        {[
          ["overview", t("Overview", "সংক্ষিপ্ত বিবরণ")],
          ["notes", t("Notes & tasks", "নোট ও কাজ")],
          ["billing", t("Billing summary", "বিলিং সারাংশ")],
        ].map(([key, label]) => (
          <button
            key={key}
            role="tab"
            aria-selected={key === tab}
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}
      </div>
      <div role="tabpanel" aria-label={tab}>
        {tab === "overview" && (
          <>
            <div className="details-grid">
              <div>
                <Phone size={16} />
                <span>
                  {t("Phone", "ফোন")}
                  <strong>{p.phone}</strong>
                </span>
              </div>
              <div>
                <MapPin size={16} />
                <span>
                  {t("Office & source", "অফিস ও উৎস")}
                  <strong>
                    {p.office} · {p.source}
                  </strong>
                </span>
              </div>
              <div>
                <CircleUserRound size={16} />
                <span>
                  {t("Bangladesh coordinator", "বাংলাদেশ কোঅর্ডিনেটর")}
                  <strong>{p.coordinator}</strong>
                </span>
              </div>
              <div>
                <CircleUserRound size={16} />
                <span>
                  {t("Thailand coordinator", "থাইল্যান্ড কোঅর্ডিনেটর")}
                  <strong>{p.thaiCoordinator}</strong>
                </span>
              </div>
            </div>
            <section className="detail-block">
              <h4>
                {t("Patient’s stated need", "রোগীর বক্তব্য অনুযায়ী প্রয়োজন")}
              </h4>
              <p>{p.need}</p>
            </section>
            <section className="detail-block">
              <h4>
                {t("Hospital & appointment", "হাসপাতাল ও অ্যাপয়েন্টমেন্ট")}
              </h4>
              <strong>{p.hospital}</strong>
              <p>
                {p.department}{" "}
                {p.hospital !== "Not assigned" && `· ${p.doctor}`}
              </p>
              {p.appointment ? (
                <p className="appointment-detail">
                  <CalendarDays size={15} />
                  {dateLabel(p.appointment, lang, true)} · {p.time}{" "}
                  {t("(Bangkok time)", "(ব্যাংকক সময়)")}
                </p>
              ) : (
                <p>
                  {t(
                    "An appointment has not been scheduled yet.",
                    "এখনও অ্যাপয়েন্টমেন্ট নির্ধারিত হয়নি।"
                  )}
                </p>
              )}
            </section>
          </>
        )}
        {tab === "notes" && (
          <>
            <section className="detail-block">
              <h4>{t("Communication notes", "যোগাযোগ নোট")}</h4>
              {p.notes.map((n, i) => (
                <p className="case-note" key={`${i}-${n}`}>
                  {n}
                </p>
              ))}
              {!p.notes.length && (
                <p>
                  {t(
                    "No communication notes yet.",
                    "এখনও কোনো যোগাযোগ নোট নেই।"
                  )}
                </p>
              )}
              <form
                className="note-compose"
                onSubmit={(e) => {
                  e.preventDefault()
                  if (note.trim()) {
                    onAddNote(note.trim())
                    setNote("")
                  }
                }}
              >
                <textarea
                  aria-label="New communication note"
                  required
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={t(
                    "Add a communication note…",
                    "যোগাযোগ নোট লিখুন…"
                  )}
                />
                <Button type="submit" disabled={!note.trim()}>
                  {t("Save note", "নোট সংরক্ষণ")}
                </Button>
              </form>
            </section>
            <section className="detail-block">
              <h4>{t("Case follow-ups", "কেস ফলো-আপ")}</h4>
              {tasks.map((task) => (
                <label
                  className={`simple-task ${task.done ? "is-done" : ""}`}
                  key={task.id}
                >
                  <input
                    type="checkbox"
                    checked={task.done}
                    onChange={() => onToggleTask(task.id)}
                  />
                  <span>
                    {task.title}
                    <small>
                      {dateLabel(task.due, lang)} · {task.assignee}
                    </small>
                  </span>
                </label>
              ))}
              {!tasks.length && (
                <p>
                  {t(
                    "No follow-up tasks for this case.",
                    "এই কেসে কোনো ফলো-আপ কাজ নেই।"
                  )}
                </p>
              )}
            </section>
          </>
        )}
        {tab === "billing" && (
          <section className="detail-block">
            <h4>
              {t("Patient account", "রোগীর হিসাব")} · {p.currency}
            </h4>
            <div className="billing-detail-row">
              <span>
                {t("Total charges (estimate)", "মোট চার্জ (ডেমো প্রাক্কলন)")}
              </span>
              <strong>{formatMoney(p.billed, p.currency)}</strong>
            </div>
            <div className="billing-detail-row">
              <span>{t("Payments received", "পেমেন্ট গ্রহণ")}</span>
              <strong>{formatMoney(p.paid, p.currency)}</strong>
            </div>
            <div className="billing-detail-row balance">
              <span>{t("Outstanding balance", "বকেয়া ব্যালেন্স")}</span>
              <strong>{formatMoney(p.billed - p.paid, p.currency)}</strong>
            </div>
            <p className="form-note">
              {t(
                "Illustrative balances only. No real invoice or payment is created.",
                "শুধু উদাহরণমূলক ব্যালেন্স। কোনো আসল ইনভয়েস বা পেমেন্ট তৈরি হয় না।"
              )}
            </p>
          </section>
        )}
      </div>
      <footer className="modal-footer">
        <span className="form-note">
          {t(
            "changes are saved in this browser.",
            "ডেমো পরিবর্তন এই ব্রাউজারে সংরক্ষিত হয়।"
          )}
        </span>
        <Button onClick={onAdvance} disabled={p.stage === 8}>
          {p.stage === 8 ? <Check size={15} /> : <ArrowRight size={15} />}
          {p.stage === 8
            ? t("Completed", "সম্পন্ন")
            : t("Move to next stage", "পরের ধাপে নিন")}
        </Button>
      </footer>
    </div>
  )
}
