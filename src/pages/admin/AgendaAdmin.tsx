import { Ban, CalendarDays, Clock } from 'lucide-react'
import { useState } from 'react'
import { Boton } from '../../components/Boton'
import { Calendario, LeyendaCalendario, TEXTO_ESTADO_DIA } from '../../components/Calendario'
import { EtiquetaEstado } from '../../components/Varios'
import { useDatos } from '../../context/contextoDatos'
import { formatearFechaLarga, mesDeFecha } from '../../lib/fechas'
import { aHora, diaDeLaSemana, formatearFranja, jornadaDe, NOMBRES_DIAS, textoJornadaDe } from '../../lib/horas'
import { bloqueoDiaCompleto, bloqueosDelDia, franjasLibres, reservasActivasDelDia } from '../../services/reservas'

const todosSeleccionables = () => true

/** Vista de consulta: qué hay reservado o bloqueado cada día y qué queda libre. */
export function AgendaAdmin({ onGestionarBloqueos }: { onGestionarBloqueos: () => void }) {
  const { reservas, bloqueos, hoy, estadoDeFecha } = useDatos()
  const [mes, setMes] = useState(() => mesDeFecha(hoy))
  const [fecha, setFecha] = useState<string>(hoy)

  const diaBloqueado = bloqueoDiaCompleto(fecha, bloqueos)
  const elementos = [
    ...reservasActivasDelDia(fecha, reservas).map((r) => ({ tipo: 'reserva' as const, inicio: r.horaInicio, fin: r.horaFin, reserva: r })),
    ...bloqueosDelDia(fecha, bloqueos)
      .filter((b) => b.horaInicio)
      .map((b) => ({ tipo: 'bloqueo' as const, inicio: b.horaInicio!, fin: b.horaFin!, bloqueo: b })),
  ].sort((a, b) => a.inicio.localeCompare(b.inicio))
  const libres = franjasLibres(fecha, reservas, bloqueos)

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
      <section aria-labelledby="titulo-cal-admin" className="rounded-sm border border-borde bg-tarjeta p-4 sm:p-7">
        <h2 id="titulo-cal-admin" className="sr-only">
          Calendario de la agenda
        </h2>
        <Calendario
          mes={mes}
          onCambiarMes={setMes}
          seleccionada={fecha}
          onSeleccionar={setFecha}
          esSeleccionable={todosSeleccionables}
          describirDia={(f) => {
            const n = reservasActivasDelDia(f, reservas).length
            return n ? `${n} reserva(s)` : undefined
          }}
        />
        <LeyendaCalendario className="mt-6 border-t border-borde pt-5" />
      </section>

      <section aria-labelledby="titulo-dia" aria-live="polite" className="rounded-sm border border-borde bg-tarjeta p-6 lg:self-start">
        <h2 id="titulo-dia" className="antetitulo">
          Agenda del día
        </h2>
        <p className="mt-4 font-serif text-2xl leading-snug">{formatearFechaLarga(fecha)}</p>
        <p className="mt-1 text-sm text-gris">
          Estado: {TEXTO_ESTADO_DIA[estadoDeFecha(fecha)]}
          {jornadaDe(fecha) && ` · Horario: ${textoJornadaDe(fecha)}`}
        </p>

        {diaBloqueado ? (
          <p className="mt-6 flex gap-2 rounded-sm bg-stone-100 p-4 text-sm">
            <Ban size={16} className="mt-0.5 shrink-0 text-gris" aria-hidden="true" />
            <span>
              Día completo bloqueado{diaBloqueado.motivo && <> · {diaBloqueado.motivo}</>}
            </span>
          </p>
        ) : elementos.length === 0 ? (
          <div className="mt-6 flex flex-col items-center py-4 text-center text-sm text-gris">
            <CalendarDays size={26} className="text-stone-300" aria-hidden="true" />
            <p className="mt-2">Sin reservas ni bloqueos este día.</p>
          </div>
        ) : (
          <ol className="mt-6 space-y-3">
            {elementos.map((e) =>
              e.tipo === 'reserva' ? (
                <li key={e.reserva.id} className="rounded-sm border border-borde p-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium tabular-nums">{formatearFranja(e.inicio, e.fin)}</span>
                    <EtiquetaEstado estado={e.reserva.estado} />
                  </div>
                  <p className="mt-1.5 text-sm">{e.reserva.nombre}</p>
                  <p className="text-[13px] text-gris">
                    {e.reserva.servicioNombre} · <span className="font-mono">{e.reserva.id}</span>
                  </p>
                </li>
              ) : (
                <li key={e.bloqueo.id} className="rayado rounded-sm border border-borde bg-stone-50 p-3.5">
                  <span className="text-sm font-medium tabular-nums">{formatearFranja(e.inicio, e.fin)}</span>
                  <p className="mt-1 text-[13px] text-gris">Bloqueado{e.bloqueo.motivo && ` · ${e.bloqueo.motivo}`}</p>
                </li>
              ),
            )}
          </ol>
        )}

        {!jornadaDe(fecha) && (
          <p className="mt-6 rounded-sm bg-stone-100 p-4 text-sm">
            Día cerrado según el horario semanal ({NOMBRES_DIAS[diaDeLaSemana(fecha)].toLowerCase()}). Se cambia en la pestaña
            Horario.
          </p>
        )}

        {!diaBloqueado && jornadaDe(fecha) && fecha >= hoy && (
          <div className="mt-6 border-t border-borde pt-5">
            <p className="flex items-center gap-2 text-[13px] text-gris">
              <Clock size={14} aria-hidden="true" /> Franjas libres
            </p>
            {libres.length === 0 ? (
              <p className="mt-2 text-sm">No queda tiempo libre en la jornada.</p>
            ) : (
              <ul className="mt-2 flex flex-wrap gap-2">
                {libres.map((l) => (
                  <li key={l.inicio} className="rounded-full bg-arena-claro px-3 py-1 text-[13px] text-arena-texto tabular-nums">
                    {formatearFranja(aHora(l.inicio), aHora(l.fin))}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <Boton variante="suave" tamano="sm" className="mt-6 w-full" onClick={onGestionarBloqueos}>
          <Ban size={14} aria-hidden="true" /> Gestionar bloqueos de días u horas
        </Boton>
      </section>
    </div>
  )
}
