import { FOTOS, type Foto } from './fotos'

export type ServicioId = 'bodas' | 'retratos' | 'premama-familia' | 'eventos'

export interface Servicio {
  /** Identificador estable: se guarda en cada reserva. No modificar. */
  id: ServicioId
  /** Editable desde el panel de administración. */
  nombre: string
  descripcion: string
  /** Duración del turno en horas. Editable desde el panel. */
  duracionHoras: number
  precio: string
  foto: Foto
}

/** Valores por defecto. El nombre y la duración se pueden cambiar desde /admin. */
export const SERVICIOS_BASE: Servicio[] = [
  {
    id: 'bodas',
    nombre: 'Fotografía de bodas',
    descripcion:
      'Desde los preparativos hasta los momentos más emocionantes de la celebración. Una cobertura cuidada para conservar cada abrazo, cada mirada y cada detalle de un día inolvidable.',
    duracionHoras: 8,
    precio: 'Consultar presupuesto',
    foto: FOTOS.servicioBodas,
  },
  {
    id: 'retratos',
    nombre: 'Retratos y sesiones personales',
    descripcion:
      'Sesiones individuales para renovar tu imagen, crear un recuerdo personal o desarrollar un proyecto fotográfico con una mirada profesional y natural.',
    duracionHoras: 1,
    precio: 'Consultar presupuesto',
    foto: FOTOS.servicioRetratos,
  },
  {
    id: 'premama-familia',
    nombre: 'Sesiones premamá y familiares',
    descripcion:
      'Un recuerdo especial de una etapa única. Sesiones cálidas, naturales y personalizadas para parejas, familias y futuras mamás.',
    duracionHoras: 1.5,
    precio: 'Consultar presupuesto',
    foto: FOTOS.servicioFamilia,
  },
  {
    id: 'eventos',
    nombre: 'Eventos sociales y corporativos',
    descripcion:
      'Cobertura fotográfica de cumpleaños, aniversarios, encuentros empresariales y eventos especiales, con atención a los protagonistas y a los detalles.',
    duracionHoras: 4,
    precio: 'Consultar presupuesto',
    foto: FOTOS.servicioEventos,
  },
]

export function esServicioId(valor: unknown): valor is ServicioId {
  return typeof valor === 'string' && SERVICIOS_BASE.some((s) => s.id === valor)
}
