import { Eye, EyeOff, Lock } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Aviso } from '../../components/Aviso'
import { Boton } from '../../components/Boton'
import { Campo } from '../../components/Campo'
import { useTituloPagina } from '../../components/Varios'
import { CONFIG } from '../../config'
import { PanelAdmin } from './PanelAdmin'

const CLAVE_SESION = 'leandro_baez_admin_sesion'

function sesionActiva(): boolean {
  try {
    return sessionStorage.getItem(CLAVE_SESION) === 'activa'
  } catch {
    return false
  }
}

/**
 * Acceso de demostración: la clave vive en el código del cliente, por lo que
 * no es una autenticación segura. La sesión dura lo que la pestaña
 * (sessionStorage) y la clave nunca se guarda.
 */
export default function Admin() {
  const [autenticado, setAutenticado] = useState(sesionActiva)
  useTituloPagina('Administración')

  function salir() {
    try {
      sessionStorage.removeItem(CLAVE_SESION)
    } catch {
      /* sin sessionStorage no hay sesión que cerrar */
    }
    setAutenticado(false)
  }

  if (!autenticado) {
    return (
      <AccesoAdmin
        onAcceso={() => {
          try {
            sessionStorage.setItem(CLAVE_SESION, 'activa')
          } catch {
            /* la sesión dura solo mientras la página esté abierta */
          }
          setAutenticado(true)
        }}
      />
    )
  }
  return <PanelAdmin onSalir={salir} />
}

function AccesoAdmin({ onAcceso }: { onAcceso: () => void }) {
  const [clave, setClave] = useState('')
  const [visible, setVisible] = useState(false)
  const [error, setError] = useState<string>()

  function ingresar(e: FormEvent) {
    e.preventDefault()
    if (!clave) {
      setError('Ingresá la clave de acceso.')
      return
    }
    if (clave !== CONFIG.admin.clave) {
      setError('La clave no es correcta. Revisala e intentá de nuevo.')
      setClave('')
      document.getElementById('admin-clave')?.focus()
      return
    }
    onAcceso()
  }

  return (
    <div className="contenedor flex justify-center py-20 sm:py-28">
      <div className="w-full max-w-md">
        <div className="text-center">
          <span className="mx-auto grid size-12 place-items-center rounded-full border border-borde bg-tarjeta text-arena-texto">
            <Lock size={20} aria-hidden="true" />
          </span>
          <h1 className="mt-6 font-serif text-3xl sm:text-4xl">Panel de administración</h1>
          <p className="mt-3 text-gris">Ingresá la clave para gestionar reservas y disponibilidad.</p>
        </div>
        <form onSubmit={ingresar} noValidate className="mt-10 rounded-sm border border-borde bg-tarjeta p-6 sm:p-8">
          <Campo id="admin-clave" etiqueta="Clave de acceso" obligatorio error={error}>
            {(p) => (
              <div className="relative">
                <input
                  {...p}
                  type={visible ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={clave}
                  onChange={(e) => {
                    setClave(e.target.value)
                    setError(undefined)
                  }}
                  className="control pr-12"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setVisible((v) => !v)}
                  className="absolute top-1/2 right-1 mt-1 grid size-9 -translate-y-1/2 place-items-center rounded-sm text-gris hover:text-tinta"
                  aria-label={visible ? 'Ocultar clave' : 'Mostrar clave'}
                  aria-pressed={visible}
                >
                  {visible ? <EyeOff size={17} aria-hidden="true" /> : <Eye size={17} aria-hidden="true" />}
                </button>
              </div>
            )}
          </Campo>
          <Boton type="submit" className="mt-6 w-full">
            Ingresar
          </Boton>
        </form>
        <Aviso tipo="info" className="mt-6">
          Protección de demostración: la clave se define en <code>src/config.ts</code> y no reemplaza una autenticación
          segura para producción.
        </Aviso>
      </div>
    </div>
  )
}
