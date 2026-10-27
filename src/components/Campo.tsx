import { CircleAlert } from 'lucide-react'
import type { ReactNode } from 'react'
import { cx } from '../lib/cx'

export interface PropsControl {
  id: string
  'aria-invalid': boolean
  'aria-describedby'?: string
  'aria-required'?: boolean
}

interface Props {
  id: string
  etiqueta: string
  error?: string
  ayuda?: ReactNode
  obligatorio?: boolean
  className?: string
  children: (control: PropsControl) => ReactNode
}

/** Etiqueta visible, ayuda y mensaje de error enlazados al control por aria-describedby. */
export function Campo({ id, etiqueta, error, ayuda, obligatorio, className, children }: Props) {
  const idAyuda = ayuda ? `${id}-ayuda` : undefined
  const idError = error ? `${id}-error` : undefined
  const describedBy = [idAyuda, idError].filter(Boolean).join(' ') || undefined

  return (
    <div className={className}>
      <label htmlFor={id} className="block text-sm font-medium text-tinta">
        {etiqueta}
        {obligatorio ? (
          <span className="ml-0.5 text-arena-texto" aria-hidden="true">
            *
          </span>
        ) : (
          <span className="ml-1 font-normal text-gris">(opcional)</span>
        )}
      </label>
      {ayuda && (
        <p id={idAyuda} className="mt-1 text-[13px] text-gris">
          {ayuda}
        </p>
      )}
      {children({ id, 'aria-invalid': Boolean(error), 'aria-describedby': describedBy, 'aria-required': obligatorio || undefined })}
      {error && (
        <p id={idError} className={cx('mt-1.5 flex items-start gap-1.5 text-[13px] text-ocupada', 'animate-aparecer')}>
          <CircleAlert size={15} className="mt-px shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  )
}
