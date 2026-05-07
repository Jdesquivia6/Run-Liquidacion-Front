import { useEffect, useState } from "react";
import {
  Car,
  CheckCircle2,
  XCircle,
  Clock,
  Database,
  AlertTriangle
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
    <div className="space-y-6">
      <section className="rounded-3xl p-6 md:p-8 text-white shadow-xl bg-gradient-to-br from-slate-950 via-blue-950 to-blue-700">
        <p className="text-blue-200 text-sm font-medium">
          Sistema institucional de consulta
        </p>

        <h2 className="text-3xl md:text-4xl font-bold mt-2">
          Centro de inteligencia vehicular
        </h2>

        <p className="text-slate-300 mt-3 max-w-3xl">
          Indicadores tipo BI para seguimiento de consultas, rendimiento del scraper,
          errores, trazabilidad y estado operativo.
        </p>
      </section>

      <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 md:p-6">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-4 items-end">
          <div>
            <label className="text-sm font-semibold text-slate-700">
              Fecha inicio
            </label>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700">
              Fecha fin
            </label>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
            />
          </div>

          <button
            onClick={cargarDashboard}
            disabled={loading}
            className="h-12 bg-slate-900 hover:bg-blue-700 disabled:bg-slate-400 text-white px-6 rounded-2xl font-semibold"
          >
            {loading ? "Cargando..." : "Actualizar"}
          </button>
        </div>
      </section>

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

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-lg font-bold text-slate-900">
            Consultas por día
          </h3>
          <p className="text-slate-500 text-sm mt-1">
            Evolución diaria de registros, exitosas y pendientes.
          </p>

          <div className="mt-6 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dashboard.porDia}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="fecha" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="total" stroke="#2563eb" strokeWidth={3} />
                <Line type="monotone" dataKey="exitosas" stroke="#059669" strokeWidth={3} />
                <Line type="monotone" dataKey="pendientes" stroke="#d97706" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-lg font-bold text-slate-900">
            Distribución de estados
          </h3>
          <p className="text-slate-500 text-sm mt-1">
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
                      fill={["#059669", "#d97706", "#2563eb", "#dc2626"][index]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-lg font-bold text-slate-900">
            Rendimiento por módulo
          </h3>

          <div className="mt-6 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={moduloData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="total" fill="#2563eb" radius={[8, 8, 0, 0]} />
                <Bar dataKey="exitosas" fill="#059669" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-lg font-bold text-slate-900">
            Estado del sistema
          </h3>

          <div className="mt-5 space-y-4">
            <StatusRow label="API backend" value="Activa" status="success" />
            <StatusRow label="Scraper RUNT" value="Disponible" status="info" />
            <StatusRow label="Base de datos" value="Conectada" status="success" />
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <TableCard title="Últimas consultas" rows={dashboard.ultimas} type="ultimas" />
        <TableCard title="Últimos errores" rows={dashboard.errores} type="errores" />
      </section>
    </div>
  );
}

function StatusRow({ label, value, status }) {
  const colors = {
    success: "text-emerald-600",
    info: "text-blue-600",
    error: "text-red-600"
  };

  return (
    <div className="flex justify-between text-sm">
      <span className="text-slate-500">{label}</span>
      <span className={`${colors[status]} font-semibold`}>{value}</span>
    </div>
  );
}

function TableCard({ title, rows = [], type }) {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
      <h3 className="text-lg font-bold text-slate-900">{title}</h3>

      <div className="mt-5 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-slate-500 border-b">
            <tr>
              <th className="py-3 text-left">Placa</th>
              <th className="py-3 text-left">Estado</th>
              <th className="py-3 text-left">Detalle</th>
            </tr>
          </thead>

          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan="3" className="py-6 text-center text-slate-400">
                  Sin registros
                </td>
              </tr>
            ) : (
              rows.map((item, index) => (
                <tr key={index} className="border-b last:border-0">
                  <td className="py-3 font-bold text-slate-800">
                    {item.placa}
                  </td>
                  <td className="py-3">
                    {type === "errores"
                      ? "Error"
                      : item.estado_consulta
                        ? "Consultada"
                        : "Pendiente"}
                  </td>
                  <td className="py-3 text-slate-500 max-w-xs truncate">
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