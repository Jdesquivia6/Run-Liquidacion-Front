
import { useEffect, useRef, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Menu, LogOut, ChevronDown, ShieldCheck, Mail,
  CarFront, LayoutDashboard, Sun, Moon
} from "lucide-react";
import Swal from "sweetalert2";
import Sidebar from "../components/Sidebar";
import RuntSessionStatus from "../components/RuntSessionStatus";
import RuntSessionAlarm from "../components/RuntSessionAlarm";
import { useAuth } from "../auth/AuthContext";

const ROUTES = {
  dashboard: "/dashboard",
  "consulta-placa": "/consulta-placa",
  "datos-vehiculo": "/datos-vehiculo",
  "personas-direcciones": "/personas-direcciones",
  historial: "/historial",
  liquidacion: "/liquidacion",
  "liquidacion-personalizada": "/liquidacion-personalizada",
  usuarios: "/usuarios",
  "configuracion-impresora": "/configuracion/impresora",
  "ubicabilidad-personas": "/ubicabilidad-personas"
};

const MODULE_NAMES = {
  dashboard: "Inicio",
  "consulta-placa": "Consulta de placas",
  "datos-vehiculo": "Datos del vehículo",
  "personas-direcciones": "Personas y direcciones",
  historial: "Historial",
  liquidacion: "Liquidaciones RUNT",
  "liquidacion-personalizada": "Liquidaciones personalizadas",
  usuarios: "Gestión de usuarios",
  "configuracion-impresora": "Configuración de impresoras",
  "ubicabilidad-personas": "Ubicabilidad de personas"
};

const getActiveModule = pathname => {
  const path = pathname.replace(/\/+$/, "") || "/dashboard";
  if (path === "/" || path === "/dashboard") return "dashboard";
  return Object.keys(ROUTES)
    .filter(k => k !== "dashboard")
    .sort((a, b) => b.length - a.length)
    .find(k => path === ROUTES[k] || path.startsWith(`${ROUTES[k]}/`))
    || "dashboard";
};

const nombreRol = rol => ({
  administrador: "Administrador",
  operario: "Operario"
})[rol] || rol || "Usuario";

const leerTema = () => {
  try {
    return localStorage.getItem("autocore-theme") === "dark"
      ? "dark" : "light";
  } catch {
    return "light";
  }
};

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [theme, setTheme] = useState(leerTema);

  const profileRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const dark = theme === "dark";
  const activeModule = getActiveModule(location.pathname);
  const moduleName = MODULE_NAMES[activeModule] || "Inicio";

  const userName = user?.nombre || "Usuario";
  const userEmail = user?.email || "";
  const userRole = nombreRol(user?.rol);
  const inicial = userName.trim().charAt(0).toUpperCase() || "U";

  // ====================================================
  // MODO OSCURO - SOLO SISTEMA INTERNO
  // ====================================================

  useEffect(() => {
    document.body.classList.toggle("autocore-dark", dark);
    document.body.style.colorScheme = dark ? "dark" : "light";

    try {
      localStorage.setItem("autocore-theme", theme);
    } catch {
      // El tema funciona aunque el almacenamiento esté bloqueado.
    }

    return () => {
      document.body.classList.remove("autocore-dark");
      document.body.style.colorScheme = "";
    };
  }, [dark, theme]);

  const cambiarTema = () => {
    setTheme(t => t === "dark" ? "light" : "dark");
  };

  // ====================================================
  // EFECTOS DE NAVEGACIÓN Y MENÚS
  // ====================================================

  useEffect(() => {
    setSidebarOpen(false);
    setProfileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!profileOpen) return;

    const cerrarFuera = e => {
      if (profileRef.current && !profileRef.current.contains(e.target))
        setProfileOpen(false);
    };

    const escape = e => {
      if (e.key === "Escape") setProfileOpen(false);
    };

    document.addEventListener("pointerdown", cerrarFuera);
    document.addEventListener("keydown", escape);

    return () => {
      document.removeEventListener("pointerdown", cerrarFuera);
      document.removeEventListener("keydown", escape);
    };
  }, [profileOpen]);

  useEffect(() => {
    if (!sidebarOpen) return;

    const anterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const escape = e => {
      if (e.key === "Escape") setSidebarOpen(false);
    };

    document.addEventListener("keydown", escape);

    return () => {
      document.body.style.overflow = anterior;
      document.removeEventListener("keydown", escape);
    };
  }, [sidebarOpen]);

  // ====================================================
  // NAVEGACIÓN Y CIERRE DE SESIÓN
  // ====================================================

  const handleChangeModule = module => {
    navigate(ROUTES[module] || "/dashboard");
    setSidebarOpen(false);
    setProfileOpen(false);
  };

  const handleLogout = async () => {
    setProfileOpen(false);

    const { isConfirmed } = await Swal.fire({
      title: "Cerrar sesión",
      text: "¿Deseas finalizar tu sesión de AutoCore?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sí, cerrar sesión",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#0095C5",
      cancelButtonColor: "#64748B",
      reverseButtons: true,
      focusCancel: true,
      background: dark ? "#162338" : "#FFFFFF",
      color: dark ? "#F1F5F9" : "#1E293B",
      customClass: {
        popup: "rounded-2xl",
        confirmButton: "rounded-xl",
        cancelButton: "rounded-xl"
      }
    });

    if (isConfirmed) await logout();
  };

  // ====================================================
  // ESTILOS DEL HEADER
  // ====================================================

  const iconBtn =
    "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-colors";

  return (
    <div className="flex min-h-screen bg-[#E9F1FA] transition-colors duration-200">

      {/* OVERLAY SIDEBAR MÓVIL */}

      {sidebarOpen && (
        <button
          type="button"
          aria-label="Cerrar menú lateral"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-slate-950/50 backdrop-blur-[2px] xl:hidden"
        />
      )}

      {/* SIDEBAR EXISTENTE */}

      <Sidebar
        activeModule={activeModule}
        onChangeModule={handleChangeModule}
        sidebarOpen={sidebarOpen}
      />

      {/* CONTENIDO */}

      <main className="min-w-0 w-full flex-1 xl:ml-72">

        {/* HEADER SUPERIOR */}

        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur-xl">
          <div className="flex min-h-[68px] items-center justify-between gap-3 px-4 py-2 md:px-6">

            {/* IZQUIERDA */}

            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                aria-label="Abrir menú lateral"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#00ABE4] text-white hover:bg-[#0095C5] xl:hidden"
              >
                <Menu size={20} />
              </button>

              <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-[#0095C5] sm:flex">
                <CarFront size={22} />
              </div>

              <div className="min-w-0">
                <div className="flex min-w-0 items-center gap-2">
                  <h1 className="truncate text-lg font-extrabold tracking-tight text-slate-900 md:text-xl">
                    Auto<span className="text-[#00ABE4]">Core</span>
                  </h1>

                  <span className="hidden text-slate-300 sm:inline">/</span>

                  <span className="hidden truncate text-xs font-medium text-slate-500 sm:inline md:text-sm">
                    Centro de Operaciones Vehiculares
                  </span>
                </div>

                <p className="mt-0.5 truncate text-[11px] text-slate-500 md:text-xs">
                  {moduleName}
                </p>
              </div>
            </div>

            {/* DERECHA */}

            <div className="flex shrink-0 items-center gap-2 md:gap-3">

              {/* SESIÓN RUNT */}

              <RuntSessionStatus iconOnly />

              {/* CAMBIO DE TEMA */}

              <button
                type="button"
                onClick={cambiarTema}
                aria-label={dark ? "Activar modo claro" : "Activar modo oscuro"}
                aria-pressed={dark}
                title={dark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
                className={`${iconBtn} border-slate-200 bg-white text-[#0095C5] hover:border-sky-300 hover:bg-sky-50`}
              >
                {dark ? <Sun size={20} /> : <Moon size={20} />}
              </button>

              {/* PERFIL */}

              <div className="relative" ref={profileRef}>
                <button
                  type="button"
                  onClick={() => setProfileOpen(v => !v)}
                  aria-label="Abrir perfil de usuario"
                  aria-expanded={profileOpen}
                  aria-haspopup="true"
                  className={`flex h-10 items-center gap-2 rounded-xl border px-2.5 transition-colors ${
                    profileOpen
                      ? "border-sky-300 bg-sky-50"
                      : "border-slate-200 bg-white hover:border-sky-200 hover:bg-slate-50"
                  }`}
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#00ABE4] text-xs font-bold text-white">
                    {inicial}
                  </span>

                  <span className="hidden max-w-[120px] truncate text-xs font-semibold text-slate-700 lg:block">
                    {userName}
                  </span>

                  <ChevronDown
                    size={15}
                    className={`hidden text-slate-500 transition-transform sm:block ${
                      profileOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* MENÚ DE PERFIL */}

                {profileOpen && (
                  <div
                    className="absolute right-0 top-full z-50 mt-2 w-[min(280px,calc(100vw-24px))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
                  >
                    <div className="border-b border-slate-100 bg-slate-50/70 p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#00ABE4] text-base font-bold text-white">
                          {inicial}
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-slate-900">
                            {userName}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-500">
                            {userRole}
                          </p>
                        </div>
                      </div>

                      {userEmail && (
                        <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                          <Mail size={14} className="shrink-0" />
                          <span className="truncate" title={userEmail}>
                            {userEmail}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="p-2">
                      <div className="flex items-center gap-3 rounded-xl px-3 py-2.5">
                        <ShieldCheck size={17} className="text-emerald-600" />
                        <div>
                          <p className="text-xs font-semibold text-slate-700">
                            Sesión de AutoCore
                          </p>
                          <p className="text-[11px] text-slate-500">
                            Usuario autenticado
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleChangeModule("dashboard")}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-medium text-slate-600 hover:bg-sky-50 hover:text-[#0095C5]"
                      >
                        <LayoutDashboard size={17} />
                        Ir al inicio
                      </button>

                      <button
                        type="button"
                        onClick={cambiarTema}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-medium text-slate-600 hover:bg-sky-50 hover:text-[#0095C5]"
                      >
                        {dark ? <Sun size={17} /> : <Moon size={17} />}
                        {dark ? "Modo claro" : "Modo oscuro"}
                      </button>
                    </div>

                    <div className="border-t border-slate-100 p-2">
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-xs font-semibold text-red-600 hover:bg-red-50"
                      >
                        <LogOut size={17} />
                        Cerrar sesión
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* SALIDA RÁPIDA */}

              <button
                type="button"
                onClick={handleLogout}
                title="Cerrar sesión"
                aria-label="Cerrar sesión"
                className={`${iconBtn} border-red-200 bg-white text-red-600 hover:bg-red-50`}
              >
                <LogOut size={19} />
              </button>
            </div>
          </div>
        </header>

        {/* VISTAS DEL SISTEMA */}

        <section className="mx-auto w-full max-w-[1600px] px-4 pb-6 pt-2 md:px-6">
          <RuntSessionAlarm />
          <Outlet />
        </section>
      </main>
    </div>
  );
}
