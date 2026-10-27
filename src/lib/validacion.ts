import { esServicioId } from '../data/servicios'
import type { DatosNuevaReserva } from '../types'
import { esFechaISOValida, esPasada, hoyISO } from './fechas'

export type CampoReserva = keyof DatosNuevaReserva
export type ErroresReserva = Partial<Record<CampoReserva, string>>

export const LIMITES = { nombre: 80, celular: 25, email: 120, notas: 1000 } as const

const RE_EMAIL = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/
const RE_CELULAR = /^\+?[\d\s().-]+$/

export function validarCampo(campo: CampoReserva, valor: string, hoy = hoyISO()): string | undefined {
  const v = valor.trim()
  switch (campo) {
    case 'nombre':
      if (!v) return 'Escribí tu nombre y apellido.'
      if (v.split(/\s+/).length < 2) return 'Incluí también tu apellido.'
      if (v.length > LIMITES.nombre) return `Usá como máximo ${LIMITES.nombre} caracteres.`
      return
    case 'celular': {
      if (!v) return 'Dejame un número de celular o WhatsApp para poder contactarte.'
      const digitos = v.replace(/\D/g, '').length
      if (!RE_CELULAR.test(v) || digitos < 6 || digitos > 15)
        return 'Revisá el número: usá solo dígitos, espacios o guiones (por ejemplo, 0985 123 456).'
      return
    }
    case 'email':
      if (!v) return 'Escribí tu correo electrónico.'
      if (v.length > LIMITES.email || !RE_EMAIL.test(v))
        return 'El correo no parece válido. Revisá que tenga el formato nombre@dominio.com.'
      return
    case 'servicioId':
      if (!esServicioId(v)) return 'Elegí el tipo de sesión que te interesa.'
      return
    case 'fecha':
      if (!v) return 'Elegí una fecha en el calendario.'
      if (!esFechaISOValida(v)) return 'La fecha no es válida. Elegila de nuevo en el calendario.'
      if (esPasada(v, hoy)) return 'La fecha ya pasó. Elegí una fecha futura.'
      return
    case 'notas':
      if (v.length > LIMITES.notas) return `Los comentarios pueden tener hasta ${LIMITES.notas} caracteres.`
      return
  }
}

/** Valida formato y obligatoriedad. La disponibilidad de la fecha se comprueba aparte. */
export function validarDatosReserva(datos: DatosNuevaReserva, hoy = hoyISO()): ErroresReserva {
  const errores: ErroresReserva = {}
  for (const campo of Object.keys(datos) as CampoReserva[]) {
    const error = validarCampo(campo, datos[campo] ?? '', hoy)
    if (error) errores[campo] = error
  }
  return errores
}
