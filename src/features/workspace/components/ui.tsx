import { exportCsv } from "../csv"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import type { ReactNode } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { Download, Plus, Search } from "lucide-react"
import DataTable from "@/components/shared/data-table"
import Pagination from "@/components/shared/pagination"
import { Button } from "@/components/ui/button"
import DashboardDialog from "@/features/dashboard/components/dashboard-dialog"
export function PageHeader({
  title,
  description,
  action,
  onAction,
}: {
  title: string
  description: string
  action?: string
  onAction?: () => void
}) {
  const { t } = useTranslation()
  return (
    <header className="ws-page-header">
      <div>
        <div className="page-eyebrow">THAI MEDICAL DESK</div>
        <h1>{t(title)}</h1>
        <p>{description}</p>
      </div>
      {action && (
        <Button className="ws-main-action" onClick={onAction}>
          <Plus size={16} />
          {t(action)}
        </Button>
      )}
    </header>
  )
}
export function Panel({
  title,
  subtitle,
  children,
  actions,
  className = "",
}: {
  title?: string
  subtitle?: string
  children: ReactNode
  actions?: ReactNode
  className?: string
}) {
  const { t } = useTranslation()
  return (
    <section className={`ws-panel ${className}`}>
      {(title || actions) && (
        <header>
          <div>
            <h2>{t(title || "")}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          {actions}
        </header>
      )}
      {children}
    </section>
  )
}
export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode
  tone?: "neutral" | "rose" | "green" | "amber" | "blue"
}) {
  const { t } = useTranslation()
  return (
    <span className={`ws-badge ws-${tone}`}>
      {typeof children === "string" ? t(children) : children}
    </span>
  )
}
export function Metric({
  label,
  value,
  note,
}: {
  label: string
  value: ReactNode
  note?: string
}) {
  const { t } = useTranslation()
  return (
    <div className="ws-metric">
      <span>{t(label)}</span>
      <strong>{value}</strong>
      {note && <small>{note}</small>}
    </div>
  )
}
export function Empty({ children }: { children: ReactNode }) {
  return <div className="ws-empty">{children}</div>
}
export function Modal({
  title,
  description,
  onClose,
  children,
  wide = false,
}: {
  title: string
  description?: string
  onClose: () => void
  children: ReactNode
  wide?: boolean
}) {
  return (
    <DashboardDialog
      title={title}
      description={description}
      onClose={onClose}
      wide={wide}
    >
      {children}
    </DashboardDialog>
  )
}
export function DataList<T>({
  data,
  columns,
  searchText,
  placeholder = "Search records…",
  children,
}: {
  data: T[]
  columns: ColumnDef<T>[]
  searchText: (row: T) => string
  placeholder?: string
  children?: ReactNode
}) {
  const [query, setQuery] = useState(""),
    [page, setPage] = useState(1)
  const filtered = data.filter((row) =>
    searchText(row).toLowerCase().includes(query.toLowerCase())
  )
  return (
    <>
      <div className="ws-toolbar">
        <label className="ws-search">
          <Search size={16} />
          <input
            aria-label={placeholder}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setPage(1)
            }}
            placeholder={placeholder}
          />
        </label>
        {children}
      </div>
      <DataTable
        data={filtered}
        columns={columns}
        page={Math.min(page, Math.max(1, Math.ceil(filtered.length / 10)))}
        pageSize={10}
      />
      <Pagination
        page={Math.min(page, Math.max(1, Math.ceil(filtered.length / 10)))}
        total={filtered.length}
        onPageChange={setPage}
      />
    </>
  )
}
export function ExportButton({
  name,
  rows,
}: {
  name: string
  rows: (string | number)[][]
}) {
  return (
    <Button variant="outline" onClick={() => exportCsv(name, rows)}>
      <Download size={14} />
      Export CSV
    </Button>
  )
}
