import { useEffect, useState, useCallback } from "react";
import { API_BASE } from "../config";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import * as XLSX from "xlsx";
import {
  MapPin,
  Users,
  Search,
  Car,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  TrendingUp,
  Download,
  FileText
} from "lucide-react";
import toast from "react-hot-toast";

const COLORS = {
  pageBg: "#E9F1FA",
  cardBg: "#FFFFFF",
  heroGradient: "linear-gradient(135deg, #00ABE4 0%, #0095C5 100%)",
  primary: "#00ABE4",
  textPrimary: "#1e293b",
  textSecondary: "#64748b",
  success: "#059669",
  error: "#dc2626",
  warning: "#d97706",
  border: "#e2e8f0"
};

const MODULOS = [
  { id: "todos", label: "Todos", icon: Search },
  { id: "consulta-placa", label: "Consulta Placa", icon: FileText },
  { id: "datos-vehiculo", label: "Datos Vehículo", icon: Car },
  { id: "personas-direcciones", label: "Direcciones", icon: MapPin },
  { id: "liquidacion", label: "Liquidaciones", icon: TrendingUp }
];

const MODULO_COLORS = {
  "consulta-placa": { bg: "#DBEAFE", text: "#1D4ED8" },
  "datos-vehiculo": { bg: "#D1FAE5", text: "#047857" },
  "personas-direcciones": { bg: "#FEF3C7", text: "#B45309" },
  liquidacion: { bg: "#EDE9FE", text: "#7C3AED" }
};

const MODULO_LABELS = {
  "consulta-placa": "Consulta Placa",
  "datos-vehiculo": "Datos Vehículo",
  "personas-direcciones": "Direcciones",
  liquidacion: "Liquidaciones"
};

const ITEMS_POR_PAGINA = 15;

function formatFechaColombia(fecha) {
  if (!fecha) return "—";
  const parsed = new Date(fecha);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleString("es-CO", { timeZone: "America/Bogota" });
}

function formatFechaCorta(fecha) {
  if (!fecha) return "—";
  const parsed = new Date(fecha);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleDateString("es-CO", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
}

const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/Bogota" });

export default function Historial() {
  const [registros, setRegistros] = useState([]);
  const [loading, setLoading] = useState(false);
  const [moduloActivo, setModuloActivo] = useState("todos");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [pageProgress, setPageProgress] = useState(1);
  const [meta, setMeta] = useState({ total: 0, totalPaginas: 0 });

  const buildUrl = useCallback(() => {
    const params = new URLSearchParams();
    if (moduloActivo !== "todos") params.set("modulo", moduloActivo);
    if (fechaInicio) params.set("fechaInicio", fechaInicio);
    if (fechaFin) params.set("fechaFin", fechaFin);
    params.set("pagina", String(pageProgress));
    params.set("limite", String(ITEMS_POR_PAGINA));
    return `${API_BASE}/historial?${params.toString()}`;
  }, [moduloActivo, fechaInicio, fechaFin, pageProgress]);

  const cargarHistorial = useCallback(async () => {
    try {
      setLoading(true);
      const url = buildUrl();
      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error cargando historial");
      }

      setRegistros(data.results || []);
      setMeta({
        total: data.total || 0,
        totalPaginas: data.totalPaginas || 0
      });
    } catch (err) {
      toast.error(err.message);
      setRegistros([]);
      setMeta({ total: 0, totalPaginas: 0 });
    } finally {
      setLoading(false);
    }
  }, [buildUrl]);

  // Recargar cuando cambia módulo (vuelve a página 1)
  useEffect(() => {
    setPageProgress(1);
  }, [moduloActivo, fechaInicio, fechaFin]);

  // Cargar datos cuando cambia página
  useEffect(() => {
    cargarHistorial();
  }, [cargarHistorial]);

  // Resumen
  const exitosas = registros.filter((r) => r.estado === true).length;
  const fallidas = registros.filter((r) => r.estado !== true).length;

  const exportarExcel = () => {
    try {
      const headers = [
        "Fecha", "Placa / Documento", "Módulo", "Estado", "Detalle",
        "Propietario", "Tipo Documento", "Número Documento",
        "Clase", "Marca", "Línea", "Modelo", "Color", "Servicio",
        "Nombres", "Apellidos", "Celular", "Correo",
        "Trámites"
      ];

      const wsData = [headers];

      for (const r of registros) {
        wsData.push([
          formatFechaColombia(r.fecha),
          r.placa_documento || "—",
          MODULO_LABELS[r.modulo] || r.modulo,
          r.estado === true ? "Exitosa" : "Fallida",
          r.estado === true ? "OK" : (r.detalle || "Error"),
          r.propietario || "—",
          r.tipo_documento_propietario || "—",
          r.numero_documento_propietario || "—",
          r.clase || "—",
          r.marca || "—",
          r.linea || "—",
          r.modelo || "—",
          r.color || "—",
          r.servicio || "—",
          r.nombres || "—",
          r.apellidos || "—",
          r.celular || "—",
          r.correo || "—",
          r.tramites || "—"
        ]);
      }

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(wsData);

      // Ancho de columnas
      ws["!cols"] = [
        { wch: 22 }, { wch: 16 }, { wch: 18 }, { wch: 10 }, { wch: 36 },
        { wch: 30 }, { wch: 14 }, { wch: 18 },
        { wch: 14 }, { wch: 18 }, { wch: 18 }, { wch: 8 }, { wch: 12 }, { wch: 14 },
        { wch: 20 }, { wch: 20 }, { wch: 16 }, { wch: 30 },
        { wch: 30 }
      ];

      XLSX.utils.book_append_sheet(wb, ws, "Historial");
      XLSX.writeFile(wb, `historial_${new Date().toISOString().split("T")[0]}.xlsx`);
      toast.success("Excel exportado correctamente");
    } catch (err) {
      toast.error("Error exportando Excel: " + err.message);
    }
  };

  const handleRefresh = () => {
    cargarHistorial();
  };

  const totalPaginas = Math.max(1, meta.totalPaginas);
  const totalRegistros = meta.total;

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8" style={{ backgroundColor: COLORS.pageBg }}>
      <div className="max-w-7xl mx-auto space-y-6">

        {/* HERO SECTION */}
        <section
          className="relative overflow-hidden rounded-3xl p-6 md:p-8 text-white shadow-2xl"
          style={{ background: COLORS.heroGradient }}
        >
          <div className="absolute top-4 right-4 opacity-20">
            <Clock size={100} />
          </div>
          <div className="relative z-10">
            <p className="text-blue-100 text-sm font-medium flex items-center gap-2">
              <Clock size={16} />
              Historial General
            </p>
            <h2 className="text-3xl md:text-4xl font-bold mt-2">
              Registro de Consultas
            </h2>
            <p className="text-blue-100 mt-3 max-w-3xl">
              Consulta el historial de todas las operaciones realizadas en el sistema.
              Filtra por módulo y rango de fechas para encontrar registros específicos.
            </p>
          </div>
        </section>

        {/* RESUMEN DE ACTIVIDAD */}
        <section className="grid grid-cols-3 gap-4">
          <div className="rounded-3xl p-5 shadow-sm" style={{ backgroundColor: COLORS.cardBg, boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)" }}>
            <div className="flex items-center gap-2 mb-2">
              <Users size={18} style={{ color: COLORS.primary }} />
              <span className="text-xs font-medium" style={{ color: COLORS.textSecondary }}>Total Registros</span>
            </div>
            <p className="text-2xl font-bold" style={{ color: COLORS.textPrimary }}>{totalRegistros}</p>
          </div>

          <div className="rounded-3xl p-5 shadow-sm" style={{ backgroundColor: COLORS.cardBg, boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)" }}>
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle size={18} style={{ color: COLORS.success }} />
              <span className="text-xs font-medium" style={{ color: COLORS.textSecondary }}>Exitosas</span>
            </div>
            <p className="text-2xl font-bold" style={{ color: COLORS.success }}>{exitosas}</p>
          </div>

          <div className="rounded-3xl p-5 shadow-sm" style={{ backgroundColor: COLORS.cardBg, boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)" }}>
            <div className="flex items-center gap-2 mb-2">
              <XCircle size={18} style={{ color: COLORS.error }} />
              <span className="text-xs font-medium" style={{ color: COLORS.textSecondary }}>Fallidas</span>
            </div>
            <p className="text-2xl font-bold" style={{ color: COLORS.error }}>{fallidas}</p>
          </div>
        </section>

        {/* FILTROS */}
        <section
          className="rounded-3xl p-4 md:p-6 shadow-sm"
          style={{
            backgroundColor: COLORS.cardBg,
            boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)"
          }}
        >
          <div className="flex flex-wrap items-start justify-between gap-4">

            {/* Filtro por módulo */}
            <div className="flex flex-wrap gap-2">
              {MODULOS.map((mod) => {
                const Icon = mod.icon;
                return (
                  <button
                    key={mod.id}
                    onClick={() => setModuloActivo(mod.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      moduloActivo === mod.id
                        ? "text-white shadow-md"
                        : "border"
                    }`}
                    style={
                      moduloActivo === mod.id
                        ? { backgroundColor: COLORS.primary }
                        : { borderColor: COLORS.border, color: COLORS.textSecondary }
                    }
                  >
                    <Icon size={14} />
                    {mod.label}
                  </button>
                );
              })}
            </div>

            {/* Filtro por rango de fechas */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium" style={{ color: COLORS.textSecondary }}>Desde</label>
                  <input
                    type="date"
                    max={today}
                    value={fechaInicio}
                    onChange={(e) => setFechaInicio(e.target.value)}
                    className="px-3 py-2 rounded-xl border text-sm"
                    style={{ borderColor: COLORS.border }}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs font-medium" style={{ color: COLORS.textSecondary }}>Hasta</label>
                  <input
                    type="date"
                    max={today}
                    value={fechaFin}
                    onChange={(e) => setFechaFin(e.target.value)}
                    className="px-3 py-2 rounded-xl border text-sm"
                    style={{ borderColor: COLORS.border }}
                  />
              </div>

              <button
                onClick={handleRefresh}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white transition-all"
                style={{ backgroundColor: COLORS.primary }}
              >
                <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                Actualizar
              </button>

              {(fechaInicio || fechaFin) && (
                <button
                  onClick={() => {
                    setFechaInicio("");
                    setFechaFin("");
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all"
                  style={{ borderColor: COLORS.border }}
                >
                  Limpiar Fechas
                </button>
              )}

              <button
                onClick={exportarExcel}
                disabled={registros.length === 0}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all disabled:opacity-50"
                style={{ borderColor: COLORS.border }}
              >
                <Download size={14} />
                Excel
              </button>
            </div>
          </div>
        </section>

        {/* TABLA CON SWIPER */}
        <section
          className="rounded-3xl p-4 md:p-6 shadow-sm"
          style={{
            backgroundColor: COLORS.cardBg,
            boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)"
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold" style={{ color: COLORS.textPrimary }}>
              Registros ({totalRegistros})
            </h3>
            <span className="text-sm" style={{ color: COLORS.textSecondary }}>
              Página {pageProgress} de {totalPaginas}
            </span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 size={32} className="animate-spin" style={{ color: COLORS.primary }} />
            </div>
          ) : registros.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400">
              <AlertCircle size={48} className="mb-4 opacity-50" />
              <p className="text-lg font-medium">Sin registros</p>
              <p className="text-sm">No hay consultas realizadas para este filtro</p>
            </div>
          ) : (
            <Swiper
              modules={[Navigation]}
              navigation={true}
              onSlideChange={(swiper) => setPageProgress(swiper.activeIndex + 1)}
              spaceBetween={20}
              slidesPerView={1}
              className="mySwiper"
            >
              {registros.map((item, index) => {
                const modColor = MODULO_COLORS[item.modulo] || { bg: "#F1F5F9", text: "#64748B" };
                return (
                  <SwiperSlide key={`${item.modulo}-${item.placa_documento}-${index}`}>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr style={{ backgroundColor: COLORS.pageBg }}>
                            <th className="py-3 px-4 text-left font-semibold" style={{ color: COLORS.textSecondary }}>
                              Fecha
                            </th>
                            <th className="py-3 px-4 text-left font-semibold" style={{ color: COLORS.textSecondary }}>
                              Placa / Documento
                            </th>
                            <th className="py-3 px-4 text-left font-semibold" style={{ color: COLORS.textSecondary }}>
                              Módulo
                            </th>
                            <th className="py-3 px-4 text-left font-semibold" style={{ color: COLORS.textSecondary }}>
                              Estado
                            </th>
                            <th className="py-3 px-4 text-left font-semibold" style={{ color: COLORS.textSecondary }}>
                              Detalle
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-t" style={{ borderColor: COLORS.border }}>
                            <td className="py-3 px-4 whitespace-nowrap" style={{ color: COLORS.textSecondary }}>
                              <span title={formatFechaColombia(item.fecha)}>
                                {formatFechaCorta(item.fecha)}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-mono font-bold" style={{ color: COLORS.textPrimary }}>
                              {item.placa_documento || "—"}
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className="px-2 py-1 rounded-full text-xs font-medium"
                                style={{
                                  backgroundColor: modColor.bg,
                                  color: modColor.text
                                }}
                              >
                                {MODULO_LABELS[item.modulo] || item.modulo}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              {item.estado === true ? (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                  <CheckCircle size={12} /> OK
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                  <XCircle size={12} /> Error
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-xs max-w-[240px] truncate" style={{ color: COLORS.textSecondary }}>
                              {item.estado === true
                                ? "Consulta exitosa"
                                : (item.detalle || "Error desconocido")}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </SwiperSlide>
                );
              })}
            </Swiper>
          )}

        </section>
      </div>
    </div>
  );
}

function Loader2({ size, className }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
