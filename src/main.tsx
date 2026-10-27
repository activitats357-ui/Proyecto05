import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { ProveedorDatos } from './context/ProveedorDatos'
import './index.css'
import { inicializarDatosDemo } from './services/datosDemo'

// Una sola vez por carga: solo inserta datos de ejemplo si las claves no existen.
const avisoInicial = inicializarDatosDemo()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ProveedorDatos avisoInicial={avisoInicial}>
        <App />
      </ProveedorDatos>
    </BrowserRouter>
  </StrictMode>,
)
