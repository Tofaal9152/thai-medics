import { useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { Link } from "@tanstack/react-router"
import { Mail, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/toast"
import DataTable from "@/components/shared/data-table"
import Pagination from "@/components/shared/pagination"
import { stages } from "@/features/dashboard/data"
import type { Patient } from "@/features/dashboard/data"
import { useWorkspace } from "../context"
import { uid } from "../model"
import { promotionRecipients, recordPromotion } from "../promotions"
import type { PromotionDraft } from "../promotions"
import {
  Badge,
  Empty,
  Metric,
  Modal,
  PageHeader,
  Panel,
} from "../components/ui"

const templates = [
  {
    name: "Monthly newsletter",
    category: "Newsletter" as const,
    channel: "Email" as const,
    subject: "Your monthly Thai Medics update",
    body: "Hello {name}, here is our latest news about hospital packages and patient support. Contact Thai Medical Desk for more information. Your case reference is {caseId}.",
  },
  {
    name: "Buy one, get one offer",
    category: "WhatsApp promotion" as const,
    channel: "WhatsApp" as const,
    subject: "Buy one, get one - offer",
    body: "Hello {name}, explore our buy one, get one promotional offer. Contact Thai Medical Desk for eligible services, availability and terms. This is a fictional promotion.",
  },
  {
    name: "Health camp promotion",
    category: "Marketing" as const,
    channel: "WhatsApp" as const,
    subject: "Upcoming health camp",
    body: "Hello {name}, our upcoming health camp is open for inquiries. Contact the desk for the schedule and service details. This is a fictional invitation.",
  },
]
export default function PromotionsPage() {
  const { data, can, commit, session } = useWorkspace()
  const [draft, setDraft] = useState<PromotionDraft>({ ...templates[0] })
  const [template, setTemplate] = useState("0"),
    [query, setQuery] = useState(""),
    [office, setOffice] = useState(""),
    [stage, setStage] = useState("")
  const [selected, setSelected] = useState<string[]>([]),
    [page, setPage] = useState(1),
    [reviewIds, setReviewIds] = useState<string[] | null>(null)
  const writable = can("messages")
  const filtered = data.patients.filter(
    (p) =>
      (!office || p.office === office) &&
      (!stage || String(p.stage) === stage) &&
      `${p.name} ${p.id} ${p.phone} ${data.caseMeta[p.id]?.email || ""}`
        .toLowerCase()
        .includes(query.toLowerCase())
  )
  const allSelected =
    filtered.length > 0 && filtered.every((p) => selected.includes(p.id))
  const history = data.collections.messages.filter((m) => m.values.campaignId)
  const preview = promotionRecipients(data, reviewIds || [], draft)
  const safePage = Math.min(page, Math.max(1, Math.ceil(filtered.length / 10)))
  function review(ids: string[]) {
    if (!writable) return
    if (
      !draft.body.trim() ||
      (draft.channel === "Email" && !draft.subject.trim())
    ) {
      toast.add({
        title: "Enter the message and email subject before sending.",
        type: "error",
      })
      return
    }
    if (!ids.length) return
    setReviewIds(ids)
  }
  const columns: ColumnDef<Patient>[] = [
    {
      id: "select",
      header: () => (
        <input
          type="checkbox"
          aria-label="Select all filtered patients"
          checked={allSelected}
          disabled={!writable || !filtered.length}
          ref={(el) => {
            if (el)
              el.indeterminate =
                !allSelected && filtered.some((p) => selected.includes(p.id))
          }}
          onChange={(e) =>
            setSelected(
              e.target.checked
                ? [...new Set([...selected, ...filtered.map((p) => p.id)])]
                : selected.filter((id) => !filtered.some((p) => p.id === id))
            )
          }
        />
      ),
      cell: ({ row: { original: p } }) => (
        <input
          type="checkbox"
          aria-label={`Select ${p.name}`}
          checked={selected.includes(p.id)}
          disabled={!writable}
          onChange={(e) =>
            setSelected(
              e.target.checked
                ? [...selected, p.id]
                : selected.filter((id) => id !== p.id)
            )
          }
        />
      ),
    },
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
          <small>{p.id}</small>
        </Link>
      ),
    },
    { accessorKey: "phone", header: "WhatsApp / phone" },
    {
      id: "email",
      header: "Email",
      accessorFn: (p) => data.caseMeta[p.id]?.email || "Not added",
    },
    {
      id: "stage",
      header: "Stage",
      cell: ({ row: { original: p } }) => (
        <Badge>
          {data.caseMeta[p.id]?.status === "lost"
            ? "Lost lead"
            : stages[p.stage].name}
        </Badge>
      ),
    },
    {
      id: "last",
      header: "Last promotion",
      cell: ({ row: { original: p } }) => {
        const last = history.find((m) => m.values.caseId === p.id)
        return last ? (
          <span>
            {last.values.channel}
            <small>
              {new Date(last.createdAt).toLocaleDateString("en-GB")}
            </small>
          </span>
        ) : (
          <span>Not sent yet</span>
        )
      },
    },
    {
      id: "action",
      header: "Action",
      cell: ({ row: { original: p } }) => (
        <Button
          variant="outline"
          size="sm"
          disabled={!writable}
          onClick={() => review([p.id])}
        >
          <Send size={14} />
          Send
        </Button>
      ),
    },
  ]
  return (
    <div className="workspace-page">
      <PageHeader
        title="Newsletter & promotions"
        description="Send newsletters, marketing messages and WhatsApp promotions to one patient or a selected group."
      />
      <div className="ws-metrics">
        <Metric label="All patients" value={data.patients.length} />
        <Metric label="Selected patients" value={selected.length} />
        <Metric label="deliveries" value={history.length} />
      </div>
      <Panel
        title="Compose a campaign"
        subtitle="Choose a template or write your own message. Sending is simulated; no email or WhatsApp provider is connected."
      >
        <div className="ws-form">
          <div className="ws-form-grid">
            <label className="ws-field">
              <span>Template</span>
              <select
                value={template}
                disabled={!writable}
                onChange={(e) => {
                  setTemplate(e.target.value)
                  if (e.target.value !== "custom")
                    setDraft({ ...templates[Number(e.target.value)] })
                }}
              >
                <option value="custom">Custom message</option>
                {templates.map((t, i) => (
                  <option key={t.name} value={String(i)}>
                    {t.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="ws-field">
              <span>Campaign type</span>
              <select
                value={draft.category}
                disabled={!writable}
                onChange={(e) => {
                  const category = e.target.value as PromotionDraft["category"]
                  setTemplate("custom")
                  setDraft({
                    ...draft,
                    category,
                    channel:
                      category === "Newsletter"
                        ? "Email"
                        : category === "WhatsApp promotion"
                          ? "WhatsApp"
                          : draft.channel,
                  })
                }}
              >
                {["Newsletter", "Marketing", "WhatsApp promotion"].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
            <label className="ws-field">
              <span>Send via</span>
              <select
                value={draft.channel}
                disabled={!writable || draft.category !== "Marketing"}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    channel: e.target.value as PromotionDraft["channel"],
                  })
                }
              >
                <option>Email</option>
                <option>WhatsApp</option>
              </select>
            </label>
            <label className="ws-field">
              <span>
                {draft.channel === "Email" ? "Email subject" : "Campaign name"}
              </span>
              <input
                placeholder="Enter an email subject or campaign name…"
                value={draft.subject}
                disabled={!writable}
                onChange={(e) =>
                  setDraft({ ...draft, subject: e.target.value })
                }
              />
            </label>
            <label className="ws-field ws-full">
              <span>Message</span>
              <textarea
                placeholder="Write your newsletter or promotional message…"
                rows={4}
                value={draft.body}
                disabled={!writable}
                onChange={(e) => setDraft({ ...draft, body: e.target.value })}
              />
              <small>
                Use {"{name}"} and {"{caseId}"} to personalise each message.
              </small>
            </label>
          </div>
        </div>
      </Panel>
      <Panel
        title="Patient recipients"
        subtitle="All patient cases are listed. Select all filtered patients across pages, or use Send in a single row."
      >
        <div className="ws-toolbar">
          <label className="ws-search">
            <Mail size={16} />
            <input
              aria-label="Search promotion recipients"
              placeholder="Search patient, case ID, phone or email…"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setPage(1)
              }}
            />
          </label>
          <select
            className="ws-select"
            aria-label="Promotion office filter"
            value={office}
            onChange={(e) => {
              setOffice(e.target.value)
              setPage(1)
            }}
          >
            <option value="">All offices</option>
            <option>Bangladesh</option>
            <option>Thailand</option>
          </select>
          <select
            className="ws-select"
            aria-label="Promotion stage filter"
            value={stage}
            onChange={(e) => {
              setStage(e.target.value)
              setPage(1)
            }}
          >
            <option value="">All stages</option>
            {stages.map((s, i) => (
              <option key={s.name} value={String(i)}>
                {s.name}
              </option>
            ))}
          </select>
          <Button
            variant="outline"
            disabled={!selected.length}
            onClick={() => setSelected([])}
          >
            Clear selection
          </Button>
          <Button
            disabled={!selected.length || !writable}
            onClick={() => review(selected)}
          >
            <Send size={14} />
            Bulk send ({selected.length})
          </Button>
        </div>
        <DataTable
          data={filtered}
          columns={columns}
          page={safePage}
          pageSize={10}
          emptyMessage="No patients match these filters."
        />
        <Pagination
          page={safePage}
          total={filtered.length}
          onPageChange={setPage}
        />
        <p className="ws-form-hint ws-promotion-selection">
          {selected.length} selected overall;{" "}
          {filtered.filter((p) => selected.includes(p.id)).length} in this
          filtered list. Selection remains when changing filters or pages.
        </p>
      </Panel>
      <Panel
        title="Promotion history"
        subtitle="Local delivery records also appear in Messaging & reminders and each recipient’s Communication tab."
      >
        {!history.length ? (
          <Empty>No promotions sent yet.</Empty>
        ) : (
          <div className="ws-detail-body">
            {history.slice(0, 20).map((m) => (
              <div className="ws-summary-row" key={m.id}>
                <div>
                  <strong>
                    {data.patients.find((p) => p.id === m.values.caseId)?.name}
                  </strong>
                  <small>
                    {m.values.name} · {m.values.channel} · {m.values.recipient}
                  </small>
                  <small>
                    {new Date(m.createdAt).toLocaleString("en-GB")} ·{" "}
                    {m.values.by}
                  </small>
                </div>
                <Badge tone="green">sent</Badge>
              </div>
            ))}
            {history.length > 20 && (
              <Link to="/workspace/$module" params={{ module: "messages" }}>
                View all delivery records →
              </Link>
            )}
          </div>
        )}
      </Panel>
      {reviewIds && (
        <Modal
          title={
            reviewIds.length === 1
              ? "Review patient message"
              : "Review bulk campaign"
          }
          description={`${draft.channel} · ${preview.delivered.length} valid recipients · ${preview.skipped.length} skipped`}
          onClose={() => setReviewIds(null)}
          wide
        >
          <div className="ws-detail-body">
            <h3>{draft.subject || draft.category}</h3>
            <div className="ws-promotion-preview">
              {preview.delivered[0]?.body ||
                "No valid recipients for the selected channel."}
            </div>
            <p className="ws-muted">
              Personalised preview for the first valid recipient. Each patient
              receives their own name and case ID.
            </p>
            <div className="ws-promotion-recipients">
              {preview.delivered.map((r) => (
                <p key={r.caseId}>
                  <strong>{r.name}</strong> · {r.contact}
                </p>
              ))}
              {preview.skipped.map((r) => (
                <p className="ws-warning" key={r.caseId}>
                  {r.name}: {r.reason}; skipped.
                </p>
              ))}
            </div>
            <p className="ws-form-hint">
              This records deliveries only. No external message will be sent.
            </p>
            <div className="ws-form-footer">
              <Button variant="outline" onClick={() => setReviewIds(null)}>
                Cancel
              </Button>
              <Button
                disabled={!writable || !preview.delivered.length}
                onClick={() => {
                  if (!writable || !preview.delivered.length) return
                  const ids = [...reviewIds],
                    campaign = { ...draft },
                    id = uid("campaign"),
                    at = new Date().toISOString()
                  commit(
                    `Promotion delivery simulated for ${preview.delivered.length} patients (${preview.skipped.length} skipped)`,
                    (prev) =>
                      recordPromotion(
                        prev,
                        ids,
                        campaign,
                        id,
                        session.name,
                        at
                      ),
                    "message"
                  )
                  setSelected((current) =>
                    current.filter((caseId) => !ids.includes(caseId))
                  )
                  setReviewIds(null)
                }}
              >
                Send to{preview.delivered.length} patient
                {preview.delivered.length === 1 ? "" : "s"}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
