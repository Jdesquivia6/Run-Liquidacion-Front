import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function ProtectedRoute({
  children,
  module
}) {
  const {
    authenticated,
    hasModule,
    user
  } = useAuth();

  if (!authenticated) {
    return <Navigate to="/login" replace />;
  }

  if (module && !hasModule(module)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white p-8 rounded-3xl shadow">
          <h2 className="text-2xl font-bold text-red-600">
            Acceso denegado
          </h2>

          <p className="text-slate-500 mt-2">
            No tienes permisos para este módulo.
          </p>
        </div>
      </div>
    );
  }
  

  if (
    authenticated &&
    user?.debe_cambiar_password &&
    window.location.pathname !== "/cambiar-password"
  ) {
    return <Navigate to="/cambiar-password" replace />;
  }

  return children;
}