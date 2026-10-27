import { Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { DialogoConfirmacion } from '../../components/Dialogo'
import { EtiquetaEstado } from '../../components/Varios'
import { useDatos } from '../../context/contextoDatos'
import { cx } from '../../lib/cx'
import { formatearFechaCorta, formatearFechaHora, formatearFechaLarga, sumarDias } from '../../lib/fechas'
import { formatearFranja } from '../../lib/horas'
import { ocupaFecha } from '../../services/reservas'
import { ESTADOS_RESERVA, ETIQUETA_ESTADO, type EstadoReserva, type Reserva } from '../../types'
import type { Mensaje } from './PanelAdmin'

type FiltroPeriodo = 'todas' | 'proximas' | 'proximos-30' | 'este-mes' | 'pasadas' | 'personalizado'

const PERIODOS: { id: FiltroPeriodo; texto: string }[] = [
  { id: 'todas', texto: 'Todas las fechas' },
  { id: 'proximas', texto: 'Desde hoy' },
  { id: 'proximos-30', texto: 'Próximos 30 días' },
  { id: 'este-mes', texto: 'Este mes' },
  { id: 'pasadas', texto: 'Fechas pasadas' },
  { id: 'personalizado', texto: 'Rango personalizado' },
]

export function ReservasAdmin({ onMensaje }: { onMensaje: (m: Mensaje | null) => void }) {
  const { reservas, hoy, cambiarEstado } = useDatos()
  const [estado, setEstado] = useState<EstadoReserva | 'todos'>('todos')
  const [periodo, setPeriodo] = useState<FiltroPeriodo>('todas')
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [aCancelar, setACancelar] = useState<Reserva | null>(null)

  const filtradas = useMemo(() => {
    const mesActual = hoy.slice(0, 7)
    const en30 = sumarDias(hoy, 30)
    const texto = busqueda.trim().toLowerCase()
    return reservas
      .filter((r) => estado === 'todos' || r.estado === estado)
      .filter((r) => {
        switch (periodo) {
          case 'proximas':
            return r.fecha >= hoy
          case 'proximos-30':
            return r.fecha >= hoy && r.fecha <= en30
          case 'este-mes':
            return r.fecha.startsWith(mesActual)
          case 'pasadas':
            return r.fecha < hoy
          case 'personalizado':
            return (!desde || r.fecha >= desde) && (!hasta || r.fecha <= hasta)
          default:
            return true
        }
      })
      .filter((r) => !texto || [r.id, r.nombre, r.email, r.celular].some((v) => v.toLowerCase().includes(texto)))
      .sort((a, b) => a.fecha.localeCompare(b.fecha) || a.horaInicio.localeCompare(b.horaInicio))
  }, [reservas, estado, periodo, desde, hasta, busqueda, hoy])

  const proximas = reservas
    .filter((r) => ocupaFecha(r.estado) && r.fecha >= hoy)
    .sort((a, b) => a.fecha.localeCompare(b.fecha) || a.horaInicio.localeCompare(b.horaInicio))
    .slice(0, 4)

  function aplicarCambio(r: Reserva, nuevo: EstadoReserva) {
    try {
      cambiarEstado(r.id, nuevo)
      onMensaje({ tipo: 'exito', texto: `Reserva ${r.id} (${r.nombre}): estado actualizado a “${ETIQUETA_ESTADO[nuevo]}”.` })
    } catch (e) {
      onMensaje({ tipo: 'error', texto: e instanceof Error ? e.message : 'No se pudo actualizar la reserva.' })
    }
  }

  function solicitarCambio(r: Reserva, nuevo: EstadoReserva) {
    if (nuevo === r.estado) return
    if (nuevo === 'cancelada') setACancelar(r)
    else aplicarCambio(r, nuevo)
  }

  const selectorEstado = (r: Reserva) => (
    <select
      aria-label={`Estado de la reserva ${r.id}`}
      value={r.estado}
      onChange={(e) => solicitarCambio(r, e.target.value as EstadoReserva)}
      className="h-9 rounded-sm border border-borde bg-tarjeta pr-8 pl-2.5 text-[13px] hover:border-stone-400 focus:border-tinta focus:outline-none"
    >
      {ESTADOS_RESERVA.map((e) => (
        <option key={e} value={e}>
          {ETIQUETA_ESTADO[e]}
        </option>
      ))}
    </select>
  )

  return (
    <div className="space-y-12">
      <section aria-labelledby="titulo-proximas">
        <h2 id="titulo-proximas" className="font-serif text-2xl">
          Próximas reservas
        </h2>
        {proximas.length === 0 ? (
          <p className="mt-4 text-sm text-gris">No hay reservas activas desde hoy.</p>
        ) : (
          <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {proximas.map((r) => (
              <li key={r.id} className="rounded-sm border border-borde bg-tarjeta p-4">
                <p className="font-serif text-lg leading-snug">{formatearFechaLarga(r.fecha)}</p>
                <p className="mt-1 text-[13px] text-gris tabular-nums">{formatearFranja(r.horaInicio, r.horaFin)}</p>
                <p className="mt-2 truncate text-sm">{r.nombre}</p>
                <p className="truncate text-[13px] text-gris">{r.servicioNombre}</p>
                <EtiquetaEstado estado={r.estado} className="mt-3" />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="titulo-listado">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="titulo-listado" className="font-serif text-2xl">
            Todas las reservas
          </h2>
          <p className="text-[13px] text-gris" aria-live="polite">
            {filtradas.length} de {reservas.length} reserva(s)
          </p>
        </div>

        <div className="mt-5 grid gap-3 rounded-sm border border-borde bg-tarjeta p-4 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr]">
          <label className="relative block">
            <span className="sr-only">Buscar por código, nombre, correo o celular</span>
            <Search size={16} className="pointer-events-none absolute top-1/2 left-3 mt-1 -translate-y-1/2 text-gris" aria-hidden="true" />
            <input
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por código, nombre o correo"
              className="control mt-2 pl-9"
            />
          </label>
          <label className="block">
            <span className="sr-only">Filtrar por estado</span>
            <select value={estado} onChange={(e) => setEstado(e.target.value as EstadoReserva | 'todos')} className="control">
              <option value="todos">Todos los estados</option>
              {ESTADOS_RESERVA.map((e) => (
                <option key={e} value={e}>
                  {ETIQUETA_ESTADO[e]}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="sr-only">Filtrar por período</span>
            <select value={periodo} onChange={(e) => setPeriodo(e.target.value as FiltroPeriodo)} className="control">
              {PERIODOS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.texto}
                </option>
              ))}
            </select>
          </label>
          {periodo === 'personalizado' && (
            <div className="grid grid-cols-2 gap-3 sm:col-span-2 lg:col-span-3">
              <label className="block text-[13px] text-gris">
                Desde
                <input type="date" value={desde} max={hasta || undefined} onChange={(e) => setDesde(e.target.value)} className="control" />
              </label>
              <label className="block text-[13px] text-gris">
                Hasta
                <input type="date" value={hasta} min={desde || undefined} onChange={(e) => setHasta(e.target.value)} className="control" />
              </label>
            </div>
          )}
        </div>

        {filtradas.length === 0 ? (
          <p className="mt-6 rounded-sm border border-dashed border-stone-300 p-8 text-center text-sm text-gris">
            No hay reservas que coincidan con los filtros.
          </p>
        ) : (
          <>
            {/* Escritorio: tabla */}
            <div className="mt-6 hidden overflow-x-auto rounded-sm border border-borde bg-tarjeta lg:block">
              <table className="w-full text-left text-sm">
                <caption className="sr-only">Listado de reservas</caption>
                <thead className="border-b border-borde text-[11px] tracking-[0.14em] text-gris uppercase">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-medium">Código</th>
                    <th scope="col" className="px-4 py-3 font-medium">Fecha</th>
                    <th scope="col" className="px-4 py-3 font-medium">Cliente</th>
                    <th scope="col" className="px-4 py-3 font-medium">Contacto</th>
                    <th scope="col" className="px-4 py-3 font-medium">Servicio</th>
                    <th scope="col" className="px-4 py-3 font-medium">Estado</th>
                    <th scope="col" className="px-4 py-3 font-medium">Creada</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-borde">
                  {filtradas.map((r) => (
                    <tr key={r.id} className={cx('align-top', r.estado === 'cancelada' && 'bg-stone-50/70 text-stone-500')}>
                      <td className="px-4 py-4 font-mono text-[13px] whitespace-nowrap">
                        {r.id}
                        {r.esDemo && <EtiquetaDemo />}
                      </td>
                      <td className={cx('px-4 py-4 whitespace-nowrap', r.fecha < hoy && 'text-gris')}>
                        {formatearFechaCorta(r.fecha)}
                        <p className="text-[13px] text-gris tabular-nums">
                          {r.horaInicio}–{r.horaFin}
                        </p>
                      </td>
                      <td className="max-w-48 px-4 py-4">
                        <p className="font-medium">{r.nombre}</p>
                        {r.notas && (
                          <p className="mt-1 line-clamp-2 text-[13px] text-gris" title={r.notas}>
                            {r.notas}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-4 text-[13px]">
                        <p className="whitespace-nowrap">{r.celular}</p>
                        <p className="text-gris">{r.email}</p>
                      </td>
                      <td className="px-4 py-4">{r.servicioNombre}</td>
                      <td className="px-4 py-4">{selectorEstado(r)}</td>
                      <td className="px-4 py-4 text-[13px] whitespace-nowrap text-gris">{formatearFechaHora(r.creadaEn)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Móvil y tablet: tarjetas */}
            <ul className="mt-6 space-y-3 lg:hidden">
              {filtradas.map((r) => (
                <li key={r.id} className={cx('rounded-sm border border-borde bg-tarjeta p-4', r.estado === 'cancelada' && 'opacity-75')}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-serif text-lg">{formatearFechaLarga(r.fecha)}</p>
                      <p className="mt-0.5 font-mono text-xs text-gris">
                        {r.id}
                        {r.esDemo && <EtiquetaDemo />}
                      </p>
                    </div>
                    <EtiquetaEstado estado={r.estado} className="shrink-0" />
                  </div>
                  <dl className="mt-4 grid grid-cols-[6.5rem_1fr] gap-x-3 gap-y-1.5 text-[13px]">
                    <dt className="text-gris">Horario</dt>
                    <dd className="tabular-nums">{formatearFranja(r.horaInicio, r.horaFin)}</dd>
                    <dt className="text-gris">Cliente</dt>
                    <dd className="min-w-0 break-words">{r.nombre}</dd>
                    <dt className="text-gris">Servicio</dt>
                    <dd>{r.servicioNombre}</dd>
                    <dt className="text-gris">Celular</dt>
                    <dd>{r.celular}</dd>
                    <dt className="text-gris">Correo</dt>
                    <dd className="min-w-0 break-all">{r.email}</dd>
                    {r.notas && (
                      <>
                        <dt className="text-gris">Notas</dt>
                        <dd className="min-w-0 break-words">{r.notas}</dd>
                      </>
                    )}
                    <dt className="text-gris">Creada</dt>
                    <dd>{formatearFechaHora(r.creadaEn)}</dd>
                  </dl>
                  <div className="mt-4 flex items-center justify-between gap-3 border-t border-borde pt-3">
                    <span className="text-[13px] text-gris">Cambiar estado</span>
                    {selectorEstado(r)}
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      <DialogoConfirmacion
        abierto={aCancelar !== null}
        titulo="¿Cancelar esta reserva?"
        descripcion={
          aCancelar && (
            <>
              La reserva <strong className="text-tinta">{aCancelar.id}</strong> de {aCancelar.nombre} para el{' '}
              {formatearFechaLarga(aCancelar.fecha)} ({formatearFranja(aCancelar.horaInicio, aCancelar.horaFin)}) pasará a
              “Cancelada” y ese horario quedará disponible en el calendario.
            </>
          )
        }
        textoConfirmar="Sí, cancelar reserva"
        textoCancelar="No, mantener"
        peligro
        onConfirmar={() => {
          if (aCancelar) aplicarCambio(aCancelar, 'cancelada')
          setACancelar(null)
        }}
        onCancelar={() => setACancelar(null)}
      />
    </div>
  )
}

function EtiquetaDemo() {
  return <span className="ml-2 rounded-sm bg-stone-100 px-1.5 py-0.5 font-sans text-[10px] tracking-wider text-gris uppercase">demo</span>
}
