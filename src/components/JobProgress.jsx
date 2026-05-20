import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { obtenerProgresoJob, obtenerDetalleJob, cancelarJob, reintentarFallidos } from "../services/workerJobsApi";
import toast from "react-hot-toast";
import { 
  Play, Pause, RotateCcw, CheckCircle, XCircle, 
  Clock, AlertTriangle, Loader2, RefreshCw, Trash2 
} from "lucide-react";

const ESTADO_COLORS = {
  pendiente: "bg-slate-100 text-slate-600",
  procesando: "bg-blue-100 text-blue-600",
  pausado: "bg-amber-100 text-amber-600",
  finalizado: "bg-emerald-100 text-emerald-600",
  fallido: "bg-red-100 text-red-600",
  cancelado: "bg-slate-200 text-slate-500",
  sesion_vencida: "bg-orange-100 text-orange-600"
};

const ITEM_ESTADO_COLORS = {
  pendiente: "text-slate-500",
  procesando: "text-blue-500",
  exitoso: "text-emerald-600",
  fallido: "text-red-600",
  sin_informacion: "text-amber-600",
  timeout: "text-orange-600",
  sesion_vencida: "text-orange-600"
};

function formatFechaColombia(fecha) {
  if (!fecha) return "—";

  const parsed = new Date(fecha);
  if (Number.isNaN(parsed.getTime())) return "—";

  return parsed.toLocaleString("es-CO", {
    timeZone: "America/Bogota"
  });
}

export default function JobProgress({ jobId, onClose, onComplete, autoRefresh = true, refreshInterval = 5000 }) {
  const [job, setJob] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cargandoAccion, setCargandoAccion] = useState(false);
  const [onCompleteCalled, setOnCompleteCalled] = useState(false);

  const cargarDatos = async () => {
    try {
      const [progresoData, detalleData] = await Promise.all([
        obtenerProgresoJob(jobId),
        obtenerDetalleJob(jobId)
      ]);
      
      setJob(progresoData.job || progresoData);
      setItems(detalleData.items || []);
    } catch (error) {
      console.error("Error cargando job:", error);
      toast.error("Error al cargar progreso del trabajo");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, [jobId]);

  useEffect(() => {
    if (!autoRefresh) return;
    
    // Solo llamar onComplete una vez cuando el job termina
    if (job && (job.estado === "finalizado" || job.estado === "fallido") && onComplete && !onCompleteCalled) {
      setOnCompleteCalled(true);
      onComplete();
      return;
    }

    if (!job || job.estado === "finalizado" || job.estado === "cancelado" || job.estado === "fallido") {
      return;
    }

    const interval = setInterval(cargarDatos, refreshInterval);
    return () => clearInterval(interval);
  }, [job, autoRefresh, refreshInterval, onComplete, onCompleteCalled]);

  const handleCancelar = async () => {
    try {
      setCargandoAccion(true);
      await cancelarJob(jobId);
      toast.success("Trabajo cancelado");
      await cargarDatos();
    } catch (error) {
      toast.error("Error al cancelar trabajo");
    } finally {
      setCargandoAccion(false);
    }
  };

  const handleReintentar = async () => {
    try {
      setCargandoAccion(true);
      await reintentarFallidos(jobId);
      toast.success("Trabajo de reintento creado");
      await cargarDatos();
    } catch (error) {
      toast.error("Error al crear reintento");
    } finally {
      setCargandoAccion(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-[#00ABE4]" />
        <span className="ml-3 text-slate-600">Cargando progreso...</span>
      </div>
    );
  }

  const counters = job || {};
  const porcentaje = counters.total > 0 ? Math.round((counters.procesadas / counters.total) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-3xl shadow-lg p-6 space-y-4"
    >
      {/* Header del job */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-bold text-[#1e293b]">
              Trabajo: {job?.modulo}
            </h3>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${ESTADO_COLORS[job?.estado] || "bg-slate-100"}`}>
              {job?.estado}
            </span>
          </div>
          <p className="text-sm text-[#64748b] mt-1">
            Creado: {formatFechaColombia(job?.created_at)}
            {job?.started_at && ` | Iniciado: ${formatFechaColombia(job.started_at)}`}
            {job?.finished_at && ` | Finalizado: ${formatFechaColombia(job.finished_at)}`}
          </p>
        </div>

        {/* Botones de acción */}
        {job?.estado !== "finalizado" && job?.estado !== "cancelado" && (
          <div className="flex gap-2">
            <button
              onClick={handleCancelar}
              disabled={cargandoAccion}
              className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-xl hover:bg-red-200 transition-colors text-sm font-medium disabled:opacity-50"
            >
              <Pause className="w-4 h-4" />
              Cancelar
            </button>
          </div>
        )}

        {job?.estado === "finalizado" && counters.fallidas > 0 && (
          <button
            onClick={handleReintentar}
            disabled={cargandoAccion}
            className="flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-700 rounded-xl hover:bg-amber-200 transition-colors text-sm font-medium disabled:opacity-50"
          >
            <RefreshCw className="w-4 h-4" />
            Reintentar fallidos
          </button>
        )}
      </div>

      {/* Barra de progreso */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-[#64748b]">Progreso</span>
          <span className="font-semibold text-[#1e293b]">
            {counters.procesadas || 0} / {counters.total || 0} ({porcentaje}%)
          </span>
        </div>
        <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${porcentaje}%` }}
            className="h-full bg-gradient-to-r from-[#00ABE4] to-[#0095CC]"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-slate-50 rounded-xl p-3 text-center">
          <p className="text-xs text-slate-500">Total</p>
          <p className="text-xl font-bold text-slate-700">{counters.total || 0}</p>
        </div>
        <div className="bg-emerald-50 rounded-xl p-3 text-center">
          <p className="text-xs text-emerald-600">Exitosas</p>
          <p className="text-xl font-bold text-emerald-700">{counters.exitosas || 0}</p>
        </div>
        <div className="bg-red-50 rounded-xl p-3 text-center">
          <p className="text-xs text-red-600">Fallidas</p>
          <p className="text-xl font-bold text-red-700">{counters.fallidas || 0}</p>
        </div>
        <div className="bg-amber-50 rounded-xl p-3 text-center">
          <p className="text-xs text-amber-600">Pendientes</p>
          <p className="text-xl font-bold text-amber-700">{(counters.total || 0) - (counters.procesadas || 0)}</p>
        </div>
      </div>

      {/* Lista de items */}
      {items.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-semibold text-[#1e293b] mb-2">Items</h4>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {items.map((item) => (
              <div
                key={item.id_item}
                className="flex items-center justify-between p-3 bg-slate-50 rounded-xl text-sm"
              >
                <div className="flex items-center gap-3">
                  {item.placa && (
                    <span className="font-mono font-semibold text-[#1e293b]">
                      {item.placa}
                    </span>
                  )}
                  {item.documento && (
                    <span className="font-mono text-slate-600 text-xs">
                      {item.documento}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {item.estado === "exitoso" && <CheckCircle className="w-4 h-4 text-emerald-500" />}
                  {item.estado === "fallido" && <XCircle className="w-4 h-4 text-red-500" />}
                  {item.estado === "pendiente" && <Clock className="w-4 h-4 text-slate-400" />}
                  {item.estado === "procesando" && <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />}
                  {item.estado === "sin_informacion" && <AlertTriangle className="w-4 h-4 text-amber-500" />}
                  {item.estado === "sesion_vencida" && <AlertTriangle className="w-4 h-4 text-orange-500" />}
                  <span className={`font-medium ${ITEM_ESTADO_COLORS[item.estado]}`}>
                    {item.estado}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
