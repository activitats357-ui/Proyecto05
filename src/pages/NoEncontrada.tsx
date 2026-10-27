import { BotonLink } from '../components/Boton'
import { useTituloPagina } from '../components/Varios'

export default function NoEncontrada() {
  useTituloPagina('Página no encontrada')
  return (
    <div className="contenedor flex flex-col items-center py-32 text-center">
      <p className="font-serif text-7xl text-arena italic">404</p>
      <h1 className="mt-6 font-serif text-3xl sm:text-4xl">Esta página no existe</h1>
      <p className="mt-4 max-w-md text-gris">Puede que el enlace esté mal escrito o que la página se haya movido.</p>
      <BotonLink to="/" className="mt-8">
        Volver al inicio
      </BotonLink>
    </div>
  )
}
