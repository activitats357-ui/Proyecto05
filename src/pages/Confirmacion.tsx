import { Check, MessageCircle, SearchX } from 'lucide-react'
import { useParams } from 'react-router-dom'
import { Aviso } from '../components/Aviso'
import { BotonEnlace, BotonLink } from '../components/Boton'
import { EtiquetaEstado, ListaDatos, useTituloPagina } from '../components/Varios'
import { CONFIG } from '../config'
import { useDatos } from '../context/contextoDatos'
import { formatearFechaHora, formatearFechaLarga } from '../lib/fechas'
import { mensajeReserva, urlWhatsApp } from '../lib/whatsapp'

export default function Confirmacion() {
  const { id = '' } = useParams()
  const { reservas } = useDatos()
  const reserva = reservas.find((r) => r.id === id)
  useTituloPagina(reserva ? 'Solicitud registrada' : 'Solicitud no encontrada')

  if (!reserva) {
    return (
      <div className="contenedor flex flex-col items-center py-28 text-center">
        <span className="grid size-14 place-items-center rounded-full bg-stone-100 text-gris">
          <SearchX size={24} aria-hidden="true" />
        </span>
        <h1 className="mt-6 font-serif text-3xl sm:text-4xl">No encontramos esta solicitud</h1>
        <p className="mt-4 max-w-md leading-relaxed text-gris">
          El código <strong className="font-medium text-tinta">{id}</strong> no corresponde a ninguna solicitud guardada en
          este navegador. Puede que se haya registrado desde otro dispositivo o que el enlace no sea correcto.
        </p>
        <BotonLink to="/reservar" variante="acento" className="mt-8">
          Hacer una reserva
        </BotonLink>
      </div>
    )
  }

  const whatsapp = urlWhatsApp(mensajeReserva(reserva))

  return (
    <div className="contenedor max-w-3xl py-16 sm:py-24">
      <div className="text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-full bg-arena text-tinta animate-aparecer">
          <Check size={26} strokeWidth={2.5} aria-hidden="true" />
        </span>
        <h1 className="mt-7 font-serif text-4xl leading-tight text-balance sm:text-5xl">¡Tu solicitud quedó registrada!</h1>
        <p className="mx-auto mt-5 max-w-xl leading-relaxed text-gris">
          Gracias por contactar a Leandro Báez Fotógrafo. Estos son los datos de tu solicitud. Podés preparar un mensaje de
          WhatsApp para continuar la coordinación.
        </p>
      </div>

      <div className="mt-12 rounded-sm border border-borde bg-tarjeta">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-borde px-5 py-5 sm:px-7">
          <div>
            <p className="text-[13px] text-gris">Código de solicitud</p>
            <p className="mt-0.5 font-mono text-lg tracking-wider">{reserva.id}</p>
          </div>
          <EtiquetaEstado estado={reserva.estado} />
        </div>
        <ListaDatos
          className="px-5 sm:px-7"
          items={[
            { etiqueta: 'Nombre y apellido', valor: reserva.nombre },
            { etiqueta: 'Celular', valor: reserva.celular },
            { etiqueta: 'Correo electrónico', valor: reserva.email },
            { etiqueta: 'Servicio', valor: reserva.servicioNombre },
            { etiqueta: 'Fecha solicitada', valor: formatearFechaLarga(reserva.fecha) },
            { etiqueta: 'Comentarios', valor: reserva.notas || <span className="text-gris">Sin comentarios adicionales</span> },
            { etiqueta: 'Registrada', valor: formatearFechaHora(reserva.creadaEn) },
          ]}
        />
      </div>

      <p className="mt-5 text-[13px] leading-relaxed text-gris">
        La solicitud quedó guardada en este navegador y todavía no es una confirmación definitiva. Para avanzar, enviá el
        mensaje por WhatsApp y coordinamos los detalles.
      </p>

      {!whatsapp ? (
        <Aviso tipo="advertencia" className="mt-6" titulo="WhatsApp no configurado">
          Todavía no se cargó un número de WhatsApp. El administrador debe configurarlo en <code>src/config.ts</code>.
        </Aviso>
      ) : (
        CONFIG.whatsapp.esMuestra && (
          <Aviso tipo="advertencia" className="mt-6" titulo="Número de WhatsApp de muestra">
            El botón usa un número de demostración. Configurá el número real en <code>src/config.ts</code> antes de publicar.
          </Aviso>
        )
      )}

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        {whatsapp ? (
          <BotonEnlace href={whatsapp} target="_blank" rel="noopener noreferrer" variante="acento" tamano="lg">
            <MessageCircle size={18} aria-hidden="true" />
            Preparar mensaje por WhatsApp
          </BotonEnlace>
        ) : (
          <BotonEnlace aria-disabled="true" variante="acento" tamano="lg">
            <MessageCircle size={18} aria-hidden="true" />
            Preparar mensaje por WhatsApp
          </BotonEnlace>
        )}
        <BotonLink to="/" variante="contorno" tamano="lg">
          Volver al inicio
        </BotonLink>
      </div>
    </div>
  )
}
