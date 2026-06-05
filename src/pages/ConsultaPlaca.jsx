import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  consultarPlacaBatch,
  listarHistorialVehiculos
} from "../services/vehicleQueryApi";
import { crearJob } from "../services/workerJobsApi";
import { obtenerEstadoSesionRunt } from "../services/sessionRunt"
import PendingPlatesPanel from "../components/PendingPlatesPanel";
import DetailModal from "../components/DetailModal";
import QueryHistoryTable from "../components/QueryHistoryTable";
import toast from "react-hot-toast";
import QueryResultsSwiper from "../components/QueryResultsSwiper";
import JobProgress from "../components/JobProgress";
import { Search, AlertCircle, Loader2, Play, Briefcase } from "lucide-react";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: "easeOut"
    }
  }
};

export default function ConsultaPlaca() {
  const [placas, setPlacas] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingJob, setLoadingJob] = useState(false);
  const [resultados, setResultados] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [error, setError] = useState("");
  const [detalle, setDetalle] = useState(null);
  const [refrescarPendientesActual, setRefrescarPendientesActual] = useState(null);
  const [jobActual, setJobActual] = useState(null);

  const procesarPlacas = () => {
    return placas
      .split(/[\n,; ]+/)
      .map((p) => p.trim().toUpperCase())
      .filter(Boolean);
  };

  const cargarHistorial = async () => {
    try {
      const resp = await listarHistorialVehiculos("consulta-placa", 100);

      const data = (resp.results || []).map((item) => ({
        ok: true,
        placa: item.placa,
        message: "Consulta almacenada en base de datos",
        fecha: item.fecha_consulta,
        propietario: {
          tipo_documento: item.tipo_identificacion_propietario,
          numero_documento: item.numero_identificacion_propietario,
          nombre_completo: item.nombre_razon_social_propietario
        }
      }));

      setHistorial(data);
    } catch (error) {
      console.error("Error cargando historial:", error.message);
    }
  };

  const cargarPlacasSeleccionadas = ({
    placas: placasSeleccionadas,
    refrescarPendientes
  }) => {
    setPlacas(placasSeleccionadas.join("\n"));
    setRefrescarPendientesActual(() => refrescarPendientes);

    toast.success(`${placasSeleccionadas.length} placa(s) cargadas para consultar`);

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };

  useEffect(() => {
    cargarHistorial();
  }, []);

  // Función para recargar historial
  const recargarHistorial = () => {
    cargarHistorial();
  };

  const handleConsultar = async () => {
    try {
      setLoading(true);
      setError("");

      const sessionResp = await obtenerEstadoSesionRunt();
      const session = sessionResp.session;

      if (!session?.activa) {
        toast.error("Sesión RUNT vencida. Debe iniciar sesión nuevamente.");
        return;
      }

      if (!session?.puedeConsultar) {
        toast.error(
          `Tiempo insuficiente. Quedan ${session.minutosRestantes} minutos de sesión`
        );
        return;
      }

      const placasArray = procesarPlacas();

      if (placasArray.length === 0) {
        setError("Debe ingresar al menos una placa");
        toast.error("Debe ingresar al menos una placa");
        return;
      }

      if (placasArray.length > session.capacidadSegura) {
        toast.error(
          `Solo puede consultar ${session.capacidadSegura} placas con el tiempo restante`
        );
        return;
      }

      const resp = await consultarPlacaBatch(placasArray);
      const results = resp.results || [];

      setResultados(results);

      const exitosas = results.filter((r) => r.ok).length;
      const fallidas = results.filter((r) => !r.ok).length;

      toast.success(`Consulta finalizada: ${exitosas} exitosas, ${fallidas} fallidas`);

      await cargarHistorial();

      if (refrescarPendientesActual) {
        await refrescarPendientesActual();
      }

      // Limpiar plaques después de consultar
      setPlacas("");
    } catch (err) {
      toast.error("Error en la consulta");
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
      
      const resp = await crearJob("consulta-placa", items);
      
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
    <div className="min-h-screen bg-[#E9F1FA] space-y-6 p-4 md:p-6">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        <PendingPlatesPanel
          modulo="consulta-placa"
          onSendToQuery={cargarPlacasSeleccionadas}
        />

        <motion.section
          variants={itemVariants}
          className="bg-white rounded-3xl shadow-lg p-4 md:p-6"
        >
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
            <div className="max-w-2xl">
              <h2 className="text-2xl font-bold text-[#1e293b]">
                Consulta de placa
              </h2>

              <p className="text-sm text-[#64748b] mt-2">
                Consulta propietarios, SOAT y tecnomecánica desde el módulo principal.
                Puedes ingresar una o varias placas separadas por coma, espacio o salto de línea.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full xl:w-auto">
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-[#00ABE4]/10 rounded-2xl p-4"
              >
                <p className="text-xs text-[#00ABE4] font-medium">Total</p>
                <p className="text-2xl font-bold text-[#00ABE4]">{resultados.length}</p>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-emerald-50 rounded-2xl p-4"
              >
                <p className="text-xs text-emerald-600 font-medium">Exitosas</p>
                <p className="text-2xl font-bold text-emerald-700">
                  {resultados.filter((r) => r.ok).length}
                </p>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-red-50 rounded-2xl p-4"
              >
                <p className="text-xs text-red-600 font-medium">Fallidas</p>
                <p className="text-2xl font-bold text-red-700">
                  {resultados.filter((r) => !r.ok).length}
                </p>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-amber-50 rounded-2xl p-4"
              >
                <p className="text-xs text-amber-600 font-medium">Proceso</p>
                <p className="text-2xl font-bold text-amber-700">
                  {loading ? "..." : "0"}
                </p>
              </motion.div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 xl:grid-cols-[1fr_auto] gap-4 items-end">
            <div>
              <label className="text-sm font-semibold text-[#1e293b]">
                Placas a consultar
              </label>

              <textarea
                value={placas}
                onChange={(e) => setPlacas(e.target.value)}
                placeholder="Ejemplo: ABC123, EUP243, QHD596"
                disabled={loading}
                className="
                  mt-2 w-full min-h-32 rounded-2xl border-2 border-slate-200
                  px-4 py-3 text-sm resize-none text-[#1e293b]
                  placeholder:text-[#64748b]/60 placeholder:text-sm
                  focus:outline-none focus:border-[#00ABE4] focus:ring-4 focus:ring-[#00ABE4]/20
                  disabled:bg-slate-50 disabled:cursor-not-allowed
                  transition-all duration-200
                "
              />
            </div>

            <motion.button
              onClick={handleConsultar}
              disabled={true}
              whileHover={{ scale: loading ? 1 : 1.03 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              className="
                w-full xl:w-52 h-12
                bg-gradient-to-r from-[#00ABE4] to-[#0095CC] hover:from-[#0095CC] hover:to-[#007AB8]
                disabled:from-slate-300 disabled:to-slate-300
                text-white px-6 py-3 rounded-2xl shadow-lg shadow-[#00ABE4]/30
                transition-all duration-200 font-semibold flex items-center justify-center gap-2
              "
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Consultando...</span>
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  <span>Consultar placa</span>
                </>
              )}
            </motion.button>

            <motion.button
              onClick={handleCrearTrabajo}
              disabled={loadingJob}
              whileHover={{ scale: loadingJob ? 1 : 1.03 }}
              whileTap={{ scale: loadingJob ? 1 : 0.98 }}
              className="
                w-full xl:w-52 h-12
                bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700
                disabled:from-slate-300 disabled:to-slate-300
                text-white px-6 py-3 rounded-2xl shadow-lg shadow-emerald-500/30
                transition-all duration-200 font-semibold flex items-center justify-center gap-2
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
            </motion.button>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 bg-red-50/80 text-red-700 rounded-2xl px-4 py-3 text-sm border border-red-100/50 flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </motion.div>
          )}
        </motion.section>

        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            {[1, 2, 3].map((i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{
                  opacity: [0.5, 1, 0.5],
                  y: 0,
                  transition: {
                    duration: 1.5,
                    repeat: Infinity,
                    delay: i * 0.2
                  }
                }}
                className="bg-white rounded-2xl p-5 shadow-md overflow-hidden relative"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#00ABE4]/10 to-transparent animate-shimmer" />
                <div className="relative">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-24 h-6 bg-[#E9F1FA] rounded-lg" />
                    <div className="w-20 h-4 bg-[#E9F1FA] rounded-lg" />
                  </div>
                  <div className="w-48 h-4 bg-[#E9F1FA] rounded-lg mb-2" />
                  <div className="w-full h-4 bg-[#E9F1FA] rounded-lg mb-2" />
                  <div className="w-3/4 h-4 bg-[#E9F1FA] rounded-lg" />
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {jobActual && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <JobProgress 
              jobId={jobActual} 
              onClose={() => {
                setJobActual(null);
                recargarHistorial(); // Recargar historial al cerrar
              }}
              onComplete={recargarHistorial} // Recargar al terminar
            />
          </motion.section>
        )}

        <motion.div variants={itemVariants}>
          <QueryResultsSwiper resultados={resultados} onViewDetail={setDetalle} />
        </motion.div>

        <motion.div variants={itemVariants}>
          <QueryHistoryTable data={historial} onViewDetail={setDetalle} />
        </motion.div>

        <DetailModal
          open={!!detalle}
          item={detalle}
          onClose={() => setDetalle(null)}
        />
      </motion.div>

      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 1.5s infinite;
        }
      `}</style>
    </div>
  );
}
