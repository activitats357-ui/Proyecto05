import { useEffect, useRef, type ReactNode, type SVGProps } from 'react'
import { cx } from '../lib/cx'
import { ETIQUETA_ESTADO, type EstadoReserva } from '../types'

export function useTituloPagina(titulo: string) {
  useEffect(() => {
    document.title = titulo ? `${titulo} · Leandro Báez Fotografía` : 'Leandro Báez · Fotografía'
  }, [titulo])
}

/** Aparición suave cuando el bloque entra en pantalla. */
export function Revelar({ children, className, retraso = 0 }: { children: ReactNode; className?: string; retraso?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (!('IntersectionObserver' in window)) {
      el.classList.add('visible')
      return
    }
    const obs = new IntersectionObserver(
      ([entrada]) => {
        if (entrada.isIntersecting) {
          el.classList.add('visible')
          obs.disconnect()
        }
      },
      { rootMargin: '0px 0px -8% 0px' },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return (
    <div ref={ref} className={cx('revelar', className)} style={retraso ? { transitionDelay: `${retraso}ms` } : undefined}>
      {children}
    </div>
  )
}

export function EncabezadoSeccion({
  antetitulo,
  titulo,
  children,
  className,
  centrado,
}: {
  antetitulo?: string
  titulo: ReactNode
  children?: ReactNode
  className?: string
  centrado?: boolean
}) {
  return (
    <div className={cx('max-w-2xl', centrado && 'mx-auto text-center', className)}>
      {antetitulo && <p className="antetitulo">{antetitulo}</p>}
      <h2 className="mt-4 font-serif text-3xl leading-tight text-balance sm:text-4xl md:text-[2.75rem]">{titulo}</h2>
      {children && <div className="mt-5 text-[15px] leading-relaxed text-gris sm:text-base">{children}</div>}
    </div>
  )
}

const ESTILO_ESTADO: Record<EstadoReserva, string> = {
  pendiente: 'bg-arena-claro text-arena-texto',
  confirmada: 'bg-exito-fondo text-exito',
  cancelada: 'bg-stone-100 text-stone-500',
}

export function EtiquetaEstado({ estado, className }: { estado: EstadoReserva; className?: string }) {
  return (
    <span className={cx('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium', ESTILO_ESTADO[estado], className)}>
      <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
      {ETIQUETA_ESTADO[estado]}
    </span>
  )
}

/** Icono genérico de Instagram (lucide ya no incluye logos de marcas). */
export function IconoInstagram({ size = 18, ...props }: SVGProps<SVGSVGElement> & { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" aria-hidden="true" {...props}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" />
    </svg>
  )
}

/** Lista de pares etiqueta/valor para resúmenes. */
export function ListaDatos({ items, className }: { items: { etiqueta: string; valor: ReactNode }[]; className?: string }) {
  return (
    <dl className={cx('divide-y divide-borde', className)}>
      {items.map((it) => (
        <div key={it.etiqueta} className="grid gap-1 py-3.5 sm:grid-cols-[11rem_1fr] sm:gap-4">
          <dt className="text-[13px] text-gris">{it.etiqueta}</dt>
          <dd className="text-[15px] break-words text-tinta">{it.valor}</dd>
        </div>
      ))}
    </dl>
  )
}
