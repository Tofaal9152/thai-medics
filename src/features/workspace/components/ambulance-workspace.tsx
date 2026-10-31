import { toast } from "@/components/ui/toast"
import { openFile } from "../files"
import { useState } from "react"
import { Link } from "@tanstack/react-router"
import type { ColumnDef } from "@tanstack/react-table"
import { Ambulance, Edit2, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { today } from "@/features/dashboard/data"
import { useWorkspace } from "../context"
import { uid } from "../model"
import type { Values } from "../model"
import {
  addAmbulanceUpdate,
  ambulanceStatuses,
  saveAmbulanceRequest,
} from "../ambulance"
import type { AmbulanceRequest } from "../ambulance"
import { RecordForm } from "./form"
import { choices } from "../form-options"
import { Badge, DataList, Empty, Metric, Modal, PageHeader, Panel } from "./ui"

function Status({ value }: { value: AmbulanceRequest["status"] }) {
  return (
    <Badge
      tone={
        value === "Cancelled"
          ? "rose"
          : ["Confirmed", "Completed"].includes(value)
            ? "green"
            : value === "New request"
              ? "amber"
              : "blue"
      }
    >
      {value}
    </Badge>
  )
}
export default function AmbulanceWorkspace({
  initialCaseId = "",
}: {
  initialCaseId?: string
}) {
  const { data, can, session, commit } = useWorkspace()
  const [status, setStatus] = useState(""),
    [date, setDate] = useState(""),
    [caseFilter, setCaseFilter] = useState(initialCaseId)
  const [editing, setEditing] = useState<AmbulanceRequest | "new" | null>(null),
    [selected, setSelected] = useState<string | null>(null),
    [addingNote, setAddingNote] = useState(false)
  const [caseId, setCaseId] = useState(
      initialCaseId || data.patients[0]?.id || ""
    ),
    [fileIds, setFileIds] = useState<string[]>([])
  const writable = can("visas"),
    canDocuments = can("docsView")
  const item = data.ambulanceRequests.find((r) => r.id === selected)
  const records = data.ambulanceRequests.filter(
    (r) =>
      (!status || r.status === status) &&
      (!date || r.requestedAt.startsWith(date)) &&
      (!caseFilter || r.caseId === caseFilter)
  )
  const patient = (id: string) => data.patients.find((p) => p.id === id)
  const coordinator = (id: string) =>
    data.collections.staff.find((s) => s.id === id)?.values.name ||
    "Not assigned"
  function openForm(record: AmbulanceRequest | "new") {
    setEditing(record)
    setSelected(null)
    setAddingNote(false)
    setCaseId(
      record === "new"
        ? caseFilter || data.patients[0]?.id || ""
        : record.caseId
    )
    setFileIds(record === "new" ? [] : record.fileIds)
  }
  function save(values: Values) {
    if (!writable) return
    const id = editing && editing !== "new" ? editing.id : uid("AA"),
      at = new Date().toISOString(),
      v = { ...values, caseId }
    saveAmbulanceRequest(data, v, fileIds, id, session.name, at)
    commit(
      editing === "new"
        ? "Emergency air ambulance request saved"
        : "Emergency air ambulance request updated",
      (prev) => saveAmbulanceRequest(prev, v, fileIds, id, session.name, at),
      "ambulance"
    )
    setEditing(null)
    setSelected(id)
  }
  const columns: ColumnDef<AmbulanceRequest>[] = [
    {
      id: "patient",
      header: "Patient / request",
      accessorFn: (r) => patient(r.caseId)?.name || r.caseId,
      cell: ({ row: { original: r } }) => (
        <button
          className="ws-record-name"
          onClick={() => {
            setSelected(r.id)
            setAddingNote(false)
          }}
        >
          {patient(r.caseId)?.name}
          <small>
            {r.id} · {r.caseId}
          </small>
        </button>
      ),
    },
    {
      id: "route",
      header: "Pickup → destination",
      cell: ({ row: { original: r } }) => (
        <span>
          {r.pickup}
          <small>→ {r.destination}</small>
        </span>
      ),
    },
    {
      accessorKey: "requestedAt",
      header: "Requested date / time",
      cell: ({ row: { original: r } }) => (
        <span>
          {r.requestedAt.replace("T", " · ")}
          <small>
            {r.timeZone === "Asia/Dhaka" ? "Dhaka time" : "Bangkok time"}
          </small>
        </span>
      ),
    },
    {
      id: "coordinator",
      header: "Coordinator",
      accessorFn: (r) => coordinator(r.coordinatorId),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <Status value={row.original.status} />,
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="ws-inline-actions">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setSelected(row.original.id)
              setAddingNote(false)
            }}
          >
            View
          </Button>
          {writable && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => openForm(row.original)}
            >
              Edit
            </Button>
          )}
        </div>
      ),
    },
  ]
  return (
    <div className="workspace-page">
      <PageHeader
        title="Emergency Air Ambulance"
        description="Record and track patient transfer coordination. Saving a request does not book or dispatch an ambulance."
        action={writable ? "Add emergency request" : undefined}
        onAction={() => openForm("new")}
      />
      <div className="ws-metrics">
        <Metric
          label="New requests"
          value={
            data.ambulanceRequests.filter((r) => r.status === "New request")
              .length
          }
        />
        <Metric
          label="Being arranged"
          value={
            data.ambulanceRequests.filter((r) =>
              ["Coordinating", "In transit"].includes(r.status)
            ).length
          }
        />
        <Metric
          label="Confirmed transfers"
          value={
            data.ambulanceRequests.filter((r) => r.status === "Confirmed")
              .length
          }
        />
        <Metric
          label="Completed"
          value={
            data.ambulanceRequests.filter((r) => r.status === "Completed")
              .length
          }
        />
      </div>
      <Panel
        title="Transfer requests"
        subtitle="Fictional coordination records. Staff update statuses after confirming arrangements separately."
      >
        <DataList
          data={records}
          columns={columns}
          searchText={(r) =>
            `${patient(r.caseId)?.name} ${r.caseId} ${r.id} ${r.pickup} ${r.destination} ${coordinator(r.coordinatorId)}`
          }
          placeholder="Search patient, case, pickup or destination…"
        >
          <select
            className="ws-select"
            aria-label="Air ambulance status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">All statuses</option>
            {ambulanceStatuses.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <input
            className="ws-select"
            aria-label="Requested transfer date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <select
            className="ws-select ws-ambulance-case-filter"
            aria-label="Air ambulance patient"
            value={caseFilter}
            onChange={(e) => setCaseFilter(e.target.value)}
          >
            <option value="">All patients</option>
            {data.patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} · {p.id}
              </option>
            ))}
          </select>
          {(status || date || caseFilter) && (
            <Button
              variant="ghost"
              onClick={() => {
                setStatus("")
                setDate("")
                setCaseFilter("")
              }}
            >
              Clear filters
            </Button>
          )}
        </DataList>
      </Panel>
      {editing && (
        <Modal
          title={
            editing === "new"
              ? "Add emergency air ambulance request"
              : "Edit transfer arrangements"
          }
          description="Save a coordination request; no booking or dispatch service is connected."
          onClose={() => setEditing(null)}
          wide
        >
          <div className="ws-ambulance-patient-picker">
            <label className="ws-field">
              <span>Patient case *</span>
              <select
                aria-label="Request patient case"
                value={caseId}
                disabled={editing !== "new"}
                onChange={(e) => {
                  setCaseId(e.target.value)
                  setFileIds([])
                }}
              >
                {data.patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} · {p.id}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <RecordForm
            key={`${editing === "new" ? "new" : editing.id}-${caseId}`}
            fields={[
              {
                key: "pickup",
                label: "Pickup hospital / location",
                required: true,
              },
              {
                key: "destination",
                label: "Destination hospital / location",
                required: true,
              },
              {
                key: "date",
                label: "Requested transfer date",
                type: "date",
                required: true,
              },
              {
                key: "time",
                label: "Requested transfer time",
                type: "time",
                required: true,
              },
              {
                key: "timeZone",
                label: "Time zone",
                type: "select",
                required: true,
                options: [
                  { value: "Asia/Dhaka", label: "Dhaka time" },
                  { value: "Asia/Bangkok", label: "Bangkok time" },
                ],
              },
              {
                key: "coordinatorId",
                label: "Assigned coordinator",
                type: "select",
                required: true,
                options: data.collections.staff
                  .filter((s) => s.values.status === "Active")
                  .map((s) => ({ value: s.id, label: s.values.name })),
              },
              {
                key: "familyContact",
                label: "Family contact name",
                required: true,
              },
              {
                key: "familyPhone",
                label: "Family contact phone",
                type: "tel",
                required: true,
              },
              {
                key: "hospitalContact",
                label: "Hospital / transport team contact",
              },
              {
                key: "status",
                label: "Request status",
                type: "select",
                required: true,
                options: choices(...ambulanceStatuses),
              },
              {
                key: "notes",
                label:
                  "Coordination notes provided by the hospital / transport team",
                type: "textarea",
                full: true,
              },
            ]}
            initial={
              editing === "new"
                ? {
                    date: today(),
                    time: "10:00",
                    timeZone: "Asia/Dhaka",
                    coordinatorId:
                      data.collections.staff.find(
                        (s) => s.values.name === patient(caseId)?.coordinator
                      )?.id || "staff-3",
                    status: "New request",
                  }
                : ({
                    ...editing,
                    date: editing.requestedAt.slice(0, 10),
                    time: editing.requestedAt.slice(11, 16),
                    fileIds: "",
                    updates: "",
                  } as Values)
            }
            onSave={save}
            onCancel={() => setEditing(null)}
            submitLabel={
              editing === "new" ? "Save request" : "Save arrangements"
            }
          >
            {canDocuments && (
              <section className="ws-checklist">
                <h3>Link existing patient documents</h3>
                {data.files
                  .filter((f) => f.caseId === caseId)
                  .map((f) => (
                    <label key={f.id}>
                      <input
                        type="checkbox"
                        checked={fileIds.includes(f.id)}
                        onChange={(e) =>
                          setFileIds(
                            e.target.checked
                              ? [...fileIds, f.id]
                              : fileIds.filter((id) => id !== f.id)
                          )
                        }
                      />
                      {f.name} · {f.category}
                    </label>
                  ))}
                {!data.files.some((f) => f.caseId === caseId) && (
                  <p>
                    No uploaded documents for this patient. Add them in Medical
                    records first.
                  </p>
                )}
              </section>
            )}
          </RecordForm>
        </Modal>
      )}
      {item && (
        <Modal
          title={`Air ambulance request · ${patient(item.caseId)?.name}`}
          description={item.id}
          onClose={() => {
            setSelected(null)
            setAddingNote(false)
          }}
          wide
        >
          <div className="ws-detail-body">
            <div className="ws-actions">
              <Ambulance size={23} />
              <Status value={item.status} />
              <Link
                to="/patients/$caseId"
                params={{ caseId: item.caseId }}
                className="ws-inline-link"
              >
                Open patient case →
              </Link>
              {writable && (
                <Button variant="outline" onClick={() => openForm(item)}>
                  <Edit2 size={14} />
                  Edit arrangements / status
                </Button>
              )}
            </div>
            <div className="ws-detail-grid">
              {[
                ["Pickup", item.pickup],
                ["Destination", item.destination],
                [
                  "Requested date / time",
                  `${item.requestedAt.replace("T", " · ")} (${item.timeZone === "Asia/Dhaka" ? "Dhaka" : "Bangkok"} time)`,
                ],
                ["Coordinator", coordinator(item.coordinatorId)],
                [
                  "Family contact",
                  `${item.familyContact} · ${item.familyPhone}`,
                ],
                [
                  "Hospital / transport team contact",
                  item.hospitalContact || "Not recorded",
                ],
              ].map(([label, value]) => (
                <div key={label}>
                  <small>{label}</small>
                  <p>{value}</p>
                </div>
              ))}
            </div>
            <h3>Coordination notes</h3>
            <p className="ws-ambulance-notes">
              {item.notes || "No additional notes."}
            </p>
            <h3 className="ws-spaced-heading">Linked documents</h3>
            {!canDocuments ? (
              <p>Document access is restricted for your role.</p>
            ) : item.fileIds.length ? (
              item.fileIds.map((id) => {
                const f = data.files.find((f) => f.id === id)
                return (
                  <p key={id}>
                    {f?.name}{" "}
                    <small>
                      {f?.category} · {f?.date}
                    </small>
                    {f && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          void openFile(f.id, f.name).catch((error: unknown) =>
                            toast.add({
                              title:
                                error instanceof Error
                                  ? error.message
                                  : "File could not be opened.",
                              type: "info",
                            })
                          )
                        }
                      >
                        View document
                      </Button>
                    )}
                  </p>
                )
              })
            ) : (
              <p>No documents linked.</p>
            )}
            <h3 className="ws-spaced-heading">Coordination updates</h3>
            {item.updates.map((u, i) => (
              <div className="ws-ambulance-update" key={`${u.at}-${i}`}>
                <p>{u.text}</p>
                <small>
                  {u.by} · {new Date(u.at).toLocaleString("en-GB")}
                </small>
              </div>
            ))}
            {writable && (
              <Button
                variant="outline"
                onClick={() => setAddingNote(!addingNote)}
              >
                <Plus size={14} />
                Add update
              </Button>
            )}
            {addingNote && (
              <RecordForm
                fields={[
                  {
                    key: "text",
                    label: "Update note",
                    type: "textarea",
                    required: true,
                    full: true,
                  },
                ]}
                onSave={(v) => {
                  if (!writable) return
                  const at = new Date().toISOString()
                  addAmbulanceUpdate(data, item.id, v.text, session.name, at)
                  commit(
                    "Air ambulance coordination update added",
                    (prev) =>
                      addAmbulanceUpdate(
                        prev,
                        item.id,
                        v.text,
                        session.name,
                        at
                      ),
                    "ambulance"
                  )
                  setAddingNote(false)
                }}
                onCancel={() => setAddingNote(false)}
                submitLabel="Save update"
              />
            )}
          </div>
        </Modal>
      )}
    </div>
  )
}
export function AmbulanceCaseSummary({ caseId }: { caseId: string }) {
  const { data, can } = useWorkspace()
  const records = data.ambulanceRequests.filter((r) => r.caseId === caseId)
  return (
    <Panel
      title="Emergency Air Ambulance"
      subtitle="Transfer coordination linked to this patient."
      actions={
        can("visas") ? (
          <Link
            className="ws-inline-link"
            to="/workspace/$module"
            params={{ module: "visas" }}
            search={{ tab: "ambulance", caseId }}
          >
            Open air ambulance desk →
          </Link>
        ) : undefined
      }
    >
      <div className="ws-linked-records">
        {records.map((r) => (
          <article key={r.id}>
            <h3>{r.id}</h3>
            <Status value={r.status} />
            <p>
              {r.pickup} → {r.destination}
            </p>
            <small>
              {r.requestedAt.replace("T", " · ")} ·{" "}
              {r.timeZone === "Asia/Dhaka" ? "Dhaka" : "Bangkok"} time
            </small>
          </article>
        ))}
        {!records.length && (
          <Empty>No air ambulance request linked to this case.</Empty>
        )}
      </div>
    </Panel>
  )
}
