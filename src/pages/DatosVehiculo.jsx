
import { useEffect, useState } from "react";

import {
  consultarDatosVehiculoBatch,
  listarHistorialVehiculos,
} from "../services/vehicleQueryApi";

import { crearJob } from "../services/workerJobsApi";

import PendingPlatesPanel from "../components/PendingPlatesPanel";
import DetailModal from "../components/DetailModal";
import QueryHistoryTable from "../components/QueryHistoryTable";
import QueryResultsSwiper from "../components/QueryResultsSwiper";
import JobProgress from "../components/JobProgress";
import PageHeroHeader from "../components/PageHeroHeader";

import toast from "react-hot-toast";

import {
  Search,
  Loader2,
  Briefcase,
  CarFront,
  ClipboardList,
  AlertCircle,
  CheckCircle2,
  Database,
  Info,
} from "lucide-react";

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

        <p className={`mt-0.5 text-xl font-bold ${estilo.numero}`}>
          {valor}
        </p>
      </div>
    </div>
  );
}

// ========================================================
// COMPONENTE PRINCIPAL
// ========================================================

export default function DatosVehiculo() {
  // ------------------------------------------------------
  // ESTADOS
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

  // ------------------------------------------------------
  // INDICADORES
  // ------------------------------------------------------

  const totalResultados = resultados.length;

  const exitosas = resultados.filter(
    (r) => r.ok
  ).length;

  const fallidas = resultados.filter(
    (r) => !r.ok
  ).length;

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
        "datos-vehiculo",
        100
      );

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
          modelo: item.modelo,
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
  // CARGAR PLACAS DESDE PANEL DE PENDIENTES
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

  // ------------------------------------------------------
  // CONSULTAR DATOS DEL VEHÍCULO
  // ------------------------------------------------------

  const handleConsultar = async () => {
    try {
      setLoading(true);
      setError("");

      const placasArray = procesarPlacas();

      if (placasArray.length === 0) {
        setError("Debe ingresar al menos una placa");
        return;
      }

      const resp = await consultarDatosVehiculoBatch(
        placasArray
      );

      const results = resp.results || [];

      setResultados(results);

      // Contar los resultados de la consulta actual.
      const exitosasActuales = results.filter(
        (r) => r.ok
      ).length;

      const fallidasActuales = results.filter(
        (r) => !r.ok
      ).length;

      toast.success(
        `Datos consultados: ${exitosasActuales} exitosas, ${fallidasActuales} fallidas`
      );

      await cargarHistorial();

      if (refrescarPendientesActual) {
        await refrescarPendientesActual();
      }

      setPlacas("");
    } catch (err) {
      toast.error(
        "Error consultando datos del vehículo"
      );

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
      toast.error("Debe ingresar al menos una placa");
      return;
    }

    try {
      setLoadingJob(true);

      const items = placasArray.map((placa) => ({
        placa,
      }));

      const resp = await crearJob(
        "datos-vehiculo",
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
      <div className="mx-auto max-w-[1600px] space-y-4">

        {/* ==========================================
            ENCABEZADO PRINCIPAL
        ========================================== */}

        <PageHeroHeader
          label="Datos del vehículo"
          labelIcon={CarFront}
          title="Consulta de placas listas para datos vehículo"
          description="Consulta las placas que ya tienen información base registrada y están listas para completar los datos del vehículo."
          icon={ClipboardList}
          badgeCount={resultados.length}
          badgeLabel="resultado"
        />

        {/* ==========================================
            PANEL DE PLACAS PENDIENTES POR FECHA
        ========================================== */}

        <PendingPlatesPanel
          modulo="datos-vehiculo"
          onSendToQuery={cargarPlacasSeleccionadas}
        />

        {/* ==========================================
            FORMULARIO DE CONSULTA
        ========================================== */}

        <section
          className="
            overflow-hidden rounded-2xl
            border border-slate-200
            bg-white shadow-sm
          "
        >
          {/* ENCABEZADO */}

          <div
            className="
              flex flex-col gap-3
              border-b border-slate-100
              px-5 py-4
              sm:flex-row sm:items-center
              sm:justify-between md:px-6
            "
          >
            <div className="flex items-center gap-3">
              <div
                className="
                  flex h-10 w-10 shrink-0
                  items-center justify-center
                  rounded-xl bg-emerald-50
                "
              >
                <CarFront
                  size={20}
                  className="text-emerald-600"
                />
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Preparar lote de datos del vehículo
                </h3>

                <p className="mt-0.5 text-xs text-slate-500">
                  Revisa las placas cargadas y ejecuta su consulta.
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

            {/* CONTADORES */}

            <div className="grid grid-cols-3 gap-2.5">
              <IndicadorResultado
                titulo="Total"
                valor={totalResultados}
                icono={Database}
                tipo="primary"
              />

              <IndicadorResultado
                titulo="Exitosas"
                valor={exitosas}
                icono={CheckCircle2}
                tipo="success"
              />

              <IndicadorResultado
                titulo="Fallidas"
                valor={fallidas}
                icono={AlertCircle}
                tipo="danger"
              />
            </div>

            {/* FORMULARIO */}

            <div
              className="
                grid grid-cols-1
                items-end gap-4
                lg:grid-cols-[minmax(0,1fr)_240px]
              "
            >
              {/* PLACAS */}

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
                    block min-h-[118px] w-full
                    resize-none rounded-xl
                    border border-slate-200
                    bg-white px-4 py-3
                    text-sm text-slate-900
                    placeholder:text-slate-400
                    focus:border-emerald-500
                    focus:outline-none
                    focus:ring-4 focus:ring-emerald-100
                    disabled:cursor-not-allowed
                    disabled:bg-slate-50
                    transition-all
                  "
                />
              </div>

              {/* BOTONES */}

              <div className="flex flex-col gap-3">

                <button
                  type="button"
                  onClick={handleConsultar}
                  disabled={true}
                  className="
                    flex min-h-[51px]
                    items-center justify-center gap-2
                    rounded-xl bg-emerald-500
                    px-5 py-3 text-sm font-bold
                    text-white shadow-sm
                    transition-all
                    hover:bg-emerald-600
                    hover:shadow-md
                    disabled:cursor-not-allowed
                    disabled:bg-slate-300
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
                </button>

                <button
                  type="button"
                  onClick={handleCrearTrabajo}
                  disabled={loadingJob}
                  className="
                    flex min-h-[51px]
                    items-center justify-center gap-2
                    rounded-xl bg-[#00ABE4]
                    px-5 py-3 text-sm font-bold
                    text-white shadow-sm
                    transition-all
                    hover:bg-[#0095C5]
                    hover:shadow-md
                    disabled:cursor-not-allowed
                    disabled:bg-slate-300
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
                </button>

              </div>
            </div>

            {/* ERROR */}

            {error && (
              <div
                className="
                  flex items-start gap-3
                  rounded-xl border border-red-100
                  bg-red-50 px-4 py-3
                "
              >
                <AlertCircle
                  size={18}
                  className="mt-0.5 shrink-0 text-red-500"
                />

                <span className="text-sm text-red-700">
                  {error}
                </span>
              </div>
            )}

          </div>
        </section>

        {/* ==========================================
            INDICADOR DE CARGA
        ========================================== */}

        {loading && (
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5 shadow-sm">
            <div className="flex items-center gap-4">
              <Loader2
                size={28}
                className="shrink-0 animate-spin text-emerald-600"
              />

              <div className="flex-1">
                <p className="text-sm font-semibold text-emerald-800">
                  Consultando datos del vehículo...
                </p>

                <p className="mt-1 text-xs text-emerald-600">
                  Procesando las placas seleccionadas.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ==========================================
            PROGRESO DEL TRABAJO
        ========================================== */}

        {jobActual && (
          <div className="animate-fade-in">
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

        {/* ==========================================
            RESULTADOS
        ========================================== */}

        {resultados.length > 0 && (
          <div className="animate-fade-in">
            <QueryResultsSwiper
              resultados={resultados}
              onViewDetail={setDetalle}
            />
          </div>
        )}

        {/* ==========================================
            HISTORIAL
        ========================================== */}

        {historial.length > 0 && (
          <div className="animate-fade-in">
            <QueryHistoryTable
              data={historial}
              onViewDetail={setDetalle}
            />
          </div>
        )}

        {/* ==========================================
            MODAL DE DETALLE
        ========================================== */}

        <DetailModal
          open={!!detalle}
          item={detalle}
          onClose={() => setDetalle(null)}
        />

      </div>
    </div>
  );
}
