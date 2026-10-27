import { Aviso } from '../components/Aviso'
import { useTituloPagina } from '../components/Varios'

const SECCIONES = [
  { id: 'reservas', titulo: 'Política de reservas' },
  { id: 'cancelaciones', titulo: 'Cancelaciones y cambios de fecha' },
  { id: 'privacidad', titulo: 'Privacidad y protección de datos' },
  { id: 'condiciones', titulo: 'Condiciones del servicio' },
]

export default function Politicas() {
  useTituloPagina('Políticas y condiciones')
  return (
    <div className="contenedor max-w-5xl py-16 sm:py-24">
      <p className="antetitulo">Información legal</p>
      <h1 className="mt-4 font-serif text-4xl leading-tight sm:text-5xl">Políticas y condiciones</h1>
      <p className="mt-6 max-w-2xl text-base leading-relaxed text-gris">
        Este apartado se completará con las políticas de reserva, cancelación, privacidad y tratamiento de datos
        correspondientes al servicio.
      </p>
      <Aviso tipo="advertencia" className="mt-8" titulo="Contenido provisional">
        Los textos de esta página están pendientes de redacción y deben revisarse antes de publicar la aplicación en
        producción.
      </Aviso>

      <div className="mt-14 grid gap-12 md:grid-cols-[220px_1fr]">
        <nav aria-label="Secciones" className="md:sticky md:top-28 md:self-start">
          <ol className="space-y-3 border-l border-borde text-sm">
            {SECCIONES.map((s, i) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="-ml-px block border-l border-transparent pl-4 text-gris hover:border-arena hover:text-tinta">
                  {i + 1}. {s.titulo}
                </a>
              </li>
            ))}
          </ol>
        </nav>
        <div className="space-y-12">
          {SECCIONES.map((s, i) => (
            <section key={s.id} id={s.id} className="scroll-mt-28 border-b border-borde pb-12 last:border-0" aria-labelledby={`t-${s.id}`}>
              <h2 id={`t-${s.id}`} className="font-serif text-2xl sm:text-3xl">
                <span className="mr-3 text-arena">{i + 1}.</span>
                {s.titulo}
              </h2>
              <p className="mt-4 inline-block rounded-full bg-arena-claro px-3 py-1 text-xs font-medium text-arena-texto">
                Pendiente de redacción
              </p>
              <p className="mt-4 leading-relaxed text-gris">
                El contenido de esta sección se definirá antes de la publicación del sitio.
              </p>
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}
