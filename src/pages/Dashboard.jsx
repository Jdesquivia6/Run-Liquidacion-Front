import { useEffect, useState } from "react";
import {
  Car,
  CheckCircle2,
  XCircle,
  Clock,
  Database,
  AlertTriangle,
  TrendingUp,
  Activity,
  BarChart3
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend
} from "recharts";
import StatCard from "../components/StatCard";
import { obtenerDashboard } from "../services/vehicleQueryApi";

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

export default function Dashboard() {
  const today = new Date().toISOString().slice(0, 10);

  const [fechaInicio, setFechaInicio] = useState(today);
  const [fechaFin, setFechaFin] = useState(today);
  const [loading, setLoading] = useState(false);
  const [dashboard, setDashboard] = useState({
    resumen: {},
    porDia: [],
    ultimas: [],
    errores: []
  });

  const cargarDashboard = async () => {
    try {
      setLoading(true);

      const resp = await obtenerDashboard({
        fechaInicio,
        fechaFin
      });

      setDashboard({
        resumen: resp.resumen || {},
        porDia: resp.porDia || [],
        ultimas: resp.ultimas || [],
        errores: resp.errores || []
      });
    } catch (error) {
      console.error("Error cargando dashboard:", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDashboard();
  }, []);

  const resumen = dashboard.resumen;

  const estadoData = [
    {
      name: "Exitosas",
      value: Number(resumen.consultas_exitosas || 0)
    },
    {
      name: "Pendientes",
      value: Number(resumen.pendientes || 0)
    },
    {
      name: "Datos vehículo OK",
      value: Number(resumen.datos_vehiculo_exitosos || 0)
    },
    {
      name: "Datos vehículo error",
      value: Number(resumen.datos_vehiculo_fallidos || 0)
    }
  ];

  const moduloData = [
    {
      name: "Consulta placas",
      total: Number(resumen.total_placas || 0),
      exitosas: Number(resumen.consultas_exitosas || 0)
    },
    {
      name: "Datos vehículo",
      total: Number(resumen.datos_vehiculo_total || 0),
      exitosas: Number(resumen.datos_vehiculo_exitosos || 0)
    }
  ];

  return (
    <div
      className="min-h-screen p-4 md:p-6 lg:p-8"
      style={{ backgroundColor: COLORS.pageBg }}
    >
      <div className="max-w-7xl mx-auto space-y-6">
        {/* ===== HERO SECTION ===== */}
        <section
          className="relative overflow-hidden rounded-3xl p-6 md:p-8 text-white shadow-2xl"
          style={{ background: COLORS.heroGradient }}
        >
          {/* Iconos decorativos */}
          <div className="absolute top-4 right-4 md:right-8 opacity-20">
            <Activity size={120} />
          </div>
          <div className="absolute -bottom-4 -left-4 opacity-10">
            <BarChart3 size={100} />
          </div>

          <div className="relative z-10">
            <p className="text-blue-100 text-sm font-medium flex items-center gap-2">
              <TrendingUp size={16} />
              Sistema institucional de consulta
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

        {/* ===== FILTRO DE FECHAS ===== */}
        <section
          className="rounded-3xl p-4 md:p-6 shadow-sm"
          style={{
            backgroundColor: COLORS.cardBg,
            boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)"
          }}
        >
          <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-4 items-end">
            <div>
              <label
                className="text-sm font-semibold"
                style={{ color: COLORS.textPrimary }}
              >
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
              <label
                className="text-sm font-semibold"
                style={{ color: COLORS.textPrimary }}
              >
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

            <button
              onClick={cargarDashboard}
              disabled={loading}
              className="h-12 px-6 rounded-2xl font-semibold text-white transition-all hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                backgroundColor: loading ? COLORS.textSecondary : COLORS.primary
              }}
            >
              {loading ? "Cargando..." : "Actualizar"}
            </button>
          </div>
        </section>

        {/* ===== STAT CARDS ===== */}
        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-4">
          <StatCard
            title="Placas registradas"
            value={resumen.total_placas || 0}
            icon={Car}
            color="blue"
          />
          <StatCard
            title="Consulta placa OK"
            value={resumen.consultas_exitosas || 0}
            icon={CheckCircle2}
            color="green"
          />
          <StatCard
            title="Pendientes placa"
            value={resumen.pendientes || 0}
            icon={Clock}
            color="amber"
          />
          <StatCard
            title="Datos vehículo"
            value={resumen.datos_vehiculo_total || 0}
            icon={Database}
            color="blue"
          />
          <StatCard
            title="Datos vehículo OK"
            value={resumen.datos_vehiculo_exitosos || 0}
            icon={CheckCircle2}
            color="green"
          />
          <StatCard
            title="Errores datos"
            value={resumen.datos_vehiculo_fallidos || 0}
            icon={XCircle}
            color="red"
          />
        </section>

        {/* ===== GRÁFICOS: LINEA Y PIE ===== */}
        <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div
            className="xl:col-span-2 rounded-3xl p-6 shadow-sm"
            style={{
              backgroundColor: COLORS.cardBg,
              boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)"
            }}
          >
            <h3
              className="text-lg font-bold"
              style={{ color: COLORS.textPrimary }}
            >
              Consultas por día
            </h3>
            <p
              className="text-sm mt-1"
              style={{ color: COLORS.textSecondary }}
            >
              Evolución diaria de registros, exitosas y pendientes.
            </p>

            <div className="mt-6 h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dashboard.porDia}>
                  <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
                  <XAxis dataKey="fecha" tick={{ fill: COLORS.textSecondary, fontSize: 12 }} />
                  <YAxis tick={{ fill: COLORS.textSecondary, fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: COLORS.cardBg,
                      border: `1px solid ${COLORS.border}`,
                      borderRadius: 12,
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke={COLORS.primary}
                    strokeWidth={3}
                    dot={{ fill: COLORS.primary, strokeWidth: 2 }}
                    activeDot={{ r: 6, fill: COLORS.primary }}
                  />
                  <Line
                    type="monotone"
                    dataKey="exitosas"
                    stroke={COLORS.success}
                    strokeWidth={3}
                    dot={{ fill: COLORS.success, strokeWidth: 2 }}
                    activeDot={{ r: 6, fill: COLORS.success }}
                  />
                  <Line
                    type="monotone"
                    dataKey="pendientes"
                    stroke={COLORS.warning}
                    strokeWidth={3}
                    dot={{ fill: COLORS.warning, strokeWidth: 2 }}
                    activeDot={{ r: 6, fill: COLORS.warning }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div
            className="rounded-3xl p-6 shadow-sm"
            style={{
              backgroundColor: COLORS.cardBg,
              boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)"
            }}
          >
            <h3
              className="text-lg font-bold"
              style={{ color: COLORS.textPrimary }}
            >
              Distribución de estados
            </h3>
            <p
              className="text-sm mt-1"
              style={{ color: COLORS.textSecondary }}
            >
              Estado general de consultas.
            </p>

            <div className="mt-6 h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={estadoData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={4}
                  >
                    {estadoData.map((_, index) => (
                      <Cell
                        key={index}
                        fill={[COLORS.success, COLORS.warning, COLORS.primary, COLORS.error][index]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: COLORS.cardBg,
                      border: `1px solid ${COLORS.border}`,
                      borderRadius: 12,
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        {/* ===== GRÁFICOS: BARRAS Y ESTADO ===== */}
        <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div
            className="xl:col-span-2 rounded-3xl p-6 shadow-sm"
            style={{
              backgroundColor: COLORS.cardBg,
              boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)"
            }}
          >
            <h3
              className="text-lg font-bold"
              style={{ color: COLORS.textPrimary }}
            >
              Rendimiento por módulo
            </h3>

            <div className="mt-6 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={moduloData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
                  <XAxis dataKey="name" tick={{ fill: COLORS.textSecondary, fontSize: 12 }} />
                  <YAxis tick={{ fill: COLORS.textSecondary, fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: COLORS.cardBg,
                      border: `1px solid ${COLORS.border}`,
                      borderRadius: 12,
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
                    }}
                  />
                  <Legend />
                  <Bar
                    dataKey="total"
                    fill={COLORS.primary}
                    radius={[8, 8, 0, 0]}
                  />
                  <Bar
                    dataKey="exitosas"
                    fill={COLORS.success}
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div
            className="rounded-3xl p-6 shadow-sm"
            style={{
              backgroundColor: COLORS.cardBg,
              boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)"
            }}
          >
            <h3
              className="text-lg font-bold"
              style={{ color: COLORS.textPrimary }}
            >
              Estado del sistema
            </h3>

            <div className="mt-5 space-y-4">
              <StatusRow label="API backend" value="Activa" status="success" />
              <StatusRow label="Scraper RUNT" value="Disponible" status="info" />
              <StatusRow label="Base de datos" value="Conectada" status="success" />
            </div>
          </div>
        </section>

        {/* ===== TABLAS ===== */}
        <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <TableCard title="Últimas consultas" rows={dashboard.ultimas} type="ultimas" />
          <TableCard title="Últimos errores" rows={dashboard.errores} type="errores" />
        </section>
      </div>
    </div>
  );
}

function StatusRow({ label, value, status }) {
  const colors = {
    success: COLORS.success,
    info: COLORS.primary,
    error: COLORS.error
  };

  return (
    <div className="flex justify-between text-sm">
      <span style={{ color: COLORS.textSecondary }}>{label}</span>
      <span className="font-semibold" style={{ color: colors[status] }}>
        {value}
      </span>
    </div>
  );
}

function TableCard({ title, rows = [], type }) {
  return (
    <div
      className="rounded-3xl p-6 shadow-sm"
      style={{
        backgroundColor: COLORS.cardBg,
        boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)"
      }}
    >
      <h3
        className="text-lg font-bold"
        style={{ color: COLORS.textPrimary }}
      >
        {title}
      </h3>

      <div className="mt-5 overflow-x-auto">
        <table className="w-full text-sm">
          <thead
            className="border-b"
            style={{ borderColor: COLORS.border }}
          >
            <tr>
              <th className="py-3 text-left font-semibold" style={{ color: COLORS.textSecondary }}>
                Placa
              </th>
              <th className="py-3 text-left font-semibold" style={{ color: COLORS.textSecondary }}>
                Estado
              </th>
              <th className="py-3 text-left font-semibold" style={{ color: COLORS.textSecondary }}>
                Detalle
              </th>
            </tr>
          </thead>

          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={3}
                  className="py-6 text-center"
                  style={{ color: COLORS.textSecondary }}
                >
                  Sin registros
                </td>
              </tr>
            ) : (
              rows.map((item, index) => (
                <tr
                  key={index}
                  className="border-b last:border-0"
                  style={{ borderColor: COLORS.border }}
                >
                  <td className="py-3 font-bold" style={{ color: COLORS.textPrimary }}>
                    {item.placa}
                  </td>
                  <td className="py-3">
                    {type === "errores" ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                        <AlertTriangle size={12} className="mr-1" />
                        Error
                      </span>
                    ) : item.estado_consulta ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                        <CheckCircle2 size={12} className="mr-1" />
                        Consultada
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                        <Clock size={12} className="mr-1" />
                        Pendiente
                      </span>
                    )}
                  </td>
                  <td
                    className="py-3 max-w-xs truncate"
                    style={{ color: COLORS.textSecondary }}
                  >
                    {type === "errores"
                      ? item.error_consulta
                      : item.estado_datos_vehiculo === true
                        ? "Datos vehículo consultados"
                        : "Sin datos vehículo"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}