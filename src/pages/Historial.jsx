import { useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
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
  Filter,
  Download,
  TrendingUp
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
  { id: "todos", label: "Todos", icon: Filter },
  { id: "consulta-placa", label: "Consulta Placa", icon: Search },
  { id: "datos-vehiculo", label: "Datos Vehículo", icon: Car },
  { id: "personas-direcciones", label: "Direcciones", icon: MapPin },
  { id: "liquidacion", label: "Liquidaciones", icon: TrendingUp }
];

const ITEMS_POR_PAGINA = 10;

export default function Historial() {
  const [registros, setRegistros] = useState([]);
  const [loading, setLoading] = useState(false);
  const [moduloActivo, setModuloActivo] = useState("todos");
  const [filtroFecha, setFiltroFecha] = useState("");
  const [pageProgress, setPageProgress] = useState(1);

  const cargarHistorial = async () => {
    try {
      setLoading(true);
      
      let url = "http://84.247.165.214:3000/api/historial-vehiculos";
      
      if (moduloActivo !== "todos") {
        url = `http://84.247.165.214:3000/api/historial-vehiculos?modulo=${moduloActivo}`;
      }

      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error cargando historial");
      }

      let items = data.results || [];

      // Filtro por fecha si se selecciona
      if (filtroFecha) {
        items = items.filter((item) => {
          const fechaItem = item.fecha?.split("T")[0];
          return fechaItem === filtroFecha;
        });
      }

      setRegistros(items);
      setPageProgress(1);

    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarHistorial();
  }, [moduloActivo]);

  const totalPaginas = Math.max(1, Math.ceil(registros.length / ITEMS_POR_PAGINA));

  const registrosPagina = registros.slice(
    (pageProgress - 1) * ITEMS_POR_PAGINA,
    pageProgress * ITEMS_POR_PAGINA
  );

  const resumenModulo = {
    total: registros.length,
    exitosas: registros.filter((r) => r.ok || r.estado_consulta).length,
    fallidas: registros.filter((r) => !r.ok && !r.estado_consulta).length
  };

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
              Filtra por módulo y fecha para encontrar registros específicos.
            </p>
          </div>
        </section>

        {/* RESUMEN DE ACTIVIDAD */}
        <section className="grid grid-cols-3 lg:grid-cols-3 gap-4">
          <div className="rounded-3xl p-5 shadow-sm" style={{ backgroundColor: COLORS.cardBg, boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)" }}>
            <div className="flex items-center gap-2 mb-2">
              <Users size={18} style={{ color: COLORS.primary }} />
              <span className="text-xs font-medium" style={{ color: COLORS.textSecondary }}>Total Registros</span>
            </div>
            <p className="text-2xl font-bold" style={{ color: COLORS.textPrimary }}>{resumenModulo.total}</p>
          </div>

          <div className="rounded-3xl p-5 shadow-sm" style={{ backgroundColor: COLORS.cardBg, boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)" }}>
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle size={18} style={{ color: COLORS.success }} />
              <span className="text-xs font-medium" style={{ color: COLORS.textSecondary }}>Exitosas</span>
            </div>
            <p className="text-2xl font-bold" style={{ color: COLORS.success }}>{resumenModulo.exitosas}</p>
          </div>

          <div className="rounded-3xl p-5 shadow-sm" style={{ backgroundColor: COLORS.cardBg, boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)" }}>
            <div className="flex items-center gap-2 mb-2">
              <XCircle size={18} style={{ color: COLORS.error }} />
              <span className="text-xs font-medium" style={{ color: COLORS.textSecondary }}>Fallidas</span>
            </div>
            <p className="text-2xl font-bold" style={{ color: COLORS.error }}>{resumenModulo.fallidas}</p>
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
          <div className="flex flex-wrap items-center justify-between gap-4">
            
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

            {/* Filtro por fecha */}
            <div className="flex items-center gap-3">
              <input
                type="date"
                value={filtroFecha}
                onChange={(e) => setFiltroFecha(e.target.value)}
                className="px-4 py-2 rounded-xl border text-sm"
                style={{ borderColor: COLORS.border }}
              />

              <button
                onClick={cargarHistorial}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white transition-all"
                style={{ backgroundColor: COLORS.primary }}
              >
                <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                Actualizar
              </button>

              {filtroFecha && (
                <button
                  onClick={() => {
                    setFiltroFecha("");
                    cargarHistorial();
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all"
                  style={{ borderColor: COLORS.border }}
                >
                  Limpiar Fecha
                </button>
              )}
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
              Registros ({registros.length})
            </h3>
            
            {/* Indicador de página */}
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
              modules={[Pagination, Navigation]}
              pagination={{
                type: "progressbar",
                progressbarFillClass: "swiper-pagination-progressbar-fill",
              }}
              navigation={{
                prevEl: ".swiper-button-prev",
                nextEl: ".swiper-button-next"
              }}
              onSlideChange={(swiper) => setPageProgress(swiper.activeIndex + 1)}
              spaceBetween={20}
              slidesPerView={1}
              className="pb-12"
            >
              {registrosPagina.map((item, index) => (
                <SwiperSlide key={index}>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr style={{ backgroundColor: COLORS.pageBg }}>
                          <th className="py-3 px-4 text-left font-semibold" style={{ color: COLORS.textSecondary }}>Fecha</th>
                          <th className="py-3 px-4 text-left font-semibold" style={{ color: COLORS.textSecondary }}>Placa / Documento</th>
                          <th className="py-3 px-4 text-left font-semibold" style={{ color: COLORS.textSecondary }}>Módulo</th>
                          <th className="py-3 px-4 text-left font-semibold" style={{ color: COLORS.textSecondary }}>Estado</th>
                          <th className="py-3 px-4 text-left font-semibold" style={{ color: COLORS.textSecondary }}>Detalle</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-t" style={{ borderColor: COLORS.border }}>
                          <td className="py-3 px-4" style={{ color: COLORS.textSecondary }}>
                            {item.fecha ? new Date(item.fecha).toLocaleString("es-CO") : "—"}
                          </td>
                          <td className="py-3 px-4 font-mono font-bold" style={{ color: COLORS.textPrimary }}>
                            {item.placa || item.numero_documento || "—"}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className="px-2 py-1 rounded-full text-xs font-medium"
                              style={{
                                backgroundColor: COLORS.pageBg,
                                color: COLORS.primary
                              }}
                            >
                              {item.tipo_modulo || moduloActivo}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {item.ok || item.estado_consulta ? (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                <CheckCircle size={12} /> OK
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                <XCircle size={12} /> Error
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-xs truncate max-w-[200px]" style={{ color: COLORS.textSecondary }}>
                            {item.message || item.error_consulta || item.error || "—"}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          )}

          {/* Controles manuales por si falla el Swiper */}
          <div className="flex items-center justify-between mt-4">
            <button
              onClick={() => setPageProgress(Math.max(1, pageProgress - 1))}
              disabled={pageProgress === 1}
              className="px-4 py-2 rounded-xl text-sm font-medium border disabled:opacity-50"
              style={{ borderColor: COLORS.border }}
            >
              Anterior
            </button>
            
            <div className="flex items-center gap-2">
              {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((num) => (
                <button
                  key={num}
                  onClick={() => setPageProgress(num)}
                  className={`w-8 h-8 rounded-lg text-xs font-medium transition-all ${
                    pageProgress === num ? "text-white" : "border"
                  }`}
                  style={
                    pageProgress === num
                      ? { backgroundColor: COLORS.primary }
                      : { borderColor: COLORS.border, color: COLORS.textSecondary }
                  }
                >
                  {num}
                </button>
              ))}
            </div>

            <button
              onClick={() => setPageProgress(Math.min(totalPaginas, pageProgress + 1))}
              disabled={pageProgress === totalPaginas}
              className="px-4 py-2 rounded-xl text-sm font-medium border disabled:opacity-50"
              style={{ borderColor: COLORS.border }}
            >
              Siguiente
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

// Icono faltante
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