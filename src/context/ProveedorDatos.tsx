import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { PREFIJO } from '../lib/almacenamiento'
import { hoyISO } from '../lib/fechas'
import * as servicio from '../services/reservas'
import { ContextoDatos, type ValorDatos } from './contextoDatos'

function leerTodo() {
  const reservas = servicio.leerReservas()
  const bloqueos = servicio.leerBloqueos()
  return {
    reservas: reservas.datos,
    bloqueos: bloqueos.datos,
    hoy: hoyISO(),
    avisos: [reservas.aviso, bloqueos.aviso].filter((a): a is string => Boolean(a)),
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
      reservas: datos.reservas,
      bloqueos: datos.bloqueos,
      hoy: datos.hoy,
      avisos,
      descartarAvisos: () => setAvisos([]),
      estadoDeFecha: (fecha) => servicio.estadoDeFecha(fecha, datos.reservas, datos.bloqueos, datos.hoy),
      crearReserva: conRefresco(servicio.crearReserva),
      cambiarEstado: conRefresco(servicio.cambiarEstadoReserva),
      bloquearFecha: conRefresco(servicio.bloquearFecha),
      desbloquearFecha: conRefresco(servicio.desbloquearFecha),
      eliminarDatosDemo: conRefresco(servicio.eliminarDatosDemo),
    }
  }, [datos, avisos, refrescar])

  return <ContextoDatos.Provider value={valor}>{children}</ContextoDatos.Provider>
}
