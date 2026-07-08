import { useEffect, useState } from "react";
import { Download, RefreshCw, CalendarDays, Clock, TrendingUp, CheckCircle, AlertCircle } from "lucide-react";
import {
  Car,
  CheckCircle2,
  XCircle,
  Database,
  AlertTriangle,
  Search,
  Car as CarIcon,
  MapPin
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import StatCard from "../components/StatCard";
import { obtenerDashboard, exportarDashboardExcel } from "../services/vehicleQueryApi";
import toast from "react-hot-toast";

// Paleta de colores profesional
const COLORS = {
  pageBg: "#E9F1FA",
  cardBg: "#FFFFFF",
  heroGradient: "linear-gradient(135deg, #00ABE4 0%, #0095C5 100%)",
  primary: "#00ABE4",
  primaryHover: "#0088c4",
  textPrimary: "#1e293b",
  textSecondary: "#64748b",
  success: "#059669",
  error: "#dc2626",
  warning: "#d97706",
  border: "#e2e8f0"
};

// Helper para obtener fecha en Colombia
function getFechaColombia(daysAtras = 0) {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() - daysAtras);
  return fecha.toLocaleDateString("en-CA", { timeZone: "America/Bogota" });
}

const today = getFechaColombia(0);

export default function Dashboard() {
  // Helper para calcular fechas (en hora Colombia)
  const getFecha30DiasAtras = () => getFechaColombia(30);

  const [fechaInicio, setFechaInicio] = useState(getFecha30DiasAtras());
  const [fechaFin, setFechaFin] = useState(getFechaColombia(0));
  const [modoFiltrado, setModoFiltrado] = useState(false); //false = Modo Global (resumen sin filtro + carruseles filtrados)
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [dashboard, setDashboard] = useState({
    resumenGlobal: {},
    resumen: {},
    ultimasPlacas: [],
    errores: []
  });

  const cargarDashboard = async () => {
    try {
      setLoading(true);

      const paramsGlobal = {};
      const respGlobal = await obtenerDashboard(paramsGlobal);

      const paramsFiltrado = {};
      if (modoFiltrado) {
        paramsFiltrado.fechaInicio = fechaInicio;
        paramsFiltrado.fechaFin = fechaFin;
      }
      const respFiltrado = await obtenerDashboard(paramsFiltrado);

      setDashboard({
        resumenGlobal: respGlobal.resumen || {},
        resumen: respFiltrado.resumen || {},
        ultimasPlacas: (respFiltrado.ultimasPlacas || []).slice(0, 50),
        errores: (respFiltrado.errores || []).slice(0, 50)
      });
    } catch (error) {
      console.error("Error cargando dashboard:", error.message);
      toast.error("Error al cargar datos del dashboard");
    } finally {
      setLoading(false);
    }
  };

  const handleExportarExcel = async () => {
    try {
      setExporting(true);

      const params = {};
      if (modoFiltrado) {
        params.fechaInicio = fechaInicio;
        params.fechaFin = fechaFin;
      }

      await exportarDashboardExcel(params);
      toast.success("Exportación iniciada...");
    } catch (error) {
      console.error("Error exportando:", error.message);
      toast.error("Error al exportar");
    } finally {
      setExporting(false);
    }
  };

  const toggleModo = () => {
    setModoFiltrado(!modoFiltrado);
  };

  useEffect(() => {
    // Siempre cargar resumen GLOBAL al inicio (datos históricos completos)
    cargarDashboard();
  }, []); // Solo una vez al montar

  useEffect(() => {
    const recargarFiltrado = async () => {
      try {
        setLoading(true);
        const params = {};
        if (modoFiltrado) {
          params.fechaInicio = fechaInicio;
          params.fechaFin = fechaFin;
        }
        const resp = await obtenerDashboard(params);
        setDashboard(prev => ({
          ...prev,
          resumen: resp.resumen || {},
          ultimasPlacas: (resp.ultimasPlacas || []).slice(0, 50),
          errores: (resp.errores || []).slice(0, 50)
        }));
      } catch (error) {
        console.error("Error cargando datos filtrados:", error.message);
      } finally {
        setLoading(false);
      }
    };
    recargarFiltrado();
  }, [modoFiltrado, fechaInicio, fechaFin]);

  const resumenGlobal = dashboard.resumenGlobal;
  const resumen = dashboard.resumen;

  // ── Stats Placas ──────────────────────────────────────────────────────────
  const totalPlacas = Number(resumenGlobal.total_placas || 0);
  const exitosasPlacas = Number(resumenGlobal.consultas_exitosas || 0);
  const pendientesPlacas = Number(resumenGlobal.pendientes_placas || 0);

  // ── Stats Vehículos ───────────────────────────────────────────────────────
  const totalVehiculos = Number(resumenGlobal.datos_vehiculo_total || 0);
  const exitososVehiculos = Number(resumenGlobal.datos_vehiculo_exitosos || 0);
  const fallidosVehiculos = Number(resumenGlobal.datos_vehiculo_fallidos || 0);

  // ── Stats Ubicabilidad Personas ─────────────────────────────────────────
  const totalUbica = Number(resumenGlobal.total_ubicabilidad || 0);
  const encontradasUbica = Number(resumenGlobal.ubica_encontradas || 0);
  const noEncontradasUbica = Number(resumenGlobal.ubica_no_encontradas || 0);
  const pendientesUbica = Number(resumenGlobal.ubica_pendientes || 0);

  // ── Donut chart data ─────────────────────────────────────────────────────
  const estadoData = [
    { name: "Placas OK", value: exitosasPlacas, color: COLORS.success },
    { name: "Vehículos OK", value: exitososVehiculos, color: "#2563EB" },
    { name: "Ubicabilidad OK", value: encontradasUbica, color: "#059669" },
    { name: "Pendientes", value: pendientesPlacas + pendientesUbica, color: COLORS.warning },
    { name: "Errores", value: fallidosVehiculos + noEncontradasUbica, color: COLORS.error }
  ];

  // ── Totales generales ────────────────────────────────────────────────────
  const totalGeneral = totalPlacas + totalUbica;
  const totalExitosas = exitosasPlacas + exitososVehiculos + encontradasUbica;
  const pctExitoGeneral = totalGeneral > 0 ? Math.round((totalExitosas / totalGeneral) * 100) : 0;

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8" style={{ backgroundColor: COLORS.pageBg }}>
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* HERO SECTION */}
        <section
          className="relative overflow-hidden rounded-3xl p-6 md:p-8 text-white shadow-2xl"
          style={{ background: COLORS.heroGradient }}
        >
          <div className="absolute top-4 right-4 opacity-20">
            <TrendingUp size={100} />
          </div>

          <div className="relative z-10">
            <p className="text-blue-100 text-sm font-medium flex items-center gap-2">
              <Clock size={16} />
              {modoFiltrado ? "Período seleccionado" : "Todos los datos históricos"}
            </p>

            <h2 className="text-3xl md:text-4xl font-bold mt-2">
              Centro de inteligencia vehicular
            </h2>

            <p className="text-blue-100 mt-3 max-w-3xl">
              Indicadores tipo BI para seguimiento de consultas, rendimiento del scraper,
              errores, trazabilidad y estado operativo.
            </p>
          </div>
        </section>

        {/* FILTRO DE FECHAS */}
        <section
          className="rounded-3xl p-4 md:p-6 shadow-sm"
          style={{
            backgroundColor: COLORS.cardBg,
            boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)"
          }}
        >
          <div className="flex flex-col lg:flex-row lg:items-end gap-4">
            
            {/* Toggle Modo Global/Filtrado */}
            <button
              onClick={toggleModo}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl border-2 transition-all ${
                modoFiltrado 
                  ? "border-[#00ABE4] bg-[#00ABE4]/10" 
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <CalendarDays size={20} className={modoFiltrado ? "text-[#00ABE4]" : "text-gray-400"} />
              <div className="text-left">
                <p className={`font-semibold text-sm ${modoFiltrado ? "text-[#00ABE4]" : "text-gray-700"}`}>
                  {modoFiltrado ? "Modo Filtrado" : "Modo Global"}
                </p>
                <p className="text-xs text-gray-500">
                  {modoFiltrado ? "Período seleccionado" : "Resumen sin filtro"}
                </p>
              </div>
            </button>

            {/* Campos de fecha - solo visibles en modo filtrado */}
            <div className={`flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 transition-all ${!modoFiltrado ? "hidden" : ""}`}>
              <div>
                <label className="text-sm font-semibold" style={{ color: COLORS.textPrimary }}>
                  Fecha inicio
                </label>
                <input
                  type="date"
                  max={today}
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  className="mt-2 w-full rounded-2xl border px-4 py-3 text-sm transition-all focus:outline-none focus:ring-2"
                  style={{
                    borderColor: COLORS.border,
                    color: COLORS.textPrimary,
                    "--tw-ring-color": COLORS.primary
                  }}
                />
              </div>

              <div>
                <label className="text-sm font-semibold" style={{ color: COLORS.textPrimary }}>
                  Fecha fin
                </label>
                <input
                  type="date"
                  max={today}
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                  className="mt-2 w-full rounded-2xl border px-4 py-3 text-sm transition-all focus:outline-none focus:ring-2"
                  style={{
                    borderColor: COLORS.border,
                    color: COLORS.textPrimary,
                    "--tw-ring-color": COLORS.primary
                  }}
                />
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex gap-3">
              <button
                onClick={cargarDashboard}
                disabled={loading}
                className="flex items-center gap-2 h-12 px-5 rounded-2xl font-semibold text-white transition-all hover:shadow-lg disabled:opacity-60"
                style={{ backgroundColor: loading ? COLORS.textSecondary : COLORS.primary }}
              >
                <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
                <span>{loading ? "Cargando..." : "Actualizar"}</span>
              </button>

              <button
                onClick={handleExportarExcel}
                disabled={exporting}
                className="flex items-center gap-2 h-12 px-5 rounded-2xl font-semibold text-white transition-all hover:shadow-lg disabled:opacity-60"
                style={{ 
                  backgroundColor: exporting ? COLORS.textSecondary : COLORS.success,
                  minWidth: "160px"
                }}
              >
                <Download size={18} className={exporting ? "animate-bounce" : ""} />
                <span>{exporting ? "Exportando..." : "Exportar Excel"}</span>
              </button>
            </div>
          </div>
        </section>

        {/* RESUMEN DE ACTIVIDAD - TODOS LOS MÓDULOS */}
        <section className="grid grid-cols-2 lg:grid-cols-5 gap-4">

          {/* Card Total General */}
          <div className="rounded-3xl p-5 shadow-sm" style={{ backgroundColor: COLORS.cardBg, boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)" }}>
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-[#00ABE4]/10 flex items-center justify-center">
                <TrendingUp size={20} className="text-[#00ABE4]" />
              </div>
            </div>
            <p className="text-3xl font-bold" style={{ color: COLORS.textPrimary }}>
              {totalGeneral.toLocaleString()}
            </p>
            <p className="text-sm" style={{ color: COLORS.textSecondary }}>Total general</p>
          </div>

          {/* Card Exitosas General */}
          <div className="rounded-3xl p-5 shadow-sm" style={{ backgroundColor: COLORS.cardBg, boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)" }}>
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                <CheckCircle size={20} className="text-green-600" />
              </div>
            </div>
            <p className="text-3xl font-bold" style={{ color: COLORS.success }}>
              {totalExitosas.toLocaleString()}
            </p>
            <p className="text-sm" style={{ color: COLORS.textSecondary }}>Exitosas</p>
          </div>

          {/* Card Pendientes General */}
          <div className="rounded-3xl p-5 shadow-sm" style={{ backgroundColor: COLORS.cardBg, boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)" }}>
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                <Clock size={20} className="text-amber-600" />
              </div>
            </div>
            <p className="text-3xl font-bold" style={{ color: COLORS.warning }}>
              {(pendientesPlacas + pendientesUbica).toLocaleString()}
            </p>
            <p className="text-sm" style={{ color: COLORS.textSecondary }}>Pendientes</p>
          </div>

          {/* Card Errores General */}
          <div className="rounded-3xl p-5 shadow-sm" style={{ backgroundColor: COLORS.cardBg, boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)" }}>
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                <AlertCircle size={20} className="text-red-600" />
              </div>
            </div>
            <p className="text-3xl font-bold" style={{ color: COLORS.error }}>
              {(fallidosVehiculos + noEncontradasUbica).toLocaleString()}
            </p>
            <p className="text-sm" style={{ color: COLORS.textSecondary }}>Errores</p>
          </div>

          {/* Card Tasa de Éxito */}
          <div className="rounded-3xl p-5 shadow-sm" style={{ backgroundColor: COLORS.cardBg, boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)" }}>
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                <TrendingUp size={20} className="text-emerald-600" />
              </div>
            </div>
            <p className="text-3xl font-bold" style={{ color: COLORS.textPrimary }}>
              {pctExitoGeneral}%
            </p>
            <p className="text-sm" style={{ color: COLORS.textSecondary }}>Tasa de éxito</p>
          </div>
        </section>

        {/* RESUMEN POR MÓDULO + DONA */}
        <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">

          {/* Cards de Módulos */}
          <div className="space-y-4">

            {/* Card Consulta de Placas */}
            <div className="rounded-3xl p-5 shadow-sm" style={{ backgroundColor: COLORS.cardBg, boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)" }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl bg-[#00ABE4]/10 flex items-center justify-center">
                  <Search size={18} className="text-[#00ABE4]" />
                </div>
                <div>
                  <h3 className="font-bold text-sm" style={{ color: COLORS.textPrimary }}>Consulta de Placas</h3>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center p-2 rounded-lg" style={{ backgroundColor: COLORS.pageBg }}>
                  <p className="text-xl font-bold" style={{ color: COLORS.textPrimary }}>{totalPlacas.toLocaleString()}</p>
                  <p className="text-xs" style={{ color: COLORS.textSecondary }}>Total</p>
                </div>
                <div className="text-center p-2 rounded-lg" style={{ backgroundColor: '#ECFDF5' }}>
                  <p className="text-xl font-bold" style={{ color: COLORS.success }}>{exitosasPlacas.toLocaleString()}</p>
                  <p className="text-xs" style={{ color: COLORS.success }}>OK</p>
                </div>
                <div className="text-center p-2 rounded-lg" style={{ backgroundColor: '#FEF3C7' }}>
                  <p className="text-xl font-bold" style={{ color: COLORS.warning }}>{pendientesPlacas.toLocaleString()}</p>
                  <p className="text-xs" style={{ color: COLORS.warning }}>Pend</p>
                </div>
              </div>
            </div>

            {/* Card Datos del Vehículo */}
            <div className="rounded-3xl p-5 shadow-sm" style={{ backgroundColor: COLORS.cardBg, boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)" }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl bg-[#059669]/10 flex items-center justify-center">
                  <CarIcon size={18} className="text-[#059669]" />
                </div>
                <div>
                  <h3 className="font-bold text-sm" style={{ color: COLORS.textPrimary }}>Datos del Vehículo</h3>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center p-2 rounded-lg" style={{ backgroundColor: COLORS.pageBg }}>
                  <p className="text-xl font-bold" style={{ color: COLORS.textPrimary }}>{totalVehiculos.toLocaleString()}</p>
                  <p className="text-xs" style={{ color: COLORS.textSecondary }}>Total</p>
                </div>
                <div className="text-center p-2 rounded-lg" style={{ backgroundColor: '#ECFDF5' }}>
                  <p className="text-xl font-bold" style={{ color: COLORS.success }}>{exitososVehiculos.toLocaleString()}</p>
                  <p className="text-xs" style={{ color: COLORS.success }}>OK</p>
                </div>
                <div className="text-center p-2 rounded-lg" style={{ backgroundColor: '#FEE2E2' }}>
                  <p className="text-xl font-bold" style={{ color: COLORS.error }}>{fallidosVehiculos.toLocaleString()}</p>
                  <p className="text-xs" style={{ color: COLORS.error }}>Error</p>
                </div>
              </div>
            </div>

            {/* Card Ubicabilidad Personas */}
            <div className="rounded-3xl p-5 shadow-sm" style={{ backgroundColor: COLORS.cardBg, boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)" }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl bg-[#059669]/10 flex items-center justify-center">
                  <CheckCircle2 size={18} className="text-[#059669]" />
                </div>
                <div>
                  <h3 className="font-bold text-sm" style={{ color: COLORS.textPrimary }}>Ubicabilidad Personas</h3>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2">
                <div className="text-center p-2 rounded-lg" style={{ backgroundColor: COLORS.pageBg }}>
                  <p className="text-xl font-bold" style={{ color: COLORS.textPrimary }}>{totalUbica.toLocaleString()}</p>
                  <p className="text-xs" style={{ color: COLORS.textSecondary }}>Total</p>
                </div>
                <div className="text-center p-2 rounded-lg" style={{ backgroundColor: '#ECFDF5' }}>
                  <p className="text-xl font-bold" style={{ color: COLORS.success }}>{encontradasUbica.toLocaleString()}</p>
                  <p className="text-xs" style={{ color: COLORS.success }}>OK</p>
                </div>
                <div className="text-center p-2 rounded-lg" style={{ backgroundColor: '#FEF3C7' }}>
                  <p className="text-xl font-bold" style={{ color: COLORS.warning }}>{pendientesUbica.toLocaleString()}</p>
                  <p className="text-xs" style={{ color: COLORS.warning }}>Pend</p>
                </div>
                <div className="text-center p-2 rounded-lg" style={{ backgroundColor: '#FEE2E2' }}>
                  <p className="text-xl font-bold" style={{ color: COLORS.error }}>{noEncontradasUbica.toLocaleString()}</p>
                  <p className="text-xs" style={{ color: COLORS.error }}>Error</p>
                </div>
              </div>
            </div>
          </div>

          {/* Dona */}
          <div className="rounded-3xl p-6 shadow-sm" style={{ backgroundColor: COLORS.cardBg, boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)" }}>
            <h3 className="text-lg font-bold mb-4" style={{ color: COLORS.textPrimary }}>Distribución General</h3>

            <div className="relative flex justify-center mb-6">
              <ResponsiveContainer width={200} height={200}>
                <PieChart>
                  <Pie
                    data={estadoData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    startAngle={90}
                    endAngle={-270}
                  >
                    {estadoData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: COLORS.cardBg,
                      border: `1px solid ${COLORS.border}`,
                      borderRadius: 8,
                      fontSize: 12
                    }}
                    formatter={(value) => value.toLocaleString()}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <p className="text-2xl font-bold" style={{ color: COLORS.textPrimary }}>
                    {totalExitosas.toLocaleString()}
                  </p>
                  <p className="text-xs" style={{ color: COLORS.textSecondary }}>Exitosas</p>
                </div>
              </div>
            </div>

            {/* Leyenda */}
            <div className="space-y-2">
              {estadoData.filter(d => d.value > 0).map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-sm" style={{ color: COLORS.textSecondary }}>{item.name}</span>
                  </div>
                  <span className="font-bold text-sm" style={{ color: COLORS.textPrimary }}>{item.value.toLocaleString()}</span>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t" style={{ borderColor: COLORS.border }}>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-sm" style={{ color: COLORS.textSecondary }}>Sistema operativo</span>
              </div>
            </div>
          </div>
        </section>

        {/* CARRUSELES */}
        <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <QueryCarousel title="Últimas consultas de placa" rows={dashboard.ultimasPlacas} type="ultimas" />
          <QueryCarousel title="Últimos errores" rows={dashboard.errores} type="errores" />
        </section>
      </div>
    </div>
  );
}

// Componente de Carrusel
function QueryCarousel({ title, rows = [], type }) {
  const ITEMS_POR_PAGINA = 10;
  const paginas = [];
  
  for (let i = 0; i < rows.length; i += ITEMS_POR_PAGINA) {
    paginas.push(rows.slice(i, i + ITEMS_POR_PAGINA));
  }

  if (rows.length === 0) {
    return (
      <div 
        className="rounded-3xl p-6 shadow-sm"
        style={{ 
          backgroundColor: COLORS.cardBg, 
          boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)" 
        }}
      >
        <h3 className="text-lg font-bold" style={{ color: COLORS.textPrimary }}>{title}</h3>
        <div className="mt-5 flex items-center justify-center h-32 text-gray-400">
          <div className="text-center">
            <Clock size={32} className="mx-auto mb-2 opacity-50" />
            <p>Sin registros</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="rounded-3xl p-6 shadow-sm"
      style={{ 
        backgroundColor: COLORS.cardBg, 
        boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)" 
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold" style={{ color: COLORS.textPrimary }}>{title}</h3>
        <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ backgroundColor: COLORS.pageBg, color: COLORS.textSecondary }}>
          {rows.length} registros
        </span>
      </div>

      <Swiper
        modules={[Pagination]}
        pagination={{ type: "progressbar" }}
        spaceBetween={16}
        slidesPerView={1}
        className="pb-8"
      >
        {paginas.map((pagina, pageIndex) => (
          <SwiperSlide key={pageIndex}>
            <div className="space-y-2">
              <div className="text-xs font-medium text-gray-400 mb-2">
                Página {pageIndex + 1} de {paginas.length}
              </div>
              
              <div className="overflow-hidden rounded-xl border" style={{ borderColor: COLORS.border }}>
                <table className="w-full text-xs">
                  <thead style={{ backgroundColor: COLORS.pageBg }}>
                    <tr>
                      <th className="py-2 px-3 text-left font-semibold" style={{ color: COLORS.textSecondary }}>
                        {type === "liquidaciones" ? "Documento" : "Placa"}
                      </th>
                      <th className="py-2 px-3 text-left font-semibold" style={{ color: COLORS.textSecondary }}>Estado</th>
                      <th className="py-2 px-3 text-left font-semibold" style={{ color: COLORS.textSecondary }}>Detalle</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagina.map((item, index) => {
                      const placa = type === "liquidaciones"
                        ? (item.payload?.numeroDocumento || item.payload?.numeroLiquidacion || "—")
                        : (item.placa || "—");
                      const estado = item.estado || (type === "errores" ? "error" : (item.estado_consulta ? "ok" : "pendiente"));
                      return (
                        <tr key={index} className="border-t" style={{ borderColor: COLORS.border }}>
                          <td className="py-2 px-3 font-bold" style={{ color: COLORS.textPrimary }}>
                            {placa}
                          </td>
                          <td className="py-2 px-3">
                            {estado === "exitoso" || estado === true || estado === "ok" ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                                <CheckCircle2 size={10} className="mr-1" />OK
                              </span>
                            ) : estado === "fallido" || estado === false || estado === "error" ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                <XCircle size={10} className="mr-1" />Error
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                                <Clock size={10} className="mr-1" />Pendiente
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3 truncate max-w-[150px]" style={{ color: COLORS.textSecondary }}>
                            {type === "liquidaciones"
                              ? (item.payload?.tipoDocumento ? `${item.payload.tipoDocumento} ` : "") + (item.payload?.nombre || "—")
                              : type === "errores"
                                ? (item.error_consulta || "—")
                                : item.estado_datos_vehiculo === true
                                  ? "Datos OK"
                                  : "Sin datos"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}