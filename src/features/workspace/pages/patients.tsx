import { useMemo, useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { Link, useLocation, useNavigate } from "@tanstack/react-router"
import { Button } from "@/components/ui/button"
import { NewCaseForm } from "@/features/dashboard/components/dashboard-dialog"
import { stages } from "@/features/dashboard/data"
import type { Patient } from "@/features/dashboard/data"
import { useWorkspace } from "../context"
import {
  Badge,
  DataList,
  ExportButton,
  Metric,
  Modal,
  PageHeader,
  Panel,
} from "../components/ui"
import { exportExcel } from "../export"
export default function PatientsPage() {
  const { data, createCase, can, lang, office } = useWorkspace(),
    navigate = useNavigate(),
    location = useLocation()
  const [adding, setAdding] = useState(false),
    [stage, setStage] = useState(""),
    [coordinator, setCoordinator] = useState("")
  const q = new URLSearchParams(location.searchStr).get("q") || ""
  const list = data.patients.filter(
    (p) =>
      (office === "All offices" || p.office === office) &&
      (!stage ||
        (stage === "lost"
          ? data.caseMeta[p.id]?.status === "lost"
          : p.stage === Number(stage))) &&
      (!coordinator || p.coordinator === coordinator) &&
      (!q ||
        `${p.name} ${p.id} ${p.phone}`.toLowerCase().includes(q.toLowerCase()))
  )
  const columns = useMemo<ColumnDef<Patient>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Patient",
        cell: ({ row: { original: p } }) => (
          <Link
            to="/patients/$caseId"
            params={{ caseId: p.id }}
            className="ws-record-name"
          >
            {p.name}
            <small>
              {p.id} · {p.phone}
            </small>
          </Link>
        ),
      },
      {
        accessorKey: "hospital",
        header: "Hospital / specialty",
        cell: ({ row: { original: p } }) => (
          <div>
            {p.hospital}
            <small>{p.department}</small>
          </div>
        ),
      },
      {
        accessorKey: "stage",
        header: "Stage",
        cell: ({ row: { original: p } }) => (
          <Badge
            tone={
              data.caseMeta[p.id]?.status === "lost"
                ? "rose"
                : p.stage === 8
                  ? "green"
                  : "blue"
            }
          >
            {data.caseMeta[p.id]?.status === "lost"
              ? "Lost lead"
              : stages[p.stage].name}
          </Badge>
        ),
      },
      {
        accessorKey: "coordinator",
        header: "Coordinator",
        cell: ({ row: { original: p } }) => (
          <div>
            {p.coordinator}
            <small>{p.office}</small>
          </div>
        ),
      },
      { accessorKey: "source", header: "Source" },
      {
        id: "open",
        header: "",
        cell: ({ row }) => (
          <Link
            to="/patients/$caseId"
            params={{ caseId: row.original.id }}
            className="ws-inline-link"
          >
            Open →
          </Link>
        ),
      },
    ],
    [data.caseMeta]
  )
  const rows = [
    [
      "Case ID",
      "Patient",
      "Phone",
      "Stage",
      "Hospital",
      "Coordinator",
      "Office",
      "Source",
    ],
    ...list.map((p) => [
      p.id,
      p.name,
      p.phone,
      data.caseMeta[p.id]?.status === "lost"
        ? "Lost lead"
        : stages[p.stage].name,
      p.hospital,
      p.coordinator,
      p.office,
      p.source,
    ]),
  ]
  return (
    <div className="workspace-page">
      <PageHeader
        title="Patient cases"
        description="One case file connects the patient, both offices and every service."
        action={can("caseCreate") ? "New patient case" : undefined}
        onAction={() => setAdding(true)}
      />
      <div className="ws-metrics">
        <Metric label="Patient cases" value={list.length} />
        <Metric
          label="Active journeys"
          value={
            list.filter(
              (p) => p.stage < 8 && data.caseMeta[p.id]?.status !== "lost"
            ).length
          }
        />
        <Metric
          label="Completed"
          value={list.filter((p) => p.stage === 8).length}
        />
        <Metric
          label="Lost leads"
          value={
            list.filter((p) => data.caseMeta[p.id]?.status === "lost").length
          }
        />
      </div>
      <Panel>
        <DataList
          data={list}
          columns={columns}
          searchText={(p) =>
            `${p.name} ${p.id} ${p.phone} ${p.phone.replace(/[\s+()-]/g, "")} ${p.hospital} ${p.department}`
          }
          placeholder="Search patient, phone, case ID or hospital…"
        >
          <select
            className="ws-select"
            value={stage}
            onChange={(e) => setStage(e.target.value)}
            aria-label="Case stage"
          >
            <option value="">All stages</option>
            {stages.map((s, i) => (
              <option key={s.name} value={i}>
                {s.name}
              </option>
            ))}
            <option value="lost">Lost leads</option>
          </select>
          <select
            className="ws-select"
            aria-label="Coordinator"
            value={coordinator}
            onChange={(e) => setCoordinator(e.target.value)}
          >
            <option value="">All coordinators</option>
            {[...new Set(data.patients.map((p) => p.coordinator))].map(
              (name) => (
                <option key={name}>{name}</option>
              )
            )}
          </select>
          <ExportButton name="patient-cases" rows={rows} />
          <Button
            variant="outline"
            onClick={() => exportExcel("patient-cases", rows)}
          >
            Excel
          </Button>
        </DataList>
      </Panel>
      {adding && (
        <Modal title="Start a patient case" onClose={() => setAdding(false)}>
          <NewCaseForm
            lang={lang}
            patients={data.patients}
            onCancel={() => setAdding(false)}
            onSave={(values) => {
              const p = createCase({ ...values })
              setAdding(false)
              void navigate({
                to: "/patients/$caseId",
                params: { caseId: p.id },
              })
            }}
          />
        </Modal>
      )}
    </div>
  )
}
