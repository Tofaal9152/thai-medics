import { useState } from "react"
import { Button } from "@/components/ui/button"
import { today } from "@/features/dashboard/data"
import { useWorkspace } from "../context"
import { convertMinor, parseAmount, parseRate } from "../billing"
import type { Currency, Values } from "../model"
import { uid } from "../model"
import { RecordForm } from "./form"
import { choices } from "../form-options"
import { Badge, Empty, Modal, Panel } from "./ui"
export default function QuoteComparison({
  initialCaseId,
}: {
  initialCaseId?: string
}) {
  const { data, commit, session, can } = useWorkspace()
  const canManage = can("hospital"),
    canBill = can("acctEdit")
  const [caseId, setCaseId] = useState(
      initialCaseId || data.patients[3]?.id || ""
    ),
    [hospitals, setHospitals] = useState<string[]>([]),
    [replyId, setReplyId] = useState<string | null>(null),
    [chooseId, setChooseId] = useState<string | null>(null)
  const patient = data.patients.find((p) => p.id === caseId),
    requests = data.quoteRequests.filter((q) => q.caseId === caseId),
    reply = data.quoteRequests.find((q) => q.id === replyId),
    chosen = data.quoteRequests.find((q) => q.id === chooseId)
  function request() {
    if (!canManage || !patient || !hospitals.length) return
    commit("Hospital quote requests recorded (demo)", (prev) => ({
      ...prev,
      quoteRequests: [
        ...prev.quoteRequests,
        ...hospitals
          .filter(
            (id) =>
              !requests.some(
                (q) => q.hospitalId === id && q.status !== "Selected"
              )
          )
          .map((hospitalId) => ({
            id: uid("quote-request"),
            caseId,
            hospitalId,
            packageId:
              prev.collections.packages.find(
                (p) => p.values.hospital === hospitalId
              )?.id || "",
            price: "",
            currency: "THB" as Currency,
            doctorId: "",
            replyDays: "",
            status: "Awaiting reply" as const,
            date: today(),
          })),
      ],
      patients: prev.patients.map((p) =>
        p.id === caseId
          ? {
              ...p,
              notes: [
                ...p.notes,
                `[DEMO] Report-sharing requests recorded for ${hospitals.length} hospitals.`,
              ],
            }
          : p
      ),
    }))
    setHospitals([])
  }
  function saveReply(v: Values) {
    if (!canManage || !reply) return
    parseAmount(v.price)
    commit("Hospital reply recorded", (prev) => ({
      ...prev,
      quoteRequests: prev.quoteRequests.map((q) =>
        q.id === reply.id
          ? { ...q, ...v, currency: v.currency as Currency, status: "Received" }
          : q
      ),
    }))
    setReplyId(null)
  }
  function choose(v: Values) {
    if (!chosen || !patient || (!canManage && chosen.status !== "Selected"))
      return
    if (data.ledger.some((e) => e.caseId === caseId && e.fields.quoteId))
      throw new Error(
        "This case already has a saved hospital quotation. Accounts must review corrections."
      )
    if (!canBill) {
      const hospital = data.collections.hospitals.find(
        (h) => h.id === chosen.hospitalId
      )
      const doctor = data.collections.doctors.find(
        (d) => d.id === chosen.doctorId
      )
      commit(
        "Hospital proposal selected; awaiting Accounts quotation",
        (prev) => ({
          ...prev,
          quoteRequests: prev.quoteRequests.map((q) =>
            q.caseId === caseId && q.status === "Selected"
              ? { ...q, status: "Received" }
              : q.id === chosen.id
                ? { ...q, status: "Selected" }
                : q
          ),
          patients: prev.patients.map((p) =>
            p.id === caseId
              ? {
                  ...p,
                  hospital: hospital?.values.name || p.hospital,
                  doctor: doctor?.values.name || p.doctor,
                }
              : p
          ),
          caseMeta: {
            ...prev.caseMeta,
            [caseId]: {
              ...prev.caseMeta[caseId],
              proposal: "Awaiting Accounts quotation",
            },
          },
        })
      )
      setChooseId(null)
      return
    }
    const original = parseAmount(chosen.price),
      rate = chosen.currency === patient.currency ? 1000000 : parseRate(v.rate),
      amount = convertMinor(original, rate)
    const hospital = data.collections.hospitals.find(
        (h) => h.id === chosen.hospitalId
      ),
      doctor = data.collections.doctors.find((d) => d.id === chosen.doctorId)
    const entry = {
      id: uid("charge"),
      caseId,
      kind: "service" as const,
      description: `Hospital package proposal · ${hospital?.values.name || "Hospital"}`,
      currency: chosen.currency,
      rate,
      originalMinor: original,
      amountMinor: amount,
      date: today(),
      fields: { packageId: chosen.packageId, quoteId: chosen.id },
      issued: "",
      reversalOf: "",
      reversedBy: "",
      reason: "",
      supplierId: "",
      costId: "",
      by: session.name,
    }
    commit(
      "Selected hospital proposal and saved patient quotation",
      (prev) => ({
        ...prev,
        quoteRequests: prev.quoteRequests.map((q) =>
          q.id === chosen.id
            ? { ...q, status: "Selected" }
            : q.caseId === caseId && q.status === "Selected"
              ? { ...q, status: "Received" }
              : q
        ),
        patients: prev.patients.map((p) =>
          p.id === caseId
            ? {
                ...p,
                hospital: hospital?.values.name || p.hospital,
                doctor: doctor?.values.name || p.doctor,
              }
            : p
        ),
        caseMeta: {
          ...prev.caseMeta,
          [caseId]: { ...prev.caseMeta[caseId], proposal: "Awaiting decision" },
        },
        ledger: [...prev.ledger, entry],
        documents: [
          ...prev.documents,
          {
            id: `QT-${today().slice(0, 4)}-${String(prev.documents.filter((d) => d.type === "Quotation").length + 1).padStart(4, "0")}`,
            caseId,
            type: "Quotation",
            date: today(),
            entries: [entry],
            totalMinor: amount,
            currency: patient.currency,
          },
        ],
      })
    )
    setChooseId(null)
  }
  return (
    <Panel
      title="Send once, compare replies"
      subtitle="Requests and replies are simulated. Staff select the proposal; Accounts saves its financial quotation."
    >
      <div className="ws-compare">
        <label className="ws-field">
          <span>Patient case</span>
          <select
            value={caseId}
            onChange={(e) => {
              setCaseId(e.target.value)
              setHospitals([])
            }}
          >
            {data.patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} · {p.id}
              </option>
            ))}
          </select>
        </label>
        {canManage && (
          <>
            <div className="ws-actions">
              {data.collections.hospitals
                .filter((h) => h.values.status === "Active")
                .map((h) => (
                  <label className="ws-inline-check" key={h.id}>
                    <input
                      type="checkbox"
                      checked={hospitals.includes(h.id)}
                      onChange={(e) =>
                        setHospitals(
                          e.target.checked
                            ? [...hospitals, h.id]
                            : hospitals.filter((id) => id !== h.id)
                        )
                      }
                    />
                    {h.values.name}
                  </label>
                ))}
            </div>
            <Button
              onClick={request}
              disabled={!hospitals.length || !canManage}
            >
              Record report requests (demo)
            </Button>
          </>
        )}
        <div className="ws-quote-grid">
          {requests.map((q) => (
            <article key={q.id}>
              <h3>
                {
                  data.collections.hospitals.find((h) => h.id === q.hospitalId)
                    ?.values.name
                }
              </h3>
              <Badge
                tone={
                  q.status === "Selected"
                    ? "green"
                    : q.status === "Received"
                      ? "blue"
                      : "amber"
                }
              >
                {q.status}
              </Badge>
              <strong>
                {q.price
                  ? `${q.currency} ${Number(q.price).toLocaleString()}`
                  : "Awaiting estimate"}
              </strong>
              <p>
                {q.replyDays ? `${q.replyDays} days to reply` : "No reply yet"}
              </p>
              <small>
                {data.collections.doctors.find((d) => d.id === q.doctorId)
                  ?.values.name || "Doctor to be confirmed"}
              </small>
              {q.status === "Awaiting reply" ? (
                <Button
                  disabled={!canManage}
                  variant="outline"
                  onClick={() => setReplyId(q.id)}
                >
                  Record reply
                </Button>
              ) : (
                <Button
                  disabled={
                    data.ledger.some(
                      (e) => e.caseId === caseId && e.fields.quoteId
                    ) || (q.status === "Selected" ? !canBill : !canManage)
                  }
                  onClick={() => setChooseId(q.id)}
                >
                  {q.status === "Selected"
                    ? canBill
                      ? "Save quotation"
                      : "Awaiting Accounts"
                    : "Choose proposal"}
                </Button>
              )}
            </article>
          ))}
        </div>
        {!requests.length && (
          <Empty>No hospital requests for this case yet.</Empty>
        )}
      </div>
      {reply && (
        <Modal title="Record hospital reply" onClose={() => setReplyId(null)}>
          <RecordForm
            fields={[
              {
                key: "price",
                label: "Package estimate",
                required: true,
                placeholder: "0.00",
              },
              {
                key: "currency",
                label: "Currency",
                type: "select",
                options: choices("THB", "BDT", "USD"),
                required: true,
              },
              {
                key: "doctorId",
                label: "Doctor",
                type: "select",
                options: [
                  { value: "", label: "To be confirmed" },
                  ...data.collections.doctors
                    .filter((d) => d.values.hospital === reply.hospitalId)
                    .map((d) => ({ value: d.id, label: d.values.name })),
                ],
              },
              {
                key: "replyDays",
                label: "Days to reply",
                type: "number",
                min: 0,
                step: "1",
                required: true,
              },
            ]}
            initial={{ currency: "THB", replyDays: "2" }}
            onSave={saveReply}
            onCancel={() => setReplyId(null)}
          />
        </Modal>
      )}
      {chosen && patient && (
        <Modal
          title={
            canBill
              ? "Turn proposal into a quotation"
              : "Select hospital proposal"
          }
          description={`Original: ${chosen.currency} ${chosen.price}. Patient currency: ${patient.currency}.`}
          onClose={() => setChooseId(null)}
        >
          <RecordForm
            fields={
              !canBill || chosen.currency === patient.currency
                ? []
                : [
                    {
                      key: "rate",
                      label: `Manual exchange rate: 1 ${chosen.currency} = ? ${patient.currency}`,
                      required: true,
                    },
                  ]
            }
            onSave={choose}
            onCancel={() => setChooseId(null)}
            submitLabel={
              canBill
                ? "Save proposal & quotation"
                : "Select & send to Accounts"
            }
          />
        </Modal>
      )}
    </Panel>
  )
}
