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
  /** Formato HH:MM. */
  horaInicio: string
  /** Formato HH:MM. Se calcula con la duración del servicio al reservar. */
  horaFin: string
  notas: string
  estado: EstadoReserva
  /** Fecha y hora ISO. */
  creadaEn: string
  actualizadaEn?: string
  /** Registro de ejemplo creado al inicializar la demo. */
  esDemo?: boolean
}

/** Bloqueo manual: el día completo (sin horas) o una franja horaria. */
export interface FechaBloqueada {
  id: string
  /** Formato YYYY-MM-DD. */
  fecha: string
  horaInicio?: string
  horaFin?: string
  motivo?: string
  creadaEn: string
  esDemo?: boolean
}

export interface FranjaHoraria {
  horaInicio: string
  horaFin: string
}

export type DatosNuevaReserva = Pick<Reserva, 'nombre' | 'celular' | 'email' | 'servicioId' | 'fecha' | 'horaInicio' | 'notas'>

/**
 * disponible: sin ocupación · parcial: hay horarios libres, pero no todo el día
 * ocupada: no queda ningún horario para la duración pedida · bloqueada: día completo bloqueado
 */
export type EstadoDia = 'disponible' | 'parcial' | 'ocupada' | 'bloqueada' | 'pasada'

export interface Estadisticas {
  total: number
  pendientes: number
  confirmadas: number
  canceladas: number
  proximas: number
}

export interface Etiqueta {
  id: string
  nombre: string
}

export interface FotoGaleria {
  id: string
  /** URL https (Unsplash u otra) o imagen subida como data URL. */
  src: string
  alt: string
  /** Identificadores de etiqueta. */
  etiquetas: string[]
  /** Ancho y alto (o proporción) de la imagen. */
  proporcion?: [number, number]
  creadaEn: string
}
