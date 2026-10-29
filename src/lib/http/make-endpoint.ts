type QueryValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | (string | number | boolean | null | undefined)[];

export function makeEndpoint(
  baseEndpoint: string,
  query?: Record<string, QueryValue>
) {
  if (!query) return baseEndpoint;

  const params = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;

    if (Array.isArray(value)) {
      value.forEach((v) => {
        if (v === undefined || v === null || v === "") return;
        params.append(key, String(v));
      });
      return;
    }

    params.set(key, String(value));
  });

  const qs = params.toString();
  return qs ? `${baseEndpoint}?${qs}` : baseEndpoint;
}