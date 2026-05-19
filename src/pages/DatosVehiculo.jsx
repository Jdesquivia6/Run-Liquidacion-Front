import { useEffect, useState } from "react";
import { consultarDatosVehiculoBatch, listarHistorialVehiculos } from "../services/vehicleQueryApi";
import { crearJob } from "../services/workerJobsApi";
import PendingPlatesPanel from "../components/PendingPlatesPanel";
import DetailModal from "../components/DetailModal";
import QueryHistoryTable from "../components/QueryHistoryTable";
import toast from "react-hot-toast";
import QueryResultsSwiper from "../components/QueryResultsSwiper";
import JobProgress from "../components/JobProgress";
import { Search, Loader2, Briefcase } from "lucide-react";

export default function DatosVehiculo() {
  const [placas, setPlacas] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingJob, setLoadingJob] = useState(false);
  const [resultados, setResultados] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [error, setError] = useState("");
  const [detalle, setDetalle] = useState(null);
  const [refrescarPendientesActual, setRefrescarPendientesActual] = useState(null);
  const [jobActual, setJobActual] = useState(null);

  const exitosas = resultados.filter((r) => r.ok).length;
  const fallidas = resultados.filter((r) => !r.ok).length;

  const procesarPlacas = () => {
    return placas
      .split(/[\n,; ]+/)
      .map((p) => p.trim().toUpperCase())
      .filter(Boolean);
  };

  const cargarHistorial = async () => {
    try {
      const resp = await listarHistorialVehiculos("datos-vehiculo", 100);

      const data = (resp.results || []).map((item) => ({
        ok: true,
        placa: item.placa,
        message: "Datos del vehículo almacenados en base de datos",
        fecha: item.fecha_consulta,
        datos_vehiculo: {
          clase: item.clase,
          marca: item.marca,
          linea: item.linea,
          servicio: item.servicio,
          color: item.color,
          modelo: item.modelo
        }
      }));

      setHistorial(data);
    } catch (error) {
      console.error("Error cargando historial:", error.message);
    }
  };

  const cargarPlacasSeleccionadas = ({ placas: placasSeleccionadas, refrescarPendientes }) => {
    setPlacas(placasSeleccionadas.join("\n"));
    setRefrescarPendientesActual(() => refrescarPendientes);

    toast.success(`${placasSeleccionadas.length} placa(s) cargadas para consultar`);

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    cargarHistorial();
  }, []);

  const handleConsultar = async () => {
    try {
      setLoading(true);
      setError("");

      const placasArray = procesarPlacas();

      if (placasArray.length === 0) {
        setError("Debe ingresar al menos una placa");
        return;
      }

      const resp = await consultarDatosVehiculoBatch(placasArray);
      const results = resp.results || [];

      setResultados(results);

      toast.success(`Datos consultados: ${exitosas} exitosas, ${fallidas} fallidas`);

      await cargarHistorial();

      if (refrescarPendientesActual) {
        await refrescarPendientesActual();
      }

      // Limpiar plaques después de consultar
      setPlacas("");
    } catch (err) {
      toast.error("Error consultando datos del vehículo");
      setError(err.response?.data?.error || err.message || "Error en la consulta");
    } finally {
      setLoading(false);
    }
  };

  const handleCrearTrabajo = async () => {
    const placasArray = procesarPlacas();

    if (placasArray.length === 0) {
      toast.error("Debe ingresar al menos una placa");
      return;
    }

    try {
      setLoadingJob(true);
      
      const items = placasArray.map(placa => ({ placa }));
      
      const resp = await crearJob("datos-vehiculo", items);
      
      if (resp.job?.id_job) {
        setJobActual(resp.job.id_job);
        toast.success(`Trabajo creado con ${items.length} placa(s)`);
        setPlacas("");
      }
    } catch (err) {
      toast.error(err.response?.data?.error || "Error al crear trabajo");
    } finally {
      setLoadingJob(false);
    }
  };

  return (
    <div className="space-y-6">

      {/* Panel de placas pendientes */}
      <div
        style={{
          animation: "fadeInUp 0.4s ease-out"
        }}
      >
        <PendingPlatesPanel
          modulo="datos-vehiculo"
          onSendToQuery={cargarPlacasSeleccionadas}
        />
      </div>

      {/* Sección principal */}
      <section
        className="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 md:p-6"
        style={{
          animation: "fadeInUp 0.5s ease-out 0.1s both"
        }}
      >
        {/* Header con título y contadores */}
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-sm">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold" style={{ color: "#1e293b" }}>
                Datos del vehículo
              </h2>
            </div>

            <p className="text-sm mt-2" style={{ color: "#64748b" }}>
              Consulta marca, línea, modelo, clase, servicio, color y datos básicos del vehículo.
            </p>
          </div>

          {/* Contadores */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full xl:w-auto">
            {/* Total */}
            <div
              className="rounded-2xl p-4 text-center transition-all hover:scale-105"
              style={{
                background: "linear-gradient(135deg, #E9F1FA 0%, #dbeafe 100%)",
                animation: "fadeInUp 0.5s ease-out 0.2s both"
              }}
            >
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#00ABE4" }}>Total</p>
              <p className="text-2xl font-bold mt-1" style={{ color: "#00ABE4" }}>{resultados.length}</p>
            </div>

            {/* Exitosas */}
            <div
              className="rounded-2xl p-4 text-center transition-all hover:scale-105"
              style={{
                background: "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)",
                animation: "fadeInUp 0.5s ease-out 0.25s both"
              }}
            >
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#059669" }}>Exitosas</p>
              <p className="text-2xl font-bold mt-1" style={{ color: "#059669" }}>{exitosas}</p>
            </div>

            {/* Fallidas */}
            <div
              className="rounded-2xl p-4 text-center transition-all hover:scale-105"
              style={{
                background: "linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)",
                animation: "fadeInUp 0.5s ease-out 0.3s both"
              }}
            >
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#dc2626" }}>Fallidas</p>
              <p className="text-2xl font-bold mt-1" style={{ color: "#dc2626" }}>{fallidas}</p>
            </div>

            {/* Proceso */}
            <div
              className="rounded-2xl p-4 text-center transition-all hover:scale-105"
              style={{
                background: "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)",
                animation: "fadeInUp 0.5s ease-out 0.35s both"
              }}
            >
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#d97706" }}>Proceso</p>
              <p className="text-2xl font-bold mt-1" style={{ color: "#d97706" }}>
                {loading ? (
                  <span className="inline-block w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></span>
                ) : "0"}
              </p>
            </div>
          </div>
        </div>

        {/* Formulario */}
        <div className="mt-6 grid grid-cols-1 xl:grid-cols-[1fr_auto] gap-4 items-end">
          <div>
            <label className="text-sm font-semibold" style={{ color: "#1e293b" }}>
              Placas a consultar
            </label>

            <textarea
              value={placas}
              onChange={(e) => setPlacas(e.target.value)}
              placeholder="Ejemplo: ABC123, EUP243, QHD596"
              disabled={loading}
              className="
                mt-2 w-full min-h-32 rounded-2xl border px-4 py-3 text-sm resize-none
                transition-all duration-200
                disabled:bg-slate-50 disabled:cursor-not-allowed
              "
              style={{
                borderColor: "#e2e8f0",
                color: "#1e293b",
                backgroundColor: "#ffffff"
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#059669";
                e.target.style.boxShadow = "0 0 0 3px rgba(5, 150, 105, 0.15)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#e2e8f0";
                e.target.style.boxShadow = "none";
              }}
            />
          </div>

          <button
            onClick={handleConsultar}
            disabled={loading}
            className="
              w-full xl:w-60 h-12 px-6 rounded-2xl shadow-md font-semibold
              transition-all duration-200 flex items-center justify-center gap-2
              disabled:cursor-not-allowed
            "
            style={{
              backgroundColor: loading ? "#9ca3af" : "#059669",
              color: "#ffffff"
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.target.style.backgroundColor = "#047857";
                e.target.style.transform = "translateY(-1px)";
                e.target.style.boxShadow = "0 4px 12px rgba(5, 150, 105, 0.3)";
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.target.style.backgroundColor = "#059669";
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow = "none";
              }
            }}
          >
            {loading ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>Consultando...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span>Consultar datos</span>
              </>
            )}
          </button>

          <button
            onClick={handleCrearTrabajo}
            disabled={loadingJob}
            className="
              flex-1 px-6 py-3 rounded-2xl font-semibold flex items-center justify-center gap-2
              bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700
              text-white shadow-lg transition-all duration-200
              disabled:from-slate-300 disabled:to-slate-300 disabled:cursor-not-allowed
            "
          >
            {loadingJob ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Creando...</span>
              </>
            ) : (
              <>
                <Briefcase className="w-5 h-5" />
                <span>Crear trabajo</span>
              </>
            )}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div
            className="mt-4 rounded-2xl px-4 py-3 text-sm flex items-center gap-3"
            style={{
              backgroundColor: "#fef2f2",
              color: "#dc2626",
              border: "1px solid #fecaca"
            }}
          >
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}
      </section>

      {/* Loading skeleton */}
      {loading && (
        <div
          className="rounded-2xl p-5 border"
          style={{
            backgroundColor: "#ecfdf5",
            borderColor: "#a7f3d0",
            animation: "fadeIn 0.3s ease-out"
          }}
        >
          <div className="flex items-center gap-4">
            <div className="relative">
              <span className="inline-block w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin"></span>
            </div>
            <div className="flex-1">
              <div className="h-4 rounded animate-pulse mb-2" style={{ backgroundColor: "#d1fae5", width: "60%" }}></div>
              <div className="h-3 rounded animate-pulse" style={{ backgroundColor: "#d1fae5", width: "40%" }}></div>
            </div>
          </div>
        </div>
      )}

      {/* Progreso del trabajo */}
      {jobActual && (
        <div style={{ animation: "fadeInUp 0.4s ease-out" }}>
          <JobProgress 
            jobId={jobActual} 
            onClose={() => {
              setJobActual(null);
              cargarHistorial();
            }}
            onComplete={cargarHistorial}
          />
        </div>
      )}

      {/* Resultados */}
      {resultados.length > 0 && (
        <div style={{ animation: "fadeInUp 0.5s ease-out 0.4s both" }}>
          <QueryResultsSwiper resultados={resultados} onViewDetail={setDetalle} />
        </div>
      )}

      {/* Historial */}
      {historial.length > 0 && (
        <div style={{ animation: "fadeInUp 0.5s ease-out 0.5s both" }}>
          <QueryHistoryTable data={historial} onViewDetail={setDetalle} />
        </div>
      )}

      {/* Modal de detalle */}
      <DetailModal
        open={!!detalle}
        item={detalle}
        onClose={() => setDetalle(null)}
      />

      {/* Estilos de animación */}
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}