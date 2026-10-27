import { Route, Routes } from 'react-router-dom'
import { Plantilla } from './components/Plantilla'
import Admin from './pages/admin/Admin'
import Confirmacion from './pages/Confirmacion'
import Contacto from './pages/Contacto'
import Inicio from './pages/Inicio'
import NoEncontrada from './pages/NoEncontrada'
import Politicas from './pages/Politicas'
import Reservar from './pages/Reservar'

export default function App() {
  return (
    <Routes>
      <Route element={<Plantilla />}>
        <Route index element={<Inicio />} />
        <Route path="reservar" element={<Reservar />} />
        <Route path="confirmacion/:id" element={<Confirmacion />} />
        <Route path="contacto" element={<Contacto />} />
        <Route path="politicas" element={<Politicas />} />
        <Route path="admin" element={<Admin />} />
        <Route path="*" element={<NoEncontrada />} />
      </Route>
    </Routes>
  )
}
