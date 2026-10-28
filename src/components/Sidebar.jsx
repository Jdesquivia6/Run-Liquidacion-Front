
import { useEffect, useState } from "react";
import {
  LayoutDashboard, Search, Car, ClipboardList,
  ReceiptText, Settings, MapPin, Users, Printer,
  ChevronDown, UserSearch, FileText, CarFront, X
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useAuth } from "../auth/AuthContext";
import RuntSessionStatus from "./RuntSessionStatus";

// ======================================================
// MENÚS - IDs Y PERMISOS ORIGINALES
// ======================================================

const menu = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, module: "dashboard" },
  { id: "consulta-placa", label: "Consulta de placa", icon: Search, module: "consulta-placa" },
  { id: "datos-vehiculo", label: "Datos vehículo", icon: Car, module: "datos-vehiculo" },
  { id: "personas-direcciones", label: "Consulta direcciones manual", icon: MapPin, module: "personas-direcciones" },
  { id: "ubicabilidad-personas", label: "Consulta ubicabilidad", icon: UserSearch, module: "ubicabilidad-personas" },
  { id: "historial", label: "Historial", icon: ClipboardList, module: "historial" },
  { id: "liquidacion", label: "Liquidaciones RUNT", icon: ReceiptText, module: "liquidaciones" },
  { id: "liquidacion-personalizada", label: "Liq. Personalizada RUNT", icon: FileText, module: "liquidaciones_personalizadas" }
];

const configMenu = [
  { id: "usuarios", label: "Gestión de usuarios", icon: Users, module: "configuracion" },
  { id: "configuracion-impresora", label: "Configurar impresora", icon: Printer, module: "configuracion" }
];

const ITEM =
  "group relative flex min-h-11 w-full touch-manipulation items-center gap-3 rounded-xl px-3 text-left text-[13px] font-medium transition-colors";

export default function Sidebar({
  activeModule,
  onChangeModule,
  sidebarOpen,
  onClose
}) {
  const { hasModule } = useAuth();
  const reduceMotion = useReducedMotion();
  const [configOpen, setConfigOpen] = useState(false);

  const visibleMenu = menu.filter(item => hasModule(item.module));
  const visibleConfigMenu = configMenu.filter(item => hasModule(item.module));

  const showConfig = visibleConfigMenu.length > 0;
  const isConfigActive = ["usuarios", "configuracion-impresora"].includes(activeModule);
  const configExpanded = configOpen || isConfigActive;

  useEffect(() => {
    if (isConfigActive) setConfigOpen(true);
  }, [isConfigActive]);

  const mainActive =
    "bg-gradient-to-r from-[#00ABE4] to-[#0095C5] text-white shadow-[0_4px_12px_rgba(0,171,228,.18)]";

  const mainInactive =
    "text-slate-600 hover:bg-sky-50 hover:text-[#0095C5] dark:text-slate-300 dark:hover:bg-[#20334A] dark:hover:text-sky-300";

  return (
    <aside
      aria-label="Navegación principal de AutoCore"
      className={`
        fixed inset-y-0 left-0 z-40 flex h-dvh w-72
        flex-col overflow-hidden border-r border-slate-100
        bg-white shadow-[4px_0_24px_rgba(0,0,0,0.06)]
        transition-transform duration-300
        dark:border-slate-700 dark:bg-[#111F32]
        dark:shadow-[4px_0_24px_rgba(0,0,0,0.15)]
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        xl:translate-x-0
      `}
    >
      {/* MARCA CORPORATIVA */}

      <div className="shrink-0 border-b border-slate-100 px-5 py-4 dark:border-slate-700">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#00ABE4] to-[#0095C5] text-white shadow-[0_4px_12px_rgba(0,171,228,.2)]">
              <CarFront size={25} />
            </div>

            <div className="min-w-0">
              <h2 className="text-[21px] font-extrabold leading-tight tracking-tight text-slate-900 dark:text-slate-100">
                Auto<span className="text-[#00ABE4]">Core</span>
              </h2>
              <p className="mt-0.5 truncate text-[10px] font-semibold tracking-[0.12em] text-slate-400">
                CENTRO DE OPERACIONES
              </p>
            </div>
          </div>

          {typeof onClose === "function" && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar menú lateral"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 xl:hidden"
            >
              <X size={19} />
            </button>
          )}
        </div>
      </div>

      {/* SESIÓN RUNT - FIJA ARRIBA */}

      <div className="shrink-0 border-b border-slate-100 px-4 py-3 dark:border-slate-700">
        <RuntSessionStatus compact />
      </div>

      {/* ETIQUETA DE NAVEGACIÓN */}

      <div className="shrink-0 px-5 pb-2 pt-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
          Menú principal
        </p>
      </div>

      {/* MENÚ PRINCIPAL - SCROLL INDEPENDIENTE */}

      <nav
        aria-label="Módulos disponibles"
        className="min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain px-3 pb-4 pt-1"
      >
        {visibleMenu.map(item => {
          const Icon = item.icon;
          const active = activeModule === item.id;

          return (
            <motion.button
              key={item.id}
              type="button"
              onClick={() => onChangeModule(item.id)}
              whileHover={reduceMotion ? undefined : { x: 2 }}
              whileTap={reduceMotion ? undefined : { scale: 0.99 }}
              aria-current={active ? "page" : undefined}
              className={`${ITEM} ${active ? mainActive : mainInactive}`}
            >
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                active
                  ? "bg-white/15 text-white"
                  : "bg-slate-50 text-slate-500 group-hover:bg-sky-100 group-hover:text-[#0095C5] dark:bg-[#1B2B40] dark:text-slate-400 dark:group-hover:bg-[#27465C] dark:group-hover:text-sky-300"
              }`}>
                <Icon size={18} />
              </span>

              <span className="min-w-0 flex-1 truncate">
                {item.label}
              </span>

              {active && (
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-white" />
              )}
            </motion.button>
          );
        })}

        {/* CONFIGURACIÓN */}

        {showConfig && (
          <div className="mt-3 border-t border-slate-100 pt-3 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setConfigOpen(v => !v)}
              aria-expanded={configExpanded}
              aria-controls="autocore-config-menu"
              className={`${ITEM} ${isConfigActive ? mainActive : mainInactive}`}
            >
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                isConfigActive
                  ? "bg-white/15 text-white"
                  : "bg-slate-50 text-slate-500 dark:bg-[#1B2B40] dark:text-slate-400"
              }`}>
                <Settings size={18} />
              </span>

              <span className="min-w-0 flex-1 truncate">
                Configuración
              </span>

              <ChevronDown
                size={16}
                className={`shrink-0 transition-transform ${configExpanded ? "rotate-180" : ""}`}
              />
            </button>

            {configExpanded && (
              <div
                id="autocore-config-menu"
                className="ml-4 mt-1 space-y-1 border-l border-slate-200 pl-2 dark:border-slate-700"
              >
                {visibleConfigMenu.map(item => {
                  const Icon = item.icon;
                  const active = activeModule === item.id;

                  return (
                    <motion.button
                      key={item.id}
                      type="button"
                      initial={reduceMotion ? false : { opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2 }}
                      onClick={() => onChangeModule(item.id)}
                      aria-current={active ? "page" : undefined}
                      className={`flex min-h-11 w-full touch-manipulation items-center gap-2.5 rounded-lg px-3 text-left text-xs transition-colors ${
                        active
                          ? "bg-sky-50 font-bold text-[#0095C5] dark:bg-sky-400/10 dark:text-sky-300"
                          : "text-slate-500 hover:bg-slate-50 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-[#20334A] dark:hover:text-slate-200"
                      }`}
                    >
                      <Icon size={17} className="shrink-0" />

                      <span className="min-w-0 flex-1 truncate">
                        {item.label}
                      </span>

                      {active && (
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#00ABE4]" />
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
