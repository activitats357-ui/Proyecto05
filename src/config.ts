/**
 * Configuración editable del sitio.
 * Todo lo marcado como "MUESTRA" son datos de demostración: reemplazalos
 * por los datos reales antes de publicar.
 */
export const CONFIG = {
  marca: 'Leandro Báez Fotógrafo',
  nombre: 'Leandro Báez',
  ubicacion: 'Encarnación, Paraguay',
  cobertura: 'Encarnación y alrededores. Otras localidades, a consultar.',
  horario: [
    { dias: 'Lunes a viernes', horas: '09:00 a 18:00' },
    { dias: 'Sábados', horas: 'Con cita previa' },
  ],

  whatsapp: {
    // MUESTRA: número internacional sin "+" ni espacios (ej. 5959XXXXXXXX).
    // Dejalo vacío ('') para desactivar los botones de WhatsApp.
    numero: '595900000000',
    esMuestra: true,
  },

  redes: {
    // MUESTRA: no corresponde al perfil oficial del fotógrafo.
    instagram: { url: 'https://www.instagram.com/', usuario: '@perfil.de.muestra', esMuestra: true },
  },

  // Correo de contacto público. Vacío = no se muestra.
  email: '',

  admin: {
    // Protección de demostración: el código del cliente puede inspeccionarse.
    clave: 'leandro2026',
  },
} as const

/** Indica si hay datos de contacto de muestra que todavía deben reemplazarse. */
export const HAY_DATOS_DE_MUESTRA = CONFIG.whatsapp.esMuestra || CONFIG.redes.instagram.esMuestra
