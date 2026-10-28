import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import { useDatos } from '../context/contextoDatos'
import { cx } from '../lib/cx'
import {
  DIAS_SEMANA,
  fechaEnMes,
  formatearFechaLarga,
  mesDeFecha,
  nombreMes,
  parsearFechaISO,
  semanasDelMes,
  sumarDias,
  sumarMeses,
  type MesCalendario,
} from '../lib/fechas'
import type { EstadoDia } from '../types'

export const TEXTO_ESTADO_DIA: Record<EstadoDia, string> = {
  disponible: 'Disponible',
  parcial: 'Horarios limitados',
  ocupada: 'Completa',
  bloqueada: 'Bloqueada',
  cerrada: 'Cerrado',
  pasada: 'Fecha pasada',
}

interface Props {
  mes: MesCalendario
  onCambiarMes: (mes: MesCalendario) => void
  seleccionada: string | null
  onSeleccionar: (fecha: string) => void
  /** Qué días se pueden elegir. Por defecto, los que tienen algún horario libre. */
  esSeleccionable?: (estado: EstadoDia) => boolean
  /** Duración del turno buscado: un día queda "Completo" si no entra ninguno. */
  duracionHoras?: number
  /** Texto adicional para lectores de pantalla (p. ej. código de reserva). */
  describirDia?: (fecha: string) => string | undefined
  className?: string
}

const soloDisponibles = (estado: EstadoDia) => estado === 'disponible' || estado === 'parcial'

/**
 * Calendario mensual compartido por la reserva pública y el panel de
 * administración. El estado de cada día sale siempre de estadoDeFecha().
 * Navegación con teclado: flechas, Inicio/Fin, RePág/AvPág.
 */
export function Calendario({
  mes,
  onCambiarMes,
  seleccionada,
  onSeleccionar,
  esSeleccionable = soloDisponibles,
  describirDia,
  duracionHoras,
  className,
}: Props) {
  const { estadoDeFecha, hoy } = useDatos()
  const idTitulo = useId()
  const rejillaRef = useRef<HTMLDivElement>(null)
  const [foco, setFoco] = useState<string | null>(null)
  const enfocarTrasRender = useRef(false)

  const semanas = semanasDelMes(mes)
  const primerDia = semanas.flat().find((f): f is string => f !== null)!
  const focoEfectivo = [foco, seleccionada, hoy].find((f): f is string => !!f && fechaEnMes(f, mes)) ?? primerDia

  useEffect(() => {
    if (!enfocarTrasRender.current) return
    enfocarTrasRender.current = false
    rejillaRef.current?.querySelector<HTMLButtonElement>(`[data-fecha="${focoEfectivo}"]`)?.focus()
  })

  function moverFoco(destino: string) {
    enfocarTrasRender.current = true
    setFoco(destino)
    if (!fechaEnMes(destino, mes)) onCambiarMes(mesDeFecha(destino))
  }

  function alPresionarTecla(e: KeyboardEvent<HTMLButtonElement>, fecha: string) {
    const diaSemana = (parsearFechaISO(fecha)!.getDay() + 6) % 7
    const saltos: Record<string, () => string> = {
      ArrowLeft: () => sumarDias(fecha, -1),
      ArrowRight: () => sumarDias(fecha, 1),
      ArrowUp: () => sumarDias(fecha, -7),
      ArrowDown: () => sumarDias(fecha, 7),
      Home: () => sumarDias(fecha, -diaSemana),
      End: () => sumarDias(fecha, 6 - diaSemana),
      PageUp: () => mismoDiaEnMes(fecha, -1),
      PageDown: () => mismoDiaEnMes(fecha, 1),
    }
    const salto = saltos[e.key]
    if (!salto) return
    e.preventDefault()
    moverFoco(salto())
  }

  function cambiarMes(n: number) {
    setFoco(null)
    onCambiarMes(sumarMeses(mes, n))
  }

  return (
    <div className={cx('select-none', className)}>
      <div className="flex items-center justify-between gap-3">
        <h3 id={idTitulo} className="min-w-0 font-serif text-lg leading-tight sm:text-2xl" aria-live="polite">
          {nombreMes(mes)}
        </h3>
        <div className="flex shrink-0 items-center gap-1">
          {!fechaEnMes(hoy, mes) && (
            <button
              type="button"
              onClick={() => {
                setFoco(null)
                onCambiarMes(mesDeFecha(hoy))
              }}
              className="mr-1 h-9 rounded-sm px-3 text-[13px] text-gris hover:bg-stone-100 hover:text-tinta"
            >
              Hoy
            </button>
          )}
          <button
            type="button"
            onClick={() => cambiarMes(-1)}
            className="grid size-10 place-items-center rounded-sm border border-borde bg-tarjeta hover:border-stone-400"
            aria-label="Mes anterior"
          >
            <ChevronLeft size={18} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => cambiarMes(1)}
            className="grid size-10 place-items-center rounded-sm border border-borde bg-tarjeta hover:border-stone-400"
            aria-label="Mes siguiente"
          >
            <ChevronRight size={18} aria-hidden="true" />
          </button>
        </div>
      </div>

      <div ref={rejillaRef} role="group" aria-labelledby={idTitulo} className="mt-5">
        <div className="grid grid-cols-7 gap-1 pb-2" aria-hidden="true">
          {DIAS_SEMANA.map((d) => (
            <div key={d.corto} className="text-center text-[11px] font-medium tracking-wider text-gris uppercase">
              {d.corto}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {semanas.flat().map((fecha, i) => {
            if (!fecha) return <div key={`vacio-${i}`} aria-hidden="true" />
            const estado = estadoDeFecha(fecha, duracionHoras)
            const seleccionable = esSeleccionable(estado)
            const esSeleccionada = fecha === seleccionada
            const esHoy = fecha === hoy
            const extra = describirDia?.(fecha)
            const etiqueta = [
              formatearFechaLarga(fecha),
              TEXTO_ESTADO_DIA[estado],
              esHoy && 'hoy',
              esSeleccionada && 'seleccionada',
              extra,
            ]
              .filter(Boolean)
              .join(', ')

            return (
              <button
                key={fecha}
                type="button"
                data-fecha={fecha}
                tabIndex={fecha === focoEfectivo ? 0 : -1}
                aria-label={etiqueta}
                aria-pressed={esSeleccionada}
                aria-disabled={!seleccionable || undefined}
                aria-current={esHoy ? 'date' : undefined}
                onClick={() => {
                  setFoco(fecha)
                  if (seleccionable) onSeleccionar(fecha)
                }}
                onKeyDown={(e) => alPresionarTecla(e, fecha)}
                className={cx(
                  'relative flex h-11 flex-col items-center justify-center rounded-sm text-sm tabular-nums transition-colors duration-150 sm:h-12',
                  esSeleccionada
                    ? 'bg-arena font-semibold text-tinta'
                    : {
                        disponible: 'text-tinta hover:bg-arena-claro',
                        parcial: 'text-tinta hover:bg-arena-claro',
                        ocupada: 'bg-ocupada-fondo text-ocupada line-through decoration-ocupada/40',
                        bloqueada: 'rayado bg-stone-100 text-stone-400',
                        cerrada: 'bg-stone-50 text-stone-300',
                        pasada: 'text-stone-300',
                      }[estado],
                  seleccionable ? 'cursor-pointer' : 'cursor-not-allowed',
                  seleccionable && !esSeleccionada && estado !== 'disponible' && estado !== 'parcial' && 'hover:ring-1 hover:ring-stone-400 hover:ring-inset',
                  esHoy && 'ring-1 ring-tinta ring-inset',
                )}
              >
                <span>{Number(fecha.slice(8))}</span>
                <IndicadorDia estado={estado} seleccionada={esSeleccionada} />
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function mismoDiaEnMes(fecha: string, n: number): string {
  const destino = sumarMeses(mesDeFecha(fecha), n)
  const ultimo = new Date(destino.anio, destino.mes + 1, 0).getDate()
  const dia = Math.min(Number(fecha.slice(8)), ultimo)
  return `${destino.anio}-${String(destino.mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
}

function IndicadorDia({ estado, seleccionada }: { estado: EstadoDia; seleccionada: boolean }) {
  if (seleccionada || estado === 'pasada' || estado === 'cerrada') return null
  const estilo = {
    disponible: 'size-1 bg-arena',
    parcial: 'size-1.5 border border-arena-texto bg-transparent',
    ocupada: 'size-1 bg-ocupada',
    bloqueada: 'size-1 bg-stone-400',
  }[estado]
  return <span className={cx('absolute bottom-1.5 rounded-full', estilo)} aria-hidden="true" />
}

export function LeyendaCalendario({ className }: { className?: string }) {
  const items = [
    { texto: 'Disponible', muestra: <span className="relative block size-5 rounded-sm border border-borde bg-tarjeta"><span className="absolute bottom-0.5 left-1/2 size-1 -translate-x-1/2 rounded-full bg-arena" /></span> },
    { texto: 'Horarios limitados', muestra: <span className="relative block size-5 rounded-sm border border-borde bg-tarjeta"><span className="absolute bottom-0.5 left-1/2 size-1.5 -translate-x-1/2 rounded-full border border-arena-texto" /></span> },
    { texto: 'Seleccionada', muestra: <span className="block size-5 rounded-sm bg-arena" /> },
    { texto: 'Completa', muestra: <span className="block size-5 rounded-sm bg-ocupada-fondo ring-1 ring-ocupada/30 ring-inset" /> },
    { texto: 'Bloqueada', muestra: <span className="rayado block size-5 rounded-sm bg-stone-100" /> },
    { texto: 'Cerrado', muestra: <span className="block size-5 rounded-sm border border-borde bg-stone-50" /> },
    { texto: 'Pasada', muestra: <span className="grid size-5 place-items-center rounded-sm text-[10px] text-stone-300">00</span> },
    { texto: 'Hoy', muestra: <span className="block size-5 rounded-sm ring-1 ring-tinta ring-inset" /> },
  ]
  return (
    <ul className={cx('flex flex-wrap gap-x-5 gap-y-2.5 text-[13px] text-gris', className)} aria-label="Referencias del calendario">
      {items.map((it) => (
        <li key={it.texto} className="flex items-center gap-2">
          <span aria-hidden="true">{it.muestra}</span>
          {it.texto}
        </li>
      ))}
    </ul>
  )
}
