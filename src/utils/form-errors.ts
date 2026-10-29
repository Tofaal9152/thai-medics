type ZodIssueLike = { message?: string };

type FieldMetaBase = Record<
  string,
  {
    errorMap?: {
      onSubmit?: ZodIssueLike[];
      // future: onChange/onBlur...
      [key: string]: unknown;
    };
  }
>;

export function getSubmitFieldErrorsFromMeta(fieldMetaBase: FieldMetaBase) {
  return Object.fromEntries(
    Object.entries(fieldMetaBase)
      .map(([field, meta]) => {
        const issues = (meta.errorMap?.onSubmit ?? []) as ZodIssueLike[];
        const messages = issues
          .map((i) => i?.message)
          .filter((m): m is string => typeof m === "string" && m.length > 0);

        return [field, messages];
      })
      .filter(([, messages]) => (messages as string[]).length > 0),
  ) as Record<string, string[]>;
}