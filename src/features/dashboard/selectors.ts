import type { Patient } from "./data"

export function accountSummary(
  patients: Patient[],
  currency: Patient["currency"]
) {
  return patients
    .filter((patient) => patient.currency === currency)
    .reduce(
      (total, patient) => ({
        billed: total.billed + patient.billed,
        paid: total.paid + patient.paid,
        due: total.due + Math.max(0, patient.billed - patient.paid),
        credit: total.credit + Math.max(0, patient.paid - patient.billed),
        supplier: total.supplier + patient.supplierDue,
      }),
      { billed: 0, paid: 0, due: 0, credit: 0, supplier: 0 }
    )
}

export function searchPatients(
  patients: Patient[],
  query: string,
  stage: string,
  coordinator: string
) {
  const needle = query.toLowerCase().trim()
  const normalized = needle.replace(/[\s+()-]/g, "")
  return patients.filter((patient) => {
    const haystack =
      `${patient.name} ${patient.id} ${patient.phone} ${patient.hospital} ${patient.department}`.toLowerCase()
    const match =
      !needle ||
      haystack.includes(needle) ||
      (normalized.length > 0 &&
        patient.phone.replace(/[\s+()-]/g, "").includes(normalized))
    return (
      match &&
      (stage === "" ||
        (stage === "active"
          ? patient.stage < 8
          : patient.stage === Number(stage))) &&
      (!coordinator || patient.coordinator === coordinator)
    )
  })
}
