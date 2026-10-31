import { AmbulanceCaseSummary } from "../components/ambulance-workspace"
import { useState } from "react"
import { Link } from "@tanstack/react-router"
import { ArrowLeft, ArrowRight, Check, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { dateLabel, dayOffset, stages, today } from "@/features/dashboard/data"
import { useWorkspace } from "../context"
import { blankMeta, uid } from "../model"
import type { Values } from "../model"
import CaseFiles from "../components/case-files"
import BillingWorkspace from "../components/billing-workspace"
import { RecordForm } from "../components/form"
import { choices } from "../form-options"
import type { FieldDef } from "../components/form"
import { Badge, Empty, Modal, Panel } from "../components/ui"
export default function CaseWorkspace({ caseId }: { caseId: string }) {
  const { data, commit, can, session } = useWorkspace(),
    patient = data.patients.find((p) => p.id === caseId),
    meta = data.caseMeta[caseId] || blankMeta()
  const [tab, setTab] = useState("overview"),
    [editing, setEditing] = useState<string | null>(null)
  if (!patient)
    return (
      <div className="workspace-page">
        <Empty>This patient case was not found.</Empty>
        <Link to="/workspace/$module" params={{ module: "patients" }}>
          Back to patients
        </Link>
      </div>
    )
  const p = patient,
    caseTasks = data.tasks.filter((t) => t.caseId === caseId),
    caseVisas = data.collections.visas.filter((v) => v.values.caseId === caseId)
  const patientFields: FieldDef[] = [
    { key: "name", label: "Patient name", required: true },
    { key: "phone", label: "Phone", type: "tel", required: true },
    { key: "email", label: "Email", type: "email" },
    { key: "age", label: "Age", type: "number", min: 0, step: "1" },
    {
      key: "gender",
      label: "Gender",
      type: "select",
      options: choices("", "Female", "Male", "Other"),
    },
    { key: "city", label: "City / district" },
    { key: "passport", label: "Passport number" },
    { key: "companion", label: "Accompanying person" },
    { key: "companionPhone", label: "Companion phone", type: "tel" },
    {
      key: "office",
      label: "Handling office",
      type: "select",
      options: choices("Bangladesh", "Thailand"),
    },
    {
      key: "source",
      label: "Inquiry source",
      type: "select",
      options: choices(
        "Website",
        "Facebook",
        "Phone",
        "Agent",
        "Walk-in",
        "Referral"
      ),
    },
    {
      key: "agentId",
      label: "Agent",
      type: "select",
      options: [
        { value: "", label: "No referring agent" },
        ...data.collections.agents.map((a) => ({
          value: a.id,
          label: a.values.name,
        })),
      ],
    },
    {
      key: "coordinator",
      label: "Responsible coordinator",
      type: "select",
      options: data.collections.staff
        .filter((s) => s.values.status === "Active")
        .map((s) => ({ value: s.values.name, label: s.values.name })),
    },
    {
      key: "need",
      label: "Medical need, as stated by patient",
      type: "textarea",
      required: true,
      full: true,
    },
  ]
  const hospitalFields: FieldDef[] = [
    {
      key: "hospitalId",
      label: "Hospital",
      type: "select",
      options: [
        { value: "", label: "Not assigned" },
        ...data.collections.hospitals.map((h) => ({
          value: h.id,
          label: h.values.name,
        })),
      ],
    },
    {
      key: "doctorId",
      label: "Doctor",
      type: "select",
      options: [
        { value: "", label: "Not assigned" },
        ...data.collections.doctors.map((d) => ({
          value: d.id,
          label: d.values.name,
        })),
      ],
    },
    { key: "department", label: "Department" },
    { key: "appointment", label: "Appointment date", type: "date" },
    { key: "time", label: "Time (Bangkok)", type: "time" },
    { key: "submitted", label: "Reports submitted on", type: "date" },
    { key: "responded", label: "Response received on", type: "date" },
    {
      key: "proposal",
      label: "Proposal status",
      type: "select",
      options: choices("Not sent", "Awaiting decision", "Accepted", "Declined"),
    },
  ]
  const thaiFields: FieldDef[] = [
    {
      key: "thaiCoordinator",
      label: "Thailand coordinator",
      type: "select",
      options: [
        { value: "Not assigned", label: "Not assigned" },
        ...data.collections.staff
          .filter(
            (s) =>
              s.values.office === "Thailand" && s.values.status === "Active"
          )
          .map((s) => ({ value: s.values.name, label: s.values.name })),
      ],
    },
    { key: "arrival", label: "Arrival date", type: "date" },
    { key: "flight", label: "Arrival flight" },
    { key: "departure", label: "Departure date", type: "date" },
    { key: "returnFlight", label: "Departure flight" },
    { key: "accommodation", label: "Accommodation" },
    {
      key: "airport",
      label: "Airport transfer",
      type: "select",
      options: choices("Pending", "Arranged", "Not needed"),
    },
    {
      key: "transport",
      label: "Hospital transport",
      type: "select",
      options: choices("Pending", "Arranged", "Not needed"),
    },
    { key: "interpreter", label: "Interpreter" },
  ]
  function updatePatient(values: Values) {
    const phone = values.phone.replace(/\D/g, "")
    if (
      data.patients.some(
        (other) =>
          other.id !== caseId && other.phone.replace(/\D/g, "") === phone
      )
    )
      throw new Error(
        "Duplicate phone warning: another patient case uses this number. Review that case before saving."
      )
    if (
      values.passport &&
      Object.entries(data.caseMeta).some(
        ([id, m]) =>
          id !== caseId &&
          m.passport.toLowerCase() === values.passport.toLowerCase()
      )
    )
      throw new Error(
        "Duplicate passport warning: this passport belongs to another case."
      )
    if (values.source === "Agent" && !values.agentId)
      throw new Error("Choose the referring agent.")
    commit("Patient details updated", (prev) => ({
      ...prev,
      patients: prev.patients.map((item) =>
        item.id === caseId
          ? {
              ...item,
              name: values.name,
              phone: values.phone,
              city: values.city,
              need: values.need,
              source: values.source,
              coordinator: values.coordinator,
              office: values.office === "Thailand" ? "Thailand" : "Bangladesh",
            }
          : item
      ),
      caseMeta: {
        ...prev.caseMeta,
        [caseId]: { ...meta, ...values, gender: values.gender },
      },
    }))
    setEditing(null)
  }
  function stage(direction: number) {
    const next = p.stage + direction
    if (next < 0 || next > 8) return
    commit(
      `Case moved to ${stages[next].name}`,
      (prev) => ({
        ...prev,
        patients: prev.patients.map((item) =>
          item.id === caseId ? { ...item, stage: next } : item
        ),
      }),
      "case"
    )
  }
  function saveNote(v: Values) {
    commit(
      "Communication note added",
      (prev) => ({
        ...prev,
        patients: prev.patients.map((item) =>
          item.id === caseId
            ? {
                ...item,
                notes: [
                  ...item.notes,
                  `${v.channel} · ${v.at || today()} · ${session.name}\n${v.summary}${v.outcome ? "\nOutcome: " + v.outcome : ""}${v.next ? "\nNext action: " + v.next : ""}`,
                ],
              }
            : item
        ),
        tasks: v.due
          ? [
              ...prev.tasks,
              {
                id: uid("task"),
                caseId,
                title: v.next || "Follow-up",
                due: v.due,
                assignee: session.name,
                done: false,
              },
            ]
          : prev.tasks,
      }),
      "note"
    )
    setEditing(null)
  }
  function taskForm(v: Values) {
    commit(
      "Follow-up task added",
      (prev) => ({
        ...prev,
        tasks: [
          ...prev.tasks,
          {
            id: uid("task"),
            caseId,
            title: v.title,
            due: v.due,
            assignee: v.assignee,
            done: false,
          },
        ],
      }),
      "task"
    )
    setEditing(null)
  }
  const tabs = [
    ["overview", "Overview"],
    ["records", "Medical records"],
    ["communication", "Communication"],
    ["hospital", "Hospital & appointment"],
    ["visa", "Visa"],
    ["thailand", "Thailand assistance"],
    ["tasks", "Follow-up tasks"],
    ...(can("acctView") ? [["billing", "Accounts & billing"]] : []),
  ]
  const details = (items: [string, string | undefined][]) => (
    <div className="ws-detail-grid">
      {items.map(([label, value]) => (
        <div key={label}>
          <small>{label}</small>
          <p>{value || "—"}</p>
        </div>
      ))}
    </div>
  )
  return (
    <div className="workspace-page">
      <Link
        to="/workspace/$module"
        params={{ module: "patients" }}
        className="ws-back-link"
      >
        <ArrowLeft size={14} />
        Patient cases
      </Link>
      <section className="ws-case-header">
        <div>
          <span className="page-eyebrow">
            {p.id} · {p.office}
          </span>
          <h1>{p.name}</h1>
          <p>
            {p.phone} · {p.city} · Created {dateLabel(p.created)}
          </p>
        </div>
        <div className="ws-actions">
          <Badge
            tone={
              meta.status === "lost" ? "rose" : p.stage === 8 ? "green" : "blue"
            }
          >
            {meta.status === "lost" ? "Lost lead" : stages[p.stage].name}
          </Badge>
          {can("caseEdit") && (
            <Button variant="outline" onClick={() => setEditing("patient")}>
              Edit patient
            </Button>
          )}
        </div>
        <div className="ws-case-progress">
          {stages.map((s, i) => (
            <div key={s.name} className={i <= p.stage ? "reached" : ""}>
              <span>{i < p.stage ? <Check size={12} /> : i + 1}</span>
              <small>{s.name}</small>
            </div>
          ))}
        </div>
        {meta.status === "lost" ? (
          <p className="ws-warning">Lost lead: {meta.lostReason}</p>
        ) : (
          can("stage") && (
            <div className="ws-inline-actions">
              <Button
                variant="outline"
                disabled={p.stage === 0}
                onClick={() => stage(-1)}
              >
                Previous stage
              </Button>
              <Button disabled={p.stage === 8} onClick={() => stage(1)}>
                Next stage
                <ArrowRight size={14} />
              </Button>
              <Button variant="ghost" onClick={() => setEditing("lost")}>
                Mark as lost lead
              </Button>
            </div>
          )
        )}
      </section>
      <nav className="ws-case-tabs" aria-label="Patient case sections">
        {tabs.map(([key, label]) => (
          <button
            key={key}
            aria-pressed={tab === key}
            className={tab === key ? "selected" : ""}
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}
      </nav>
      {tab === "overview" && (
        <>
          <Panel title="Patient details">
            {details([
              ["Phone", p.phone],
              ["WhatsApp", p.phone],
              ["Email", meta.email],
              ["Age / gender", `${meta.age || "—"} / ${meta.gender || "—"}`],
              ["City / district", p.city],
              ["Passport", meta.passport],
              ["Inquiry source", p.source],
              [
                "Agent",
                data.collections.agents.find((a) => a.id === meta.agentId)
                  ?.values.name,
              ],
              ["Medical need, as stated", p.need],
            ])}
          </Panel>
          <div className="ws-two-column">
            <Panel title="Assigned team">
              {details([
                ["Bangladesh coordinator", p.coordinator],
                ["Thailand coordinator", p.thaiCoordinator],
                ["Handling office", p.office],
              ])}
            </Panel>
            <Panel title="Accompanying person">
              {details([
                ["Name", meta.companion],
                ["Phone", meta.companionPhone],
              ])}
            </Panel>
          </div>
        </>
      )}
      {tab === "records" && <CaseFiles caseId={caseId} />}
      {tab === "communication" && (
        <Panel
          title="Communication history"
          subtitle="Notes are append-only. Simulated sent messages also appear here."
          actions={
            can("notes") ? (
              <Button onClick={() => setEditing("note")}>
                <Plus size={14} />
                Add note
              </Button>
            ) : undefined
          }
        >
          <div className="ws-timeline">
            {p.notes.map((note, i) => (
              <article key={i}>
                <span />
                <div>
                  <small>Patient case · {i + 1}</small>
                  <p>{note}</p>
                </div>
              </article>
            ))}
            {!p.notes.length && <Empty>No communication notes yet.</Empty>}
          </div>
          <Link
            to="/workspace/$module"
            params={{ module: "messages" }}
            className="ws-panel-link"
          >
            Open message composer →
          </Link>
        </Panel>
      )}
      {tab === "hospital" && (
        <>
          <Panel
            title="Hospital & appointment"
            actions={
              can("hospital") ? (
                <Button
                  variant="outline"
                  onClick={() => setEditing("hospital")}
                >
                  Edit appointment
                </Button>
              ) : undefined
            }
          >
            {details([
              ["Hospital", p.hospital],
              ["Department", p.department],
              ["Doctor", p.doctor],
              [
                "Appointment",
                p.appointment
                  ? `${dateLabel(p.appointment)} · ${p.time} Bangkok time`
                  : "Not scheduled",
              ],
              ["Reports submitted", meta.submitted],
              ["Response received", meta.responded],
              ["Proposal", meta.proposal],
            ])}
            {meta.submitted && !meta.responded && (
              <p className="ws-warning">
                Awaiting hospital reply ·{" "}
                {Math.max(
                  0,
                  Math.floor(
                    (Date.parse(today()) - Date.parse(meta.submitted)) /
                      86400000
                  )
                )}{" "}
                days since submission.
              </p>
            )}
          </Panel>
          <Panel title="Hospital quotations & treatment plans">
            <div className="ws-detail-body">
              {data.files
                .filter(
                  (f) =>
                    f.caseId === caseId &&
                    ["Hospital quotation", "Treatment plan"].includes(
                      f.category
                    )
                )
                .map((f) => (
                  <p key={f.id}>
                    {f.name} · {f.date}
                  </p>
                ))}
              <Link
                to="/workspace/$module"
                params={{ module: "packages" }}
                className="ws-inline-link"
              >
                Compare hospital proposals →
              </Link>
              <Button variant="outline" onClick={() => setTab("records")}>
                Manage attachments
              </Button>
            </div>
          </Panel>
        </>
      )}
      {tab === "visa" && (
        <>
          <Panel
            title="Patient & attendant visas"
            actions={
              can("visas") ? (
                <Link
                  to="/workspace/$module"
                  params={{ module: "visas" }}
                  className="ws-inline-link"
                >
                  Open visa desk →
                </Link>
              ) : undefined
            }
          >
            <div className="ws-linked-records">
              {caseVisas.map((v) => (
                <article key={v.id}>
                  <h3>{v.values.name}</h3>
                  <Badge
                    tone={v.values.status === "Approved" ? "green" : "amber"}
                  >
                    {v.values.status}
                  </Badge>
                  <small>
                    {v.values.relation} · {v.values.passport}
                  </small>
                  <p>
                    Documents:{" "}
                    {(v.values.checked || "").split("|").filter(Boolean).length}{" "}
                    / 5
                  </p>
                  <small>Passport expires {v.values.expiry}</small>
                </article>
              ))}
              {!caseVisas.length && (
                <Empty>No visa record linked to this case yet.</Empty>
              )}
            </div>
          </Panel>
          <AmbulanceCaseSummary caseId={caseId} />
        </>
      )}
      {tab === "thailand" && (
        <>
          <Panel
            title="Thailand arrangements"
            actions={
              can("thai") ? (
                <Button
                  variant="outline"
                  onClick={() => setEditing("thailand")}
                >
                  Edit arrangements
                </Button>
              ) : undefined
            }
          >
            {details([
              ["Thailand coordinator", p.thaiCoordinator],
              ["Arrival", `${p.arrival || "—"} ${meta.flight}`],
              ["Departure", `${meta.departure || "—"} ${meta.returnFlight}`],
              ["Accommodation", meta.accommodation],
              ["Airport transfer", meta.airport],
              ["Hospital transport", meta.transport],
              ["Interpreter", meta.interpreter],
            ])}
            <Link
              to="/workspace/$module"
              params={{ module: "ground" }}
              className="ws-panel-link"
            >
              View service rosters →
            </Link>
          </Panel>
          <Panel
            title="Office handover notes"
            actions={
              can("notes") ? (
                <Button
                  variant="outline"
                  onClick={() => setEditing("handover")}
                >
                  Add handover
                </Button>
              ) : undefined
            }
          >
            <div className="ws-timeline">
              {meta.handovers.map((h, i) => (
                <article key={i}>
                  <span />
                  <div>
                    <small>
                      {h.by} · {h.office} · {new Date(h.at).toLocaleString()}
                    </small>
                    {h.office !== session.office && (
                      <Badge tone="amber">From the other office</Badge>
                    )}
                    <p>{h.text}</p>
                  </div>
                </article>
              ))}
              {!meta.handovers.length && <Empty>No handover notes yet.</Empty>}
            </div>
          </Panel>
        </>
      )}
      {tab === "tasks" && (
        <Panel
          title="Follow-up tasks"
          actions={
            can("tasks") ? (
              <Button onClick={() => setEditing("task")}>
                <Plus size={14} />
                Add task
              </Button>
            ) : undefined
          }
        >
          <div className="ws-task-list">
            {caseTasks.map((task) => (
              <label key={task.id} className={task.done ? "done" : ""}>
                <input
                  type="checkbox"
                  disabled={!can("tasks")}
                  checked={task.done}
                  onChange={() =>
                    commit(
                      task.done ? "Follow-up reopened" : "Follow-up completed",
                      (prev) => ({
                        ...prev,
                        tasks: prev.tasks.map((t) =>
                          t.id === task.id ? { ...t, done: !t.done } : t
                        ),
                      }),
                      "task"
                    )
                  }
                />
                <div>
                  <strong>{task.title}</strong>
                  <small>
                    {task.assignee} · {dateLabel(task.due)}
                  </small>
                </div>
                <Badge
                  tone={
                    task.done ? "green" : task.due < today() ? "rose" : "amber"
                  }
                >
                  {task.done
                    ? "Completed"
                    : task.due < today()
                      ? "Overdue"
                      : task.due === today()
                        ? "Today"
                        : "Upcoming"}
                </Badge>
              </label>
            ))}
            {!caseTasks.length && <Empty>No tasks for this case.</Empty>}
          </div>
        </Panel>
      )}
      {tab === "billing" && can("acctView") && (
        <BillingWorkspace caseId={caseId} />
      )}
      {editing && (
        <Modal
          title={
            {
              patient: "Edit patient details",
              hospital: "Hospital & appointment",
              thailand: "Thailand arrangements",
              lost: "Record a lost lead",
              note: "Add a communication note",
              handover: "Add office handover",
              task: "Add a follow-up task",
            }[editing] || "Edit record"
          }
          onClose={() => setEditing(null)}
          wide
        >
          {editing === "patient" && (
            <RecordForm
              fields={patientFields}
              initial={{
                ...Object.fromEntries(
                  Object.entries(meta).filter(([, v]) => typeof v === "string")
                ),
                name: p.name,
                phone: p.phone,
                city: p.city,
                need: p.need,
                office: p.office,
                source: p.source,
                coordinator: p.coordinator,
              }}
              onSave={updatePatient}
              onCancel={() => setEditing(null)}
            />
          )}
          {editing === "hospital" && (
            <RecordForm
              fields={hospitalFields}
              initial={{
                hospitalId:
                  data.collections.hospitals.find(
                    (h) => h.values.name === p.hospital
                  )?.id || "",
                doctorId:
                  data.collections.doctors.find(
                    (d) => d.values.name === p.doctor
                  )?.id || "",
                department: p.department,
                appointment: p.appointment,
                time: p.time,
                submitted: meta.submitted,
                responded: meta.responded,
                proposal: meta.proposal,
              }}
              onSave={(v) => {
                const h = data.collections.hospitals.find(
                    (h) => h.id === v.hospitalId
                  ),
                  d = data.collections.doctors.find((d) => d.id === v.doctorId)
                if (d && d.values.hospital !== v.hospitalId)
                  throw new Error(
                    "The doctor must belong to the selected hospital."
                  )
                commit("Hospital and appointment updated", (prev) => ({
                  ...prev,
                  patients: prev.patients.map((item) =>
                    item.id === caseId
                      ? {
                          ...item,
                          hospital: h?.values.name || "Not assigned",
                          doctor: d?.values.name || "",
                          department: v.department,
                          appointment: v.appointment,
                          time: v.time,
                        }
                      : item
                  ),
                  caseMeta: {
                    ...prev.caseMeta,
                    [caseId]: {
                      ...meta,
                      proposal: v.proposal,
                      submitted: v.submitted,
                      responded: v.responded,
                    },
                  },
                }))
                setEditing(null)
              }}
              onCancel={() => setEditing(null)}
            />
          )}
          {editing === "thailand" && (
            <RecordForm
              fields={thaiFields}
              initial={
                {
                  ...Object.fromEntries(
                    Object.entries(meta).filter(
                      ([, v]) => typeof v === "string"
                    )
                  ),
                  thaiCoordinator: p.thaiCoordinator,
                  arrival: p.arrival,
                } as Values
              }
              onSave={(v) => {
                if (
                  v.departure &&
                  p.arrival &&
                  v.departure < (v.arrival || p.arrival)
                )
                  throw new Error("Departure cannot be before arrival.")
                commit("Thailand arrangements updated", (prev) => ({
                  ...prev,
                  patients: prev.patients.map((item) =>
                    item.id === caseId
                      ? {
                          ...item,
                          thaiCoordinator: v.thaiCoordinator,
                          arrival: v.arrival,
                        }
                      : item
                  ),
                  caseMeta: { ...prev.caseMeta, [caseId]: { ...meta, ...v } },
                }))
                setEditing(null)
              }}
              onCancel={() => setEditing(null)}
            />
          )}
          {editing === "lost" && (
            <RecordForm
              fields={[
                {
                  key: "reason",
                  label: "Lost lead reason",
                  required: true,
                  type: "select",
                  options: choices(
                    "Price",
                    "Another provider",
                    "Medical advice",
                    "Visa refused",
                    "Other"
                  ),
                },
                { key: "details", label: "Details", type: "textarea" },
              ]}
              onSave={(v) => {
                commit(
                  "Case closed as lost lead",
                  (prev) => ({
                    ...prev,
                    caseMeta: {
                      ...prev.caseMeta,
                      [caseId]: {
                        ...meta,
                        status: "lost",
                        lostReason:
                          v.reason + (v.details ? " · " + v.details : ""),
                      },
                    },
                  }),
                  "case"
                )
                setEditing(null)
              }}
              onCancel={() => setEditing(null)}
            />
          )}
          {editing === "note" && (
            <RecordForm
              fields={[
                {
                  key: "channel",
                  label: "Channel",
                  type: "select",
                  options: choices("Phone", "WhatsApp", "Email", "In person"),
                  required: true,
                },
                {
                  key: "at",
                  label: "Date & time",
                  type: "datetime-local",
                  required: true,
                },
                {
                  key: "summary",
                  label: "Discussion summary",
                  type: "textarea",
                  required: true,
                  full: true,
                },
                { key: "outcome", label: "Outcome" },
                { key: "next", label: "Next action" },
                { key: "due", label: "Next-action due date", type: "date" },
              ]}
              initial={{ at: today() + "T10:00" }}
              onSave={saveNote}
              onCancel={() => setEditing(null)}
            />
          )}
          {editing === "handover" && (
            <RecordForm
              fields={[
                {
                  key: "text",
                  label: "Handover note",
                  type: "textarea",
                  required: true,
                },
              ]}
              onSave={(v) => {
                commit(
                  "Office handover added",
                  (prev) => ({
                    ...prev,
                    caseMeta: {
                      ...prev.caseMeta,
                      [caseId]: {
                        ...meta,
                        handovers: [
                          ...meta.handovers,
                          {
                            text: v.text,
                            by: session.name,
                            office: session.office,
                            at: new Date().toISOString(),
                          },
                        ],
                      },
                    },
                  }),
                  "note"
                )
                setEditing(null)
              }}
              onCancel={() => setEditing(null)}
            />
          )}
          {editing === "task" && (
            <RecordForm
              fields={[
                { key: "title", label: "Task", required: true },
                { key: "due", label: "Due date", type: "date", required: true },
                {
                  key: "assignee",
                  label: "Assigned to",
                  type: "select",
                  options: data.collections.staff
                    .filter((s) => s.values.status === "Active")
                    .map((s) => ({
                      value: s.values.name,
                      label: s.values.name,
                    })),
                },
              ]}
              initial={{ due: dayOffset(1), assignee: p.coordinator }}
              onSave={taskForm}
              onCancel={() => setEditing(null)}
            />
          )}
        </Modal>
      )}
    </div>
  )
}
