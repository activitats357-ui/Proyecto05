import { KeyRound, LoaderCircle } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Aviso } from '../../components/Aviso'
import { Boton, BotonLink } from '../../components/Boton'
import { CampoClave } from '../../components/CampoClave'
import { useTituloPagina } from '../../components/Varios'
import { ErrorCuenta, MIN_LARGO_CLAVE, restablecerClave, tokenValido, validarNuevaClave } from '../../services/cuenta'

/** Página a la que lleva el enlace del correo de restablecimiento. */
export default function RestablecerClave() {
  useTituloPagina('Restablecer contraseña')
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''
  const [estado, setEstado] = useState<'comprobando' | 'valido' | 'invalido'>('comprobando')
  const [nueva, setNueva] = useState('')
  const [confirmacion, setConfirmacion] = useState('')
  const [errores, setErrores] = useState<{ nueva?: string; confirmacion?: string; general?: string }>({})
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    let vigente = true
    tokenValido(token).then((ok) => vigente && setEstado(ok ? 'valido' : 'invalido'))
    return () => {
      vigente = false
    }
  }, [token])

  async function guardar(e: FormEvent) {
    e.preventDefault()
    const nuevos = validarNuevaClave(nueva, confirmacion)
    setErrores(nuevos)
    if (nuevos.nueva || nuevos.confirmacion) return
    setGuardando(true)
    try {
      await restablecerClave(token, nueva, confirmacion)
      navigate('/admin', { replace: true, state: { claveRestablecida: true } })
    } catch (err) {
      setGuardando(false)
      if (err instanceof ErrorCuenta && err.campo === 'token') setEstado('invalido')
      else if (err instanceof ErrorCuenta && (err.campo === 'nueva' || err.campo === 'confirmacion')) setErrores({ [err.campo]: err.message })
      else setErrores({ general: err instanceof Error ? err.message : 'No se pudo guardar la contraseña.' })
    }
  }

  return (
    <div className="contenedor flex justify-center py-20 sm:py-28">
      <div className="w-full max-w-md">
        <div className="text-center">
          <span className="mx-auto grid size-12 place-items-center rounded-full border border-borde bg-tarjeta text-arena-texto">
            <KeyRound size={20} aria-hidden="true" />
          </span>
          <h1 className="mt-6 font-serif text-3xl sm:text-4xl">Nueva contraseña</h1>
        </div>

        {estado === 'comprobando' && (
          <p className="mt-10 flex items-center justify-center gap-2 text-sm text-gris" role="status">
            <LoaderCircle size={16} className="animate-spin" aria-hidden="true" /> Comprobando el enlace…
          </p>
        )}

        {estado === 'invalido' && (
          <div className="mt-8 space-y-6">
            <Aviso tipo="error" titulo="El enlace no es válido o ya venció">
              Los enlaces valen 60 minutos y se pueden usar una sola vez. Pedí uno nuevo desde la pantalla de acceso.
            </Aviso>
            <BotonLink to="/admin" className="w-full">
              Ir a la pantalla de acceso
            </BotonLink>
          </div>
        )}

        {estado === 'valido' && (
          <form onSubmit={guardar} noValidate className="mt-8 space-y-5 rounded-sm border border-borde bg-tarjeta p-6 sm:p-8">
            {errores.general && <Aviso tipo="error">{errores.general}</Aviso>}
            <CampoClave
              id="restablecer-nueva"
              etiqueta="Nueva contraseña"
              valor={nueva}
              onCambiar={(v) => {
                setNueva(v)
                setErrores((x) => ({ ...x, nueva: undefined }))
              }}
              error={errores.nueva}
              ayuda={`Al menos ${MIN_LARGO_CLAVE} caracteres, con letras y números.`}
              autoComplete="new-password"
              autoFocus
            />
            <CampoClave
              id="restablecer-confirmacion"
              etiqueta="Repetí la contraseña"
              valor={confirmacion}
              onCambiar={(v) => {
                setConfirmacion(v)
                setErrores((x) => ({ ...x, confirmacion: undefined }))
              }}
              error={errores.confirmacion}
              autoComplete="new-password"
            />
            <Boton type="submit" className="w-full" disabled={guardando} aria-busy={guardando}>
              {guardando && <LoaderCircle size={16} className="animate-spin" aria-hidden="true" />}
              {guardando ? 'Guardando…' : 'Guardar contraseña'}
            </Boton>
          </form>
        )}
      </div>
    </div>
  )
}
