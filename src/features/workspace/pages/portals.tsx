import { useState } from "react"
import { Link, useNavigate } from "@tanstack/react-router"
import { Cross, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { stages, today } from "@/features/dashboard/data"
import { useWorkspace } from "../context"
import type { DemoSession, Role, Values } from "../model"
import { uid } from "../model"
import { agentCommissions, statementPaidKey } from "../commissions"
import { displayMoney } from "../billing"
import { exportExcel } from "../export"
import BillingWorkspace from "../components/billing-workspace"
import CaseFiles from "../components/case-files"
import { RecordForm } from "../components/form"
import { choices } from "../form-options"
import { Badge, Empty, Metric, PageHeader, Panel } from "../components/ui"
export function PortalFrame({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  const { session, setSession } = useWorkspace()
  return (
    <div className="ws-portal">
      <header className="ws-portal-header">
        <Link to="/" className="ws-brand">
          <span>
            <Cross size={22} />
          </span>
          <div>
            Thai<span>Medics</span>
            <small>{title}</small>
          </div>
        </Link>
        <div className="ws-actions">
          <Link to="/login" className="ws-inline-link">
            Switch user
          </Link>
          {session.authenticated && (
            <Button
              variant="outline"
              onClick={() =>
                setSession((s) => ({ ...s, authenticated: false }))
              }
            >
              Sign out
            </Button>
          )}
        </div>
      </header>
      <main>{children}</main>
      <footer className="ws-portal-footer">
        Fictional frontend demonstration · No live authentication, medical
        advice or payment processing.
      </footer>
    </div>
  )
}
export default function LoginPage({
  initialMode = "Staff",
}: {
  initialMode?: string
}) {
  const { data, setSession, commit } = useWorkspace(),
    navigate = useNavigate()
  const [mode, setMode] = useState(initialMode),
    [pending, setPending] = useState<DemoSession | null>(null)
  function finish(session: DemoSession) {
    setSession(session)
    void navigate({
      to:
        session.role === "Patient"
          ? "/patient-portal"
          : session.role === "Agent"
            ? "/agent-portal"
            : "/",
    })
  }
  function request(v: Values) {
    let candidate: DemoSession
    if (mode === "Staff" || mode === "Invitation") {
      const staff = data.collections.staff.find((s) => s.id === v.staffId)
      if (!staff) throw new Error("Choose a staff member.")
      if (staff.values.status === "Inactive")
        throw new Error("This account is inactive.")
      if (mode === "Staff" && staff.values.status === "Invited")
        throw new Error("Accept the invitation first.")
      if (mode === "Invitation") {
        if (staff.values.status !== "Invited")
          throw new Error("Choose a pending invitation.")
        commit("invitation accepted", (prev) => ({
          ...prev,
          collections: {
            ...prev.collections,
            staff: prev.collections.staff.map((s) =>
              s.id === staff.id
                ? { ...s, values: { ...s.values, status: "Active" } }
                : s
            ),
          },
        }))
      }
      candidate = {
        authenticated: true,
        role: staff.values.role as Role,
        name: staff.values.name,
        office: staff.values.office,
        staffId: staff.id,
        caseId: "",
        agentId: "",
      }
    } else if (mode === "Patient") {
      const patient = data.patients.find((p) => p.id === v.caseId)
      if (
        !patient ||
        patient.phone.replace(/\D/g, "") !== v.phone.replace(/\D/g, "")
      )
        throw new Error("Enter the selected fictional patient’s phone number.")
      candidate = {
        authenticated: true,
        role: "Patient",
        name:
          v.relationship === "Family representative"
            ? `Family of ${patient.name}`
            : patient.name,
        office: "Patient access",
        staffId: "",
        caseId: patient.id,
        agentId: "",
      }
    } else {
      const agent = data.collections.agents.find(
        (a) => a.id === v.agentId && a.values.status === "Active"
      )
      if (!agent) throw new Error("Choose an active agent.")
      if (agent.values.email.toLowerCase() !== v.email.toLowerCase())
        throw new Error("Use the selected fictional agent’s email.")
      candidate = {
        authenticated: true,
        role: "Agent",
        name: agent.values.name,
        office: agent.values.district,
        staffId: "",
        caseId: "",
        agentId: agent.id,
      }
    }
    setPending(candidate)
  }
  const staffOptions = data.collections.staff
    .filter((s) => mode !== "Invitation" || s.values.status === "Invited")
    .map((s) => ({
      value: s.id,
      label: `${s.values.name} · ${s.values.role} · ${s.values.status}`,
    }))
  const patient = data.patients[0],
    agent = data.collections.agents[0]
  return (
    <PortalFrame title="account access">
      <section className="ws-login-wrap">
        <div className="ws-login-story">
          <span>
            <ShieldCheck size={28} />
          </span>
          <h1>
            One shared desk.
            <br />A connected care journey.
          </h1>
          <p>
            Choose a fictional persona to explore the staff workspace, patient
            portal or agent network.
          </p>
          <ul>
            <li>Bangladesh & Thailand coordination</li>
            <li>Case progress, documents and appointments</li>
            <li>Patient accounts and referral statements</li>
          </ul>
          <Badge tone="amber">Verification codes are shown on screen</Badge>
        </div>
        <div className="ws-login-card">
          <h2>{pending ? "Verify access" : "Welcome to Thai Medical Desk"}</h2>
          <p>
            {pending
              ? "Enter 123456. No SMS or email is sent."
              : "Select an account type. These are simulated sign-in screens."}
          </p>
          {!pending ? (
            <>
              <div className="ws-segmented">
                {["Staff", "Patient", "Agent", "Invitation"].map((label) => (
                  <button
                    key={label}
                    aria-pressed={mode === label}
                    onClick={() => setMode(label)}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <RecordForm
                key={mode}
                fields={
                  mode === "Staff" || mode === "Invitation"
                    ? [
                        {
                          key: "staffId",
                          label:
                            mode === "Invitation"
                              ? "Pending invitation"
                              : "staff member",
                          type: "select",
                          required: true,
                          options: staffOptions,
                        },
                        ...(mode === "Staff"
                          ? [
                              {
                                key: "password",
                                label: "password (use any text)",
                                type: "password" as const,
                                required: true,
                              },
                            ]
                          : []),
                      ]
                    : mode === "Patient"
                      ? [
                          {
                            key: "caseId",
                            label: "Fictional patient case",
                            type: "select",
                            required: true,
                            options: data.patients.map((p) => ({
                              value: p.id,
                              label: `${p.name} · ${p.phone}`,
                            })),
                          },
                          {
                            key: "phone",
                            label: "Patient phone number",
                            type: "tel",
                            required: true,
                          },
                          {
                            key: "relationship",
                            label: "Access as",
                            type: "select",
                            options: choices(
                              "Patient",
                              "Family representative"
                            ),
                          },
                        ]
                      : [
                          {
                            key: "agentId",
                            label: "agent",
                            type: "select",
                            required: true,
                            options: data.collections.agents
                              .filter((a) => a.values.status === "Active")
                              .map((a) => ({
                                value: a.id,
                                label: `${a.values.name} · ${a.values.email}`,
                              })),
                          },
                          {
                            key: "email",
                            label: "Agent email",
                            type: "email",
                            required: true,
                          },
                        ]
                }
                initial={{
                  staffId: "staff-1",
                  password: "demo-only",
                  caseId: patient?.id || "",
                  phone: patient?.phone || "",
                  agentId: agent?.id || "",
                  email: agent?.values.email || "",
                }}
                onSave={request}
                submitLabel={
                  mode === "Invitation"
                    ? "Accept invitation"
                    : "Continue to verification"
                }
              />
              {mode === "Patient" && (
                <div className="ws-login-access-note">
                  <ShieldCheck size={17} aria-hidden="true" />
                  <p>
                    Family access is for demonstration only. Real access
                    requires the patient’s authorisation.
                  </p>
                </div>
              )}
            </>
          ) : (
            <>
              <Badge tone="green">verification code: 123456</Badge>
              <RecordForm
                fields={[
                  {
                    key: "code",
                    label:
                      mode === "Staff"
                        ? "Two-factor code"
                        : "Phone / email code",
                    required: true,
                  },
                ]}
                onSave={(v) => {
                  if (v.code !== "123456")
                    throw new Error("Use the code 123456.")
                  finish(pending)
                }}
                submitLabel="Verify and open workspace"
              />
              <Button variant="ghost" onClick={() => setPending(null)}>
                Back to account selection
              </Button>
            </>
          )}
          <div className="ws-login-links">
            <Link to="/inquiry">
              <span>New patient?</span>
              <strong>
                Make an inquiry <span aria-hidden="true">→</span>
              </strong>
            </Link>
            <Link to="/agent-registration">
              <span>Become an agent?</span>
              <strong>
                Register here <span aria-hidden="true">→</span>
              </strong>
            </Link>
          </div>
        </div>
      </section>
    </PortalFrame>
  )
}
export function PatientPortal() {
  const { data, session, commit } = useWorkspace(),
    [tab, setTab] = useState("progress")
  if (!session.authenticated || session.role !== "Patient")
    return <LoginPage initialMode="Patient" />
  const p = data.patients.find((p) => p.id === session.caseId)
  if (!p)
    return (
      <PortalFrame title="Patient & family portal">
        <Empty>
          Your case is not available. Please choose a patient again.
        </Empty>
      </PortalFrame>
    )
  const meta = data.caseMeta[p.id],
    visas = data.collections.visas.filter((v) => v.values.caseId === p.id),
    plans = data.collections.aftercare.filter((r) => r.values.caseId === p.id)
  return (
    <PortalFrame title="Patient & family portal">
      <PageHeader
        title={`Hello, ${p.name}`}
        description="Your progress, appointment details and documents, in one place."
      />
      <div className="ws-metrics">
        <Metric
          label="Current stage"
          value={
            meta?.status === "lost" ? "Closed inquiry" : stages[p.stage].name
          }
        />
        <Metric
          label="Appointment"
          value={p.appointment || "Not scheduled"}
          note={p.appointment ? `${p.time} · Bangkok time` : p.hospital}
        />
        <Metric
          label="Your balance"
          value={displayMoney(
            Math.round((p.billed - p.paid) * 100),
            p.currency
          )}
          note="patient account"
        />
      </div>
      <nav className="ws-case-tabs" aria-label="Patient portal sections">
        {[
          ["progress", "My journey"],
          ["documents", "My documents"],
          ["billing", "Invoices & payments"],
          ["aftercare", "Aftercare & feedback"],
        ].map(([key, label]) => (
          <button
            key={key}
            aria-pressed={tab === key}
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}
      </nav>
      {tab === "progress" && (
        <>
          <Panel title="Your care journey">
            <div className="ws-case-progress">
              {stages.map((stage, i) => (
                <div className={i <= p.stage ? "reached" : ""} key={stage.name}>
                  <span>{i + 1}</span>
                  <small>{stage.name}</small>
                </div>
              ))}
            </div>
            <div className="ws-detail-grid">
              <div>
                <small>Hospital</small>
                <p>{p.hospital}</p>
              </div>
              <div>
                <small>Doctor</small>
                <p>{p.doctor || "To be confirmed"}</p>
              </div>
              <div>
                <small>Bangladesh coordinator</small>
                <p>{p.coordinator}</p>
              </div>
              <div>
                <small>Thailand coordinator</small>
                <p>{p.thaiCoordinator}</p>
              </div>
            </div>
          </Panel>
          <Panel title="Visa status">
            <div className="ws-linked-records">
              {visas.map((v) => (
                <article key={v.id}>
                  <h3>{v.values.name}</h3>
                  <Badge
                    tone={v.values.status === "Approved" ? "green" : "amber"}
                  >
                    {v.values.status}
                  </Badge>
                  <small>
                    {v.values.relation} ·{" "}
                    {(v.values.checked || "").split("|").filter(Boolean).length}{" "}
                    of 5 documents received
                  </small>
                </article>
              ))}
              {!visas.length && (
                <Empty>
                  Your coordinator has not started a visa record yet.
                </Empty>
              )}
            </div>
          </Panel>
        </>
      )}
      {tab === "documents" && <CaseFiles caseId={p.id} patientView />}
      {tab === "billing" && <BillingWorkspace caseId={p.id} patientView />}
      {tab === "aftercare" && (
        <>
          <Panel title="Follow-up plans">
            <div className="ws-linked-records">
              {plans.map((plan) => (
                <article key={plan.id}>
                  <h3>{plan.values.name}</h3>
                  <p>
                    Next visit: {plan.values.nextVisit || "To be confirmed"}
                  </p>
                  <small>
                    Video follow-up:{" "}
                    {plan.values.consultDate || "Not scheduled"}
                  </small>
                  {/^https?:\/\//i.test(plan.values.consultLink || "") && (
                    <a
                      href={plan.values.consultLink}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Open consultation link ↗
                    </a>
                  )}
                  <small>{plan.values.medicationReminder}</small>
                </article>
              ))}
              {!plans.length && (
                <Empty>
                  Your coordinator will add aftercare when it is arranged.
                </Empty>
              )}
            </div>
          </Panel>
          <Panel title="Share your feedback">
            <RecordForm
              fields={[
                {
                  key: "hospitalRating",
                  label: "Hospital rating (1–5)",
                  type: "select",
                  required: true,
                  options: choices("5", "4", "3", "2", "1"),
                },
                {
                  key: "staffRating",
                  label: "Coordination rating (1–5)",
                  type: "select",
                  required: true,
                  options: choices("5", "4", "3", "2", "1"),
                },
                {
                  key: "review",
                  label: "Your feedback",
                  type: "textarea",
                  required: true,
                  full: true,
                },
              ]}
              onSave={(v) => {
                const current = plans[0]
                commit("Patient feedback recorded", (prev) => ({
                  ...prev,
                  collections: {
                    ...prev.collections,
                    aftercare: current
                      ? prev.collections.aftercare.map((r) =>
                          r.id === current.id
                            ? { ...r, values: { ...r.values, ...v } }
                            : r
                        )
                      : [
                          ...prev.collections.aftercare,
                          {
                            id: uid("feedback"),
                            createdAt: new Date().toISOString(),
                            values: {
                              ...v,
                              name: `Feedback · ${p.name}`,
                              caseId: p.id,
                              status: "In progress",
                              returnDate: today(),
                            },
                          },
                        ],
                  },
                }))
              }}
              submitLabel="Save feedback"
            />
          </Panel>
        </>
      )}
    </PortalFrame>
  )
}
export function AgentPortal() {
  const { data, session, commit, createCase } = useWorkspace(),
    [adding, setAdding] = useState(false),
    [statementMonth, setStatementMonth] = useState(today().slice(0, 7))
  if (!session.authenticated || session.role !== "Agent")
    return <LoginPage initialMode="Agent" />
  const agent = data.collections.agents.find((a) => a.id === session.agentId)
  if (!agent || agent.values.status !== "Active")
    return (
      <PortalFrame title="Agent portal">
        <Empty>
          This agent account is pending approval or inactive. Please contact the
          desk.
        </Empty>
      </PortalFrame>
    )
  const cases = data.patients.filter(
      (p) => data.caseMeta[p.id]?.agentId === agent.id
    ),
    commissions = agentCommissions(data, agent.id, statementMonth)
  return (
    <PortalFrame title="Agent portal">
      <PageHeader
        title={agent.values.name}
        description="Only your own referrals, case progress and commission statements."
        action="Refer a new patient"
        onAction={() => setAdding(!adding)}
      />
      <div className="ws-metrics">
        <Metric label="Your referrals" value={cases.length} />
        <Metric
          label="Active cases"
          value={
            cases.filter(
              (p) => p.stage < 8 && data.caseMeta[p.id]?.status !== "lost"
            ).length
          }
        />
        <Metric
          label="Completed"
          value={cases.filter((p) => p.stage === 8).length}
        />
      </div>
      {adding && (
        <Panel title="Submit a patient lead">
          <RecordForm
            fields={[
              { key: "name", label: "Patient name", required: true },
              {
                key: "phone",
                label: "Patient phone",
                type: "tel",
                required: true,
              },
              { key: "city", label: "City / district" },
              {
                key: "need",
                label: "Medical need, as stated by patient",
                type: "textarea",
                required: true,
                full: true,
              },
            ]}
            onSave={(v) => {
              if (
                data.patients.some(
                  (p) =>
                    p.phone.replace(/\D/g, "") === v.phone.replace(/\D/g, "")
                )
              )
                throw new Error(
                  "A case already uses this phone number. Please contact the desk for referral review."
                )
              const p = createCase({
                ...v,
                source: "Agent",
                agentId: agent.id,
                office: "Bangladesh",
              })
              commit("Agent referral submitted", (prev) => ({
                ...prev,
                collections: {
                  ...prev.collections,
                  leads: [
                    {
                      id: uid("referral"),
                      createdAt: new Date().toISOString(),
                      values: {
                        ...v,
                        name: v.name,
                        source: "Agent",
                        agentId: agent.id,
                        caseId: p.id,
                        status: "Qualified",
                        coordinator: p.coordinator,
                      },
                    },
                    ...prev.collections.leads,
                  ],
                },
              }))
              setAdding(false)
            }}
            onCancel={() => setAdding(false)}
            submitLabel="Submit referral"
          />
        </Panel>
      )}
      <Panel title="Your patient referrals">
        <div className="data-table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Case ID</th>
                <th>Current stage</th>
                <th>Hospital</th>
              </tr>
            </thead>
            <tbody>
              {cases.map((p) => (
                <tr key={p.id}>
                  <td>{p.name}</td>
                  <td>{p.id}</td>
                  <td>
                    <Badge tone={p.stage === 8 ? "green" : "blue"}>
                      {data.caseMeta[p.id]?.status === "lost"
                        ? "Closed inquiry"
                        : stages[p.stage].name}
                    </Badge>
                  </td>
                  <td>{p.hospital}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!cases.length && <Empty>You have no linked referrals yet.</Empty>}
      </Panel>
      <Panel
        title="Commission statements"
        subtitle={`Agreement: ${agent.values.commissionType} · earned when ${agent.values.trigger?.toLowerCase()}. Statements use invoice month.`}
      >
        <label className="ws-field">
          <span>Statement month</span>
          <input
            type="month"
            value={statementMonth}
            onChange={(e) => setStatementMonth(e.target.value)}
          />
        </label>
        <div className="ws-linked-records">
          {["BDT", "THB", "USD"].map((currency) => {
            const earned = commissions[currency] || 0,
              paid = Number(
                agent.values[statementPaidKey(currency, statementMonth)] || 0
              )
            return (
              <article key={currency}>
                <h3>{currency}</h3>
                <p>Earned: {earned.toFixed(2)}</p>
                <p>Paid: {paid.toFixed(2)}</p>
                <p>Pending: {Math.max(0, earned - paid).toFixed(2)}</p>
                <Button
                  variant="outline"
                  onClick={() =>
                    exportExcel(`agent-statement-${currency}`, [
                      [
                        "Agent",
                        "Month",
                        "Currency",
                        "Earned",
                        "Paid",
                        "Pending",
                      ],
                      [
                        agent.values.name,
                        statementMonth,
                        currency,
                        earned,
                        paid,
                        Math.max(0, earned - paid),
                      ],
                    ])
                  }
                >
                  Download monthly statement
                </Button>
              </article>
            )
          })}
        </div>
      </Panel>
    </PortalFrame>
  )
}
export function InquiryPage() {
  const { data, createCase, commit } = useWorkspace(),
    [submitted, setSubmitted] = useState("")
  function submit(v: Values) {
    const duplicate = data.patients.find(
      (p) => p.phone.replace(/\D/g, "") === v.phone.replace(/\D/g, "")
    )
    if (duplicate) {
      commit("Website inquiry linked to an existing patient case", (prev) => ({
        ...prev,
        collections: {
          ...prev.collections,
          leads: [
            {
              id: uid("inquiry"),
              createdAt: new Date().toISOString(),
              values: {
                ...v,
                status: "New",
                source: "Website",
                caseId: duplicate.id,
              },
            },
            ...prev.collections.leads,
          ],
        },
      }))
      setSubmitted(
        "Your inquiry is linked to an existing case for coordinator review."
      )
      return
    }
    const p = createCase({ ...v, source: "Website" })
    commit("Website inquiry received", (prev) => ({
      ...prev,
      collections: {
        ...prev.collections,
        leads: [
          {
            id: uid("inquiry"),
            createdAt: new Date().toISOString(),
            values: {
              ...v,
              status: "Qualified",
              source: "Website",
              caseId: p.id,
              coordinator: p.coordinator,
            },
          },
          ...prev.collections.leads,
        ],
      },
    }))
    setSubmitted(`Your inquiry has been recorded. Reference: ${p.id}`)
  }
  return (
    <PortalFrame title="Patient inquiry">
      <section className="ws-inquiry-layout">
        <div>
          <Badge tone="rose">BANGLADESH ↔ THAILAND</Badge>
          <h1>Let’s plan your next step in care.</h1>
          <p>
            Share your contact details and the help you are looking for. Our
            desk coordinates medical reports, hospital appointments and travel
            support.
          </p>
          <div className="ws-inquiry-points">
            <p>Hospital and specialist coordination</p>
            <p>Visa, travel and ground assistance</p>
            <p>Bangla and English support</p>
          </div>
          <small>
            form: use fictional information only. This website does not provide
            diagnoses or treatment recommendations.
          </small>
        </div>
        <Panel
          title={submitted ? "Inquiry received" : "Tell us how we can help"}
        >
          {submitted ? (
            <div className="ws-detail-body">
              <Badge tone="green">Saved in this browser</Badge>
              <p>{submitted}</p>
              <Button variant="outline" onClick={() => setSubmitted("")}>
                Make another inquiry
              </Button>
              <Link to="/patient-portal" className="ws-inline-link">
                Open patient portal →
              </Link>
            </div>
          ) : (
            <RecordForm
              fields={[
                { key: "name", label: "Patient name", required: true },
                {
                  key: "phone",
                  label: "Phone / WhatsApp",
                  type: "tel",
                  required: true,
                },
                { key: "email", label: "Email", type: "email" },
                { key: "city", label: "City / district" },
                {
                  key: "need",
                  label: "Medical need, as stated by patient / family",
                  type: "textarea",
                  required: true,
                  full: true,
                },
              ]}
              onSave={submit}
              submitLabel="Submit inquiry"
            />
          )}
        </Panel>
      </section>
    </PortalFrame>
  )
}
