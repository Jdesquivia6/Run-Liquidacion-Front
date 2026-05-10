import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { useEffect } from "react";

export default function ProtectedRoute({
  children,
  module
}) {
  const {
    authenticated,
    hasModule,
    user
  } = useAuth();

  const location = useLocation();

  // Si no está autenticado, ir a login
  if (!authenticated) {
    return <Navigate to="/login" replace />;
  }

  // Verificar permisos del módulo
  if (module && !hasModule(module)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#E9F1FA]">
        <div className="bg-white p-8 rounded-3xl shadow-card-hover text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-[#1e293b] mb-2">
            Acceso denegado
          </h2>
          <p className="text-[#64748b]">
            No tienes permisos para acceder a este módulo.
          </p>
        </div>
      </div>
    );
  }
  
  // Si debe cambiar password, redirigir (excepto si ya está en esa página)
  if (
    authenticated &&
    user?.debe_cambiar_password &&
    location.pathname !== "/cambiar-password"
  ) {
    return <Navigate to="/cambiar-password" replace />;
  }

  return children;
}