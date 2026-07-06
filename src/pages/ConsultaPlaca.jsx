import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  consultarPlacaBatch,
  listarHistorialVehiculos
} from "../services/vehicleQueryApi";
import { crearJob } from "../services/workerJobsApi";
import { obtenerEstadoSesionRunt } from "../services/sessionRunt";
import { cargarPlacasPorArchivo } from "../services/placasApi";
import PendingPlatesPanel from "../components/PendingPlatesPanel";
import DetailModal from "../components/DetailModal";
import QueryHistoryTable from "../components/QueryHistoryTable";
import toast from "react-hot-toast";
import QueryResultsSwiper from "../components/QueryResultsSwiper";
import JobProgress from "../components/JobProgress";
import PageHeroHeader from "../components/PageHeroHeader";
import { Search, AlertCircle, Loader2, Briefcase, Calendar, ClipboardList, Upload, FileText, X } from "lucide-react";

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
  const [archivoPlacas, setArchivoPlacas] = useState(null);
  const [loadingFile, setLoadingFile] = useState(false);

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

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
      "text/csv"
    ];
    if (!validTypes.includes(file.type) && !file.name.endsWith(".xlsx") && !file.name.endsWith(".xls") && !file.name.endsWith(".csv")) {
      toast.error("Solo se permiten archivos Excel (.xlsx, .xls) o CSV (.csv)");
      return;
    }

    setLoadingFile(true);
    try {
      const formData = new FormData();
      formData.append("archivo", file);

      const resp = await cargarPlacasPorArchivo(formData);

      if (resp.ok) {
        const placasData = resp.data.placas || [];
        const placasTexto = placasData.map((p) => p.placa).join("\n");
        setPlacas(placasTexto);
        setArchivoPlacas(null);
        toast.success(`${placasData.length} placa(s) cargadas desde archivo`);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        toast.error(resp.error || "Error al procesar archivo");
      }
    } catch (err) {
      toast.error("Error al subir archivo: " + err.message);
    } finally {
      setLoadingFile(false);
      e.target.value = "";
    }
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
        className="space-y-5"
      >
        {/* Hero header */}
        <PageHeroHeader
          label="Consulta de placas"
          labelIcon={ClipboardList}
          title="Placas pendientes por fecha"
          description="Consulta lotes de placas pendientes por rango de fechas y estado para continuar el procesamiento."
          icon={Calendar}
          badgeCount={resultados.length}
          badgeLabel="resultado"
        />

        <PendingPlatesPanel
          modulo="consulta-placa"
          onSendToQuery={cargarPlacasSeleccionadas}
        />

        {/* Tarjeta del formulario */}
        <motion.section
          variants={itemVariants}
          className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 md:p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-[#1e293b]">
              Buscar placas pendientes
            </h3>
            <span className="text-xs text-[#64748b]">
              Máximo 100 placas por lote
            </span>
          </div>

          <p className="text-xs text-[#64748b] mb-4">
            El sistema traerá máximo 100 placas pendientes por lote. Cuando finalice la consulta,
            podrás volver a cargar las siguientes pendientes del mismo rango.
          </p>

          <div className="grid grid-cols-3 gap-3 mb-5">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-[#00ABE4]/10 rounded-xl p-3 text-center"
            >
                <p className="text-xs text-[#00ABE4] font-medium">Total</p>
                <p className="text-xl font-bold text-[#00ABE4]">{resultados.length}</p>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-emerald-50 rounded-xl p-3 text-center"
              >
                <p className="text-xs text-emerald-600 font-medium">Exitosas</p>
                <p className="text-xl font-bold text-emerald-700">
                  {resultados.filter((r) => r.ok).length}
                </p>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-red-50 rounded-xl p-3 text-center"
              >
                <p className="text-xs text-red-600 font-medium">Fallidas</p>
                <p className="text-xl font-bold text-red-700">
                  {resultados.filter((r) => !r.ok).length}
                </p>
              </motion.div>
            </div>

          <div className="grid grid-cols-1 xl:grid-cols-[1fr_280px_auto_auto] gap-3 items-end">
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
                  focus:outline-none focus:border-[#00ABE4] focus:ring-4 focus:ring-[#00ABE4]/10
                  disabled:bg-slate-50 disabled:cursor-not-allowed
                  transition-all duration-200
                "
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#64748b] block">
                O cargar desde archivo
              </label>
              <label
                className={`
                  h-28 rounded-xl border-2 border-dashed cursor-pointer
                  flex flex-col items-center justify-center gap-1
                  transition-all duration-200
                  ${loadingFile
                    ? "bg-slate-50 border-slate-200 cursor-not-allowed"
                    : archivoPlacas
                      ? "bg-[#00ABE4]/10 border-[#00ABE4] cursor-pointer hover:bg-[#00ABE4]/20"
                      : "bg-slate-50 border-slate-300 hover:border-[#00ABE4] hover:bg-[#00ABE4]/5"
                  }
                `}
              >
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileUpload}
                  disabled={loadingFile}
                  className="hidden"
                />
                {loadingFile ? (
                  <>
                    <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
                    <span className="text-xs text-slate-500">Procesando...</span>
                  </>
                ) : archivoPlacas ? (
                  <>
                    <FileText className="w-5 h-5 text-[#00ABE4]" />
                    <span className="text-xs text-[#00ABE4] font-medium truncate max-w-36">
                      {archivoPlacas.name}
                    </span>
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5 text-slate-400" />
                    <span className="text-xs text-slate-500">Excel o CSV</span>
                  </>
                )}
              </label>
            </div>

            <motion.button
              onClick={handleConsultar}
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              className="
                h-11 px-5 rounded-xl
                bg-[#00ABE4] hover:bg-[#0095C5]
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
            </motion.button>

            <motion.button
              onClick={handleCrearTrabajo}
              disabled={loadingJob}
              whileHover={{ scale: loadingJob ? 1 : 1.02 }}
              whileTap={{ scale: loadingJob ? 1 : 0.98 }}
              className="
                h-11 px-5 rounded-xl
                bg-emerald-500 hover:bg-emerald-600
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
            </motion.button>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-500" />
              <span className="text-red-700">{error}</span>
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
