import { Save } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Boton } from '../../components/Boton'
import { Campo } from '../../components/Campo'
import { useDatos } from '../../context/contextoDatos'
import { urlFoto } from '../../data/fotos'
import type { Servicio } from '../../data/servicios'
import { DURACION_MINIMA_HORAS, duracionMaximaHoras, formatearDuracion } from '../../lib/horas'
import { MAX_NOMBRE_SERVICIO, validarServicio } from '../../services/catalogo'
import type { Mensaje } from './PanelAdmin'

export function ServiciosAdmin({ onMensaje }: { onMensaje: (m: Mensaje | null) => void }) {
  const { servicios, horario } = useDatos()
  return (
    <div className="space-y-10">
      <section aria-labelledby="titulo-servicios">
        <h2 id="titulo-servicios" className="font-serif text-2xl">
          Servicios y duración de los turnos
        </h2>
        <p className="mt-1 max-w-2xl text-sm text-gris">
          La duración define cuánto ocupa cada reserva en la agenda. Los cambios se aplican a las reservas nuevas; las ya
          registradas mantienen su horario. Los días y horas de atención se definen en la pestaña Horario.
        </p>
        <ul className="mt-6 grid gap-4 md:grid-cols-2">
          {servicios.map((s) => (
            <li key={s.id}>
              {/* La key con los valores guardados reinicia el formulario tras guardar. */}
              <FormularioServicio key={`${s.nombre}|${s.duracionHoras}|${JSON.stringify(horario)}`} servicio={s} onMensaje={onMensaje} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

function FormularioServicio({ servicio, onMensaje }: { servicio: Servicio; onMensaje: (m: Mensaje | null) => void }) {
  const { actualizarServicio } = useDatos()
  const [nombre, setNombre] = useState(servicio.nombre)
  const [duracion, setDuracion] = useState(String(servicio.duracionHoras))
  const [errores, setErrores] = useState<{ nombre?: string; duracion?: string }>({})

  const duracionNum = Number(duracion.replace(',', '.'))
  const cambiado = nombre.trim() !== servicio.nombre || duracionNum !== servicio.duracionHoras

  function guardar(e: FormEvent) {
    e.preventDefault()
    const nuevos = validarServicio(nombre, duracionNum)
    setErrores(nuevos)
    if (nuevos.nombre || nuevos.duracion) return
    try {
      const s = actualizarServicio(servicio.id, nombre, duracionNum)
      onMensaje({ tipo: 'exito', texto: `“${s.nombre}” guardado: turnos de ${formatearDuracion(s.duracionHoras)}.` })
    } catch (err) {
      onMensaje({ tipo: 'error', texto: err instanceof Error ? err.message : 'No se pudo guardar el servicio.' })
    }
  }

  const id = `servicio-${servicio.id}`
  return (
    <form onSubmit={guardar} noValidate className="flex h-full flex-col rounded-sm border border-borde bg-tarjeta p-5">
      <div className="flex items-center gap-3">
        <img src={urlFoto(servicio.foto, 160)} alt="" className="size-12 rounded-sm object-cover" />
        <div className="min-w-0">
          <p className="truncate font-serif text-lg">{servicio.nombre}</p>
          <p className="text-[13px] text-gris">
            Turnos de {formatearDuracion(servicio.duracionHoras)} · <span className="font-mono">{servicio.id}</span>
          </p>
        </div>
      </div>
      <div className="mt-5 grid flex-1 gap-4 sm:grid-cols-[1fr_9rem]">
        <Campo id={`${id}-nombre`} etiqueta="Nombre" obligatorio error={errores.nombre}>
          {(p) => (
            <input {...p} type="text" maxLength={MAX_NOMBRE_SERVICIO} value={nombre} onChange={(e) => setNombre(e.target.value)} className="control" />
          )}
        </Campo>
        <Campo id={`${id}-duracion`} etiqueta="Duración (horas)" obligatorio error={errores.duracion}>
          {(p) => (
            <input
              {...p}
              type="number"
              inputMode="decimal"
              min={DURACION_MINIMA_HORAS}
              max={duracionMaximaHoras()}
              step={DURACION_MINIMA_HORAS}
              value={duracion}
              onChange={(e) => setDuracion(e.target.value)}
              className="control tabular-nums"
            />
          )}
        </Campo>
      </div>
      <div className="mt-5 flex justify-end">
        <Boton type="submit" tamano="sm" disabled={!cambiado}>
          <Save size={14} aria-hidden="true" /> Guardar cambios
        </Boton>
      </div>
    </form>
  )
}
