import { ArrowRight, MapPin } from 'lucide-react'
import { BotonLink } from '../components/Boton'
import { Galeria } from '../components/Galeria'
import { EncabezadoSeccion, Revelar, useTituloPagina } from '../components/Varios'
import { FOTOS, srcSetFoto, urlFoto } from '../data/fotos'
import { SERVICIOS } from '../data/servicios'
import { cx } from '../lib/cx'

export default function Inicio() {
  useTituloPagina('')
  return (
    <>
      <Hero />
      <Presentacion />
      <Servicios />
      <section id="galeria" className="scroll-mt-20 py-24 sm:py-32">
        <div className="contenedor">
          <Revelar>
            <EncabezadoSeccion antetitulo="Galería" titulo="Instantes que se cuentan solos">
              Una selección de bodas, retratos, familias y eventos. Tocá cualquier imagen para verla en grande.
            </EncabezadoSeccion>
          </Revelar>
          <div className="mt-12">
            <Galeria />
          </div>
        </div>
      </section>
      <LlamadaFinal />
    </>
  )
}

function Hero() {
  return (
    <section className="relative isolate overflow-hidden bg-tinta">
      <div className="relative h-[calc(100svh-72px)] max-h-[880px] min-h-[540px]">
        <img
          src={urlFoto(FOTOS.hero, 1920)}
          srcSet={srcSetFoto(FOTOS.hero)}
          sizes="100vw"
          alt={FOTOS.hero.alt}
          fetchPriority="high"
          className="absolute inset-0 h-full w-full object-cover object-[68%_60%] sm:object-[50%_60%]"
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/25 to-black/5" aria-hidden="true" />
        <div className="contenedor relative z-10 flex h-full flex-col justify-end pb-14 sm:pb-20">
          <p className="flex items-center gap-2 text-[12px] tracking-[0.18em] text-white/80 uppercase animate-aparecer">
            <MapPin size={14} aria-hidden="true" />
            Encarnación, Paraguay · Coberturas dentro y fuera de la ciudad
          </p>
          <h1 className="mt-5 max-w-4xl font-serif text-[2.6rem] leading-[1.05] text-white text-balance animate-aparecer sm:text-6xl lg:text-7xl">
            Historias reales. <em className="font-normal text-[#E9DCC5]">Momentos que quedan para siempre.</em>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-white/85 animate-aparecer sm:text-lg">
            Fotografía de bodas, retratos y momentos especiales en Encarnación y alrededores. Imágenes auténticas para
            volver a sentir cada historia.
          </p>
          <div className="mt-9 flex flex-col gap-3 animate-aparecer sm:flex-row">
            <BotonLink to="/reservar" variante="acento" tamano="lg">
              Reservar una fecha
            </BotonLink>
            <BotonLink to="/#servicios" variante="contornoClaro" tamano="lg">
              Conocer los servicios
            </BotonLink>
          </div>
        </div>
      </div>
    </section>
  )
}

function Presentacion() {
  return (
    <section className="py-24 sm:py-32">
      <div className="contenedor grid items-center gap-12 md:grid-cols-12 md:gap-8">
        <Revelar className="md:col-span-5">
          <figure className="relative">
            <img
              src={urlFoto(FOTOS.presentacion, 1080)}
              srcSet={srcSetFoto(FOTOS.presentacion, 1440)}
              sizes="(min-width: 768px) 40vw, 100vw"
              alt={FOTOS.presentacion.alt}
              loading="lazy"
              className="aspect-[4/5] w-full rounded-sm bg-stone-200 object-cover"
            />
            <span className="absolute -right-3 -bottom-3 -z-10 hidden h-full w-full rounded-sm border border-arena/60 sm:block" aria-hidden="true" />
          </figure>
        </Revelar>
        <Revelar className="md:col-span-6 md:col-start-7" retraso={120}>
          <p className="antetitulo">Sobre mi trabajo</p>
          <h2 className="mt-4 font-serif text-4xl leading-tight text-balance sm:text-5xl">Fotografiar es contar historias</h2>
          <p className="mt-7 text-[17px] leading-[1.8] text-stone-600">
            Cada persona y cada celebración tienen algo único. Mi trabajo es encontrar esos instantes que suceden de forma
            natural y transformarlos en recuerdos que te acompañen toda la vida. Trabajo con una mirada cercana, cuidando
            los detalles y respetando la esencia de cada historia.
          </p>
          <p className="mt-8 font-serif text-2xl text-arena-texto italic">— Leandro Báez</p>
          <ul className="mt-10 grid gap-6 border-t border-borde pt-8 sm:grid-cols-3">
            {[
              ['Mirada cercana', 'Momentos naturales, sin poses forzadas.'],
              ['Cuidado del detalle', 'Cada imagen, editada con atención.'],
              ['Tu historia primero', 'Respeto por la esencia de cada encuentro.'],
            ].map(([titulo, texto]) => (
              <li key={titulo}>
                <p className="font-serif text-lg">{titulo}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-gris">{texto}</p>
              </li>
            ))}
          </ul>
        </Revelar>
      </div>
    </section>
  )
}

function Servicios() {
  return (
    <section id="servicios" className="scroll-mt-20 border-y border-borde bg-tarjeta py-24 sm:py-32">
      <div className="contenedor">
        <Revelar>
          <EncabezadoSeccion antetitulo="Servicios" titulo="Coberturas pensadas para cada historia">
            Elegí el tipo de sesión que buscás y consultá las fechas disponibles. Cada propuesta se adapta a lo que
            querés contar.
          </EncabezadoSeccion>
        </Revelar>

        <ol className="mt-16 space-y-20 sm:mt-20 sm:space-y-28">
          {SERVICIOS.map((s, i) => (
            <li key={s.id}>
              <article className="grid items-center gap-8 md:grid-cols-12 md:gap-12" aria-labelledby={`servicio-${s.id}`}>
                <Revelar className={cx('md:col-span-6', i % 2 === 1 && 'md:order-2 md:col-start-7')}>
                  <img
                    src={urlFoto(s.foto, 1080)}
                    srcSet={srcSetFoto(s.foto, 1440)}
                    sizes="(min-width: 768px) 45vw, 100vw"
                    alt={s.foto.alt}
                    loading="lazy"
                    className="aspect-[4/5] w-full rounded-sm bg-stone-200 object-cover sm:aspect-[5/4] md:aspect-[4/5] lg:aspect-[5/6]"
                  />
                </Revelar>
                <Revelar className={cx('md:col-span-5', i % 2 === 1 ? 'md:order-1 md:col-start-1' : 'md:col-start-8')} retraso={120}>
                  <p className="font-serif text-5xl text-arena italic" aria-hidden="true">
                    {String(i + 1).padStart(2, '0')}
                  </p>
                  <h3 id={`servicio-${s.id}`} className="mt-3 font-serif text-3xl leading-tight sm:text-4xl">
                    {s.nombre}
                  </h3>
                  <p className="mt-5 text-base leading-relaxed text-stone-600">{s.descripcion}</p>
                  <dl className="mt-8 grid grid-cols-2 gap-6 border-y border-borde py-5">
                    <div>
                      <dt className="text-[11px] tracking-[0.2em] text-gris uppercase">Duración orientativa</dt>
                      <dd className="mt-1.5 text-[15px]">{s.duracion}</dd>
                    </div>
                    <div>
                      <dt className="text-[11px] tracking-[0.2em] text-gris uppercase">Inversión</dt>
                      <dd className="mt-1.5 text-[15px]">{s.precio}</dd>
                    </div>
                  </dl>
                  <BotonLink to={`/reservar?servicio=${s.id}`} variante="oscuro" className="mt-8" aria-label={`Reservar: ${s.nombre}`}>
                    Reservar este servicio
                    <ArrowRight size={16} aria-hidden="true" />
                  </BotonLink>
                </Revelar>
              </article>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

function LlamadaFinal() {
  return (
    <section className="relative isolate overflow-hidden bg-tinta">
      <img
        src={urlFoto(FOTOS.cta, 1920)}
        srcSet={srcSetFoto(FOTOS.cta)}
        sizes="100vw"
        alt=""
        loading="lazy"
        className="absolute inset-0 -z-10 h-full w-full object-cover opacity-45"
      />
      <div className="contenedor py-28 text-center sm:py-36">
        <Revelar>
          <p className="antetitulo text-[#E9DCC5]">Reservas</p>
          <h2 className="mx-auto mt-5 max-w-3xl font-serif text-4xl leading-tight text-white text-balance sm:text-5xl">
            Tu próxima historia puede empezar acá
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-white/80 sm:text-lg">
            Consultá las fechas disponibles y contame qué momento querés guardar para siempre.
          </p>
          <BotonLink to="/reservar" variante="acento" tamano="lg" className="mt-10">
            Consultar disponibilidad
          </BotonLink>
        </Revelar>
      </div>
    </section>
  )
}
