/**
 * Cuenta de administración: contraseña, correo y restablecimiento.
 *
 * La contraseña nunca se guarda en texto: se guarda un hash PBKDF2 con sal.
 * Mientras no se cambie desde el panel, vale la clave inicial de config.ts.
 * Como todo corre en el navegador, sigue siendo una protección de demostración.
 */
import { CONFIG } from '../config'
import { CLAVES, eliminarClave, escribirObjeto, leerObjeto } from '../lib/almacenamiento'
import { correoConfigurado, enviarCorreo } from './correo'

export class ErrorCuenta extends Error {
  readonly campo?: 'actual' | 'nueva' | 'confirmacion' | 'email' | 'token'

  constructor(mensaje: string, campo?: ErrorCuenta['campo']) {
    super(mensaje)
    this.name = 'ErrorCuenta'
    this.campo = campo
  }
}

export const MIN_LARGO_CLAVE = 8
const MAX_LARGO_CLAVE = 128
const ITERACIONES = 210_000
const MINUTOS_VALIDEZ_ENLACE = 60
const RE_EMAIL = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/

interface CuentaGuardada {
  email: string
  sal: string
  hash: string
  iteraciones: number
  actualizadaEn: string
}

interface SolicitudGuardada {
  /** SHA-256 del token: el token en sí solo viaja en el enlace. */
  tokenHash: string
  email: string
  expira: string
}

// ---------- Utilidades criptográficas ----------

const aHex = (buf: ArrayBuffer | Uint8Array) =>
  Array.from(buf instanceof Uint8Array ? buf : new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('')

const deHex = (hex: string) => new Uint8Array(hex.match(/.{2}/g)!.map((b) => parseInt(b, 16)))

const aleatorioHex = (bytes: number) => aHex(crypto.getRandomValues(new Uint8Array(bytes)))

async function derivar(clave: string, sal: string, iteraciones: number): Promise<string> {
  const llave = await crypto.subtle.importKey('raw', new TextEncoder().encode(clave), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: deHex(sal), iterations: iteraciones }, llave, 256)
  return aHex(bits)
}

async function sha256(texto: string): Promise<string> {
  return aHex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(texto)))
}

/** Comparación en tiempo constante. */
function iguales(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diferencia = 0
  for (let i = 0; i < a.length; i++) diferencia |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diferencia === 0
}

// ---------- Lectura y guardado ----------

function esCuenta(x: unknown): x is CuentaGuardada {
  if (typeof x !== 'object' || x === null) return false
  const c = x as Record<string, unknown>
  return (
    typeof c.email === 'string' &&
    typeof c.sal === 'string' &&
    /^[0-9a-f]+$/.test(c.sal) &&
    typeof c.hash === 'string' &&
    typeof c.iteraciones === 'number' &&
    typeof c.actualizadaEn === 'string'
  )
}

function esSolicitud(x: unknown): x is SolicitudGuardada {
  if (typeof x !== 'object' || x === null) return false
  const s = x as Record<string, unknown>
  return typeof s.tokenHash === 'string' && typeof s.email === 'string' && typeof s.expira === 'string'
}

const cuentaGuardada = () => leerObjeto(CLAVES.cuenta, esCuenta).dato

export interface DatosCuenta {
  email: string
  /** Fecha del último cambio, o null si se usan los datos iniciales de config.ts. */
  actualizadaEn: string | null
}

export function leerCuenta(): DatosCuenta {
  const c = cuentaGuardada()
  return c ? { email: c.email, actualizadaEn: c.actualizadaEn } : { email: CONFIG.admin.email, actualizadaEn: null }
}

async function guardarCuenta(email: string, clave: string): Promise<void> {
  const sal = aleatorioHex(16)
  escribirObjeto(CLAVES.cuenta, {
    email,
    sal,
    hash: await derivar(clave, sal, ITERACIONES),
    iteraciones: ITERACIONES,
    actualizadaEn: new Date().toISOString(),
  })
}

// ---------- Validación ----------

export function validarEmail(email: string): string | null {
  const e = email.trim()
  if (!e) return 'Escribí el correo electrónico.'
  if (e.length > 120 || !RE_EMAIL.test(e)) return 'El correo no parece válido. Revisá que tenga el formato nombre@dominio.com.'
  return null
}

export function validarNuevaClave(nueva: string, confirmacion: string): { nueva?: string; confirmacion?: string } {
  const errores: { nueva?: string; confirmacion?: string } = {}
  if (nueva.length < MIN_LARGO_CLAVE) errores.nueva = `La contraseña tiene que tener al menos ${MIN_LARGO_CLAVE} caracteres.`
  else if (nueva.length > MAX_LARGO_CLAVE) errores.nueva = `Usá como máximo ${MAX_LARGO_CLAVE} caracteres.`
  else if (!/[A-Za-zÁÉÍÓÚÑáéíóúñ]/.test(nueva) || !/\d/.test(nueva)) errores.nueva = 'Combiná letras y números.'
  if (!errores.nueva && nueva !== confirmacion) errores.confirmacion = 'Las contraseñas no coinciden.'
  return errores
}

// ---------- Acceso y cambios desde el perfil ----------

export async function verificarClave(clave: string): Promise<boolean> {
  const c = cuentaGuardada()
  if (!c) return iguales(clave, CONFIG.admin.clave)
  return iguales(await derivar(clave, c.sal, c.iteraciones), c.hash)
}

export async function cambiarClave(actual: string, nueva: string, confirmacion: string): Promise<void> {
  if (!(await verificarClave(actual))) throw new ErrorCuenta('La contraseña actual no es correcta.', 'actual')
  const errores = validarNuevaClave(nueva, confirmacion)
  if (errores.nueva) throw new ErrorCuenta(errores.nueva, 'nueva')
  if (errores.confirmacion) throw new ErrorCuenta(errores.confirmacion, 'confirmacion')
  if (nueva === actual) throw new ErrorCuenta('La nueva contraseña tiene que ser distinta de la actual.', 'nueva')
  await guardarCuenta(leerCuenta().email, nueva)
  eliminarClave(CLAVES.restablecimiento)
}

export async function cambiarEmail(clave: string, nuevoEmail: string): Promise<string> {
  if (!(await verificarClave(clave))) throw new ErrorCuenta('La contraseña no es correcta.', 'actual')
  const error = validarEmail(nuevoEmail)
  if (error) throw new ErrorCuenta(error, 'email')
  const email = nuevoEmail.trim().toLowerCase()
  if (email === leerCuenta().email.toLowerCase()) throw new ErrorCuenta('Ese ya es el correo de la cuenta.', 'email')
  // Se vuelve a derivar con la misma contraseña (ya verificada) y una sal nueva.
  await guardarCuenta(email, clave)
  eliminarClave(CLAVES.restablecimiento)
  return email
}

// ---------- Restablecimiento por correo ----------

export interface ResultadoSolicitud {
  /** El correo se envió de verdad (solo cuando el envío esté configurado). */
  enviado: boolean
  correoConfigurado: boolean
  /** Enlace visible solo en modo demostración, mientras no haya envío de correos. */
  enlacePrueba?: string
}

/**
 * Genera un enlace de un solo uso, válido durante 60 minutos, y lo envía al
 * correo de la cuenta. Por seguridad, la respuesta para el usuario no revela
 * si el correo ingresado coincide con la cuenta.
 */
export async function solicitarRestablecimiento(email: string): Promise<ResultadoSolicitud> {
  const error = validarEmail(email)
  if (error) throw new ErrorCuenta(error, 'email')
  const base = { enviado: false, correoConfigurado: correoConfigurado() }
  const cuenta = leerCuenta()
  if (email.trim().toLowerCase() !== cuenta.email.toLowerCase()) return base

  const token = aleatorioHex(32)
  escribirObjeto(CLAVES.restablecimiento, {
    tokenHash: await sha256(token),
    email: cuenta.email,
    expira: new Date(Date.now() + MINUTOS_VALIDEZ_ENLACE * 60_000).toISOString(),
  })
  const enlace = `${window.location.origin}/admin/restablecer?token=${token}`
  const { enviado } = await enviarCorreo({
    para: cuenta.email,
    asunto: 'Restablecer tu contraseña · Leandro Báez Fotografía',
    texto: [
      'Hola,',
      '',
      'Recibimos un pedido para restablecer la contraseña del panel de administración.',
      `Para elegir una nueva, abrí este enlace (vale durante ${MINUTOS_VALIDEZ_ENLACE} minutos y se puede usar una sola vez):`,
      '',
      enlace,
      '',
      'Si no lo pediste vos, ignorá este mensaje: tu contraseña no cambia.',
    ].join('\n'),
  })
  return {
    ...base,
    enviado,
    ...(!enviado && CONFIG.correo.mostrarEnlaceSinEnvio && { enlacePrueba: enlace }),
  }
}

async function solicitudVigente(token: string): Promise<SolicitudGuardada | null> {
  const s = leerObjeto(CLAVES.restablecimiento, esSolicitud).dato
  if (!s || !/^[0-9a-f]{64}$/.test(token)) return null
  if (Date.now() > new Date(s.expira).getTime()) return null
  if (!iguales(await sha256(token), s.tokenHash)) return null
  if (s.email.toLowerCase() !== leerCuenta().email.toLowerCase()) return null
  return s
}

export async function tokenValido(token: string): Promise<boolean> {
  return (await solicitudVigente(token)) !== null
}

export async function restablecerClave(token: string, nueva: string, confirmacion: string): Promise<void> {
  if (!(await solicitudVigente(token))) {
    throw new ErrorCuenta('El enlace no es válido o ya venció. Pedí uno nuevo desde la pantalla de acceso.', 'token')
  }
  const errores = validarNuevaClave(nueva, confirmacion)
  if (errores.nueva) throw new ErrorCuenta(errores.nueva, 'nueva')
  if (errores.confirmacion) throw new ErrorCuenta(errores.confirmacion, 'confirmacion')
  await guardarCuenta(leerCuenta().email, nueva)
  eliminarClave(CLAVES.restablecimiento)
}
