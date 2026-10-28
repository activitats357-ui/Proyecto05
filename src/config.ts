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

  /**
   * Horario de trabajo por defecto: los turnos deben empezar y terminar
   * dentro del horario de su día. Se cambia desde /admin (pestaña Horario),
   * donde además cada día puede tener su propio horario.
   */
  agenda: {
    // Días que se trabaja: 0 = lunes … 6 = domingo.
    diasLaborables: [0, 1, 2, 3, 4, 5],
    horaInicio: '08:00',
    horaFin: '22:00',
    // Separación entre horarios de inicio y unidad mínima de duración.
    intervaloMinutos: 30,
  },

  admin: {
    // Protección de demostración: el código del cliente puede inspeccionarse.
    // Clave y correo iniciales; desde el panel (pestaña Perfil) se pueden cambiar.
    clave: 'leandro2026',
    // MUESTRA: correo de la cuenta de administración al que se envía el enlace para restablecer la contraseña.
    email: 'admin@ejemplo.com',
  },

  correo: {
    /**
     * Mientras el envío de correos no esté configurado (src/services/correo.ts),
     * muestra en pantalla el enlace para restablecer la contraseña, para poder
     * probar el flujo. Desactivalo (false) cuando el envío funcione.
     */
    mostrarEnlaceSinEnvio: true,
  },
} as const

/** Indica si hay datos de contacto de muestra que todavía deben reemplazarse. */
export const HAY_DATOS_DE_MUESTRA = CONFIG.whatsapp.esMuestra || CONFIG.redes.instagram.esMuestra
