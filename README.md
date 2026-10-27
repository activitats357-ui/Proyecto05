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
| Clave del panel `/admin` | `CONFIG.admin.clave` | `leandro2026` |
| Ubicación, cobertura y horarios | `CONFIG.ubicacion`, `CONFIG.cobertura`, `CONFIG.horario` | Datos reales del brief |

- El número de WhatsApp va en formato internacional, sin `+` ni espacios. Si se deja vacío, los botones de WhatsApp se desactivan y se muestra un aviso.
- Al cargar los datos reales, poné `esMuestra: false` para ocultar las indicaciones de “muestra”.
- Los servicios están en `src/data/servicios.ts`. **No cambies los `id`**: se guardan en cada reserva.
- Las fotografías (Unsplash, de uso libre) están en `src/data/fotos.ts`. Conviene reemplazarlas por fotografías propias.

## Páginas

| Ruta | Contenido |
| --- | --- |
| `/` | Portada, presentación, servicios, galería con ampliación y llamada a la acción |
| `/reservar` | Proceso guiado en 4 pasos: servicio → fecha → datos → revisión. Acepta `?servicio=<id>` para preseleccionar un servicio |
| `/confirmacion/:id` | Resumen de la solicitud y botón para preparar el mensaje de WhatsApp |
| `/contacto` | Datos de contacto y formulario que abre WhatsApp con el mensaje redactado |
| `/politicas` | Estructura de políticas (contenido provisional, pendiente de redacción) |
| `/admin` | Acceso con clave, resumen, gestión de reservas y bloqueo de fechas |

## Reglas de disponibilidad

Las reglas viven en un solo lugar (`src/services/reservas.ts`) y las usan tanto el calendario público como el del panel:

1. Una fecha está **ocupada** si tiene una reserva `pendiente` o `confirmada`. Las `canceladas` no ocupan.
2. Una fecha está **bloqueada** si el administrador la bloqueó manualmente.
3. Las fechas **pasadas** no se pueden reservar ni bloquear.
4. Antes de guardar, una reserva o un cambio de estado se vuelve a comprobar **contra lo guardado en ese momento**. Así se evitan duplicados por doble clic o por formularios abiertos en dos pestañas.
5. No se puede reactivar una reserva cancelada si su fecha ya está ocupada o bloqueada.
6. No se puede bloquear ni desbloquear una fecha con una reserva activa.

Las fechas se manejan como cadenas `YYYY-MM-DD` en hora local, para evitar desfasajes por zona horaria.

## Almacenamiento (localStorage)

| Clave | Contenido |
| --- | --- |
| `leandro_baez_reservas` | Lista de reservas (`Reserva[]`) |
| `leandro_baez_fechas_bloqueadas` | Lista de fechas bloqueadas (`FechaBloqueada[]`) |
| `leandro_baez_configuracion` | Metadatos (versión, fecha de inicialización) |
| `leandro_baez_admin_sesion` *(sessionStorage)* | Sesión del panel; se borra al cerrar la pestaña |

- Si un dato guardado está dañado (JSON inválido o registros con formato incorrecto), **no se sobrescribe en silencio**: se guarda una copia en `<clave>__respaldo` y se muestra un aviso.
- Los errores de espacio insuficiente o de almacenamiento bloqueado se informan en pantalla.
- La interfaz se actualiza en el momento después de cada operación. Los cambios hechos desde otra pestaña se detectan con el evento `storage` y al volver a la pestaña.

## Datos de demostración

En la primera carga, **y solo si las claves no existen**, se crean:

- 6 reservas ficticias (códigos `LB-DEMO01` a `LB-DEMO06`) con fechas futuras relativas al día de la primera carga: pendientes, confirmadas y una cancelada.
- 3 fechas bloqueadas: “Descanso personal”, “Fecha no laborable” y “Compromiso profesional”.

Todos llevan `esDemo: true` y datos de prueba (dominio `ejemplo.com`, teléfonos `+595 900 000 1xx`). Desde el panel se pueden quitar con **“Quitar datos de demostración”**, sin tocar los datos reales. Para empezar de cero, borrá las claves `leandro_baez_*` desde las herramientas del navegador.

## Limitaciones de esta versión

- **La disponibilidad es local a cada navegador.** Una reserva hecha en un dispositivo no la ve otro dispositivo ni el fotógrafo. No es una agenda compartida ni en tiempo real. Por eso la reserva se presenta como *solicitud registrada* y la coordinación sigue por WhatsApp.
- **El acceso a `/admin` es una protección de demostración.** La clave está en el código del cliente y se puede inspeccionar. No es apta para producción.
- El botón de WhatsApp solo **abre** WhatsApp con el mensaje redactado. No se envía nada automáticamente.
- Las políticas y condiciones están pendientes de redacción y deben revisarse antes de publicar.

Una fase posterior podrá conectar la capa `src/services/reservas.ts` a una base de datos real sin tocar los componentes de la interfaz.

## Estructura

```
src/
  config.ts              Configuración editable (contacto, WhatsApp, clave admin)
  types.ts               Interfaces Reserva, FechaBloqueada, etc.
  data/                  Servicios y fotografías
  lib/                   Fechas, almacenamiento, validación, WhatsApp
  services/              Reglas de reservas/disponibilidad y datos demo
  context/               Estado React sincronizado con localStorage
  components/            Encabezado, pie, calendario, galería, formularios…
  pages/                 Páginas públicas y panel de administración
```

## Publicación

Es una SPA con `BrowserRouter`: el servidor debe redirigir todas las rutas a `index.html`.

- **Netlify:** ya incluido en `public/_redirects`.
- **Vercel:** ya incluido en `vercel.json` (rewrite de todas las rutas a `/index.html`).
