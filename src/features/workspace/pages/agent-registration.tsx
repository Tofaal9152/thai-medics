import { useState } from "react"
import { Link } from "@tanstack/react-router"
import { CheckCircle2, HeartHandshake } from "lucide-react"
import { useWorkspace } from "../context"
import { uid } from "../model"
import type { Values } from "../model"
import { registerAgent } from "../agent-registration"
import { RecordForm } from "../components/form"
import { choices } from "../form-options"
import { Badge, Panel } from "../components/ui"
import { PortalFrame } from "./portals"

export default function AgentRegistrationPage() {
  const { data, commit } = useWorkspace()
  const [submitted, setSubmitted] = useState("")
  function submit(values: Values) {
    const id = uid("agent-application"),
      at = new Date().toISOString()
    // Validate before updating state so errors stay next to the form.
    registerAgent(data, values, id, at)
    commit(
      `Public agent application received: ${id}`,
      (prev) => registerAgent(prev, values, id, at),
      "agent-registration"
    )
    setSubmitted(id)
  }
  return (
    <PortalFrame title="Agent registration">
      <section className="ws-login-wrap ws-registration-wrap">
        <div className="ws-login-story">
          <span>
            <HeartHandshake size={28} />
          </span>
          <h1>Become a referral partner.</h1>
          <p>
            Register as an individual agent or partner clinic. Our team will
            review your details before activating your agent account.
          </p>
          <ul>
            <li>Submit your contact and organisation details.</li>
            <li>
              The desk reviews your application and agrees commission terms.
            </li>
            <li>
              Once approved, use the agent portal to refer patients and track
              your referrals.
            </li>
          </ul>
          <Badge>Public registration form</Badge>
        </div>
        <Panel
          title={submitted ? "Application received" : "Register as an agent"}
          subtitle={
            submitted
              ? "Your application is pending approval."
              : "Fields marked * are required. Use fictional information for this frontend."
          }
        >
          {submitted ? (
            <div className="ws-detail-body" role="status">
              <CheckCircle2 size={32} />
              <h2>Thank you for registering</h2>
              <p>
                Your details are saved for review in Agent Network. Registration
                does not activate portal access automatically.
              </p>
              <div className="ws-promotion-preview">
                <strong>Application reference</strong>
                <p>{submitted}</p>
                <Badge tone="amber">Pending approval</Badge>
              </div>
              <p>
                Commission terms and account activation are managed by the desk.
              </p>
              <Link to="/login" className="ws-inline-link">
                Go to sign-in →
              </Link>
            </div>
          ) : (
            <RecordForm
              fields={[
                {
                  key: "name",
                  label: "Full name / contact person",
                  required: true,
                },
                {
                  key: "agentType",
                  label: "Register as",
                  type: "select",
                  required: true,
                  options: choices("Individual agent", "Partner clinic"),
                },
                {
                  key: "organization",
                  label: "Organisation / clinic name (required for clinics)",
                },
                { key: "district", label: "District / city", required: true },
                {
                  key: "phone",
                  label: "Phone / WhatsApp",
                  type: "tel",
                  required: true,
                },
                { key: "email", label: "Email", type: "email", required: true },
                {
                  key: "address",
                  label: "Address",
                  type: "textarea",
                  full: true,
                },
                {
                  key: "notes",
                  label: "Tell us about your referral work (optional)",
                  type: "textarea",
                  full: true,
                },
              ]}
              initial={{ agentType: "Individual agent" }}
              onSave={submit}
              submitLabel="Submit registration"
            >
              <p className="ws-form-hint">
                Already approved?{" "}
                <Link to="/agent-portal" className="ws-inline-link">
                  Open the agent portal →
                </Link>
              </p>
            </RecordForm>
          )}
        </Panel>
      </section>
    </PortalFrame>
  )
}
