import { ArrowLeft, KeyRound, LoaderCircle, Lock, Mail } from 'lucide-react'
import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Aviso } from '../../components/Aviso'
import { Boton } from '../../components/Boton'
import { Campo } from '../../components/Campo'
import { CampoClave } from '../../components/CampoClave'
import { useTituloPagina } from '../../components/Varios'
import { ErrorCuenta, solicitarRestablecimiento, verificarClave, type ResultadoSolicitud } from '../../services/cuenta'
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
 * Acceso de demostración: todo corre en el navegador, por lo que no es una
 * autenticación segura. La sesión dura lo que la pestaña (sessionStorage) y
 * la contraseña nunca se guarda en texto.
 */
export default function Admin() {
  useTituloPagina('Administración')
  return <RequiereAdmin>{(salir) => <PanelAdmin onSalir={salir} />}</RequiereAdmin>
}

/** Muestra la pantalla de acceso hasta que se ingresa la contraseña de administración. */
export function RequiereAdmin({ children }: { children: (salir: () => void) => ReactNode }) {
  const [autenticado, setAutenticado] = useState(sesionActiva)

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
  return <>{children(salir)}</>
}

function AccesoAdmin({ onAcceso }: { onAcceso: () => void }) {
  const location = useLocation()
  const navigate = useNavigate()
  // El aviso se muestra una sola vez: se limpia del historial para que no reaparezca al recargar.
  const [claveRestablecida] = useState(() => Boolean((location.state as { claveRestablecida?: boolean } | null)?.claveRestablecida))
  useEffect(() => {
    if (location.state) navigate(location.pathname, { replace: true, state: null })
  }, [location.state, location.pathname, navigate])
  const [modo, setModo] = useState<'acceso' | 'olvido'>('acceso')

  return (
    <div className="contenedor flex justify-center py-20 sm:py-28">
      <div className="w-full max-w-md">
        {modo === 'acceso' ? (
          <FormularioAcceso onAcceso={onAcceso} onOlvido={() => setModo('olvido')} claveRestablecida={claveRestablecida} />
        ) : (
          <FormularioOlvido onVolver={() => setModo('acceso')} />
        )}
      </div>
    </div>
  )
}

function FormularioAcceso({
  onAcceso,
  onOlvido,
  claveRestablecida,
}: {
  onAcceso: () => void
  onOlvido: () => void
  claveRestablecida?: boolean
}) {
  const [clave, setClave] = useState('')
  const [error, setError] = useState<string>()
  const [verificando, setVerificando] = useState(false)

  async function ingresar(e: FormEvent) {
    e.preventDefault()
    if (!clave) {
      setError('Ingresá la contraseña.')
      return
    }
    setVerificando(true)
    const correcta = await verificarClave(clave)
    setVerificando(false)
    if (!correcta) {
      setError('La contraseña no es correcta. Revisala e intentá de nuevo.')
      setClave('')
      document.getElementById('admin-clave')?.focus()
      return
    }
    onAcceso()
  }

  return (
    <>
      <div className="text-center">
        <span className="mx-auto grid size-12 place-items-center rounded-full border border-borde bg-tarjeta text-arena-texto">
          <Lock size={20} aria-hidden="true" />
        </span>
        <h1 className="mt-6 font-serif text-3xl sm:text-4xl">Panel de administración</h1>
        <p className="mt-3 text-gris">Ingresá la contraseña para gestionar reservas y disponibilidad.</p>
      </div>
      {claveRestablecida && (
        <Aviso tipo="exito" className="mt-8">
          Tu contraseña se cambió. Ya podés ingresar con la nueva.
        </Aviso>
      )}
      <form onSubmit={ingresar} noValidate className="mt-8 rounded-sm border border-borde bg-tarjeta p-6 sm:p-8">
        <CampoClave
          id="admin-clave"
          etiqueta="Contraseña"
          valor={clave}
          onCambiar={(v) => {
            setClave(v)
            setError(undefined)
          }}
          error={error}
          autoComplete="current-password"
          autoFocus
        />
        <Boton type="submit" className="mt-6 w-full" disabled={verificando} aria-busy={verificando}>
          {verificando && <LoaderCircle size={16} className="animate-spin" aria-hidden="true" />}
          {verificando ? 'Verificando…' : 'Ingresar'}
        </Boton>
        <button type="button" onClick={onOlvido} className="mt-5 block w-full text-center text-sm text-arena-texto underline-offset-4 hover:underline">
          ¿Olvidaste tu contraseña?
        </button>
      </form>
      <Aviso tipo="info" className="mt-6">
        Protección de demostración: los datos de acceso se guardan en este navegador y no reemplazan una autenticación segura
        para producción.
      </Aviso>
    </>
  )
}

function FormularioOlvido({ onVolver }: { onVolver: () => void }) {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string>()
  const [enviando, setEnviando] = useState(false)
  const [resultado, setResultado] = useState<ResultadoSolicitud | null>(null)

  async function enviar(e: FormEvent) {
    e.preventDefault()
    setEnviando(true)
    setError(undefined)
    try {
      setResultado(await solicitarRestablecimiento(email))
    } catch (err) {
      setError(err instanceof ErrorCuenta ? err.message : 'No se pudo procesar el pedido. Probá de nuevo.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <>
      <div className="text-center">
        <span className="mx-auto grid size-12 place-items-center rounded-full border border-borde bg-tarjeta text-arena-texto">
          <KeyRound size={20} aria-hidden="true" />
        </span>
        <h1 className="mt-6 font-serif text-3xl sm:text-4xl">Restablecer contraseña</h1>
        <p className="mt-3 text-gris">Escribí el correo de la cuenta de administración y te mandamos un enlace para elegir una nueva.</p>
      </div>

      {resultado ? (
        <div className="mt-8 space-y-4">
          {resultado.correoConfigurado ? (
            <Aviso tipo="exito" titulo="Revisá tu correo">
              Si el correo corresponde a la cuenta de administración, en unos minutos vas a recibir un enlace para restablecer
              la contraseña. El enlace vale durante 60 minutos.
            </Aviso>
          ) : (
            <Aviso tipo="advertencia" titulo="El envío de correos todavía no está configurado">
              El pedido quedó registrado, pero no se envió ningún mensaje. Cuando se configure el envío, el enlace llegará al
              correo de la cuenta.
            </Aviso>
          )}
          {resultado.enlacePrueba && (
            <Aviso tipo="info" titulo="Modo demostración">
              Para probar el flujo sin correo, este es el enlace que se enviaría (vale 60 minutos, un solo uso):{' '}
              <a href={resultado.enlacePrueba} className="break-all underline underline-offset-2">
                restablecer contraseña
              </a>
              .
            </Aviso>
          )}
          <Boton variante="suave" className="w-full" onClick={onVolver}>
            <ArrowLeft size={16} aria-hidden="true" /> Volver a ingresar
          </Boton>
        </div>
      ) : (
        <form onSubmit={enviar} noValidate className="mt-8 rounded-sm border border-borde bg-tarjeta p-6 sm:p-8">
          <Campo id="olvido-email" etiqueta="Correo electrónico" obligatorio error={error}>
            {(p) => (
              <input
                {...p}
                type="email"
                inputMode="email"
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setError(undefined)
                }}
                className="control"
                autoFocus
              />
            )}
          </Campo>
          <Boton type="submit" className="mt-6 w-full" disabled={enviando} aria-busy={enviando}>
            {enviando ? <LoaderCircle size={16} className="animate-spin" aria-hidden="true" /> : <Mail size={16} aria-hidden="true" />}
            {enviando ? 'Enviando…' : 'Enviar enlace'}
          </Boton>
          <button type="button" onClick={onVolver} className="mt-5 flex w-full items-center justify-center gap-1.5 text-sm text-gris hover:text-tinta">
            <ArrowLeft size={14} aria-hidden="true" /> Volver a ingresar
          </button>
        </form>
      )}
    </>
  )
}
