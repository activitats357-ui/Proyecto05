import { Lock, Trash2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Boton } from '../../components/Boton'
import { Campo } from '../../components/Campo'
import { DialogoConfirmacion } from '../../components/Dialogo'
import { useDatos } from '../../context/contextoDatos'
import { cx } from '../../lib/cx'
import { formatearFechaCorta, formatearFechaLarga } from '../../lib/fechas'
import { formatearFranja, horasDelDia, textoJornada } from '../../lib/horas'
import { MAX_MOTIVO_BLOQUEO } from '../../services/reservas'
import type { FechaBloqueada } from '../../types'
import type { Mensaje } from './PanelAdmin'

type Tipo = 'dia' | 'franja'

export function BloqueosAdmin({ onMensaje }: { onMensaje: (m: Mensaje | null) => void }) {
  const { bloqueos, hoy, horario, bloquear, eliminarBloqueo } = useDatos()
  // Solo se ofrecen horas dentro del horario de trabajo vigente.
  const HORAS = horasDelDia().filter((h) => h >= horario.horaInicio && h <= horario.horaFin)
  const [fecha, setFecha] = useState('')
  const [tipo, setTipo] = useState<Tipo>('dia')
  const [desde, setDesde] = useState(HORAS[2] ?? HORAS[0])
  const [hasta, setHasta] = useState(HORAS[10] ?? HORAS[HORAS.length - 1])
  const [motivo, setMotivo] = useState('')
  const [errorFecha, setErrorFecha] = useState<string>()
  const [aEliminar, setAEliminar] = useState<FechaBloqueada | null>(null)
  const [verPasados, setVerPasados] = useState(false)

  const lista = bloqueos
    .filter((b) => verPasados || b.fecha >= hoy)
    .sort((a, b) => a.fecha.localeCompare(b.fecha) || (a.horaInicio ?? '').localeCompare(b.horaInicio ?? ''))

  function enviar(e: FormEvent) {
    e.preventDefault()
    if (!fecha) {
      setErrorFecha('Elegí la fecha que querés bloquear.')
      document.getElementById('bloqueo-fecha')?.focus()
      return
    }
    if (fecha < hoy) {
      setErrorFecha('No se pueden bloquear fechas pasadas.')
      return
    }
    setErrorFecha(undefined)
    try {
      bloquear(fecha, tipo === 'franja' ? { horaInicio: desde, horaFin: hasta } : null, motivo)
      onMensaje({
        tipo: 'exito',
        texto: `${formatearFechaLarga(fecha)}: ${tipo === 'dia' ? 'día completo bloqueado' : `franja ${formatearFranja(desde, hasta)} bloqueada`}.`,
      })
      setMotivo('')
    } catch (err) {
      onMensaje({ tipo: 'error', texto: err instanceof Error ? err.message : 'No se pudo guardar el bloqueo.' })
    }
  }

  function confirmarEliminacion() {
    if (!aEliminar) return
    try {
      eliminarBloqueo(aEliminar.id)
      onMensaje({ tipo: 'exito', texto: `Bloqueo del ${formatearFechaLarga(aEliminar.fecha)} eliminado.` })
    } catch (err) {
      onMensaje({ tipo: 'error', texto: err instanceof Error ? err.message : 'No se pudo eliminar el bloqueo.' })
    }
    setAEliminar(null)
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[400px_minmax(0,1fr)]">
      <section aria-labelledby="titulo-nuevo-bloqueo" className="rounded-sm border border-borde bg-tarjeta p-6 lg:self-start">
        <h2 id="titulo-nuevo-bloqueo" className="font-serif text-2xl">
          Nuevo bloqueo
        </h2>
        <p className="mt-1 text-sm text-gris">
          Bloqueá un día entero o solo unas horas del horario de trabajo ({textoJornada()}). No se puede bloquear sobre una
          reserva activa.
        </p>
        <form onSubmit={enviar} noValidate className="mt-6 space-y-5">
          <Campo id="bloqueo-fecha" etiqueta="Fecha" obligatorio error={errorFecha}>
            {(p) => <input {...p} type="date" min={hoy} value={fecha} onChange={(e) => setFecha(e.target.value)} className="control" />}
          </Campo>

          <fieldset>
            <legend className="text-sm font-medium">Qué querés bloquear</legend>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {(
                [
                  ['dia', 'Día completo'],
                  ['franja', 'Franja horaria'],
                ] as const
              ).map(([valor, texto]) => (
                <label
                  key={valor}
                  className={cx(
                    'flex h-11 cursor-pointer items-center justify-center rounded-sm border text-sm transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-tinta',
                    tipo === valor ? 'border-tinta bg-tinta text-white' : 'border-borde hover:border-stone-400',
                  )}
                >
                  <input type="radio" name="tipo-bloqueo" value={valor} checked={tipo === valor} onChange={() => setTipo(valor)} className="sr-only" />
                  {texto}
                </label>
              ))}
            </div>
          </fieldset>

          {tipo === 'franja' && (
            <div className="grid grid-cols-2 gap-3 animate-aparecer">
              <label className="block text-sm font-medium">
                Desde
                <select
                  value={desde}
                  onChange={(e) => {
                    setDesde(e.target.value)
                    if (hasta <= e.target.value) setHasta(HORAS[HORAS.indexOf(e.target.value) + 1])
                  }}
                  className="control"
                >
                  {HORAS.slice(0, -1).map((h) => (
                    <option key={h}>{h}</option>
                  ))}
                </select>
              </label>
              <label className="block text-sm font-medium">
                Hasta
                <select value={hasta} onChange={(e) => setHasta(e.target.value)} className="control">
                  {HORAS.filter((h) => h > desde).map((h) => (
                    <option key={h}>{h}</option>
                  ))}
                </select>
              </label>
            </div>
          )}

          <Campo id="bloqueo-motivo" etiqueta="Motivo">
            {(p) => (
              <input
                {...p}
                type="text"
                maxLength={MAX_MOTIVO_BLOQUEO}
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Ej.: Descanso personal"
                className="control"
              />
            )}
          </Campo>

          <Boton type="submit" className="w-full">
            <Lock size={15} aria-hidden="true" /> {tipo === 'dia' ? 'Bloquear día completo' : 'Bloquear franja'}
          </Boton>
        </form>
      </section>

      <section aria-labelledby="titulo-lista-bloqueos">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="titulo-lista-bloqueos" className="font-serif text-2xl">
            Bloqueos {verPasados ? '' : 'próximos'} <span className="text-gris">({lista.length})</span>
          </h2>
          <label className="flex items-center gap-2 text-[13px] text-gris">
            <input type="checkbox" checked={verPasados} onChange={(e) => setVerPasados(e.target.checked)} className="size-4 accent-tinta" />
            Mostrar pasados
          </label>
        </div>
        {lista.length === 0 ? (
          <p className="mt-5 rounded-sm border border-dashed border-stone-300 p-8 text-center text-sm text-gris">No hay bloqueos.</p>
        ) : (
          <ul className="mt-5 divide-y divide-borde rounded-sm border border-borde bg-tarjeta">
            {lista.map((b) => (
              <li key={b.id} className={cx('flex items-center justify-between gap-4 px-4 py-3.5', b.fecha < hoy && 'opacity-60')}>
                <div className="min-w-0">
                  <p className="text-sm font-medium">
                    {formatearFechaCorta(b.fecha)}
                    <span
                      className={cx(
                        'ml-2 rounded-full px-2 py-0.5 text-xs font-normal',
                        b.horaInicio ? 'bg-arena-claro text-arena-texto' : 'bg-stone-100 text-stone-600',
                      )}
                    >
                      {b.horaInicio ? formatearFranja(b.horaInicio, b.horaFin!) : 'Día completo'}
                    </span>
                    {b.esDemo && <span className="ml-2 text-[10px] tracking-wider text-gris uppercase">demo</span>}
                  </p>
                  <p className="mt-0.5 truncate text-[13px] text-gris">{b.motivo || 'Sin motivo'}</p>
                </div>
                <Boton
                  variante="suave"
                  tamano="sm"
                  onClick={() => setAEliminar(b)}
                  aria-label={`Eliminar bloqueo del ${formatearFechaLarga(b.fecha)}${b.horaInicio ? ` de ${formatearFranja(b.horaInicio, b.horaFin!)}` : ''}`}
                >
                  <Trash2 size={14} aria-hidden="true" /> <span className="hidden sm:inline">Eliminar</span>
                </Boton>
              </li>
            ))}
          </ul>
        )}
      </section>

      <DialogoConfirmacion
        abierto={aEliminar !== null}
        titulo="¿Eliminar este bloqueo?"
        descripcion={
          aEliminar && (
            <>
              {formatearFechaLarga(aEliminar.fecha)} ·{' '}
              {aEliminar.horaInicio ? formatearFranja(aEliminar.horaInicio, aEliminar.horaFin!) : 'día completo'}. Ese tiempo
              volverá a estar disponible para reservas.
            </>
          )
        }
        textoConfirmar="Eliminar bloqueo"
        peligro
        onConfirmar={confirmarEliminacion}
        onCancelar={() => setAEliminar(null)}
      />
    </div>
  )
}
