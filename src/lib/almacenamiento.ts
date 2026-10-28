/**
 * Acceso de bajo nivel a localStorage con manejo de errores:
 * datos corruptos, almacenamiento deshabilitado y cuota excedida.
 */

export const PREFIJO = 'leandro_baez_'

export const CLAVES = {
  reservas: `${PREFIJO}reservas`,
  bloqueos: `${PREFIJO}fechas_bloqueadas`,
  configuracion: `${PREFIJO}configuracion`,
  servicios: `${PREFIJO}servicios`,
  etiquetas: `${PREFIJO}etiquetas`,
  galeria: `${PREFIJO}galeria`,
  horario: `${PREFIJO}horario`,
} as const

/** Caracteres ocupados por las claves de la app (localStorage suele admitir unos 5 millones). */
export function usoAlmacenamiento(): number {
  try {
    const s = storage()
    let total = 0
    for (let i = 0; i < s.length; i++) {
      const clave = s.key(i)
      if (clave?.startsWith(PREFIJO)) total += clave.length + (s.getItem(clave)?.length ?? 0)
    }
    return total
  } catch {
    return 0
  }
}

export class ErrorAlmacenamiento extends Error {
  constructor(mensaje: string, options?: { cause?: unknown }) {
    super(mensaje, options)
    this.name = 'ErrorAlmacenamiento'
  }
}

function storage(): Storage {
  try {
    const s = window.localStorage
    if (!s) throw new Error('localStorage no disponible')
    return s
  } catch (cause) {
    throw new ErrorAlmacenamiento(
      'Este navegador no permite guardar datos (el almacenamiento local está deshabilitado o bloqueado).',
      { cause },
    )
  }
}

function esErrorDeCuota(e: unknown): boolean {
  return (
    e instanceof DOMException &&
    (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED' || e.code === 22)
  )
}

export function existeClave(clave: string): boolean {
  return storage().getItem(clave) !== null
}

export interface ResultadoLectura<T> {
  datos: T[]
  /** Mensaje para mostrar si hubo datos dañados o el almacenamiento falló. */
  aviso?: string
}

/**
 * Guarda una copia del contenido original antes de descartar datos dañados,
 * para no perder información de forma silenciosa.
 */
function respaldar(clave: string, crudo: string): string {
  const claveRespaldo = `${clave}__respaldo`
  try {
    const s = storage()
    const existente = s.getItem(claveRespaldo)
    if (existente === crudo) return claveRespaldo
    const destino = existente === null ? claveRespaldo : `${claveRespaldo}_${Date.now()}`
    s.setItem(destino, crudo)
    return destino
  } catch {
    return ''
  }
}

export function leerLista<T>(clave: string, esValido: (x: unknown) => x is T): ResultadoLectura<T> {
  let crudo: string | null
  try {
    crudo = storage().getItem(clave)
  } catch (e) {
    return { datos: [], aviso: e instanceof Error ? e.message : 'No se pudo leer el almacenamiento local.' }
  }
  if (crudo === null) return { datos: [] }

  const avisoRespaldo = () => {
    const destino = respaldar(clave, crudo)
    return destino ? ` Se guardó una copia del contenido original en "${destino}".` : ''
  }

  let parseado: unknown
  try {
    parseado = JSON.parse(crudo)
  } catch {
    return { datos: [], aviso: `Los datos guardados en "${clave}" están dañados y no se pudieron leer.${avisoRespaldo()}` }
  }
  if (!Array.isArray(parseado)) {
    return { datos: [], aviso: `Los datos guardados en "${clave}" no tienen el formato esperado.${avisoRespaldo()}` }
  }
  const validos = parseado.filter(esValido)
  const descartados = parseado.length - validos.length
  if (descartados > 0) {
    return {
      datos: validos,
      aviso: `Se ignoraron ${descartados} registro(s) con formato inválido en "${clave}".${avisoRespaldo()}`,
    }
  }
  return { datos: validos }
}

/** Lee un objeto JSON. Si está dañado, lo respalda y devuelve null con un aviso. */
export function leerObjeto<T>(clave: string, esValido: (x: unknown) => x is T): { dato: T | null; aviso?: string } {
  let crudo: string | null
  try {
    crudo = storage().getItem(clave)
  } catch (e) {
    return { dato: null, aviso: e instanceof Error ? e.message : 'No se pudo leer el almacenamiento local.' }
  }
  if (crudo === null) return { dato: null }
  try {
    const parseado: unknown = JSON.parse(crudo)
    if (esValido(parseado)) return { dato: parseado }
  } catch {
    /* se trata igual que un formato inválido */
  }
  const destino = respaldar(clave, crudo)
  return {
    dato: null,
    aviso: `Los datos guardados en "${clave}" no son válidos; se usan los valores por defecto.${destino ? ` Se guardó una copia en "${destino}".` : ''}`,
  }
}

function escribir(clave: string, valor: unknown): void {
  try {
    storage().setItem(clave, JSON.stringify(valor))
  } catch (cause) {
    if (cause instanceof ErrorAlmacenamiento) throw cause
    if (esErrorDeCuota(cause)) {
      throw new ErrorAlmacenamiento(
        'No hay espacio suficiente en el almacenamiento del navegador para guardar los cambios.',
        { cause },
      )
    }
    throw new ErrorAlmacenamiento('No se pudieron guardar los cambios en este navegador.', { cause })
  }
}

export function escribirLista<T>(clave: string, datos: T[]): void {
  escribir(clave, datos)
}

export function escribirObjeto(clave: string, datos: Record<string, unknown>): void {
  escribir(clave, datos)
}
