import QuoteComparison from "../components/quote-comparison"
import { useMemo, useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { Link } from "@tanstack/react-router"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { dateLabel, dayOffset, stages, today } from "@/features/dashboard/data"
import type { Patient } from "@/features/dashboard/data"
import { useWorkspace } from "../context"
import { uid } from "../model"
import type { Currency, Values } from "../model"
import { displayMoney, totals } from "../billing"
import { exportExcel } from "../export"
import BillingWorkspace from "../components/billing-workspace"
import { RecordForm } from "../components/form"
import { choices } from "../form-options"
import {
  Badge,
  DataList,
  Empty,
  ExportButton,
  Metric,
  Modal,
  PageHeader,
  Panel,
} from "../components/ui"
export function CalendarPage() {
  const { data, commit, can, session, office } = useWorkspace()
  const [month, setMonth] = useState(today().slice(0, 7)),
    [selected, setSelected] = useState(today()),
    [mode, setMode] = useState("month"),
    [mine, setMine] = useState(false),
    [adding, setAdding] = useState(false)
  const patients = data.patients.filter(
      (p) =>
        (office === "All offices" || p.office === office) &&
        (!mine ||
          p.coordinator === session.name ||
          p.thaiCoordinator === session.name)
    ),
    ids = new Set(
      data.patients
        .filter((p) => office === "All offices" || p.office === office)
        .map((p) => p.id)
    ),
    tasks = data.tasks.filter(
      (t) => ids.has(t.caseId) && (!mine || t.assignee === session.name)
    )
  const first = new Date(month + "-01T12:00:00Z"),
    start = (first.getUTCDay() + 6) % 7,
    days = new Date(
      first.getUTCFullYear(),
      first.getUTCMonth() + 1,
      0
    ).getDate()
  const [year, mo] = month.split("-").map(Number)
  function events(date: string) {
    return [
      ...tasks
        .filter((t) => t.due === date)
        .map((t) => ({
          id: t.id,
          type: t.done ? "Done" : t.due < today() ? "Overdue" : "Task",
          title: t.title,
          caseId: t.caseId,
          done: t.done,
          task: true,
        })),
      ...patients
        .filter((p) => p.appointment === date)
        .map((p) => ({
          id: "appt-" + p.id,
          type: "Appointment",
          title: `${p.time} · ${p.name}`,
          caseId: p.id,
          done: false,
          task: false,
        })),
      ...patients
        .filter((p) => p.arrival === date)
        .map((p) => ({
          id: "arrival-" + p.id,
          type: "Arrival",
          title: p.name,
          caseId: p.id,
          done: false,
          task: false,
        })),
      ...patients
        .filter((p) => data.caseMeta[p.id]?.departure === date)
        .map((p) => ({
          id: "departure-" + p.id,
          type: "Departure",
          title: p.name,
          caseId: p.id,
          done: false,
          task: false,
        })),
    ]
  }
  function move(dir: number) {
    const date = new Date(Date.UTC(year, mo - 1 + dir, 1, 12))
    setMonth(date.toISOString().slice(0, 7))
  }
  const renderEvents = (date: string) =>
    events(date).map((event) => (
      <div key={event.id} className="ws-calendar-event">
        {event.task && (
          <input
            type="checkbox"
            aria-label={`Complete ${event.title}`}
            checked={event.done}
            disabled={!can("tasks")}
            onChange={() =>
              commit(
                event.done ? "Follow-up reopened" : "Follow-up completed",
                (prev) => ({
                  ...prev,
                  tasks: prev.tasks.map((t) =>
                    t.id === event.id ? { ...t, done: !t.done } : t
                  ),
                }),
                "task"
              )
            }
          />
        )}
        <Link to="/patients/$caseId" params={{ caseId: event.caseId }}>
          <strong>{event.title}</strong>
          <small>
            {data.patients.find((p) => p.id === event.caseId)?.name} ·{" "}
            {dateLabel(date)}
          </small>
        </Link>
        <Badge
          tone={
            event.type === "Overdue"
              ? "rose"
              : event.type === "Done"
                ? "green"
                : event.type === "Appointment"
                  ? "blue"
                  : "amber"
          }
        >
          {event.type}
        </Badge>
      </div>
    ))
  return (
    <div className="workspace-page">
      <PageHeader
        title="Follow-up calendar"
        description="Tasks, hospital appointments and travel dates in one shared schedule."
        action={can("tasks") ? "Add follow-up" : undefined}
        onAction={() => setAdding(true)}
      />
      <Panel>
        <div className="ws-calendar-toolbar">
          <div className="ws-segmented">
            <button
              aria-pressed={mode === "month"}
              onClick={() => setMode("month")}
            >
              Month
            </button>
            <button
              aria-pressed={mode === "list"}
              onClick={() => setMode("list")}
            >
              List
            </button>
          </div>
          <div className="ws-calendar-month">
            <button
              className="icon-button"
              aria-label="Previous month"
              onClick={() => move(-1)}
            >
              <ChevronLeft size={18} />
            </button>
            <strong>
              {first.toLocaleDateString("en-GB", {
                month: "long",
                year: "numeric",
                timeZone: "UTC",
              })}
            </strong>
            <button
              className="icon-button"
              aria-label="Next month"
              onClick={() => move(1)}
            >
              <ChevronRight size={18} />
            </button>
            <Button
              variant="outline"
              onClick={() => {
                setMonth(today().slice(0, 7))
                setSelected(today())
              }}
            >
              Today
            </Button>
          </div>
          <label className="ws-inline-check">
            <input
              type="checkbox"
              checked={mine}
              onChange={(e) => setMine(e.target.checked)}
            />
            Mine only
          </label>
        </div>
        {mode === "month" ? (
          <div className="ws-month-grid">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
              <div className="ws-day-label" key={day}>
                {day}
              </div>
            ))}
            {Array.from({ length: start }, (_, i) => (
              <div className="ws-blank-day" key={"blank" + i} />
            ))}
            {Array.from({ length: days }, (_, i) => {
              const date = `${month}-${String(i + 1).padStart(2, "0")}`,
                list = events(date)
              return (
                <button
                  aria-label={`${dateLabel(date)}: ${list.length} events`}
                  aria-pressed={selected === date}
                  key={date}
                  className={`ws-calendar-day ${date === today() ? "today" : ""} ${selected === date ? "selected" : ""}`}
                  onClick={() => setSelected(date)}
                >
                  <strong>{i + 1}</strong>
                  {list.slice(0, 3).map((e) => (
                    <span
                      key={e.id}
                      className={
                        e.done
                          ? "done"
                          : e.type === "Overdue"
                            ? "late"
                            : e.task
                              ? "task"
                              : "appointment"
                      }
                    >
                      {e.title}
                    </span>
                  ))}
                  {list.length > 3 && <small>+{list.length - 3} more</small>}
                </button>
              )
            })}
          </div>
        ) : (
          <div className="ws-detail-body">
            <h2>Overdue</h2>
            {tasks
              .filter((t) => !t.done && t.due < today())
              .map((t) => (
                <div key={t.id}>
                  {renderEvents(t.due).filter(
                    (_, i) =>
                      i === events(t.due).findIndex((e) => e.id === t.id)
                  )}
                </div>
              ))}
            {!tasks.some((t) => !t.done && t.due < today()) && (
              <Empty>No overdue work.</Empty>
            )}
            <h2 className="ws-spaced-heading">Today</h2>
            {renderEvents(today())}
            <h2 className="ws-spaced-heading">Next 14 days</h2>
            {Array.from({ length: 14 }, (_, i) => dayOffset(i + 1))
              .filter((date) => events(date).length)
              .map((date) => (
                <section key={date}>
                  <h3>{dateLabel(date)}</h3>
                  {renderEvents(date)}
                </section>
              ))}
            <h2 className="ws-spaced-heading">Recently completed</h2>
            {tasks
              .filter((t) => t.done)
              .slice(-8)
              .map((t) => (
                <div key={t.id}>
                  <Badge tone="green">Completed</Badge> {t.title} · {t.assignee}
                </div>
              ))}
          </div>
        )}
      </Panel>
      {mode === "month" && (
        <Panel title={dateLabel(selected, "en", true)}>
          <div className="ws-detail-body">
            {renderEvents(selected)}
            {!events(selected).length && (
              <Empty>No scheduled work on this date.</Empty>
            )}
          </div>
        </Panel>
      )}
      {adding && (
        <Modal title="Add a follow-up" onClose={() => setAdding(false)}>
          <RecordForm
            fields={[
              { key: "title", label: "Task", required: true },
              {
                key: "caseId",
                label: "Patient case",
                type: "select",
                required: true,
                options: patients.map((p) => ({
                  value: p.id,
                  label: `${p.name} · ${p.id}`,
                })),
              },
              { key: "due", label: "Due date", type: "date", required: true },
              {
                key: "assignee",
                label: "Assigned to",
                type: "select",
                options: data.collections.staff
                  .filter((s) => s.values.status === "Active")
                  .map((s) => ({ value: s.values.name, label: s.values.name })),
              },
            ]}
            initial={{ due: selected, assignee: session.name }}
            onSave={(v) => {
              commit(
                "Follow-up created",
                (prev) => ({
                  ...prev,
                  tasks: [
                    ...prev.tasks,
                    {
                      id: uid("task"),
                      caseId: v.caseId,
                      title: v.title,
                      due: v.due,
                      assignee: v.assignee,
                      done: false,
                    },
                  ],
                }),
                "task"
              )
              setAdding(false)
            }}
            onCancel={() => setAdding(false)}
          />
        </Modal>
      )}
    </div>
  )
}
export function AccountsPage() {
  const { data, office } = useWorkspace()
  const [currency, setCurrency] = useState<Currency>("BDT"),
    [caseId, setCaseId] = useState("")
  const list = data.patients.filter(
      (p) =>
        (office === "All offices" || p.office === office) &&
        p.currency === currency
    ),
    entries = data.ledger.filter((e) => list.some((p) => p.id === e.caseId)),
    s = totals(entries)
  const columns = useMemo<ColumnDef<Patient>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Patient",
        cell: ({ row: { original: p } }) => (
          <button className="ws-record-name" onClick={() => setCaseId(p.id)}>
            {p.name}
            <small>{p.id}</small>
          </button>
        ),
      },
      {
        id: "bill",
        header: "Patient charges",
        accessorFn: (p) => p.billed,
        cell: ({ row }) =>
          displayMoney(Math.round(row.original.billed * 100), currency),
      },
      {
        id: "paid",
        header: "Received",
        accessorFn: (p) => p.paid,
        cell: ({ row }) =>
          displayMoney(Math.round(row.original.paid * 100), currency),
      },
      {
        id: "balance",
        header: "Balance / credit",
        cell: ({ row }) =>
          displayMoney(
            Math.round((row.original.billed - row.original.paid) * 100),
            currency
          ),
      },
      {
        id: "supplier",
        header: "Supplier due",
        cell: ({ row }) =>
          displayMoney(Math.round(row.original.supplierDue * 100), currency),
      },
      {
        id: "action",
        header: "",
        cell: ({ row }) => (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCaseId(row.original.id)}
          >
            Open account
          </Button>
        ),
      },
    ],
    [currency]
  )
  return (
    <div className="workspace-page">
      <PageHeader
        title="Accounts & patient billing"
        description="One account per case, separate currencies and a clear financial history."
      />
      <div className="ws-toolbar">
        <label className="ws-field">
          <span>Invoice currency</span>
          <select
            value={currency}
            onChange={(e) => {
              setCurrency(e.target.value as Currency)
              setCaseId("")
            }}
          >
            {["BDT", "THB", "USD"].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <label className="ws-field ws-grow">
          <span>Find by patient case ID</span>
          <select value={caseId} onChange={(e) => setCaseId(e.target.value)}>
            <option value="">Select a patient account</option>
            {data.patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.id} · {p.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="ws-metrics">
        <Metric
          label="Total charges"
          value={displayMoney(s.billed, currency)}
        />
        <Metric
          label="Payments received"
          value={displayMoney(s.paid, currency)}
        />
        <Metric
          label="Supplier outstanding"
          value={displayMoney(s.supplierDue, currency)}
        />
        <Metric
          label="Invoiced profit"
          value={displayMoney(s.invoicedProfit, currency)}
        />
      </div>
      {caseId ? (
        <>
          <Button variant="outline" onClick={() => setCaseId("")}>
            Back to account list
          </Button>
          <QuoteComparison key={caseId} initialCaseId={caseId} />
          <BillingWorkspace caseId={caseId} />
        </>
      ) : (
        <Panel title={`Patient accounts · ${currency}`}>
          <DataList
            data={list}
            columns={columns}
            searchText={(p) => `${p.id} ${p.name}`}
          />
        </Panel>
      )}
    </div>
  )
}
export function AuditPage() {
  const { data } = useWorkspace()
  const [kind, setKind] = useState("")
  const list = data.activity.filter((a) => !kind || a.kind === kind),
    columns = useMemo<ColumnDef<(typeof data.activity)[number]>[]>(
      () => [
        {
          accessorKey: "at",
          header: "Time",
          cell: ({ getValue }) =>
            new Date(String(getValue())).toLocaleString("en-GB"),
        },
        { accessorKey: "text", header: "Action / record" },
        {
          accessorKey: "kind",
          header: "Category",
          cell: ({ getValue }) => <Badge>{String(getValue())}</Badge>,
        },
      ],
      []
    )
  return (
    <div className="workspace-page">
      <PageHeader
        title="Audit history"
        description="A chronological demo history of case, financial and access changes."
      />
      <Panel>
        <DataList
          data={list}
          columns={columns}
          searchText={(a) => `${a.text} ${a.kind}`}
        >
          <select
            className="ws-select"
            aria-label="Activity category"
            value={kind}
            onChange={(e) => setKind(e.target.value)}
          >
            <option value="">All categories</option>
            {[...new Set(data.activity.map((a) => a.kind))].map((k) => (
              <option key={k}>{k}</option>
            ))}
          </select>
          <ExportButton
            name="audit-history"
            rows={[
              ["Time", "Action", "Category"],
              ...list.map((a) => [a.at, a.text, a.kind]),
            ]}
          />
        </DataList>
      </Panel>
      <p className="ws-form-hint">
        This demo history is browser-local. Production requires a server-written
        append-only audit log.
      </p>
    </div>
  )
}
export function ReportsPage() {
  const { data } = useWorkspace()
  const [month, setMonth] = useState(today().slice(0, 7)),
    [currency, setCurrency] = useState<Currency>("BDT"),
    [group, setGroup] = useState("Hospital")
  const patients = data.patients.filter((p) => p.created.startsWith(month)),
    unlinked = data.collections.leads.filter(
      (l) => !l.values.caseId && l.createdAt.startsWith(month)
    ),
    inquiries = patients.length + unlinked.length,
    converted = patients.filter(
      (p) => p.stage >= 3 && data.caseMeta[p.id]?.status !== "lost"
    ),
    entries = data.ledger.filter(
      (e) =>
        e.date.startsWith(month) &&
        data.patients.find((p) => p.id === e.caseId)?.currency === currency
    ),
    s = totals(entries)
  const breakdown: Record<
    string,
    { cases: number; revenue: number; profit: number }
  > = {}
  for (const p of data.patients.filter((p) => p.currency === currency)) {
    const ledger = entries.filter((e) => e.caseId === p.id)
    if (!ledger.length) continue
    const key =
      group === "Hospital"
        ? p.hospital
        : group === "Agent"
          ? data.collections.agents.find(
              (a) => a.id === data.caseMeta[p.id]?.agentId
            )?.values.name || "Direct / no agent"
          : group === "Staff"
            ? p.coordinator
            : data.collections.packages.find((pack) =>
                ledger.some((e) => e.fields.packageId === pack.id)
              )?.values.name || "Other service charges"
    const total = totals(ledger)
    const row = breakdown[key] || { cases: 0, revenue: 0, profit: 0 }
    breakdown[key] = {
      cases: row.cases + 1,
      revenue: row.revenue + total.posted,
      profit: row.profit + total.invoicedProfit,
    }
  }
  const sourceCounts = patients.reduce<Record<string, number>>(
    (out, p) => ({ ...out, [p.source]: (out[p.source] || 0) + 1 }),
    {}
  )
  const lostReasons = Object.values(data.caseMeta)
    .filter((m) => m.status === "lost")
    .reduce<Record<string, number>>(
      (out, m) => ({ ...out, [m.lostReason]: (out[m.lostReason] || 0) + 1 }),
      {}
    )
  const response = data.collections.leads.filter(
    (l) =>
      Number.isFinite(Number(l.values.responseMinutes)) &&
      l.values.responseMinutes !== ""
  )
  const average = response.length
    ? Math.round(
        response.reduce((n, l) => n + Number(l.values.responseMinutes), 0) /
          response.length
      )
    : 0
  const reportRows = [
    [
      "Month",
      "Group",
      "Name",
      "Currency",
      "Cases",
      "Invoiced revenue",
      "Invoiced profit",
    ],
    ...Object.entries(breakdown).map(([name, row]) => [
      month,
      group,
      name,
      currency,
      row.cases,
      row.revenue / 100,
      row.profit / 100,
    ]),
  ]
  return (
    <div className="workspace-page">
      <PageHeader
        title="Reports & analytics"
        description="Understand inquiries, conversion, workload and financial performance."
      />
      <div className="ws-toolbar">
        <input
          className="ws-select"
          aria-label="Report month"
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
        />
        <select
          className="ws-select"
          aria-label="Report currency"
          value={currency}
          onChange={(e) => setCurrency(e.target.value as Currency)}
        >
          {["BDT", "THB", "USD"].map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <Button
          variant="outline"
          onClick={() => exportExcel("monthly-business-report", reportRows)}
        >
          Export report to Excel
        </Button>
      </div>
      <div className="ws-metrics">
        <Metric
          label="Monthly inquiries"
          value={inquiries}
          note="Cases plus unconverted inquiries"
        />
        <Metric
          label="Converted cases"
          value={converted.length}
          note={`${inquiries ? Math.round((converted.length / inquiries) * 100) : 0}% reached appointment stage`}
        />
        <Metric
          label={`Invoiced revenue · ${currency}`}
          value={displayMoney(s.posted, currency)}
        />
        <Metric
          label="Average lead response"
          value={`${average} min`}
          note="From recorded lead response times"
        />
      </div>
      <div className="ws-two-column">
        <Panel title="Patient journey">
          <div className="ws-bar-list">
            {stages.map((stage, i) => {
              const count = patients.filter(
                (p) => p.stage === i && data.caseMeta[p.id]?.status !== "lost"
              ).length
              return (
                <div key={stage.name}>
                  <span>{stage.name}</span>
                  <div>
                    <i
                      style={{
                        width: `${patients.length ? Math.max(2, (count / patients.length) * 100) : 0}%`,
                      }}
                    />
                  </div>
                  <strong>{count}</strong>
                </div>
              )
            })}
          </div>
        </Panel>
        <Panel title="Inquiries by source">
          <div className="ws-bar-list">
            {Object.entries(sourceCounts).map(([source, count]) => (
              <div key={source}>
                <span>{source}</span>
                <div>
                  <i
                    style={{
                      width: `${(count / Math.max(1, patients.length)) * 100}%`,
                    }}
                  />
                </div>
                <strong>{count}</strong>
              </div>
            ))}
            {!Object.keys(sourceCounts).length && (
              <Empty>No inquiries in this month.</Empty>
            )}
          </div>
          <h3 className="ws-detail-heading">Lost-lead reasons</h3>
          <div className="ws-detail-body">
            {Object.entries(lostReasons).map(([reason, count]) => (
              <p key={reason}>
                {reason}: {count}
              </p>
            ))}
            {!Object.keys(lostReasons).length && (
              <p>No lost reasons recorded.</p>
            )}
          </div>
        </Panel>
      </div>
      <Panel
        title={`Revenue & profit by ${group.toLowerCase()}`}
        subtitle="Currencies remain separate. Figures use invoiced charges and recorded supplier costs."
        actions={
          <select
            className="ws-select"
            aria-label="Financial grouping"
            value={group}
            onChange={(e) => setGroup(e.target.value)}
          >
            {["Hospital", "Agent", "Package", "Staff"].map((g) => (
              <option key={g}>{g}</option>
            ))}
          </select>
        }
      >
        <div className="data-table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>{group}</th>
                <th>Cases</th>
                <th>Invoiced revenue</th>
                <th>Invoiced profit</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(breakdown).map(([name, row]) => (
                <tr key={name}>
                  <td>{name}</td>
                  <td>{row.cases}</td>
                  <td>{displayMoney(row.revenue, currency)}</td>
                  <td>{displayMoney(row.profit, currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!Object.keys(breakdown).length && (
          <Empty>No financial records for this month and currency.</Empty>
        )}
      </Panel>
      <Panel title="Coordinator workload">
        <div className="ws-linked-records">
          {data.collections.staff
            .filter((s) => s.values.status === "Active")
            .map((staff) => (
              <article key={staff.id}>
                <h3>{staff.values.name}</h3>
                <p>
                  {
                    data.patients.filter(
                      (p) =>
                        (p.coordinator === staff.values.name ||
                          p.thaiCoordinator === staff.values.name) &&
                        p.stage < 8
                    ).length
                  }{" "}
                  active cases
                </p>
                <small>
                  {
                    data.tasks.filter(
                      (t) => t.assignee === staff.values.name && !t.done
                    ).length
                  }{" "}
                  open follow-ups
                </small>
                <small>
                  {
                    data.tasks.filter(
                      (t) =>
                        t.assignee === staff.values.name &&
                        !t.done &&
                        t.due < today()
                    ).length
                  }{" "}
                  overdue
                </small>
              </article>
            ))}
        </div>
      </Panel>
    </div>
  )
}
export function SettingsPage() {
  const { data, commit, reset, can } = useWorkspace()
  const [confirm, setConfirm] = useState(false)
  function save(v: Values) {
    commit("Billing settings updated", (prev) => ({
      ...prev,
      settings: { ...prev.settings, ...v },
    }))
  }
  return (
    <div className="workspace-page">
      <PageHeader
        title="System information & settings"
        description="Company details, frontend capabilities and the fictional demo workspace."
      />
      <Panel
        title="Billing document settings"
        subtitle="These details appear on quotations, invoices, receipts and statements."
      >
        {can("acctEdit") ? (
          <RecordForm
            fields={[
              { key: "company", label: "Company name", required: true },
              { key: "address", label: "Address" },
              { key: "phone", label: "Phone", type: "tel" },
              { key: "email", label: "Email", type: "email" },
              {
                key: "currency",
                label: "Default currency for new accounts",
                type: "select",
                options: choices("BDT", "THB", "USD"),
              },
              {
                key: "footer",
                label: "Document footer",
                type: "textarea",
                full: true,
              },
            ]}
            initial={data.settings}
            onSave={save}
          />
        ) : (
          <div className="ws-detail-body">
            <p>{data.settings.company}</p>
            <p>{data.settings.address}</p>
            <p>{data.settings.footer}</p>
          </div>
        )}
      </Panel>
      <Panel title="What this frontend can do">
        <div className="ws-detail-body">
          <ul className="ws-feature-list">
            <li>
              Case management across nine stages, with records, handovers and
              follow-ups.
            </li>
            <li>Hospital, doctor, agent, supplier and package records.</li>
            <li>
              Visa checklists, inquiry conversion, message scheduling and ground
              services.
            </li>
            <li>
              Quotations, locked invoices, payments, supplier costs and
              reversals.
            </li>
            <li>
              Patient and agent portals, aftercare, reports and Excel exports.
            </li>
          </ul>
          <p className="ws-warning">
            Demo only: sign-in/OTP, hospital requests, message delivery and
            payments are simulations. Data and uploaded fictional files stay in
            this browser. No backend or external services are connected.
          </p>
          <p>
            Production still needs server authentication/permissions, shared
            records, private file storage, an append-only audit history,
            approved financial rules and external integrations.
          </p>
          <p>
            Open any patient case to follow its full journey.
          </p>
          <div className="ws-actions">
            <Button variant="outline" onClick={() => setConfirm(true)}>
              Reset all demo records
            </Button>
            <Link to="/inquiry" className="ws-inline-link">
              Open public inquiry form →
            </Link>
          </div>
        </div>
      </Panel>
      {confirm && (
        <Modal
          title="Restore the demo workspace?"
          description="This replaces browser-local demo records with the original fictional data. Previously uploaded file bytes remain local, but their records are removed."
          onClose={() => setConfirm(false)}
        >
          <div className="ws-form-footer">
            <Button variant="outline" onClick={() => setConfirm(false)}>
              Keep changes
            </Button>
            <Button
              onClick={() => {
                reset()
                setConfirm(false)
              }}
            >
              Reset demo records
            </Button>
          </div>
        </Modal>
      )}
    </div>
  )
}
