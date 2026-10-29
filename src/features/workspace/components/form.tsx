import { useForm } from "@tanstack/react-form"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { Values } from "../model"
export type FieldDef = {
  key: string
  label: string
  type?:
    | "text"
    | "email"
    | "tel"
    | "date"
    | "time"
    | "datetime-local"
    | "number"
    | "textarea"
    | "select"
    | "password"
  required?: boolean
  options?: { value: string; label: string }[]
  placeholder?: string
  min?: number
  step?: string
  full?: boolean
}
export function RecordForm({
  fields,
  initial = {},
  onSave,
  onCancel,
  submitLabel = "Save changes",
  children,
  preview,
}: {
  fields: FieldDef[]
  initial?: Values
  onSave: (values: Values) => void | Promise<void>
  onCancel?: () => void
  submitLabel?: string
  children?: React.ReactNode
  preview?: (values: Values) => React.ReactNode
}) {
  const { t } = useTranslation()
  const [error, setError] = useState(""),
    [pending, setPending] = useState(false)
  const defaults = Object.fromEntries(
    fields.map((f) => [
      f.key,
      initial[f.key] ??
        (f.type === "select" ? (f.options?.[0]?.value ?? "") : ""),
    ])
  )
  const form = useForm({
    defaultValues: defaults,
    validators: { onSubmit: z.record(z.string(), z.string()) },
    onSubmit: async ({ value }) => {
      setError("")
      const clean = Object.fromEntries(
        Object.entries(value).map(([k, v]) => [k, v.trim()])
      )
      if (fields.some((f) => f.required && !clean[f.key])) {
        setError("Complete all required fields.")
        return
      }
      try {
        setPending(true)
        await onSave(clean)
      } catch (e) {
        setError(e instanceof Error ? e.message : "Please check the form.")
      } finally {
        setPending(false)
      }
    },
  })
  return (
    <form
      className="ws-form"
      onSubmit={(e) => {
        e.preventDefault()
        void form.handleSubmit()
      }}
    >
      <div className="ws-form-grid">
        {fields.map((f) => (
          <form.Field key={f.key} name={f.key}>
            {(field) => (
              <label className={`ws-field ${f.full ? "ws-full" : ""}`}>
                <span>
                  {t(f.label)}
                  {f.required && " *"}
                </span>
                {f.type === "select" ? (
                  <select
                    name={field.name}
                    required={f.required}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  >
                    {f.options?.map((o) => (
                      <option key={o.value} value={o.value}>
                        {t(o.label)}
                      </option>
                    ))}
                  </select>
                ) : f.type === "textarea" ? (
                  <textarea
                    name={field.name}
                    required={f.required}
                    rows={3}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder={f.placeholder}
                  />
                ) : (
                  <Input
                    name={field.name}
                    required={f.required}
                    type={f.type || "text"}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder={f.placeholder}
                    min={f.min}
                    step={f.step || (f.type === "number" ? "any" : undefined)}
                  />
                )}
              </label>
            )}
          </form.Field>
        ))}
      </div>
      {preview && (
        <form.Subscribe selector={(state) => state.values}>
          {(values) => preview(values)}
        </form.Subscribe>
      )}
      {children}
      {error && (
        <p className="ws-error" role="alert">
          {error}
        </p>
      )}
      <footer className="ws-form-footer">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            {t("Cancel")}
          </Button>
        )}
        <Button disabled={pending} type="submit">
          {pending ? t("Saving…") : t(submitLabel)}
        </Button>
      </footer>
    </form>
  )
}
