import { getSubmitFieldErrorsFromMeta } from "@/utils/form-errors";
import { useForm } from "@tanstack/react-form";
import type { FormValidateFn } from "@tanstack/react-form";
import { useMemo, useState } from "react";
import type { ZodSchema } from "zod";

type AnyMutationLike<T> = {
  mutate: (data: T) => void;
  mutateAsync: (data: T, options?: unknown) => Promise<unknown>;
  reset: () => void;
  isPending: boolean;
  isError: boolean;
  isSuccess: boolean;
  error: unknown;
};

export type SubmitErrorItem = {
  field: string; // e.g. "phone_number"
  label?: string; // e.g. "Phone Number"
  message: string; // e.g. "Required"
};

type Options<TValues extends Record<string, unknown>> = {
  defaultValues: TValues;
  schema: ZodSchema<TValues>;
  mutation: AnyMutationLike<TValues>;
  onValidSubmit?: (values: TValues) => void;

  // ✅ optional configuration for reuse
  fieldLabels?:
    | Partial<Record<keyof TValues & string, string>>
    | Record<string, string>;
  formatError?: (item: { field: string; message: string }) => SubmitErrorItem;
  clearErrorsOnChange?: boolean; // default: false
};

export function useZodTanstackForm<TValues extends Record<string, unknown>>(
  opts: Options<TValues>,
) {
  const {
    defaultValues,
    schema,
    mutation,
    onValidSubmit,
    fieldLabels,
    formatError,
    clearErrorsOnChange = false,
  } = opts;

  const [submitErrors, setSubmitErrors] = useState<SubmitErrorItem[]>([]);

  const makeItem = (field: string, message: string): SubmitErrorItem => {
    if (formatError) return formatError({ field, message });

    const label =
      (fieldLabels && (fieldLabels as Record<string, string>)[field]) ||
      undefined;

    return { field, label, message };
  };

  const form = useForm({
    defaultValues,
    // Zod is standard-schema compliant and TanStack Form detects that at
    // runtime, but TValues is still generic here so the inference that would
    // widen this slot to a schema cannot resolve. The cast is the seam.
    validators: { onSubmit: schema as unknown as FormValidateFn<TValues> },

    onSubmitInvalid: ({ formApi }) => {
      const errorsObj =
        getSubmitFieldErrorsFromMeta(
          formApi.state.fieldMetaBase as Parameters<
            typeof getSubmitFieldErrorsFromMeta
          >[0],
        ) ?? {};

      const list = Object.entries(errorsObj).flatMap(([field, msgs]) =>
        msgs.map((m) => makeItem(field, m)),
      );

      setSubmitErrors(list);
    },

    onSubmit: async ({ value }) => {
      onValidSubmit?.(value);
      try {
        // ✅ mutateAsync ব্যবহার করলে API রেসপন্স আসা পর্যন্ত অপেক্ষা করবে
        await mutation.mutateAsync(value);
        // ✅ API সফল হলে তারপর ফর্ম রিসেট হবে
        resetAll();
      } catch (error) {
        console.error("Mutation failed:", error);
      }
    },
  });

  const clearSubmitErrors = () => setSubmitErrors([]);

  const resetAll = () => {
    form.reset();
    setSubmitErrors([]);
  };

  const errorSummary = useMemo(() => {
    return {
      hasErrors: submitErrors.length > 0,
      items: submitErrors,
      // ready message helpers
      textItems: submitErrors.map((e) => `${e.label ?? e.field}: ${e.message}`),
    };
  }, [submitErrors]);

  return {
    form,
    mutation,
    resetAll,

    //  reusable error summary API
    submitErrors,
    setSubmitErrors,
    clearSubmitErrors,
    errorSummary,

    // optional flag (যদি বাইরে থেকে use করতে চান)
    clearErrorsOnChange,
  };
}