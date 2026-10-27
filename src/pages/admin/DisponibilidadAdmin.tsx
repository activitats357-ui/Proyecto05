import { Ban, CalendarDays, Lock, Unlock } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Boton } from '../../components/Boton'
import { Calendario, LeyendaCalendario, TEXTO_ESTADO_DIA } from '../../components/Calendario'
import { EtiquetaEstado } from '../../components/Varios'
import { useDatos } from '../../context/contextoDatos'
import { formatearFechaCorta, formatearFechaHora, formatearFechaLarga, mesDeFecha } from '../../lib/fechas'
import { bloqueoEn, MAX_MOTIVO_BLOQUEO, reservaActivaEn } from '../../services/reservas'
import type { EstadoDia } from '../../types'
import type { Mensaje } from './PanelAdmin'

const seleccionableAdmin = (estado: EstadoDia) => estado !== 'pasada'

export function DisponibilidadAdmin({ onMensaje }: { onMensaje: (m: Mensaje | null) => void }) {
  const { reservas, bloqueos, hoy, estadoDeFecha, bloquearFecha, desbloquearFecha } = useDatos()
  const [mes, setMes] = useState(() => mesDeFecha(hoy))
  const [fecha, setFecha] = useState<string | null>(null)
  const [motivo, setMotivo] = useState('')

  const estado = fecha ? estadoDeFecha(fecha) : null
  const reserva = fecha ? reservaActivaEn(fecha, reservas) : undefined
  const bloqueo = fecha ? bloqueoEn(fecha, bloqueos) : undefined
  const proximosBloqueos = bloqueos.filter((b) => b.fecha >= hoy)

  function bloquear(e: FormEvent) {
    e.preventDefault()
    if (!fecha) return
    try {
      bloquearFecha(fecha, motivo)
      setMotivo('')
      onMensaje({ tipo: 'exito', texto: `${formatearFechaLarga(fecha)}: fecha bloqueada.` })
    } catch (err) {
      onMensaje({ tipo: 'error', texto: err instanceof Error ? err.message : 'No se pudo bloquear la fecha.' })
    }
  }

  function desbloquear(f: string) {
    try {
      desbloquearFecha(f)
      onMensaje({ tipo: 'exito', texto: `${formatearFechaLarga(f)}: fecha desbloqueada y disponible para reservas.` })
    } catch (err) {
      onMensaje({ tipo: 'error', texto: err instanceof Error ? err.message : 'No se pudo desbloquear la fecha.' })
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
      <section aria-labelledby="titulo-cal-admin" className="rounded-sm border border-borde bg-tarjeta p-4 sm:p-7">
        <h2 id="titulo-cal-admin" className="sr-only">
          Calendario de disponibilidad
        </h2>
        <Calendario
          mes={mes}
          onCambiarMes={setMes}
          seleccionada={fecha}
          onSeleccionar={(f) => {
            setFecha(f)
            setMotivo('')
          }}
          esSeleccionable={seleccionableAdmin}
          describirDia={(f) => {
            const r = reservaActivaEn(f, reservas)
            if (r) return `reserva ${r.id} de ${r.nombre}`
            return bloqueoEn(f, bloqueos)?.motivo
          }}
        />
        <LeyendaCalendario className="mt-6 border-t border-borde pt-5" />
      </section>

      <div className="space-y-6">
        <section aria-labelledby="titulo-dia" aria-live="polite" className="rounded-sm border border-borde bg-tarjeta p-6">
          <h2 id="titulo-dia" className="antetitulo">
            Día seleccionado
          </h2>
          {!fecha || !estado ? (
            <div className="mt-5 flex flex-col items-center py-6 text-center text-sm text-gris">
              <CalendarDays size={28} className="text-stone-300" aria-hidden="true" />
              <p className="mt-3 max-w-60">Elegí un día del calendario para bloquearlo, desbloquearlo o ver su reserva.</p>
            </div>
          ) : (
            <div className="mt-4">
              <p className="font-serif text-2xl leading-snug">{formatearFechaLarga(fecha)}</p>
              <p className="mt-1 text-sm text-gris">Estado: {TEXTO_ESTADO_DIA[estado]}</p>

              {estado === 'disponible' && (
                <form onSubmit={bloquear} className="mt-6">
                  <label htmlFor="motivo-bloqueo" className="block text-sm font-medium">
                    Motivo del bloqueo <span className="font-normal text-gris">(opcional)</span>
                  </label>
                  <input
                    id="motivo-bloqueo"
                    type="text"
                    value={motivo}
                    maxLength={MAX_MOTIVO_BLOQUEO}
                    onChange={(e) => setMotivo(e.target.value)}
                    placeholder="Ej.: Descanso personal"
                    className="control"
                  />
                  <Boton type="submit" className="mt-4 w-full">
                    <Lock size={15} aria-hidden="true" /> Bloquear fecha
                  </Boton>
                </form>
              )}

              {estado === 'bloqueada' && bloqueo && (
                <div className="mt-6">
                  <dl className="space-y-2 text-sm">
                    <div>
                      <dt className="text-[13px] text-gris">Motivo</dt>
                      <dd>{bloqueo.motivo || 'Sin motivo indicado'}</dd>
                    </div>
                    <div>
                      <dt className="text-[13px] text-gris">Bloqueada el</dt>
                      <dd>{formatearFechaHora(bloqueo.creadaEn)}</dd>
                    </div>
                  </dl>
                  <Boton variante="contorno" className="mt-5 w-full" onClick={() => desbloquear(fecha)}>
                    <Unlock size={15} aria-hidden="true" /> Desbloquear fecha
                  </Boton>
                </div>
              )}

              {estado === 'ocupada' && reserva && (
                <div className="mt-6">
                  <div className="rounded-sm border border-borde p-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[13px]">{reserva.id}</span>
                      <EtiquetaEstado estado={reserva.estado} />
                    </div>
                    <p className="mt-2 text-sm font-medium">{reserva.nombre}</p>
                    <p className="text-[13px] text-gris">{reserva.servicioNombre}</p>
                  </div>
                  <p className="mt-4 flex gap-2 text-[13px] leading-relaxed text-ocupada">
                    <Ban size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
                    Este día no se puede bloquear ni desbloquear porque tiene una reserva activa. Para liberarlo, cancelá la
                    reserva desde la pestaña Reservas.
                  </p>
                </div>
              )}
            </div>
          )}
        </section>

        <section aria-labelledby="titulo-bloqueos" className="rounded-sm border border-borde bg-tarjeta p-6">
          <h2 id="titulo-bloqueos" className="antetitulo">
            Fechas bloqueadas ({proximosBloqueos.length})
          </h2>
          {proximosBloqueos.length === 0 ? (
            <p className="mt-4 text-sm text-gris">No hay fechas bloqueadas desde hoy.</p>
          ) : (
            <ul className="mt-4 divide-y divide-borde">
              {proximosBloqueos.map((b) => (
                <li key={b.fecha} className="flex items-center justify-between gap-3 py-3">
                  <button
                    type="button"
                    onClick={() => {
                      setFecha(b.fecha)
                      setMes(mesDeFecha(b.fecha))
                    }}
                    className="min-w-0 text-left hover:opacity-75"
                  >
                    <p className="text-sm font-medium">{formatearFechaCorta(b.fecha)}</p>
                    <p className="truncate text-[13px] text-gris">{b.motivo || 'Sin motivo'}</p>
                  </button>
                  <Boton variante="suave" tamano="sm" onClick={() => desbloquear(b.fecha)} aria-label={`Desbloquear ${formatearFechaLarga(b.fecha)}`}>
                    <Unlock size={14} aria-hidden="true" /> Desbloquear
                  </Boton>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
