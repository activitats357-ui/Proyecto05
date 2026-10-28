/**
 * Punto único de envío de correos de la aplicación.
 *
 * El envío todavía no está configurado: enviarCorreo() no manda nada y lo
 * informa con { enviado: false }. Cuando se defina cómo enviar los correos,
 * basta con implementar esta función y hacer que correoConfigurado()
 * devuelva true; el resto de la aplicación no necesita cambios.
 */

export interface Correo {
  para: string
  asunto: string
  texto: string
}

export interface ResultadoEnvio {
  enviado: boolean
}

export function correoConfigurado(): boolean {
  return false
}

export async function enviarCorreo(_correo: Correo): Promise<ResultadoEnvio> {
  return { enviado: false }
}
