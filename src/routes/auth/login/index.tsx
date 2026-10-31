import { createFileRoute, Link } from "@tanstack/react-router"
import { useForm } from "@tanstack/react-form"
import { z } from "zod"
import { toast } from "@/components/ui/toast"

import { Button } from "@/components/ui/button"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useMutationHandler } from "@/hooks/use-mutation-handler"
import { loginFn } from "@/features/auth/api"
import { authStore } from "@/features/auth/store/auth-store"
import { loginRequestSchema } from "@/features/auth/schema"

export const Route = createFileRoute("/auth/login/")({
  // Set by the _authed guard: the page the user was trying to open. It is
  // validated again (same-site only) before anything navigates to it.
  validateSearch: z.object({ redirect: z.string().optional() }),
  component: Login,
})

const errorMessages: Record<string, string> = {
  INVALID_REGISTRATION_NUMBER_OR_EMAIL:
    "No account found with that email or registration number.",
  INVALID_CREDENTIALS: "Incorrect password.",
}

function Login() {
  const mutation = useMutationHandler({
    debugLabel: "Login",
    showSuccessToast: false,
    showErrorToast: false,
    mutationFn: (data: { email_reg: string; password: string }) =>
      loginFn({ data }),
    onSuccess: (result) => {
      if (!result.success) {
        toast.add({
          title: errorMessages[result.status] ?? result.message,
          type: "error",
        })
        return
      }

      if (result.status === "NOT_VERIFIED") {
        toast.add({
          title:
            "Your account isn't verified yet — check your phone for the OTP.",
          type: "warning",
        })
        return
      }

      // No navigate() here: the store change re-runs the /auth guard, which sends
      // the user to ?redirect= or their role's home. One place decides where.
      authStore.setAuthenticated({
        access: result.access,
        user: result.user,
        role: result.role,
      })
      toast.add({ title: "Logged in successfully", type: "success" })
    },
  })

  const form = useForm({
    defaultValues: {
      email_reg: "",
      password: "",
    },
    validators: {
      onSubmit: loginRequestSchema,
    },
    onSubmit: async ({ value }) => {
      await mutation.mutateAsync(value)
    },
  })

  return (
    <div className="flex min-h-svh items-center justify-center p-8">
      <form
        className="flex w-full max-w-sm flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault()
          form.handleSubmit()
        }}
      >
        <h1 className="text-2xl font-bold">Log in</h1>

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
                    placeholder="Enter your email or registration number"
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

          <form.Field
            name="password"
            children={(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>Password</FieldLabel>
                  <Input
                    placeholder="Enter your password"
                    id={field.name}
                    name={field.name}
                    type="password"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    aria-invalid={isInvalid}
                    autoComplete="current-password"
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              )
            }}
          />
        </FieldGroup>

        <Link
          to="/auth/forgot-password"
          className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
        >
          Forgot password?
        </Link>

        <form.Subscribe selector={(state) => state.isSubmitting}>
          {(isSubmitting) => (
            <Button type="submit" disabled={isSubmitting || mutation.isPending}>
              {isSubmitting || mutation.isPending ? "Logging in…" : "Log in"}
            </Button>
          )}
        </form.Subscribe>
      </form>
    </div>
  )
}
