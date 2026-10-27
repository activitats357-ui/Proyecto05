import { Ban, CalendarDays, Clock, Images, ListChecks, LogOut, Tags } from 'lucide-react'
import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { Aviso } from '../../components/Aviso'
import { Boton } from '../../components/Boton'
import { DialogoConfirmacion } from '../../components/Dialogo'
import { useDatos } from '../../context/contextoDatos'
import { cx } from '../../lib/cx'
import { calcularEstadisticas } from '../../services/reservas'
import { AgendaAdmin } from './AgendaAdmin'
import { BloqueosAdmin } from './BloqueosAdmin'
import { EtiquetasAdmin } from './EtiquetasAdmin'
import { GaleriaAdmin } from './GaleriaAdmin'
import { ReservasAdmin } from './ReservasAdmin'
import { ServiciosAdmin } from './ServiciosAdmin'

export interface Mensaje {
  tipo: 'exito' | 'error'
  texto: string
}

const PESTANAS = [
  { id: 'reservas', titulo: 'Reservas', Icono: ListChecks },
  { id: 'agenda', titulo: 'Agenda', Icono: CalendarDays },
  { id: 'bloqueos', titulo: 'Bloqueos', Icono: Ban },
  { id: 'servicios', titulo: 'Servicios', Icono: Clock },
  { id: 'galeria', titulo: 'Galería', Icono: Images },
  { id: 'etiquetas', titulo: 'Etiquetas', Icono: Tags },
] as const
type Pestana = (typeof PESTANAS)[number]['id']

export function PanelAdmin({ onSalir }: { onSalir: () => void }) {
  const { reservas, bloqueos, hoy, eliminarDatosDemo } = useDatos()
  const [pestana, setPestana] = useState<Pestana>('reservas')
  const [mensaje, setMensaje] = useState<Mensaje | null>(null)
  const [confirmarLimpieza, setConfirmarLimpieza] = useState(false)
  const refsPestanas = useRef<Record<string, HTMLButtonElement | null>>({})
  const stats = calcularEstadisticas(reservas, hoy)
  const cantidadDemo = reservas.filter((r) => r.esDemo).length + bloqueos.filter((b) => b.esDemo).length

  function cambiarPestana(id: Pestana) {
    setPestana(id)
    setMensaje(null)
  }

  // En pantallas angostas la barra de pestañas se desplaza: la activa queda a la vista.
  useEffect(() => {
    const boton = refsPestanas.current[pestana]
    const barra = boton?.parentElement
    if (!boton || !barra) return
    const izquierda = boton.offsetLeft - barra.offsetLeft
    if (izquierda < barra.scrollLeft || izquierda + boton.offsetWidth > barra.scrollLeft + barra.clientWidth) {
      barra.scrollTo({ left: izquierda - 16 })
    }
  }, [pestana])

  function alTeclearPestana(e: KeyboardEvent) {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
    const i = PESTANAS.findIndex((p) => p.id === pestana)
    const siguiente = PESTANAS[(i + (e.key === 'ArrowRight' ? 1 : -1) + PESTANAS.length) % PESTANAS.length].id
    cambiarPestana(siguiente)
    refsPestanas.current[siguiente]?.focus()
  }

  function limpiarDemo() {
    setConfirmarLimpieza(false)
    try {
      const r = eliminarDatosDemo()
      setMensaje({ tipo: 'exito', texto: `Se quitaron ${r.reservas} reserva(s) y ${r.bloqueos} bloqueo(s) de demostración.` })
    } catch (e) {
      setMensaje({ tipo: 'error', texto: e instanceof Error ? e.message : 'No se pudieron quitar los datos de demostración.' })
    }
  }

  const tarjetas = [
    { titulo: 'Total de reservas', valor: stats.total },
    { titulo: 'Pendientes', valor: stats.pendientes, punto: 'bg-arena' },
    { titulo: 'Confirmadas', valor: stats.confirmadas, punto: 'bg-exito' },
    { titulo: 'Canceladas', valor: stats.canceladas, punto: 'bg-stone-400' },
    { titulo: 'Próximas', valor: stats.proximas, detalle: 'Activas desde hoy' },
  ]

  return (
    <div className="pb-24">
      <header className="border-b border-borde bg-tarjeta">
        <div className="contenedor flex flex-col gap-6 py-10 sm:flex-row sm:items-end sm:justify-between sm:py-14">
          <div>
            <p className="antetitulo">Administración</p>
            <h1 className="mt-3 font-serif text-3xl sm:text-4xl">Panel de reservas</h1>
            <p className="mt-2 text-sm text-gris">Los datos se guardan en este navegador (localStorage).</p>
          </div>
          <Boton variante="suave" tamano="sm" onClick={onSalir}>
            <LogOut size={15} aria-hidden="true" /> Cerrar sesión
          </Boton>
        </div>
      </header>

      <div className="contenedor mt-10">
        <section aria-label="Resumen">
          <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-sm border border-borde bg-borde sm:grid-cols-3 lg:grid-cols-5">
            {tarjetas.map((t) => (
              <div key={t.titulo} className="bg-tarjeta p-5">
                <dt className="flex items-center gap-2 text-[13px] text-gris">
                  {t.punto && <span className={cx('size-1.5 rounded-full', t.punto)} aria-hidden="true" />}
                  {t.titulo}
                </dt>
                <dd className="mt-2 font-serif text-4xl tabular-nums">{t.valor}</dd>
                {t.detalle && <dd className="mt-1 text-xs text-gris">{t.detalle}</dd>}
              </div>
            ))}
          </dl>
        </section>

        <div className="sticky top-[72px] z-20 -mx-5 mt-10 border-b border-borde bg-fondo/95 px-5 backdrop-blur sm:mx-0 sm:px-0">
          <div role="tablist" aria-label="Secciones del panel" className="flex gap-6 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" onKeyDown={alTeclearPestana}>
            {PESTANAS.map(({ id, titulo, Icono }) => (
              <button
                key={id}
                ref={(el) => {
                  refsPestanas.current[id] = el
                }}
                id={`pestana-${id}`}
                role="tab"
                type="button"
                aria-selected={pestana === id}
                aria-controls={`panel-${id}`}
                tabIndex={pestana === id ? 0 : -1}
                onClick={() => cambiarPestana(id)}
                className={cx(
                  '-mb-px flex shrink-0 items-center gap-2 border-b-2 py-4 text-sm transition-colors',
                  pestana === id ? 'border-tinta text-tinta' : 'border-transparent text-gris hover:text-tinta',
                )}
              >
                <Icono size={16} aria-hidden="true" />
                {titulo}
              </button>
            ))}
          </div>
        </div>

        <div aria-live="polite" className="mt-6 empty:mt-0">
          {mensaje && (
            <Aviso tipo={mensaje.tipo} onCerrar={() => setMensaje(null)}>
              {mensaje.texto}
            </Aviso>
          )}
        </div>

        <div id={`panel-${pestana}`} role="tabpanel" aria-labelledby={`pestana-${pestana}`} className="mt-8">
          {
            {
              reservas: <ReservasAdmin onMensaje={setMensaje} />,
              agenda: <AgendaAdmin onGestionarBloqueos={() => cambiarPestana('bloqueos')} />,
              bloqueos: <BloqueosAdmin onMensaje={setMensaje} />,
              servicios: <ServiciosAdmin onMensaje={setMensaje} />,
              galeria: <GaleriaAdmin onMensaje={setMensaje} />,
              etiquetas: <EtiquetasAdmin onMensaje={setMensaje} />,
            }[pestana]
          }
        </div>

        {cantidadDemo > 0 && (
          <section className="mt-16 flex flex-col gap-4 rounded-sm border border-dashed border-stone-300 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-medium">Datos de demostración</h2>
              <p className="mt-1 text-[13px] text-gris">
                Hay {cantidadDemo} registro(s) de ejemplo (marcados como “demo”). Podés quitarlos sin afectar los datos reales.
              </p>
            </div>
            <Boton variante="suave" tamano="sm" onClick={() => setConfirmarLimpieza(true)}>
              Quitar datos de demostración
            </Boton>
          </section>
        )}
      </div>

      <DialogoConfirmacion
        abierto={confirmarLimpieza}
        titulo="¿Quitar los datos de demostración?"
        descripcion="Se eliminarán solo las reservas y fechas bloqueadas de ejemplo. Las solicitudes y bloqueos reales no se modifican."
        textoConfirmar="Quitar datos de ejemplo"
        peligro
        onConfirmar={limpiarDemo}
        onCancelar={() => setConfirmarLimpieza(false)}
      />
    </div>
  )
}
