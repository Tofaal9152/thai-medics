import PartnerDetails from "./partner-details"
import { useCallback, useMemo, useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { Link } from "@tanstack/react-router"
import { Check, Edit2, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { dayOffset, today } from "@/features/dashboard/data"
import { useWorkspace } from "../context"
import { fieldsFor, moduleInfo } from "../config"
import { permissionNames, rolePermissions, uid } from "../model"
import type {
  ModuleKey,
  Permission,
  RecordItem,
  Role,
  Values,
  WorkspaceData,
} from "../model"
import { RecordForm } from "./form"
import {
  Badge,
  DataList,
  ExportButton,
  Metric,
  Modal,
  PageHeader,
  Panel,
} from "./ui"
import QuoteComparison from "./quote-comparison"
import { agentCommissions, statementPaidKey } from "../commissions"
import { exportExcel } from "../export"
const checklist = [
  "Passport copy",
  "Photo",
  "Appointment letter",
  "Invitation letter",
  "Application form",
]
const display = (value: string) => value || "—"
export default function DirectoryPage({ module }: { module: ModuleKey }) {
  const { data, commit, session, setSession, createCase, can } = useWorkspace()
  const info = moduleInfo[module]
  const [editing, setEditing] = useState<RecordItem | "new" | null>(null),
    [selected, setSelected] = useState<string | null>(null),
    [filter, setFilter] = useState(""),
    [statementCurrency, setStatementCurrency] = useState("BDT"),
    [statementMonth, setStatementMonth] = useState(today().slice(0, 7))
  const records = data.collections[module],
    item = records.find((r) => r.id === selected)
  const fields = fieldsFor(module, data),
    hasPermission = module === "staff" ? can("staff") : true
  const ref = useCallback(
    (value: string) => {
      for (const list of Object.values(data.collections)) {
        const record = list.find((r) => r.id === value)
        if (record) return record.values.name
      }
      return data.patients.find((p) => p.id === value)?.name || value
    },
    [data.collections, data.patients]
  )
  function patch(id: string, values: Values, text: string) {
    commit(text, (prev) => ({
      ...prev,
      collections: {
        ...prev.collections,
        [module]: prev.collections[module].map((r) =>
          r.id === id ? { ...r, values: { ...r.values, ...values } } : r
        ),
      },
    }))
  }
  function commission(agentId: string) {
    return agentCommissions(data, agentId, statementMonth)
  }
  const save = async (values: Values) => {
    if (
      module === "agents" &&
      editing !== "new" &&
      records.find((r) => r.id === editing?.id)?.values.submittedVia ===
        "Public registration" &&
      records.find((r) => r.id === editing?.id)?.values.status !== "Active" &&
      values.status === "Active" &&
      !can("staff")
    )
      throw new Error(
        "Only staff administrators can approve agent registrations."
      )
    if (
      module === "agents" &&
      records.some(
        (r) =>
          r.id !== (editing && editing !== "new" ? editing.id : "") &&
          ((values.email &&
            (r.values.email || "").toLowerCase() ===
              values.email.toLowerCase()) ||
            (values.phone &&
              (r.values.phone || "").replace(/\D/g, "") ===
                values.phone.replace(/\D/g, "")))
      )
    )
      throw new Error("Another agent already uses this email or phone.")
    if (module === "leads" && values.status === "Lost" && !values.lostReason)
      throw new Error("Choose a lost-lead reason.")
    if (module === "leads" && values.source === "Agent" && !values.agentId)
      throw new Error("Select the referring agent.")
    if (
      module === "staff" &&
      records.some(
        (r) =>
          r.id !== (editing !== "new" && editing ? editing.id : "") &&
          r.values.email.toLowerCase() === values.email.toLowerCase()
      )
    )
      throw new Error("This staff email already exists.")
    if (
      module === "staff" &&
      editing !== "new" &&
      editing?.id === session.staffId &&
      (!["Admin", "Custom"].includes(values.role) || values.status !== "Active")
    )
      throw new Error(
        "Keep your own staff-management permission and active status."
      )
    if (
      module === "agents" &&
      (Number(values.rate) < 0 ||
        (values.commissionType === "Percentage" && Number(values.rate) > 100))
    )
      throw new Error(
        "Enter a valid fixed amount or percentage between 0 and 100."
      )
    if (
      ["packages", "suppliers"].includes(module) &&
      Number(values.price || values.rate) < 0
    )
      throw new Error("The price/rate cannot be negative.")
    if (
      module === "aftercare" &&
      ["hospitalRating", "staffRating"].some(
        (k) =>
          values[k] &&
          (!Number.isInteger(Number(values[k])) ||
            Number(values[k]) < 1 ||
            Number(values[k]) > 5)
      )
    )
      throw new Error("Ratings must be whole numbers from 1 to 5.")
    if (
      module === "aftercare" &&
      values.consultLink &&
      !/^https?:\/\//i.test(values.consultLink)
    )
      throw new Error("Use a full http or https consultation link.")
    if (
      module === "messages" &&
      values.status === "Scheduled" &&
      !values.scheduled
    )
      throw new Error("Choose a date/time for the reminder.")
    const id = editing && editing !== "new" ? editing.id : uid(module),
      previous = editing && editing !== "new" ? editing.values : {}
    const merged = { ...previous, ...values }
    if (
      module === "agents" &&
      previous.submittedVia === "Public registration" &&
      previous.status !== "Active" &&
      values.status === "Active"
    ) {
      merged.reviewedBy = session.name
      merged.reviewedAt = new Date().toISOString()
    }
    if (module === "messages" && !merged.recipient)
      merged.recipient =
        data.patients.find((p) => p.id === merged.caseId)?.phone || ""
    if (
      module === "leads" &&
      !merged.caseId &&
      merged.status !== "Lost" &&
      ["Website", "Facebook", "Phone"].includes(merged.source)
    ) {
      const existing = data.patients.find(
        (p) => p.phone.replace(/\D/g, "") === merged.phone.replace(/\D/g, "")
      )
      merged.caseId =
        existing?.id || createCase({ ...merged, office: "Bangladesh" }).id
    }
    if (module === "leads" && !merged.caseId) merged.caseId = ""
    if (module === "staff" && !merged.permissions)
      merged.permissions = values.role === "Custom" ? "staff" : ""
    commit(
      `${editing === "new" ? "Added" : "Updated"} ${info.singular}`,
      (prev) => {
        const existing = prev.collections[module].some((r) => r.id === id)
        let next: WorkspaceData = {
          ...prev,
          collections: {
            ...prev.collections,
            [module]: existing
              ? prev.collections[module].map((r) =>
                  r.id === id ? { ...r, values: merged } : r
                )
              : [
                  { id, values: merged, createdAt: new Date().toISOString() },
                  ...prev.collections[module],
                ],
          },
        }
        if (module === "aftercare" && values.returnDate) {
          const checkpoint = [
            ["1 week", 7],
            ["1 month", 30],
            ["3 months", 90],
          ] as const
          const ids = checkpoint.map(([label]) => `${id}-${label}`)
          next = {
            ...next,
            tasks: [
              ...next.tasks.filter((t) => !ids.includes(t.id)),
              ...checkpoint.map(([label, days]) => {
                const date = new Date(values.returnDate + "T12:00:00Z")
                date.setUTCDate(date.getUTCDate() + days)
                const old = next.tasks.find((t) => t.id === `${id}-${label}`)
                return {
                  id: `${id}-${label}`,
                  caseId: values.caseId,
                  title: `Post-return check-in · ${label}`,
                  due: date.toISOString().slice(0, 10),
                  assignee:
                    next.patients.find((p) => p.id === values.caseId)
                      ?.coordinator || session.name,
                  done: old?.done ?? false,
                }
              }),
            ],
          }
        }
        return next
      }
    )
    if (module === "staff" && id === session.staffId)
      setSession((s) => ({
        ...s,
        name: values.name,
        office: values.office,
        role: values.role as Role,
      }))
    setEditing(null)
    setSelected(id)
  }
  function convertLead(record: RecordItem) {
    const v = record.values
    const duplicate = data.patients.find(
      (p) => p.phone.replace(/\D/g, "") === v.phone.replace(/\D/g, "")
    )
    if (duplicate) {
      setSelected(record.id)
      patch(
        record.id,
        { caseId: duplicate.id, status: "Qualified" },
        "Linked inquiry to the existing patient case"
      )
      return
    }
    const patient = createCase({ ...v, office: "Bangladesh" })
    patch(
      record.id,
      { caseId: patient.id, status: "Qualified" },
      `Converted inquiry to ${patient.id}`
    )
  }
  function simulateSend(record: RecordItem) {
    const p = data.patients.find((p) => p.id === record.values.caseId)
    const recipients = data.patients
      .filter((patient) =>
        record.values.audience === "Health camp broadcast"
          ? data.caseMeta[patient.id]?.status !== "lost"
          : record.values.audience === "Assigned patients"
            ? patient.coordinator === p?.coordinator
            : patient.id === p?.id
      )
      .map((patient) => patient.id)
    commit(
      `Message delivery simulated for ${recipients.length} recipients; no message was sent externally`,
      (prev) => ({
        ...prev,
        collections: {
          ...prev.collections,
          messages: prev.collections.messages.map((r) =>
            r.id === record.id
              ? { ...r, values: { ...r.values, status: "Sent" } }
              : r
          ),
        },
        patients: prev.patients.map((patient) =>
          recipients.includes(patient.id)
            ? {
                ...patient,
                notes: [
                  ...patient.notes,
                  `[${record.values.channel}] ${record.values.body}`,
                ],
              }
            : patient
        ),
      }),
      "message"
    )
  }
  const columns = useMemo<ColumnDef<RecordItem>[]>(
    () => [
      {
        id: "name",
        header:
          module === "visas"
            ? "Traveller"
            : module === "messages"
              ? "Message"
              : "Name",
        accessorFn: (r) => r.values.name,
        cell: ({ row }) => (
          <button
            className="ws-record-name"
            onClick={() => setSelected(row.original.id)}
          >
            {row.original.values.name}
            <small>{row.original.id}</small>
          </button>
        ),
      },
      {
        id: "details",
        header:
          module === "staff"
            ? "Position / office"
            : module === "leads"
              ? "Contact / source"
              : module === "visas"
                ? "Patient case"
                : module === "doctors"
                  ? "Specialty / hospital"
                  : "Details",
        accessorFn: (r) =>
          r.values.specialty ||
          r.values.department ||
          r.values.caseId ||
          r.values.location ||
          r.values.phone ||
          r.values.position ||
          r.values.category ||
          r.values.hospital ||
          "",
        cell: ({ row: { original: r } }) => (
          <div>
            {ref(
              r.values.caseId ||
                r.values.hospital ||
                r.values.specialty ||
                r.values.category ||
                r.values.position ||
                r.values.location ||
                r.values.district ||
                r.values.phone ||
                r.values.channel ||
                "—"
            )}
            <small>
              {r.values.source ||
                r.values.office ||
                r.values.specialty ||
                r.values.currency ||
                r.values.email ||
                r.values.service ||
                r.values.phone ||
                r.values.language}
            </small>
          </div>
        ),
      },
      {
        id: "date",
        header:
          module === "visas"
            ? "Passport expiry"
            : module === "ground"
              ? "Service date"
              : module === "aftercare"
                ? "Return date"
                : module === "staff"
                  ? "Role"
                  : "Validity / reference",
        accessorFn: (r) =>
          r.values.expiry ||
          r.values.date ||
          r.values.returnDate ||
          r.values.validUntil ||
          r.values.role ||
          r.values.phone ||
          r.values.clinicDays ||
          r.values.trigger ||
          "",
        cell: ({ getValue }) => display(String(getValue() || "")),
      },
      {
        id: "status",
        header: "Status",
        accessorFn: (r) => r.values.status,
        cell: ({ row }) => (
          <Badge
            tone={
              [
                "Active",
                "Approved",
                "Completed",
                "Available",
                "Confirmed",
                "Sent",
                "Qualified",
              ].includes(row.original.values.status)
                ? "green"
                : ["Lost", "Refused", "Inactive", "Cancelled"].includes(
                      row.original.values.status
                    )
                  ? "rose"
                  : "amber"
            }
          >
            {row.original.values.status}
          </Badge>
        ),
      },
      {
        id: "actions",
        header: "Action",
        enableSorting: false,
        cell: ({ row }) => (
          <Button
            variant="outline"
            size="sm"
            aria-label={`Open ${row.original.values.name}`}
            onClick={() => setSelected(row.original.id)}
          >
            View
          </Button>
        ),
      },
    ],
    [module, ref]
  )
  const visible = records.filter((r) => !filter || r.values.status === filter)
  return (
    <div className="workspace-page">
      <PageHeader
        title={info.title}
        description={info.description}
        action={hasPermission ? `Add ${info.singular}` : undefined}
        onAction={() => setEditing("new")}
      />
      <div className="ws-metrics">
        <Metric label="Total records" value={records.length} />
        <Metric
          label="Active / in progress"
          value={
            records.filter(
              (r) =>
                ![
                  "Inactive",
                  "Cancelled",
                  "Completed",
                  "Lost",
                  "Refused",
                ].includes(r.values.status)
            ).length
          }
        />
        <Metric
          label={
            module === "visas"
              ? "Expiring within 90 days"
              : module === "agents"
                ? "Pending approval"
                : "Linked to patient cases"
          }
          value={
            module === "visas"
              ? records.filter((r) => r.values.expiry <= dayOffset(90)).length
              : module === "agents"
                ? records.filter((r) => r.values.status === "Pending approval")
                    .length
                : records.filter((r) => r.values.caseId).length
          }
        />
      </div>
      {module === "agents" && (
        <Panel
          title="Public agent registration"
          subtitle="New applications appear here as Pending approval. Admin reviews the details and commission terms before activating access."
        >
          <div className="ws-detail-body">
            <Link to="/agent-registration" className="ws-inline-link">
              Open public registration form →
            </Link>
          </div>
        </Panel>
      )}
      {module === "messages" && (
        <Panel
          title="Ready-to-use templates"
          subtitle="Choose a template, then review the recipient and message."
        >
          <div className="ws-template-grid">
            {[
              [
                "Appointment confirmation",
                "English",
                "Your hospital appointment is confirmed. Please bring your medical reports.",
              ],
              [
                "Document reminder",
                "Bangla",
                "অনুগ্রহ করে আপনার বাকি মেডিকেল রিপোর্ট ও পাসপোর্টের কপি পাঠান।",
              ],
              [
                "Payment reminder",
                "English",
                "Please review your patient invoice and contact Accounts about your outstanding balance.",
              ],
              [
                "Flight reminder",
                "English",
                "Your travel date is approaching. Please check your flight and pickup details.",
              ],
              [
                "Health camp invitation",
                "English",
                "Our next health camp is open for inquiries. Please contact the desk for information.",
              ],
            ].map(([name, language, body]) => (
              <button
                key={name}
                onClick={() =>
                  setEditing({
                    id: uid("message"),
                    createdAt: new Date().toISOString(),
                    values: {
                      name,
                      body,
                      language,
                      channel: "WhatsApp",
                      caseId: data.patients[0]?.id || "",
                      audience: "Single patient",
                      status: "Draft",
                    },
                  })
                }
              >
                <MessageIcon />
                <strong>{name}</strong>
                <small>{language}</small>
              </button>
            ))}
          </div>
        </Panel>
      )}
      <Panel>
        <DataList
          data={visible}
          columns={columns}
          searchText={(r) => Object.values(r.values).join(" ")}
        >
          <select
            className="ws-select"
            aria-label="Filter by status"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="">All statuses</option>
            {[...new Set(records.map((r) => r.values.status))].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <ExportButton
            name={`thai-medics-${module}`}
            rows={[
              ["Name", "Status", "Details"],
              ...visible.map((r) => [
                r.values.name,
                r.values.status,
                Object.values(r.values).join(" · "),
              ]),
            ]}
          />
          <Button
            variant="outline"
            onClick={() =>
              exportExcel(`thai-medics-${module}`, [
                ["Name", "Status", "Details"],
                ...visible.map((r) => [
                  r.values.name,
                  r.values.status,
                  Object.values(r.values).join(" · "),
                ]),
              ])
            }
          >
            Excel
          </Button>
        </DataList>
      </Panel>
      {module === "packages" && <QuoteComparison />}
      {module === "agents" && (
        <Panel title="Agent performance ranking">
          <div className="ws-detail-body">
            {data.collections.agents
              .map((a) => {
                const referrals = data.patients.filter(
                  (p) => data.caseMeta[p.id]?.agentId === a.id
                )
                const converted = referrals.filter(
                  (p) => p.stage >= 3 && data.caseMeta[p.id]?.status !== "lost"
                ).length
                return { agent: a, referrals: referrals.length, converted }
              })
              .sort(
                (a, b) => b.converted - a.converted || b.referrals - a.referrals
              )
              .map(({ agent, referrals, converted }, i) => (
                <div className="ws-summary-row" key={agent.id}>
                  <button
                    className="ws-record-name"
                    onClick={() => setSelected(agent.id)}
                  >
                    {i + 1}. {agent.values.name}
                  </button>
                  <span>
                    {referrals} referrals · {converted} converted ·{" "}
                    {referrals ? Math.round((converted / referrals) * 100) : 0}%
                    conversion
                  </span>
                </div>
              ))}
          </div>
        </Panel>
      )}
      {module === "staff" && (
        <Panel
          title="Permission matrix"
          subtitle="Changing a permission uses the Custom role. Your own staff-management access stays enabled."
        >
          <div className="ws-matrix-scroll">
            <table className="ws-matrix">
              <thead>
                <tr>
                  <th>Permission</th>
                  {records
                    .filter((r) => r.values.status === "Active")
                    .map((s) => (
                      <th key={s.id}>
                        {s.values.name}
                        <small>{s.values.role}</small>
                      </th>
                    ))}
                </tr>
              </thead>
              <tbody>
                {Object.entries(permissionNames).map(([key, label]) => (
                  <tr key={key}>
                    <th>{label}</th>
                    {records
                      .filter((r) => r.values.status === "Active")
                      .map((s) => {
                        const permissions =
                          s.values.role === "Custom"
                            ? (s.values.permissions || "").split("|")
                            : rolePermissions[s.values.role as Role] || []
                        const locked =
                          s.id === session.staffId && key === "staff"
                        return (
                          <td key={s.id}>
                            <input
                              type="checkbox"
                              aria-label={`${s.values.name}: ${label}`}
                              checked={permissions.includes(key as Permission)}
                              disabled={locked}
                              onChange={(e) => {
                                const next = e.target.checked
                                  ? [...new Set([...permissions, key])]
                                  : permissions.filter((p) => p !== key)
                                patch(
                                  s.id,
                                  {
                                    permissions: next.join("|"),
                                    role: "Custom",
                                  },
                                  `Updated ${s.values.name}'s permissions`
                                )
                                if (s.id === session.staffId)
                                  setSession((p) => ({ ...p, role: "Custom" }))
                              }}
                            />
                          </td>
                        )
                      })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}
      {editing && (
        <Modal
          title={`${editing === "new" ? "Add" : "Edit"} ${info.singular}`}
          onClose={() => setEditing(null)}
          wide
        >
          {module === "staff" &&
            editing !== "new" &&
            data.patients.some(
              (p) =>
                p.stage < 8 &&
                (p.coordinator === editing.values.name ||
                  p.thaiCoordinator === editing.values.name)
            ) && (
              <p className="ws-warning">
                This staff member has active cases. Reassign their cases before
                deactivating the account.
              </p>
            )}
          <RecordForm
            key={editing === "new" ? "new" : editing.id}
            fields={fields}
            initial={editing === "new" ? {} : editing.values}
            onSave={save}
            onCancel={() => setEditing(null)}
          />
        </Modal>
      )}
      {item && (
        <Modal
          title={item.values.name}
          description={item.id}
          onClose={() => setSelected(null)}
          wide
        >
          <div className="ws-detail-body">
            <div className="ws-detail-grid">
              {fields
                .filter((f) => f.key !== "name")
                .map((f) => (
                  <div key={f.key}>
                    <small>{f.label}</small>
                    <p>{ref(item.values[f.key]) || "—"}</p>
                  </div>
                ))}
            </div>
            {item.values.caseId && (
              <Link
                to="/patients/$caseId"
                params={{ caseId: item.values.caseId }}
                className="ws-inline-link"
              >
                Open patient case →
              </Link>
            )}
            {module === "visas" && (
              <section className="ws-checklist">
                <h3>Document checklist</h3>
                {checklist.map((label) => (
                  <label key={label}>
                    <input
                      type="checkbox"
                      checked={(item.values.checked || "")
                        .split("|")
                        .includes(label)}
                      onChange={(e) => {
                        const list = (item.values.checked || "")
                          .split("|")
                          .filter(Boolean)
                        patch(
                          item.id,
                          {
                            checked: (e.target.checked
                              ? [...list, label]
                              : list.filter((v) => v !== label)
                            ).join("|"),
                          },
                          "Visa checklist updated"
                        )
                      }}
                    />
                    {label}
                    <Check size={14} />
                  </label>
                ))}
                {item.values.expiry <= dayOffset(90) && (
                  <p className="ws-warning">
                    Passport expires within 90 days. Staff must review the
                    travel requirements.
                  </p>
                )}
              </section>
            )}
            {module === "agents" && (
              <section>
                <h3>Monthly commission statement</h3>
                <label className="ws-field">
                  <span>Statement month</span>
                  <input
                    type="month"
                    value={statementMonth}
                    onChange={(e) => setStatementMonth(e.target.value)}
                  />
                </label>
                <p className="ws-muted">
                  Based on invoice month. Completion terms become eligible once
                  the case is completed.
                </p>
                <label className="ws-field">
                  <span>Statement currency</span>
                  <select
                    value={statementCurrency}
                    onChange={(e) => setStatementCurrency(e.target.value)}
                  >
                    {["BDT", "THB", "USD"].map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </label>
                {Object.entries(commission(item.id)).map(
                  ([currency, total]) => (
                    <div className="ws-summary-row" key={currency}>
                      <span>{currency} earned / recorded paid</span>
                      <strong>
                        {total.toFixed(2)} /{" "}
                        {Number(
                          item.values[
                            statementPaidKey(currency, statementMonth)
                          ] || 0
                        ).toFixed(2)}
                      </strong>
                    </div>
                  )
                )}
                <div className="ws-actions">
                  <Button
                    disabled={!can("acctEdit")}
                    onClick={() => {
                      if (!can("acctEdit")) return
                      const amount = commission(item.id)[statementCurrency] || 0
                      patch(
                        item.id,
                        {
                          [statementPaidKey(statementCurrency, statementMonth)]:
                            String(amount),
                        },
                        `Recorded ${statementCurrency} commission payout`
                      )
                    }}
                  >
                    Record payout
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() =>
                      exportExcel("agent-statement", [
                        [
                          "Agent",
                          "Month",
                          "Currency",
                          "Earned",
                          "Paid",
                          "Pending",
                        ],
                        [
                          item.values.name,
                          statementMonth,
                          statementCurrency,
                          commission(item.id)[statementCurrency] || 0,
                          Number(
                            item.values[
                              statementPaidKey(
                                statementCurrency,
                                statementMonth
                              )
                            ] || 0
                          ),
                          Math.max(
                            0,
                            (commission(item.id)[statementCurrency] || 0) -
                              Number(
                                item.values[
                                  statementPaidKey(
                                    statementCurrency,
                                    statementMonth
                                  )
                                ] || 0
                              )
                          ),
                        ],
                      ])
                    }
                  >
                    Download statement
                  </Button>
                </div>
                <h3 className="ws-spaced-heading">Own referrals</h3>
                {data.patients
                  .filter((p) => data.caseMeta[p.id]?.agentId === item.id)
                  .map((p) => (
                    <p key={p.id}>
                      <Link to="/patients/$caseId" params={{ caseId: p.id }}>
                        {p.name} · {p.id}
                      </Link>
                    </p>
                  ))}
              </section>
            )}
            {module === "leads" &&
              !item.values.caseId &&
              item.values.status !== "Lost" && (
                <Button onClick={() => convertLead(item)}>
                  Convert / link to patient case
                </Button>
              )}
            {module === "messages" && item.values.status !== "Sent" && (
              <Button onClick={() => simulateSend(item)}>
                <Send size={15} />
                Simulate delivery
              </Button>
            )}
            {module === "agents" &&
              item.values.status === "Pending approval" &&
              can("staff") && (
                <Button
                  onClick={() => {
                    setEditing({
                      ...item,
                      values: { ...item.values, status: "Active", rate: "" },
                    })
                    setSelected(null)
                  }}
                >
                  Review & approve registration
                </Button>
              )}
            {module === "staff" && item.values.status === "Invited" && (
              <Button
                onClick={() =>
                  patch(item.id, { status: "Active" }, "invitation approved")
                }
              >
                Approve invitation
              </Button>
            )}
            <PartnerDetails key={item.id} module={module} item={item} />
            <div className="ws-form-footer">
              {!(module === "messages" && item.values.status === "Sent") && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditing(item)
                    setSelected(null)
                  }}
                >
                  <Edit2 size={14} />
                  Edit record
                </Button>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
function MessageIcon() {
  return <span className="ws-template-symbol">Aa</span>
}
