import { KeyRound, LoaderCircle, Mail, Save } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Boton } from '../../components/Boton'
import { Campo } from '../../components/Campo'
import { CampoClave } from '../../components/CampoClave'
import { formatearFechaHora } from '../../lib/fechas'
import { cambiarClave, cambiarEmail, ErrorCuenta, leerCuenta, MIN_LARGO_CLAVE, validarEmail, validarNuevaClave } from '../../services/cuenta'
import type { Mensaje } from './PanelAdmin'

export function PerfilAdmin({ onMensaje }: { onMensaje: (m: Mensaje | null) => void }) {
  const [cuenta, setCuenta] = useState(leerCuenta)
  const refrescar = () => setCuenta(leerCuenta())

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h2 className="font-serif text-2xl">Perfil de administración</h2>
        <p className="mt-1 text-sm text-gris">
          Correo de la cuenta: <strong className="font-medium text-tinta">{cuenta.email}</strong>
          {cuenta.actualizadaEn ? ` · Último cambio: ${formatearFechaHora(cuenta.actualizadaEn)}` : ' · Datos iniciales'}
        </p>
      </div>
      <FormularioEmail emailActual={cuenta.email} onMensaje={onMensaje} onGuardado={refrescar} />
      <FormularioClave onMensaje={onMensaje} onGuardado={refrescar} />
    </div>
  )
}

type Errores = Partial<Record<'actual' | 'nueva' | 'confirmacion' | 'email', string>>

function FormularioEmail({
  emailActual,
  onMensaje,
  onGuardado,
}: {
  emailActual: string
  onMensaje: (m: Mensaje | null) => void
  onGuardado: () => void
}) {
  const [email, setEmail] = useState('')
  const [clave, setClave] = useState('')
  const [errores, setErrores] = useState<Errores>({})
  const [guardando, setGuardando] = useState(false)

  async function guardar(e: FormEvent) {
    e.preventDefault()
    const nuevos: Errores = {
      email: validarEmail(email) ?? undefined,
      actual: clave ? undefined : 'Confirmá con tu contraseña actual.',
    }
    setErrores(nuevos)
    if (nuevos.email || nuevos.actual) return
    setGuardando(true)
    try {
      const guardado = await cambiarEmail(clave, email)
      onMensaje({ tipo: 'exito', texto: `Correo de la cuenta actualizado a ${guardado}.` })
      setEmail('')
      setClave('')
      onGuardado()
    } catch (err) {
      if (err instanceof ErrorCuenta && err.campo) setErrores({ [err.campo]: err.message })
      else onMensaje({ tipo: 'error', texto: err instanceof Error ? err.message : 'No se pudo cambiar el correo.' })
    } finally {
      setGuardando(false)
    }
  }

  return (
    <section aria-labelledby="titulo-perfil-email" className="rounded-sm border border-borde bg-tarjeta p-6">
      <h3 id="titulo-perfil-email" className="flex items-center gap-2 font-serif text-xl">
        <Mail size={18} className="text-arena-texto" aria-hidden="true" /> Correo de la cuenta
      </h3>
      <p className="mt-1 text-sm text-gris">
        A este correo llega el enlace para restablecer la contraseña. Actual: {emailActual}
      </p>
      <form onSubmit={guardar} noValidate className="mt-5 grid gap-5 sm:grid-cols-2">
        <Campo id="perfil-email" etiqueta="Nuevo correo" obligatorio error={errores.email}>
          {(p) => (
            <input
              {...p}
              type="email"
              inputMode="email"
              autoComplete="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                setErrores((x) => ({ ...x, email: undefined }))
              }}
              className="control"
            />
          )}
        </Campo>
        <CampoClave
          id="perfil-email-clave"
          etiqueta="Contraseña actual"
          valor={clave}
          onCambiar={(v) => {
            setClave(v)
            setErrores((x) => ({ ...x, actual: undefined }))
          }}
          error={errores.actual}
          autoComplete="current-password"
        />
        <div className="sm:col-span-2 sm:flex sm:justify-end">
          <Boton type="submit" disabled={guardando} aria-busy={guardando} className="w-full sm:w-auto">
            {guardando ? <LoaderCircle size={15} className="animate-spin" aria-hidden="true" /> : <Save size={15} aria-hidden="true" />}
            Guardar correo
          </Boton>
        </div>
      </form>
    </section>
  )
}

function FormularioClave({ onMensaje, onGuardado }: { onMensaje: (m: Mensaje | null) => void; onGuardado: () => void }) {
  const [actual, setActual] = useState('')
  const [nueva, setNueva] = useState('')
  const [confirmacion, setConfirmacion] = useState('')
  const [errores, setErrores] = useState<Errores>({})
  const [guardando, setGuardando] = useState(false)

  async function guardar(e: FormEvent) {
    e.preventDefault()
    const nuevos: Errores = {
      actual: actual ? undefined : 'Escribí tu contraseña actual.',
      ...validarNuevaClave(nueva, confirmacion),
    }
    setErrores(nuevos)
    if (nuevos.actual || nuevos.nueva || nuevos.confirmacion) return
    setGuardando(true)
    try {
      await cambiarClave(actual, nueva, confirmacion)
      onMensaje({ tipo: 'exito', texto: 'Contraseña actualizada. La vas a necesitar la próxima vez que ingreses.' })
      setActual('')
      setNueva('')
      setConfirmacion('')
      onGuardado()
    } catch (err) {
      if (err instanceof ErrorCuenta && err.campo) setErrores({ [err.campo]: err.message })
      else onMensaje({ tipo: 'error', texto: err instanceof Error ? err.message : 'No se pudo cambiar la contraseña.' })
    } finally {
      setGuardando(false)
    }
  }

  const limpiar = (campo: keyof Errores) => setErrores((x) => ({ ...x, [campo]: undefined }))

  return (
    <section aria-labelledby="titulo-perfil-clave" className="rounded-sm border border-borde bg-tarjeta p-6">
      <h3 id="titulo-perfil-clave" className="flex items-center gap-2 font-serif text-xl">
        <KeyRound size={18} className="text-arena-texto" aria-hidden="true" /> Cambiar contraseña
      </h3>
      <form onSubmit={guardar} noValidate className="mt-5 grid gap-5 sm:grid-cols-2">
        <CampoClave
          id="perfil-clave-actual"
          etiqueta="Contraseña actual"
          valor={actual}
          onCambiar={(v) => {
            setActual(v)
            limpiar('actual')
          }}
          error={errores.actual}
          autoComplete="current-password"
        />
        <div className="hidden sm:block" aria-hidden="true" />
        <CampoClave
          id="perfil-clave-nueva"
          etiqueta="Nueva contraseña"
          valor={nueva}
          onCambiar={(v) => {
            setNueva(v)
            limpiar('nueva')
          }}
          error={errores.nueva}
          ayuda={`Al menos ${MIN_LARGO_CLAVE} caracteres, con letras y números.`}
          autoComplete="new-password"
        />
        <CampoClave
          id="perfil-clave-confirmacion"
          etiqueta="Repetí la nueva contraseña"
          valor={confirmacion}
          onCambiar={(v) => {
            setConfirmacion(v)
            limpiar('confirmacion')
          }}
          error={errores.confirmacion}
          autoComplete="new-password"
        />
        <div className="sm:col-span-2 sm:flex sm:justify-end">
          <Boton type="submit" disabled={guardando} aria-busy={guardando} className="w-full sm:w-auto">
            {guardando ? <LoaderCircle size={15} className="animate-spin" aria-hidden="true" /> : <Save size={15} aria-hidden="true" />}
            Guardar contraseña
          </Boton>
        </div>
      </form>
    </section>
  )
}
