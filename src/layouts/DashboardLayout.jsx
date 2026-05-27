import { useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Menu, Bell, UserCircle, LogOut } from "lucide-react";
import Sidebar from "../components/Sidebar";
import RuntSessionStatus from "../components/RuntSessionStatus";
import { useAuth } from "../auth/AuthContext";

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  // Determinar el módulo activo basado en la ruta actual
  const activeModule = (() => {
    const path = location.pathname;
    
    if (path === "/dashboard" || path === "") {
      return "dashboard";
    }
    if (path.includes("consulta-placa")) return "consulta-placa";
    if (path.includes("datos-vehiculo")) return "datos-vehiculo";
    if (path.includes("personas-direcciones")) return "personas-direcciones";
    if (path.includes("historial")) return "historial";
    if (path.includes("liquidacion")) return "liquidacion";
    if (path.includes("usuarios")) return "configuracion";
    return "dashboard";
  })();

  const handleChangeModule = (module) => {
    const routes = {
      dashboard: "/dashboard",
      "consulta-placa": "/consulta-placa",
      "datos-vehiculo": "/datos-vehiculo",
      "personas-direcciones": "/personas-direcciones",
      historial: "/historial",
      liquidacion: "/liquidacion",
      configuracion: "/usuarios"
    };

    navigate(routes[module] || "/dashboard");
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#E9F1FA] flex overflow-hidden">
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/40 z-30 xl:hidden"
        />
      )}

      <Sidebar
        activeModule={activeModule}
        onChangeModule={handleChangeModule}
        sidebarOpen={sidebarOpen}
      />

      <main className="flex-1 min-w-0 w-full xl:ml-72">
        <header className="bg-white/90 backdrop-blur border-b border-[#e2e8f0] px-4 md:px-6 py-4 sticky top-0 z-20 shadow-sm">
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => setSidebarOpen(true)}
                className="xl:hidden bg-[#00ABE4] hover:bg-[#0095c7] text-white rounded-xl p-2.5 transition-colors"
              >
                <Menu size={20} />
              </button>

              <div className="min-w-0">
                <h1 className="text-lg md:text-xl font-bold text-[#1e293b] truncate">
                  AutoCore - Centro de Operaciones Vehiculares
                </h1>
                <p className="text-xs md:text-sm text-[#64748b] truncate">
                  {user?.nombre || "Usuario"}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 md:gap-3">
              <RuntSessionStatus compact />

              <div className="flex items-center gap-2 md:gap-3 shrink-0">
                <button className="w-10 h-10 rounded-xl border border-[#e2e8f0] text-[#64748b] flex items-center justify-center hover:bg-[#F8FAFC] hover:text-[#00ABE4] transition-colors">
                  <Bell size={20} />
                </button>

                <button className="w-10 h-10 rounded-xl bg-[#00ABE4] text-white flex items-center justify-center hover:bg-[#0095c7] transition-colors">
                  <UserCircle size={22} />
                </button>

                <button
                  onClick={logout}
                  className="w-10 h-10 rounded-xl border border-red-200 text-[#dc2626] flex items-center justify-center hover:bg-red-50 transition-colors"
                  title="Cerrar sesión"
                >
                  <LogOut size={20} />
                </button>
              </div>
            </div>
          </div>
        </header>

        <section className="p-4 md:p-6 max-w-7xl mx-auto w-full">
          <Outlet />
        </section>
      </main>
    </div>
  );
}