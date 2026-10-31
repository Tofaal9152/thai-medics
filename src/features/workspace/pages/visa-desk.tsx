import { useLocation, useNavigate } from "@tanstack/react-router"
import DirectoryPage from "../components/directory-page"
import AmbulanceWorkspace from "../components/ambulance-workspace"
export default function VisaDeskPage() {
  const location = useLocation(),
    navigate = useNavigate()
  const search = new URLSearchParams(location.searchStr),
    ambulance = search.get("tab") === "ambulance",
    caseId = search.get("caseId") || ""
  return (
    <div>
      <nav className="ws-desk-tabs" aria-label="Medical visa desk sections">
        <button
          aria-pressed={!ambulance}
          onClick={() =>
            void navigate({
              to: "/workspace/$module",
              params: { module: "visas" },
              search: {},
            })
          }
        >
          Visa records
        </button>
        <button
          aria-pressed={ambulance}
          onClick={() =>
            void navigate({
              to: "/workspace/$module",
              params: { module: "visas" },
              search: { tab: "ambulance", ...(caseId ? { caseId } : {}) },
            })
          }
        >
          Emergency Air Ambulance
        </button>
      </nav>
      {ambulance ? (
        <AmbulanceWorkspace key={caseId} initialCaseId={caseId} />
      ) : (
        <DirectoryPage module="visas" />
      )}
    </div>
  )
}
