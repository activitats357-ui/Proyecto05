import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useDatos } from '../context/contextoDatos'
import { Aviso } from './Aviso'
import { Encabezado } from './Encabezado'
import { Pie } from './Pie'

/** Al cambiar de ruta vuelve arriba, o se desplaza al ancla (#servicios). */
function GestorScroll() {
  const { pathname, hash, key } = useLocation()
  useEffect(() => {
    if (hash) {
      const id = decodeURIComponent(hash.slice(1))
      const t = window.setTimeout(() => document.getElementById(id)?.scrollIntoView({ block: 'start' }), 30)
      return () => window.clearTimeout(t)
    }
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [pathname, hash, key])
  return null
}

export function Plantilla() {
  const { avisos, descartarAvisos } = useDatos()
  return (
    <div className="flex min-h-svh flex-col">
      <a
        href="#contenido"
        className="sr-only z-50 rounded-sm bg-tinta px-4 py-2 text-sm text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Saltar al contenido
      </a>
      <GestorScroll />
      <Encabezado />
      {avisos.length > 0 && (
        <div className="contenedor pt-4">
          <Aviso tipo="advertencia" titulo="Aviso sobre los datos guardados" onCerrar={descartarAvisos}>
            <ul className="list-disc space-y-1 pl-4">
              {avisos.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          </Aviso>
        </div>
      )}
      <main id="contenido" tabIndex={-1} className="flex-1 focus:outline-none">
        <Outlet />
      </main>
      <Pie />
    </div>
  )
}
