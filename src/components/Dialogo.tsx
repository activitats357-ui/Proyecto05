import { useEffect, useRef, type ReactNode } from 'react'
import { cx } from '../lib/cx'
import { Boton } from './Boton'

interface PropsDialogo {
  abierto: boolean
  onCerrar: () => void
  etiqueta: string
  className?: string
  children: ReactNode
}

/** Diálogo modal nativo: gestiona foco, Escape y fondo de forma accesible. */
export function Dialogo({ abierto, onCerrar, etiqueta, className, children }: PropsDialogo) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialogo = ref.current
    if (!dialogo) return
    if (abierto && !dialogo.open) dialogo.showModal()
    if (!abierto && dialogo.open) dialogo.close()
  }, [abierto])

  return (
    <dialog
      ref={ref}
      aria-label={etiqueta}
      onCancel={(e) => {
        e.preventDefault()
        onCerrar()
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onCerrar()
      }}
      className={cx(
        'm-auto max-h-[90svh] w-[calc(100%-2rem)] rounded-sm p-0 text-tinta',
        className ?? 'bg-tarjeta shadow-xl backdrop:bg-tinta/50',
      )}
    >
      {abierto && children}
    </dialog>
  )
}

interface PropsConfirmacion {
  abierto: boolean
  titulo: string
  descripcion: ReactNode
  textoConfirmar: string
  textoCancelar?: string
  peligro?: boolean
  onConfirmar: () => void
  onCancelar: () => void
}

export function DialogoConfirmacion({
  abierto,
  titulo,
  descripcion,
  textoConfirmar,
  textoCancelar = 'Volver',
  peligro,
  onConfirmar,
  onCancelar,
}: PropsConfirmacion) {
  return (
    <Dialogo abierto={abierto} onCerrar={onCancelar} etiqueta={titulo} className="max-w-md bg-tarjeta shadow-xl backdrop:bg-tinta/50">
      <div className="p-6 sm:p-7">
        <h2 className="font-serif text-2xl">{titulo}</h2>
        <div className="mt-3 text-sm leading-relaxed text-gris">{descripcion}</div>
        <div className="mt-7 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Boton variante="suave" onClick={onCancelar} autoFocus>
            {textoCancelar}
          </Boton>
          <Boton variante={peligro ? 'peligro' : 'oscuro'} onClick={onConfirmar}>
            {textoConfirmar}
          </Boton>
        </div>
      </div>
    </Dialogo>
  )
}
