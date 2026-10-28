import { CalendarClock, Copy, Save } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Aviso } from '../../components/Aviso'
import { Boton } from '../../components/Boton'
import { useDatos } from '../../context/contextoDatos'
import { cx } from '../../lib/cx'
import { diaDeLaSemana, horasDelDia, NOMBRES_DIAS, resumenHorario } from '../../lib/horas'
import { validarHorario } from '../../services/catalogo'
import { ocupaFecha } from '../../services/reservas'
import type { HorarioSemanal } from '../../types'
import type { Mensaje } from './PanelAdmin'

const HORAS = horasDelDia()

const ATAJOS: { texto: string; dias: number[] }[] = [
  { texto: 'Lunes a viernes', dias: [0, 1, 2, 3, 4] },
  { texto: 'Lunes a sábado', dias: [0, 1, 2, 3, 4, 5] },
  { texto: 'Todos los días', dias: [0, 1, 2, 3, 4, 5, 6] },
]

export function HorarioAdmin({ onMensaje }: { onMensaje: (m: Mensaje | null) => void }) {
  const { horario } = useDatos()
  // La key reinicia el formulario con los valores guardados después de guardar.
  return <FormularioHorario key={JSON.stringify(horario)} guardado={horario} onMensaje={onMensaje} />
}

function FormularioHorario({ guardado, onMensaje }: { guardado: HorarioSemanal; onMensaje: (m: Mensaje | null) => void }) {
  const { servicios, reservas, hoy, actualizarHorario } = useDatos()
  const [dias, setDias] = useState<HorarioSemanal>(() => guardado.map((d) => ({ ...d })))
  const [comunDesde, setComunDesde] = useState(guardado.find((d) => d.abierto)?.horaInicio ?? '08:00')
  const [comunHasta, setComunHasta] = useState(guardado.find((d) => d.abierto)?.horaFin ?? '20:00')
  const [error, setError] = useState<string>()

  const cambiado = JSON.stringify(dias) !== JSON.stringify(guardado)

  function cambiarDia(i: number, cambios: Partial<HorarioSemanal[number]>) {
    setDias((ds) => ds.map((d, j) => (j === i ? { ...d, ...cambios } : d)))
    setError(undefined)
  }

  function aplicarAtajo(abiertos: number[]) {
    setDias((ds) => ds.map((d, i) => ({ ...d, abierto: abiertos.includes(i) })))
    setError(undefined)
  }

  function aplicarHorarioComun() {
    if (comunHasta <= comunDesde) {
      setError('En “Mismo horario”, la hora de cierre tiene que ser posterior a la de apertura.')
      return
    }
    setDias((ds) => ds.map((d) => (d.abierto ? { ...d, horaInicio: comunDesde, horaFin: comunHasta } : d)))
    setError(undefined)
  }

  function guardar(e: FormEvent) {
    e.preventDefault()
    const problema = validarHorario(dias, servicios)
    setError(problema ?? undefined)
    if (problema) return
    try {
      actualizarHorario(dias)
      // Las reservas ya registradas se respetan aunque queden fuera del nuevo horario.
      const fuera = reservas.filter((r) => {
        if (r.fecha < hoy || !ocupaFecha(r.estado)) return false
        const d = dias[diaDeLaSemana(r.fecha)]
        return !d.abierto || r.horaInicio < d.horaInicio || r.horaFin > d.horaFin
      }).length
      onMensaje({
        tipo: 'exito',
        texto: `Horario guardado: ${resumenHorario(dias)}.${
          fuera ? ` Hay ${fuera} reserva(s) próxima(s) fuera de este horario; se mantienen tal como estaban.` : ''
        }`,
      })
    } catch (err) {
      onMensaje({ tipo: 'error', texto: err instanceof Error ? err.message : 'No se pudo guardar el horario.' })
    }
  }

  return (
    <form onSubmit={guardar} noValidate className="max-w-3xl space-y-6">
      <div>
        <h2 className="flex items-center gap-2 font-serif text-2xl">
          <CalendarClock size={20} className="text-arena-texto" aria-hidden="true" /> Horario de trabajo
        </h2>
        <p className="mt-1 text-sm text-gris">
          Días y horas en que se pueden reservar sesiones. Cada turno tiene que empezar y terminar dentro del horario de su día;
          los días cerrados aparecen como “Cerrado” en el calendario. Para cerrar un día o unas horas puntuales, usá la pestaña
          Bloqueos.
        </p>
        <p className="mt-3 rounded-sm bg-arena-claro px-3 py-2 text-[13px] text-arena-texto">
          Vigente: {resumenHorario(guardado)}
        </p>
      </div>

      <section aria-labelledby="titulo-atajos" className="rounded-sm border border-borde bg-tarjeta p-5">
        <h3 id="titulo-atajos" className="text-sm font-medium">
          Atajos
        </h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {ATAJOS.map((a) => (
            <Boton key={a.texto} variante="suave" tamano="sm" onClick={() => aplicarAtajo(a.dias)}>
              {a.texto}
            </Boton>
          ))}
        </div>
        <div className="mt-5 flex flex-col gap-3 border-t border-borde pt-5 sm:flex-row sm:items-end">
          <label className="block text-[13px] text-gris">
            Mismo horario: desde
            <select value={comunDesde} onChange={(e) => setComunDesde(e.target.value)} className="control mt-1 sm:w-32">
              {HORAS.slice(0, -1).map((h) => (
                <option key={h}>{h}</option>
              ))}
            </select>
          </label>
          <label className="block text-[13px] text-gris">
            hasta
            <select value={comunHasta} onChange={(e) => setComunHasta(e.target.value)} className="control mt-1 sm:w-32">
              {HORAS.filter((h) => h > comunDesde).map((h) => (
                <option key={h}>{h}</option>
              ))}
            </select>
          </label>
          <Boton variante="suave" onClick={aplicarHorarioComun}>
            <Copy size={15} aria-hidden="true" /> Aplicar a los días abiertos
          </Boton>
        </div>
      </section>

      <section aria-labelledby="titulo-dias" className="rounded-sm border border-borde bg-tarjeta">
        <h3 id="titulo-dias" className="sr-only">
          Horario por día
        </h3>
        <ul className="divide-y divide-borde">
          {dias.map((d, i) => {
            const nombre = NOMBRES_DIAS[i]
            return (
              <li key={nombre} className={cx('flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:gap-6', !d.abierto && 'bg-stone-50/70')}>
                <label className="flex w-40 cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    checked={d.abierto}
                    onChange={(e) => cambiarDia(i, { abierto: e.target.checked })}
                    className="size-4.5 accent-tinta"
                  />
                  <span className="font-medium">{nombre}</span>
                </label>
                {d.abierto ? (
                  <div className="flex items-center gap-2 text-sm">
                    <label className="sr-only" htmlFor={`desde-${i}`}>
                      {nombre}: apertura
                    </label>
                    <select
                      id={`desde-${i}`}
                      value={d.horaInicio}
                      onChange={(e) => {
                        const desde = e.target.value
                        cambiarDia(i, { horaInicio: desde, ...(d.horaFin <= desde && { horaFin: HORAS[HORAS.indexOf(desde) + 1] }) })
                      }}
                      className="control mt-0 w-28"
                    >
                      {HORAS.slice(0, -1).map((h) => (
                        <option key={h}>{h}</option>
                      ))}
                    </select>
                    <span className="text-gris">a</span>
                    <label className="sr-only" htmlFor={`hasta-${i}`}>
                      {nombre}: cierre
                    </label>
                    <select
                      id={`hasta-${i}`}
                      value={d.horaFin}
                      onChange={(e) => cambiarDia(i, { horaFin: e.target.value })}
                      className="control mt-0 w-28"
                    >
                      {HORAS.filter((h) => h > d.horaInicio).map((h) => (
                        <option key={h}>{h}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <span className="text-sm text-gris">Cerrado</span>
                )}
              </li>
            )
          })}
        </ul>
      </section>

      {error && <Aviso tipo="error">{error}</Aviso>}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[13px] text-gris">Los cambios se aplican a las reservas nuevas; las ya registradas se mantienen.</p>
        <Boton type="submit" disabled={!cambiado}>
          <Save size={15} aria-hidden="true" /> Guardar horario
        </Boton>
      </div>
    </form>
  )
}
