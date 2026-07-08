import { useState } from "react";
import {
  LayoutDashboard,
  Search,
  Car,
  ClipboardList,
  ReceiptText,
  Settings,
  MapPin,
  Users,
  Printer,
  ChevronDown,
  UserSearch
} from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { motion } from "framer-motion";
import RuntSessionStatus from "./RuntSessionStatus";

const menu = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, module: "dashboard" },
  { id: "consulta-placa", label: "Consulta de placa", icon: Search, module: "consulta-placa" },
  { id: "datos-vehiculo", label: "Datos vehículo", icon: Car, module: "datos-vehiculo" },
  { id: "personas-direcciones", label: "Personas - Direcciones", icon: MapPin, module: "personas-direcciones" },
  { id: "ubicabilidad-personas", label: "Ubicabilidad Personas", icon: UserSearch, module: "ubicabilidad-personas" },
  { id: "historial", label: "Historial", icon: ClipboardList, module: "historial" },
  { id: "liquidacion", label: "Liquidaciones RUNT", icon: ReceiptText, module: "liquidaciones" }
];

const configMenu = [
  { id: "usuarios", label: "Gestión de usuarios", icon: Users, module: "configuracion" },
  { id: "configuracion-impresora", label: "Configurar impresora", icon: Printer, module: "configuracion" }
];

export default function Sidebar({ activeModule, onChangeModule, sidebarOpen }) {
  const { hasModule, user } = useAuth();
  const [configOpen, setConfigOpen] = useState(false);

  const visibleMenu = menu.filter((item) => hasModule(item.module));
  const visibleConfigMenu = configMenu.filter((item) => hasModule(item.module));
  const showConfig = visibleConfigMenu.length > 0;
  const isConfigActive = activeModule === "usuarios" || activeModule === "configuracion-impresora";

  const isInConfigSection = activeModule === "usuarios" || activeModule === "configuracion-impresora";

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

      {/* Session Status */}
      <div className="px-4 pt-4">
        <RuntSessionStatus compact />
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-1 overflow-y-auto h-[calc(100vh-210px)]">
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
              {active && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-r-full" />
              )}

              <Icon size={20} />
              <span className="truncate">{item.label}</span>

              {active && (
                <span className="ml-auto w-2 h-2 rounded-full bg-white" />
              )}
            </motion.button>
          );
        })}

        {/* Configuración section */}
        {showConfig && (
          <div className="pt-3 mt-2 border-t border-slate-100">
            <button
              onClick={() => setConfigOpen(!configOpen)}
              className={`
                w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all relative
                ${isConfigActive
                  ? "bg-gradient-to-r from-[#00ABE4] to-[#0095C5] text-white shadow-btn"
                  : "text-slate-500 hover:bg-[#E9F1FA] hover:text-slate-700"}
              `}
            >
              <Settings size={20} />
              <span className="truncate flex-1 text-left">Configuración</span>
              <ChevronDown
                size={14}
                className={`transition-transform duration-200 ${configOpen ? "rotate-180" : ""}`}
              />
            </button>

            {(isConfigActive || configOpen) && (
              <div className="ml-3 mt-1 space-y-0.5">
                {visibleConfigMenu.map((item) => {
                  const Icon = item.icon;
                  const active = activeModule === item.id;

                  return (
                    <motion.button
                      key={item.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      onClick={() => onChangeModule(item.id)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`
                        w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all relative
                        ${active
                          ? "bg-[#00ABE4]/10 text-[#00ABE4] font-semibold"
                          : "text-slate-400 hover:bg-[#E9F1FA] hover:text-slate-600"}
                      `}
                    >
                      <Icon size={16} />
                      <span className="truncate">{item.label}</span>
                      {active && (
                        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#00ABE4]" />
                      )}
                    </motion.button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </nav>
    </aside>
  );
}