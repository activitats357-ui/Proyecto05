import { ArrowLeft, BookOpen } from 'lucide-react'
import type { ReactNode } from 'react'
import { Aviso } from '../components/Aviso'
import { BotonLink } from '../components/Boton'
import { useTituloPagina } from '../components/Varios'
import { CONFIG } from '../config'
import { RequiereAdmin } from './admin/Admin'

/**
 * Manual de uso y configuración de la web. Está protegido con el acceso de
 * administración porque explica cómo funcionan la cuenta y los datos.
 */
export default function Documentacion() {
  useTituloPagina('Documentación')
  return <RequiereAdmin>{() => <ContenidoDocumentacion />}</RequiereAdmin>
}

const SECCIONES = [
  { id: 'resumen', titulo: 'Qué es esta web' },
  { id: 'paginas', titulo: 'Páginas' },
  { id: 'reservas', titulo: 'Cómo funciona una reserva' },
  { id: 'panel', titulo: 'Panel de administración' },
  { id: 'cuenta', titulo: 'Contraseña y perfil' },
  { id: 'correo', titulo: 'Configurar el envío de correo' },
  { id: 'configuracion', titulo: 'Configuración general' },
  { id: 'datos-demo', titulo: 'Datos de demostración' },
  { id: 'almacenamiento', titulo: 'Dónde se guardan los datos' },
  { id: 'publicacion', titulo: 'Instalación y publicación' },
  { id: 'problemas', titulo: 'Solución de problemas' },
]

function ContenidoDocumentacion() {
  return (
    <div className="pb-24">
      <header className="border-b border-borde bg-tarjeta">
        <div className="contenedor flex flex-col gap-6 py-12 sm:flex-row sm:items-end sm:justify-between sm:py-16">
          <div>
            <p className="antetitulo flex items-center gap-2">
              <BookOpen size={14} aria-hidden="true" /> Documentación
            </p>
            <h1 className="mt-3 font-serif text-4xl leading-tight sm:text-5xl">Cómo funciona la web</h1>
            <p className="mt-3 max-w-2xl text-gris">
              Guía de uso del panel, configuración del sitio, envío de correo y manejo de los datos de demostración.
            </p>
          </div>
          <BotonLink to="/admin" variante="suave" tamano="sm">
            <ArrowLeft size={15} aria-hidden="true" /> Volver al panel
          </BotonLink>
        </div>
      </header>

      <div className="contenedor mt-12 grid gap-12 lg:grid-cols-[230px_minmax(0,1fr)]">
        <nav aria-label="Índice de la documentación" className="lg:sticky lg:top-28 lg:self-start">
          <p className="antetitulo">Contenido</p>
          <ol className="mt-4 space-y-2.5 border-l border-borde text-sm">
            {SECCIONES.map((s, i) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="-ml-px block border-l border-transparent pl-4 text-gris hover:border-arena hover:text-tinta">
                  {i + 1}. {s.titulo}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <article className="min-w-0 max-w-3xl space-y-16 text-[15px] leading-relaxed text-stone-700">
          <Seccion id="resumen" n={1}>
            <p>
              Web de <strong>{CONFIG.marca}</strong> para presentar los servicios, mostrar la galería y recibir solicitudes de
              reserva online. Incluye un panel privado para gestionar reservas, horarios, bloqueos, servicios, galería y la
              cuenta de administración.
            </p>
            <Aviso tipo="advertencia" className="mt-5" titulo="Todo se guarda en el navegador">
              Esta versión no tiene base de datos: reservas, bloqueos, cambios del panel y la contraseña se guardan en el
              navegador donde se hicieron (localStorage). Otro dispositivo o navegador no los ve. Ver{' '}
              <a href="#almacenamiento" className="underline underline-offset-2">
                Dónde se guardan los datos
              </a>
              .
            </Aviso>
          </Seccion>

          <Seccion id="paginas" n={2}>
            <Tabla
              columnas={['Ruta', 'Contenido']}
              filas={[
                [<Codigo>/</Codigo>, 'Portada: presentación, servicios, galería y llamada a la acción.'],
                [<Codigo>/reservar</Codigo>, 'Reserva guiada en 4 pasos: servicio, fecha y horario, datos y revisión. Acepta ?servicio=bodas (o retratos, premama-familia, eventos) para preseleccionar.'],
                [<Codigo>/confirmacion/:código</Codigo>, 'Resumen de la solicitud y botón para preparar el mensaje de WhatsApp.'],
                [<Codigo>/contacto</Codigo>, 'Datos de contacto y formulario que abre WhatsApp con el mensaje redactado.'],
                [<Codigo>/politicas</Codigo>, 'Políticas y condiciones (contenido provisional, pendiente de redacción).'],
                [<Codigo>/admin</Codigo>, 'Panel de administración (requiere contraseña).'],
                [<Codigo>/admin/restablecer</Codigo>, 'Página a la que lleva el enlace para elegir una contraseña nueva.'],
                [<Codigo>/documentacion</Codigo>, 'Esta guía (requiere contraseña).'],
              ]}
            />
          </Seccion>

          <Seccion id="reservas" n={3}>
            <Subtitulo>El turno</Subtitulo>
            <p>
              Cada reserva ocupa un <strong>turno</strong>: hora de inicio + duración del servicio. Los horarios de inicio se
              ofrecen cada {CONFIG.agenda.intervaloMinutos} minutos y el turno completo tiene que caber dentro del{' '}
              <strong>horario de trabajo</strong>. Ejemplo: con cierre a las 22:00, una sesión de 1 hora puede empezar como
              máximo a las 21:00 y una de 8 horas, a las 14:00.
            </p>
            <Subtitulo>Estados de una reserva</Subtitulo>
            <Lista
              items={[
                <>
                  <strong>Pendiente</strong>: estado inicial de toda solicitud nueva. Ocupa su horario.
                </>,
                <>
                  <strong>Confirmada</strong>: la marcás desde el panel cuando la coordinación está cerrada. Ocupa su horario.
                </>,
                <>
                  <strong>Cancelada</strong>: libera el horario. Para volver a activarla, el horario tiene que seguir libre.
                </>,
              ]}
            />
            <Subtitulo>Calendario</Subtitulo>
            <Lista
              items={[
                'Disponible: el día no tiene ocupación.',
                'Horarios limitados: hay reservas o bloqueos, pero todavía entra un turno de la duración elegida.',
                'Completa: no entra ningún turno de esa duración.',
                'Bloqueada: el día completo está bloqueado.',
                'Pasada: no se puede reservar.',
              ]}
            />
            <Subtitulo>Protecciones</Subtitulo>
            <Lista
              items={[
                'Antes de guardar, la reserva se vuelve a comprobar contra lo guardado en ese momento: no se puede reservar dos veces el mismo horario (doble clic, dos pestañas abiertas).',
                'No se pueden reservar horarios pasados, bloqueados u ocupados, ni fuera del horario de trabajo.',
                'La solicitud queda registrada como pendiente: no es una confirmación definitiva. El cliente puede preparar un mensaje de WhatsApp con todos los datos; no se envía nada automáticamente.',
              ]}
            />
          </Seccion>

          <Seccion id="panel" n={4}>
            <p>
              Se entra desde <Codigo>/admin</Codigo> (también hay un enlace “Acceso administración” en el pie de página). La
              sesión dura mientras la pestaña esté abierta; el botón <strong>Cerrar sesión</strong> la termina.
            </p>
            <Tabla
              columnas={['Pestaña', 'Para qué sirve']}
              filas={[
                ['Reservas', 'Resumen (total, pendientes, confirmadas, canceladas, próximas), próximas reservas, búsqueda, filtros por estado y período, y cambio de estado. Cancelar pide confirmación.'],
                ['Agenda', 'Calendario de consulta: qué hay reservado o bloqueado cada día y qué franjas quedan libres.'],
                ['Bloqueos', 'Bloquear un día completo o una franja horaria, con motivo. Listar y eliminar bloqueos. No se puede bloquear sobre una reserva activa.'],
                ['Servicios', 'Horario de trabajo (apertura y cierre) y nombre y duración en horas de cada uno de los 4 servicios.'],
                ['Galería', 'Subir fotos (se reducen a 1600 px) o agregarlas por enlace, escribir la descripción, etiquetar, ordenar y eliminar. Muestra el espacio usado del navegador.'],
                ['Etiquetas', 'Crear, renombrar y eliminar etiquetas. Las que tienen fotos aparecen como filtros en la galería pública.'],
                ['Perfil', 'Cambiar el correo de la cuenta y la contraseña.'],
              ]}
            />
            <Subtitulo>Reglas que conviene saber</Subtitulo>
            <Lista
              items={[
                'Cambiar la duración de un servicio o el horario de trabajo solo afecta a las reservas nuevas. Las existentes conservan su horario, aunque queden fuera del nuevo (el panel avisa cuántas).',
                'El horario de trabajo no puede ser más corto que el servicio más largo.',
                'Para bloquear un día completo no puede tener reservas activas ni franjas ya bloqueadas.',
                'Eliminar una etiqueta la quita de las fotos, pero no borra las fotos.',
              ]}
            />
          </Seccion>

          <Seccion id="cuenta" n={5}>
            <Subtitulo>Datos iniciales</Subtitulo>
            <p>
              La contraseña y el correo iniciales están en <Codigo>src/config.ts</Codigo> (<Codigo>CONFIG.admin.clave</Codigo>{' '}
              y <Codigo>CONFIG.admin.email</Codigo>). Valen mientras no se cambien desde la pestaña <strong>Perfil</strong>.
            </p>
            <Subtitulo>Cambiar contraseña o correo</Subtitulo>
            <Pasos
              items={[
                'Entrá al panel y abrí la pestaña Perfil.',
                'Para el correo: escribí el nuevo y confirmá con tu contraseña actual.',
                'Para la contraseña: escribí la actual, la nueva (mínimo 8 caracteres, con letras y números) y repetila.',
              ]}
            />
            <Subtitulo>Si olvidaste la contraseña</Subtitulo>
            <Pasos
              items={[
                'En /admin, tocá “¿Olvidaste tu contraseña?”.',
                'Escribí el correo de la cuenta y tocá “Enviar enlace”. Por seguridad, la respuesta no dice si el correo coincide.',
                'Abrí el enlace (vale 60 minutos y se usa una sola vez) y elegí la contraseña nueva.',
                'Volvés a la pantalla de acceso: ingresá con la contraseña nueva.',
              ]}
            />
            <Aviso tipo="info" className="mt-5">
              Mientras el envío de correo no esté configurado, el mensaje no llega a ningún lado. En modo demostración el
              enlace se muestra en pantalla para poder probar el flujo (ver la sección siguiente).
            </Aviso>
            <Subtitulo>Seguridad</Subtitulo>
            <p>
              La contraseña no se guarda en texto: se guarda un hash PBKDF2-SHA-256 con sal. Del enlace de restablecimiento
              también se guarda solo el hash. Aun así, como todo corre en el navegador, es una{' '}
              <strong>protección de demostración</strong>: no reemplaza una autenticación con servidor.
            </p>
          </Seccion>

          <Seccion id="correo" n={6}>
            <p>
              Todo el envío de correos de la web pasa por un único archivo: <Codigo>src/services/correo.ts</Codigo>. Hoy no
              envía nada: <Codigo>enviarCorreo()</Codigo> responde <Codigo>{'{ enviado: false }'}</Codigo> y{' '}
              <Codigo>correoConfigurado()</Codigo> devuelve <Codigo>false</Codigo>, por eso la web avisa “El envío de correos
              todavía no está configurado”.
            </p>
            <Subtitulo>Pasos para activarlo</Subtitulo>
            <Pasos
              items={[
                <>
                  Preparar un punto de envío del lado del servidor (por ejemplo, una función propia en{' '}
                  <Codigo>/api/enviar-correo</Codigo>) que reciba el destinatario, el asunto y el texto, y mande el correo.
                </>,
                <>
                  Implementar <Codigo>enviarCorreo()</Codigo> en <Codigo>src/services/correo.ts</Codigo> para que llame a ese
                  punto de envío (ejemplo abajo).
                </>,
                <>
                  Hacer que <Codigo>correoConfigurado()</Codigo> devuelva <Codigo>true</Codigo>. Así la web deja de mostrar el
                  aviso y le dice al usuario que revise su correo.
                </>,
                <>
                  En <Codigo>src/config.ts</Codigo>, poner <Codigo>correo.mostrarEnlaceSinEnvio: false</Codigo> para que el
                  enlace de restablecimiento ya no aparezca en pantalla.
                </>,
                'Revisar CONFIG.admin.email (o cambiar el correo desde Perfil) para que sea un correo real.',
                'Probar: “¿Olvidaste tu contraseña?” con el correo de la cuenta tiene que hacer llegar el mensaje.',
              ]}
            />
            <Aviso tipo="advertencia" className="mt-5" titulo="Nunca pongas credenciales en el código de la web">
              Todo lo que está en <Codigo>src/</Codigo> se descarga en el navegador de cualquier visitante. Claves de acceso,
              contraseñas de correo o tokens tienen que vivir en el servidor (por ejemplo, como variables de entorno del punto de
              envío), nunca en <Codigo>config.ts</Codigo> ni en <Codigo>correo.ts</Codigo>.
            </Aviso>
            <Subtitulo>Ejemplo de enviarCorreo()</Subtitulo>
            <Bloque>{`// src/services/correo.ts
export function correoConfigurado(): boolean {
  return true
}

export async function enviarCorreo(correo: Correo): Promise<ResultadoEnvio> {
  try {
    const respuesta = await fetch('/api/enviar-correo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(correo), // { para, asunto, texto }
    })
    return { enviado: respuesta.ok }
  } catch {
    return { enviado: false }
  }
}`}</Bloque>
            <p className="mt-4">
              Si el envío falla (<Codigo>enviado: false</Codigo>), la web vuelve a mostrar el aviso de que no se envió el
              correo; no se pierde nada.
            </p>
          </Seccion>

          <Seccion id="configuracion" n={7}>
            <p>
              Todo lo editable “de código” está en <Codigo>src/config.ts</Codigo>. Después de cambiarlo hay que volver a
              publicar la web.
            </p>
            <Tabla
              columnas={['Dato', 'Dónde', 'Valor actual']}
              filas={[
                ['Número de WhatsApp (sin + ni espacios; vacío desactiva los botones)', <Codigo>whatsapp.numero</Codigo>, `${CONFIG.whatsapp.numero}${CONFIG.whatsapp.esMuestra ? ' (muestra)' : ''}`],
                ['Ocultar la etiqueta “muestra” de WhatsApp', <Codigo>whatsapp.esMuestra</Codigo>, String(CONFIG.whatsapp.esMuestra)],
                ['Perfil de Instagram', <Codigo>redes.instagram</Codigo>, CONFIG.redes.instagram.esMuestra ? 'Muestra' : CONFIG.redes.instagram.usuario],
                ['Correo público de contacto (vacío = no se muestra)', <Codigo>email</Codigo>, CONFIG.email || '(vacío)'],
                ['Ubicación, cobertura y horario de atención', <Codigo>ubicacion · cobertura · horario</Codigo>, CONFIG.ubicacion],
                ['Horario de trabajo por defecto (se cambia desde el panel)', <Codigo>agenda.horaInicio / horaFin</Codigo>, `${CONFIG.agenda.horaInicio} a ${CONFIG.agenda.horaFin}`],
                ['Separación entre horarios de inicio', <Codigo>agenda.intervaloMinutos</Codigo>, `${CONFIG.agenda.intervaloMinutos} min`],
                ['Contraseña y correo iniciales de la cuenta', <Codigo>admin.clave · admin.email</Codigo>, 'Ver config.ts'],
                ['Mostrar el enlace de restablecimiento en pantalla', <Codigo>correo.mostrarEnlaceSinEnvio</Codigo>, String(CONFIG.correo.mostrarEnlaceSinEnvio)],
              ]}
            />
            <p className="mt-4">
              Otros contenidos: textos y fotos de los servicios en <Codigo>src/data/servicios.ts</Codigo> (no cambies los{' '}
              <Codigo>id</Codigo>, se guardan en cada reserva); fotos fijas de la portada y galería inicial en{' '}
              <Codigo>src/data/fotos.ts</Codigo>.
            </p>
          </Seccion>

          <Seccion id="datos-demo" n={8}>
            <p>La primera vez que se abre la web en un navegador se cargan datos de ejemplo:</p>
            <Lista
              items={[
                '6 reservas ficticias (LB-DEMO01 a LB-DEMO06) con fechas futuras: pendientes, confirmadas y una cancelada.',
                '3 bloqueos: dos de día completo y una franja horaria.',
                '4 etiquetas (Bodas, Retratos, Familias, Eventos) y 15 fotos en la galería.',
              ]}
            />
            <p className="mt-3">
              Las reservas y bloqueos de ejemplo llevan la marca “demo” en el panel, y sus datos de contacto son de prueba
              (dominio ejemplo.com). Solo se cargan si no hay datos guardados: nunca pisan datos existentes.
            </p>
            <Subtitulo>Quitar solo los datos de ejemplo</Subtitulo>
            <Pasos
              items={[
                'En el panel, bajá hasta el recuadro “Datos de demostración”.',
                'Tocá “Quitar datos de demostración” y confirmá.',
                'Se borran solo las reservas y bloqueos marcados como demo. Las solicitudes reales, la galería y la configuración no cambian.',
              ]}
            />
            <Subtitulo>Restablecer todo a los datos de demostración</Subtitulo>
            <Pasos
              items={[
                'En el mismo recuadro, tocá “Restablecer todo a los datos de demostración”.',
                'Confirmá. Se borran todas las reservas y bloqueos (también los reales), el horario de trabajo, los cambios de servicios, la galería y las etiquetas, y se vuelven a cargar los ejemplos.',
                'El correo y la contraseña de la cuenta no cambian.',
              ]}
            />
            <Subtitulo>Empezar de cero a mano (también la cuenta)</Subtitulo>
            <Pasos
              items={[
                'Abrí las herramientas del navegador (F12) → pestaña Aplicación (Application) → Almacenamiento local (Local Storage) → el dominio de la web.',
                'Borrá las claves que empiezan con leandro_baez_. Si borrás leandro_baez_cuenta, vuelven a valer la contraseña y el correo iniciales de config.ts.',
                'Recargá la página: se cargan de nuevo los datos de ejemplo.',
              ]}
            />
            <Aviso tipo="info" className="mt-5">
              Todo esto afecta solo al navegador donde lo hacés. Cada visitante tiene sus propios datos locales.
            </Aviso>
          </Seccion>

          <Seccion id="almacenamiento" n={9}>
            <Tabla
              columnas={['Clave de localStorage', 'Contenido']}
              filas={[
                [<Codigo>leandro_baez_reservas</Codigo>, 'Reservas'],
                [<Codigo>leandro_baez_fechas_bloqueadas</Codigo>, 'Bloqueos de día completo o de franja'],
                [<Codigo>leandro_baez_servicios</Codigo>, 'Nombre y duración modificados de los servicios'],
                [<Codigo>leandro_baez_horario</Codigo>, 'Horario de trabajo'],
                [<Codigo>leandro_baez_etiquetas</Codigo>, 'Etiquetas de la galería'],
                [<Codigo>leandro_baez_galeria</Codigo>, 'Fotos de la galería (las subidas se guardan como imagen)'],
                [<Codigo>leandro_baez_cuenta</Codigo>, 'Correo y hash de la contraseña (solo si se cambiaron)'],
                [<Codigo>leandro_baez_restablecimiento</Codigo>, 'Pedido de restablecimiento vigente'],
                [<Codigo>leandro_baez_configuracion</Codigo>, 'Metadatos de la inicialización'],
                [<Codigo>leandro_baez_admin_sesion</Codigo>, 'Sesión del panel (sessionStorage: se borra al cerrar la pestaña)'],
              ]}
            />
            <Subtitulo>Limitaciones</Subtitulo>
            <Lista
              items={[
                'Los datos son locales a cada navegador: el fotógrafo no ve las reservas hechas desde el celular de un cliente, y los cambios del panel no los ven los visitantes.',
                'localStorage admite unos 5 MB por sitio. Cada foto subida ocupa entre 150 y 400 KB; para galerías grandes conviene usar enlaces.',
                'Si un dato guardado está dañado, no se borra en silencio: se guarda una copia con el sufijo __respaldo y la web muestra un aviso.',
                'Para compartir reservas entre dispositivos hace falta conectar una base de datos. Toda la lógica está en src/services/ (reservas.ts, catalogo.ts, cuenta.ts), pensada para reemplazar el almacenamiento sin tocar las páginas.',
              ]}
            />
          </Seccion>

          <Seccion id="publicacion" n={10}>
            <Subtitulo>Trabajar en local</Subtitulo>
            <Bloque>{`npm install        # una sola vez
npm run dev        # http://localhost:5173
npm run build      # compila en dist/ (incluye la comprobación de tipos)
npm run preview    # sirve la versión compilada`}</Bloque>
            <Subtitulo>Publicar</Subtitulo>
            <Pasos
              items={[
                'Subir los cambios al repositorio de GitHub (git add, git commit, git push).',
                'Si el proyecto de Vercel está conectado al repositorio, publica solo cada push a la rama main.',
                'La web es una aplicación de una sola página: vercel.json (y public/_redirects para otros servicios de alojamiento) hacen que rutas como /admin o /reservar funcionen al abrirlas directamente.',
              ]}
            />
          </Seccion>

          <Seccion id="problemas" n={11}>
            <Problema titulo="No puedo entrar al panel">
              Usá “¿Olvidaste tu contraseña?”. Si el envío de correo no está configurado y el modo demostración está apagado,
              borrá la clave <Codigo>leandro_baez_cuenta</Codigo> del almacenamiento local (ver{' '}
              <a href="#datos-demo" className="underline underline-offset-2">
                Datos de demostración
              </a>
              ): vuelve a valer la contraseña inicial de <Codigo>config.ts</Codigo>.
            </Problema>
            <Problema titulo="El enlace para restablecer dice que no es válido">
              Vence a los 60 minutos, sirve una sola vez y deja de valer si después pediste otro o cambiaste el correo o la
              contraseña. Pedí uno nuevo.
            </Problema>
            <Problema titulo="Un día aparece “Completa” aunque tiene horas libres">
              El calendario considera la duración del servicio elegido: si los huecos libres son más cortos que la sesión, el día
              figura completo para ese servicio. En la pestaña Agenda se ven las franjas libres.
            </Problema>
            <Problema titulo="No me deja bloquear un día">
              El día tiene reservas activas o franjas ya bloqueadas. Cancelá esas reservas o eliminá las franjas primero.
            </Problema>
            <Problema titulo="No puedo subir más fotos">
              Se llenó el almacenamiento del navegador (el panel de galería muestra el espacio usado). Eliminá fotos subidas o
              agregá las nuevas por enlace.
            </Problema>
            <Problema titulo="Aparece un aviso de “datos dañados”">
              Algún dato guardado no tenía el formato esperado. La web guardó una copia con el sufijo{' '}
              <Codigo>__respaldo</Codigo> y siguió con el resto. Podés cerrar el aviso; si se repite, restablecé los datos.
            </Problema>
            <Problema titulo="En Vercel, /admin muestra un error 404">
              Comprobá que <Codigo>vercel.json</Codigo> esté en la raíz del repositorio y que el último despliegue lo incluya.
            </Problema>
          </Seccion>
        </article>
      </div>
    </div>
  )
}

function Seccion({ id, n, children }: { id: string; n: number; children: ReactNode }) {
  const titulo = SECCIONES.find((s) => s.id === id)!.titulo
  return (
    <section id={id} aria-labelledby={`t-${id}`} className="scroll-mt-28">
      <h2 id={`t-${id}`} className="font-serif text-3xl leading-tight text-tinta">
        <span className="mr-3 text-arena">{n}.</span>
        {titulo}
      </h2>
      <div className="mt-5">{children}</div>
    </section>
  )
}

function Subtitulo({ children }: { children: ReactNode }) {
  return <h3 className="mt-8 mb-3 font-serif text-xl text-tinta">{children}</h3>
}

function Codigo({ children }: { children: ReactNode }) {
  return <code className="rounded-sm bg-stone-100 px-1.5 py-0.5 font-mono text-[0.85em] break-words text-tinta">{children}</code>
}

function Bloque({ children }: { children: string }) {
  return (
    <pre className="mt-3 overflow-x-auto rounded-sm bg-tinta p-4 font-mono text-[13px] leading-relaxed text-stone-100">
      <code>{children}</code>
    </pre>
  )
}

function Lista({ items }: { items: ReactNode[] }) {
  return (
    <ul className="space-y-2">
      {items.map((it, i) => (
        <li key={i} className="flex gap-3">
          <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-arena" aria-hidden="true" />
          <span>{it}</span>
        </li>
      ))}
    </ul>
  )
}

function Pasos({ items }: { items: ReactNode[] }) {
  return (
    <ol className="space-y-3">
      {items.map((it, i) => (
        <li key={i} className="flex gap-3">
          <span className="grid size-6 shrink-0 place-items-center rounded-full bg-arena-claro text-xs font-medium text-arena-texto">
            {i + 1}
          </span>
          <span className="pt-0.5">{it}</span>
        </li>
      ))}
    </ol>
  )
}

function Tabla({ columnas, filas }: { columnas: string[]; filas: ReactNode[][] }) {
  return (
    <div className="mt-2 overflow-x-auto rounded-sm border border-borde bg-tarjeta">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-borde text-[11px] tracking-[0.14em] text-gris uppercase">
          <tr>
            {columnas.map((c) => (
              <th key={c} scope="col" className="px-4 py-3 font-medium">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-borde align-top">
          {filas.map((fila, i) => (
            <tr key={i}>
              {fila.map((celda, j) => (
                <td key={j} className={j === 0 ? 'px-4 py-3 font-medium text-tinta' : 'px-4 py-3'}>
                  {celda}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Problema({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <details className="group border-b border-borde py-4 first:pt-0">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium text-tinta">
        {titulo}
        <span className="text-arena-texto transition-transform group-open:rotate-45" aria-hidden="true">
          +
        </span>
      </summary>
      <div className="mt-3">{children}</div>
    </details>
  )
}
