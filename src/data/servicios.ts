import { FOTOS, type Foto } from './fotos'

export type ServicioId = 'bodas' | 'retratos' | 'premama-familia' | 'eventos'

export interface Servicio {
  /** Identificador estable: se guarda en cada reserva. No modificar. */
  id: ServicioId
  nombre: string
  descripcion: string
  duracion: string
  precio: string
  foto: Foto
}

export const SERVICIOS: Servicio[] = [
  {
    id: 'bodas',
    nombre: 'Fotografía de bodas',
    descripcion:
      'Desde los preparativos hasta los momentos más emocionantes de la celebración. Una cobertura cuidada para conservar cada abrazo, cada mirada y cada detalle de un día inolvidable.',
    duracion: '6 a 10 horas',
    precio: 'Consultar presupuesto',
    foto: FOTOS.servicioBodas,
  },
  {
    id: 'retratos',
    nombre: 'Retratos y sesiones personales',
    descripcion:
      'Sesiones individuales para renovar tu imagen, crear un recuerdo personal o desarrollar un proyecto fotográfico con una mirada profesional y natural.',
    duracion: '60 minutos',
    precio: 'Consultar presupuesto',
    foto: FOTOS.servicioRetratos,
  },
  {
    id: 'premama-familia',
    nombre: 'Sesiones premamá y familiares',
    descripcion:
      'Un recuerdo especial de una etapa única. Sesiones cálidas, naturales y personalizadas para parejas, familias y futuras mamás.',
    duracion: '60 a 90 minutos',
    precio: 'Consultar presupuesto',
    foto: FOTOS.servicioFamilia,
  },
  {
    id: 'eventos',
    nombre: 'Eventos sociales y corporativos',
    descripcion:
      'Cobertura fotográfica de cumpleaños, aniversarios, encuentros empresariales y eventos especiales, con atención a los protagonistas y a los detalles.',
    duracion: 'Según el evento',
    precio: 'Consultar presupuesto',
    foto: FOTOS.servicioEventos,
  },
]

export function esServicioId(valor: unknown): valor is ServicioId {
  return typeof valor === 'string' && SERVICIOS.some((s) => s.id === valor)
}

export function buscarServicio(id: string): Servicio | undefined {
  return SERVICIOS.find((s) => s.id === id)
}
