import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import { AuthProvider } from "./auth/AuthContext";
import ProtectedRoute from "./auth/ProtectedRoute";

import DashboardLayout from "./layouts/DashboardLayout";

import Login from "./pages/Login";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import ConsultaPlaca from "./pages/ConsultaPlaca";
import DatosVehiculo from "./pages/DatosVehiculo";
import PersonasDirecciones from "./pages/PersonasDirecciones";
import Historial from "./pages/Historial";
import LiquidarRunt from "./pages/LiquidarRunt";
import Usuarios from "./pages/Usuarios";
import RecuperarPassword from "./pages/RecuperarPassword";
import CambiarPassword from "./pages/CambiarPassword";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Landing page pública */}
          <Route path="/" element={<Landing />} />
          
          {/* Login público */}
          <Route path="/login" element={<Login />} />

          {/* Rutas públicas */}
          <Route path="/recuperar-password" element={<RecuperarPassword />} />

          {/* Dashboard con rutas anidadas */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="consulta-placa" element={<ConsultaPlaca />} />
            <Route path="datos-vehiculo" element={<DatosVehiculo />} />
            <Route path="personas-direcciones" element={<PersonasDirecciones />} />
            <Route path="historial" element={<Historial />} />
            <Route path="liquidacion" element={<LiquidarRunt />} />
            <Route path="usuarios" element={<Usuarios />} />
          </Route>

          {/* Rutas directas para cada módulo (sin /dashboard/) */}
          <Route
            path="/consulta-placa"
            element={
              <ProtectedRoute module="consulta-placa">
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<ConsultaPlaca />} />
          </Route>

          <Route
            path="/datos-vehiculo"
            element={
              <ProtectedRoute module="datos-vehiculo">
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DatosVehiculo />} />
          </Route>

          <Route
            path="/personas-direcciones"
            element={
              <ProtectedRoute module="personas-direcciones">
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<PersonasDirecciones />} />
          </Route>

          <Route
            path="/historial"
            element={
              <ProtectedRoute module="historial">
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Historial />} />
          </Route>

          <Route
            path="/liquidacion"
            element={
              <ProtectedRoute module="liquidacion">
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<LiquidarRunt />} />
          </Route>

          <Route
            path="/usuarios"
            element={
              <ProtectedRoute module="configuracion">
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Usuarios />} />
          </Route>

          {/* Cambiar password protegido */}
          <Route
            path="/cambiar-password"
            element={
              <ProtectedRoute>
                <CambiarPassword />
              </ProtectedRoute>
            }
          />

          {/* Redirect desconocidos a landing */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        <Toaster position="top-right" />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;