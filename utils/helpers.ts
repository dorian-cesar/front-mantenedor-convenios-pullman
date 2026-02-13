export const formatDateOnly = (isoDate: string) => {
  if (!isoDate) return "-"
  return isoDate.split("T")[0]
}

export const formatRut = (rut: string) => {
  if (rut.includes('-')) return rut

  const rutBody = rut.slice(0, -1)
  const dv = rut.slice(-1)
  return `${rutBody.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}-${dv}`
}

export const formatDate = (isoDate: string) => {
  if (!isoDate) return "-"

  const date = new Date(isoDate)

  if (isNaN(date.getTime())) return "-"

  return date.toLocaleDateString("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

export const formatNumber = (value?: number | string | null) => {
  if (value === null || value === undefined || value === "") return "-"

  const num = Number(value)
  if (isNaN(num)) return "-"

  return num.toLocaleString("es-CL")
}

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.readAsDataURL(file)

    reader.onload = () => {
      resolve(reader.result as string)
    }

    reader.onerror = (error) => {
      reject(error)
    }
  })
}

export const getImageSrc = (base64?: string | null) => {
  if (!base64) return null

  // Si ya viene con data:image
  if (base64.startsWith("data:image")) {
    return base64
  }

  // Si viene puro
  return `data:image/jpeg;base64,${base64}`
}
