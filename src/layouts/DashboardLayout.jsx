import { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { Menu, Bell, UserCircle, LogOut } from "lucide-react";
import Sidebar from "../components/Sidebar";
import RuntSessionStatus from "../components/RuntSessionStatus";
import { useAuth } from "../auth/AuthContext";

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  const activeModule =
    location.pathname === "/"
      ? "dashboard"
      : location.pathname.replace("/", "");

  const activeNormalized =
    activeModule === "usuarios" ? "configuracion" : activeModule;

  const handleChangeModule = (module) => {
    const routes = {
      dashboard: "/",
      "consulta-placa": "/consulta-placa",
      "datos-vehiculo": "/datos-vehiculo",
      historial: "/historial",
      liquidacion: "/liquidacion",
      configuracion: "/usuarios"
    };

    navigate(routes[module] || "/");
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex overflow-hidden">
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
        />
      )}

      <Sidebar
        activeModule={activeNormalized}
        onChangeModule={handleChangeModule}
        sidebarOpen={sidebarOpen}
      />

      <main className="flex-1 min-w-0 w-full lg:ml-72">
        <header className="bg-white/90 backdrop-blur border-b border-slate-200 px-4 md:px-6 py-4 sticky top-0 z-20">
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden bg-slate-900 text-white rounded-xl p-2"
              >
                <Menu size={20} />
              </button>

              <div className="min-w-0">
                <h1 className="text-lg md:text-xl font-bold text-slate-900 truncate">
                  Plataforma de Consultas Vehiculares
                </h1>

                <p className="text-xs md:text-sm text-slate-500 truncate">
                  Consulta de placas, datos RUNT, propietarios y trazabilidad
                </p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row md:items-center gap-3">
              <RuntSessionStatus compact />

              <div className="hidden md:flex items-center gap-3 shrink-0">
                <button className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center hover:bg-slate-50">
                  <Bell size={18} />
                </button>

                <button className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center">
                  <UserCircle size={22} />
                </button>

                <button
                  onClick={logout}
                  className="w-10 h-10 rounded-xl border border-red-200 text-red-600 flex items-center justify-center hover:bg-red-50"
                  title="Cerrar sesión"
                >
                  <LogOut size={18} />
                </button>
              </div>
            </div>
          </div>
        </header>

        <section className="p-4 md:p-6 max-w-[1600px] mx-auto w-full">
          <Outlet />
        </section>
      </main>
    </div>
  );
}