/**
 * Capa de servicios: única fuente de las reglas de reservas y disponibilidad.
 * Cada reserva ocupa una franja horaria; los bloqueos pueden ser de día
 * completo o de una franja. Cada operación de escritura vuelve a leer
 * localStorage justo antes de guardar, para detectar cambios hechos desde
 * otra pestaña o formulario.
 */
import { esServicioId } from '../data/servicios'
import { CLAVES, escribirLista, leerLista, type ResultadoLectura } from '../lib/almacenamiento'
import { aFechaISO, esFechaISOValida, esPasada, formatearFechaLarga } from '../lib/fechas'
import { aHora, aMinutos, esHoraValida, JORNADA, minutosDe, solapan, sumarHoras, textoJornada, type Intervalo } from '../lib/horas'
import { validarDatosReserva, type ErroresReserva } from '../lib/validacion'
import {
  ESTADOS_RESERVA,
  ETIQUETA_ESTADO,
  type DatosNuevaReserva,
  type EstadoDia,
  type EstadoReserva,
  type Estadisticas,
  type FechaBloqueada,
  type FranjaHoraria,
  type Reserva,
} from '../types'
import { leerHorario, leerServicios } from './catalogo'

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

// ---------- Validación y migración de registros guardados ----------

const esTexto = (v: unknown): v is string => typeof v === 'string'
const esHoraOpcional = (v: unknown) => v === undefined || esHoraValida(v)

type ReservaGuardada = Omit<Reserva, 'horaInicio' | 'horaFin'> & Partial<FranjaHoraria>
type BloqueoGuardado = Omit<FechaBloqueada, 'id'> & { id?: string }

function esReservaGuardada(x: unknown): x is ReservaGuardada {
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
    esHoraOpcional(r.horaInicio) &&
    esHoraOpcional(r.horaFin) &&
    esTexto(r.notas) &&
    ESTADOS_RESERVA.includes(r.estado as EstadoReserva) &&
    esTexto(r.creadaEn)
  )
}

function esBloqueoGuardado(x: unknown): x is BloqueoGuardado {
  if (typeof x !== 'object' || x === null) return false
  const b = x as Record<string, unknown>
  const conHoras = b.horaInicio !== undefined || b.horaFin !== undefined
  return (
    esFechaISOValida(b.fecha) &&
    esTexto(b.creadaEn) &&
    (b.id === undefined || esTexto(b.id)) &&
    (b.motivo === undefined || esTexto(b.motivo)) &&
    (!conHoras || (esHoraValida(b.horaInicio) && esHoraValida(b.horaFin) && b.horaInicio < b.horaFin))
  )
}

/** Las reservas anteriores a los turnos horarios ocupan la jornada completa. */
function normalizarReserva(r: ReservaGuardada): Reserva {
  return {
    ...r,
    horaInicio: r.horaInicio && r.horaFin ? r.horaInicio : aHora(JORNADA.inicio),
    horaFin: r.horaInicio && r.horaFin ? r.horaFin : aHora(JORNADA.fin),
  }
}

function normalizarBloqueo(b: BloqueoGuardado): FechaBloqueada {
  return { ...b, id: b.id ?? `B-${b.fecha}-${b.horaInicio ?? 'dia'}` }
}

// ---------- Lectura ----------

export function leerReservas(): ResultadoLectura<Reserva> {
  const r = leerLista(CLAVES.reservas, esReservaGuardada)
  return { ...r, datos: r.datos.map(normalizarReserva) }
}

export function leerBloqueos(): ResultadoLectura<FechaBloqueada> {
  const r = leerLista(CLAVES.bloqueos, esBloqueoGuardado)
  return { ...r, datos: r.datos.map(normalizarBloqueo) }
}

// ---------- Reglas de disponibilidad ----------

/** Las reservas pendientes y confirmadas ocupan su horario; las canceladas no. */
export function ocupaFecha(estado: EstadoReserva): boolean {
  return estado !== 'cancelada'
}

export const esBloqueoDiaCompleto = (b: FechaBloqueada) => !b.horaInicio

export function intervaloDe(x: { horaInicio?: string; horaFin?: string }): Intervalo {
  return x.horaInicio && x.horaFin
    ? { inicio: aMinutos(x.horaInicio), fin: aMinutos(x.horaFin) }
    : { inicio: JORNADA.inicio, fin: JORNADA.fin }
}

export function reservasActivasDelDia(fecha: string, reservas: Reserva[], excluirId?: string): Reserva[] {
  return reservas
    .filter((r) => r.fecha === fecha && ocupaFecha(r.estado) && r.id !== excluirId)
    .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio))
}

export function bloqueosDelDia(fecha: string, bloqueos: FechaBloqueada[]): FechaBloqueada[] {
  return bloqueos.filter((b) => b.fecha === fecha).sort((a, b) => (a.horaInicio ?? '').localeCompare(b.horaInicio ?? ''))
}

export function bloqueoDiaCompleto(fecha: string, bloqueos: FechaBloqueada[]): FechaBloqueada | undefined {
  return bloqueos.find((b) => b.fecha === fecha && esBloqueoDiaCompleto(b))
}

/** Explica por qué la franja no está libre, o devuelve null si lo está. */
export function conflictoEnFranja(
  fecha: string,
  franja: Intervalo,
  reservas: Reserva[],
  bloqueos: FechaBloqueada[],
  opciones: { excluirReservaId?: string; excluirBloqueoId?: string } = {},
): string | null {
  const dia = bloqueos.find((b) => b.fecha === fecha && esBloqueoDiaCompleto(b) && b.id !== opciones.excluirBloqueoId)
  if (dia) return `el día está bloqueado${dia.motivo ? ` (${dia.motivo})` : ''}`
  const reserva = reservasActivasDelDia(fecha, reservas, opciones.excluirReservaId).find((r) => solapan(intervaloDe(r), franja))
  if (reserva) return `se superpone con la reserva ${reserva.id} de ${reserva.nombre} (${reserva.horaInicio} a ${reserva.horaFin} h)`
  const bloqueo = bloqueos.find(
    (b) => b.fecha === fecha && !esBloqueoDiaCompleto(b) && b.id !== opciones.excluirBloqueoId && solapan(intervaloDe(b), franja),
  )
  if (bloqueo) return `se superpone con un bloqueo de ${bloqueo.horaInicio} a ${bloqueo.horaFin} h${bloqueo.motivo ? ` (${bloqueo.motivo})` : ''}`
  return null
}

/** Horarios de inicio libres para un turno de la duración indicada. */
export function horariosDisponibles(
  fecha: string,
  duracionHoras: number,
  reservas: Reserva[],
  bloqueos: FechaBloqueada[],
  ahora = new Date(),
): string[] {
  const hoy = aFechaISO(ahora)
  if (esPasada(fecha, hoy) || bloqueoDiaCompleto(fecha, bloqueos)) return []
  const duracion = Math.round(duracionHoras * 60)
  const minimo = fecha === hoy ? minutosDe(ahora) : -1
  const libres: string[] = []
  for (let inicio = JORNADA.inicio; inicio + duracion <= JORNADA.fin; inicio += JORNADA.paso) {
    if (inicio <= minimo) continue
    if (!conflictoEnFranja(fecha, { inicio, fin: inicio + duracion }, reservas, bloqueos)) libres.push(aHora(inicio))
  }
  return libres
}

/** Tramos de la jornada sin reservas activas ni bloqueos. */
export function franjasLibres(fecha: string, reservas: Reserva[], bloqueos: FechaBloqueada[]): Intervalo[] {
  if (bloqueoDiaCompleto(fecha, bloqueos)) return []
  const ocupados = [...reservasActivasDelDia(fecha, reservas), ...bloqueosDelDia(fecha, bloqueos)]
    .map(intervaloDe)
    .sort((a, b) => a.inicio - b.inicio)
  const libres: Intervalo[] = []
  let cursor = JORNADA.inicio
  for (const o of ocupados) {
    if (o.inicio > cursor) libres.push({ inicio: cursor, fin: o.inicio })
    cursor = Math.max(cursor, o.fin)
  }
  if (cursor < JORNADA.fin) libres.push({ inicio: cursor, fin: JORNADA.fin })
  return libres
}

/**
 * Estado del día para el calendario. Con duración, "ocupada" significa que
 * no entra ningún turno de esa duración; sin ella se usa la unidad mínima.
 */
export function estadoDeFecha(
  fecha: string,
  reservas: Reserva[],
  bloqueos: FechaBloqueada[],
  duracionHoras = JORNADA.paso / 60,
  ahora = new Date(),
): EstadoDia {
  if (esPasada(fecha, aFechaISO(ahora))) return 'pasada'
  if (bloqueoDiaCompleto(fecha, bloqueos)) return 'bloqueada'
  if (horariosDisponibles(fecha, duracionHoras, reservas, bloqueos, ahora).length === 0) return 'ocupada'
  const hayOcupacion = reservasActivasDelDia(fecha, reservas).length > 0 || bloqueosDelDia(fecha, bloqueos).length > 0
  return hayOcupacion ? 'parcial' : 'disponible'
}

/** Comprueba un turno concreto. Devuelve el motivo si no está disponible. */
export function comprobarTurno(
  fecha: string,
  horaInicio: string,
  horaFin: string,
  reservas: Reserva[],
  bloqueos: FechaBloqueada[],
  ahora = new Date(),
): string | null {
  const hoy = aFechaISO(ahora)
  if (!esFechaISOValida(fecha)) return 'La fecha no es válida.'
  if (esPasada(fecha, hoy)) return 'Esa fecha ya pasó. Elegí una fecha futura.'
  if (!esHoraValida(horaInicio) || !esHoraValida(horaFin)) return 'El horario no es válido.'
  const franja = { inicio: aMinutos(horaInicio), fin: aMinutos(horaFin) }
  if (franja.inicio < JORNADA.inicio || franja.fin > JORNADA.fin || franja.fin <= franja.inicio) {
    return `El turno tiene que empezar y terminar dentro del horario de trabajo (${textoJornada()}).`
  }
  if (fecha === hoy && franja.inicio <= minutosDe(ahora)) return 'Ese horario ya pasó. Elegí otro horario.'
  if (bloqueoDiaCompleto(fecha, bloqueos)) return 'Esa fecha no está disponible para reservas. Elegí otra fecha.'
  if (conflictoEnFranja(fecha, franja, reservas, bloqueos)) return 'Ese horario ya no está disponible. Elegí otro horario u otra fecha.'
  return null
}

// ---------- Reservas ----------

const ALFABETO_CODIGO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export function generarCodigo(prefijo: string, existentes: Set<string>): string {
  for (;;) {
    const bytes = crypto.getRandomValues(new Uint8Array(6))
    const codigo = `${prefijo}-` + Array.from(bytes, (b) => ALFABETO_CODIGO[b % ALFABETO_CODIGO.length]).join('')
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
    horaInicio: entrada.horaInicio,
    notas: entrada.notas.trim(),
  }
  const ahora = new Date()
  leerHorario()
  const errores = validarDatosReserva(datos, aFechaISO(ahora))
  if (Object.keys(errores).length > 0) {
    throw new ErrorReserva('VALIDACION', 'Revisá los datos marcados antes de confirmar.', errores)
  }

  const servicio = leerServicios().datos.find((s) => s.id === datos.servicioId)!
  const horaFin = sumarHoras(datos.horaInicio, servicio.duracionHoras)
  const reservas = leerReservas().datos
  const bloqueos = leerBloqueos().datos
  const motivo = comprobarTurno(datos.fecha, datos.horaInicio, horaFin, reservas, bloqueos, ahora)
  if (motivo) throw new ErrorReserva('NO_DISPONIBLE', motivo)

  const reserva: Reserva = {
    ...datos,
    horaFin,
    id: generarCodigo('LB', new Set(reservas.map((r) => r.id))),
    servicioNombre: servicio.nombre,
    estado: 'pendiente',
    creadaEn: ahora.toISOString(),
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
    const conflicto = conflictoEnFranja(reserva.fecha, intervaloDe(reserva), reservas, leerBloqueos().datos, {
      excluirReservaId: reserva.id,
    })
    if (conflicto) {
      throw new ErrorReserva(
        'CONFLICTO',
        `No se puede pasar a "${ETIQUETA_ESTADO[nuevoEstado]}": el turno del ${formatearFechaLarga(reserva.fecha)} (${reserva.horaInicio} a ${reserva.horaFin} h) ${conflicto}.`,
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

/** Bloquea el día completo (franja null) o una franja horaria. */
export function bloquear(fecha: string, franja: FranjaHoraria | null, motivo?: string): FechaBloqueada {
  leerHorario()
  if (!esFechaISOValida(fecha)) throw new ErrorReserva('VALIDACION', 'Elegí una fecha válida.')
  if (esPasada(fecha, aFechaISO(new Date()))) throw new ErrorReserva('VALIDACION', 'No se pueden bloquear fechas pasadas.')
  if (franja) {
    if (!esHoraValida(franja.horaInicio) || !esHoraValida(franja.horaFin)) {
      throw new ErrorReserva('VALIDACION', 'Elegí la hora de inicio y la de fin.')
    }
    const { inicio, fin } = intervaloDe(franja)
    if (fin <= inicio) throw new ErrorReserva('VALIDACION', 'La hora de fin tiene que ser posterior a la de inicio.')
    if (inicio < JORNADA.inicio || fin > JORNADA.fin) {
      throw new ErrorReserva('VALIDACION', `La franja tiene que estar dentro del horario de trabajo (${textoJornada()}).`)
    }
  }
  const motivoLimpio = motivo?.trim().slice(0, MAX_MOTIVO_BLOQUEO) || undefined

  const reservas = leerReservas().datos
  const bloqueos = leerBloqueos().datos
  if (franja) {
    const conflicto = conflictoEnFranja(fecha, intervaloDe(franja), reservas, bloqueos)
    if (conflicto) throw new ErrorReserva('CONFLICTO', `No se puede bloquear esa franja: ${conflicto}.`)
  } else {
    const activas = reservasActivasDelDia(fecha, reservas)
    if (activas.length > 0) {
      throw new ErrorReserva(
        'CONFLICTO',
        `No se puede bloquear el día: tiene ${activas.length} reserva(s) activa(s) (${activas.map((r) => r.id).join(', ')}).`,
      )
    }
    if (bloqueoDiaCompleto(fecha, bloqueos)) throw new ErrorReserva('CONFLICTO', 'Ese día ya está bloqueado.')
    if (bloqueosDelDia(fecha, bloqueos).length > 0) {
      throw new ErrorReserva('CONFLICTO', 'Ese día ya tiene franjas bloqueadas. Eliminalas antes de bloquear el día completo.')
    }
  }

  const bloqueo: FechaBloqueada = {
    id: generarCodigo('B', new Set(bloqueos.map((b) => b.id))),
    fecha,
    ...(franja && { horaInicio: franja.horaInicio, horaFin: franja.horaFin }),
    ...(motivoLimpio && { motivo: motivoLimpio }),
    creadaEn: new Date().toISOString(),
  }
  escribirLista(
    CLAVES.bloqueos,
    [...bloqueos, bloqueo].sort((a, b) => a.fecha.localeCompare(b.fecha) || (a.horaInicio ?? '').localeCompare(b.horaInicio ?? '')),
  )
  return bloqueo
}

export function eliminarBloqueo(id: string): void {
  const reservas = leerReservas().datos
  const bloqueos = leerBloqueos().datos
  const bloqueo = bloqueos.find((b) => b.id === id)
  if (!bloqueo) throw new ErrorReserva('NO_ENCONTRADA', 'Ese bloqueo ya no existe.')
  const activa = reservasActivasDelDia(bloqueo.fecha, reservas).find((r) => solapan(intervaloDe(r), intervaloDe(bloqueo)))
  if (activa) {
    throw new ErrorReserva(
      'CONFLICTO',
      `No se puede eliminar: el bloqueo coincide con la reserva activa ${activa.id}. Para liberar ese horario, cancelá la reserva.`,
    )
  }
  escribirLista(
    CLAVES.bloqueos,
    bloqueos.filter((b) => b.id !== id),
  )
}

// ---------- Estadísticas y datos de ejemplo ----------

export function calcularEstadisticas(reservas: Reserva[], hoy = aFechaISO(new Date())): Estadisticas {
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
