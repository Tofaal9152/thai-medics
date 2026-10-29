import * as XLSX from "xlsx"
export function exportExcel(name: string, rows: (string | number)[][]) {
  const sheet = XLSX.utils.aoa_to_sheet(rows)
  sheet["!cols"] = (rows[0] || []).map(() => ({ wch: 24 }))
  const book = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(book, sheet, "Records")
  XLSX.writeFile(book, `${name}.xlsx`)
}
