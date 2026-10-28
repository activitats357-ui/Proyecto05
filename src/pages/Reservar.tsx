import { ArrowLeft, ArrowRight, Check, LoaderCircle } from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Aviso } from '../components/Aviso'
import { Boton } from '../components/Boton'
import { Calendario, LeyendaCalendario } from '../components/Calendario'
import { Campo } from '../components/Campo'
import { ListaDatos, useTituloPagina } from '../components/Varios'
import { useDatos } from '../context/contextoDatos'
import { urlFoto } from '../data/fotos'
import { esServicioId, type ServicioId } from '../data/servicios'
import { cx } from '../lib/cx'
import { formatearFechaLarga, mesDeFecha } from '../lib/fechas'
import { formatearDuracion, formatearFranja, sumarHoras } from '../lib/horas'
import { LIMITES, validarCampo, type CampoReserva } from '../lib/validacion'
import { ErrorReserva } from '../services/reservas'

type Paso = 1 | 2 | 3 | 4
const PASOS: { n: Paso; titulo: string }[] = [
  { n: 1, titulo: 'Servicio' },
  { n: 2, titulo: 'Fecha y hora' },
  { n: 3, titulo: 'Tus datos' },
  { n: 4, titulo: 'Revisión' },
]

type CampoContacto = 'nombre' | 'celular' | 'email' | 'notas'
const CAMPOS_PASO_3: CampoReserva[] = ['nombre', 'celular', 'email', 'servicioId', 'notas']

const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms))

export default function Reservar() {
  useTituloPagina('Reservar una fecha')
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { hoy, horario, servicios, buscarServicio, horariosDisponibles, crearReserva } = useDatos()

  const servicioUrl = params.get('servicio')
  const servicioInicial = esServicioId(servicioUrl) ? servicioUrl : null

  const [paso, setPaso] = useState<Paso>(servicioInicial ? 2 : 1)
  const [servicioId, setServicioId] = useState<ServicioId | null>(servicioInicial)
  const [fecha, setFecha] = useState<string | null>(null)
  const [hora, setHora] = useState<string | null>(null)
  const [mes, setMes] = useState(() => mesDeFecha(hoy))
  const [contacto, setContacto] = useState<Record<CampoContacto, string>>({ nombre: '', celular: '', email: '', notas: '' })
  const [tocados, setTocados] = useState<Partial<Record<CampoReserva, boolean>>>({})
  const [errorPaso, setErrorPaso] = useState<string | null>(null)
  const [avisoFecha, setAvisoFecha] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const enviandoRef = useRef(false)
  const tituloRef = useRef<HTMLHeadingElement>(null)
  const primerRender = useRef(true)

  const servicio = servicioId ? buscarServicio(servicioId) : undefined
  const valores: Record<CampoReserva, string> = {
    ...contacto,
    servicioId: servicioId ?? '',
    fecha: fecha ?? '',
    horaInicio: hora ?? '',
  }
  const errorDe = (campo: CampoReserva) => (tocados[campo] ? validarCampo(campo, valores[campo], hoy) : undefined)
  const horarios = fecha && servicio ? horariosDisponibles(fecha, servicio.duracionHoras) : []
  const horaFin = hora && servicio ? sumarHoras(hora, servicio.duracionHoras) : null

  // La disponibilidad puede cambiar mientras se completa el formulario (desde
  // el panel en otra pestaña, o al cambiar de servicio y con él la duración).
  const claveHorarios = horarios.join(',')
  useEffect(() => {
    if (!fecha || !servicio || enviandoRef.current) return
    if (claveHorarios === '') {
      setAvisoFecha(
        `El ${formatearFechaLarga(fecha)} ya no tiene horarios libres para “${servicio.nombre}” (${formatearDuracion(servicio.duracionHoras)}). Elegí otra fecha, por favor.`,
      )
      setFecha(null)
      setHora(null)
      setPaso((p) => (p > 2 ? 2 : p))
    } else if (hora && !claveHorarios.split(',').includes(hora)) {
      setAvisoFecha(`El horario de las ${hora} h ya no está disponible para este servicio. Elegí otro horario.`)
      setHora(null)
      setPaso((p) => (p > 2 ? 2 : p))
    }
  }, [fecha, hora, servicio, claveHorarios])

  useEffect(() => {
    if (primerRender.current) {
      primerRender.current = false
      return
    }
    tituloRef.current?.focus({ preventScroll: true })
    tituloRef.current?.closest('section')?.scrollIntoView({ block: 'start' })
  }, [paso])

  function irA(destino: Paso) {
    setErrorPaso(null)
    setPaso(destino)
  }

  function continuarDesdeServicio() {
    if (!servicioId) return setErrorPaso('Elegí un servicio para continuar.')
    irA(fecha && hora ? 3 : 2)
  }

  function continuarDesdeFecha() {
    if (!fecha) return setErrorPaso('Elegí una fecha disponible en el calendario para continuar.')
    if (!hora) return setErrorPaso('Elegí el horario de inicio para continuar.')
    setAvisoFecha(null)
    irA(3)
  }

  function continuarDesdeDatos(e: FormEvent) {
    e.preventDefault()
    setTocados((t) => ({ ...t, ...Object.fromEntries(CAMPOS_PASO_3.map((c) => [c, true])) }))
    const conError = CAMPOS_PASO_3.find((c) => validarCampo(c, valores[c], hoy))
    if (conError) {
      setErrorPaso('Revisá los campos marcados para continuar.')
      document.getElementById(`reserva-${conError}`)?.focus()
      return
    }
    irA(4)
  }

  async function confirmar() {
    if (enviandoRef.current || !servicioId || !fecha || !hora) return
    enviandoRef.current = true
    setEnviando(true)
    setErrorPaso(null)
    await esperar(450)
    try {
      const reserva = crearReserva({ ...contacto, servicioId, fecha, horaInicio: hora })
      navigate(`/confirmacion/${reserva.id}`)
    } catch (err) {
      enviandoRef.current = false
      setEnviando(false)
      if (err instanceof ErrorReserva && err.codigo === 'NO_DISPONIBLE') {
        setAvisoFecha(`${err.message} No se registró la solicitud.`)
        setHora(null)
        irA(2)
      } else if (err instanceof ErrorReserva && err.codigo === 'VALIDACION') {
        setTocados(Object.fromEntries(CAMPOS_PASO_3.map((c) => [c, true])))
        irA(3)
        setErrorPaso(err.message)
      } else {
        setErrorPaso(err instanceof Error ? err.message : 'Ocurrió un error inesperado. Probá de nuevo.')
      }
    }
  }

  const actualizar = (campo: CampoContacto, valor: string) => setContacto((c) => ({ ...c, [campo]: valor }))
  const tocar = (campo: CampoReserva) => setTocados((t) => ({ ...t, [campo]: true }))

  return (
    <div className="pb-24">
      <header className="border-b border-borde bg-tarjeta">
        <div className="contenedor py-14 sm:py-20">
          <p className="antetitulo">Reservas online</p>
          <h1 className="mt-4 font-serif text-4xl leading-tight sm:text-5xl">Reservá tu fecha</h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-gris">
            Elegí el servicio, consultá la disponibilidad y dejame tus datos. En pocos pasos tu solicitud queda registrada
            y después coordinamos los detalles por WhatsApp.
          </p>
          <IndicadorPasos paso={paso} alElegir={(n) => irA(n)} />
        </div>
      </header>

      <div className="contenedor mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-14">
        <section className="min-w-0 scroll-mt-24" aria-labelledby="titulo-paso">
          <h2 id="titulo-paso" ref={tituloRef} tabIndex={-1} className="font-serif text-2xl focus:outline-none sm:text-3xl">
            <span className="mr-3 text-arena">{paso}.</span>
            {
              {
                1: 'Elegí el servicio',
                2: 'Elegí la fecha y el horario',
                3: 'Completá tus datos',
                4: 'Revisá y confirmá',
              }[paso]
            }
          </h2>

          {errorPaso && (
            <Aviso tipo="error" className="mt-6">
              {errorPaso}
            </Aviso>
          )}

          {paso === 1 && (
            <div className="mt-8">
              <fieldset>
                <legend className="sr-only">Tipo de servicio</legend>
                <div className="grid gap-4 sm:grid-cols-2">
                  {servicios.map((s) => {
                    const elegido = servicioId === s.id
                    return (
                      <label
                        key={s.id}
                        className={cx(
                          'group relative flex cursor-pointer gap-4 rounded-sm border bg-tarjeta p-3 transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-tinta',
                          elegido ? 'border-arena ring-1 ring-arena' : 'border-borde hover:border-stone-400',
                        )}
                      >
                        <input
                          type="radio"
                          name="servicio"
                          value={s.id}
                          checked={elegido}
                          onChange={() => {
                            setServicioId(s.id)
                            setErrorPaso(null)
                          }}
                          className="sr-only"
                        />
                        <img src={urlFoto(s.foto, 240)} alt="" className="size-20 shrink-0 rounded-sm bg-stone-200 object-cover sm:size-24" loading="lazy" />
                        <span className="flex min-w-0 flex-col justify-center pr-6">
                          <span className="font-serif text-lg leading-snug">{s.nombre}</span>
                          <span className="mt-1 text-[13px] text-gris">Duración: {formatearDuracion(s.duracionHoras)}</span>
                          <span className="text-[13px] text-gris">{s.precio}</span>
                        </span>
                        <span
                          className={cx(
                            'absolute top-3 right-3 grid size-5 place-items-center rounded-full border transition-colors',
                            elegido ? 'border-arena bg-arena text-tinta' : 'border-stone-300',
                          )}
                          aria-hidden="true"
                        >
                          {elegido && <Check size={12} strokeWidth={3} />}
                        </span>
                      </label>
                    )
                  })}
                </div>
              </fieldset>
              <BarraAcciones>
                <span />
                <Boton onClick={continuarDesdeServicio}>
                  Continuar <ArrowRight size={16} aria-hidden="true" />
                </Boton>
              </BarraAcciones>
            </div>
          )}

          {paso === 2 && (
            <div className="mt-8">
              {avisoFecha && (
                <Aviso tipo="advertencia" className="mb-6" onCerrar={() => setAvisoFecha(null)}>
                  {avisoFecha}
                </Aviso>
              )}
              <div className="rounded-sm border border-borde bg-tarjeta p-4 sm:p-7">
                <Calendario
                  mes={mes}
                  onCambiarMes={setMes}
                  seleccionada={fecha}
                  duracionHoras={servicio?.duracionHoras}
                  onSeleccionar={(f) => {
                    if (f !== fecha) setHora(null)
                    setFecha(f)
                    setErrorPaso(null)
                    setAvisoFecha(null)
                  }}
                />
                <LeyendaCalendario className="mt-6 border-t border-borde pt-5" />
              </div>
              <p className="mt-4 text-[13px] leading-relaxed text-gris">
                Los días marcados como “Completa” no tienen lugar para un turno de {servicio ? formatearDuracion(servicio.duracionHoras) : 'esta duración'}.
                La disponibilidad se guarda en este navegador y la confirmación final se coordina directamente con Leandro.
              </p>

              {fecha && servicio && (
                <fieldset className="mt-8 rounded-sm border border-borde bg-tarjeta p-4 animate-aparecer sm:p-7">
                  <legend className="sr-only">Horario de inicio</legend>
                  <p className="font-serif text-xl">Horario de inicio</p>
                  <p className="mt-1 text-sm text-gris">
                    {formatearFechaLarga(fecha)} · Sesión de {formatearDuracion(servicio.duracionHoras)}. Horario de
                    atención de {formatearFranja(horario.horaInicio, horario.horaFin)}: la sesión tiene que terminar antes del
                    cierre.
                  </p>
                  <div className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
                    {horarios.map((h) => (
                      <button
                        key={h}
                        type="button"
                        aria-pressed={hora === h}
                        aria-label={`De ${formatearFranja(h, sumarHoras(h, servicio.duracionHoras))}`}
                        onClick={() => {
                          setHora(h)
                          setErrorPaso(null)
                          setAvisoFecha(null)
                        }}
                        className={cx(
                          'flex h-14 flex-col items-center justify-center rounded-sm border text-sm tabular-nums transition-colors',
                          hora === h ? 'border-arena bg-arena font-semibold text-tinta' : 'border-borde hover:border-stone-400 hover:bg-arena-claro',
                        )}
                      >
                        {h}
                        <span className={cx('text-[11px]', hora === h ? 'text-tinta/80' : 'text-gris')}>
                          a {sumarHoras(h, servicio.duracionHoras)}
                        </span>
                      </button>
                    ))}
                  </div>
                </fieldset>
              )}

              <p className="mt-5 min-h-6 text-[15px]" aria-live="polite">
                {fecha && hora && horaFin ? (
                  <>
                    Turno elegido: <strong className="font-medium">{formatearFechaLarga(fecha)}, de {formatearFranja(hora, horaFin)}</strong>
                  </>
                ) : (
                  <span className="text-gris">{fecha ? 'Elegí el horario de inicio.' : 'Todavía no elegiste una fecha.'}</span>
                )}
              </p>
              <BarraAcciones>
                <Boton variante="suave" onClick={() => irA(1)}>
                  <ArrowLeft size={16} aria-hidden="true" /> Volver
                </Boton>
                <Boton onClick={continuarDesdeFecha}>
                  Continuar <ArrowRight size={16} aria-hidden="true" />
                </Boton>
              </BarraAcciones>
            </div>
          )}

          {paso === 3 && (
            <form className="mt-8" onSubmit={continuarDesdeDatos} noValidate>
              <div className="grid gap-6 rounded-sm border border-borde bg-tarjeta p-5 sm:grid-cols-2 sm:p-7">
                <Campo id="reserva-nombre" etiqueta="Nombre y apellido" obligatorio error={errorDe('nombre')} className="sm:col-span-2">
                  {(p) => (
                    <input
                      {...p}
                      type="text"
                      autoComplete="name"
                      maxLength={LIMITES.nombre}
                      value={contacto.nombre}
                      onChange={(e) => actualizar('nombre', e.target.value)}
                      onBlur={() => tocar('nombre')}
                      className="control"
                      placeholder="Ej.: María González"
                    />
                  )}
                </Campo>
                <Campo id="reserva-celular" etiqueta="Celular o WhatsApp" obligatorio error={errorDe('celular')} ayuda="Con código de área. Ej.: 0985 123 456">
                  {(p) => (
                    <input
                      {...p}
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      maxLength={LIMITES.celular}
                      value={contacto.celular}
                      onChange={(e) => actualizar('celular', e.target.value)}
                      onBlur={() => tocar('celular')}
                      className="control"
                    />
                  )}
                </Campo>
                <Campo id="reserva-email" etiqueta="Correo electrónico" obligatorio error={errorDe('email')} ayuda="Para enviarte la información de la sesión.">
                  {(p) => (
                    <input
                      {...p}
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      maxLength={LIMITES.email}
                      value={contacto.email}
                      onChange={(e) => actualizar('email', e.target.value)}
                      onBlur={() => tocar('email')}
                      className="control"
                      placeholder="nombre@correo.com"
                    />
                  )}
                </Campo>
                <Campo id="reserva-servicioId" etiqueta="Tipo de sesión" obligatorio error={errorDe('servicioId')} className="sm:col-span-2">
                  {(p) => (
                    <select
                      {...p}
                      value={servicioId ?? ''}
                      onChange={(e) => setServicioId(esServicioId(e.target.value) ? e.target.value : null)}
                      onBlur={() => tocar('servicioId')}
                      className="control"
                    >
                      <option value="" disabled>
                        Elegí una opción
                      </option>
                      {servicios.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.nombre} ({formatearDuracion(s.duracionHoras)})
                        </option>
                      ))}
                    </select>
                  )}
                </Campo>
                <Campo
                  id="reserva-notas"
                  etiqueta="Comentarios o detalles"
                  error={errorDe('notas')}
                  ayuda="Contame tu idea: lugar, horario aproximado, cantidad de personas…"
                  className="sm:col-span-2"
                >
                  {(p) => (
                    <textarea
                      {...p}
                      rows={4}
                      maxLength={LIMITES.notas}
                      value={contacto.notas}
                      onChange={(e) => actualizar('notas', e.target.value)}
                      onBlur={() => tocar('notas')}
                      className="control resize-y"
                    />
                  )}
                </Campo>
              </div>
              <p className="mt-3 text-[13px] text-gris">
                Los campos marcados con <span className="text-arena-texto">*</span> son obligatorios.
              </p>
              <BarraAcciones>
                <Boton variante="suave" onClick={() => irA(2)}>
                  <ArrowLeft size={16} aria-hidden="true" /> Volver
                </Boton>
                <Boton type="submit">
                  Revisar solicitud <ArrowRight size={16} aria-hidden="true" />
                </Boton>
              </BarraAcciones>
            </form>
          )}

          {paso === 4 && servicio && fecha && hora && horaFin && (
            <div className="mt-8">
              <div className="rounded-sm border border-borde bg-tarjeta px-5 sm:px-7">
                <ListaDatos
                  items={[
                    { etiqueta: 'Servicio', valor: <ConCambio texto={servicio.nombre} onCambiar={() => irA(1)} /> },
                    { etiqueta: 'Fecha solicitada', valor: <ConCambio texto={formatearFechaLarga(fecha)} onCambiar={() => irA(2)} /> },
                    {
                      etiqueta: 'Horario',
                      valor: (
                        <ConCambio
                          texto={`${formatearFranja(hora, horaFin)} · ${formatearDuracion(servicio.duracionHoras)}`}
                          onCambiar={() => irA(2)}
                        />
                      ),
                    },
                    { etiqueta: 'Nombre y apellido', valor: <ConCambio texto={contacto.nombre} onCambiar={() => irA(3)} /> },
                    { etiqueta: 'Celular', valor: contacto.celular },
                    { etiqueta: 'Correo electrónico', valor: contacto.email },
                    { etiqueta: 'Comentarios', valor: contacto.notas.trim() || <span className="text-gris">Sin comentarios adicionales</span> },
                  ]}
                />
              </div>
              <Aviso tipo="info" className="mt-6">
                Tu solicitud se guarda en este navegador con estado <strong>pendiente</strong>. No es una confirmación
                definitiva: después vas a poder preparar un mensaje por WhatsApp para coordinar los detalles. Consultá las{' '}
                <Link to="/politicas" className="underline underline-offset-2">
                  políticas y condiciones
                </Link>
                .
              </Aviso>
              <BarraAcciones>
                <Boton variante="suave" onClick={() => irA(3)} disabled={enviando}>
                  <ArrowLeft size={16} aria-hidden="true" /> Volver
                </Boton>
                <Boton variante="acento" tamano="lg" onClick={confirmar} disabled={enviando} aria-busy={enviando}>
                  {enviando ? (
                    <>
                      <LoaderCircle size={18} className="animate-spin" aria-hidden="true" /> Registrando…
                    </>
                  ) : (
                    <>
                      <Check size={18} aria-hidden="true" /> Confirmar reserva
                    </>
                  )}
                </Boton>
              </BarraAcciones>
            </div>
          )}
        </section>

        <aside className="lg:pt-14" aria-label="Resumen de tu reserva">
          <div className="rounded-sm border border-borde bg-tarjeta lg:sticky lg:top-24">
            {servicio && (
              <img src={urlFoto(servicio.foto, 680)} alt="" className="hidden aspect-[16/10] w-full rounded-t-sm object-cover lg:block" />
            )}
            <div className="p-6">
              <p className="antetitulo">Tu reserva</p>
              <dl className="mt-5 space-y-4 text-[15px]">
                <div>
                  <dt className="text-[13px] text-gris">Servicio</dt>
                  <dd className="mt-0.5">{servicio?.nombre ?? <span className="text-stone-400">Sin elegir</span>}</dd>
                </div>
                <div>
                  <dt className="text-[13px] text-gris">Fecha</dt>
                  <dd className="mt-0.5">{fecha ? formatearFechaLarga(fecha) : <span className="text-stone-400">Sin elegir</span>}</dd>
                </div>
                <div>
                  <dt className="text-[13px] text-gris">Horario</dt>
                  <dd className="mt-0.5">
                    {hora && horaFin ? formatearFranja(hora, horaFin) : <span className="text-stone-400">Sin elegir</span>}
                  </dd>
                </div>
                {servicio && (
                  <div>
                    <dt className="text-[13px] text-gris">Duración</dt>
                    <dd className="mt-0.5">{formatearDuracion(servicio.duracionHoras)}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-[13px] text-gris">Inversión</dt>
                  <dd className="mt-0.5">Consultar presupuesto</dd>
                </div>
              </dl>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

function IndicadorPasos({ paso, alElegir }: { paso: Paso; alElegir: (n: Paso) => void }) {
  return (
    <nav aria-label="Pasos de la reserva" className="mt-10">
      <ol className="grid grid-cols-4 gap-2 sm:gap-4">
        {PASOS.map(({ n, titulo }) => {
          const actual = n === paso
          const hecho = n < paso
          const accesible = hecho
          const contenido = (
            <>
              <span
                className={cx(
                  'grid size-7 shrink-0 place-items-center rounded-full border text-xs font-medium transition-colors',
                  actual ? 'border-tinta bg-tinta text-white' : hecho ? 'border-arena bg-arena text-tinta' : 'border-stone-300 text-gris',
                )}
              >
                {hecho ? <Check size={13} strokeWidth={3} aria-hidden="true" /> : n}
              </span>
              <span className={cx('hidden text-sm sm:inline', actual ? 'text-tinta' : 'text-gris')}>{titulo}</span>
            </>
          )
          return (
            <li key={n} className={cx('border-t-2 pt-3', actual || hecho ? 'border-tinta' : 'border-borde')}>
              {accesible ? (
                <button type="button" onClick={() => alElegir(n)} className="flex items-center gap-2.5 rounded-sm hover:opacity-75" aria-label={`Volver al paso ${n}: ${titulo}`}>
                  {contenido}
                </button>
              ) : (
                <span className="flex items-center gap-2.5" aria-current={actual ? 'step' : undefined}>
                  <span className="sr-only">{`Paso ${n}: ${titulo}${actual ? ' (actual)' : ''}`}</span>
                  <span className="contents" aria-hidden="true">
                    {contenido}
                  </span>
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

function BarraAcciones({ children }: { children: ReactNode }) {
  return <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">{children}</div>
}

function ConCambio({ texto, onCambiar }: { texto: string; onCambiar: () => void }) {
  return (
    <span className="flex items-baseline justify-between gap-4">
      <span>{texto}</span>
      <button type="button" onClick={onCambiar} className="shrink-0 text-[13px] text-arena-texto underline-offset-4 hover:underline">
        Cambiar
      </button>
    </span>
  )
}
