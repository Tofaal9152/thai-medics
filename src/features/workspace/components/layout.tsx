import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { featureFlags } from "../feature-flags"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { Link, useLocation, useNavigate } from "@tanstack/react-router"
import {
  Activity,
  BookOpen,
  Building2,
  CalendarDays,
  Cross,
  FileCheck2,
  Globe2,
  HeartHandshake,
  LayoutDashboard,
  LogOut,
  Menu,
  Mail,
  MessageSquare,
  Package,
  Plane,
  UserRound,
  Shield,
  Stethoscope,
  Truck,
  Users,
  Wallet,
  X,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"
import { useWorkspace } from "../context"
import type { ModuleKey } from "../model"
import { modulePermission } from "../model"
import "../workspace.css"
import "@/features/dashboard/dashboard.css"
import "../select-controls.css"
const links: { key: string; label: string; icon: LucideIcon; group: string }[] =
  [
    {
      key: "overview",
      label: "Overview",
      icon: LayoutDashboard,
      group: "Workspace",
    },
    {
      key: "patients",
      label: "Patient cases",
      icon: Users,
      group: "Workspace",
    },
    {
      key: "calendar",
      label: "Follow-up calendar",
      icon: CalendarDays,
      group: "Workspace",
    },
    {
      key: "accounts",
      label: "Accounts & billing",
      icon: Wallet,
      group: "Workspace",
    },
    {
      key: "leads",
      label: "Lead & inquiry hub",
      icon: MessageSquare,
      group: "Patient journey",
    },
    {
      key: "visas",
      label: "Medical visa desk",
      icon: FileCheck2,
      group: "Patient journey",
    },
    {
      key: "messages",
      label: "Messaging & reminders",
      icon: MessageSquare,
      group: "Patient journey",
    },
    {
      key: "promotions",
      label: "Newsletter & promotions",
      icon: Mail,
      group: "Patient journey",
    },
    {
      key: "hospitals",
      label: "Hospital directory",
      icon: Building2,
      group: "Partner network",
    },
    {
      key: "doctors",
      label: "Doctor management",
      icon: Stethoscope,
      group: "Partner network",
    },
    {
      key: "agents",
      label: "Agent network",
      icon: HeartHandshake,
      group: "Partner network",
    },
    {
      key: "packages",
      label: "Packages & quotes",
      icon: Package,
      group: "Service delivery",
    },
    {
      key: "suppliers",
      label: "Suppliers & vendors",
      icon: Truck,
      group: "Service delivery",
    },
    {
      key: "ground",
      label: "Thailand ground services",
      icon: Plane,
      group: "Service delivery",
    },
    {
      key: "aftercare",
      label: "Aftercare & feedback",
      icon: HeartHandshake,
      group: "Care & management",
    },
    {
      key: "reports",
      label: "Reports & analytics",
      icon: Activity,
      group: "Care & management",
    },
    {
      key: "staff",
      label: "Staff & permissions",
      icon: Shield,
      group: "Care & management",
    },
    {
      key: "audit",
      label: "Audit history",
      icon: BookOpen,
      group: "Care & management",
    },
    {
      key: "settings",
      label: "System & settings",
      icon: Globe2,
      group: "Care & management",
    },
  ]
export default function WorkspaceLayout({ children }: { children: ReactNode }) {
  const { t } = useTranslation()
  const { data, session, setSession, can } = useWorkspace()
  const location = useLocation()
  const navigate = useNavigate()
  const [mobile, setMobile] = useState(false)
  useEffect(() => {
    const key = location.pathname.split("/").at(-1)
    const title =
      location.pathname === "/"
        ? "Dashboard"
        : links.find((l) => l.key === key)?.label ||
          (location.pathname.startsWith("/patients/")
            ? "Patient case"
            : "Thai Medical Desk")
    document.title = `${title} · Thai Medics`
  }, [location.pathname])
  const portal = [
    "/login",
    "/patient-portal",
    "/agent-portal",
    "/agent-registration",
    "/inquiry",
  ].some((path) => location.pathname.startsWith(path))
  if (portal) return <div className="medical-app ws-standalone">{children}</div>
  const current =
    location.pathname === "/"
      ? "overview"
      : location.pathname.startsWith("/patients/")
        ? "patients"
        : location.pathname.split("/").at(-1) || "overview"
  const allowed = (key: string) => {
    if (key === "promotions") return can("messages")
    if (key === "accounts") return can("acctView")
    if (key === "reports") return can("reports")
    if (key === "audit") return can("audit")
    if (key in modulePermission) return can(modulePermission[key as ModuleKey])
    return true
  }
  const readable =
    session.authenticated &&
    data.collections.staff.some(
      (s) => s.id === session.staffId && s.values.status === "Active"
    ) &&
    session.role !== "Patient" &&
    session.role !== "Agent" &&
    allowed(current)
  const visibleLinks = links.filter(
    (item) =>
      allowed(item.key) && (item.key !== "suppliers" || featureFlags.suppliers)
  )
  return (
    <div className="medical-app ws-app">
      {mobile && (
        <button
          aria-label="Close navigation"
          className="mobile-overlay"
          onClick={() => setMobile(false)}
        />
      )}
      <aside
        className={`app-sidebar ws-sidebar ${mobile ? "sidebar-open" : ""}`}
      >
        <Link to="/" className="ws-brand">
          <span>
            <Cross size={23} />
          </span>
          <div>
            Thai<span>Medics</span>
            <small>MEDICAL DESK</small>
          </div>
        </Link>
        <button
          className="icon-button mobile-close ws-menu-close"
          aria-label="Close menu"
          onClick={() => setMobile(false)}
        >
          <X size={18} />
        </button>
        <nav aria-label="Main navigation">
          {visibleLinks.map(({ key, label, icon: Icon, group }, index) => {
            const heading =
              index === 0 || visibleLinks[index - 1].group !== group
            return (
              <div key={key}>
                {heading && <span className="nav-caption">{t(group)}</span>}
                {key === "overview" ? (
                  <Link
                    to="/"
                    className={`nav-item ${current === key ? "active" : ""}`}
                    onClick={() => setMobile(false)}
                  >
                    <Icon size={17} />
                    <span>{t(label)}</span>
                  </Link>
                ) : (
                  <Link
                    to="/workspace/$module"
                    params={{ module: key }}
                    className={`nav-item ${current === key ? "active" : ""}`}
                    onClick={() => setMobile(false)}
                  >
                    <Icon size={17} />
                    <span>{t(label)}</span>
                    {key === "patients" && (
                      <small>{data.patients.length}</small>
                    )}
                  </Link>
                )}
              </div>
            )
          })}
        </nav>
        <div className="ws-user">
          <span className="user-avatar">
            {session.name
              .split(" ")
              .map((n) => n[0])
              .slice(0, 2)
              .join("")}
          </span>
          <div>
            {session.name}
            <small>{session.role} · access</small>
          </div>
          <button
            className="icon-button"
            aria-label="Sign out"
            onClick={() => {
              setSession((s) => ({ ...s, authenticated: false }))
              void navigate({ to: "/login" })
            }}
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>
      <div className="app-body">
        <header className="app-topbar ws-topbar">
          <div className="breadcrumb">
            <button
              className="icon-button mobile-menu"
              aria-label="Open navigation"
              onClick={() => setMobile(true)}
            >
              <Menu size={20} />
            </button>
            <span>Workspace</span>
            <span>/</span>
            <strong>
              {t(links.find((l) => l.key === current)?.label || "Patient case")}
            </strong>
          </div>
          <div className="ws-toptools">
            <DropdownMenu>
              <DropdownMenuTrigger
                className="ws-profile-trigger"
                aria-label="Open profile menu"
              >
                <UserRound size={20} aria-hidden="true" />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                sideOffset={10}
                className="ws-profile-menu"
              >
                <div className="ws-profile-details">
                  <span className="ws-profile-avatar" aria-hidden="true">
                    {session.name
                      .split(" ")
                      .map((part) => part[0])
                      .slice(0, 2)
                      .join("")}
                  </span>
                  <div>
                    <strong>{session.name}</strong>
                    <span>{session.role}</span>
                    {data.collections.staff.find(
                      (staff) => staff.id === session.staffId
                    )?.values.email && (
                      <small>
                        {
                          data.collections.staff.find(
                            (staff) => staff.id === session.staffId
                          )?.values.email
                        }
                      </small>
                    )}
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    onClick={() => {
                      setSession((current) => ({
                        ...current,
                        authenticated: false,
                      }))
                      void navigate({ to: "/login" })
                    }}
                  >
                    <LogOut size={16} aria-hidden="true" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        {readable ? (
          children
        ) : (
          <div className="workspace-page">
            <h1>
              {session.authenticated
                ? "This workspace is not available for your current role."
                : "You are signed out."}
            </h1>
            <p>Choose a staff persona or open the appropriate portal.</p>
            <Link to="/login" className="ws-inline-link">
              Open sign-in →
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
