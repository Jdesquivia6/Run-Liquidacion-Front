import {
  LayoutDashboard,
  Search,
  Car,
  ClipboardList,
  ReceiptText,
  Settings
} from "lucide-react";
import { useAuth } from "../auth/AuthContext";

const menu = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, module: "dashboard" },
  { id: "consulta-placa", label: "Consulta de placa", icon: Search, module: "consulta-placa" },
  { id: "datos-vehiculo", label: "Datos vehículo", icon: Car, module: "datos-vehiculo" },
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
        bg-slate-950 text-white
        transform transition-transform duration-300
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0
      `}
    >
      <div className="p-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center font-bold shadow-lg">
            ap
          </div>

          <div>
            <h2 className="font-bold text-lg leading-tight">App</h2>
            <p className="text-xs text-slate-400">
              {user?.rol === "administrador" ? "Administrador" : "Operario"}
            </p>
          </div>
        </div>
      </div>

      <nav className="p-4 space-y-1 overflow-y-auto h-[calc(100vh-90px)]">
        {visibleMenu.map((item) => {
          const Icon = item.icon;
          const active = activeModule === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onChangeModule(item.id)}
              className={`
                w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm transition
                ${active
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-900/30"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"}
              `}
            >
              <Icon size={18} />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}