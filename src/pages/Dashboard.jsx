import { useEffect, useState } from "react";
import { Download, RefreshCw, CalendarDays, Clock, TrendingUp, CheckCircle, AlertCircle } from "lucide-react";
import {
  Car,
  CheckCircle2,
  XCircle,
  Database,
  AlertTriangle,
  Search,
  Car as CarIcon
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
  return fecha.toLocaleDateString("es-CO", { timeZone: "America/Bogota" }).split('/').reverse().join('-');
}

export default function Dashboard() {
  // Helper para calcular fechas (en hora Colombia)
  const getFecha30DiasAtras = () => getFechaColombia(30);

  const [fechaInicio, setFechaInicio] = useState(getFecha30DiasAtras());
  const [fechaFin, setFechaFin] = useState(getFechaColombia(0));
  const [modoFiltrado, setModoFiltrado] = useState(false); //false = Modo Global (resumen sin filtro + carruseles filtrados)
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [dashboard, setDashboard] = useState({
    resumenGlobal: {},     // Siempre todos los datos (sin filtro)
    resumen: {},          // Datos del período seleccionado
    porDia: [],
    ultimas: [],
    errores: []
  });

  const cargarDashboard = async () => {
    try {
      setLoading(true);

      // Siempre cargar resumen GLOBAL (sin filtro de fechas)
      const paramsGlobal = {};
      const respGlobal = await obtenerDashboard(paramsGlobal);

      // Cargar datos del período seleccionado
      const paramsFiltrado = {
        fechaInicio: modoFiltrado ? fechaInicio : getFecha30DiasAtras(),
        fechaFin: modoFiltrado ? fechaFin : getFechaColombia(0)
      };
      const respFiltrado = await obtenerDashboard(paramsFiltrado);

      setDashboard({
        resumenGlobal: respGlobal.resumen || {},  // Todos los datos históricos
        resumen: respFiltrado.resumen || {},       // Datos del período
        porDia: respFiltrado.porDia || [],
        ultimas: (respFiltrado.ultimas || []).slice(0, 50),
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
      
      // Siempre exportar del período seleccionado ( filtrado o 30 días por defecto)
      const params = {
        fechaInicio: modoFiltrado ? fechaInicio : getFecha30DiasAtras(),
        fechaFin: modoFiltrado ? fechaFin : getFechaColombia(0)
      };

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
    // Recargar datos filtrados cuando cambia el modo o las fechas
    const recargarFiltrado = async () => {
      try {
        setLoading(true);
        const params = {
          // Modo Filtrado = fechas elegidas, Modo Global = últimos 30 días
          fechaInicio: modoFiltrado ? fechaInicio : getFecha30DiasAtras(),
          fechaFin: modoFiltrado ? fechaFin : getFechaColombia(0)
        };
        const resp = await obtenerDashboard(params);
        setDashboard(prev => ({
          ...prev,
          resumen: resp.resumen || {},         // Datos del período actual
          porDia: resp.porDia || [],
          ultimas: (resp.ultimas || []).slice(0, 50),
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

  // Calcular datos para dona (del resumen GLOBAL - siempre sin filtro)
  const estadoData = [
    { name: "Exitosas", value: Number(resumenGlobal.consultas_exitosas || 0), color: COLORS.success },
    { name: "Pendientes", value: Number(resumenGlobal.pendientes || 0), color: COLORS.warning },
    { name: "Datos OK", value: Number(resumenGlobal.datos_vehiculo_exitosos || 0), color: COLORS.primary },
    { name: "Errores", value: Number(resumenGlobal.datos_vehiculo_fallidos || 0), color: COLORS.error }
  ];

  // Calcular totales (del resumen GLOBAL)
  const totalConsultas = Number(resumenGlobal.total_placas || 0);
  const exitosasConsultas = Number(resumenGlobal.consultas_exitosas || 0);
  const pendientesConsultas = Number(resumenGlobal.pendientes || 0);
  const totalVehiculos = Number(resumenGlobal.datos_vehiculo_total || 0);
  const exitosasVehiculos = Number(resumenGlobal.datos_vehiculo_exitosos || 0);
  const fallidosVehiculos = Number(resumenGlobal.datos_vehiculo_fallidos || 0);

  // Porcentajes
  const pctExitoConsultas = totalConsultas > 0 ? Math.round((exitosasConsultas / totalConsultas) * 100) : 0;
  const pctExitoVehiculos = totalVehiculos > 0 ? Math.round((exitosasVehiculos / totalVehiculos) * 100) : 0;

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

        {/* STAT CARDS */}
        {/* <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-4">
          <StatCard title="Placas registradas" value={resumen.total_placas || 0} icon={Car} color="blue" />
          <StatCard title="Consulta placa OK" value={resumen.consultas_exitosas || 0} icon={CheckCircle2} color="green" />
          <StatCard title="Pendientes placa" value={resumen.pendientes || 0} icon={Clock} color="amber" />
          <StatCard title="Datos vehículo" value={resumen.datos_vehiculo_total || 0} icon={Database} color="blue" />
          <StatCard title="Datos vehículo OK" value={resumen.datos_vehiculo_exitosos || 0} icon={CheckCircle2} color="green" />
          <StatCard title="Errores datos" value={resumen.datos_vehiculo_fallidos || 0} icon={XCircle} color="red" />
        </section> */}

        {/* RESUMEN DE ACTIVIDAD (Reemplaza el gráfico de líneas) */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card Total Consultas */}
          <div className="rounded-3xl p-5 shadow-sm" style={{ backgroundColor: COLORS.cardBg, boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)" }}>
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-[#00ABE4]/10 flex items-center justify-center">
                <TrendingUp size={20} className="text-[#00ABE4]" />
              </div>
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-green-100 text-green-700">
                +12%
              </span>
            </div>
            <p className="text-3xl font-bold" style={{ color: COLORS.textPrimary }}>
              {totalConsultas.toLocaleString()}
            </p>
            <p className="text-sm" style={{ color: COLORS.textSecondary }}>Total consultas</p>
          </div>

          {/* Card Exitosas */}
          <div className="rounded-3xl p-5 shadow-sm" style={{ backgroundColor: COLORS.cardBg, boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)" }}>
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                <CheckCircle size={20} className="text-green-600" />
              </div>
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-green-100 text-green-700">
                +8%
              </span>
            </div>
            <p className="text-3xl font-bold" style={{ color: COLORS.success }}>
              {exitosasConsultas.toLocaleString()}
            </p>
            <p className="text-sm" style={{ color: COLORS.textSecondary }}>Exitosas</p>
          </div>

          {/* Card Pendientes */}
          <div className="rounded-3xl p-5 shadow-sm" style={{ backgroundColor: COLORS.cardBg, boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)" }}>
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                <Clock size={20} className="text-amber-600" />
              </div>
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-amber-100 text-amber-700">
                -5%
              </span>
            </div>
            <p className="text-3xl font-bold" style={{ color: COLORS.warning }}>
              {pendientesConsultas.toLocaleString()}
            </p>
            <p className="text-sm" style={{ color: COLORS.textSecondary }}>Pendientes</p>
          </div>

          {/* Card Tasa de Éxito */}
          <div className="rounded-3xl p-5 shadow-sm" style={{ backgroundColor: COLORS.cardBg, boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)" }}>
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                <TrendingUp size={20} className="text-emerald-600" />
              </div>
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">
                +3%
              </span>
            </div>
            <p className="text-3xl font-bold" style={{ color: COLORS.textPrimary }}>
              {totalConsultas > 0 ? Math.round((exitosasConsultas / totalConsultas) * 100) : 0}%
            </p>
            <p className="text-sm" style={{ color: COLORS.textSecondary }}>Tasa de éxito</p>
          </div>
        </section>

        {/* RESUMEN POR MÓDULO + DONA */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          
          {/* Cards de Módulos */}
          <div className="lg:col-span-2 space-y-4">
            
            {/* Card Consulta de Placas */}
            <div className="rounded-3xl p-6 shadow-sm" style={{ backgroundColor: COLORS.cardBg, boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)" }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#00ABE4]/10 flex items-center justify-center">
                  <Search size={20} className="text-[#00ABE4]" />
                </div>
                <div>
                  <h3 className="font-bold" style={{ color: COLORS.textPrimary }}>Consulta de Placas</h3>
                  <p className="text-xs" style={{ color: COLORS.textSecondary }}>Total de consultas realizadas</p>
                </div>
              </div>

              {/* Barra de progreso */}
              <div className="mb-4">
                <div className="flex justify-between text-xs mb-1">
                  <span style={{ color: COLORS.textSecondary }}>Tasa de éxito</span>
                  <span className="font-bold" style={{ color: pctExitoConsultas >= 80 ? COLORS.success : pctExitoConsultas >= 50 ? COLORS.warning : COLORS.error }}>
                    {pctExitoConsultas}%
                  </span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-500"
                    style={{ 
                      width: `${pctExitoConsultas}%`,
                      backgroundColor: pctExitoConsultas >= 80 ? COLORS.success : pctExitoConsultas >= 50 ? COLORS.warning : COLORS.error
                    }}
                  />
                </div>
              </div>

              {/* Números */}
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 rounded-xl" style={{ backgroundColor: COLORS.pageBg }}>
                  <p className="text-2xl font-bold" style={{ color: COLORS.textPrimary }}>{totalConsultas.toLocaleString()}</p>
                  <p className="text-xs" style={{ color: COLORS.textSecondary }}>Total</p>
                </div>
                <div className="text-center p-3 rounded-xl" style={{ backgroundColor: '#ECFDF5' }}>
                  <p className="text-2xl font-bold" style={{ color: COLORS.success }}>{exitosasConsultas.toLocaleString()}</p>
                  <p className="text-xs" style={{ color: COLORS.success }}>Exitosas</p>
                </div>
                <div className="text-center p-3 rounded-xl" style={{ backgroundColor: '#FEF3C7' }}>
                  <p className="text-2xl font-bold" style={{ color: COLORS.warning }}>{pendientesConsultas.toLocaleString()}</p>
                  <p className="text-xs" style={{ color: COLORS.warning }}>Pendientes</p>
                </div>
              </div>
            </div>

            {/* Card Datos del Vehículo */}
            <div className="rounded-3xl p-6 shadow-sm" style={{ backgroundColor: COLORS.cardBg, boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)" }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#059669]/10 flex items-center justify-center">
                  <CarIcon size={20} className="text-[#059669]" />
                </div>
                <div>
                  <h3 className="font-bold" style={{ color: COLORS.textPrimary }}>Datos del Vehículo</h3>
                  <p className="text-xs" style={{ color: COLORS.textSecondary }}>Consultas de información vehicular</p>
                </div>
              </div>

              {/* Barra de progreso */}
              <div className="mb-4">
                <div className="flex justify-between text-xs mb-1">
                  <span style={{ color: COLORS.textSecondary }}>Tasa de éxito</span>
                  <span className="font-bold" style={{ color: pctExitoVehiculos >= 80 ? COLORS.success : pctExitoVehiculos >= 50 ? COLORS.warning : COLORS.error }}>
                    {pctExitoVehiculos}%
                  </span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-500"
                    style={{ 
                      width: `${pctExitoVehiculos}%`,
                      backgroundColor: pctExitoVehiculos >= 80 ? COLORS.success : pctExitoVehiculos >= 50 ? COLORS.warning : COLORS.error
                    }}
                  />
                </div>
              </div>

              {/* Números */}
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 rounded-xl" style={{ backgroundColor: COLORS.pageBg }}>
                  <p className="text-2xl font-bold" style={{ color: COLORS.textPrimary }}>{totalVehiculos.toLocaleString()}</p>
                  <p className="text-xs" style={{ color: COLORS.textSecondary }}>Total</p>
                </div>
                <div className="text-center p-3 rounded-xl" style={{ backgroundColor: '#ECFDF5' }}>
                  <p className="text-2xl font-bold" style={{ color: COLORS.success }}>{exitosasVehiculos.toLocaleString()}</p>
                  <p className="text-xs" style={{ color: COLORS.success }}>Exitosas</p>
                </div>
                <div className="text-center p-3 rounded-xl" style={{ backgroundColor: '#FEE2E2' }}>
                  <p className="text-2xl font-bold" style={{ color: COLORS.error }}>{fallidosVehiculos.toLocaleString()}</p>
                  <p className="text-xs" style={{ color: COLORS.error }}>Fallidas</p>
                </div>
              </div>
            </div>
          </div>

          {/* Dona simplificada */}
          <div className="rounded-3xl p-6 shadow-sm" style={{ backgroundColor: COLORS.cardBg, boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)" }}>
            <h3 className="text-lg font-bold mb-4" style={{ color: COLORS.textPrimary }}>Distribución de Estados</h3>

            {/* Dona */}
            <div className="relative flex justify-center mb-6">
              <ResponsiveContainer width={180} height={180}>
                <PieChart>
                  <Pie
                    data={estadoData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
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
              {/* Centro de la dona */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <p className="text-2xl font-bold" style={{ color: COLORS.textPrimary }}>
                    {estadoData.reduce((acc, d) => acc + d.value, 0).toLocaleString()}
                  </p>
                  <p className="text-xs" style={{ color: COLORS.textSecondary }}>Total</p>
                </div>
              </div>
            </div>

            {/* Leyenda */}
            <div className="space-y-3">
              {estadoData.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm" style={{ color: COLORS.textSecondary }}>{item.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold" style={{ color: COLORS.textPrimary }}>{item.value.toLocaleString()}</span>
                    <span className="text-xs" style={{ color: COLORS.textSecondary }}>
                      ({totalConsultas > 0 ? Math.round((item.value / totalConsultas) * 100) : 0}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Indicador de estado del sistema */}
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
          <QueryCarousel title="Últimas consultas" rows={dashboard.ultimas} type="ultimas" />
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
                      <th className="py-2 px-3 text-left font-semibold" style={{ color: COLORS.textSecondary }}>Placa</th>
                      <th className="py-2 px-3 text-left font-semibold" style={{ color: COLORS.textSecondary }}>Estado</th>
                      <th className="py-2 px-3 text-left font-semibold" style={{ color: COLORS.textSecondary }}>Detalle</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagina.map((item, index) => (
                      <tr key={index} className="border-t" style={{ borderColor: COLORS.border }}>
                        <td className="py-2 px-3 font-bold" style={{ color: COLORS.textPrimary }}>
                          {item.placa}
                        </td>
                        <td className="py-2 px-3">
                          {type === "errores" ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                              <XCircle size={10} className="mr-1" />Error
                            </span>
                          ) : item.estado_consulta ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                              <CheckCircle2 size={10} className="mr-1" />OK
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                              <Clock size={10} className="mr-1" />Pendiente
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3 truncate max-w-[150px]" style={{ color: COLORS.textSecondary }}>
                          {type === "errores" 
                            ? item.error_consulta 
                            : item.estado_datos_vehiculo === true 
                              ? "Datos OK" 
                              : "Sin datos"}
                        </td>
                      </tr>
                    ))}
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