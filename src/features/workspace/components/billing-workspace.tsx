import { useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { today } from "@/features/dashboard/data"
import { useWorkspace } from "../context"
import {
  calculateCharge,
  issueDraftInvoice,
  chargeKinds,
  convertMinor,
  costLocked,
  displayMoney,
  parseAmount,
  parseRate,
  reverseLedger,
  totals,
} from "../billing"
import type {
  Currency,
  EntryKind,
  FinancialDoc,
  LedgerEntry,
  Values,
} from "../model"
import { uid } from "../model"
import type { FieldDef } from "./form"
import { RecordForm } from "./form"
import { choices } from "../form-options"
import { Badge, DataList, Empty, Modal, Panel } from "./ui"
const kindLabels: Record<EntryKind, string> = {
  visa: "Visa fees",
  air: "Air ticket",
  hotel: "Hotel charges",
  land: "Land package",
  service: "Service charges",
  discount: "Discount",
  payment: "Payment received",
  refund: "Patient refund",
  "supplier-cost": "Supplier cost",
  "supplier-payment": "Supplier payment",
}
export default function BillingWorkspace({
  caseId,
  patientView = false,
}: {
  caseId: string
  patientView?: boolean
}) {
  const { data, commit, can, session } = useWorkspace()
  const patient = data.patients.find((p) => p.id === caseId)
  const [formKind, setFormKind] = useState<EntryKind | null>(null),
    [editingId, setEditingId] = useState<string | null>(null),
    [reverseId, setReverseId] = useState<string | null>(null),
    [document, setDocument] = useState<FinancialDoc | null>(null),
    [issue, setIssue] = useState(false),
    [checkout, setCheckout] = useState(false)
  const entries = data.ledger.filter((e) => e.caseId === caseId),
    summary = totals(entries),
    editable = can("acctEdit") && !patientView,
    editing = entries.find((e) => e.id === editingId),
    reverse = entries.find((e) => e.id === reverseId)
  function number(prefix: string) {
    return `${prefix}-${today().slice(0, 4)}-${String(data.documents.filter((d) => d.id.startsWith(prefix + "-")).length + 1).padStart(4, "0")}`
  }
  function fields(kind: EntryKind): FieldDef[] {
    const required = (
      key: string,
      label: string,
      type: FieldDef["type"] = "text"
    ): FieldDef => ({ key, label, type, required: true })
    const amount = required("amount", "Amount"),
      unit = required("unit", "Unit rate"),
      service = { key: "service", label: "Separate service charge (optional)" }
    let specific: FieldDef[] = []
    if (kind === "visa")
      specific = [
        required("category", "Visa category"),
        { ...required("quantity", "Travellers", "number"), min: 1, step: "1" },
        unit,
        service,
      ]
    if (kind === "air")
      specific = [
        required("passenger", "Passenger"),
        required("airline", "Airline"),
        required("route", "Route"),
        required("departure", "Departure date", "date"),
        { key: "return", label: "Return date", type: "date" },
        { key: "ticketRef", label: "Ticket reference" },
        amount,
        service,
      ]
    if (kind === "hotel")
      specific = [
        required("hotel", "Hotel"),
        required("checkIn", "Check-in", "date"),
        required("checkOut", "Check-out", "date"),
        { ...required("rooms", "Rooms", "number"), min: 1, step: "1" },
        unit,
      ]
    if (kind === "land")
      specific = [
        {
          ...required("serviceType", "Service", "select"),
          options: choices(
            "Airport transfer",
            "Hospital transfer",
            "Interpreter",
            "Other"
          ),
        },
        { ...required("quantity", "Quantity", "number"), min: 1, step: "1" },
        unit,
        {
          key: "includesHotel",
          label: "Includes accommodation?",
          type: "select",
          options: choices("No", "Yes"),
        },
      ]
    if (["service", "discount"].includes(kind)) specific = [amount]
    if (["payment", "refund", "supplier-payment"].includes(kind))
      specific = [
        amount,
        {
          ...required("method", "Payment method", "select"),
          options: choices(
            "Cash",
            "Bank",
            "bKash / Nagad",
            "Card",
            "Cheque",
            "Other"
          ),
        },
        { key: "reference", label: "Payment reference" },
      ]
    if (kind === "supplier-cost")
      specific = [
        amount,
        {
          ...required("category", "Cost category", "select"),
          options: choices(
            "Accommodation",
            "Airline",
            "Visa",
            "Transport",
            "Interpreter",
            "Other"
          ),
        },
      ]
    if (kind === "supplier-cost" || kind === "supplier-payment")
      specific.push({
        ...required("supplierId", "Supplier", "select"),
        options: data.collections.suppliers.map((s) => ({
          value: s.id,
          label: s.values.name,
        })),
      })
    if (kind === "supplier-payment")
      specific.push({
        key: "costId",
        label: "Settle a specific cost",
        type: "select",
        options: [
          { value: "", label: "Unallocated supplier payment" },
          ...entries
            .filter(
              (e) =>
                e.kind === "supplier-cost" && !e.reversedBy && !e.reversalOf
            )
            .map((e) => ({
              value: e.id,
              label: `${e.description} · ${displayMoney(e.amountMinor, patient!.currency)}`,
            })),
        ],
      })
    return [
      required("description", "Description"),
      ...specific,
      required("date", "Date", "date"),
      {
        ...required("currency", "Entry currency", "select"),
        options: choices("BDT", "THB", "USD"),
      },
      {
        key: "rate",
        label: `Exchange rate: 1 entry-currency unit = ? ${patient?.currency} (only for a different currency)`,
      },
    ]
  }
  function preview(v: Values) {
    if (!patient || !formKind) return null
    try {
      const original = calculateCharge(formKind, v),
        rate =
          v.currency === patient.currency ? 1000000 : parseRate(v.rate || ""),
        amount = convertMinor(original, rate)
      return (
        <div className="ws-calculation">
          Calculation preview:{" "}
          <strong>
            {displayMoney(original, v.currency as Currency)} →{" "}
            {displayMoney(amount, patient.currency)}
          </strong>
        </div>
      )
    } catch {
      return (
        <p className="ws-form-hint">
          Complete the amount, dates and exchange rate to see the calculation.
        </p>
      )
    }
  }
  function saveEntry(values: Values) {
    if (!patient || !formKind || !editable) return
    const originalMinor = calculateCharge(formKind, values),
      rate =
        values.currency === patient.currency
          ? 1000000
          : parseRate(values.rate || ""),
      amountMinor = convertMinor(originalMinor, rate)
    if (values.costId) {
      const cost = entries.find((e) => e.id === values.costId)
      if (!cost || cost.supplierId !== values.supplierId)
        throw new Error("The selected supplier must match the supplier cost.")
    }
    const entry: LedgerEntry = {
      id: editing?.id || uid("entry"),
      caseId,
      kind: formKind,
      description: values.description,
      currency: values.currency as Currency,
      rate,
      originalMinor,
      amountMinor,
      date: values.date,
      fields: values,
      issued: editing?.issued || "",
      reversalOf: "",
      reversedBy: "",
      reason: "",
      supplierId: values.supplierId || "",
      costId: values.costId || "",
      by: session.name,
    }
    commit(
      editing ? "Financial draft updated" : "Financial entry recorded (demo)",
      (prev) => {
        let next = {
          ...prev,
          ledger: editing
            ? prev.ledger.map((e) => (e.id === editing.id ? entry : e))
            : [...prev.ledger, entry],
        }
        if (["payment", "refund"].includes(formKind) && !editing)
          next = {
            ...next,
            documents: [
              ...prev.documents,
              {
                id: number("RCT"),
                caseId,
                type: "Receipt",
                date: values.date,
                entries: [entry],
                totalMinor: amountMinor * (formKind === "refund" ? -1 : 1),
                currency: patient.currency,
              },
            ],
          }
        return next
      },
      "payment"
    )
    setFormKind(null)
    setEditingId(null)
  }
  function issueInvoice() {
    if (!patient || !editable) return
    const id = number("INV")
    const next = issueDraftInvoice(data, caseId, id)
    const doc = next.documents.find((d) => d.id === id)!
    commit(
      `Issued ${id}; charges are locked`,
      (prev) => issueDraftInvoice(prev, caseId, id),
      "invoice"
    )
    setIssue(false)
    setDocument(doc)
  }
  function quote(save = false) {
    if (!patient || (save && !editable)) return
    const charges = entries.filter(
      (e) => chargeKinds.includes(e.kind) && !e.reversedBy && !e.reversalOf
    )
    const doc: FinancialDoc = {
      id: save ? number("QT") : "QUOTATION PREVIEW",
      caseId,
      type: "Quotation",
      date: today(),
      entries: charges.map((e) => ({ ...e, fields: { ...e.fields } })),
      totalMinor: totals(charges).billed,
      currency: patient.currency,
    }
    if (save)
      commit(
        `Saved quotation ${doc.id}`,
        (prev) => ({ ...prev, documents: [...prev.documents, doc] }),
        "quotation"
      )
    setDocument(doc)
  }
  function showStatement() {
    if (!patient) return
    setDocument({
      id: `ST-${patient.id}`,
      caseId,
      type: "Statement",
      date: today(),
      entries: entries.filter(
        (e) => !["supplier-cost", "supplier-payment"].includes(e.kind)
      ),
      totalMinor: summary.balance,
      currency: patient.currency,
    })
  }
  const columns: ColumnDef<LedgerEntry>[] = [
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row: { original: e } }) => (
        <div className={e.reversedBy || e.reversalOf ? "ws-reversed" : ""}>
          {e.description}
          <small>
            {kindLabels[e.kind]} · {e.id}
            {e.reason && ` · ${e.reason}`}
          </small>
        </div>
      ),
    },
    { accessorKey: "date", header: "Date" },
    {
      id: "original",
      header: "Original / rate",
      cell: ({ row: { original: e } }) => (
        <span>
          {displayMoney(e.originalMinor, e.currency)}
          <small>
            {e.currency !== patient?.currency
              ? `@ ${(e.rate / 1000000).toFixed(6)}`
              : "Same currency"}
          </small>
        </span>
      ),
    },
    {
      id: "amount",
      header: patient?.currency || "Amount",
      accessorFn: (e) => e.amountMinor,
      cell: ({ row: { original: e } }) =>
        displayMoney(
          e.amountMinor *
            (e.kind === "discount" || e.kind === "refund" ? -1 : 1),
          patient?.currency || "BDT"
        ),
    },
    {
      id: "status",
      header: "Status",
      cell: ({ row: { original: e } }) => (
        <Badge
          tone={
            e.reversedBy
              ? "rose"
              : e.issued ||
                  ["payment", "refund", "supplier-payment"].includes(e.kind)
                ? "green"
                : "amber"
          }
        >
          {e.reversalOf
            ? "Reversal"
            : e.reversedBy
              ? "Reversed"
              : e.issued || costLocked(e, entries)
                ? "Locked"
                : ["payment", "refund", "supplier-payment"].includes(e.kind)
                  ? "Recorded"
                  : "Draft"}
        </Badge>
      ),
    },
    {
      id: "action",
      header: "",
      enableSorting: false,
      cell: ({ row: { original: e } }) =>
        editable && !e.reversalOf && !e.reversedBy ? (
          <div className="ws-inline-actions">
            {((chargeKinds.includes(e.kind) && !e.issued) ||
              (e.kind === "supplier-cost" && !costLocked(e, entries))) && (
              <Button
                variant="outline"
                size="xs"
                onClick={() => {
                  setEditingId(e.id)
                  setFormKind(e.kind)
                }}
              >
                Edit
              </Button>
            )}
            {chargeKinds.includes(e.kind) && !e.issued ? (
              <Button
                variant="ghost"
                size="xs"
                onClick={() =>
                  commit("Deleted a draft charge", (prev) => ({
                    ...prev,
                    ledger: prev.ledger.filter((item) => item.id !== e.id),
                  }))
                }
              >
                Delete draft
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="xs"
                onClick={() => setReverseId(e.id)}
              >
                Reverse
              </Button>
            )}
          </div>
        ) : null,
    },
  ]
  if (!patient) return <Empty>Patient account not found.</Empty>
  const doubleBilling =
    entries.some(
      (e) =>
        e.kind === "land" &&
        e.fields.includesHotel === "Yes" &&
        !e.reversedBy &&
        !e.reversalOf
    ) &&
    entries.some((e) => e.kind === "hotel" && !e.reversedBy && !e.reversalOf)
  return (
    <div className="ws-billing">
      <Panel
        title="Patient account"
        subtitle={`${patient.name} · ${patient.id}`}
        actions={
          <select
            className="ws-select"
            aria-label="Patient invoice currency"
            value={patient.currency}
            disabled={entries.length > 0 || !editable}
            onChange={(e) =>
              commit("Updated invoice currency", (prev) => ({
                ...prev,
                patients: prev.patients.map((p) =>
                  p.id === caseId
                    ? { ...p, currency: e.target.value as Currency }
                    : p
                ),
              }))
            }
          >
            {["BDT", "THB", "USD"].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        }
      >
        <div className="ws-account-actions">
          <Button variant="outline" onClick={() => quote(false)}>
            Preview quotation
          </Button>
          {editable && (
            <>
              <Button
                variant="outline"
                onClick={() => quote(true)}
                disabled={!entries.some((e) => chargeKinds.includes(e.kind))}
              >
                Save quotation
              </Button>
              <Button
                onClick={() => setIssue(true)}
                disabled={
                  !entries.some(
                    (e) => chargeKinds.includes(e.kind) && !e.issued
                  )
                }
              >
                Issue invoice
              </Button>
            </>
          )}
          <Button variant="outline" onClick={showStatement}>
            Patient statement
          </Button>
          {summary.balance > 0 && (patientView || editable) && (
            <Button variant="outline" onClick={() => setCheckout(true)}>
              Demo payment link
            </Button>
          )}
        </div>
        {doubleBilling && (
          <p className="ws-warning">
            Possible double billing: a combined land package includes hotel, and
            a separate hotel charge exists.
          </p>
        )}
        <div className="ws-account-summary">
          <div>
            <small>Total patient charges</small>
            <strong>{displayMoney(summary.billed, patient.currency)}</strong>
            <small>
              {displayMoney(summary.draft, patient.currency)} in draft charges
            </small>
          </div>
          <div>
            <small>Net payments received</small>
            <strong>{displayMoney(summary.paid, patient.currency)}</strong>
          </div>
          <div>
            <small>
              {summary.balance < 0 ? "Patient credit" : "Outstanding balance"}
            </small>
            <strong>
              {displayMoney(Math.abs(summary.balance), patient.currency)}
            </strong>
          </div>
        </div>
      </Panel>
      {!patientView && (
        <Panel title="Suppliers & internal profit">
          <div className="ws-account-summary">
            <div>
              <small>Supplier costs / paid</small>
              <strong>{displayMoney(summary.cost, patient.currency)}</strong>
              <small>
                Paid: {displayMoney(summary.supplierPaid, patient.currency)}
              </small>
            </div>
            <div>
              <small>Supplier outstanding</small>
              <strong>
                {displayMoney(summary.supplierDue, patient.currency)}
              </strong>
            </div>
            <div>
              <small>Invoiced / estimated profit</small>
              <strong>
                {displayMoney(summary.invoicedProfit, patient.currency)}
              </strong>
              <small>
                Including drafts:{" "}
                {displayMoney(summary.estimatedProfit, patient.currency)}
              </small>
            </div>
          </div>
        </Panel>
      )}
      {!patientView && (
        <Panel
          title="Patient charges"
          actions={
            editable ? (
              <div className="ws-inline-actions">
                {chargeKinds.map((kind) => (
                  <Button
                    key={kind}
                    size="xs"
                    variant="outline"
                    onClick={() => {
                      setEditingId(null)
                      setFormKind(kind)
                    }}
                  >
                    + {kindLabels[kind]}
                  </Button>
                ))}
              </div>
            ) : undefined
          }
        >
          <DataList
            data={entries.filter((e) => chargeKinds.includes(e.kind))}
            columns={columns}
            searchText={(e) => `${e.description} ${e.id} ${e.kind}`}
          />
        </Panel>
      )}
      <Panel
        title="Payments & refunds"
        actions={
          editable ? (
            <div className="ws-inline-actions">
              <Button
                size="sm"
                onClick={() => {
                  setFormKind("payment")
                  setEditingId(null)
                }}
              >
                Record payment
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setFormKind("refund")
                  setEditingId(null)
                }}
              >
                Record refund
              </Button>
            </div>
          ) : undefined
        }
      >
        <DataList
          data={entries.filter((e) => ["payment", "refund"].includes(e.kind))}
          columns={patientView ? columns.slice(0, 4) : columns}
          searchText={(e) => `${e.description} ${e.id}`}
        />
      </Panel>
      {!patientView && (
        <Panel
          title="Supplier costs & payments"
          actions={
            editable ? (
              <div className="ws-inline-actions">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setFormKind("supplier-cost")
                    setEditingId(null)
                  }}
                >
                  Add supplier cost
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setFormKind("supplier-payment")
                    setEditingId(null)
                  }}
                >
                  Record supplier payment
                </Button>
              </div>
            ) : undefined
          }
        >
          <DataList
            data={entries.filter((e) => e.kind.startsWith("supplier-"))}
            columns={columns}
            searchText={(e) => `${e.description} ${e.id}`}
          />
        </Panel>
      )}
      <Panel title="Issued financial documents">
        <div className="ws-document-list">
          {data.documents
            .filter((d) => d.caseId === caseId)
            .slice()
            .reverse()
            .map((d) => (
              <button key={d.id} onClick={() => setDocument(d)}>
                <span>
                  <strong>{d.id}</strong>
                  <small>
                    {d.type} · {d.date}
                  </small>
                </span>
                <span>{displayMoney(d.totalMinor, d.currency)} →</span>
              </button>
            ))}
          {!data.documents.some((d) => d.caseId === caseId) && (
            <Empty>No saved documents yet.</Empty>
          )}
        </div>
      </Panel>
      {formKind && (
        <Modal
          title={`${editing ? "Edit" : "Add"} ${kindLabels[formKind]}`}
          description={`Account currency: ${patient.currency}. Decimal amounts and manual exchange rates are preserved.`}
          onClose={() => {
            setFormKind(null)
            setEditingId(null)
          }}
          wide
        >
          <RecordForm
            key={`${formKind}-${editingId}`}
            fields={fields(formKind)}
            initial={{
              description: editing?.description || kindLabels[formKind],
              date: today(),
              currency: editing?.currency || patient.currency,
              amount: editing ? (editing.originalMinor / 100).toFixed(2) : "",
              rate: editing ? String(editing.rate / 1000000) : "",
              quantity: "1",
              rooms: "1",
              service: "0",
              passenger: patient.name,
              ...editing?.fields,
            }}
            onSave={saveEntry}
            preview={preview}
            onCancel={() => {
              setFormKind(null)
              setEditingId(null)
            }}
          />
        </Modal>
      )}
      {reverse && (
        <Modal
          title="Reverse a financial entry"
          description="The original stays on record. An equal and opposite entry corrects the account."
          onClose={() => setReverseId(null)}
        >
          <RecordForm
            fields={[
              {
                key: "reason",
                label: "Reason for reversal",
                required: true,
                type: "textarea",
              },
            ]}
            onSave={(v) => {
              commit(
                "Recorded financial reversal",
                (prev) => ({
                  ...prev,
                  ledger: reverseLedger(
                    prev.ledger,
                    reverse.id,
                    v.reason,
                    uid("reversal")
                  ),
                }),
                "payment"
              )
              setReverseId(null)
            }}
            onCancel={() => setReverseId(null)}
            submitLabel="Record reversal"
          />
        </Modal>
      )}
      {issue && (
        <Modal
          title="Issue and lock invoice?"
          description={`${entries.filter((e) => chargeKinds.includes(e.kind) && !e.issued).length} draft entries will be locked. Corrections require a reversal.`}
          onClose={() => setIssue(false)}
        >
          <div className="ws-detail-body">
            {doubleBilling && (
              <p className="ws-warning">
                Review the possible double hotel billing before continuing.
              </p>
            )}
            <div className="ws-form-footer">
              <Button variant="outline" onClick={() => setIssue(false)}>
                Cancel
              </Button>
              <Button onClick={issueInvoice}>Issue invoice (demo)</Button>
            </div>
          </div>
        </Modal>
      )}
      {document && (
        <Modal
          title={document.type}
          description={document.id}
          onClose={() => setDocument(null)}
          wide
        >
          <div className="ws-account-actions">
            <Button onClick={() => window.print()}>Print / Save PDF</Button>
          </div>
          <FinancialDocument document={document} />
        </Modal>
      )}
      {checkout && (
        <Modal
          title="Demo payment interface"
          description="No money will be collected and no payment provider will be contacted."
          onClose={() => setCheckout(false)}
        >
          <RecordForm
            fields={[
              {
                key: "method",
                label: "Payment method",
                type: "select",
                options: choices("bKash", "Nagad", "Card"),
                required: true,
              },
              {
                key: "amount",
                label: `Amount (${patient.currency})`,
                required: true,
              },
            ]}
            initial={{
              method: "bKash",
              amount: (Math.max(0, summary.balance) / 100).toFixed(2),
            }}
            onSave={(v) => {
              const amount = parseAmount(v.amount)
              if (amount <= 0) throw new Error("Enter a positive demo amount.")
              const e: LedgerEntry = {
                id: uid("demo-payment"),
                caseId,
                kind: "payment",
                description: "Simulated online payment",
                currency: patient.currency,
                rate: 1000000,
                originalMinor: amount,
                amountMinor: amount,
                date: today(),
                fields: { method: v.method, reference: "DEMO-ONLINE" },
                issued: "",
                reversalOf: "",
                reversedBy: "",
                reason: "",
                supplierId: "",
                costId: "",
                by: patientView ? patient.name : session.name,
              }
              commit(
                "Demo payment recorded; no real transaction occurred",
                (prev) => ({
                  ...prev,
                  ledger: [...prev.ledger, e],
                  documents: [
                    ...prev.documents,
                    {
                      id: number("RCT"),
                      caseId,
                      type: "Receipt",
                      date: today(),
                      entries: [e],
                      totalMinor: amount,
                      currency: patient.currency,
                    },
                  ],
                }),
                "payment"
              )
              setCheckout(false)
            }}
            onCancel={() => setCheckout(false)}
            submitLabel="Simulate successful payment"
          />
        </Modal>
      )}
    </div>
  )
}
export function FinancialDocument({
  document: doc,
}: {
  document: FinancialDoc
}) {
  const { data } = useWorkspace()
  const patient = data.patients.find((p) => p.id === doc.caseId)
  return (
    <article className="ws-print-document">
      <div className="ws-print-header">
        <div>
          <strong>{data.settings.company}</strong>
          <p>{data.settings.address}</p>
          <small>
            {data.settings.phone} · {data.settings.email}
          </small>
        </div>
        <div>
          <h2>{doc.type}</h2>
          <p>{doc.id}</p>
          <small>{doc.date}</small>
        </div>
      </div>
      <div className="ws-print-patient">
        <strong>{patient?.name}</strong>
        <p>
          {doc.caseId} · {patient?.phone} · {doc.currency}
        </p>
      </div>
      <table>
        <thead>
          <tr>
            <th>Description</th>
            <th>Original / FX</th>
            <th>Amount ({doc.currency})</th>
          </tr>
        </thead>
        <tbody>
          {doc.entries.map((e) => (
            <tr key={e.id}>
              <td>
                {e.description}
                {e.reversalOf && <small>Reversal of {e.reversalOf}</small>}
              </td>
              <td>
                {displayMoney(e.originalMinor, e.currency)}
                {e.currency !== doc.currency && (
                  <small>@ {e.rate / 1000000}</small>
                )}
              </td>
              <td>
                {displayMoney(
                  e.amountMinor *
                    (e.kind === "discount" || e.kind === "refund" ? -1 : 1),
                  doc.currency
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="ws-print-total">
        <span>
          {doc.type === "Statement"
            ? "Current account balance"
            : "Document total"}
        </span>
        <strong>{displayMoney(doc.totalMinor, doc.currency)}</strong>
      </div>
      <footer>DEMO · {data.settings.footer}</footer>
    </article>
  )
}
