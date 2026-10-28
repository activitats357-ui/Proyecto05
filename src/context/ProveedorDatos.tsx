import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { PREFIJO } from '../lib/almacenamiento'
import { hoyISO } from '../lib/fechas'
import * as catalogo from '../services/catalogo'
import * as servicio from '../services/reservas'
import { ContextoDatos, type ValorDatos } from './contextoDatos'

function leerTodo() {
  // El horario va primero: fija la jornada que usan las demás lecturas y cálculos.
  const horario = catalogo.leerHorario()
  const lecturas = {
    reservas: servicio.leerReservas(),
    bloqueos: servicio.leerBloqueos(),
    servicios: catalogo.leerServicios(),
    etiquetas: catalogo.leerEtiquetas(),
    galeria: catalogo.leerGaleria(),
  }
  return {
    reservas: lecturas.reservas.datos,
    bloqueos: lecturas.bloqueos.datos,
    servicios: lecturas.servicios.datos,
    etiquetas: lecturas.etiquetas.datos,
    galeria: lecturas.galeria.datos,
    horario: horario.dato,
    hoy: hoyISO(),
    avisos: [horario.aviso, ...Object.values(lecturas).map((l) => l.aviso)].filter((a): a is string => Boolean(a)),
  }
}

/**
 * Mantiene en estado de React lo guardado en localStorage. Después de cada
 * escritura se vuelve a leer, así toda la interfaz se actualiza al instante.
 * El evento "storage" solo cubre los cambios hechos desde otras pestañas.
 */
export function ProveedorDatos({ children, avisoInicial }: { children: ReactNode; avisoInicial?: string }) {
  const [datos, setDatos] = useState(leerTodo)
  const [avisos, setAvisos] = useState<string[]>(() => [
    ...(avisoInicial ? [avisoInicial] : []),
    ...datos.avisos,
  ])

  const refrescar = useCallback(() => {
    const nuevos = leerTodo()
    setDatos(nuevos)
    if (nuevos.avisos.length > 0) {
      setAvisos((previos) => [...new Set([...previos, ...nuevos.avisos])])
    }
  }, [])

  useEffect(() => {
    const alCambiarStorage = (e: StorageEvent) => {
      if (e.key === null || e.key.startsWith(PREFIJO)) refrescar()
    }
    const alVolver = () => {
      if (document.visibilityState === 'visible') refrescar()
    }
    window.addEventListener('storage', alCambiarStorage)
    document.addEventListener('visibilitychange', alVolver)
    return () => {
      window.removeEventListener('storage', alCambiarStorage)
      document.removeEventListener('visibilitychange', alVolver)
    }
  }, [refrescar])

  const valor = useMemo<ValorDatos>(() => {
    const conRefresco =
      <A extends unknown[], R>(op: (...args: A) => R) =>
      (...args: A): R => {
        try {
          return op(...args)
        } finally {
          refrescar()
        }
      }
    return {
      ...datos,
      avisos,
      descartarAvisos: () => setAvisos([]),
      buscarServicio: (id) => datos.servicios.find((s) => s.id === id),
      estadoDeFecha: (fecha, duracionHoras) => servicio.estadoDeFecha(fecha, datos.reservas, datos.bloqueos, duracionHoras),
      horariosDisponibles: (fecha, duracionHoras) =>
        servicio.horariosDisponibles(fecha, duracionHoras, datos.reservas, datos.bloqueos),
      crearReserva: conRefresco(servicio.crearReserva),
      cambiarEstado: conRefresco(servicio.cambiarEstadoReserva),
      bloquear: conRefresco(servicio.bloquear),
      eliminarBloqueo: conRefresco(servicio.eliminarBloqueo),
      eliminarDatosDemo: conRefresco(servicio.eliminarDatosDemo),
      actualizarServicio: conRefresco(catalogo.actualizarServicio),
      actualizarHorario: conRefresco(catalogo.actualizarHorario),
      crearEtiqueta: conRefresco(catalogo.crearEtiqueta),
      renombrarEtiqueta: conRefresco(catalogo.renombrarEtiqueta),
      eliminarEtiqueta: conRefresco(catalogo.eliminarEtiqueta),
      agregarFoto: conRefresco(catalogo.agregarFoto),
      actualizarFoto: conRefresco(catalogo.actualizarFoto),
      eliminarFoto: conRefresco(catalogo.eliminarFoto),
      moverFoto: conRefresco(catalogo.moverFoto),
    }
  }, [datos, avisos, refrescar])

  return <ContextoDatos.Provider value={valor}>{children}</ContextoDatos.Provider>
}
