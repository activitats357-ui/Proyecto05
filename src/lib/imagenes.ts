/**
 * Preparación de imágenes para la galería. Los archivos subidos se reducen y
 * se convierten a JPEG para que entren en localStorage (≈ 5 MB en total).
 */

const MAX_BYTES_ARCHIVO = 20 * 1024 * 1024

export async function procesarArchivo(
  archivo: File,
  ladoMaximo = 1600,
  calidad = 0.8,
): Promise<{ src: string; proporcion: [number, number] }> {
  if (!archivo.type.startsWith('image/')) throw new Error('El archivo no es una imagen.')
  if (archivo.size > MAX_BYTES_ARCHIVO) throw new Error('La imagen supera los 20 MB.')
  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(archivo)
  } catch {
    throw new Error('No se pudo leer la imagen. Probá con un archivo JPG, PNG o WebP.')
  }
  const escala = Math.min(1, ladoMaximo / Math.max(bitmap.width, bitmap.height))
  const ancho = Math.round(bitmap.width * escala)
  const alto = Math.round(bitmap.height * escala)
  const lienzo = document.createElement('canvas')
  lienzo.width = ancho
  lienzo.height = alto
  lienzo.getContext('2d')!.drawImage(bitmap, 0, 0, ancho, alto)
  bitmap.close()
  return { src: lienzo.toDataURL('image/jpeg', calidad), proporcion: [ancho, alto] }
}

/** Comprueba que la URL carga una imagen y devuelve sus dimensiones. */
export function medirImagenUrl(url: string): Promise<[number, number]> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const limite = window.setTimeout(() => reject(new Error('La imagen tardó demasiado en cargar.')), 15_000)
    img.onload = () => {
      window.clearTimeout(limite)
      resolve([img.naturalWidth, img.naturalHeight])
    }
    img.onerror = () => {
      window.clearTimeout(limite)
      reject(new Error('No se pudo cargar una imagen desde esa URL. Revisá que sea un enlace directo a la foto.'))
    }
    img.src = url
  })
}

/** Tamaño aproximado en KB de una data URL. */
export function pesoKB(src: string): number {
  return Math.round(src.length / 1024)
}
