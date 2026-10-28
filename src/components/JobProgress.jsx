
import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  Pause, CheckCircle, XCircle, Clock,
  AlertTriangle, Loader2, RefreshCw,
  Download, X, ListChecks, Activity
} from "lucide-react";
import toast from "react-hot-toast";
import {
  obtenerProgresoJob,
  obtenerDetalleJob,
  cancelarJob,
  reintentarFallidos,
  exportarJobExcel
} from "../services/workerJobsApi";

// ======================================================
// ESTILOS DE ESTADOS
// ======================================================

const ESTADO_COLORS = {
  pendiente: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-500/10 dark:text-slate-300 dark:border-slate-600",
  procesando: "bg-sky-50 text-[#0095C5] border-sky-200 dark:bg-sky-500/10 dark:text-sky-300 dark:border-sky-500/20",
  pausado: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",
  finalizado: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
  fallido: "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20",
  cancelado: "bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-600",
  sesion_vencida: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20"
};

const ITEM_ESTADO_COLORS = {
  pendiente: "text-slate-500 dark:text-slate-400",
  procesando: "text-[#0095C5] dark:text-sky-400",
  exitoso: "text-emerald-600 dark:text-emerald-400",
  fallido: "text-red-600 dark:text-red-400",
  sin_informacion: "text-amber-600 dark:text-amber-400",
  timeout: "text-orange-600 dark:text-orange-400",
  sesion_vencida: "text-orange-600 dark:text-orange-400"
};

const ITEM_ICONS = {
  exitoso: CheckCircle,
  fallido: XCircle,
  pendiente: Clock,
  procesando: Loader2,
  sin_informacion: AlertTriangle,
  timeout: AlertTriangle,
  sesion_vencida: AlertTriangle
};

const BTN =
  "inline-flex min-h-11 touch-manipulation items-center justify-center gap-2 rounded-xl border px-3.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50";

// Conservamos la zona horaria original.
function formatFechaColombia(fecha) {
  if (!fecha) return "—";

  const parsed = new Date(fecha);
  if (Number.isNaN(parsed.getTime())) return "—";

  return parsed.toLocaleString("es-CO", {
    timeZone: "America/Bogota"
  });
}

// ======================================================
// COMPONENTE PRINCIPAL
// ======================================================

export default function JobProgress({
  jobId,
  onClose,
  onComplete,
  autoRefresh = true,
  refreshInterval = 5000
}) {
  const reduceMotion = useReducedMotion();

  const [job, setJob] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cargandoAccion, setCargandoAccion] = useState(false);
  const [onCompleteCalled, setOnCompleteCalled] = useState(false);

  // ==========================================
  // LÓGICA ORIGINAL
  // ==========================================

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
    setOnCompleteCalled(false);
    cargarDatos();
  }, [jobId]);

  useEffect(() => {
    if (!autoRefresh) return;

    if (
      job &&
      (job.estado === "finalizado" || job.estado === "fallido") &&
      !onCompleteCalled
    ) {
      setOnCompleteCalled(true);

      const total = job.total || items.length || 0;

      toast.success(
        `Trabajo finalizado — ${job.exitosas || 0} exitosas, ` +
        `${job.fallidas || 0} fallidas de ${total}`,
        { id: `job-done-${jobId}` }
      );

      if (onComplete) onComplete(job, items);
      return;
    }

    if (
      !job ||
      job.estado === "finalizado" ||
      job.estado === "cancelado" ||
      job.estado === "fallido"
    ) {
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

  const handleDescargarExcel = async () => {
    try {
      setCargandoAccion(true);
      await exportarJobExcel(jobId);
      toast.success("Excel descargado");
    } catch (error) {
      toast.error("Error al descargar Excel");
    } finally {
      setCargandoAccion(false);
    }
  };

  // ==========================================
  // ESTADO DE CARGA
  // ==========================================

  if (loading) {
    return (
      <div className="flex min-h-36 items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-[#172539]">
        <Loader2 size={23} className="animate-spin text-[#00ABE4]" />
        <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
          Cargando progreso...
        </span>
      </div>
    );
  }

  const counters = job || {};

  const porcentaje = counters.total > 0
    ? Math.round((counters.procesadas / counters.total) * 100)
    : 0;

  const pendientes =
    (counters.total || 0) - (counters.procesadas || 0);

  const estadoColor =
    ESTADO_COLORS[job?.estado] || ESTADO_COLORS.pendiente;

  // ==========================================
  // VISTA PRINCIPAL
  // ==========================================

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-[#172539]"
    >
      {/* ENCABEZADO */}

      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-4 py-4 dark:border-slate-700 sm:px-5">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-[#0095C5] dark:bg-sky-500/10 dark:text-sky-400">
              <Activity size={19} />
            </div>

            <h3 className="break-words text-base font-bold text-slate-900 dark:text-slate-100">
              Trabajo: {job?.modulo}
            </h3>

            <span
              className={`inline-flex items-center rounded-lg border px-2.5 py-1 text-[11px] font-bold ${estadoColor}`}
            >
              {job?.estado}
            </span>
          </div>

          <p className="mt-2 text-[11px] leading-5 text-slate-500 dark:text-slate-400">
            Creado: {formatFechaColombia(job?.created_at)}
            {job?.started_at &&
              ` · Iniciado: ${formatFechaColombia(job.started_at)}`}
            {job?.finished_at &&
              ` · Finalizado: ${formatFechaColombia(job.finished_at)}`}
          </p>
        </div>

        {/* ACCIONES ORIGINALES */}

        <div className="flex flex-wrap items-center gap-2">

          {job?.estado !== "finalizado" &&
            job?.estado !== "cancelado" && (
              <button
                type="button"
                onClick={handleCancelar}
                disabled={cargandoAccion}
                className={`${BTN} border-red-100 bg-red-50 text-red-700 hover:bg-red-100 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400`}
              >
                <Pause size={16} />
                Cancelar
              </button>
            )}

          {job?.estado === "finalizado" && (
            <>
              {counters.fallidas > 0 && (
                <button
                  type="button"
                  onClick={handleReintentar}
                  disabled={cargandoAccion}
                  className={`${BTN} border-amber-100 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400`}
                >
                  <RefreshCw size={16} />
                  Reintentar fallidos
                </button>
              )}

              {["personas-direcciones", "ubicabilidad-personas"].includes(job?.modulo) && (
                <button
                  type="button"
                  onClick={handleDescargarExcel}
                  disabled={cargandoAccion}
                  className={`${BTN} border-emerald-100 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400`}
                >
                  <Download size={16} />
                  Descargar Excel
                </button>
              )}
            </>
          )}

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              title="Cerrar panel"
              aria-label="Cerrar panel de progreso"
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-700"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* PROGRESO */}

      <div className="space-y-2 px-4 py-4 sm:px-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
            Progreso del trabajo
          </span>

          <span className="text-xs font-bold tabular-nums text-slate-900 dark:text-slate-100">
            {counters.procesadas || 0} / {counters.total || 0}
            <span className="ml-2 text-[#0095C5] dark:text-sky-400">
              ({porcentaje}%)
            </span>
          </span>
        </div>

        <div
          role="progressbar"
          aria-label="Progreso del trabajo"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={porcentaje}
          className="h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700"
        >
          <motion.div
            initial={reduceMotion ? false : { width: 0 }}
            animate={{ width: `${porcentaje}%` }}
            transition={{ duration: 0.4 }}
            className="h-full rounded-full bg-gradient-to-r from-[#00ABE4] to-[#0095C5]"
          />
        </div>
      </div>

      {/* INDICADORES */}

      <div className="grid grid-cols-2 gap-2.5 px-4 pb-4 sm:grid-cols-4 sm:gap-3 sm:px-5">

        {[
          {
            label: "Total",
            value: counters.total || 0,
            color: "bg-slate-50 text-slate-700 dark:bg-[#111F32] dark:text-slate-200",
            labelColor: "text-slate-500 dark:text-slate-400"
          },
          {
            label: "Exitosas",
            value: counters.exitosas || 0,
            color: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
            labelColor: "text-emerald-600 dark:text-emerald-400"
          },
          {
            label: "Fallidas",
            value: counters.fallidas || 0,
            color: "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400",
            labelColor: "text-red-600 dark:text-red-400"
          },
          {
            label: "Pendientes",
            value: pendientes,
            color: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
            labelColor: "text-amber-600 dark:text-amber-400"
          }
        ].map(stat => (
          <div
            key={stat.label}
            className={`rounded-xl px-3 py-3 text-center ${stat.color}`}
          >
            <p className={`text-[11px] font-semibold ${stat.labelColor}`}>
              {stat.label}
            </p>
            <p className="mt-1 text-xl font-extrabold tabular-nums">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* ELEMENTOS PROCESADOS */}

      {items.length > 0 && (
        <div className="border-t border-slate-100 px-4 py-4 dark:border-slate-700 sm:px-5">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <ListChecks size={17} className="text-[#0095C5] dark:text-sky-400" />

              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Ítems del trabajo
              </h4>
            </div>

            <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600 dark:bg-[#111F32] dark:text-slate-300">
              {items.length}
            </span>
          </div>

          <div className="max-h-64 space-y-2 overflow-y-auto overscroll-contain pr-1">
            {items.map(item => {
              const Icon = ITEM_ICONS[item.estado];

              return (
                <div
                  key={item.id_item}
                  className="flex min-w-0 flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 dark:border-slate-700 dark:bg-[#111F32]"
                >
                  <div className="flex min-w-0 flex-wrap items-center gap-2.5">
                    {item.placa && (
                      <span className="font-mono text-[13px] font-bold text-slate-800 dark:text-slate-100">
                        {item.placa}
                      </span>
                    )}

                    {item.documento && (
                      <span className="break-all font-mono text-xs text-slate-500 dark:text-slate-400">
                        {item.documento}
                      </span>
                    )}
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    {Icon && (
                      <Icon
                        size={16}
                        className={`${
                          ITEM_ESTADO_COLORS[item.estado] ||
                          "text-slate-500 dark:text-slate-400"
                        } ${item.estado === "procesando" ? "animate-spin" : ""}`}
                      />
                    )}

                    <span
                      className={`text-xs font-semibold ${
                        ITEM_ESTADO_COLORS[item.estado] ||
                        "text-slate-500 dark:text-slate-400"
                      }`}
                    >
                      {item.estado}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </motion.div>
  );
}
