import { createContext, useContext } from 'react'
import type { Servicio, ServicioId } from '../data/servicios'
import type {
  DatosNuevaReserva,
  EstadoDia,
  EstadoReserva,
  Etiqueta,
  FechaBloqueada,
  FotoGaleria,
  FranjaHoraria,
  HorarioSemanal,
  Reserva,
} from '../types'

export interface ValorDatos {
  reservas: Reserva[]
  bloqueos: FechaBloqueada[]
  servicios: Servicio[]
  etiquetas: Etiqueta[]
  galeria: FotoGaleria[]
  /** Horario semanal de trabajo: los turnos deben empezar y terminar dentro del horario de su día. */
  horario: HorarioSemanal
  /** Fecha actual (YYYY-MM-DD); se recalcula al volver a la pestaña. */
  hoy: string
  /** Avisos de almacenamiento (datos dañados, errores de lectura). */
  avisos: string[]
  descartarAvisos: () => void

  buscarServicio: (id: string) => Servicio | undefined
  /** Estado del día; con duración, considera si entra un turno de ese largo. */
  estadoDeFecha: (fecha: string, duracionHoras?: number) => EstadoDia
  horariosDisponibles: (fecha: string, duracionHoras: number) => string[]

  crearReserva: (datos: DatosNuevaReserva) => Reserva
  cambiarEstado: (id: string, estado: EstadoReserva) => Reserva
  bloquear: (fecha: string, franja: FranjaHoraria | null, motivo?: string) => FechaBloqueada
  eliminarBloqueo: (id: string) => void
  eliminarDatosDemo: () => { reservas: number; bloqueos: number }
  /** Vuelve todo el contenido al estado inicial de demostración (no toca la cuenta). */
  restablecerDatosDemo: () => void

  actualizarServicio: (id: ServicioId, nombre: string, duracionHoras: number) => Servicio
  actualizarHorario: (horario: HorarioSemanal) => HorarioSemanal
  crearEtiqueta: (nombre: string) => Etiqueta
  renombrarEtiqueta: (id: string, nombre: string) => Etiqueta
  eliminarEtiqueta: (id: string) => number
  agregarFoto: (datos: Pick<FotoGaleria, 'src' | 'alt' | 'etiquetas' | 'proporcion'>) => FotoGaleria
  actualizarFoto: (id: string, cambios: Partial<Pick<FotoGaleria, 'alt' | 'etiquetas'>>) => FotoGaleria
  eliminarFoto: (id: string) => void
  moverFoto: (id: string, direccion: -1 | 1) => void
}

export const ContextoDatos = createContext<ValorDatos | null>(null)

export function useDatos(): ValorDatos {
  const valor = useContext(ContextoDatos)
  if (!valor) throw new Error('useDatos debe usarse dentro de <ProveedorDatos>')
  return valor
}
