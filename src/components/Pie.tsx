import { MapPin, MessageCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { CONFIG } from '../config'
import { urlWhatsApp } from '../lib/whatsapp'
import { ENLACES_NAV } from './Encabezado'
import { IconoInstagram } from './Varios'

export function Pie() {
  const whatsapp = urlWhatsApp('Hola Leandro, ¿cómo estás? Quería hacerte una consulta.')
  const anio = new Date().getFullYear()

  return (
    <footer className="mt-auto border-t border-borde bg-tarjeta">
      <div className="contenedor grid gap-12 py-14 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <p className="font-serif text-2xl">Leandro Báez</p>
          <p className="mt-1.5 text-[10px] tracking-[0.42em] text-gris uppercase">Fotografía</p>
          <p className="mt-6 flex items-center gap-2 text-sm text-gris">
            <MapPin size={15} aria-hidden="true" />
            {CONFIG.ubicacion}
          </p>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-gris">
            Bodas, retratos y momentos especiales en Encarnación y alrededores.
          </p>
        </div>

        <nav aria-label="Pie de página">
          <p className="antetitulo">Navegación</p>
          <ul className="mt-5 space-y-3 text-sm">
            {ENLACES_NAV.map((e) => (
              <li key={e.a}>
                <Link to={e.a} className="text-stone-600 hover:text-tinta">
                  {e.texto}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <p className="antetitulo">Redes</p>
          <ul className="mt-5 space-y-3 text-sm">
            <li>
              <a href={CONFIG.redes.instagram.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-stone-600 hover:text-tinta">
                <IconoInstagram size={16} />
                Instagram
                {CONFIG.redes.instagram.esMuestra && <span className="text-xs text-stone-400">(muestra)</span>}
              </a>
            </li>
            {whatsapp && (
              <li>
                <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-stone-600 hover:text-tinta">
                  <MessageCircle size={16} aria-hidden="true" />
                  WhatsApp
                  {CONFIG.whatsapp.esMuestra && <span className="text-xs text-stone-400">(muestra)</span>}
                </a>
              </li>
            )}
          </ul>
        </div>

        <div>
          <p className="antetitulo">Información</p>
          <ul className="mt-5 space-y-3 text-sm">
            <li>
              <Link to="/politicas" className="text-stone-600 hover:text-tinta">
                Políticas y condiciones
              </Link>
            </li>
            <li>
              <Link to="/admin" className="text-stone-600 hover:text-tinta">
                Acceso administración
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-borde">
        <div className="contenedor flex flex-col gap-2 py-6 text-xs text-gris sm:flex-row sm:justify-between">
          <p>© {anio} {CONFIG.marca}. Todos los derechos reservados.</p>
          <p>Encarnación · Itapúa · Paraguay</p>
        </div>
      </div>
    </footer>
  )
}
