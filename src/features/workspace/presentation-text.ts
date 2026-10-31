/** Remove retired display labels from saved records without changing references. */
export function cleanSavedPresentation(value: unknown, key = ""): unknown {
  if (typeof value === "string") {
    if (/id$|^id$|^fileIds$/i.test(key)) return value
    return value
      .replace(/_DEMO(?=\.)/gi, "")
      .replace(/\s*\(demo\)/gi, "")
      .replace(/\[demo\]\s*/gi, "")
      .replace(/\bdemo\b[ \t-]*/gi, "")
      .replace(/^[ \t]+|[ \t]+$/g, "")
      .replace(/^sent$/, "Sent")
  }
  if (Array.isArray(value))
    return value.map((item) => cleanSavedPresentation(item, key))
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value).map(([name, item]) => [
        name,
        cleanSavedPresentation(item, name),
      ])
    )
  return value
}
