import { useState } from "react"
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { useForm } from "@tanstack/react-form"

import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/toast"
import { useMutationHandler } from "@/hooks/use-mutation-handler"
import { confirmPasswordResetFn } from "@/features/auth/api"
import { resetPasswordFormSchema } from "@/features/auth/schema"

export const Route = createFileRoute("/auth/reset-password/$uid/$token")({
  component: ResetPassword,
})

function ResetPassword() {
  const { uid, token } = Route.useParams()
  const navigate = useNavigate()
  const [linkInvalid, setLinkInvalid] = useState(false)
  const [serverErrors, setServerErrors] = useState<Record<string, string[]>>({})

  const mutation = useMutationHandler({
    debugLabel: "ConfirmPasswordReset",
    showSuccessToast: false,
    showErrorToast: true,
    errorMessage: "Something went wrong. Please try again.",
    mutationFn: (data: { new_password1: string; new_password2: string }) =>
      confirmPasswordResetFn({ data: { ...data, uid, token } }),
    onSuccess: (result) => {
      if (!result.success) {
        if (result.errors.uid || result.errors.token) {
          setLinkInvalid(true)
          return
        }
        setServerErrors(result.errors)
        return
      }

      toast.add({ title: "Password reset — please log in", type: "success" })
      navigate({ to: "/auth/login" })
    },
  })

  const form = useForm({
    defaultValues: { new_password1: "", new_password2: "" },
    validators: { onSubmit: resetPasswordFormSchema },
    onSubmit: async ({ value }) => {
      setServerErrors({})
      await mutation.mutateAsync(value)
    },
  })

  if (linkInvalid) {
    return (
      <div className="flex min-h-svh items-center justify-center p-8">
        <div className="flex w-full max-w-sm flex-col gap-4 text-center">
          <h1 className="text-2xl font-bold">Link expired</h1>
          <p className="text-sm text-muted-foreground">
            This password reset link is invalid or has expired. Request a new one.
          </p>
          <Button render={<Link to="/auth/forgot-password">Request a new link</Link>} />
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-svh items-center justify-center p-8">
      <form
        className="flex w-full max-w-sm flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault()
          form.handleSubmit()
        }}
      >
        <h1 className="text-2xl font-bold">Reset password</h1>

        <FieldGroup>
          <form.Field
            name="new_password1"
            children={(field) => {
              const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>New password</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    type="password"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    aria-invalid={isInvalid}
                    autoComplete="new-password"
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                  {serverErrors.new_password1 && (
                    <FieldError>{serverErrors.new_password1[0]}</FieldError>
                  )}
                </Field>
              )
            }}
          />

          <form.Field
            name="new_password2"
            children={(field) => {
              const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>Confirm new password</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    type="password"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    aria-invalid={isInvalid}
                    autoComplete="new-password"
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                  {serverErrors.new_password2 && (
                    <FieldError>{serverErrors.new_password2[0]}</FieldError>
                  )}
                </Field>
              )
            }}
          />
        </FieldGroup>

        {serverErrors.non_field_errors && (
          <p className="text-sm text-destructive">{serverErrors.non_field_errors[0]}</p>
        )}

        <form.Subscribe selector={(state) => state.isSubmitting}>
          {(isSubmitting) => (
            <Button type="submit" disabled={isSubmitting || mutation.isPending}>
              {isSubmitting || mutation.isPending ? "Resetting…" : "Reset password"}
            </Button>
          )}
        </form.Subscribe>
      </form>
    </div>
  )
}
