import { CircleAlert, CircleCheck, Info, TriangleAlert, X } from 'lucide-react'
import type { ReactNode } from 'react'
import { cx } from '../lib/cx'

type Tipo = 'info' | 'exito' | 'advertencia' | 'error'

const ESTILOS: Record<Tipo, { clase: string; Icono: typeof Info }> = {
  info: { clase: 'border-borde bg-tarjeta text-tinta', Icono: Info },
  exito: { clase: 'border-exito/20 bg-exito-fondo text-exito', Icono: CircleCheck },
  advertencia: { clase: 'border-arena/40 bg-arena-claro text-arena-texto', Icono: TriangleAlert },
  error: { clase: 'border-ocupada/20 bg-ocupada-fondo text-ocupada', Icono: CircleAlert },
}

interface Props {
  tipo?: Tipo
  titulo?: string
  children?: ReactNode
  className?: string
  onCerrar?: () => void
}

export function Aviso({ tipo = 'info', titulo, children, className, onCerrar }: Props) {
  const { clase, Icono } = ESTILOS[tipo]
  return (
    <div
      role={tipo === 'error' ? 'alert' : 'status'}
      className={cx('flex items-start gap-3 rounded-sm border px-4 py-3 text-sm animate-aparecer', clase, className)}
    >
      <Icono size={18} className="mt-px shrink-0" aria-hidden="true" />
      <div className="min-w-0 flex-1 leading-relaxed">
        {titulo && <p className="font-medium">{titulo}</p>}
        {children && <div className={cx(titulo && 'mt-0.5', 'opacity-90')}>{children}</div>}
      </div>
      {onCerrar && (
        <button type="button" onClick={onCerrar} className="-m-1 rounded-sm p-1 opacity-70 hover:opacity-100" aria-label="Cerrar aviso">
          <X size={16} aria-hidden="true" />
        </button>
      )}
    </div>
  )
}
