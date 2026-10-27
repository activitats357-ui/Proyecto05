/**
 * Utilidades de fechas. Internamente las fechas son cadenas "YYYY-MM-DD"
 * en hora local: nunca se convierten con new Date("YYYY-MM-DD"), que las
 * interpreta como UTC y puede correr el día según la zona horaria.
 */

const RE_FECHA = /^(\d{4})-(\d{2})-(\d{2})$/
const LOCALE = 'es-PY'

export interface MesCalendario {
  anio: number
  /** 0 = enero … 11 = diciembre */
  mes: number
}

export function aFechaISO(fecha: Date): string {
  const y = fecha.getFullYear()
  const m = String(fecha.getMonth() + 1).padStart(2, '0')
  const d = String(fecha.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function hoyISO(): string {
  return aFechaISO(new Date())
}

/** Devuelve la fecha local a las 12:00 (evita saltos por cambio de horario) o null si no es válida. */
export function parsearFechaISO(iso: string): Date | null {
  const m = RE_FECHA.exec(iso)
  if (!m) return null
  const [anio, mes, dia] = [Number(m[1]), Number(m[2]), Number(m[3])]
  const fecha = new Date(anio, mes - 1, dia, 12)
  if (fecha.getFullYear() !== anio || fecha.getMonth() !== mes - 1 || fecha.getDate() !== dia) return null
  return fecha
}

export function esFechaISOValida(valor: unknown): valor is string {
  return typeof valor === 'string' && parsearFechaISO(valor) !== null
}

export function sumarDias(iso: string, dias: number): string {
  const fecha = parsearFechaISO(iso)
  if (!fecha) throw new Error(`Fecha inválida: ${iso}`)
  fecha.setDate(fecha.getDate() + dias)
  return aFechaISO(fecha)
}

/** Las cadenas YYYY-MM-DD se comparan correctamente en orden lexicográfico. */
export function esPasada(iso: string, hoy = hoyISO()): boolean {
  return iso < hoy
}

const capitalizar = (texto: string) => texto.charAt(0).toUpperCase() + texto.slice(1)

const fmtLarga = new Intl.DateTimeFormat(LOCALE, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
const fmtCorta = new Intl.DateTimeFormat(LOCALE, { day: 'numeric', month: 'short', year: 'numeric' })
const fmtMes = new Intl.DateTimeFormat(LOCALE, { month: 'long', year: 'numeric' })
const fmtFechaHora = new Intl.DateTimeFormat(LOCALE, { dateStyle: 'medium', timeStyle: 'short' })

/** "Sábado, 14 de noviembre de 2026" */
export function formatearFechaLarga(iso: string): string {
  const fecha = parsearFechaISO(iso)
  return fecha ? capitalizar(fmtLarga.format(fecha)) : iso
}

/** "14 nov 2026" */
export function formatearFechaCorta(iso: string): string {
  const fecha = parsearFechaISO(iso)
  return fecha ? fmtCorta.format(fecha) : iso
}

export function formatearFechaHora(isoCompleto: string): string {
  const fecha = new Date(isoCompleto)
  return Number.isNaN(fecha.getTime()) ? '—' : fmtFechaHora.format(fecha)
}

export function mesDeFecha(iso: string): MesCalendario {
  const fecha = parsearFechaISO(iso) ?? new Date()
  return { anio: fecha.getFullYear(), mes: fecha.getMonth() }
}

export function sumarMeses({ anio, mes }: MesCalendario, n: number): MesCalendario {
  const total = anio * 12 + mes + n
  return { anio: Math.floor(total / 12), mes: ((total % 12) + 12) % 12 }
}

export function nombreMes({ anio, mes }: MesCalendario): string {
  return capitalizar(fmtMes.format(new Date(anio, mes, 1, 12)))
}

export function fechaEnMes(iso: string, { anio, mes }: MesCalendario): boolean {
  return iso.startsWith(`${anio}-${String(mes + 1).padStart(2, '0')}-`)
}

export const DIAS_SEMANA = [
  { corto: 'Lun', largo: 'Lunes' },
  { corto: 'Mar', largo: 'Martes' },
  { corto: 'Mié', largo: 'Miércoles' },
  { corto: 'Jue', largo: 'Jueves' },
  { corto: 'Vie', largo: 'Viernes' },
  { corto: 'Sáb', largo: 'Sábado' },
  { corto: 'Dom', largo: 'Domingo' },
]

/** Semanas del mes (lunes a domingo). Los huecos fuera del mes son null. */
export function semanasDelMes({ anio, mes }: MesCalendario): (string | null)[][] {
  const diasEnMes = new Date(anio, mes + 1, 0).getDate()
  const desfase = (new Date(anio, mes, 1).getDay() + 6) % 7
  const celdas: (string | null)[] = Array.from({ length: desfase }, () => null)
  for (let d = 1; d <= diasEnMes; d++) celdas.push(aFechaISO(new Date(anio, mes, d, 12)))
  while (celdas.length % 7 !== 0) celdas.push(null)
  const semanas: (string | null)[][] = []
  for (let i = 0; i < celdas.length; i += 7) semanas.push(celdas.slice(i, i + 7))
  return semanas
}
