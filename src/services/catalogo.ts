/**
 * Contenido editable desde el panel: nombre y duración de los servicios,
 * etiquetas y fotos de la galería. Todo se guarda en localStorage.
 */
import { ETIQUETAS_INICIALES, GALERIA_INICIAL } from '../data/fotos'
import { esServicioId, SERVICIOS_BASE, type Servicio, type ServicioId } from '../data/servicios'
import { CLAVES, escribirLista, escribirObjeto, existeClave, leerLista, leerObjeto, type ResultadoLectura } from '../lib/almacenamiento'
import {
  DURACION_MINIMA_HORAS,
  duracionEntre,
  duracionMaximaHoras,
  esHoraValida,
  fijarHorarioSemanal,
  formatearDuracion,
  horarioPorDefecto,
  JORNADA,
  NOMBRES_DIAS,
} from '../lib/horas'
import type { DiaHorario, Etiqueta, FotoGaleria, HorarioSemanal } from '../types'

export class ErrorCatalogo extends Error {
  constructor(mensaje: string) {
    super(mensaje)
    this.name = 'ErrorCatalogo'
  }
}

const esTexto = (v: unknown): v is string => typeof v === 'string'

// ---------- Horario semanal de trabajo ----------

function esDia(x: unknown): x is DiaHorario {
  if (typeof x !== 'object' || x === null) return false
  const d = x as Record<string, unknown>
  return typeof d.abierto === 'boolean' && esHoraValida(d.horaInicio) && esHoraValida(d.horaFin) && d.horaInicio < d.horaFin
}

interface HorarioGuardado {
  dias?: unknown
  horaInicio?: unknown
  horaFin?: unknown
}

function esHorarioGuardado(x: unknown): x is HorarioGuardado {
  if (typeof x !== 'object' || x === null) return false
  const h = x as HorarioGuardado
  const semanal = Array.isArray(h.dias) && h.dias.length === 7 && h.dias.every(esDia)
  // Formato anterior: un único horario para todos los días.
  const unico = esHoraValida(h.horaInicio) && esHoraValida(h.horaFin) && h.horaInicio < h.horaFin
  return semanal || unico
}

function aSemanal(h: HorarioGuardado): HorarioSemanal {
  if (Array.isArray(h.dias)) return h.dias as HorarioSemanal
  return NOMBRES_DIAS.map(() => ({ abierto: true, horaInicio: h.horaInicio as string, horaFin: h.horaFin as string }))
}

/**
 * Lee el horario semanal guardado (o el de config.ts) y lo aplica a las
 * reglas de turnos. Se llama antes de cualquier cálculo de disponibilidad.
 */
export function leerHorario(): { dato: HorarioSemanal; aviso?: string } {
  const r = leerObjeto(CLAVES.horario, esHorarioGuardado)
  const dato = r.dato ? aSemanal(r.dato) : horarioPorDefecto()
  fijarHorarioSemanal(dato)
  return { dato, aviso: r.aviso }
}

export function validarHorario(horario: HorarioSemanal, servicios: Servicio[]): string | null {
  if (horario.length !== 7) return 'El horario tiene que tener los 7 días de la semana.'
  const abiertos = horario.map((d, i) => ({ ...d, nombre: NOMBRES_DIAS[i] })).filter((d) => d.abierto)
  if (abiertos.length === 0) return 'Marcá al menos un día de atención.'
  for (const d of abiertos) {
    if (!esHoraValida(d.horaInicio) || !esHoraValida(d.horaFin)) return `${d.nombre}: elegí la hora de apertura y la de cierre.`
    if (d.horaFin <= d.horaInicio) return `${d.nombre}: la hora de cierre tiene que ser posterior a la de apertura.`
  }
  const masLargoDia = Math.max(...abiertos.map((d) => duracionEntre(d.horaInicio, d.horaFin)))
  const masLargo = servicios.reduce((a, b) => (b.duracionHoras > a.duracionHoras ? b : a))
  if (masLargo.duracionHoras > masLargoDia) {
    return `Ningún día alcanza para “${masLargo.nombre}” (${formatearDuracion(masLargo.duracionHoras)}): el día más largo tiene ${formatearDuracion(masLargoDia)}. Ampliá el horario o reducí la duración del servicio.`
  }
  return null
}

export function actualizarHorario(horario: HorarioSemanal): HorarioSemanal {
  const error = validarHorario(horario, leerServicios().datos)
  if (error) throw new ErrorCatalogo(error)
  const limpio = horario.map((d) => ({ abierto: d.abierto, horaInicio: d.horaInicio, horaFin: d.horaFin }))
  escribirObjeto(CLAVES.horario, { dias: limpio })
  fijarHorarioSemanal(limpio)
  return limpio
}

// ---------- Servicios ----------

interface AjusteServicio {
  id: ServicioId
  nombre: string
  duracionHoras: number
}

export const MAX_NOMBRE_SERVICIO = 60

function esAjuste(x: unknown): x is AjusteServicio {
  if (typeof x !== 'object' || x === null) return false
  const a = x as Record<string, unknown>
  return esServicioId(a.id) && esTexto(a.nombre) && typeof a.duracionHoras === 'number' && a.duracionHoras > 0
}

/** Servicios con el nombre y la duración configurados en el panel. */
export function leerServicios(): ResultadoLectura<Servicio> {
  const r = leerLista(CLAVES.servicios, esAjuste)
  const datos = SERVICIOS_BASE.map((base) => {
    const ajuste = r.datos.find((a) => a.id === base.id)
    return ajuste ? { ...base, nombre: ajuste.nombre, duracionHoras: ajuste.duracionHoras } : base
  })
  return { datos, aviso: r.aviso }
}

export function validarServicio(nombre: string, duracionHoras: number): { nombre?: string; duracion?: string } {
  const errores: { nombre?: string; duracion?: string } = {}
  const n = nombre.trim()
  if (!n) errores.nombre = 'Escribí un nombre para el servicio.'
  else if (n.length > MAX_NOMBRE_SERVICIO) errores.nombre = `Usá como máximo ${MAX_NOMBRE_SERVICIO} caracteres.`
  if (!Number.isFinite(duracionHoras) || duracionHoras < DURACION_MINIMA_HORAS || duracionHoras > duracionMaximaHoras()) {
    const num = (n: number) => n.toLocaleString('es')
    errores.duracion = `La duración tiene que estar entre ${num(DURACION_MINIMA_HORAS)} y ${num(duracionMaximaHoras())} horas (el día de trabajo más largo).`
  } else if (!Number.isInteger((duracionHoras * 60) / JORNADA.paso)) {
    errores.duracion = `Usá múltiplos de ${JORNADA.paso} minutos (por ejemplo 1, 1,5 o 2 horas).`
  }
  return errores
}

export function actualizarServicio(id: ServicioId, nombre: string, duracionHoras: number): Servicio {
  leerHorario()
  const errores = validarServicio(nombre, duracionHoras)
  const primero = errores.nombre ?? errores.duracion
  if (primero) throw new ErrorCatalogo(primero)
  const otros = leerLista(CLAVES.servicios, esAjuste).datos.filter((a) => a.id !== id)
  escribirLista(CLAVES.servicios, [...otros, { id, nombre: nombre.trim(), duracionHoras }])
  return leerServicios().datos.find((s) => s.id === id)!
}

// ---------- Etiquetas ----------

export const MAX_NOMBRE_ETIQUETA = 30

function esEtiqueta(x: unknown): x is Etiqueta {
  if (typeof x !== 'object' || x === null) return false
  const e = x as Record<string, unknown>
  return esTexto(e.id) && esTexto(e.nombre)
}

export function leerEtiquetas(): ResultadoLectura<Etiqueta> {
  return leerLista(CLAVES.etiquetas, esEtiqueta)
}

export function validarNombreEtiqueta(nombre: string, etiquetas: Etiqueta[], excluirId?: string): string | null {
  const n = nombre.trim()
  if (!n) return 'Escribí un nombre para la etiqueta.'
  if (n.length > MAX_NOMBRE_ETIQUETA) return `Usá como máximo ${MAX_NOMBRE_ETIQUETA} caracteres.`
  const repetida = etiquetas.find((e) => e.id !== excluirId && e.nombre.localeCompare(n, 'es', { sensitivity: 'base' }) === 0)
  if (repetida) return `Ya existe la etiqueta “${repetida.nombre}”.`
  return null
}

function generarIdEtiqueta(nombre: string, existentes: Etiqueta[]): string {
  const base =
    nombre
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'etiqueta'
  let id = base
  for (let i = 2; existentes.some((e) => e.id === id); i++) id = `${base}-${i}`
  return id
}

export function crearEtiqueta(nombre: string): Etiqueta {
  const etiquetas = leerEtiquetas().datos
  const error = validarNombreEtiqueta(nombre, etiquetas)
  if (error) throw new ErrorCatalogo(error)
  const etiqueta = { id: generarIdEtiqueta(nombre.trim(), etiquetas), nombre: nombre.trim() }
  escribirLista(CLAVES.etiquetas, [...etiquetas, etiqueta])
  return etiqueta
}

export function renombrarEtiqueta(id: string, nombre: string): Etiqueta {
  const etiquetas = leerEtiquetas().datos
  if (!etiquetas.some((e) => e.id === id)) throw new ErrorCatalogo('Esa etiqueta ya no existe.')
  const error = validarNombreEtiqueta(nombre, etiquetas, id)
  if (error) throw new ErrorCatalogo(error)
  const actualizada = { id, nombre: nombre.trim() }
  escribirLista(
    CLAVES.etiquetas,
    etiquetas.map((e) => (e.id === id ? actualizada : e)),
  )
  return actualizada
}

/** Elimina la etiqueta y la quita de las fotos. Devuelve cuántas fotos la tenían. */
export function eliminarEtiqueta(id: string): number {
  const etiquetas = leerEtiquetas().datos
  if (!etiquetas.some((e) => e.id === id)) throw new ErrorCatalogo('Esa etiqueta ya no existe.')
  const galeria = leerGaleria().datos
  const afectadas = galeria.filter((f) => f.etiquetas.includes(id)).length
  escribirLista(
    CLAVES.galeria,
    galeria.map((f) => (f.etiquetas.includes(id) ? { ...f, etiquetas: f.etiquetas.filter((e) => e !== id) } : f)),
  )
  escribirLista(
    CLAVES.etiquetas,
    etiquetas.filter((e) => e.id !== id),
  )
  return afectadas
}

// ---------- Galería ----------

export const MAX_ALT_FOTO = 160

function esFoto(x: unknown): x is FotoGaleria {
  if (typeof x !== 'object' || x === null) return false
  const f = x as Record<string, unknown>
  const proporcionValida =
    f.proporcion === undefined ||
    (Array.isArray(f.proporcion) && f.proporcion.length === 2 && f.proporcion.every((n) => typeof n === 'number' && n > 0))
  return (
    esTexto(f.id) &&
    esTexto(f.src) &&
    esTexto(f.alt) &&
    Array.isArray(f.etiquetas) &&
    f.etiquetas.every(esTexto) &&
    esTexto(f.creadaEn) &&
    proporcionValida
  )
}

export function leerGaleria(): ResultadoLectura<FotoGaleria> {
  return leerLista(CLAVES.galeria, esFoto)
}

function validarFoto(src: string, alt: string) {
  if (!/^https:\/\//.test(src) && !/^data:image\/(jpeg|png|webp|gif);base64,/.test(src)) {
    throw new ErrorCatalogo('La imagen tiene que ser una URL https o un archivo subido.')
  }
  if (!alt.trim()) throw new ErrorCatalogo('Escribí una descripción breve de la foto (texto alternativo).')
  if (alt.trim().length > MAX_ALT_FOTO) throw new ErrorCatalogo(`La descripción puede tener hasta ${MAX_ALT_FOTO} caracteres.`)
}

export function agregarFoto(datos: Pick<FotoGaleria, 'src' | 'alt' | 'etiquetas' | 'proporcion'>): FotoGaleria {
  validarFoto(datos.src, datos.alt)
  const galeria = leerGaleria().datos
  const foto: FotoGaleria = {
    id: `F-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    src: datos.src,
    alt: datos.alt.trim(),
    etiquetas: [...new Set(datos.etiquetas)],
    ...(datos.proporcion && { proporcion: datos.proporcion }),
    creadaEn: new Date().toISOString(),
  }
  escribirLista(CLAVES.galeria, [foto, ...galeria])
  return foto
}

export function actualizarFoto(id: string, cambios: Partial<Pick<FotoGaleria, 'alt' | 'etiquetas'>>): FotoGaleria {
  const galeria = leerGaleria().datos
  const actual = galeria.find((f) => f.id === id)
  if (!actual) throw new ErrorCatalogo('Esa foto ya no existe.')
  const actualizada = {
    ...actual,
    ...(cambios.alt !== undefined && { alt: cambios.alt.trim() }),
    ...(cambios.etiquetas && { etiquetas: [...new Set(cambios.etiquetas)] }),
  }
  validarFoto(actualizada.src, actualizada.alt)
  escribirLista(
    CLAVES.galeria,
    galeria.map((f) => (f.id === id ? actualizada : f)),
  )
  return actualizada
}

export function eliminarFoto(id: string): void {
  const galeria = leerGaleria().datos
  if (!galeria.some((f) => f.id === id)) throw new ErrorCatalogo('Esa foto ya no existe.')
  escribirLista(
    CLAVES.galeria,
    galeria.filter((f) => f.id !== id),
  )
}

/** Mueve la foto una posición hacia adelante (-1) o hacia atrás (1). */
export function moverFoto(id: string, direccion: -1 | 1): void {
  const galeria = leerGaleria().datos
  const i = galeria.findIndex((f) => f.id === id)
  const j = i + direccion
  if (i < 0 || j < 0 || j >= galeria.length) return
  ;[galeria[i], galeria[j]] = [galeria[j], galeria[i]]
  escribirLista(CLAVES.galeria, galeria)
}

/** Crea las etiquetas y la galería iniciales si todavía no existen. */
export function inicializarCatalogo(): void {
  if (!existeClave(CLAVES.etiquetas)) escribirLista(CLAVES.etiquetas, ETIQUETAS_INICIALES)
  if (!existeClave(CLAVES.galeria)) {
    const ahora = new Date().toISOString()
    escribirLista<FotoGaleria>(
      CLAVES.galeria,
      GALERIA_INICIAL.map((f) => ({
        id: `F-${f.id}`,
        src: `https://images.unsplash.com/photo-${f.id}`,
        alt: f.alt,
        etiquetas: [f.categoria],
        proporcion: f.proporcion,
        creadaEn: ahora,
      })),
    )
  }
}
