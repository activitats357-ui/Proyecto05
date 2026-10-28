import { Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import { Campo } from './Campo'

interface Props {
  id: string
  etiqueta: string
  valor: string
  onCambiar: (valor: string) => void
  error?: string
  ayuda?: string
  autoComplete: 'current-password' | 'new-password'
  autoFocus?: boolean
}

/** Campo de contraseña con botón para mostrarla u ocultarla. */
export function CampoClave({ id, etiqueta, valor, onCambiar, error, ayuda, autoComplete, autoFocus }: Props) {
  const [visible, setVisible] = useState(false)
  return (
    <Campo id={id} etiqueta={etiqueta} obligatorio error={error} ayuda={ayuda}>
      {(p) => (
        <div className="relative">
          <input
            {...p}
            type={visible ? 'text' : 'password'}
            autoComplete={autoComplete}
            value={valor}
            onChange={(e) => onCambiar(e.target.value)}
            className="control pr-12"
            autoFocus={autoFocus}
          />
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            className="absolute top-1/2 right-1 mt-1 grid size-9 -translate-y-1/2 place-items-center rounded-sm text-gris hover:text-tinta"
            aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            aria-pressed={visible}
          >
            {visible ? <EyeOff size={17} aria-hidden="true" /> : <Eye size={17} aria-hidden="true" />}
          </button>
        </div>
      )}
    </Campo>
  )
}
