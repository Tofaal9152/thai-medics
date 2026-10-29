import { useState } from "react"
import { Link } from "@tanstack/react-router"
import { Button } from "@/components/ui/button"
import { today } from "@/features/dashboard/data"
import { useWorkspace } from "../context"
import { totals } from "../billing"
import type { ModuleKey, RecordItem } from "../model"
import { uid } from "../model"
import { Badge, Empty } from "./ui"

export default function PartnerDetails({
  module,
  item,
}: {
  module: ModuleKey
  item: RecordItem
}) {
  const { data, commit, can } = useWorkspace()
  const [caseId, setCaseId] = useState(data.patients[0]?.id || "")
  if (module === "hospitals") {
    const packages = data.collections.packages.filter(
      (p) => p.values.hospital === item.id
    )
    const doctors = data.collections.doctors.filter(
      (p) => p.values.hospital === item.id
    )
    const replies = data.quoteRequests.filter((q) => q.hospitalId === item.id)
    return (
      <section>
        <h3>Partner price list</h3>
        {packages.map((p) => (
          <p key={p.id}>
            <strong>{p.values.name}</strong> · {p.values.currency}{" "}
            {Number(p.values.price).toLocaleString()}
            <small>
              Valid until {p.values.validUntil} · {p.values.status}
            </small>
          </p>
        ))}
        {!packages.length && <Empty>No package prices recorded.</Empty>}
        <h3 className="ws-spaced-heading">Specialists</h3>
        {doctors.map((d) => (
          <p key={d.id}>
            {d.values.name} · {d.values.specialty}
            <small>
              {d.values.languages} · {d.values.clinicDays}
            </small>
          </p>
        ))}
        <h3 className="ws-spaced-heading">Reply history</h3>
        {replies.map((q) => (
          <p key={q.id}>
            {data.patients.find((p) => p.id === q.caseId)?.name} ·{" "}
            <Badge>{q.status}</Badge>
            <small>
              {q.date} ·{" "}
              {q.replyDays ? `${q.replyDays} days to reply` : "Awaiting reply"}{" "}
              {q.price && `· ${q.currency} ${q.price}`}
            </small>
          </p>
        ))}
        {!replies.length && <Empty>No hospital replies recorded.</Empty>}
      </section>
    )
  }
  if (module === "doctors") {
    const treated = data.patients.filter((p) => p.doctor === item.values.name)
    return (
      <section>
        <h3>Treated / assigned patients</h3>
        {treated.map((p) => (
          <p key={p.id}>
            <Link to="/patients/$caseId" params={{ caseId: p.id }}>
              {p.name} · {p.id}
            </Link>
          </p>
        ))}
        {!treated.length && <Empty>No assigned patients recorded.</Empty>}
        <h3 className="ws-spaced-heading">Second opinion request</h3>
        <label className="ws-field">
          <span>Patient case</span>
          <select value={caseId} onChange={(e) => setCaseId(e.target.value)}>
            {data.patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} · {p.need}
              </option>
            ))}
          </select>
        </label>
        <Button
          disabled={
            !can("hospital") ||
            data.quoteRequests.some(
              (q) =>
                q.caseId === caseId &&
                q.doctorId === item.id &&
                q.status === "Awaiting reply"
            )
          }
          onClick={() => {
            if (!can("hospital")) return
            commit("Second opinion request recorded (demo)", (prev) => ({
              ...prev,
              quoteRequests: [
                ...prev.quoteRequests,
                {
                  id: uid("second-opinion"),
                  caseId,
                  hospitalId: item.values.hospital,
                  packageId: "",
                  price: "",
                  currency: "THB",
                  doctorId: item.id,
                  replyDays: "",
                  status: "Awaiting reply",
                  date: today(),
                },
              ],
            }))
          }}
        >
          Record second opinion request (demo)
        </Button>
      </section>
    )
  }
  if (module === "suppliers") {
    const entries = data.ledger.filter((e) => e.supplierId === item.id)
    const bookings = data.collections.ground.filter(
      (b) => b.values.supplier === item.id
    )
    return (
      <section>
        {can("acctView") && (
          <>
            <h3>Supplier balances</h3>
            {["BDT", "THB", "USD"].map((currency) => {
              const s = totals(
                entries.filter(
                  (e) =>
                    data.patients.find((p) => p.id === e.caseId)?.currency ===
                    currency
                )
              )
              return (
                <div className="ws-summary-row" key={currency}>
                  <span>{currency} · cost / paid / outstanding</span>
                  <strong>
                    {(s.cost / 100).toFixed(2)} /{" "}
                    {(s.supplierPaid / 100).toFixed(2)} /{" "}
                    {(s.supplierDue / 100).toFixed(2)}
                  </strong>
                </div>
              )
            })}
          </>
        )}
        <h3 className="ws-spaced-heading">Linked service bookings</h3>
        {bookings.map((b) => (
          <p key={b.id}>
            {b.values.name} · {b.values.date} <Badge>{b.values.status}</Badge>
            <small>
              {data.patients.find((p) => p.id === b.values.caseId)?.name}
            </small>
          </p>
        ))}
        {!bookings.length && <Empty>No linked bookings yet.</Empty>}
      </section>
    )
  }
  return null
}
