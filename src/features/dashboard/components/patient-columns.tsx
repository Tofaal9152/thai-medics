import type { ColumnDef } from "@tanstack/react-table"
import { ArrowUpRight, Building2 } from "lucide-react"
import { initials, stages } from "../data"
import type { Language, Patient } from "../data"

export function patientColumns(
  open: (patient: Patient) => void,
  lang: Language
): ColumnDef<Patient>[] {
  const t = (en: string, bn: string) => (lang === "en" ? en : bn)
  return [
    {
      accessorKey: "name",
      header: t("Patient", "রোগী"),
      cell: ({ row: { original: p } }) => (
        <button className="patient-name-cell" onClick={() => open(p)}>
          <span
            className={`patient-avatar avatar-${["rose", "blue", "violet", "green"][Number(p.id.slice(-1)) % 4]}`}
          >
            {initials(p.name)}
          </span>
          <span>
            <strong>{p.name}</strong>
            <small>{p.id}</small>
          </span>
        </button>
      ),
    },
    {
      accessorKey: "hospital",
      header: t("Hospital / specialty", "হাসপাতাল / বিভাগ"),
      cell: ({ row: { original: p } }) => (
        <div className="hospital-cell">
          <span>
            {p.hospital === "Not assigned" ? (
              <>
                <Building2 size={13} />{" "}
                {t("Not assigned yet", "এখনও নির্ধারিত হয়নি")}
              </>
            ) : (
              p.hospital
            )}
          </span>
          <small>{p.department}</small>
        </div>
      ),
    },
    {
      accessorKey: "stage",
      header: t("Current stage", "বর্তমান ধাপ"),
      cell: ({ row: { original: p } }) => (
        <span className={`stage-pill stage-${p.stage}`}>
          <i />
          {lang === "bn" ? stages[p.stage].bn : stages[p.stage].name}
        </span>
      ),
    },
    {
      accessorKey: "coordinator",
      header: t("Coordinator", "কোঅর্ডিনেটর"),
      cell: ({ row: { original: p } }) => (
        <div className="coordinator-cell">
          <span
            className={`mini-avatar ${p.coordinator.startsWith("Nusrat") ? "avatar-rose" : "avatar-blue"}`}
          >
            {initials(p.coordinator)}
          </span>
          {p.coordinator}
        </div>
      ),
    },
    {
      accessorKey: "office",
      header: t("Office", "অফিস"),
      cell: ({ getValue }) => (
        <span className="office-cell">
          <i
            className={getValue() === "Thailand" ? "office-th" : "office-bd"}
          />
          {t(
            String(getValue()),
            getValue() === "Thailand" ? "থাইল্যান্ড" : "বাংলাদেশ"
          )}
        </span>
      ),
    },
    {
      id: "action",
      enableSorting: false,
      header: "",
      cell: ({ row }) => (
        <button
          className="row-open"
          aria-label={`Open ${row.original.name}'s case`}
          onClick={() => open(row.original)}
        >
          <ArrowUpRight size={17} />
        </button>
      ),
    },
  ]
}
