
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

import {
  consultarPlacaBatch,
  listarHistorialVehiculos,
} from "../services/vehicleQueryApi";

import { crearJob } from "../services/workerJobsApi";
import { getLocalSession } from "../services/sessionRunt";
import { cargarPlacasPorArchivo } from "../services/placasApi";

import PendingPlatesPanel from "../components/PendingPlatesPanel";
import DetailModal from "../components/DetailModal";
import QueryHistoryTable from "../components/QueryHistoryTable";
import QueryResultsSwiper from "../components/QueryResultsSwiper";
import JobProgress from "../components/JobProgress";
import PageHeroHeader from "../components/PageHeroHeader";

import toast from "react-hot-toast";

import {
  Search,
  AlertCircle,
  Loader2,
  Briefcase,
  CalendarDays,
  ClipboardList,
  Upload,
  FileText,
  X,
  CheckCircle2,
  Database,
  Info,
  CarFront,
} from "lucide-react";

// ========================================================
// CONFIGURACIÓN VISUAL
// ========================================================

const COLORS = {
  primary: "#00ABE4",
  primaryDark: "#0095C5",
  primaryLight: "#E9F1FA",
  success: "#059669",
  danger: "#DC2626",
  violet: "#7C3AED",
};

const containerVariants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: {
    opacity: 0,
    y: 12,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: "easeOut",
    },
  },
};

// ========================================================
// COMPONENTE VISUAL - INDICADORES
// ========================================================

function IndicadorResultado({
  titulo,
  valor,
  icono: Icon,
  tipo = "primary",
}) {
  const estilos = {
    primary: {
      fondo: "bg-sky-50",
      icono: "text-sky-600",
      numero: "text-sky-600",
    },
    success: {
      fondo: "bg-emerald-50",
      icono: "text-emerald-600",
      numero: "text-emerald-600",
    },
    danger: {
      fondo: "bg-red-50",
      icono: "text-red-600",
      numero: "text-red-600",
    },
  };

  const estilo = estilos[tipo] || estilos.primary;

  return (
    <div
      className={`
        flex min-w-0 items-center gap-3
        rounded-xl border border-slate-100
        ${estilo.fondo}
        px-3 py-3
      `}
    >
      <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/80 sm:flex">
        <Icon className={`h-5 w-5 ${estilo.icono}`} />
      </div>

      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-500">
          {titulo}
        </p>

        <p
          className={`mt-0.5 text-xl font-bold ${estilo.numero}`}
        >
          {valor}
        </p>
      </div>
    </div>
  );
}

// ========================================================
// COMPONENTE PRINCIPAL
// ========================================================

export default function ConsultaPlaca() {
  // ------------------------------------------------------
  // ESTADOS ORIGINALES
  // ------------------------------------------------------

  const [placas, setPlacas] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingJob, setLoadingJob] = useState(false);

  const [resultados, setResultados] = useState([]);
  const [historial, setHistorial] = useState([]);

  const [error, setError] = useState("");
  const [detalle, setDetalle] = useState(null);

  const [
    refrescarPendientesActual,
    setRefrescarPendientesActual,
  ] = useState(null);

  const [jobActual, setJobActual] = useState(null);

  const [archivoPlacas, setArchivoPlacas] = useState(null);
  const [loadingFile, setLoadingFile] = useState(false);

  // ------------------------------------------------------
  // PROCESAR PLACAS
  // ------------------------------------------------------

  const procesarPlacas = () => {
    return placas
      .split(/[\n,; ]+/)
      .map((p) => p.trim().toUpperCase())
      .filter(Boolean);
  };

  // ------------------------------------------------------
  // CARGAR HISTORIAL
  // ------------------------------------------------------

  const cargarHistorial = async () => {
    try {
      const resp = await listarHistorialVehiculos(
        "consulta-placa",
        100
      );

      const data = (resp.results || []).map((item) => ({
        ok: true,
        placa: item.placa,
        message: "Consulta almacenada en base de datos",
        fecha: item.fecha_consulta,
        propietario: {
          tipo_documento:
            item.tipo_identificacion_propietario,

          numero_documento:
            item.numero_identificacion_propietario,

          nombre_completo:
            item.nombre_razon_social_propietario,
        },
      }));

      setHistorial(data);
    } catch (error) {
      console.error(
        "Error cargando historial:",
        error.message
      );
    }
  };

  // ------------------------------------------------------
  // CARGAR PLACAS SELECCIONADAS DESDE PENDIENTES
  // ------------------------------------------------------

  const cargarPlacasSeleccionadas = ({
    placas: placasSeleccionadas,
    refrescarPendientes,
  }) => {
    setPlacas(placasSeleccionadas.join("\n"));

    setRefrescarPendientesActual(
      () => refrescarPendientes
    );

    toast.success(
      `${placasSeleccionadas.length} placa(s) cargadas para consultar`
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // ------------------------------------------------------
  // CARGA INICIAL
  // ------------------------------------------------------

  useEffect(() => {
    cargarHistorial();
  }, []);

  const recargarHistorial = () => {
    cargarHistorial();
  };

  // ------------------------------------------------------
  // CARGAR ARCHIVO EXCEL O CSV
  // ------------------------------------------------------

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];

    if (!file) return;

    const validTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
      "text/csv",
    ];

    if (
      !validTypes.includes(file.type) &&
      !file.name.endsWith(".xlsx") &&
      !file.name.endsWith(".xls") &&
      !file.name.endsWith(".csv")
    ) {
      toast.error(
        "Solo se permiten archivos Excel (.xlsx, .xls) o CSV (.csv)"
      );
      return;
    }

    setLoadingFile(true);

    try {
      const formData = new FormData();

      formData.append("archivo", file);

      const resp = await cargarPlacasPorArchivo(formData);

      if (resp.ok) {
        const placasData = resp.data.placas || [];

        const placasTexto = placasData
          .map((p) => p.placa)
          .join("\n");

        setPlacas(placasTexto);
        setArchivoPlacas(null);

        toast.success(
          `${placasData.length} placa(s) cargadas desde archivo`
        );

        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });
      } else {
        toast.error(
          resp.error || "Error al procesar archivo"
        );
      }
    } catch (err) {
      toast.error(
        "Error al subir archivo: " + err.message
      );
    } finally {
      setLoadingFile(false);
      e.target.value = "";
    }
  };

  // ------------------------------------------------------
  // CONSULTAR PLACAS
  // ------------------------------------------------------

  const handleConsultar = async () => {
    try {
      setLoading(true);
      setError("");

      const session = getLocalSession();

      if (!session?.activa) {
        toast.error(
          "Sesión RUNT vencida. Debe iniciar sesión nuevamente."
        );
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

        toast.error(
          "Debe ingresar al menos una placa"
        );

        return;
      }

      if (
        placasArray.length > session.capacidadSegura
      ) {
        toast.error(
          `Solo puede consultar ${session.capacidadSegura} placas con el tiempo restante`
        );

        return;
      }

      const resp = await consultarPlacaBatch(
        placasArray
      );

      const results = resp.results || [];

      setResultados(results);

      const exitosas = results.filter(
        (r) => r.ok
      ).length;

      const fallidas = results.filter(
        (r) => !r.ok
      ).length;

      toast.success(
        `Consulta finalizada: ${exitosas} exitosas, ${fallidas} fallidas`
      );

      await cargarHistorial();

      if (refrescarPendientesActual) {
        await refrescarPendientesActual();
      }

      setPlacas("");
    } catch (err) {
      toast.error("Error en la consulta");

      setError(
        err.response?.data?.error ||
          err.message ||
          "Error en la consulta"
      );
    } finally {
      setLoading(false);
    }
  };

  // ------------------------------------------------------
  // CREAR TRABAJO
  // ------------------------------------------------------

  const handleCrearTrabajo = async () => {
    const placasArray = procesarPlacas();

    if (placasArray.length === 0) {
      toast.error(
        "Debe ingresar al menos una placa"
      );
      return;
    }

    try {
      setLoadingJob(true);

      const items = placasArray.map((placa) => ({
        placa,
      }));

      const resp = await crearJob(
        "consulta-placa",
        items
      );

      if (resp.job?.id_job) {
        setJobActual(resp.job.id_job);

        toast.success(
          `Trabajo creado con ${items.length} placa(s)`
        );

        setPlacas("");
      }
    } catch (err) {
      toast.error(
        err.response?.data?.error ||
          "Error al crear trabajo"
      );
    } finally {
      setLoadingJob(false);
    }
  };

  // ------------------------------------------------------
  // INDICADORES
  // ------------------------------------------------------

  const totalResultados = resultados.length;

  const resultadosExitosos = resultados.filter(
    (r) => r.ok
  ).length;

  const resultadosFallidos = resultados.filter(
    (r) => !r.ok
  ).length;

  // ======================================================
  // INTERFAZ
  // ======================================================

  return (
    <div
      className="
        min-h-screen
        bg-[#E9F1FA]
        px-4 pb-6 pt-2
        md:px-6 md:pb-6 md:pt-2
      "
    >
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="mx-auto max-w-[1600px] space-y-4"
      >
        {/* ==========================================
            ENCABEZADO AZUL
        ========================================== */}

        <PageHeroHeader
          label="Consulta de placas"
          labelIcon={ClipboardList}
          title="Placas pendientes por fecha"
          description="Consulta lotes de placas pendientes por rango de fechas y estado para continuar el procesamiento."
          icon={CalendarDays}
          badgeCount={resultados.length}
          badgeLabel="resultado"
        />

        {/* ==========================================
            PANEL DE PENDIENTES POR FECHA
        ========================================== */}

        <motion.div variants={itemVariants}>
          <PendingPlatesPanel
            modulo="consulta-placa"
            onSendToQuery={cargarPlacasSeleccionadas}
          />
        </motion.div>

        {/* ==========================================
            PREPARAR LOTE DE CONSULTA
        ========================================== */}

        <motion.section
          variants={itemVariants}
          className="
            overflow-hidden
            rounded-2xl
            border border-slate-200
            bg-white shadow-sm
          "
        >
          {/* ENCABEZADO DE LA TARJETA */}

          <div
            className="
              flex flex-col gap-3
              border-b border-slate-100
              px-5 py-4
              sm:flex-row
              sm:items-center
              sm:justify-between
              md:px-6
            "
          >
            <div className="flex items-center gap-3">
              <div
                className="
                  flex h-10 w-10
                  shrink-0
                  items-center justify-center
                  rounded-xl bg-sky-50
                "
              >
                <Database
                  size={20}
                  className="text-[#00ABE4]"
                />
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Preparar lote de consulta
                </h3>

                <p className="mt-0.5 text-xs text-slate-500">
                  Ingresa las placas o carga un archivo para procesarlas.
                </p>
              </div>
            </div>

            <div
              className="
                flex items-center gap-2
                self-start rounded-full
                bg-sky-50 px-3 py-1.5
                text-xs font-semibold
                text-sky-700
                sm:self-auto
              "
            >
              <Info size={14} />
              Máximo 100 placas por lote
            </div>
          </div>

          <div className="space-y-5 p-4 md:p-6">

            {/* INDICADORES COMPACTOS */}

            <div className="grid grid-cols-3 gap-2.5">
              <IndicadorResultado
                titulo="Total"
                valor={totalResultados}
                icono={CarFront}
                tipo="primary"
              />

              <IndicadorResultado
                titulo="Exitosas"
                valor={resultadosExitosos}
                icono={CheckCircle2}
                tipo="success"
              />

              <IndicadorResultado
                titulo="Fallidas"
                valor={resultadosFallidos}
                icono={AlertCircle}
                tipo="danger"
              />
            </div>

            {/* FORMULARIO */}

            <div
              className="
                grid grid-cols-1 gap-4
                lg:grid-cols-[minmax(0,1fr)_260px]
                xl:grid-cols-[minmax(0,1fr)_280px_260px]
                xl:items-end
              "
            >
              {/* TEXTAREA */}

              <div className="min-w-0">
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700">
                    Placas a consultar
                  </label>

                  <span className="text-[11px] text-slate-400">
                    {procesarPlacas().length} cargadas
                  </span>
                </div>

                <textarea
                  value={placas}
                  onChange={(e) =>
                    setPlacas(e.target.value)
                  }
                  placeholder="Ejemplo: ABC123, EUP243, QHD596"
                  disabled={loading}
                  rows={4}
                  className="
                    block w-full min-h-[118px]
                    resize-none rounded-xl
                    border border-slate-200
                    bg-white px-4 py-3
                    text-sm text-slate-900
                    placeholder:text-slate-400
                    focus:border-[#00ABE4]
                    focus:outline-none
                    focus:ring-4
                    focus:ring-sky-100
                    disabled:cursor-not-allowed
                    disabled:bg-slate-50
                    transition-all
                  "
                />
              </div>

              {/* ARCHIVO */}

              <div className="min-w-0">
                <label className="mb-2 block text-xs font-semibold text-slate-700">
                  O cargar desde archivo
                </label>

                <label
                  className={`
                    flex min-h-[118px]
                    cursor-pointer
                    flex-col items-center
                    justify-center gap-2
                    rounded-xl border-2
                    border-dashed px-3
                    text-center transition-all
                    ${
                      loadingFile
                        ? "cursor-not-allowed border-slate-200 bg-slate-50"
                        : archivoPlacas
                        ? "border-[#00ABE4] bg-sky-50"
                        : "border-slate-200 bg-slate-50/60 hover:border-[#00ABE4] hover:bg-sky-50"
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
                      <Loader2
                        size={24}
                        className="animate-spin text-[#00ABE4]"
                      />

                      <span className="text-xs text-slate-500">
                        Procesando archivo...
                      </span>
                    </>
                  ) : archivoPlacas ? (
                    <>
                      <FileText
                        size={24}
                        className="text-[#00ABE4]"
                      />

                      <span className="max-w-full truncate text-xs font-semibold text-sky-700">
                        {archivoPlacas.name}
                      </span>
                    </>
                  ) : (
                    <>
                      <div
                        className="
                          flex h-10 w-10
                          items-center justify-center
                          rounded-xl bg-white
                          shadow-sm
                        "
                      >
                        <Upload
                          size={20}
                          className="text-[#00ABE4]"
                        />
                      </div>

                      <span className="text-xs font-semibold text-slate-700">
                        Seleccionar Excel o CSV
                      </span>

                      <span className="text-[11px] text-slate-400">
                        .xlsx, .xls, .csv
                      </span>
                    </>
                  )}
                </label>
              </div>

              {/* ACCIONES */}

              <div
                className="
                  flex flex-col gap-3
                  sm:flex-row
                  lg:col-span-2
                  xl:col-span-1
                  xl:flex-col
                "
              >
                <motion.button
                  type="button"
                  onClick={handleConsultar}
                  disabled={true}
                  whileHover={
                    loading ? {} : { scale: 1.015 }
                  }
                  whileTap={
                    loading ? {} : { scale: 0.985 }
                  }
                  className="
                    flex min-h-[51px]
                    flex-1 items-center
                    justify-center gap-2
                    rounded-xl bg-[#00ABE4]
                    px-5 py-3 text-sm
                    font-bold text-white
                    shadow-sm transition-all
                    hover:bg-[#0095C5]
                    hover:shadow-md
                    disabled:cursor-not-allowed
                    disabled:bg-slate-300
                    xl:w-full
                  "
                >
                  {loading ? (
                    <>
                      <Loader2
                        size={18}
                        className="animate-spin"
                      />
                      Consultando...
                    </>
                  ) : (
                    <>
                      <Search size={18} />
                      Buscar lote
                    </>
                  )}
                </motion.button>

                <motion.button
                  type="button"
                  onClick={handleCrearTrabajo}
                  disabled={loadingJob}
                  whileHover={
                    loadingJob ? {} : { scale: 1.015 }
                  }
                  whileTap={
                    loadingJob ? {} : { scale: 0.985 }
                  }
                  className="
                    flex min-h-[51px]
                    flex-1 items-center
                    justify-center gap-2
                    rounded-xl bg-emerald-500
                    px-5 py-3 text-sm
                    font-bold text-white
                    shadow-sm transition-all
                    hover:bg-emerald-600
                    hover:shadow-md
                    disabled:cursor-not-allowed
                    disabled:bg-slate-300
                    xl:w-full
                  "
                >
                  {loadingJob ? (
                    <>
                      <Loader2
                        size={18}
                        className="animate-spin"
                      />
                      Creando...
                    </>
                  ) : (
                    <>
                      <Briefcase size={18} />
                      Crear trabajo
                    </>
                  )}
                </motion.button>
              </div>
            </div>

            {/* MENSAJE ERROR */}

            {error && (
              <motion.div
                initial={{
                  opacity: 0,
                  y: -8,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                className="
                  flex items-start gap-3
                  rounded-xl border
                  border-red-100 bg-red-50
                  px-4 py-3
                "
              >
                <AlertCircle
                  size={18}
                  className="mt-0.5 shrink-0 text-red-500"
                />

                <p className="text-sm text-red-700">
                  {error}
                </p>
              </motion.div>
            )}
          </div>
        </motion.section>

        {/* ==========================================
            SKELETON DE CARGA
        ========================================== */}

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
                initial={{
                  opacity: 0,
                  y: 15,
                }}
                animate={{
                  opacity: [0.5, 1, 0.5],
                  y: 0,
                  transition: {
                    duration: 1.5,
                    repeat: Infinity,
                    delay: i * 0.2,
                  },
                }}
                className="
                  relative overflow-hidden
                  rounded-2xl border
                  border-slate-200 bg-white
                  p-5 shadow-sm
                "
              >
                <div className="relative space-y-3">
                  <div className="flex gap-3">
                    <div className="h-6 w-24 rounded-lg bg-[#E9F1FA]" />

                    <div className="h-5 w-20 rounded-lg bg-[#E9F1FA]" />
                  </div>

                  <div className="h-4 w-48 rounded-lg bg-[#E9F1FA]" />

                  <div className="h-4 w-full rounded-lg bg-[#E9F1FA]" />

                  <div className="h-4 w-3/4 rounded-lg bg-[#E9F1FA]" />
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* ==========================================
            PROGRESO DEL TRABAJO
        ========================================== */}

        {jobActual && (
          <motion.section
            initial={{
              opacity: 0,
              y: 12,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
          >
            <JobProgress
              jobId={jobActual}
              onClose={() => {
                setJobActual(null);
                recargarHistorial();
              }}
              onComplete={recargarHistorial}
            />
          </motion.section>
        )}

        {/* ==========================================
            RESULTADOS DE CONSULTAS
        ========================================== */}

        <motion.div variants={itemVariants}>
          <QueryResultsSwiper
            resultados={resultados}
            onViewDetail={setDetalle}
          />
        </motion.div>

        {/* ==========================================
            HISTORIAL DE CONSULTAS
        ========================================== */}

        <motion.div variants={itemVariants}>
          <QueryHistoryTable
            data={historial}
            onViewDetail={setDetalle}
          />
        </motion.div>

        {/* ==========================================
            MODAL DE DETALLES
        ========================================== */}

        <DetailModal
          open={!!detalle}
          item={detalle}
          onClose={() => setDetalle(null)}
        />
      </motion.div>
    </div>
  );
}
