import { createContext, useContext } from 'react'
import type { DatosNuevaReserva, EstadoDia, EstadoReserva, FechaBloqueada, Reserva } from '../types'

export interface ValorDatos {
  reservas: Reserva[]
  bloqueos: FechaBloqueada[]
  /** Fecha actual (YYYY-MM-DD); se recalcula al volver a la pestaña. */
  hoy: string
  /** Avisos de almacenamiento (datos dañados, errores de lectura). */
  avisos: string[]
  descartarAvisos: () => void
  estadoDeFecha: (fecha: string) => EstadoDia
  crearReserva: (datos: DatosNuevaReserva) => Reserva
  cambiarEstado: (id: string, estado: EstadoReserva) => Reserva
  bloquearFecha: (fecha: string, motivo?: string) => FechaBloqueada
  desbloquearFecha: (fecha: string) => void
  eliminarDatosDemo: () => { reservas: number; bloqueos: number }
}

export const ContextoDatos = createContext<ValorDatos | null>(null)

export function useDatos(): ValorDatos {
  const valor = useContext(ContextoDatos)
  if (!valor) throw new Error('useDatos debe usarse dentro de <ProveedorDatos>')
  return valor
}
