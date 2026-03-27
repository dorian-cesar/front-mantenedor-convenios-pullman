export const formatDateOnly = (isoDate: string) => {
  if (!isoDate) return "-"
  return isoDate.split("T")[0]
}

export const formatRut = (rut: string | null | undefined) => {
  if (!rut) return ""
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

export const formatDateTime = (isoDate: string | null | undefined) => {
  if (!isoDate) return "-"

  const date = new Date(isoDate)

  if (isNaN(date.getTime())) return "-"

  const fecha = date.toLocaleDateString("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })

  const hora = date.toLocaleTimeString("es-CL", {
    hour: "2-digit",
    minute: "2-digit",
  })

  return `${fecha} ${hora}`
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

export const getFileSrc = (base64?: string | null) => {
  if (!base64) return null

  if (base64.startsWith("data:")) {
    return base64
  }

  try {
    const decoded = atob(base64.substring(0, 100));
    if (decoded.includes('%PDF')) {
      return `data:application/pdf;base64,${base64}`;
    }
  } catch {
    // Si falla la decodificación, asumimos imagen
  }

  return `data:image/jpeg;base64,${base64}`
}

export const isPDF = (base64?: string | null): boolean => {
  if (!base64) return false

  if (base64.startsWith("data:application/pdf")) {
    return true
  }

  try {
    const decoded = atob(base64.substring(0, 100));
    return decoded.includes('%PDF');
  } catch {
    return false;
  }
}

/**
 * Rota una imagen en base64 una cantidad específica de grados.
 * Devuelve una promesa con el nuevo base64.
 */
export const rotateImage = (base64: string, degrees: number): Promise<string> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.crossOrigin = "anonymous";
    img.onload = () => {
      const normalizedDegrees = ((degrees % 360) + 360) % 360;
      
      if (normalizedDegrees % 180 === 0) {
        canvas.width = img.width;
        canvas.height = img.height;
      } else {
        canvas.width = img.height;
        canvas.height = img.width;
      }

      if (!ctx) {
        reject(new Error("No se pudo obtener el contexto del canvas"));
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((normalizedDegrees * Math.PI) / 180);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);

      resolve(canvas.toDataURL('image/jpeg', 0.9));
    };

    img.onerror = (err) => reject(err);
    img.src = getFileSrc(base64) || "";
  });
}