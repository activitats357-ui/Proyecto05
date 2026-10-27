import type { ServicioId } from './data/servicios'

export type EstadoReserva = 'pendiente' | 'confirmada' | 'cancelada'

export const ESTADOS_RESERVA: readonly EstadoReserva[] = ['pendiente', 'confirmada', 'cancelada']

export const ETIQUETA_ESTADO: Record<EstadoReserva, string> = {
  pendiente: 'Pendiente',
  confirmada: 'Confirmada',
  cancelada: 'Cancelada',
}

export interface Reserva {
  id: string
  nombre: string
  celular: string
  email: string
  servicioId: ServicioId
  servicioNombre: string
  /** Formato YYYY-MM-DD (fecha local, sin hora). */
  fecha: string
  notas: string
  estado: EstadoReserva
  /** Fecha y hora ISO. */
  creadaEn: string
  actualizadaEn?: string
  /** Registro de ejemplo creado al inicializar la demo. */
  esDemo?: boolean
}

export interface FechaBloqueada {
  /** Formato YYYY-MM-DD. */
  fecha: string
  motivo?: string
  creadaEn: string
  esDemo?: boolean
}

export type DatosNuevaReserva = Pick<Reserva, 'nombre' | 'celular' | 'email' | 'servicioId' | 'fecha' | 'notas'>

export type EstadoDia = 'disponible' | 'ocupada' | 'bloqueada' | 'pasada'

export interface Estadisticas {
  total: number
  pendientes: number
  confirmadas: number
  canceladas: number
  proximas: number
}
