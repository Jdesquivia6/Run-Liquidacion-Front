import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import { AuthProvider } from "./auth/AuthContext";
import ProtectedRoute from "./auth/ProtectedRoute";

import DashboardLayout from "./layouts/DashboardLayout";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ConsultaPlaca from "./pages/ConsultaPlaca";
import DatosVehiculo from "./pages/DatosVehiculo";
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
          <Route path="/login" element={<Login />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route
              index
              element={
                <ProtectedRoute module="dashboard">
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="consulta-placa"
              element={
                <ProtectedRoute module="consulta-placa">
                  <ConsultaPlaca />
                </ProtectedRoute>
              }
            />

            <Route
              path="datos-vehiculo"
              element={
                <ProtectedRoute module="datos-vehiculo">
                  <DatosVehiculo />
                </ProtectedRoute>
              }
            />

            <Route
              path="historial"
              element={
                <ProtectedRoute module="historial">
                  <Historial />
                </ProtectedRoute>
              }
            />

            <Route
              path="liquidacion"
              element={
                <ProtectedRoute module="liquidacion">
                  <LiquidarRunt />
                </ProtectedRoute>
              }
            />

            <Route
              path="usuarios"
              element={
                <ProtectedRoute module="configuracion">
                  <Usuarios />
                </ProtectedRoute>
              }
            />
          </Route>

          <Route path="/recuperar-password" element={<RecuperarPassword />} />

          <Route
            path="/cambiar-password"
            element={
              <ProtectedRoute>
                <CambiarPassword />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        <Toaster position="top-right" />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;