export const choices = (...labels: string[]) =>
  labels.map((label) => ({ value: label, label }))
