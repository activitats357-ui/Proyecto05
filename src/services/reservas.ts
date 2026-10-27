/**
 * Capa de servicios: única fuente de las reglas de reservas y disponibilidad.
 * Cada operación de escritura vuelve a leer localStorage justo antes de
 * guardar, para detectar cambios hechos desde otra pestaña o formulario.
 */
import { buscarServicio, esServicioId } from '../data/servicios'
import { CLAVES, escribirLista, leerLista, type ResultadoLectura } from '../lib/almacenamiento'
import { esFechaISOValida, esPasada, formatearFechaLarga, hoyISO } from '../lib/fechas'
import { validarDatosReserva, type ErroresReserva } from '../lib/validacion'
import {
  ESTADOS_RESERVA,
  ETIQUETA_ESTADO,
  type DatosNuevaReserva,
  type EstadoDia,
  type EstadoReserva,
  type Estadisticas,
  type FechaBloqueada,
  type Reserva,
} from '../types'

export type CodigoErrorReserva = 'VALIDACION' | 'NO_DISPONIBLE' | 'NO_ENCONTRADA' | 'CONFLICTO'

export class ErrorReserva extends Error {
  readonly codigo: CodigoErrorReserva
  readonly errores?: ErroresReserva

  constructor(codigo: CodigoErrorReserva, mensaje: string, errores?: ErroresReserva) {
    super(mensaje)
    this.name = 'ErrorReserva'
    this.codigo = codigo
    this.errores = errores
  }
}

export const MAX_MOTIVO_BLOQUEO = 120

// ---------- Validación de registros guardados ----------

const esTexto = (v: unknown): v is string => typeof v === 'string'

function esReserva(x: unknown): x is Reserva {
  if (typeof x !== 'object' || x === null) return false
  const r = x as Record<string, unknown>
  return (
    esTexto(r.id) &&
    esTexto(r.nombre) &&
    esTexto(r.celular) &&
    esTexto(r.email) &&
    esServicioId(r.servicioId) &&
    esTexto(r.servicioNombre) &&
    esFechaISOValida(r.fecha) &&
    esTexto(r.notas) &&
    ESTADOS_RESERVA.includes(r.estado as EstadoReserva) &&
    esTexto(r.creadaEn)
  )
}

function esFechaBloqueada(x: unknown): x is FechaBloqueada {
  if (typeof x !== 'object' || x === null) return false
  const b = x as Record<string, unknown>
  return esFechaISOValida(b.fecha) && esTexto(b.creadaEn) && (b.motivo === undefined || esTexto(b.motivo))
}

// ---------- Lectura ----------

export function leerReservas(): ResultadoLectura<Reserva> {
  return leerLista(CLAVES.reservas, esReserva)
}

export function leerBloqueos(): ResultadoLectura<FechaBloqueada> {
  return leerLista(CLAVES.bloqueos, esFechaBloqueada)
}

// ---------- Reglas de disponibilidad ----------

/** Las reservas pendientes y confirmadas ocupan la fecha; las canceladas no. */
export function ocupaFecha(estado: EstadoReserva): boolean {
  return estado !== 'cancelada'
}

export function reservaActivaEn(fecha: string, reservas: Reserva[], excluirId?: string): Reserva | undefined {
  return reservas.find((r) => r.fecha === fecha && ocupaFecha(r.estado) && r.id !== excluirId)
}

export function bloqueoEn(fecha: string, bloqueos: FechaBloqueada[]): FechaBloqueada | undefined {
  return bloqueos.find((b) => b.fecha === fecha)
}

export function estadoDeFecha(
  fecha: string,
  reservas: Reserva[],
  bloqueos: FechaBloqueada[],
  hoy = hoyISO(),
): EstadoDia {
  if (esPasada(fecha, hoy)) return 'pasada'
  if (reservaActivaEn(fecha, reservas)) return 'ocupada'
  if (bloqueoEn(fecha, bloqueos)) return 'bloqueada'
  return 'disponible'
}

const MOTIVO_NO_DISPONIBLE: Record<Exclude<EstadoDia, 'disponible'>, string> = {
  pasada: 'Esa fecha ya pasó. Elegí una fecha futura.',
  ocupada: 'Esa fecha ya tiene una reserva. Elegí otra fecha disponible.',
  bloqueada: 'Esa fecha no está disponible para reservas. Elegí otra fecha.',
}

export function comprobarDisponibilidad(
  fecha: string,
  reservas: Reserva[],
  bloqueos: FechaBloqueada[],
  hoy = hoyISO(),
): { disponible: true } | { disponible: false; motivo: string } {
  if (!esFechaISOValida(fecha)) return { disponible: false, motivo: 'La fecha no es válida.' }
  const estado = estadoDeFecha(fecha, reservas, bloqueos, hoy)
  return estado === 'disponible' ? { disponible: true } : { disponible: false, motivo: MOTIVO_NO_DISPONIBLE[estado] }
}

// ---------- Reservas ----------

const ALFABETO_CODIGO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

function generarCodigo(existentes: Set<string>): string {
  for (;;) {
    const bytes = crypto.getRandomValues(new Uint8Array(6))
    const codigo = 'LB-' + Array.from(bytes, (b) => ALFABETO_CODIGO[b % ALFABETO_CODIGO.length]).join('')
    if (!existentes.has(codigo)) return codigo
  }
}

export function crearReserva(entrada: DatosNuevaReserva): Reserva {
  const datos: DatosNuevaReserva = {
    nombre: entrada.nombre.trim().replace(/\s+/g, ' '),
    celular: entrada.celular.trim(),
    email: entrada.email.trim().toLowerCase(),
    servicioId: entrada.servicioId,
    fecha: entrada.fecha,
    notas: entrada.notas.trim(),
  }
  const hoy = hoyISO()
  const errores = validarDatosReserva(datos, hoy)
  if (Object.keys(errores).length > 0) {
    throw new ErrorReserva('VALIDACION', 'Revisá los datos marcados antes de confirmar.', errores)
  }

  const reservas = leerReservas().datos
  const bloqueos = leerBloqueos().datos
  const disponibilidad = comprobarDisponibilidad(datos.fecha, reservas, bloqueos, hoy)
  if (!disponibilidad.disponible) throw new ErrorReserva('NO_DISPONIBLE', disponibilidad.motivo)

  const reserva: Reserva = {
    ...datos,
    id: generarCodigo(new Set(reservas.map((r) => r.id))),
    servicioNombre: buscarServicio(datos.servicioId)!.nombre,
    estado: 'pendiente',
    creadaEn: new Date().toISOString(),
  }
  escribirLista(CLAVES.reservas, [...reservas, reserva])
  return reserva
}

export function cambiarEstadoReserva(id: string, nuevoEstado: EstadoReserva): Reserva {
  const reservas = leerReservas().datos
  const reserva = reservas.find((r) => r.id === id)
  if (!reserva) throw new ErrorReserva('NO_ENCONTRADA', `No se encontró la reserva ${id}. Puede que se haya eliminado.`)
  if (reserva.estado === nuevoEstado) return reserva

  if (ocupaFecha(nuevoEstado) && !ocupaFecha(reserva.estado)) {
    const fechaTexto = formatearFechaLarga(reserva.fecha)
    const otra = reservaActivaEn(reserva.fecha, reservas, reserva.id)
    if (otra) {
      throw new ErrorReserva(
        'CONFLICTO',
        `No se puede pasar a "${ETIQUETA_ESTADO[nuevoEstado]}": el ${fechaTexto} ya está ocupado por la reserva ${otra.id} (${otra.nombre}). Cancelá esa reserva primero si querés reactivar esta.`,
      )
    }
    const bloqueo = bloqueoEn(reserva.fecha, leerBloqueos().datos)
    if (bloqueo) {
      throw new ErrorReserva(
        'CONFLICTO',
        `No se puede pasar a "${ETIQUETA_ESTADO[nuevoEstado]}": el ${fechaTexto} está bloqueado manualmente${bloqueo.motivo ? ` (${bloqueo.motivo})` : ''}. Desbloqueá la fecha primero.`,
      )
    }
  }

  const actualizada: Reserva = { ...reserva, estado: nuevoEstado, actualizadaEn: new Date().toISOString() }
  escribirLista(
    CLAVES.reservas,
    reservas.map((r) => (r.id === id ? actualizada : r)),
  )
  return actualizada
}

// ---------- Bloqueos manuales ----------

export function bloquearFecha(fecha: string, motivo?: string): FechaBloqueada {
  if (!esFechaISOValida(fecha)) throw new ErrorReserva('VALIDACION', 'La fecha no es válida.')
  if (esPasada(fecha)) throw new ErrorReserva('VALIDACION', 'No se pueden bloquear fechas pasadas.')
  const motivoLimpio = motivo?.trim().slice(0, MAX_MOTIVO_BLOQUEO) || undefined

  const reservas = leerReservas().datos
  const bloqueos = leerBloqueos().datos
  const activa = reservaActivaEn(fecha, reservas)
  if (activa) {
    throw new ErrorReserva(
      'CONFLICTO',
      `No se puede bloquear: la fecha tiene una reserva activa (${activa.id}, ${ETIQUETA_ESTADO[activa.estado].toLowerCase()}).`,
    )
  }
  if (bloqueoEn(fecha, bloqueos)) throw new ErrorReserva('CONFLICTO', 'Esa fecha ya está bloqueada.')

  const bloqueo: FechaBloqueada = { fecha, creadaEn: new Date().toISOString(), ...(motivoLimpio && { motivo: motivoLimpio }) }
  escribirLista(
    CLAVES.bloqueos,
    [...bloqueos, bloqueo].sort((a, b) => a.fecha.localeCompare(b.fecha)),
  )
  return bloqueo
}

export function desbloquearFecha(fecha: string): void {
  const reservas = leerReservas().datos
  const bloqueos = leerBloqueos().datos
  const activa = reservaActivaEn(fecha, reservas)
  if (activa) {
    throw new ErrorReserva(
      'CONFLICTO',
      `No se puede modificar: la fecha está ocupada por la reserva ${activa.id}. Para liberarla, cancelá la reserva.`,
    )
  }
  if (!bloqueoEn(fecha, bloqueos)) throw new ErrorReserva('NO_ENCONTRADA', 'Esa fecha no estaba bloqueada.')
  escribirLista(
    CLAVES.bloqueos,
    bloqueos.filter((b) => b.fecha !== fecha),
  )
}

// ---------- Estadísticas y datos de ejemplo ----------

export function calcularEstadisticas(reservas: Reserva[], hoy = hoyISO()): Estadisticas {
  const cuenta = (estado: EstadoReserva) => reservas.filter((r) => r.estado === estado).length
  return {
    total: reservas.length,
    pendientes: cuenta('pendiente'),
    confirmadas: cuenta('confirmada'),
    canceladas: cuenta('cancelada'),
    proximas: reservas.filter((r) => ocupaFecha(r.estado) && !esPasada(r.fecha, hoy)).length,
  }
}

/** Elimina solo los registros marcados como demostración. Devuelve cuántos se quitaron. */
export function eliminarDatosDemo(): { reservas: number; bloqueos: number } {
  const reservas = leerReservas().datos
  const bloqueos = leerBloqueos().datos
  const reservasReales = reservas.filter((r) => !r.esDemo)
  const bloqueosReales = bloqueos.filter((b) => !b.esDemo)
  escribirLista(CLAVES.reservas, reservasReales)
  escribirLista(CLAVES.bloqueos, bloqueosReales)
  return { reservas: reservas.length - reservasReales.length, bloqueos: bloqueos.length - bloqueosReales.length }
}
