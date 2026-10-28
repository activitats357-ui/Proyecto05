/**
 * Datos de demostración. Se insertan solo si las claves no existen todavía
 * en localStorage, de modo que nunca se pisan datos guardados por el usuario.
 * Todos los registros llevan esDemo: true para poder quitarlos después.
 */
import { SERVICIOS_BASE, type ServicioId } from '../data/servicios'
import { CLAVES, eliminarClave, escribirLista, escribirObjeto, existeClave } from '../lib/almacenamiento'
import { hoyISO, sumarDias } from '../lib/fechas'
import { jornadaDe, sumarHoras } from '../lib/horas'
import type { EstadoReserva, FechaBloqueada, FranjaHoraria, Reserva } from '../types'
import { inicializarCatalogo, leerHorario } from './catalogo'
import { conflictoEnFranja, intervaloDe, leerBloqueos, leerReservas, reservasActivasDelDia } from './reservas'

const VERSION_DATOS = 2

interface ReservaDemo {
  codigo: string
  dias: number
  hora: string
  servicioId: ServicioId
  estado: EstadoReserva
  nombre: string
  celular: string
  email: string
  notas: string
}

// Identidades ficticias, teléfonos y correos de prueba (dominio reservado ejemplo.com).
const RESERVAS_DEMO: ReservaDemo[] = [
  { codigo: 'LB-DEMO01', dias: 9, hora: '14:00', servicioId: 'bodas', estado: 'confirmada', nombre: 'Camila Fernández (demo)', celular: '+595 900 000 101', email: 'camila.demo@ejemplo.com', notas: 'Ceremonia por la tarde y fiesta en un salón cerca de la costanera.' },
  { codigo: 'LB-DEMO02', dias: 16, hora: '10:00', servicioId: 'retratos', estado: 'pendiente', nombre: 'Sofía Giménez (demo)', celular: '+595 900 000 102', email: 'sofia.demo@ejemplo.com', notas: 'Retratos para renovar mi imagen profesional.' },
  { codigo: 'LB-DEMO03', dias: 23, hora: '17:00', servicioId: 'premama-familia', estado: 'cancelada', nombre: 'Valentina Ortiz (demo)', celular: '+595 900 000 103', email: 'valentina.demo@ejemplo.com', notas: '' },
  { codigo: 'LB-DEMO04', dias: 30, hora: '18:00', servicioId: 'eventos', estado: 'pendiente', nombre: 'Martín Acosta (demo)', celular: '+595 900 000 104', email: 'martin.demo@ejemplo.com', notas: 'Aniversario de empresa, aproximadamente 80 invitados.' },
  { codigo: 'LB-DEMO05', dias: 44, hora: '12:00', servicioId: 'bodas', estado: 'confirmada', nombre: 'Lucía Benítez (demo)', celular: '+595 900 000 105', email: 'lucia.demo@ejemplo.com', notas: 'Boda civil al mediodía y almuerzo familiar.' },
  { codigo: 'LB-DEMO06', dias: 58, hora: '09:00', servicioId: 'premama-familia', estado: 'pendiente', nombre: 'Rocío Duarte (demo)', celular: '+595 900 000 106', email: 'rocio.demo@ejemplo.com', notas: 'Sesión premamá al aire libre, si el clima acompaña.' },
]

const BLOQUEOS_DEMO: { dias: number; motivo: string; horaInicio?: string; horaFin?: string }[] = [
  { dias: 6, motivo: 'Descanso personal' },
  { dias: 16, motivo: 'Compromiso profesional', horaInicio: '15:00', horaFin: '19:00' },
  { dias: 20, motivo: 'Fecha no laborable' },
]

/**
 * Primer día desde la fecha indicada (máximo una semana después) en el que
 * se trabaja y entra la franja; null si ninguno sirve con el horario vigente.
 */
function proximoDiaQueEntra(desde: string, franja: FranjaHoraria | null): string | null {
  for (let i = 0; i < 7; i++) {
    const fecha = sumarDias(desde, i)
    const jornada = jornadaDe(fecha)
    if (!jornada) continue
    if (!franja) return fecha
    const { inicio, fin } = intervaloDe(franja)
    if (inicio >= jornada.inicio && fin <= jornada.fin) return fecha
  }
  return null
}

function haceDias(dias: number): string {
  return new Date(Date.now() - dias * 86_400_000).toISOString()
}

/** Claves de contenido que vuelven a su estado inicial al restablecer la demo. */
const CLAVES_DE_CONTENIDO = [
  CLAVES.reservas,
  CLAVES.bloqueos,
  CLAVES.servicios,
  CLAVES.etiquetas,
  CLAVES.galeria,
  CLAVES.horario,
  CLAVES.configuracion,
]

/**
 * Borra reservas, bloqueos, servicios, horario, galería y etiquetas y vuelve
 * a crear los datos de demostración. La cuenta (correo y contraseña) no se toca.
 */
export function restablecerDatosDemo(): void {
  CLAVES_DE_CONTENIDO.forEach(eliminarClave)
  const aviso = inicializarDatosDemo()
  if (aviso) throw new Error(aviso)
}

/** Inicializa los datos de ejemplo una sola vez. Devuelve un aviso si no se pudo. */
export function inicializarDatosDemo(): string | undefined {
  try {
    inicializarCatalogo()
    leerHorario()
    const hoy = hoyISO()
    const faltanReservas = !existeClave(CLAVES.reservas)
    const faltanBloqueos = !existeClave(CLAVES.bloqueos)

    if (faltanReservas) {
      const bloqueos = leerBloqueos().datos
      const reservas = RESERVAS_DEMO.map((d, i): Reserva | null => {
        const servicio = SERVICIOS_BASE.find((s) => s.id === d.servicioId)!
        const franja = { horaInicio: d.hora, horaFin: sumarHoras(d.hora, servicio.duracionHoras) }
        const fecha = proximoDiaQueEntra(sumarDias(hoy, d.dias), franja)
        if (!fecha) return null
        return {
          id: d.codigo,
          nombre: d.nombre,
          celular: d.celular,
          email: d.email,
          servicioId: d.servicioId,
          servicioNombre: servicio.nombre,
          fecha,
          ...franja,
          notas: d.notas,
          estado: d.estado,
          creadaEn: haceDias(12 - i),
          esDemo: true,
        }
      })
        .filter((r): r is Reserva => r !== null)
        .filter((r) => r.estado === 'cancelada' || !conflictoEnFranja(r.fecha, intervaloDe(r), [], bloqueos))
      escribirLista(CLAVES.reservas, reservas)
    }

    if (faltanBloqueos) {
      const reservas = leerReservas().datos
      const bloqueos = BLOQUEOS_DEMO.map((b, i): FechaBloqueada | null => {
        const franja = b.horaInicio && b.horaFin ? { horaInicio: b.horaInicio, horaFin: b.horaFin } : null
        const fecha = proximoDiaQueEntra(sumarDias(hoy, b.dias), franja)
        if (!fecha) return null
        return {
          id: `B-DEMO0${i + 1}`,
          fecha,
          ...franja,
          motivo: b.motivo,
          creadaEn: haceDias(14),
          esDemo: true,
        }
      })
        .filter((b): b is FechaBloqueada => b !== null)
        .filter((b) =>
        b.horaInicio ? !conflictoEnFranja(b.fecha, intervaloDe(b), reservas, []) : reservasActivasDelDia(b.fecha, reservas).length === 0,
      )
      escribirLista(CLAVES.bloqueos, bloqueos)
    }

    if (!existeClave(CLAVES.configuracion)) {
      escribirObjeto(CLAVES.configuracion, {
        version: VERSION_DATOS,
        inicializadoEn: new Date().toISOString(),
        datosDemoInsertados: faltanReservas || faltanBloqueos,
      })
    }
    return undefined
  } catch (e) {
    return e instanceof Error ? e.message : 'No se pudieron preparar los datos de demostración.'
  }
}
