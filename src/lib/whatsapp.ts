import { CONFIG } from '../config'
import type { Reserva } from '../types'
import { formatearFechaLarga } from './fechas'
import { duracionEntre, formatearDuracion, formatearFranja } from './horas'

/** Devuelve la URL wa.me o null si el número no está configurado. */
export function urlWhatsApp(mensaje: string, numero: string = CONFIG.whatsapp.numero): string | null {
  const limpio = numero.replace(/\D/g, '')
  if (!limpio) return null
  return `https://wa.me/${limpio}?text=${encodeURIComponent(mensaje)}`
}

export function mensajeReserva(r: Reserva): string {
  return [
    'Hola Leandro, ¿cómo estás? Quisiera coordinar una sesión fotográfica.',
    '',
    `Código de solicitud: ${r.id}`,
    `Nombre: ${r.nombre}`,
    `Celular: ${r.celular}`,
    `Correo: ${r.email}`,
    `Servicio: ${r.servicioNombre}`,
    `Fecha solicitada: ${formatearFechaLarga(r.fecha)}`,
    `Horario: ${formatearFranja(r.horaInicio, r.horaFin)} (${formatearDuracion(duracionEntre(r.horaInicio, r.horaFin))})`,
    `Comentarios: ${r.notas.trim() || 'Sin comentarios adicionales'}`,
    '',
    '¿Podemos confirmar los detalles? ¡Muchas gracias!',
  ].join('\n')
}

export function mensajeContacto(nombre: string, mensaje: string, servicio?: string): string {
  const lineas = [`Hola Leandro, soy ${nombre.trim()}.`]
  if (servicio) lineas.push(`Te escribo por: ${servicio}.`)
  lineas.push('', mensaje.trim())
  return lineas.join('\n')
}
