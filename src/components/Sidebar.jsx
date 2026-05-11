import {
  LayoutDashboard,
  Search,
  Car,
  ClipboardList,
  ReceiptText,
  Settings,
  MapPin,
  Users
} from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { motion } from "framer-motion";

const menu = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, module: "dashboard" },
  { id: "consulta-placa", label: "Consulta de placa", icon: Search, module: "consulta-placa" },
  { id: "datos-vehiculo", label: "Datos vehículo", icon: Car, module: "datos-vehiculo" },
  { id: "personas-direcciones", label: "Personas - Direcciones", icon: MapPin, module: "personas-direcciones" },
  { id: "historial", label: "Historial", icon: ClipboardList, module: "historial" },
  { id: "liquidacion", label: "Liquidaciones RUNT", icon: ReceiptText, module: "liquidacion" },
  { id: "configuracion", label: "Configuración", icon: Settings, module: "configuracion" }
];

export default function Sidebar({ activeModule, onChangeModule, sidebarOpen }) {
  const { hasModule, user } = useAuth();

  const visibleMenu = menu.filter((item) => hasModule(item.module));

  return (
    <aside
      className={`
        fixed top-0 left-0 z-40 h-screen w-72
        bg-white
        shadow-[4px_0_24px_rgba(0,0,0,0.08)]
        transform transition-transform duration-300
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0
      `}
    >
      {/* Logo Section */}
      <div className="p-5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#00ABE4] to-[#0095C5] flex items-center justify-center font-bold text-white shadow-btn">
            AC
          </div>

          <div>
            <h2 className="font-bold text-lg leading-tight text-slate-900">AutoCore</h2>
            <p className="text-xs text-slate-500">
              {user?.rol === "administrador" ? "Administrador" : "Operario"}
            </p>
          </div>
        </div>
      </div>

      {/* Separator */}
      <div className="mx-5 border-t border-slate-100" />

      {/* Navigation */}
      <nav className="p-4 space-y-1 overflow-y-auto h-[calc(100vh-130px)]">
        {visibleMenu.map((item) => {
          const Icon = item.icon;
          const active = activeModule === item.id;

          return (
            <motion.button
              key={item.id}
              onClick={() => onChangeModule(item.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`
                w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all relative
                ${active
                  ? "bg-gradient-to-r from-[#00ABE4] to-[#0095C5] text-white shadow-btn"
                  : "text-slate-500 hover:bg-[#E9F1FA] hover:text-slate-700"}
              `}
            >
              {/* Active indicator - left bar */}
              {active && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-r-full" />
              )}

              <Icon size={20} />
              <span className="truncate">{item.label}</span>

              {/* Active indicator - dot */}
              {active && (
                <span className="ml-auto w-2 h-2 rounded-full bg-white" />
              )}
            </motion.button>
          );
        })}
      </nav>
    </aside>
  );
}