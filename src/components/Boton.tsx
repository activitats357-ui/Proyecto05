import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from 'react'
import { Link, type LinkProps } from 'react-router-dom'
import { cx } from '../lib/cx'

type Variante = 'acento' | 'oscuro' | 'contorno' | 'contornoClaro' | 'suave' | 'peligro'
type Tamano = 'sm' | 'md' | 'lg'

interface Estilo {
  variante?: Variante
  tamano?: Tamano
}

const VARIANTES: Record<Variante, string> = {
  acento: 'bg-arena text-tinta hover:bg-arena-hover',
  oscuro: 'bg-tinta text-white hover:bg-stone-800',
  contorno: 'border border-tinta/70 text-tinta hover:bg-tinta hover:text-white',
  contornoClaro: 'border border-white/70 text-white hover:bg-white hover:text-tinta',
  suave: 'border border-borde bg-tarjeta text-tinta hover:border-stone-400',
  peligro: 'bg-ocupada text-white hover:bg-[#742f25]',
}

const TAMANOS: Record<Tamano, string> = {
  sm: 'h-9 px-4 text-[13px]',
  md: 'h-11 px-6 text-sm',
  lg: 'h-12 px-7 text-[15px]',
}

export function estilosBoton({ variante = 'oscuro', tamano = 'md' }: Estilo = {}, extra?: string): string {
  return cx(
    'inline-flex shrink-0 items-center justify-center gap-2 rounded-sm font-medium tracking-wide whitespace-nowrap transition-[background-color,color,border-color,filter] duration-200 select-none disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50',
    VARIANTES[variante],
    TAMANOS[tamano],
    extra,
  )
}

export function Boton({ variante, tamano, className, type = 'button', ...props }: Estilo & ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type={type} className={estilosBoton({ variante, tamano }, className)} {...props} />
}

export function BotonLink({ variante, tamano, className, ...props }: Estilo & LinkProps) {
  return <Link className={estilosBoton({ variante, tamano }, className)} {...props} />
}

export function BotonEnlace({ variante, tamano, className, ...props }: Estilo & AnchorHTMLAttributes<HTMLAnchorElement>) {
  return <a className={estilosBoton({ variante, tamano }, className)} {...props} />
}
