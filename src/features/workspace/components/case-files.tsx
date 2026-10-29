import { useEffect, useState } from "react"
import { Download, FileText, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/toast"
import { today } from "@/features/dashboard/data"
import { useWorkspace } from "../context"
import { openFile, readFile, saveFile } from "../files"
import type { RecordFile } from "../model"
import { uid } from "../model"
import { Badge, Empty, Modal, Panel } from "./ui"
export default function CaseFiles({
  caseId,
  patientView = false,
}: {
  caseId: string
  patientView?: boolean
}) {
  const { data, commit, can, session } = useWorkspace()
  const [category, setCategory] = useState("Medical report"),
    [date, setDate] = useState(today()),
    [busy, setBusy] = useState(false),
    [viewer, setViewer] = useState<{
      file: RecordFile
      url: string | null
    } | null>(null)
  const files = data.files
    .filter((f) => f.caseId === caseId)
    .sort((a, b) => b.date.localeCompare(a.date))
  useEffect(
    () => () => {
      if (viewer?.url) URL.revokeObjectURL(viewer.url)
    },
    [viewer]
  )
  async function upload(selected: FileList | null) {
    if (!selected?.length) return
    const list = Array.from(selected)
    if (
      list.some(
        (file) =>
          !/^.+\.(pdf|jpe?g|png)$/i.test(file.name) ||
          !["application/pdf", "image/jpeg", "image/png"].includes(file.type) ||
          file.size > 10 * 1024 * 1024
      )
    ) {
      toast.add({
        title: "Only PDF, JPG or PNG files up to 10 MB each are allowed.",
        type: "error",
      })
      return
    }
    setBusy(true)
    try {
      const records: RecordFile[] = []
      for (const file of list) {
        const id = uid("file")
        await saveFile(id, file)
        records.push({
          id,
          caseId,
          name: file.name,
          category,
          date,
          by: patientView
            ? data.patients.find((p) => p.id === caseId)?.name || "Patient"
            : session.name,
          size: file.size,
          mime: file.type,
          demo: false,
        })
      }
      commit(
        `Saved ${records.length} fictional document(s) in this browser`,
        (prev) => ({ ...prev, files: [...prev.files, ...records] }),
        "document"
      )
    } catch (error) {
      toast.add({
        title: error instanceof Error ? error.message : "File upload failed",
        type: "error",
      })
    } finally {
      setBusy(false)
    }
  }
  async function view(file: RecordFile) {
    try {
      const blob = file.demo ? null : await readFile(file.id)
      setViewer({ file, url: blob ? URL.createObjectURL(blob) : null })
    } catch (error) {
      toast.add({
        title: error instanceof Error ? error.message : "File not available",
        type: "error",
      })
    }
  }
  return (
    <Panel
      title="Medical & travel records"
      subtitle="Fictional PDF, JPG and PNG files only. Files are stored locally in this browser."
    >
      {(patientView || can("docsUpload")) && (
        <div className="ws-upload-bar">
          <label className="ws-field">
            <span>Category</span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {[
                "Medical report",
                "Prescription",
                "Hospital quotation",
                "Treatment plan",
                "Passport copy",
                "Visa letter",
                "Travel document",
                "Other",
              ].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label className="ws-field">
            <span>Document date</span>
            <input
              type="date"
              value={date}
              required
              onChange={(e) => e.target.value && setDate(e.target.value)}
            />
          </label>
          <label className={`ws-upload-button ${busy ? "ws-disabled" : ""}`}>
            <Upload size={15} />
            {busy ? "Saving…" : "Upload documents"}
            <input
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png"
              disabled={busy}
              onChange={(e) => {
                void upload(e.target.files)
                e.target.value = ""
              }}
            />
          </label>
        </div>
      )}
      {!files.length && <Empty>No documents attached yet.</Empty>}
      <div className="ws-file-list">
        {files.map((file) => (
          <div key={file.id}>
            <span className="ws-file-icon">
              <FileText size={21} />
            </span>
            <div>
              <strong>{file.name}</strong>
              <small>
                {file.date} · {file.category} · {(file.size / 1024).toFixed(0)}{" "}
                KB
              </small>
              <small>Uploaded by {file.by}</small>
            </div>
            {file.demo && <Badge>Sample</Badge>}
            {(patientView || can("docsView")) && (
              <div className="ws-inline-actions">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void view(file)}
                >
                  View
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Download ${file.name}`}
                  onClick={() => {
                    if (file.demo) {
                      toast.add({
                        title:
                          "Sample metadata only. Upload a fictional file to try downloads.",
                        type: "info",
                      })
                      return
                    }
                    void openFile(file.id, file.name, true).catch((e) =>
                      toast.add({ title: e.message, type: "error" })
                    )
                  }}
                >
                  <Download size={15} />
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
      {viewer && (
        <Modal title={viewer.file.name} onClose={() => setViewer(null)} wide>
          <div className="ws-file-preview">
            {viewer.url ? (
              viewer.file.mime === "application/pdf" ? (
                <iframe title={viewer.file.name} src={viewer.url} />
              ) : (
                <img src={viewer.url} alt={viewer.file.name} />
              )
            ) : (
              <div className="ws-sample-document">
                <h2>Sample document record</h2>
                <p>
                  This fictional record demonstrates the file list and
                  categorisation. No clinical document is attached.
                </p>
                <p>
                  Upload a fictional PDF or image to test persistent viewing and
                  downloading.
                </p>
              </div>
            )}
          </div>
        </Modal>
      )}
    </Panel>
  )
}
