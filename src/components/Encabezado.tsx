import { Menu, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { cx } from '../lib/cx'
import { BotonLink } from './Boton'

export const ENLACES_NAV = [
  { a: '/', texto: 'Inicio' },
  { a: '/#servicios', texto: 'Servicios' },
  { a: '/reservar', texto: 'Reservar' },
  { a: '/contacto', texto: 'Contacto' },
]

function useEsActivo() {
  const { pathname, hash } = useLocation()
  return (destino: string) => {
    const [ruta, ancla] = destino.split('#')
    if (ancla) return pathname === ruta && hash === `#${ancla}`
    if (ruta === '/') return pathname === '/' && !hash
    return pathname.startsWith(ruta)
  }
}

export function Logotipo({ claro }: { claro?: boolean }) {
  return (
    <Link to="/" className="group flex flex-col leading-none" aria-label="Leandro Báez Fotografía, ir al inicio">
      <span className={cx('font-serif text-[1.35rem] tracking-tight whitespace-nowrap', claro ? 'text-white' : 'text-tinta')}>Leandro Báez</span>
      <span className={cx('mt-1.5 text-[10px] tracking-[0.42em] uppercase', claro ? 'text-white/70' : 'text-gris')}>Fotografía</span>
    </Link>
  )
}

export function Encabezado() {
  const [abierto, setAbierto] = useState(false)
  const esActivo = useEsActivo()
  const location = useLocation()
  const botonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => setAbierto(false), [location.key])

  useEffect(() => {
    if (!abierto) return
    menuRef.current?.querySelector<HTMLAnchorElement>('a')?.focus()
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setAbierto(false)
        botonRef.current?.focus()
      }
    }
    document.addEventListener('keydown', alTeclear)
    return () => document.removeEventListener('keydown', alTeclear)
  }, [abierto])

  return (
    <header className="sticky top-0 z-40 border-b border-borde/80 bg-fondo/90 backdrop-blur-md">
      <div className="contenedor flex h-[72px] items-center justify-between gap-6">
        <Logotipo />

        <nav aria-label="Principal" className="hidden md:block">
          <ul className="flex items-center gap-8">
            {ENLACES_NAV.map((e) => (
              <li key={e.a}>
                <Link
                  to={e.a}
                  aria-current={esActivo(e.a) ? 'page' : undefined}
                  className={cx(
                    'relative py-2 text-sm transition-colors after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:origin-left after:bg-arena after:transition-transform after:duration-300',
                    esActivo(e.a) ? 'text-tinta after:scale-x-100' : 'text-gris after:scale-x-0 hover:text-tinta hover:after:scale-x-100',
                  )}
                >
                  {e.texto}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden sm:block">
            <BotonLink to="/reservar" variante="acento" tamano="sm">
              Reservar una fecha
            </BotonLink>
          </div>
          <button
            ref={botonRef}
            type="button"
            className="grid size-11 place-items-center rounded-sm text-tinta hover:bg-stone-100 md:hidden"
            aria-expanded={abierto}
            aria-controls="menu-movil"
            aria-label={abierto ? 'Cerrar menú' : 'Abrir menú'}
            onClick={() => setAbierto((v) => !v)}
          >
            {abierto ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
          </button>
        </div>
      </div>

      <div
        id="menu-movil"
        ref={menuRef}
        hidden={!abierto}
        className="border-t border-borde bg-fondo md:hidden"
      >
        <nav aria-label="Menú móvil" className="contenedor py-4">
          <ul className="flex flex-col">
            {ENLACES_NAV.map((e) => (
              <li key={e.a}>
                <Link
                  to={e.a}
                  onClick={() => setAbierto(false)}
                  aria-current={esActivo(e.a) ? 'page' : undefined}
                  className={cx(
                    'flex items-center justify-between border-b border-borde/70 py-4 font-serif text-xl',
                    esActivo(e.a) ? 'text-tinta' : 'text-stone-600',
                  )}
                >
                  {e.texto}
                  {esActivo(e.a) && <span className="size-1.5 rounded-full bg-arena" aria-hidden="true" />}
                </Link>
              </li>
            ))}
          </ul>
          <BotonLink to="/reservar" variante="acento" className="mt-6 w-full" onClick={() => setAbierto(false)}>
            Reservar una fecha
          </BotonLink>
        </nav>
      </div>
    </header>
  )
}
