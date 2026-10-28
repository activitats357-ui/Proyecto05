# Leandro Báez Fotógrafo — Web de reservas online

Aplicación web para **Leandro Báez Fotógrafo** (Encarnación, Paraguay): presentación de servicios, galería, calendario de disponibilidad, solicitud de reserva online y panel de administración.

Funciona **íntegramente en el navegador**. Los datos se guardan en `localStorage`; no hay backend, base de datos ni servicios externos de persistencia.

## Tecnologías

- React 19 + TypeScript
- Vite 7
- Tailwind CSS 4
- React Router 7
- Lucide React (iconos)
- Google Fonts: Playfair Display (títulos) e Inter (textos)

## Instalación y ejecución

Requisitos: Node.js 20 o superior.

```bash
npm install
npm run dev        # servidor de desarrollo en http://localhost:5173
npm run build      # compilación de producción en dist/
npm run preview    # sirve la compilación de producción
npm run typecheck  # comprobación de tipos
```

## Configuración

Todos los datos editables están en **`src/config.ts`**:

| Dato | Clave | Estado actual |
| --- | --- | --- |
| Número de WhatsApp de destino | `CONFIG.whatsapp.numero` | **Muestra** (`595900000000`) |
| Perfil de Instagram | `CONFIG.redes.instagram` | **Muestra** |
| Correo público | `CONFIG.email` | Vacío (no se muestra) |
| Contraseña inicial del panel `/admin` | `CONFIG.admin.clave` | `leandro2026` (se cambia desde *Perfil*) |
| Correo inicial de la cuenta de administración | `CONFIG.admin.email` | **Muestra** (`admin@ejemplo.com`) |
| Mostrar el enlace de restablecimiento en pantalla mientras no haya envío de correos | `CONFIG.correo.mostrarEnlaceSinEnvio` | `true` (demostración) |
| Ubicación, cobertura y horarios | `CONFIG.ubicacion`, `CONFIG.cobertura`, `CONFIG.horario` | Datos reales del brief |
| Horario de trabajo por defecto | `CONFIG.agenda.diasLaborables`, `horaInicio`, `horaFin` | Lunes a sábado, 08:00 a 22:00 (editable desde la pestaña *Horario*) |
| Separación entre horarios de inicio | `CONFIG.agenda.intervaloMinutos` | 30 minutos |

- El número de WhatsApp va en formato internacional, sin `+` ni espacios. Si se deja vacío, los botones de WhatsApp se desactivan y se muestra un aviso.
- Al cargar los datos reales, poné `esMuestra: false` para ocultar las indicaciones de “muestra”.
- El **nombre y la duración** de cada servicio se cambian desde el panel (pestaña *Servicios*). Los valores por defecto, la descripción y la foto están en `src/data/servicios.ts`. **No cambies los `id`**: se guardan en cada reserva.
- La **galería y sus etiquetas** se gestionan desde el panel. El contenido inicial (fotos de Unsplash, de uso libre) está en `src/data/fotos.ts`.

## Páginas

| Ruta | Contenido |
| --- | --- |
| `/` | Portada, presentación, servicios, galería con ampliación y llamada a la acción |
| `/reservar` | Proceso guiado en 4 pasos: servicio → fecha y horario → datos → revisión. Acepta `?servicio=<id>` para preseleccionar un servicio |
| `/confirmacion/:id` | Resumen de la solicitud (con horario) y botón para preparar el mensaje de WhatsApp |
| `/contacto` | Datos de contacto y formulario que abre WhatsApp con el mensaje redactado |
| `/politicas` | Estructura de políticas (contenido provisional, pendiente de redacción) |
| `/admin` | Acceso con contraseña y panel de administración (ver abajo) |
| `/admin/restablecer` | Página del enlace para elegir una contraseña nueva |
| `/documentacion` | Manual completo de uso y configuración (requiere la contraseña del panel) |

### Panel de administración

| Pestaña | Qué permite |
| --- | --- |
| Reservas | Resumen, próximas reservas, filtros y cambio de estado |
| Agenda | Calendario de consulta: reservas y bloqueos de cada día y franjas libres |
| Horario | **Horario habitual de la semana**: qué días se trabaja y de qué hora a qué hora cada día, con atajos (lunes a viernes, lunes a sábado, todos los días) |
| Bloqueos | Cierres puntuales: bloquear un **día completo** o una **franja horaria**, con motivo; listar y eliminar bloqueos |
| Servicios | Cambiar el **nombre** y la **duración en horas** de los 4 servicios |
| Galería | Subir fotos (se reducen a 1600 px) o agregarlas por URL, describirlas, etiquetarlas, ordenarlas y eliminarlas |
| Etiquetas | Crear, renombrar y eliminar etiquetas (al eliminar una, se quita de las fotos) |
| Perfil | Cambiar el **correo** de la cuenta y la **contraseña** (ambos piden la contraseña actual) |

### Contraseña y restablecimiento

- La contraseña nunca se guarda en texto: se guarda un hash PBKDF2-SHA-256 con sal. Mientras no se cambie, vale la inicial de `config.ts`.
- En la pantalla de acceso, **“¿Olvidaste tu contraseña?”** pide el correo de la cuenta y genera un enlace de un solo uso, válido 60 minutos, hacia `/admin/restablecer`. Del enlace solo se guarda su hash. La respuesta no revela si el correo coincide con la cuenta.
- **Envío de correos pendiente de configurar.** Todo el envío pasa por `src/services/correo.ts`, que hoy no envía nada. Para activarlo, se implementa `enviarCorreo()` y se hace que `correoConfigurado()` devuelva `true`; el resto de la app no cambia. Mientras tanto, si `CONFIG.correo.mostrarEnlaceSinEnvio` es `true`, el enlace se muestra en pantalla para poder probar el flujo. Desactivalo antes de publicar en producción.

## Turnos y reglas de disponibilidad

Cada reserva ocupa un **turno**: hora de inicio + duración del servicio. Los horarios de inicio se ofrecen cada 30 minutos y **el turno completo tiene que caber dentro del horario de trabajo de ese día** (pestaña *Horario*): si los lunes se atiende de 08:00 a 20:00, una sesión de 1 hora puede empezar como máximo a las 19:00. Los días que no se trabaja aparecen como *Cerrado*. Tiene que haber al menos un día abierto que alcance para el servicio más largo; si se cambia el horario, las reservas ya registradas que queden fuera se mantienen. Las reglas viven en un solo lugar (`src/services/reservas.ts`) y las usan tanto el calendario público como el panel:

1. Las reservas `pendiente` y `confirmada` ocupan su franja; las `canceladas` no.
2. Un bloqueo puede ser de **día completo** o de una **franja horaria**.
3. Un turno solo se ofrece si entra completo en la jornada, sin superponerse con reservas activas ni bloqueos. Si el turno es para hoy, tiene que empezar después de la hora actual.
4. En el calendario, cada día se marca como *Disponible*, *Horarios limitados* (hay ocupación, pero entra el turno), *Completa* (no entra ningún turno de esa duración), *Bloqueada* (cierre puntual), *Cerrado* (no se trabaja ese día de la semana) o *Pasada*.
5. Antes de guardar, una reserva o un cambio de estado se vuelve a comprobar **contra lo guardado en ese momento**. Así se evitan duplicados por doble clic o por formularios abiertos en dos pestañas.
6. No se puede reactivar una reserva cancelada si su franja ya está ocupada o bloqueada.
7. No se puede bloquear sobre una reserva activa, ni bloquear el día completo si ya tiene reservas o franjas bloqueadas.
8. Cambiar la duración de un servicio afecta solo a las reservas nuevas: las existentes guardan su hora de fin.

Las fechas se manejan como cadenas `YYYY-MM-DD` y las horas como `HH:MM`, siempre en hora local.

## Almacenamiento (localStorage)

| Clave | Contenido |
| --- | --- |
| `leandro_baez_reservas` | Lista de reservas (`Reserva[]`) |
| `leandro_baez_fechas_bloqueadas` | Bloqueos de día completo o de franja (`FechaBloqueada[]`) |
| `leandro_baez_servicios` | Nombre y duración modificados de cada servicio |
| `leandro_baez_horario` | Horario semanal (`{ dias: [7 × { abierto, horaInicio, horaFin }] }`, de lunes a domingo). El formato anterior de horario único se migra solo |
| `leandro_baez_etiquetas` | Etiquetas de la galería (`Etiqueta[]`) |
| `leandro_baez_galeria` | Fotos de la galería (`FotoGaleria[]`); las subidas se guardan como imagen JPEG |
| `leandro_baez_configuracion` | Metadatos (versión, fecha de inicialización) |
| `leandro_baez_cuenta` | Correo de la cuenta y hash de la contraseña (solo existe si se cambiaron) |
| `leandro_baez_restablecimiento` | Pedido de restablecimiento vigente (hash del enlace y vencimiento) |
| `leandro_baez_admin_sesion` *(sessionStorage)* | Sesión del panel; se borra al cerrar la pestaña |

- Si un dato guardado está dañado (JSON inválido o registros con formato incorrecto), **no se sobrescribe en silencio**: se guarda una copia en `<clave>__respaldo` y se muestra un aviso.
- Los errores de espacio insuficiente o de almacenamiento bloqueado se informan en pantalla.
- La interfaz se actualiza en el momento después de cada operación. Los cambios hechos desde otra pestaña se detectan con el evento `storage` y al volver a la pestaña.
- Los datos de la versión anterior (reservas sin horario) se migran solos: esas reservas ocupan la jornada completa.
- localStorage admite unos 5 MB por sitio. El panel de galería muestra el espacio usado; cada foto subida ocupa unos 150–400 KB.

## Datos de demostración

En la primera carga, **y solo si las claves no existen**, se crean:

- 6 reservas ficticias con horario (códigos `LB-DEMO01` a `LB-DEMO06`), con fechas futuras relativas al día de la primera carga: pendientes, confirmadas y una cancelada.
- 3 bloqueos: dos de día completo (“Descanso personal”, “Fecha no laborable”) y una franja de 15:00 a 19:00 (“Compromiso profesional”).
- Las 4 etiquetas iniciales (Bodas, Retratos, Familias, Eventos) y 15 fotos de galería.

Las reservas y los bloqueos de ejemplo llevan `esDemo: true` y datos de prueba (dominio `ejemplo.com`, teléfonos `+595 900 000 1xx`). En el recuadro **“Datos de demostración”** del panel hay dos opciones:

- **Quitar datos de demostración**: borra solo las reservas y los bloqueos de ejemplo. Los datos reales no se tocan.
- **Restablecer todo a los datos de demostración**: borra todas las reservas y bloqueos (también los reales), el horario, los cambios de servicios, la galería y las etiquetas, y vuelve a cargar los ejemplos. La cuenta (correo y contraseña) no cambia.

Para empezar de cero incluida la cuenta, borrá las claves `leandro_baez_*` desde las herramientas del navegador (F12 → Aplicación → Almacenamiento local) y recargá la página. El paso a paso está en `/documentacion`.

## Limitaciones de esta versión

- **La disponibilidad es local a cada navegador.** Una reserva hecha en un dispositivo no la ve otro dispositivo ni el fotógrafo. No es una agenda compartida ni en tiempo real. Por eso la reserva se presenta como *solicitud registrada* y la coordinación sigue por WhatsApp.
- **Los cambios del panel (servicios, galería, etiquetas, bloqueos) también son locales.** Solo se ven en el navegador donde se hicieron; los demás visitantes siguen viendo el contenido inicial.
- **La contraseña también es local a cada navegador.** Si se cambia en un navegador, en los demás sigue valiendo la inicial de `config.ts`.
- **El acceso a `/admin` es una protección de demostración.** La clave está en el código del cliente y se puede inspeccionar. No es apta para producción.
- El botón de WhatsApp solo **abre** WhatsApp con el mensaje redactado. No se envía nada automáticamente.
- Las políticas y condiciones están pendientes de redacción y deben revisarse antes de publicar.

Una fase posterior podrá conectar las capas `src/services/reservas.ts` y `src/services/catalogo.ts` a una base de datos real sin tocar los componentes de la interfaz.

## Estructura

```
src/
  config.ts              Configuración editable (contacto, WhatsApp, clave admin)
  types.ts               Interfaces Reserva, FechaBloqueada, etc.
  data/                  Servicios y fotografías
  lib/                   Fechas, horas, almacenamiento, validación, imágenes, WhatsApp
  services/              Reglas de reservas/disponibilidad y datos demo
  context/               Estado React sincronizado con localStorage
  components/            Encabezado, pie, calendario, galería, formularios…
  pages/                 Páginas públicas y panel de administración
```

## Publicación

Es una SPA con `BrowserRouter`: el servidor debe redirigir todas las rutas a `index.html`.

- **Netlify:** ya incluido en `public/_redirects`.
- **Vercel:** ya incluido en `vercel.json` (rewrite de todas las rutas a `/index.html`).
