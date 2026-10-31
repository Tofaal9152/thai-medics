import { useState } from "react"
import { createFileRoute, Link } from "@tanstack/react-router"
import { useForm } from "@tanstack/react-form"

import { Button } from "@/components/ui/button"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useMutationHandler } from "@/hooks/use-mutation-handler"
import { requestPasswordResetFn } from "@/features/auth/api"
import { forgotPasswordRequestSchema } from "@/features/auth/schema"

export const Route = createFileRoute("/auth/forgot-password/")({
  component: ForgotPassword,
})

function ForgotPassword() {
  const [submitted, setSubmitted] = useState(false)

  const mutation = useMutationHandler({
    debugLabel: "RequestPasswordReset",
    showSuccessToast: false,
    showErrorToast: true,
    errorMessage: "Something went wrong. Please try again.",
    mutationFn: (data: { email_reg: string }) =>
      requestPasswordResetFn({ data }),
    onSuccess: () => setSubmitted(true),
  })

  const form = useForm({
    defaultValues: { email_reg: "" },
    validators: { onSubmit: forgotPasswordRequestSchema },
    onSubmit: async ({ value }) => {
      await mutation.mutateAsync(value)
    },
  })

  if (submitted) {
    return (
      <div className="flex min-h-svh items-center justify-center p-8">
        <div className="flex w-full max-w-sm flex-col gap-4 text-center">
          <h1 className="text-2xl font-bold">Check your email</h1>
          <p className="text-sm text-muted-foreground">
            If an account exists for that email or registration number, we've
            sent a password reset link to it.
          </p>
          <Button render={<Link to="/auth/login">Back to log in</Link>} />
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
        <div>
          <h1 className="text-2xl font-bold">Forgot password</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Enter your email or registration number and we'll send you a reset
            link.
          </p>
        </div>

        <FieldGroup>
          <form.Field
            name="email_reg"
            children={(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>
                    Email or registration number
                  </FieldLabel>
                  <Input
                    placeholder="Enter your email address"
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    aria-invalid={isInvalid}
                    autoComplete="username"
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              )
            }}
          />
        </FieldGroup>

        <form.Subscribe selector={(state) => state.isSubmitting}>
          {(isSubmitting) => (
            <Button type="submit" disabled={isSubmitting || mutation.isPending}>
              {isSubmitting || mutation.isPending
                ? "Sending…"
                : "Send reset link"}
            </Button>
          )}
        </form.Subscribe>

        <Button
          variant="ghost"
          render={<Link to="/auth/login">Back to log in</Link>}
        />
      </form>
    </div>
  )
}
