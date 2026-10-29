export function exportCsv(name: string, rows: (string | number)[][]) {
  const cell = (value: string | number) => {
    const text = String(value)
    return `"${(/^[=+\-@\t\r]/.test(text) ? "'" + text : text).replace(/"/g, '""')}"`
  }
  const url = URL.createObjectURL(
    new Blob(["\uFEFF" + rows.map((r) => r.map(cell).join(",")).join("\r\n")], {
      type: "text/csv;charset=utf-8",
    })
  )
  const a = document.createElement("a")
  a.href = url
  a.download = name + ".csv"
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
