import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { useState } from 'react'
import { useDatos } from '../context/contextoDatos'
import { srcSetImagen, urlImagen } from '../data/fotos'
import { cx } from '../lib/cx'
import { Dialogo } from './Dialogo'

export function Galeria() {
  const { galeria, etiquetas } = useDatos()
  const [filtroElegido, setFiltro] = useState<string>('todas')
  const [indice, setIndice] = useState<number | null>(null)

  // Solo se ofrecen como filtro las etiquetas que tienen alguna foto.
  const etiquetasUsadas = etiquetas.filter((e) => galeria.some((f) => f.etiquetas.includes(e.id)))
  const filtro = etiquetasUsadas.some((e) => e.id === filtroElegido) ? filtroElegido : 'todas'
  const fotos = filtro === 'todas' ? galeria : galeria.filter((f) => f.etiquetas.includes(filtro))
  const actual = indice !== null ? fotos[indice] : null

  const mover = (n: number) => setIndice((i) => (i === null ? i : (i + n + fotos.length) % fotos.length))

  if (galeria.length === 0) {
    return <p className="rounded-sm border border-dashed border-stone-300 p-10 text-center text-sm text-gris">Muy pronto, nuevas fotos.</p>
  }

  return (
    <div>
      {etiquetasUsadas.length > 0 && (
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar galería">
          {[{ id: 'todas', nombre: 'Todas' }, ...etiquetasUsadas].map((c) => (
            <button
              key={c.id}
              type="button"
              aria-pressed={filtro === c.id}
              onClick={() => {
                setFiltro(c.id)
                setIndice(null)
              }}
              className={cx(
                'h-9 rounded-full border px-4 text-[13px] transition-colors',
                filtro === c.id ? 'border-tinta bg-tinta text-white' : 'border-borde text-stone-600 hover:border-stone-400 hover:text-tinta',
              )}
            >
              {c.nombre}
            </button>
          ))}
        </div>
      )}

      <ul className="mt-8 columns-2 gap-3 sm:gap-4 lg:columns-3">
        {fotos.map((foto, i) => (
          <li key={foto.id} className="mb-3 break-inside-avoid sm:mb-4">
            <button
              type="button"
              onClick={() => setIndice(i)}
              className="group relative block w-full overflow-hidden rounded-sm bg-stone-200"
              style={foto.proporcion ? { aspectRatio: `${foto.proporcion[0]} / ${foto.proporcion[1]}` } : undefined}
              aria-label={`Ampliar foto: ${foto.alt}`}
            >
              <img
                src={urlImagen(foto.src, 800, foto.proporcion)}
                srcSet={srcSetImagen(foto.src, foto.proporcion)}
                sizes="(min-width: 1024px) 30vw, 48vw"
                alt=""
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
              />
              <span className="absolute inset-0 bg-tinta/0 transition-colors duration-300 group-hover:bg-tinta/10" aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>

      <Dialogo
        abierto={actual !== null}
        onCerrar={() => setIndice(null)}
        etiqueta="Foto ampliada"
        className="max-w-none bg-transparent shadow-none backdrop:bg-tinta/90 sm:w-[min(92vw,1400px)]"
      >
        {actual && (
          <div
            className="relative flex flex-col items-center"
            onKeyDown={(e) => {
              if (e.key === 'ArrowRight') mover(1)
              if (e.key === 'ArrowLeft') mover(-1)
            }}
          >
            <img src={urlImagen(actual.src, 1600)} alt={actual.alt} className="max-h-[78svh] w-auto max-w-full rounded-sm object-contain" />
            <p className="mt-4 px-12 text-center text-sm text-white/80">{actual.alt}</p>
            <div className="mt-4 flex items-center gap-3">
              <button type="button" onClick={() => mover(-1)} className="grid size-11 place-items-center rounded-full border border-white/30 text-white hover:bg-white/10" aria-label="Foto anterior">
                <ChevronLeft size={20} aria-hidden="true" />
              </button>
              <span className="min-w-14 text-center text-xs text-white/60 tabular-nums">
                {indice! + 1} / {fotos.length}
              </span>
              <button type="button" onClick={() => mover(1)} className="grid size-11 place-items-center rounded-full border border-white/30 text-white hover:bg-white/10" aria-label="Foto siguiente">
                <ChevronRight size={20} aria-hidden="true" />
              </button>
              <button type="button" onClick={() => setIndice(null)} className="ml-3 grid size-11 place-items-center rounded-full bg-white text-tinta hover:bg-stone-200" aria-label="Cerrar" autoFocus>
                <X size={20} aria-hidden="true" />
              </button>
            </div>
          </div>
        )}
      </Dialogo>
    </div>
  )
}
