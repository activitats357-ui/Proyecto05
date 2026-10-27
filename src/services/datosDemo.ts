/**
 * Datos de demostración. Se insertan solo si las claves no existen todavía
 * en localStorage, de modo que nunca se pisan datos guardados por el usuario.
 * Todos los registros llevan esDemo: true para poder quitarlos después.
 */
import { buscarServicio, type ServicioId } from '../data/servicios'
import { CLAVES, escribirLista, escribirObjeto, existeClave } from '../lib/almacenamiento'
import { hoyISO, sumarDias } from '../lib/fechas'
import type { EstadoReserva, FechaBloqueada, Reserva } from '../types'
import { bloqueoEn, leerBloqueos, leerReservas, reservaActivaEn } from './reservas'

const VERSION_DATOS = 1

interface ReservaDemo {
  codigo: string
  dias: number
  servicioId: ServicioId
  estado: EstadoReserva
  nombre: string
  celular: string
  email: string
  notas: string
}

// Identidades ficticias, teléfonos y correos de prueba (dominio reservado ejemplo.com).
const RESERVAS_DEMO: ReservaDemo[] = [
  { codigo: 'LB-DEMO01', dias: 9, servicioId: 'bodas', estado: 'confirmada', nombre: 'Camila Fernández (demo)', celular: '+595 900 000 101', email: 'camila.demo@ejemplo.com', notas: 'Ceremonia por la tarde y fiesta en un salón cerca de la costanera.' },
  { codigo: 'LB-DEMO02', dias: 16, servicioId: 'retratos', estado: 'pendiente', nombre: 'Sofía Giménez (demo)', celular: '+595 900 000 102', email: 'sofia.demo@ejemplo.com', notas: 'Retratos para renovar mi imagen profesional.' },
  { codigo: 'LB-DEMO03', dias: 23, servicioId: 'premama-familia', estado: 'cancelada', nombre: 'Valentina Ortiz (demo)', celular: '+595 900 000 103', email: 'valentina.demo@ejemplo.com', notas: '' },
  { codigo: 'LB-DEMO04', dias: 30, servicioId: 'eventos', estado: 'pendiente', nombre: 'Martín Acosta (demo)', celular: '+595 900 000 104', email: 'martin.demo@ejemplo.com', notas: 'Aniversario de empresa, aproximadamente 80 invitados.' },
  { codigo: 'LB-DEMO05', dias: 44, servicioId: 'bodas', estado: 'confirmada', nombre: 'Lucía Benítez (demo)', celular: '+595 900 000 105', email: 'lucia.demo@ejemplo.com', notas: 'Boda civil al mediodía y almuerzo familiar.' },
  { codigo: 'LB-DEMO06', dias: 58, servicioId: 'premama-familia', estado: 'pendiente', nombre: 'Rocío Duarte (demo)', celular: '+595 900 000 106', email: 'rocio.demo@ejemplo.com', notas: 'Sesión premamá al aire libre, si el clima acompaña.' },
]

const BLOQUEOS_DEMO = [
  { dias: 6, motivo: 'Descanso personal' },
  { dias: 20, motivo: 'Fecha no laborable' },
  { dias: 37, motivo: 'Compromiso profesional' },
]

function haceDias(dias: number): string {
  return new Date(Date.now() - dias * 86_400_000).toISOString()
}

/** Inicializa los datos de ejemplo una sola vez. Devuelve un aviso si no se pudo. */
export function inicializarDatosDemo(): string | undefined {
  try {
    const hoy = hoyISO()
    const faltanReservas = !existeClave(CLAVES.reservas)
    const faltanBloqueos = !existeClave(CLAVES.bloqueos)

    if (faltanReservas) {
      const bloqueos = leerBloqueos().datos
      const reservas: Reserva[] = RESERVAS_DEMO.map((d, i) => ({
        id: d.codigo,
        nombre: d.nombre,
        celular: d.celular,
        email: d.email,
        servicioId: d.servicioId,
        servicioNombre: buscarServicio(d.servicioId)!.nombre,
        fecha: sumarDias(hoy, d.dias),
        notas: d.notas,
        estado: d.estado,
        creadaEn: haceDias(12 - i),
        esDemo: true,
      })).filter((r) => r.estado === 'cancelada' || !bloqueoEn(r.fecha, bloqueos))
      escribirLista(CLAVES.reservas, reservas)
    }

    if (faltanBloqueos) {
      const reservas = leerReservas().datos
      const bloqueos: FechaBloqueada[] = BLOQUEOS_DEMO.map((b) => ({
        fecha: sumarDias(hoy, b.dias),
        motivo: b.motivo,
        creadaEn: haceDias(14),
        esDemo: true,
      })).filter((b) => !reservaActivaEn(b.fecha, reservas))
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
