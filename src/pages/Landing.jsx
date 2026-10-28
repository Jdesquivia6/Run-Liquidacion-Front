
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import {
  CarFront, ArrowRight, ArrowUpRight, Menu, X, ChevronDown,
  Search, FileText, Users, ShieldCheck, Database, MapPin,
  BarChart3, Clock3, CheckCircle2, Layers3, Workflow,
  FileSpreadsheet, LockKeyhole, Settings2, LayoutDashboard,
  ChevronRight, LogIn, ArrowUp, History, Cpu, Zap,
  CircleCheck, ListFilter, Send, ClipboardCheck, Headphones,
  Building2, Mail
} from "lucide-react";

// ======================================================
// CONFIGURACIÓN GLOBAL
// ======================================================

const COLORS = {
  primary: "#00ABE4",
  dark: "#0095C5",
  light: "#E9F1FA"
};

const BTN_PRIMARY =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-[#00ABE4] px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#0095C5] hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0095C5]";

const BTN_OUTLINE =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition-all hover:border-sky-200 hover:bg-sky-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0095C5]";

const NAV = [
  { label: "Inicio", href: "inicio" },
  { label: "Soluciones", href: "soluciones" },
  { label: "Cómo funciona", href: "funcionamiento" },
  { label: "Nosotros", href: "nosotros" }
];

const SERVICIOS = [
  {
    icono: Search,
    titulo: "Consultas vehiculares",
    descripcion:
      "Consulta información asociada a placas, vehículos y personas desde un entorno centralizado.",
    etiqueta: "CONSULTAS"
  },
  {
    icono: FileText,
    titulo: "Liquidaciones RUNT",
    descripcion:
      "Gestiona liquidaciones individuales, personalizadas y por lotes con seguimiento operativo.",
    etiqueta: "LIQUIDACIONES"
  },
  {
    icono: MapPin,
    titulo: "Ubicabilidad de personas",
    descripcion:
      "Procesa documentos, consulta información de ubicación y organiza resultados para su análisis.",
    etiqueta: "UBICABILIDAD"
  },
  {
    icono: Workflow,
    titulo: "Integraciones y automatización",
    descripcion:
      "Recibe solicitudes API, importa archivos Excel y administra trabajos de procesamiento.",
    etiqueta: "INTEGRACIONES"
  },
  {
    icono: History,
    titulo: "Historial y trazabilidad",
    descripcion:
      "Consulta operaciones realizadas y genera reportes para el seguimiento de los procesos.",
    etiqueta: "SEGUIMIENTO"
  },
  {
    icono: Users,
    titulo: "Usuarios y permisos",
    descripcion:
      "Administra los usuarios de la plataforma y controla los módulos a los que pueden acceder.",
    etiqueta: "ADMINISTRACIÓN"
  }
];

const PASOS = [
  {
    numero: "01",
    icono: LogIn,
    titulo: "Accede a AutoCore",
    descripcion:
      "Ingresa con tus credenciales y utiliza los módulos habilitados para tu perfil."
  },
  {
    numero: "02",
    icono: ListFilter,
    titulo: "Selecciona tu operación",
    descripcion:
      "Elige una consulta, liquidación, carga de documentos o integración disponible."
  },
  {
    numero: "03",
    icono: Cpu,
    titulo: "Ejecuta el proceso",
    descripcion:
      "Gestiona el procesamiento desde una interfaz que facilita el seguimiento de cada operación."
  },
  {
    numero: "04",
    icono: BarChart3,
    titulo: "Consulta los resultados",
    descripcion:
      "Revisa el historial, analiza la información disponible y exporta los registros."
  }
];

const scrollTo = id => {
  document.getElementById(id)?.scrollIntoView({
    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "instant"
      : "smooth",
    block: "start"
  });
};

// ======================================================
// ANIMACIÓN REUTILIZABLE
// ======================================================

function Reveal({ children, delay = 0, className = "" }) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{
        duration: reduce ? 0 : 0.5,
        delay: reduce ? 0 : delay
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ======================================================
// ENCABEZADO RESPONSIVE
// ======================================================

function Header() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onEscape = e => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", onEscape);
    return () => document.removeEventListener("keydown", onEscape);
  }, [menuOpen]);

  const ir = id => {
    setMenuOpen(false);
    scrollTo(id);
  };

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled || menuOpen
          ? "border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur-xl"
          : "bg-white/85 backdrop-blur-lg"
      }`}
    >
      <div className="mx-auto flex h-[68px] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">

        <button
          type="button"
          onClick={() => ir("inicio")}
          aria-label="AutoCore, ir al inicio"
          className="flex shrink-0 items-center gap-2.5"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#00ABE4] to-[#0095C5] text-white shadow-sm">
            <CarFront size={23} />
          </span>
          <span className="text-xl font-extrabold tracking-tight text-slate-900">
            Auto<span className="text-[#00ABE4]">Core</span>
          </span>
        </button>

        <nav aria-label="Navegación principal" className="hidden items-center gap-7 lg:flex">
          {NAV.map(item => (
            <button
              key={item.href}
              type="button"
              onClick={() => ir(item.href)}
              className="text-[13px] font-medium text-slate-600 transition-colors hover:text-[#0095C5]"
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate("/login")}
            className={`${BTN_PRIMARY} !px-4 !py-2.5`}
          >
            <LogIn size={16} />
            <span className="hidden sm:inline">Ingresar al sistema</span>
            <span className="sm:hidden">Ingresar</span>
          </button>

          <button
            type="button"
            aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={menuOpen}
            aria-controls="landing-mobile-menu"
            onClick={() => setMenuOpen(v => !v)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-700 lg:hidden"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav
          id="landing-mobile-menu"
          aria-label="Navegación móvil"
          className="border-t border-slate-100 bg-white px-4 py-3 shadow-lg lg:hidden"
        >
          <div className="mx-auto max-w-7xl space-y-1">
            {NAV.map(item => (
              <button
                key={item.href}
                type="button"
                onClick={() => ir(item.href)}
                className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-sm font-semibold text-slate-700 hover:bg-sky-50 hover:text-[#0095C5]"
              >
                {item.label}
                <ChevronRight size={16} />
              </button>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}

// ======================================================
// VISTA PREVIA DEL PRODUCTO
// Datos ilustrativos, no cifras de producción.
// ======================================================

function DashboardPreview() {
  const operaciones = [
    {
      icono: Search,
      nombre: "Consulta vehicular",
      descripcion: "Búsqueda por placa",
      estado: "Consulta",
      estilo: "bg-sky-50 text-sky-700"
    },
    {
      icono: FileText,
      nombre: "Liquidación RUNT",
      descripcion: "Gestión de trámites",
      estado: "Proceso",
      estilo: "bg-amber-50 text-amber-700"
    },
    {
      icono: MapPin,
      nombre: "Ubicabilidad",
      descripcion: "Consulta de direcciones",
      estado: "Análisis",
      estilo: "bg-emerald-50 text-emerald-700"
    }
  ];

  return (
    <div className="relative mx-auto w-full max-w-[590px]">
      <div className="absolute -inset-5 rounded-[40px] bg-[#00ABE4]/10 blur-3xl" />

      <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_75px_-25px_rgba(15,23,42,0.28)]">

        {/* BARRA DEL NAVEGADOR */}

        <div className="flex h-10 items-center gap-2 border-b border-slate-100 bg-slate-50 px-4">
          <span className="h-2.5 w-2.5 rounded-full bg-red-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
          <div className="ml-3 flex-1 rounded-md border border-slate-200 bg-white px-3 py-1 text-center text-[9px] text-slate-400">
            AutoCore / Centro de operaciones
          </div>
        </div>

        <div className="flex min-h-[350px]">

          {/* SIDEBAR MOCKUP */}

          <aside className="hidden w-[115px] shrink-0 border-r border-slate-100 bg-slate-50 p-3 sm:block">
            <div className="mb-6 flex items-center gap-1.5">
              <CarFront size={15} className="text-[#0095C5]" />
              <span className="text-[10px] font-bold text-slate-800">AutoCore</span>
            </div>

            {[
              [LayoutDashboard, "Inicio", true],
              [Search, "Consultas", false],
              [FileText, "Liquidaciones", false],
              [MapPin, "Ubicabilidad", false],
              [History, "Historial", false]
            ].map(([Icon, label, active]) => (
              <div
                key={label}
                className={`mb-2 flex items-center gap-2 rounded-lg px-2 py-2 ${
                  active
                    ? "bg-[#00ABE4] text-white"
                    : "text-slate-500"
                }`}
              >
                <Icon size={12} />
                <span className="text-[9px] font-medium">{label}</span>
              </div>
            ))}
          </aside>

          {/* DASHBOARD MOCKUP */}

          <div className="min-w-0 flex-1 bg-[#F6FAFD] p-3 sm:p-4">
            <div className="mb-3">
              <p className="text-[9px] font-semibold text-[#0095C5]">
                CENTRO DE OPERACIONES
              </p>
              <h3 className="mt-1 text-sm font-bold text-slate-800 sm:text-base">
                Panel de gestión
              </h3>
              <p className="mt-1 text-[10px] text-slate-500">
                Vista ilustrativa de funcionalidades
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                [Search, "Consultas"],
                [FileText, "Liquidaciones"],
                [Database, "Integraciones"]
              ].map(([Icon, label]) => (
                <div key={label}
                  className="rounded-xl border border-slate-100 bg-white p-2.5 sm:p-3">
                  <Icon size={15} className="text-[#0095C5]" />
                  <p className="mt-2 truncate text-[9px] font-semibold text-slate-700 sm:text-[10px]">
                    {label}
                  </p>
                  <div className="mt-2 h-1.5 w-3/4 rounded-full bg-sky-100" />
                </div>
              ))}
            </div>

            <div className="mt-3 rounded-xl border border-slate-100 bg-white p-3">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-[11px] font-bold text-slate-800">
                  Operaciones disponibles
                </p>
                <Layers3 size={14} className="text-[#0095C5]" />
              </div>

              <div className="space-y-3">
                {operaciones.map(op => (
                  <div key={op.nombre}
                    className="flex min-w-0 items-center justify-between gap-2 border-b border-slate-50 pb-2 last:border-b-0 last:pb-0">
                    <div className="flex min-w-0 items-center gap-2">
                      <div className="rounded-lg bg-sky-50 p-2">
                        <op.icono size={13} className="text-[#0095C5]" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-[10px] font-semibold text-slate-800">
                          {op.nombre}
                        </p>
                        <p className="truncate text-[9px] text-slate-400">
                          {op.descripcion}
                        </p>
                      </div>
                    </div>
                    <span className={`shrink-0 rounded-full px-2 py-1 text-[9px] font-medium ${op.estilo}`}>
                      {op.estado}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-3 flex items-center gap-2 rounded-xl border border-sky-100 bg-sky-50 px-3 py-2.5">
              <ShieldCheck size={16} className="text-[#0095C5]" />
              <p className="text-[10px] font-medium text-slate-600">
                Gestión centralizada de operaciones
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* TARJETAS DECORATIVAS */}

      <div className="absolute -bottom-5 -left-2 hidden items-center gap-2 rounded-xl border border-slate-100 bg-white px-4 py-3 shadow-xl md:flex xl:-left-8">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50">
          <CheckCircle2 size={17} className="text-emerald-600" />
        </span>
        <div>
          <p className="text-xs font-bold text-slate-800">Procesos centralizados</p>
          <p className="text-[10px] text-slate-500">Consulta y seguimiento</p>
        </div>
      </div>

      <div className="absolute -right-2 -top-5 hidden items-center gap-2 rounded-xl border border-slate-100 bg-white px-4 py-3 shadow-xl md:flex xl:-right-6">
        <Zap size={18} className="text-[#0095C5]" />
        <span className="text-xs font-bold text-slate-700">Automatización</span>
      </div>
    </div>
  );
}

// ======================================================
// HERO
// ======================================================

function Hero() {
  const navigate = useNavigate();

  return (
    <section
      id="inicio"
      className="relative scroll-mt-20 overflow-hidden bg-gradient-to-br from-[#F0F9FF] via-white to-[#E9F1FA] pb-20 pt-32 sm:pb-28 sm:pt-40"
    >
      <div className="pointer-events-none absolute -right-32 top-12 h-[450px] w-[450px] rounded-full bg-sky-200/20 blur-3xl" />
      <div className="pointer-events-none absolute -left-40 bottom-0 h-[400px] w-[400px] rounded-full bg-[#00ABE4]/10 blur-3xl" />

      <div className="relative mx-auto grid max-w-7xl items-center gap-16 px-4 sm:px-6 lg:grid-cols-[1fr_1.05fr] lg:gap-12 lg:px-8">

        <div className="text-center lg:text-left">
          <Reveal>
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white px-3 py-2 text-xs font-semibold text-[#0095C5] shadow-sm">
              <span className="h-2 w-2 rounded-full bg-[#00ABE4]" />
              Tecnología para operaciones vehiculares
            </div>

            <h1 className="mt-7 text-4xl font-extrabold leading-[1.12] tracking-tight text-slate-900 sm:text-5xl lg:text-[54px]">
              La gestión vehicular,
              <span className="mt-2 block text-[#0095C5]">
                más inteligente y eficiente.
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg lg:mx-0">
              Centraliza consultas, automatiza liquidaciones y administra
              operaciones vehiculares desde una plataforma diseñada para
              facilitar el trabajo de los equipos operativos.
            </p>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
              <button
                type="button"
                onClick={() => navigate("/login")}
                className={BTN_PRIMARY}
              >
                Acceder al sistema
                <ArrowRight size={17} />
              </button>

              <button
                type="button"
                onClick={() => scrollTo("soluciones")}
                className={BTN_OUTLINE}
              >
                Explorar soluciones
                <ArrowUpRight size={16} />
              </button>
            </div>

            <div className="mt-9 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-xs font-medium text-slate-500 lg:justify-start">
              <span className="flex items-center gap-2">
                <CheckCircle2 size={15} className="text-emerald-600" />
                Gestión centralizada
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle2 size={15} className="text-emerald-600" />
                Procesos por lotes
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle2 size={15} className="text-emerald-600" />
                Seguimiento operativo
              </span>
            </div>
          </Reveal>
        </div>

        <Reveal delay={0.15}>
          <DashboardPreview />
        </Reveal>
      </div>
    </section>
  );
}

// ======================================================
// BANDA DE CAPACIDADES
// ======================================================

function Capabilities() {
  const items = [
    { icono: Search, texto: "Consultas RUNT" },
    { icono: FileText, texto: "Liquidaciones" },
    { icono: MapPin, texto: "Ubicabilidad" },
    { icono: Workflow, texto: "Integraciones" }
  ];

  return (
    <section className="border-y border-slate-100 bg-white py-7">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-5 px-4 sm:px-6 lg:grid-cols-4 lg:px-8">
        {items.map(item => (
          <div key={item.texto} className="flex items-center justify-center gap-3">
            <div className="rounded-xl bg-sky-50 p-2.5">
              <item.icono size={19} className="text-[#0095C5]" />
            </div>
            <span className="text-xs font-semibold text-slate-700 sm:text-sm">
              {item.texto}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

// ======================================================
// SERVICIOS
// ======================================================

function Services() {
  return (
    <section id="soluciones" className="scroll-mt-20 bg-[#F8FBFD] py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        <Reveal>
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <span className="text-xs font-bold tracking-[0.18em] text-[#0095C5]">
              SOLUCIONES AUTOCORE
            </span>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Todo lo que necesitas para gestionar tus operaciones
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-slate-600 sm:text-base">
              Un entorno de trabajo que integra consultas, procesamiento,
              automatización y seguimiento de operaciones vehiculares.
            </p>
          </div>
        </Reveal>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICIOS.map((servicio, index) => (
            <Reveal key={servicio.titulo} delay={Math.min(index % 3, 2) * 0.07}>
              <div className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-sky-200 hover:shadow-lg">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-50 text-[#0095C5] transition-colors group-hover:bg-[#00ABE4] group-hover:text-white">
                  <servicio.icono size={23} />
                </div>

                <p className="mt-5 text-[10px] font-bold tracking-widest text-[#0095C5]">
                  {servicio.etiqueta}
                </p>

                <h3 className="mt-2 text-lg font-bold text-slate-900">
                  {servicio.titulo}
                </h3>

                <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-600">
                  {servicio.descripcion}
                </p>

                <div className="mt-5 flex items-center gap-2 border-t border-slate-100 pt-4 text-xs font-semibold text-[#0095C5]">
                  Disponible según permisos
                  <ArrowUpRight size={15} />
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ======================================================
// FLUJO DE TRABAJO
// ======================================================

function HowItWorks() {
  return (
    <section id="funcionamiento" className="scroll-mt-20 bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        <Reveal>
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <span className="text-xs font-bold tracking-[0.18em] text-[#0095C5]">
              FLUJO OPERATIVO
            </span>
            <h2 className="mt-4 text-3xl font-bold text-slate-900 sm:text-4xl">
              Una forma más sencilla de trabajar
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-slate-600 sm:text-base">
              Desde el acceso hasta la consulta de resultados,
              cada etapa se desarrolla dentro de un mismo entorno.
            </p>
          </div>
        </Reveal>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PASOS.map((paso, i) => (
            <Reveal key={paso.numero} delay={i * 0.06}>
              <div className="relative h-full rounded-2xl border border-slate-200 bg-white p-6">
                <div className="mb-6 flex items-center justify-between">
                  <div className="rounded-xl bg-sky-50 p-3 text-[#0095C5]">
                    <paso.icono size={21} />
                  </div>
                  <span className="text-3xl font-extrabold text-slate-100">
                    {paso.numero}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900">
                  {paso.titulo}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">
                  {paso.descripcion}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ======================================================
// PANEL FUNCIONAL
// ======================================================

function ProductSection() {
  const modulos = [
    {
      icono: FileSpreadsheet,
      titulo: "Importación de Excel y CSV",
      descripcion: "Validación e inserción de documentos en base de datos."
    },
    {
      icono: Workflow,
      titulo: "Procesamiento por lotes",
      descripcion: "Creación y seguimiento de trabajos operativos."
    },
    {
      icono: ClipboardCheck,
      titulo: "Verificación de resultados",
      descripcion: "Revisión de la información recuperada."
    },
    {
      icono: DownloadIcon,
      titulo: "Reportes exportables",
      descripcion: "Descarga de información para análisis administrativo."
    }
  ];

  return (
    <section className="overflow-hidden bg-[#F0F8FC] py-20 sm:py-24">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">

        <Reveal>
          <div>
            <span className="text-xs font-bold tracking-[0.18em] text-[#0095C5]">
              OPERACIÓN CENTRALIZADA
            </span>

            <h2 className="mt-4 text-3xl font-bold leading-tight text-slate-900 sm:text-4xl">
              Más control sobre cada proceso, desde un solo lugar.
            </h2>

            <p className="mt-5 text-sm leading-relaxed text-slate-600 sm:text-base">
              AutoCore reúne herramientas para trabajar con documentos,
              solicitudes externas, consultas y resultados, reduciendo
              la necesidad de operar en múltiples pantallas independientes.
            </p>

            <div className="mt-8 space-y-5">
              {[
                "Organización de consultas y liquidaciones.",
                "Seguimiento de trabajos y operaciones.",
                "Administración de usuarios y accesos.",
                "Exportación de registros e información."
              ].map(texto => (
                <div key={texto} className="flex items-start gap-3">
                  <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-600" />
                  <span className="text-sm font-medium text-slate-700">{texto}</span>
                </div>
              ))}
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="rounded-3xl border border-sky-100 bg-white p-5 shadow-xl sm:p-7">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-[#0095C5]">
                  AUTOCORE
                </p>
                <h3 className="mt-1 text-lg font-bold text-slate-900">
                  Herramientas de operación
                </h3>
              </div>
              <div className="rounded-xl bg-sky-50 p-3 text-[#0095C5]">
                <Settings2 size={21} />
              </div>
            </div>

            <div className="space-y-3">
              {modulos.map(modulo => (
                <div
                  key={modulo.titulo}
                  className="flex items-center gap-3 rounded-xl border border-slate-100 bg-[#FAFCFE] p-4"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-[#0095C5]">
                    <modulo.icono size={20} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-800">
                      {modulo.titulo}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {modulo.descripcion}
                    </p>
                  </div>
                  <CheckCircle2 size={16} className="hidden text-emerald-500 sm:block" />
                </div>
              ))}
            </div>

            <div className="mt-5 flex items-start gap-2 rounded-xl bg-sky-50 p-3">
              <InfoIcon />
              <p className="text-xs leading-relaxed text-slate-600">
                Las funcionalidades disponibles dependen de la configuración
                del sistema y de los permisos del usuario.
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// Pequeños iconos auxiliares
function DownloadIcon(props) {
  return <FileText {...props} />;
}

function InfoIcon() {
  return <ShieldCheck size={16} className="mt-0.5 shrink-0 text-[#0095C5]" />;
}

// ======================================================
// NOSOTROS
// ======================================================

function About() {
  return (
    <section id="nosotros" className="scroll-mt-20 bg-white py-20 sm:py-24">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">

        <Reveal>
          <div className="rounded-3xl border border-slate-200 bg-[#F8FBFD] p-6 sm:p-8">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-[#00ABE4] p-3 text-white">
                <CarFront size={25} />
              </div>
              <div>
                <p className="text-xl font-extrabold text-slate-900">
                  Auto<span className="text-[#00ABE4]">Core</span>
                </p>
                <p className="text-xs text-slate-500">
                  Centro de Operaciones Vehiculares
                </p>
              </div>
            </div>

            <div className="mt-7 space-y-4">
              {[
                [Building2, "Gestión institucional", "Herramientas orientadas a los procesos de equipos administrativos y operativos."],
                [ShieldCheck, "Control de acceso", "Gestión de usuarios, roles y permisos para los módulos disponibles."],
                [BarChart3, "Información para el seguimiento", "Consultas, historiales y reportes organizados para apoyar la operación."]
              ].map(([Icon, titulo, descripcion]) => (
                <div key={titulo} className="flex items-start gap-3 rounded-xl bg-white p-4">
                  <Icon size={20} className="mt-0.5 shrink-0 text-[#0095C5]" />
                  <div>
                    <p className="text-sm font-bold text-slate-800">{titulo}</p>
                    <p className="mt-1 text-xs leading-relaxed text-slate-600">
                      {descripcion}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div>
            <span className="text-xs font-bold tracking-[0.18em] text-[#0095C5]">
              ACERCA DE AUTOCORE
            </span>

            <h2 className="mt-4 text-3xl font-bold leading-tight text-slate-900 sm:text-4xl">
              Tecnología pensada para simplificar la operación vehicular.
            </h2>

            <p className="mt-5 text-sm leading-relaxed text-slate-600 sm:text-base">
              AutoCore es una plataforma tecnológica orientada a centralizar
              consultas y apoyar la gestión de procesos relacionados con
              información vehicular y administrativa.
            </p>

            <p className="mt-4 text-sm leading-relaxed text-slate-600 sm:text-base">
              Su enfoque es ofrecer a los equipos de trabajo una experiencia
              organizada, con herramientas para la automatización, trazabilidad
              y seguimiento de sus actividades.
            </p>

            <div className="mt-7 flex flex-wrap gap-2">
              {["Eficiencia", "Organización", "Seguridad", "Automatización"].map(v => (
                <span key={v}
                  className="rounded-full border border-sky-100 bg-sky-50 px-3 py-1.5 text-xs font-semibold text-[#0095C5]">
                  {v}
                </span>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ======================================================
// SEGURIDAD Y RESPONSABILIDAD
// ======================================================

function Security() {
  return (
    <section className="bg-[#F8FBFD] py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        <Reveal>
          <div className="mb-10 text-center">
            <span className="text-xs font-bold tracking-[0.18em] text-[#0095C5]">
              OPERACIÓN RESPONSABLE
            </span>
            <h2 className="mt-3 text-2xl font-bold text-slate-900 sm:text-3xl">
              Un entorno orientado al control y la trazabilidad
            </h2>
          </div>
        </Reveal>

        <div className="grid gap-4 sm:grid-cols-3">
          {[
            {
              icono: LockKeyhole,
              titulo: "Acceso autenticado",
              descripcion: "Ingreso de usuarios mediante las credenciales asignadas."
            },
            {
              icono: Users,
              titulo: "Permisos diferenciados",
              descripcion: "Acceso a funcionalidades según el rol configurado."
            },
            {
              icono: History,
              titulo: "Seguimiento de operaciones",
              descripcion: "Consulta de registros e historial dentro de los módulos disponibles."
            }
          ].map((item, i) => (
            <Reveal key={item.titulo} delay={i * 0.07}>
              <div className="h-full rounded-2xl border border-slate-200 bg-white p-6">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-sky-50 text-[#0095C5]">
                  <item.icono size={21} />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  {item.titulo}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {item.descripcion}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ======================================================
// CTA FINAL
// ======================================================

function FinalCTA() {
  const navigate = useNavigate();

  return (
    <section className="bg-white px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <Reveal>
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-3xl bg-gradient-to-r from-[#0095C5] to-[#00ABE4] px-6 py-12 text-center text-white shadow-xl sm:px-10 sm:py-16">
          <div className="pointer-events-none absolute -right-12 -top-20 h-64 w-64 rounded-full border-[45px] border-white/10" />
          <div className="pointer-events-none absolute -bottom-28 -left-14 h-64 w-64 rounded-full border-[45px] border-white/10" />

          <div className="relative z-10">
            <h2 className="mx-auto max-w-2xl text-3xl font-bold sm:text-4xl">
              Simplifica tus operaciones con AutoCore.
            </h2>

            <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-sky-50 sm:text-base">
              Accede a tus módulos de trabajo desde una plataforma que reúne
              consultas, liquidaciones, automatización y seguimiento.
            </p>

            <button
              type="button"
              onClick={() => navigate("/login")}
              className="mt-7 inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-[#0095C5] shadow-md transition-colors hover:bg-sky-50"
            >
              Ingresar a AutoCore
              <ArrowRight size={17} />
            </button>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

// ======================================================
// FOOTER
// ======================================================

function Footer() {
  const navigate = useNavigate();

  return (
    <footer id="contacto" className="scroll-mt-20 bg-[#101C2C] pt-14 text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        <div className="grid gap-10 pb-12 md:grid-cols-3">

          <div>
            <button type="button"
              onClick={() => scrollTo("inicio")}
              className="flex items-center gap-3">
              <span className="rounded-xl bg-[#00ABE4] p-2.5">
                <CarFront size={22} />
              </span>
              <span className="text-xl font-extrabold">
                Auto<span className="text-[#00ABE4]">Core</span>
              </span>
            </button>

            <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-400">
              Plataforma tecnológica para centralizar consultas vehiculares,
              liquidaciones, procesos operativos e integraciones.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-bold">Explorar</h3>
            <div className="mt-5 flex flex-col items-start gap-3">
              {NAV.map(item => (
                <button key={item.href} type="button"
                  onClick={() => scrollTo(item.href)}
                  className="text-sm text-slate-400 hover:text-sky-300">
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold">Acceso a la plataforma</h3>
            <p className="mt-5 text-sm leading-relaxed text-slate-400">
              Si ya cuentas con un usuario autorizado, ingresa
              al sistema para acceder a tus herramientas de trabajo.
            </p>

            <button type="button"
              onClick={() => navigate("/login")}
              className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-sky-300 hover:text-white">
              Iniciar sesión
              <ArrowUpRight size={16} />
            </button>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-white/10 py-6 sm:flex-row">
          <p className="text-center text-xs text-slate-400">
            © {new Date().getFullYear()} AutoCore. Todos los derechos reservados.
          </p>

          <div className="flex items-center gap-5">
            <span className="text-xs text-slate-500">
              Centro de Operaciones Vehiculares
            </span>

            <button
              type="button"
              onClick={() => scrollTo("inicio")}
              aria-label="Volver arriba"
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#00ABE4] text-white transition-colors hover:bg-[#0095C5]"
            >
              <ArrowUp size={17} />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ======================================================
// COMPONENTE PRINCIPAL
// ======================================================

export default function Landing() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-white font-sans">
      <Header />
      <main>
        <Hero />
        <Capabilities />
        <Services />
        <HowItWorks />
        <ProductSection />
        <About />
        <Security />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
