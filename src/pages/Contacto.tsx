import { Clock, MapPin, MessageCircle, Navigation, Mail } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Aviso } from '../components/Aviso'
import { Boton } from '../components/Boton'
import { Campo } from '../components/Campo'
import { IconoInstagram, useTituloPagina } from '../components/Varios'
import { CONFIG, HAY_DATOS_DE_MUESTRA } from '../config'
import { FOTOS, srcSetFoto, urlFoto } from '../data/fotos'
import { SERVICIOS } from '../data/servicios'
import { mensajeContacto, urlWhatsApp } from '../lib/whatsapp'

export default function Contacto() {
  useTituloPagina('Contacto')
  const [nombre, setNombre] = useState('')
  const [servicio, setServicio] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [errores, setErrores] = useState<{ nombre?: string; mensaje?: string }>({})
  const [enlaceAbierto, setEnlaceAbierto] = useState<string | null>(null)
  const whatsappDirecto = urlWhatsApp('Hola Leandro, ¿cómo estás? Quería hacerte una consulta.')

  function enviar(e: FormEvent) {
    e.preventDefault()
    const nuevos = {
      nombre: nombre.trim() ? undefined : 'Contame cómo te llamás.',
      mensaje: mensaje.trim().length >= 10 ? undefined : 'Escribí tu consulta (al menos 10 caracteres).',
    }
    setErrores(nuevos)
    if (nuevos.nombre || nuevos.mensaje) {
      document.getElementById(nuevos.nombre ? 'contacto-nombre' : 'contacto-mensaje')?.focus()
      return
    }
    const url = urlWhatsApp(mensajeContacto(nombre, mensaje, servicio || undefined))
    if (!url) return
    window.open(url, '_blank', 'noopener,noreferrer')
    setEnlaceAbierto(url)
  }

  const datos = [
    { Icono: MapPin, titulo: 'Ubicación', contenido: CONFIG.ubicacion },
    { Icono: Navigation, titulo: 'Zona de cobertura', contenido: CONFIG.cobertura },
    {
      Icono: Clock,
      titulo: 'Horario de atención',
      contenido: (
        <ul>
          {CONFIG.horario.map((h) => (
            <li key={h.dias}>
              {h.dias}: {h.horas}
            </li>
          ))}
        </ul>
      ),
    },
    ...(whatsappDirecto
      ? [
          {
            Icono: MessageCircle,
            titulo: 'WhatsApp',
            contenido: (
              <a href={whatsappDirecto} target="_blank" rel="noopener noreferrer" className="underline-offset-4 hover:underline">
                Escribime por WhatsApp{CONFIG.whatsapp.esMuestra && <span className="text-gris"> (número de muestra)</span>}
              </a>
            ),
          },
        ]
      : []),
    {
      Icono: IconoInstagram,
      titulo: 'Instagram',
      contenido: (
        <a href={CONFIG.redes.instagram.url} target="_blank" rel="noopener noreferrer" className="underline-offset-4 hover:underline">
          {CONFIG.redes.instagram.usuario}
          {CONFIG.redes.instagram.esMuestra && <span className="text-gris"> (perfil de muestra)</span>}
        </a>
      ),
    },
    ...(CONFIG.email
      ? [
          {
            Icono: Mail,
            titulo: 'Correo',
            contenido: (
              <a href={`mailto:${CONFIG.email}`} className="underline-offset-4 hover:underline">
                {CONFIG.email}
              </a>
            ),
          },
        ]
      : []),
  ]

  return (
    <div className="pb-24">
      <header className="border-b border-borde bg-tarjeta">
        <div className="contenedor grid items-end gap-10 py-14 sm:py-20 md:grid-cols-2">
          <div>
            <p className="antetitulo">Contacto</p>
            <h1 className="mt-4 font-serif text-4xl leading-tight sm:text-5xl">Contame tu idea</h1>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-gris">
              ¿Tenés una fecha en mente o querés saber más sobre alguna sesión? Escribime y lo charlamos sin compromiso.
            </p>
          </div>
          <img
            src={urlFoto(FOTOS.contacto, 1080)}
            srcSet={srcSetFoto(FOTOS.contacto, 1440)}
            sizes="(min-width: 768px) 45vw, 100vw"
            alt={FOTOS.contacto.alt}
            className="hidden aspect-[16/9] w-full rounded-sm bg-stone-200 object-cover md:block"
          />
        </div>
      </header>

      <div className="contenedor mt-14 grid gap-14 lg:grid-cols-[1fr_1.15fr]">
        <section aria-labelledby="titulo-datos">
          <h2 id="titulo-datos" className="font-serif text-2xl">
            Leandro Báez Fotógrafo
          </h2>
          <ul className="mt-8 space-y-7">
            {datos.map(({ Icono, titulo, contenido }) => (
              <li key={titulo} className="flex gap-4">
                <span className="grid size-10 shrink-0 place-items-center rounded-full border border-borde bg-tarjeta text-arena-texto">
                  <Icono size={18} aria-hidden="true" />
                </span>
                <div className="text-[15px] leading-relaxed">
                  <p className="text-[13px] text-gris">{titulo}</p>
                  <div className="mt-0.5">{contenido}</div>
                </div>
              </li>
            ))}
          </ul>
          {HAY_DATOS_DE_MUESTRA && (
            <p className="mt-10 border-l-2 border-arena pl-4 text-[13px] leading-relaxed text-gris">
              Los enlaces de WhatsApp e Instagram son datos de demostración y se configuran en <code>src/config.ts</code>.
            </p>
          )}
        </section>

        <section aria-labelledby="titulo-form" className="rounded-sm border border-borde bg-tarjeta p-6 sm:p-8">
          <h2 id="titulo-form" className="font-serif text-2xl">
            Escribime
          </h2>
          <p className="mt-2 text-sm text-gris">Al enviar, se abre WhatsApp con tu mensaje listo. No se envía nada automáticamente.</p>
          <form onSubmit={enviar} noValidate className="mt-7 space-y-6">
            <Campo id="contacto-nombre" etiqueta="Tu nombre" obligatorio error={errores.nombre}>
              {(p) => (
                <input {...p} type="text" autoComplete="name" maxLength={80} value={nombre} onChange={(e) => setNombre(e.target.value)} className="control" />
              )}
            </Campo>
            <Campo id="contacto-servicio" etiqueta="¿Qué tipo de sesión te interesa?">
              {(p) => (
                <select {...p} value={servicio} onChange={(e) => setServicio(e.target.value)} className="control">
                  <option value="">Todavía no sé</option>
                  {SERVICIOS.map((s) => (
                    <option key={s.id} value={s.nombre}>
                      {s.nombre}
                    </option>
                  ))}
                </select>
              )}
            </Campo>
            <Campo id="contacto-mensaje" etiqueta="Tu mensaje" obligatorio error={errores.mensaje}>
              {(p) => (
                <textarea
                  {...p}
                  rows={5}
                  maxLength={1000}
                  value={mensaje}
                  onChange={(e) => setMensaje(e.target.value)}
                  className="control resize-y"
                  placeholder="Contame la fecha aproximada, el lugar y qué te gustaría fotografiar."
                />
              )}
            </Campo>
            {whatsappDirecto ? (
              <Boton type="submit" variante="acento" className="w-full sm:w-auto">
                <MessageCircle size={17} aria-hidden="true" />
                Escribime por WhatsApp
              </Boton>
            ) : (
              <Aviso tipo="advertencia">El número de WhatsApp todavía no está configurado (src/config.ts).</Aviso>
            )}
            {enlaceAbierto && (
              <Aviso tipo="exito">
                Abrimos WhatsApp con tu mensaje en una pestaña nueva. Si no se abrió,{' '}
                <a href={enlaceAbierto} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
                  tocá acá
                </a>
                .
              </Aviso>
            )}
          </form>
        </section>
      </div>
    </div>
  )
}
