import { useEffect, useState } from "react";
import { consultarDatosVehiculoBatch, listarHistorialVehiculos } from "../services/vehicleQueryApi";
import { crearJob } from "../services/workerJobsApi";
import PendingPlatesPanel from "../components/PendingPlatesPanel";
import DetailModal from "../components/DetailModal";
import QueryHistoryTable from "../components/QueryHistoryTable";
import toast from "react-hot-toast";
import QueryResultsSwiper from "../components/QueryResultsSwiper";
import JobProgress from "../components/JobProgress";
import PageHeroHeader from "../components/PageHeroHeader";
import { Search, Loader2, Briefcase, Car, ClipboardList, AlertCircle } from "lucide-react";

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
    <div className="space-y-5">

      {/* Hero header */}
      <PageHeroHeader
        label="Datos del vehículo"
        labelIcon={Car}
        title="Consulta de placas listas para datos vehículo"
        description="Consulta las placas que ya tienen información base registrada y están listas para completar los datos del vehículo."
        icon={ClipboardList}
        badgeCount={resultados.length}
        badgeLabel="resultado"
      />

      {/* Panel de placas pendientes */}
      <PendingPlatesPanel
        modulo="datos-vehiculo"
        onSendToQuery={cargarPlacasSeleccionadas}
      />

      {/* Tarjeta del formulario */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-[#1e293b]">
            Buscar placas listas
          </h3>
          <span className="text-xs text-[#64748b]">
            Máximo 100 placas por lote
          </span>
        </div>

        <p className="text-xs text-[#64748b] mb-4">
          El sistema traerá placas que ya existen en propietario, SOAT y tecnomecánica,
          pero que aún no tienen datos del vehículo guardados.
        </p>

        {/* Contadores */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="bg-[#E9F1FA] rounded-xl p-3 text-center">
            <p className="text-xs text-[#00ABE4] font-medium">Total</p>
            <p className="text-xl font-bold text-[#00ABE4]">{resultados.length}</p>
          </div>

          <div className="bg-emerald-50 rounded-xl p-3 text-center">
            <p className="text-xs text-emerald-600 font-medium">Exitosas</p>
            <p className="text-xl font-bold text-emerald-700">{exitosas}</p>
          </div>

          <div className="bg-red-50 rounded-xl p-3 text-center">
            <p className="text-xs text-red-600 font-medium">Fallidas</p>
            <p className="text-xl font-bold text-red-700">{fallidas}</p>
          </div>
        </div>

        {/* Formulario */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_auto_auto] gap-3 items-end">
          <div>
            <label className="text-xs font-semibold text-[#64748b] mb-1.5 block">
              Placas a consultar
            </label>
            <textarea
              value={placas}
              onChange={(e) => setPlacas(e.target.value)}
              placeholder="Ejemplo: ABC123, EUP243, QHD596"
              disabled={loading}
              className="
                w-full min-h-28 rounded-xl border-2 border-slate-200
                px-4 py-3 text-sm resize-none text-[#1e293b]
                placeholder:text-[#94a3b8] placeholder:text-xs
                focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10
                disabled:bg-slate-50 disabled:cursor-not-allowed
                transition-all duration-200
              "
            />
          </div>

          <button
            onClick={handleConsultar}
            disabled={loading}
            className="
              h-11 px-5 rounded-xl
              bg-emerald-500 hover:bg-emerald-600
              disabled:bg-slate-300
              text-white shadow-md hover:shadow-lg
              transition-all duration-200 font-semibold flex items-center justify-center gap-2 text-sm
            "
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Consultando...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>Buscar lote</span>
              </>
            )}
          </button>

          <button
            onClick={handleCrearTrabajo}
            disabled={loadingJob}
            className="
              h-11 px-5 rounded-xl
              bg-[#00ABE4] hover:bg-[#0095C5]
              disabled:bg-slate-300
              text-white shadow-md hover:shadow-lg
              transition-all duration-200 font-semibold flex items-center justify-center gap-2 text-sm
            "
          >
            {loadingJob ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Creando...</span>
              </>
            ) : (
              <>
                <Briefcase className="w-4 h-4" />
                <span>Crear trabajo</span>
              </>
            )}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-4 bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-500" />
            <span className="text-red-700">{error}</span>
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