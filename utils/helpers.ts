export const formatDateOnly = (isoDate: string) => {
  if (!isoDate) return "-"
  return isoDate.split("T")[0]
}

export const formatRut = (rut: string | null | undefined) => {
  if (!rut) return ""
  if (rut.includes('-')) return rut

  const cleanRut = rut.replace(/\./g, '').replace(/-/g, '')
  if (cleanRut.length < 2) return rut

  const rutBody = cleanRut.slice(0, -1)
  const dv = cleanRut.slice(-1)
  return `${rutBody.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}-${dv}`
}

export const cleanRut = (rut: string | null | undefined) => {
  if (!rut) return ""
  return rut.replace(/\./g, "").replace(/-/g, "").toUpperCase()
}

export const validateRut = (rut: string | null | undefined): boolean => {
  if (!rut) return false
  
  // Limpiar puntos y guión
  const cleanRut = rut.replace(/\./g, "").replace(/-/g, "").toUpperCase()
  if (cleanRut.length < 8) return false

  const cuerpo = cleanRut.slice(0, -1)
  const dv = cleanRut.slice(-1)

  // Validar formato del cuerpo
  if (!/^\d+$/.test(cuerpo)) return false

  // Calcular Dígito Verificador
  let suma = 0
  let multiplo = 2

  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += multiplo * parseInt(cuerpo.charAt(i))
    multiplo = multiplo < 7 ? multiplo + 1 : 2
  }

  const dvEsperado = 11 - (suma % 11)
  let dvCalc = ""
  if (dvEsperado === 11) dvCalc = "0"
  else if (dvEsperado === 10) dvCalc = "K"
  else dvCalc = dvEsperado.toString()

  return dv === dvCalc
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
    // Solo intentamos atob si no tiene prefijo data:
    const decoded = atob(base64.substring(0, 100));
    if (decoded.includes('%PDF')) {
      return `data:application/pdf;base64,${base64}`;
    }
  } catch {
    // Si falla la decodificación, ignoramos y seguimos
  }

  // Detección simple de PNG por su firma en base64
  if (base64.startsWith('iVBORw0KGgo')) {
    return `data:image/png;base64,${base64}`;
  }

  return `data:image/jpeg;base64,${base64}`
}

export const isPDF = (base64?: string | null): boolean => {
  if (!base64) return false

  if (base64.startsWith("data:application/pdf")) {
    return true
  }
  
  // Si tiene otro prefijo data:, no es PDF
  if (base64.startsWith("data:")) {
    return false
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