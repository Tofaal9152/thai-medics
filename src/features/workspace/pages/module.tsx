import VisaDeskPage from "./visa-desk"
import PromotionsPage from "./promotions"
import { featureFlags } from "../feature-flags"
import DirectoryPage from "../components/directory-page"
import { modules } from "../seed"
import type { ModuleKey } from "../model"
import PatientsPage from "./patients"
import {
  AccountsPage,
  AuditPage,
  CalendarPage,
  ReportsPage,
  SettingsPage,
} from "./operations"
import { Empty } from "../components/ui"
export default function ModulePage({ module }: { module: string }) {
  if (module === "suppliers" && !featureFlags.suppliers)
    return (
      <div className="workspace-page">
        <Empty>This section is currently on hold.</Empty>
      </div>
    )
  if (module === "promotions") return <PromotionsPage />
  if (module === "visas") return <VisaDeskPage />
  if (module === "patients") return <PatientsPage />
  if (module === "calendar") return <CalendarPage />
  if (module === "accounts") return <AccountsPage />
  if (module === "reports") return <ReportsPage />
  if (module === "audit") return <AuditPage />
  if (module === "settings") return <SettingsPage />
  if (modules.includes(module as ModuleKey))
    return <DirectoryPage key={module} module={module as ModuleKey} />
  return (
    <div className="workspace-page">
      <Empty>
        This module does not exist. Choose a section from the navigation.
      </Empty>
    </div>
  )
}
