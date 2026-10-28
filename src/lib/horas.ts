/**
 * Utilidades de horas. Internamente las horas son cadenas "HH:MM" y los
 * cálculos se hacen en minutos desde la medianoche.
 */
import { CONFIG } from '../config'

const RE_HORA = /^(?:([01]\d|2[0-3]):([0-5]\d)|24:00)$/

export interface Intervalo {
  /** Minutos desde la medianoche (inclusive). */
  inicio: number
  /** Minutos desde la medianoche (exclusive). */
  fin: number
}

export function esHoraValida(valor: unknown): valor is string {
  return typeof valor === 'string' && RE_HORA.test(valor)
}

export function aMinutos(hora: string): number {
  const [h, m] = hora.split(':').map(Number)
  return h * 60 + m
}

export function aHora(minutos: number): string {
  return `${String(Math.floor(minutos / 60)).padStart(2, '0')}:${String(minutos % 60).padStart(2, '0')}`
}

/**
 * Horario de trabajo vigente, en minutos. Arranca con los valores de
 * config.ts y se actualiza con fijarJornada() al leer el horario guardado
 * desde el panel. Ningún turno ni bloqueo puede salirse de este rango.
 */
export const JORNADA = {
  inicio: aMinutos(CONFIG.agenda.horaInicio),
  fin: aMinutos(CONFIG.agenda.horaFin),
  paso: CONFIG.agenda.intervaloMinutos,
}

export function fijarJornada(horaInicio: string, horaFin: string): void {
  JORNADA.inicio = aMinutos(horaInicio)
  JORNADA.fin = aMinutos(horaFin)
}

export const DURACION_MINIMA_HORAS = JORNADA.paso / 60

export function duracionMaximaHoras(): number {
  return (JORNADA.fin - JORNADA.inicio) / 60
}

/** "08:00 a 22:00 h" para el horario de trabajo vigente. */
export function textoJornada(): string {
  return formatearFranja(aHora(JORNADA.inicio), aHora(JORNADA.fin))
}

/** Todas las horas del día a intervalos regulares (00:00 a 24:00). */
export function horasDelDia(): string[] {
  const horas: string[] = []
  for (let m = 0; m <= 24 * 60; m += JORNADA.paso) horas.push(aHora(m))
  return horas
}

export function solapan(a: Intervalo, b: Intervalo): boolean {
  return a.inicio < b.fin && b.inicio < a.fin
}

export function minutosDe(fecha: Date): number {
  return fecha.getHours() * 60 + fecha.getMinutes()
}

export function sumarHoras(hora: string, horas: number): string {
  return aHora(aMinutos(hora) + Math.round(horas * 60))
}

/** "1 hora", "8 horas", "1 h 30 min", "30 minutos" */
export function formatearDuracion(horas: number): string {
  const total = Math.round(horas * 60)
  const h = Math.floor(total / 60)
  const m = total % 60
  if (!m) return h === 1 ? '1 hora' : `${h} horas`
  if (!h) return `${m} minutos`
  return `${h} h ${m} min`
}

/** "15:00 a 23:00 h" */
export function formatearFranja(inicio: string, fin: string): string {
  return `${inicio} a ${fin} h`
}

export function duracionEntre(inicio: string, fin: string): number {
  return (aMinutos(fin) - aMinutos(inicio)) / 60
}
