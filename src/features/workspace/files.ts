function database(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("thai-medics-demo-files", 1)
    request.onupgradeneeded = () => request.result.createObjectStore("files")
    request.onsuccess = () => resolve(request.result)
    request.onerror = () =>
      reject(new Error("File storage is unavailable in this browser."))
  })
}
export async function saveFile(id: string, file: File) {
  const db = await database()
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction("files", "readwrite")
      tx.objectStore("files").put(file, id)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(new Error("The file could not be saved."))
    })
  } finally {
    db.close()
  }
}
export async function readFile(id: string): Promise<Blob | null> {
  const db = await database()
  try {
    return await new Promise((resolve, reject) => {
      const request = db.transaction("files").objectStore("files").get(id)
      request.onsuccess = () =>
        resolve(request.result instanceof Blob ? request.result : null)
      request.onerror = () => reject(new Error("The file could not be opened."))
    })
  } finally {
    db.close()
  }
}
export async function openFile(id: string, name: string, download = false) {
  const blob = await readFile(id)
  if (!blob)
    throw new Error(
      "This sample record has no real file attached. Upload a fictional PDF or image to try file viewing."
    )
  const url = URL.createObjectURL(blob)
  if (download) {
    const a = document.createElement("a")
    a.href = url
    a.download = name
    a.click()
  } else window.open(url, "_blank", "noopener,noreferrer")
  setTimeout(() => URL.revokeObjectURL(url), 60000)
}
