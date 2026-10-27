import { Check, Pencil, Plus, Trash2, X } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Boton } from '../../components/Boton'
import { Campo } from '../../components/Campo'
import { DialogoConfirmacion } from '../../components/Dialogo'
import { useDatos } from '../../context/contextoDatos'
import { MAX_NOMBRE_ETIQUETA, validarNombreEtiqueta } from '../../services/catalogo'
import type { Etiqueta } from '../../types'
import type { Mensaje } from './PanelAdmin'

export function EtiquetasAdmin({ onMensaje }: { onMensaje: (m: Mensaje | null) => void }) {
  const { etiquetas, galeria, crearEtiqueta, renombrarEtiqueta, eliminarEtiqueta } = useDatos()
  const [nueva, setNueva] = useState('')
  const [errorNueva, setErrorNueva] = useState<string>()
  const [editando, setEditando] = useState<string | null>(null)
  const [nombreEditado, setNombreEditado] = useState('')
  const [errorEdicion, setErrorEdicion] = useState<string>()
  const [aEliminar, setAEliminar] = useState<Etiqueta | null>(null)

  const usos = (id: string) => galeria.filter((f) => f.etiquetas.includes(id)).length

  function crear(e: FormEvent) {
    e.preventDefault()
    const error = validarNombreEtiqueta(nueva, etiquetas)
    setErrorNueva(error ?? undefined)
    if (error) return
    try {
      const etiqueta = crearEtiqueta(nueva)
      onMensaje({ tipo: 'exito', texto: `Etiqueta “${etiqueta.nombre}” creada.` })
      setNueva('')
    } catch (err) {
      onMensaje({ tipo: 'error', texto: err instanceof Error ? err.message : 'No se pudo crear la etiqueta.' })
    }
  }

  function guardarEdicion(e: FormEvent, etiqueta: Etiqueta) {
    e.preventDefault()
    const error = validarNombreEtiqueta(nombreEditado, etiquetas, etiqueta.id)
    setErrorEdicion(error ?? undefined)
    if (error) return
    try {
      const renombrada = renombrarEtiqueta(etiqueta.id, nombreEditado)
      onMensaje({ tipo: 'exito', texto: `“${etiqueta.nombre}” ahora se llama “${renombrada.nombre}”.` })
      setEditando(null)
    } catch (err) {
      onMensaje({ tipo: 'error', texto: err instanceof Error ? err.message : 'No se pudo renombrar la etiqueta.' })
    }
  }

  function confirmarEliminacion() {
    if (!aEliminar) return
    try {
      const afectadas = eliminarEtiqueta(aEliminar.id)
      onMensaje({
        tipo: 'exito',
        texto: `Etiqueta “${aEliminar.nombre}” eliminada${afectadas ? ` y quitada de ${afectadas} foto(s)` : ''}.`,
      })
    } catch (err) {
      onMensaje({ tipo: 'error', texto: err instanceof Error ? err.message : 'No se pudo eliminar la etiqueta.' })
    }
    setAEliminar(null)
  }

  return (
    <div className="max-w-3xl">
      <h2 className="font-serif text-2xl">Etiquetas de la galería</h2>
      <p className="mt-1 text-sm text-gris">Las etiquetas con fotos aparecen como filtros en la galería pública.</p>

      <form onSubmit={crear} noValidate className="mt-6 flex flex-col gap-3 rounded-sm border border-borde bg-tarjeta p-5 sm:flex-row sm:items-start">
        <Campo id="etiqueta-nueva" etiqueta="Nueva etiqueta" obligatorio error={errorNueva} className="flex-1">
          {(p) => (
            <input
              {...p}
              type="text"
              maxLength={MAX_NOMBRE_ETIQUETA}
              value={nueva}
              onChange={(e) => {
                setNueva(e.target.value)
                setErrorNueva(undefined)
              }}
              placeholder="Ej.: Quince años"
              className="control"
            />
          )}
        </Campo>
        <Boton type="submit" className="sm:mt-7">
          <Plus size={16} aria-hidden="true" /> Agregar
        </Boton>
      </form>

      {etiquetas.length === 0 ? (
        <p className="mt-6 rounded-sm border border-dashed border-stone-300 p-8 text-center text-sm text-gris">Todavía no hay etiquetas.</p>
      ) : (
        <ul className="mt-6 divide-y divide-borde rounded-sm border border-borde bg-tarjeta">
          {etiquetas.map((et) => (
            <li key={et.id} className="px-4 py-3">
              {editando === et.id ? (
                <form onSubmit={(e) => guardarEdicion(e, et)} noValidate className="flex items-start gap-2">
                  <div className="flex-1">
                    <label htmlFor={`renombrar-${et.id}`} className="sr-only">
                      Nuevo nombre para {et.nombre}
                    </label>
                    <input
                      id={`renombrar-${et.id}`}
                      type="text"
                      maxLength={MAX_NOMBRE_ETIQUETA}
                      value={nombreEditado}
                      onChange={(e) => {
                        setNombreEditado(e.target.value)
                        setErrorEdicion(undefined)
                      }}
                      onKeyDown={(e) => e.key === 'Escape' && setEditando(null)}
                      aria-invalid={Boolean(errorEdicion)}
                      aria-describedby={errorEdicion ? `renombrar-${et.id}-error` : undefined}
                      className="control mt-0"
                      autoFocus
                    />
                    {errorEdicion && (
                      <p id={`renombrar-${et.id}-error`} className="mt-1.5 text-[13px] text-ocupada">
                        {errorEdicion}
                      </p>
                    )}
                  </div>
                  <Boton type="submit" tamano="sm" className="mt-1" aria-label="Guardar nombre">
                    <Check size={15} aria-hidden="true" />
                  </Boton>
                  <Boton variante="suave" tamano="sm" className="mt-1" onClick={() => setEditando(null)} aria-label="Cancelar edición">
                    <X size={15} aria-hidden="true" />
                  </Boton>
                </form>
              ) : (
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{et.nombre}</p>
                    <p className="text-[13px] text-gris">{usos(et.id)} foto(s)</p>
                  </div>
                  <div className="flex gap-2">
                    <Boton
                      variante="suave"
                      tamano="sm"
                      onClick={() => {
                        setEditando(et.id)
                        setNombreEditado(et.nombre)
                        setErrorEdicion(undefined)
                      }}
                      aria-label={`Renombrar ${et.nombre}`}
                    >
                      <Pencil size={14} aria-hidden="true" /> <span className="hidden sm:inline">Renombrar</span>
                    </Boton>
                    <Boton variante="suave" tamano="sm" onClick={() => setAEliminar(et)} aria-label={`Eliminar ${et.nombre}`}>
                      <Trash2 size={14} aria-hidden="true" /> <span className="hidden sm:inline">Eliminar</span>
                    </Boton>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <DialogoConfirmacion
        abierto={aEliminar !== null}
        titulo="¿Eliminar esta etiqueta?"
        descripcion={
          aEliminar && (
            <>
              Se eliminará “{aEliminar.nombre}”
              {usos(aEliminar.id) > 0 ? ` y se quitará de ${usos(aEliminar.id)} foto(s). Las fotos no se borran.` : '.'}
            </>
          )
        }
        textoConfirmar="Eliminar etiqueta"
        peligro
        onConfirmar={confirmarEliminacion}
        onCancelar={() => setAEliminar(null)}
      />
    </div>
  )
}
