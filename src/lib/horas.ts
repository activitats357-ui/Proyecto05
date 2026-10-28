/**
 * Utilidades de horas. Internamente las horas son cadenas "HH:MM" y los
 * cálculos se hacen en minutos desde la medianoche.
 */
import { CONFIG } from '../config'
import type { HorarioSemanal } from '../types'

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

export const JORNADA = {
  /** Separación entre horarios de inicio y unidad mínima de duración. */
  paso: CONFIG.agenda.intervaloMinutos,
}

export const DURACION_MINIMA_HORAS = JORNADA.paso / 60

// ---------- Horario semanal ----------

export const NOMBRES_DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

export function horarioPorDefecto(): HorarioSemanal {
  const laborables: readonly number[] = CONFIG.agenda.diasLaborables
  return NOMBRES_DIAS.map((_, i) => ({
    abierto: laborables.includes(i),
    horaInicio: CONFIG.agenda.horaInicio,
    horaFin: CONFIG.agenda.horaFin,
  }))
}

/**
 * Horario semanal vigente. Arranca con config.ts y se actualiza con
 * fijarHorarioSemanal() al leer el horario guardado desde el panel.
 * Ningún turno ni bloqueo puede salirse del horario de su día.
 */
let horarioVigente: HorarioSemanal = horarioPorDefecto()

export function fijarHorarioSemanal(horario: HorarioSemanal): void {
  horarioVigente = horario.map((d) => ({ ...d }))
}

/** 0 = lunes … 6 = domingo. */
export function diaDeLaSemana(fecha: string): number {
  const [anio, mes, dia] = fecha.split('-').map(Number)
  return (new Date(anio, mes - 1, dia, 12).getDay() + 6) % 7
}

/** Horario de trabajo de esa fecha, o null si ese día no se trabaja. */
export function jornadaDe(fecha: string): Intervalo | null {
  const dia = horarioVigente[diaDeLaSemana(fecha)]
  return dia?.abierto ? { inicio: aMinutos(dia.horaInicio), fin: aMinutos(dia.horaFin) } : null
}

/** Duración del día abierto más largo, en horas. */
export function duracionMaximaHoras(): number {
  return Math.max(0, ...horarioVigente.filter((d) => d.abierto).map((d) => duracionEntre(d.horaInicio, d.horaFin)))
}

/** "08:00 a 20:00 h", o "cerrado" si ese día no se trabaja. */
export function textoJornadaDe(fecha: string): string {
  const j = jornadaDe(fecha)
  return j ? formatearFranja(aHora(j.inicio), aHora(j.fin)) : 'cerrado'
}

/** Resumen legible: "Lunes a viernes, 08:00 a 20:00 h · Sábado, 09:00 a 13:00 h". */
export function resumenHorario(horario: HorarioSemanal): string {
  const grupos: { desde: number; hasta: number; texto: string }[] = []
  horario.forEach((d, i) => {
    if (!d.abierto) return
    const texto = formatearFranja(d.horaInicio, d.horaFin)
    const ultimo = grupos.at(-1)
    if (ultimo && ultimo.hasta === i - 1 && ultimo.texto === texto) ultimo.hasta = i
    else grupos.push({ desde: i, hasta: i, texto })
  })
  if (grupos.length === 0) return 'Sin días de atención'
  return grupos
    .map((g) => {
      const dias =
        g.desde === g.hasta
          ? NOMBRES_DIAS[g.desde]
          : `${NOMBRES_DIAS[g.desde]} a ${NOMBRES_DIAS[g.hasta].toLowerCase()}`
      return `${dias}, ${g.texto}`
    })
    .join(' · ')
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
