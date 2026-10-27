import { ArrowDown, ArrowUp, HardDrive, ImagePlus, Link, LoaderCircle, Save, Trash2, Upload } from 'lucide-react'
import { useRef, useState, type FormEvent } from 'react'
import { Boton } from '../../components/Boton'
import { Campo } from '../../components/Campo'
import { DialogoConfirmacion } from '../../components/Dialogo'
import { useDatos } from '../../context/contextoDatos'
import { urlImagen } from '../../data/fotos'
import { usoAlmacenamiento } from '../../lib/almacenamiento'
import { cx } from '../../lib/cx'
import { medirImagenUrl, procesarArchivo } from '../../lib/imagenes'
import { MAX_ALT_FOTO } from '../../services/catalogo'
import type { Etiqueta, FotoGaleria } from '../../types'
import type { Mensaje } from './PanelAdmin'

/** Límite orientativo de localStorage en la mayoría de los navegadores (caracteres). */
const CAPACIDAD_APROX = 5_000_000

export function GaleriaAdmin({ onMensaje }: { onMensaje: (m: Mensaje | null) => void }) {
  const { galeria, etiquetas } = useDatos()
  const [filtro, setFiltro] = useState<string>('todas')
  const uso = usoAlmacenamiento()
  const porcentaje = Math.min(100, Math.round((uso / CAPACIDAD_APROX) * 100))
  const visibles = filtro === 'todas' ? galeria : filtro === 'sin' ? galeria.filter((f) => f.etiquetas.length === 0) : galeria.filter((f) => f.etiquetas.includes(filtro))

  return (
    <div className="space-y-10">
      <div className="grid gap-8 lg:grid-cols-[420px_minmax(0,1fr)]">
        <NuevaFoto etiquetas={etiquetas} onMensaje={onMensaje} />
        <section aria-labelledby="titulo-espacio" className="rounded-sm border border-borde bg-tarjeta p-6 lg:self-start">
          <h2 id="titulo-espacio" className="flex items-center gap-2 text-sm font-medium">
            <HardDrive size={16} aria-hidden="true" /> Espacio del navegador
          </h2>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-stone-100" role="progressbar" aria-valuenow={porcentaje} aria-valuemin={0} aria-valuemax={100} aria-label="Espacio usado">
            <div className={cx('h-full rounded-full', porcentaje > 80 ? 'bg-ocupada' : 'bg-arena')} style={{ width: `${Math.max(porcentaje, 2)}%` }} />
          </div>
          <p className="mt-2 text-[13px] text-gris">
            ≈ {(uso / 1_000_000).toFixed(2)} M de caracteres usados ({porcentaje} % de unos 5 M disponibles).
          </p>
          <p className="mt-3 text-[13px] leading-relaxed text-gris">
            Las fotos subidas se reducen a 1600 px y se guardan en este navegador (unos 150–400 KB cada una). Para galerías grandes,
            conviene usar enlaces a imágenes alojadas en otro servicio.
          </p>
        </section>
      </div>

      <section aria-labelledby="titulo-fotos">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 id="titulo-fotos" className="font-serif text-2xl">
            Fotos de la galería <span className="text-gris">({galeria.length})</span>
          </h2>
          <label className="block text-[13px] text-gris">
            Mostrar
            <select value={filtro} onChange={(e) => setFiltro(e.target.value)} className="control mt-1 h-10 py-0 pr-8">
              <option value="todas">Todas las fotos</option>
              {etiquetas.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.nombre}
                </option>
              ))}
              <option value="sin">Sin etiqueta</option>
            </select>
          </label>
        </div>
        <p className="mt-1 text-[13px] text-gris">El orden de esta lista es el orden en que se muestran en la web.</p>
        {visibles.length === 0 ? (
          <p className="mt-6 rounded-sm border border-dashed border-stone-300 p-8 text-center text-sm text-gris">No hay fotos para mostrar.</p>
        ) : (
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {visibles.map((f) => (
              <TarjetaFoto
                key={`${f.id}|${f.alt}`}
                foto={f}
                etiquetas={etiquetas}
                posicion={galeria.indexOf(f)}
                total={galeria.length}
                onMensaje={onMensaje}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function SelectorEtiquetas({
  etiquetas,
  elegidas,
  onCambiar,
  idGrupo,
}: {
  etiquetas: Etiqueta[]
  elegidas: string[]
  onCambiar: (ids: string[]) => void
  idGrupo: string
}) {
  if (etiquetas.length === 0) return <p className="text-[13px] text-gris">No hay etiquetas. Creálas en la pestaña Etiquetas.</p>
  return (
    <div className="flex flex-wrap gap-1.5" role="group" aria-labelledby={idGrupo}>
      {etiquetas.map((e) => {
        const activa = elegidas.includes(e.id)
        return (
          <button
            key={e.id}
            type="button"
            aria-pressed={activa}
            onClick={() => onCambiar(activa ? elegidas.filter((x) => x !== e.id) : [...elegidas, e.id])}
            className={cx(
              'h-8 rounded-full border px-3 text-[13px] transition-colors',
              activa ? 'border-tinta bg-tinta text-white' : 'border-borde text-stone-600 hover:border-stone-400',
            )}
          >
            {e.nombre}
          </button>
        )
      })}
    </div>
  )
}

function NuevaFoto({ etiquetas, onMensaje }: { etiquetas: Etiqueta[]; onMensaje: (m: Mensaje | null) => void }) {
  const { agregarFoto } = useDatos()
  const [origen, setOrigen] = useState<'archivo' | 'url'>('archivo')
  const [archivo, setArchivo] = useState<File | null>(null)
  const [url, setUrl] = useState('')
  const [alt, setAlt] = useState('')
  const [elegidas, setElegidas] = useState<string[]>([])
  const [errores, setErrores] = useState<{ imagen?: string; alt?: string }>({})
  const [procesando, setProcesando] = useState(false)
  const inputArchivo = useRef<HTMLInputElement>(null)

  async function enviar(e: FormEvent) {
    e.preventDefault()
    const nuevos = {
      imagen:
        origen === 'archivo'
          ? archivo
            ? undefined
            : 'Elegí una imagen de tu dispositivo.'
          : /^https:\/\/\S+$/.test(url.trim())
            ? undefined
            : 'Pegá un enlace que empiece con https://',
      alt: alt.trim() ? undefined : 'Describí brevemente la foto (se usa como texto alternativo).',
    }
    setErrores(nuevos)
    if (nuevos.imagen || nuevos.alt) return
    setProcesando(true)
    try {
      const datos =
        origen === 'archivo' ? await procesarArchivo(archivo!) : { src: url.trim(), proporcion: await medirImagenUrl(url.trim()) }
      agregarFoto({ ...datos, alt, etiquetas: elegidas })
      onMensaje({ tipo: 'exito', texto: 'Foto agregada al principio de la galería.' })
      setArchivo(null)
      setUrl('')
      setAlt('')
      setElegidas([])
      if (inputArchivo.current) inputArchivo.current.value = ''
    } catch (err) {
      const texto = err instanceof Error ? err.message : 'No se pudo agregar la foto.'
      if (origen === 'url' || /imagen|archivo/i.test(texto)) setErrores({ imagen: texto })
      else onMensaje({ tipo: 'error', texto })
    } finally {
      setProcesando(false)
    }
  }

  return (
    <section aria-labelledby="titulo-nueva-foto" className="rounded-sm border border-borde bg-tarjeta p-6">
      <h2 id="titulo-nueva-foto" className="font-serif text-2xl">
        Agregar foto
      </h2>
      <form onSubmit={enviar} noValidate className="mt-5 space-y-5">
        <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Origen de la imagen">
          {(
            [
              ['archivo', 'Subir archivo', Upload],
              ['url', 'Desde URL', Link],
            ] as const
          ).map(([valor, texto, Icono]) => (
            <button
              key={valor}
              type="button"
              role="radio"
              aria-checked={origen === valor}
              onClick={() => {
                setOrigen(valor)
                setErrores({})
              }}
              className={cx(
                'flex h-10 items-center justify-center gap-2 rounded-sm border text-sm transition-colors',
                origen === valor ? 'border-tinta bg-tinta text-white' : 'border-borde hover:border-stone-400',
              )}
            >
              <Icono size={15} aria-hidden="true" /> {texto}
            </button>
          ))}
        </div>

        {origen === 'archivo' ? (
          <Campo id="foto-archivo" etiqueta="Imagen" obligatorio error={errores.imagen} ayuda="JPG, PNG o WebP. Se reduce automáticamente.">
            {(p) => (
              <input
                {...p}
                ref={inputArchivo}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => {
                  setArchivo(e.target.files?.[0] ?? null)
                  setErrores((x) => ({ ...x, imagen: undefined }))
                }}
                className="control cursor-pointer file:mr-3 file:rounded-sm file:border-0 file:bg-stone-100 file:px-3 file:py-1.5 file:text-sm"
              />
            )}
          </Campo>
        ) : (
          <Campo id="foto-url" etiqueta="Enlace de la imagen" obligatorio error={errores.imagen} ayuda="Enlace directo a la foto (https://…)">
            {(p) => (
              <input
                {...p}
                type="url"
                inputMode="url"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value)
                  setErrores((x) => ({ ...x, imagen: undefined }))
                }}
                placeholder="https://images.unsplash.com/photo-…"
                className="control"
              />
            )}
          </Campo>
        )}

        <Campo id="foto-alt" etiqueta="Descripción" obligatorio error={errores.alt} ayuda="Qué se ve en la foto. Ayuda a la accesibilidad.">
          {(p) => (
            <input
              {...p}
              type="text"
              maxLength={MAX_ALT_FOTO}
              value={alt}
              onChange={(e) => {
                setAlt(e.target.value)
                setErrores((x) => ({ ...x, alt: undefined }))
              }}
              placeholder="Ej.: Novios saliendo de la iglesia"
              className="control"
            />
          )}
        </Campo>

        <div>
          <p id="nueva-foto-etiquetas" className="mb-2 text-sm font-medium">
            Etiquetas <span className="font-normal text-gris">(opcional)</span>
          </p>
          <SelectorEtiquetas etiquetas={etiquetas} elegidas={elegidas} onCambiar={setElegidas} idGrupo="nueva-foto-etiquetas" />
        </div>

        <Boton type="submit" className="w-full" disabled={procesando} aria-busy={procesando}>
          {procesando ? <LoaderCircle size={16} className="animate-spin" aria-hidden="true" /> : <ImagePlus size={16} aria-hidden="true" />}
          {procesando ? 'Procesando…' : 'Agregar a la galería'}
        </Boton>
      </form>
    </section>
  )
}

function TarjetaFoto({
  foto,
  etiquetas,
  posicion,
  total,
  onMensaje,
}: {
  foto: FotoGaleria
  etiquetas: Etiqueta[]
  posicion: number
  total: number
  onMensaje: (m: Mensaje | null) => void
}) {
  const { actualizarFoto, eliminarFoto, moverFoto } = useDatos()
  const [alt, setAlt] = useState(foto.alt)
  const [confirmar, setConfirmar] = useState(false)

  function ejecutar(op: () => void, exito?: string) {
    try {
      op()
      if (exito) onMensaje({ tipo: 'exito', texto: exito })
    } catch (err) {
      onMensaje({ tipo: 'error', texto: err instanceof Error ? err.message : 'No se pudo actualizar la foto.' })
    }
  }

  return (
    <li className="flex flex-col overflow-hidden rounded-sm border border-borde bg-tarjeta">
      <div className="relative aspect-[4/3] bg-stone-100">
        <img src={urlImagen(foto.src, 600, foto.proporcion)} alt="" loading="lazy" className="h-full w-full object-cover" />
        <span className="absolute top-2 left-2 rounded-full bg-tinta/75 px-2 py-0.5 text-xs text-white tabular-nums">#{posicion + 1}</span>
      </div>
      <div className="flex flex-1 flex-col gap-4 p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            ejecutar(() => actualizarFoto(foto.id, { alt }), 'Descripción actualizada.')
          }}
          className="flex items-end gap-2"
        >
          <label className="block flex-1 text-[13px] text-gris">
            Descripción
            <input type="text" maxLength={MAX_ALT_FOTO} value={alt} onChange={(e) => setAlt(e.target.value)} className="control mt-1 py-2 text-sm" />
          </label>
          <Boton type="submit" tamano="sm" variante="suave" disabled={alt.trim() === foto.alt || !alt.trim()} aria-label="Guardar descripción">
            <Save size={14} aria-hidden="true" />
          </Boton>
        </form>
        <div>
          <p id={`etq-${foto.id}`} className="mb-1.5 text-[13px] text-gris">
            Etiquetas
          </p>
          <SelectorEtiquetas
            etiquetas={etiquetas}
            elegidas={foto.etiquetas}
            onCambiar={(ids) => ejecutar(() => actualizarFoto(foto.id, { etiquetas: ids }))}
            idGrupo={`etq-${foto.id}`}
          />
        </div>
        <div className="mt-auto flex items-center justify-between gap-2 border-t border-borde pt-3">
          <div className="flex gap-1">
            <Boton variante="suave" tamano="sm" disabled={posicion === 0} onClick={() => ejecutar(() => moverFoto(foto.id, -1))} aria-label="Mover antes">
              <ArrowUp size={14} aria-hidden="true" />
            </Boton>
            <Boton variante="suave" tamano="sm" disabled={posicion === total - 1} onClick={() => ejecutar(() => moverFoto(foto.id, 1))} aria-label="Mover después">
              <ArrowDown size={14} aria-hidden="true" />
            </Boton>
          </div>
          <Boton variante="suave" tamano="sm" onClick={() => setConfirmar(true)}>
            <Trash2 size={14} aria-hidden="true" /> Eliminar
          </Boton>
        </div>
      </div>
      <DialogoConfirmacion
        abierto={confirmar}
        titulo="¿Eliminar esta foto?"
        descripcion={`“${foto.alt}” dejará de mostrarse en la galería. Esta acción no se puede deshacer.`}
        textoConfirmar="Eliminar foto"
        peligro
        onConfirmar={() => {
          setConfirmar(false)
          ejecutar(() => eliminarFoto(foto.id), 'Foto eliminada.')
        }}
        onCancelar={() => setConfirmar(false)}
      />
    </li>
  )
}
