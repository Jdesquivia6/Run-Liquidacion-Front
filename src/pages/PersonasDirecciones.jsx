
import { useEffect, useState } from "react";
import {
  MapPin, Users, Search, Loader2, CheckCircle, XCircle,
  AlertCircle, RefreshCw, Briefcase, Download, Database,
  FileText, ChevronLeft, ChevronRight, ChevronDown,
  ListFilter, Layers, ClipboardList, X, CalendarDays, Info
} from "lucide-react";
import toast from "react-hot-toast";
import { crearJob } from "../services/workerJobsApi";
import JobProgress from "../components/JobProgress";
import { API_BASE } from "../config";
import * as XLSX from "xlsx";

// ======================================================
// ESTILOS AUTOCORE
// ======================================================

const CARD = "rounded-2xl border border-slate-200 bg-white shadow-sm";
const INPUT = "h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-[#00ABE4] focus:ring-4 focus:ring-sky-100";
const BTN = "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm";
const PRIMARY = `${BTN} bg-[#00ABE4] text-white hover:bg-[#0095C5]`;
const SUCCESS = `${BTN} bg-emerald-600 text-white hover:bg-emerald-700`;
const OUTLINE = `${BTN} border border-slate-200 bg-white text-slate-600 hover:bg-slate-50`;
const TH = "whitespace-nowrap px-3 py-3 text-left text-xs font-semibold";
const TD = "px-3 py-2.5 text-xs text-slate-600";
const PAGE_SIZE = 12;

const tipoDocumentoOptions = [
  "C.C. Cédula Ciudadanía",
  "P. Pasaporte",
  "C.E. Cédula de Extranjería",
  "T.I. Tarjeta de Identidad",
  "R.C. Registro Civil",
  "C.D. Carnet Diplomático",
  "P.P.T. Permiso por Protección Temporal"
];

const filtrosVacios = {
  origen: "",
  estado: "",
  documento: "",
  fecha_inicio: "",
  fecha_fin: ""
};

// ======================================================
// COMPONENTES VISUALES
// ======================================================

function EncabezadoSeccion({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-4 lg:flex-row lg:items-center lg:justify-between md:px-5">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50">
          <Icon size={19} className="text-[#00ABE4]" />
        </div>
        <div className="min-w-0">
          <h3 className="text-base font-bold text-slate-900">{title}</h3>
          {description && (
            <p className="mt-0.5 text-xs text-slate-500">{description}</p>
          )}
        </div>
      </div>
      {action && (
        <div className="flex flex-wrap items-center gap-2">{action}</div>
      )}
    </div>
  );
}

function ResultadoCard({ icon: Icon, title, value, tone = "sky" }) {
  const tones = {
    sky: "bg-sky-50 text-sky-700",
    green: "bg-emerald-50 text-emerald-700",
    red: "bg-red-50 text-red-700",
    amber: "bg-amber-50 text-amber-700",
    slate: "bg-slate-50 text-slate-700"
  };

  return (
    <div className={`flex items-center gap-3 rounded-xl border border-slate-100 p-3 ${tones[tone]}`}>
      <div className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/80 sm:flex">
        <Icon size={19} />
      </div>
      <div>
        <p className="text-[11px] font-medium opacity-75">{title}</p>
        <p className="text-xl font-bold">{value ?? 0}</p>
      </div>
    </div>
  );
}

function EstadoBadge({ children, className = "" }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${className}`}>
      {children}
    </span>
  );
}

// ======================================================
// COMPONENTE PRINCIPAL
// ======================================================

export default function PersonasDirecciones() {
  const [documentos, setDocumentos] = useState("");
  const [tipoDocumentoManual, setTipoDocumentoManual] = useState(tipoDocumentoOptions[0]);
  const [loading, setLoading] = useState(false);
  const [loadingJob, setLoadingJob] = useState(false);
  const [modoJobsCarrera, setModoJobsCarrera] = useState(false);
  const [colaJobs, setColaJobs] = useState([]);
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState("");
  const [tipoGrupoCargado, setTipoGrupoCargado] = useState(null);
  const [jobActual, setJobActual] = useState(null);
  const [historialDirecciones, setHistorialDirecciones] = useState([]);

  const [personasPendientes, setPersonasPendientes] = useState([]);
  const [gruposPendientes, setGruposPendientes] = useState([]);
  const [cargandoPendientes, setCargandoPendientes] = useState(false);
  const [mostrarPendientes, setMostrarPendientes] = useState(false);
  const [limitPendientes, setLimitPendientes] = useState(90);
  const [grupoDetalleAbierto, setGrupoDetalleAbierto] = useState(null);
  const [paginaDetalle, setPaginaDetalle] = useState(1);

  const [mostrarConsolidado, setMostrarConsolidado] = useState(false);
  const [cargandoConsolidado, setCargandoConsolidado] = useState(false);
  const [datosConsolidado, setDatosConsolidado] = useState({
    results: [],
    origenes: [],
    pagination: { page: 1, limit: 20, total: 0, totalPages: 0 }
  });
  const [filtrosConsolidado, setFiltrosConsolidado] = useState(filtrosVacios);

  // ======================================================
  // CARGAR PENDIENTES DESDE BD
  // ======================================================

  const cargarPersonasPendientes = async (limit = limitPendientes) => {
    try {
      setCargandoPendientes(true);

      const response = await fetch(
        `${API_BASE}/personas/direcciones/personas-pendientes-direcciones?limit=${limit}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error cargando personas pendientes");
      }

      setPersonasPendientes(
        (data.personas || []).filter(p => p.tipo_documento !== "NIT")
      );
      setGruposPendientes(
        (data.grupos || []).filter(g => g.tipoDocumento !== "NIT")
      );
      setMostrarPendientes(true);

      if (data.grupos?.length > 0) {
        const primerGrupo = data.grupos[0];
        setDocumentos((primerGrupo.documentos || []).join("\n"));

        if (primerGrupo.tipoDocumento) {
          setTipoDocumentoManual(primerGrupo.tipoDocumento);
          setTipoGrupoCargado(primerGrupo.tipoDocumento);
        }
      } else {
        setDocumentos("");
        setTipoGrupoCargado(null);
      }

      toast.success(
        `${data.total} pendiente(s). Se cargó el primer tipo para no mezclar documentos.`
      );
      return data;
    } catch (err) {
      toast.error(err.message);
      setError(err.message);
      return null;
    } finally {
      setCargandoPendientes(false);
    }
  };

  // ======================================================
  // HISTORIAL
  // ======================================================

  const cargarHistorialDirecciones = async () => {
    try {
      const response = await fetch(
        `${API_BASE}/personas/direcciones/historial-direcciones`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error cargando historial de direcciones");
      }

      setHistorialDirecciones(data.results || []);
    } catch (err) {
      console.error("Error cargando historial direcciones:", err.message);
    }
  };

  // ======================================================
  // VISTA CONSOLIDADA
  // ======================================================

  const cargarConsolidado = async (pagina = 1, filtros = filtrosConsolidado) => {
    try {
      setCargandoConsolidado(true);

      const params = new URLSearchParams({
        page: pagina,
        limit: datosConsolidado.pagination.limit
      });

      if (filtros.origen) params.append("origen", filtros.origen);
      if (filtros.estado) params.append("estado", filtros.estado);
      if (filtros.documento) params.append("documento", filtros.documento);
      if (filtros.fecha_inicio) params.append("fecha_inicio", filtros.fecha_inicio);
      if (filtros.fecha_fin) params.append("fecha_fin", filtros.fecha_fin);

      const response = await fetch(
        `${API_BASE}/personas/direcciones/consolidado?${params.toString()}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error cargando el consolidado");
      }

      setDatosConsolidado(data.data);
      setMostrarConsolidado(true);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setCargandoConsolidado(false);
    }
  };

  const handleFiltroConsolidado = (e) => {
    setFiltrosConsolidado(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const estadoConsolidado = (row) => {
    switch (row.estado_publico) {
      case "ENCONTRADA":
        return { label: "Encontrada", class: "bg-emerald-100 text-emerald-700" };
      case "PENDIENTE":
        return { label: "Pendiente", class: "bg-amber-100 text-amber-700" };
      case "EN_PROCESO":
        return { label: "En proceso", class: "bg-blue-100 text-blue-700" };
      case "SIN_INFORMACION":
        return { label: "Sin información", class: "bg-slate-100 text-slate-700" };
      case "ERROR":
        return { label: "Error", class: "bg-red-100 text-red-700" };
      default:
        return {
          label: row.estado_publico || "—",
          class: "bg-slate-100 text-slate-700"
        };
    }
  };

  // ======================================================
  // EXPORTAR EXCEL
  // ======================================================

  const exportarExcel = () => {
    if (historialDirecciones.length === 0) {
      toast.error("No hay datos para exportar");
      return;
    }

    const columnas = [
      "Tipo Documento", "Número Documento", "Nombres", "Apellidos",
      "Celular", "Correo", "Dirección", "Municipio / Departamento",
      "Teléfono", "Tipo Dirección", "Fecha Consulta"
    ];

    const filas = historialDirecciones.map(item => [
      item.tipo_documento || "",
      item.numero_documento || "",
      item.nombres || "",
      item.apellidos || "",
      item.celular || "",
      item.correo || "",
      item.direccion || "",
      item.municio_departamento || "",
      item.telefono || "",
      item.tipo_direccion || "",
      item.fecha_consulta_direccion
        ? new Date(item.fecha_consulta_direccion).toLocaleString(
            "es-CO", { timeZone: "America/Bogota" }
          )
        : ""
    ]);

    const ws = XLSX.utils.aoa_to_sheet([columnas, ...filas]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Historial Direcciones");
    ws["!cols"] = columnas.map(() => ({ wch: 22 }));

    XLSX.writeFile(
      wb,
      `historial_direcciones_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
    toast.success(`Excel generado: ${historialDirecciones.length} registro(s)`);
  };

  // ======================================================
  // GRUPOS DE DOCUMENTOS
  // ======================================================

  const cargarGrupoEnTextarea = (grupo) => {
    const docs = grupo.documentos || [];
    setDocumentos(docs.join("\n"));

    if (grupo.tipoDocumento) {
      setTipoDocumentoManual(grupo.tipoDocumento);
      setTipoGrupoCargado(grupo.tipoDocumento);
    }

    setMostrarPendientes(false);
    toast.success(
      `${docs.length} documento(s) del grupo "${grupo.tipoDocumento}" cargado(s)`
    );
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const seleccionarGrupo = (grupo) => cargarGrupoEnTextarea(grupo);

  const toggleDetalleGrupo = (grupo) => {
    const key = grupo.tipoDocumento;

    if (grupoDetalleAbierto === key) {
      setGrupoDetalleAbierto(null);
      setPaginaDetalle(1);
      return;
    }

    setGrupoDetalleAbierto(key);
    setPaginaDetalle(1);
  };

  const documentosArray = documentos
    .split(/[\n,;]+/)
    .map(d => d.trim())
    .filter(Boolean);

  // ======================================================
  // CONSULTA MANUAL
  // ======================================================

  const handleConsultarUnGrupo = async () => {
    if (documentosArray.length === 0) {
      toast.error("No hay documentos para consultar");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setResultado(null);

      const response = await fetch(
        `${API_BASE}/personas/direcciones/consultar-direcciones-pn-batch`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tipoDocumento: tipoDocumentoManual,
            documentos: documentosArray
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error en la consulta");
      }

      setResultado(data);
      toast.success(`Procesados ${data.processed}/${data.requested} documentos`);
      setDocumentos("");

      if (tipoGrupoCargado) {
        const idxActual = gruposPendientes.findIndex(
          g => g.tipoDocumento === tipoGrupoCargado
        );

        const siguienteGrupo = idxActual >= 0
          ? gruposPendientes
              .slice(idxActual + 1)
              .find(g => (g.documentos || []).length > 0)
          : null;

        if (siguienteGrupo) {
          const docsSiguiente = siguienteGrupo.documentos || [];
          setDocumentos(docsSiguiente.join("\n"));
          setTipoDocumentoManual(
            siguienteGrupo.tipoDocumento || tipoDocumentoManual
          );
          setTipoGrupoCargado(siguienteGrupo.tipoDocumento || null);
          toast.success(
            `Siguiente grupo: ${siguienteGrupo.tipoDocumento} (${docsSiguiente.length})`
          );
        } else {
          setTipoGrupoCargado(null);
          toast.success("Todos los grupos han sido procesados", {
            icon: <CheckCircle size={20} className="text-emerald-500" />
          });
        }
      }
    } catch (err) {
      toast.error(err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ======================================================
  // CREACIÓN DE TRABAJOS
  // ======================================================

  const crearTrabajoConDocumentos = async (tipoDocumento, docs) => {
    const items = docs
      .map(doc => ({
        tipoDocumento,
        numeroDocumento: String(doc || "").trim()
      }))
      .filter(item => item.numeroDocumento);

    if (!items.length) {
      throw new Error("No hay documentos válidos para crear el trabajo");
    }

    const resp = await crearJob("personas-direcciones", items);

    if (!resp.job?.id_job) {
      throw new Error("No se recibió id de trabajo");
    }

    setJobActual(resp.job.id_job);
    toast.success(`Trabajo creado: ${tipoDocumento} (${items.length})`);
  };

  const handleCrearTrabajo = async () => {
    if (documentosArray.length === 0) {
      toast.error("Debe cargar documentos primero");
      return;
    }

    try {
      setLoadingJob(true);

      if (tipoGrupoCargado && gruposPendientes.length > 0) {
        const idxActual = gruposPendientes.findIndex(
          g => g.tipoDocumento === tipoGrupoCargado
        );

        const cola = idxActual >= 0
          ? gruposPendientes
              .slice(idxActual + 1)
              .filter(g => (g.documentos || []).length > 0)
              .map(g => ({
                tipoDocumento: g.tipoDocumento,
                documentos: g.documentos || []
              }))
          : [];

        setModoJobsCarrera(true);
        setColaJobs(cola);
      } else {
        setModoJobsCarrera(false);
        setColaJobs([]);
      }

      await crearTrabajoConDocumentos(tipoDocumentoManual, documentosArray);
      setDocumentos("");
    } catch (err) {
      toast.error(err.response?.data?.error || "Error al crear trabajo");
    } finally {
      setLoadingJob(false);
    }
  };

  const handleLimpiar = () => {
    setDocumentos("");
    setResultado(null);
    setError("");
    setModoJobsCarrera(false);
    setColaJobs([]);
    setPersonasPendientes([]);
    setGruposPendientes([]);
    setTipoGrupoCargado(null);
  };

  useEffect(() => {
    cargarHistorialDirecciones();
  }, []);

  // ======================================================
  // PAGINACIÓN DE GRUPOS
  // ======================================================

  const grupos = gruposPendientes.map(grupo => ({
    ...grupo,
    count: (grupo.documentos || []).length,
    personas: grupo.personas || []
  }));

  const grupoActivo = grupos.find(
    g => g.tipoDocumento === grupoDetalleAbierto
  ) || null;

  const totalPaginasDetalle = grupoActivo
    ? Math.max(1, Math.ceil(grupoActivo.personas.length / PAGE_SIZE))
    : 1;

  const personasPaginaDetalle = grupoActivo
    ? grupoActivo.personas.slice(
        (paginaDetalle - 1) * PAGE_SIZE,
        paginaDetalle * PAGE_SIZE
      )
    : [];

  // ======================================================
  // INTERFAZ
  // ======================================================

  return (
    <div className="min-h-screen bg-[#E9F1FA] px-4 pb-6 pt-2 md:px-6">
      <div className="mx-auto max-w-[1600px] space-y-4">

        {/* ================================================
            ENCABEZADO AZUL
        ================================================ */}

        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#00ABE4] to-[#0095C5] px-6 py-5 text-white shadow-lg md:px-8">
          <MapPin
            size={110}
            className="absolute right-6 top-1/2 hidden -translate-y-1/2 opacity-15 md:block"
          />

          <div className="relative z-10 max-w-3xl">
            <div className="flex items-center gap-2 text-xs font-semibold tracking-wide text-sky-100">
              <Users size={15} />
              PERSONAS · DIRECCIONES
            </div>

            <h1 className="mt-2 text-2xl font-bold tracking-tight md:text-3xl">
              Consulta de Direcciones RUNT
            </h1>

            <p className="mt-2 text-sm leading-relaxed text-sky-50">
              Consulta manual de documentos y procesamiento de personas
              provenientes de fotomultas, Excel y servicios API.
            </p>
          </div>
        </section>

        {/* ================================================
            BARRA DE ACCIONES - SIEMPRE VISIBLE
        ================================================ */}

        <section className={`${CARD} px-4 py-3 md:px-5`}>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Gestión de documentos
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Carga pendientes desde la BD o consulta todos los orígenes.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => cargarPersonasPendientes(limitPendientes)}
                disabled={cargandoPendientes || loading || loadingJob || !!jobActual}
                className={`${BTN} border border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100`}
                title={
                  jobActual
                    ? "Finaliza el trabajo actual antes de cargar otro lote"
                    : "Cargar documentos pendientes desde la BD"
                }
              >
                {cargandoPendientes ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Database size={16} />
                )}
                {cargandoPendientes
                  ? "Cargando pendientes..."
                  : "Cargar pendientes desde BD"}
              </button>

              <button
                type="button"
                onClick={() =>
                  mostrarConsolidado
                    ? setMostrarConsolidado(false)
                    : cargarConsolidado(1)
                }
                className={mostrarConsolidado ? OUTLINE : PRIMARY}
              >
                <Layers size={16} />
                {mostrarConsolidado
                  ? "Ocultar consolidado"
                  : "Vista consolidada"}
              </button>
            </div>
          </div>
        </section>

        {/* ================================================
            PERSONAS PENDIENTES - ARRIBA DEL FORMULARIO
        ================================================ */}

        {mostrarPendientes && personasPendientes.length > 0 && (
          <section className={`${CARD} overflow-hidden`}>
            <EncabezadoSeccion
              icon={Database}
              title="Personas pendientes de consultar"
              description={`${personasPendientes.length} persona(s) sin dirección consultada`}
              action={
                <>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-slate-500">
                      Lote:
                    </span>

                    <select
                      value={limitPendientes}
                      onChange={e => setLimitPendientes(Number(e.target.value))}
                      className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none focus:border-[#00ABE4]"
                      aria-label="Cantidad de pendientes"
                    >
                      <option value={50}>50</option>
                      <option value={90}>90</option>
                      <option value={100}>100</option>
                      <option value={200}>200</option>
                      <option value={500}>500</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={() => cargarPersonasPendientes(limitPendientes)}
                    disabled={cargandoPendientes || loading || loadingJob || !!jobActual}
                    className={OUTLINE}
                  >
                    <RefreshCw
                      size={15}
                      className={cargandoPendientes ? "animate-spin" : ""}
                    />
                    Recargar
                  </button>

                  <button
                    type="button"
                    onClick={() => setMostrarPendientes(false)}
                    className={OUTLINE}
                  >
                    <X size={15} />
                    Cerrar
                  </button>
                </>
              }
            />

            <div className="space-y-3 p-4 md:p-5">

              {/* RESUMEN DE GRUPOS */}

              <div className="flex flex-col gap-3 rounded-xl border border-sky-100 bg-sky-50/70 p-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white">
                    <ClipboardList size={19} className="text-[#00ABE4]" />
                  </div>

                  <div>
                    <p className="text-xs font-bold text-slate-800">
                      Documentos agrupados por tipo
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {grupos.length} grupo(s) disponibles para procesamiento
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (!grupos.length) {
                      toast.error("No hay grupos para cargar");
                      return;
                    }
                    cargarGrupoEnTextarea(grupos[0]);
                  }}
                  className={PRIMARY}
                >
                  <CheckCircle size={16} />
                  Cargar primer grupo ({grupos[0]?.tipoDocumento || "sin tipo"})
                </button>
              </div>

              {/* TARJETAS POR TIPO DE DOCUMENTO */}

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {grupos.map((grupo, idx) => {
                  const abierto =
                    grupoDetalleAbierto === grupo.tipoDocumento;

                  return (
                    <div
                      key={idx}
                      className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 transition-colors ${
                        abierto
                          ? "border-sky-300 bg-sky-50/60"
                          : "border-slate-200 bg-white hover:border-sky-200"
                      }`}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E9F1FA]">
                          <FileText
                            size={19}
                            className="text-[#00ABE4]"
                          />
                        </div>

                        <div className="min-w-0">
                          <p className="break-words text-sm font-bold text-slate-800">
                            {grupo.tipoDocumento}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-500">
                            {grupo.count} documento(s)
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => toggleDetalleGrupo(grupo)}
                          className={`${OUTLINE} !px-3 !py-2 !text-xs`}
                        >
                          {abierto ? "Ocultar detalle" : "Ver detalle"}
                        </button>

                        <button
                          type="button"
                          onClick={() => seleccionarGrupo(grupo)}
                          className={`${PRIMARY} !px-3 !py-2 !text-xs`}
                        >
                          <CheckCircle size={14} />
                          Cargar ({grupo.count})
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* DETALLE DEL GRUPO */}

              {grupoActivo && (
                <div className="overflow-hidden rounded-xl border border-slate-200">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-slate-50/50 px-4 py-3">
                    <h4 className="text-sm font-bold text-slate-800">
                      Detalle: {grupoActivo.tipoDocumento}
                    </h4>
                    <span className="text-xs text-slate-500">
                      Página {paginaDetalle} de {totalPaginasDetalle}
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[500px]">
                      <thead className="bg-[#E9F1FA] text-slate-600">
                        <tr>
                          <th className={TH}>Documento</th>
                          <th className={TH}>Nombre</th>
                          <th className={TH}>Placa</th>
                        </tr>
                      </thead>

                      <tbody>
                        {personasPaginaDetalle.map((persona, i) => (
                          <tr
                            key={i}
                            className="border-t border-slate-100 hover:bg-slate-50"
                          >
                            <td className={`${TD} font-mono font-semibold text-slate-800`}>
                              {persona.numero_documento}
                            </td>
                            <td className={TD}>
                              {persona.nombres || ""} {persona.apellidos || ""}
                            </td>
                            <td className={`${TD} font-semibold text-[#0095C5]`}>
                              {persona.placa || "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex items-center justify-end gap-2 border-t border-slate-100 p-3">
                    <button
                      type="button"
                      onClick={() => setPaginaDetalle(p => Math.max(1, p - 1))}
                      disabled={paginaDetalle === 1}
                      className={OUTLINE}
                    >
                      <ChevronLeft size={14} />
                      Anterior
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setPaginaDetalle(p =>
                          Math.min(totalPaginasDetalle, p + 1)
                        )
                      }
                      disabled={paginaDetalle === totalPaginasDetalle}
                      className={OUTLINE}
                    >
                      Siguiente
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ================================================
            PREPARAR CONSULTA MANUAL
        ================================================ */}

        <section className={`${CARD} overflow-hidden`}>
          <EncabezadoSeccion
            icon={ClipboardList}
            title="Preparar consulta de direcciones"
            description="Ingresa documentos manualmente o utiliza los grupos cargados desde BD."
            action={
              <EstadoBadge className="bg-sky-50 text-sky-700">
                <FileText size={13} className="mr-1" />
                {documentosArray.length} documento(s)
              </EstadoBadge>
            }
          />

          <div className="p-4 md:p-5">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">

              {/* TIPO DE DOCUMENTO */}

              <div className="min-w-0">
                <label className="mb-2 block text-xs font-bold text-slate-700">
                  Tipo de documento
                </label>

                <div className="relative">
                  <select
                    value={tipoDocumentoManual}
                    onChange={e => setTipoDocumentoManual(e.target.value)}
                    className={`${INPUT} appearance-none pr-10`}
                  >
                    {!tipoDocumentoOptions.includes(tipoDocumentoManual) && (
                      <option value={tipoDocumentoManual}>
                        {tipoDocumentoManual}
                      </option>
                    )}

                    {tipoDocumentoOptions.map(tipo => (
                      <option key={tipo} value={tipo}>
                        {tipo}
                      </option>
                    ))}
                  </select>

                  <ChevronDown
                    size={16}
                    className="pointer-events-none absolute right-3 top-3.5 text-slate-400"
                  />
                </div>

                <div className="mt-3 rounded-xl bg-sky-50 p-3">
                  <div className="flex items-start gap-2">
                    <Info
                      size={16}
                      className="mt-0.5 shrink-0 text-[#00ABE4]"
                    />
                    <p className="text-xs leading-relaxed text-slate-600">
                      Los documentos pendientes se cargan por tipo,
                      sin mezclarlos durante la consulta.
                    </p>
                  </div>
                </div>

                {tipoGrupoCargado && (
                  <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                    <p className="text-[11px] font-medium text-emerald-700">
                      Grupo cargado
                    </p>
                    <p className="mt-1 break-words text-sm font-bold text-emerald-800">
                      {tipoGrupoCargado}
                    </p>
                  </div>
                )}
              </div>

              {/* DOCUMENTOS */}

              <div className="min-w-0">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <label className="text-xs font-bold text-slate-700">
                    Números de documento
                  </label>

                  <span className="text-[11px] text-slate-400">
                    Uno por línea o separados por coma
                  </span>
                </div>

                <textarea
                  value={documentos}
                  onChange={e => {
                    setDocumentos(e.target.value);
                    setTipoGrupoCargado(null);
                  }}
                  placeholder={"Ingrese los números de documento:\n12345678\n87654321\n11223344"}
                  className="h-[145px] w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-[#00ABE4] focus:ring-4 focus:ring-sky-100"
                />
              </div>
            </div>

            {/* ACCIONES */}

            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={handleCrearTrabajo}
                disabled={loadingJob || documentosArray.length === 0}
                className={SUCCESS}
              >
                {loadingJob ? (
                  <Loader2 size={17} className="animate-spin" />
                ) : (
                  <Briefcase size={17} />
                )}
                {loadingJob ? "Creando..." : "Crear trabajo"}
              </button>

              <button
                type="button"
                onClick={handleConsultarUnGrupo}
                disabled={true || documentosArray.length === 0}
                className={PRIMARY}
              >
                {loading ? (
                  <Loader2 size={17} className="animate-spin" />
                ) : (
                  <Search size={17} />
                )}
                {loading
                  ? "Consultando..."
                  : `Consultar (${documentosArray.length})`}
              </button>

              <button
                type="button"
                onClick={handleLimpiar}
                disabled={loading}
                className={OUTLINE}
              >
                <X size={16} />
                Limpiar
              </button>

              {resultado && (
                <button
                  type="button"
                  onClick={() => {
                    setDocumentos("");
                    setResultado(null);
                    cargarPersonasPendientes();
                  }}
                  className={`${BTN} border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100`}
                >
                  <RefreshCw size={16} />
                  Actualizar pendientes
                </button>
              )}
            </div>

            {error && (
              <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                <AlertCircle size={18} className="shrink-0" />
                {error}
              </div>
            )}
          </div>
        </section>

        {/* ================================================
            RESULTADOS DEL PROCESAMIENTO
        ================================================ */}

        {resultado && (
          <>
            <section className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
              <ResultadoCard
                icon={Users}
                title="Solicitados"
                value={resultado.requested}
                tone="sky"
              />
              <ResultadoCard
                icon={CheckCircle}
                title="Exitosas"
                value={resultado.exitosas}
                tone="green"
              />
              <ResultadoCard
                icon={XCircle}
                title="Fallidas"
                value={resultado.fallidas}
                tone="red"
              />
              <ResultadoCard
                icon={MapPin}
                title="Guardadas"
                value={resultado.guardadas}
                tone="amber"
              />
              <ResultadoCard
                icon={AlertCircle}
                title="Sin datos"
                value={resultado.sinDatos}
                tone="slate"
              />
            </section>

            <section className={`${CARD} overflow-hidden`}>
              <EncabezadoSeccion
                icon={ClipboardList}
                title="Detalle de resultados"
                description="Resultado de la última consulta de direcciones."
              />

              <div className="overflow-x-auto p-4 pt-0 md:p-5 md:pt-0">
                <table className="w-full min-w-[680px]">
                  <thead className="bg-[#E9F1FA] text-slate-600">
                    <tr>
                      <th className={TH}>Documento</th>
                      <th className={TH}>Estado</th>
                      <th className={`${TH} text-center`}>Direcciones</th>
                      <th className={TH}>BD</th>
                      <th className={TH}>Detalle</th>
                    </tr>
                  </thead>

                  <tbody>
                    {(resultado.results || []).map((item, index) => (
                      <tr
                        key={index}
                        className="border-b border-slate-100 hover:bg-slate-50"
                      >
                        <td className={`${TD} font-mono font-bold text-slate-800`}>
                          {item.documento ||
                            item.documentoOriginal ||
                            `Item ${index + 1}`}
                        </td>

                        <td className={TD}>
                          {item.ok ? (
                            <EstadoBadge className="bg-emerald-100 text-emerald-700">
                              <CheckCircle size={12} className="mr-1" />
                              OK
                            </EstadoBadge>
                          ) : item.sessionExpired ? (
                            <EstadoBadge className="bg-orange-100 text-orange-700">
                              Sesión vencida
                            </EstadoBadge>
                          ) : item.noData ? (
                            <EstadoBadge className="bg-amber-100 text-amber-700">
                              Sin datos
                            </EstadoBadge>
                          ) : (
                            <EstadoBadge className="bg-red-100 text-red-700">
                              <XCircle size={12} className="mr-1" />
                              Error
                            </EstadoBadge>
                          )}
                        </td>

                        <td className={`${TD} text-center font-semibold`}>
                          {item.totalDirecciones || 0}
                        </td>

                        <td className={TD}>
                          {item.db?.saved ? (
                            <span className="inline-flex items-center gap-1 font-medium text-emerald-600">
                              <CheckCircle size={13} />
                              Guardada
                            </span>
                          ) : item.db?.saved === false ? (
                            <span className="text-amber-700">
                              {item.db?.reason || "No guardada"}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>

                        <td
                          className={`${TD} max-w-[260px] truncate`}
                          title={item.error || item.message || ""}
                        >
                          {item.error || item.message || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}

        {/* ================================================
            PROGRESO DE TRABAJOS
        ================================================ */}

        {jobActual && (
          <section className={CARD}>
            <div className="p-4 md:p-5">
              <JobProgress
                jobId={jobActual}
                onClose={() => {
                  setJobActual(null);
                  cargarPersonasPendientes();
                  cargarHistorialDirecciones();
                }}
                onComplete={async () => {
                  await cargarPersonasPendientes(limitPendientes);
                  await cargarHistorialDirecciones();

                  if (modoJobsCarrera && colaJobs.length > 0) {
                    const [siguiente, ...resto] = colaJobs;
                    setColaJobs(resto);

                    setTipoDocumentoManual(
                      siguiente.tipoDocumento || tipoDocumentoManual
                    );
                    setTipoGrupoCargado(siguiente.tipoDocumento || null);
                    setDocumentos((siguiente.documentos || []).join("\n"));

                    try {
                      await crearTrabajoConDocumentos(
                        siguiente.tipoDocumento,
                        siguiente.documentos || []
                      );
                      setDocumentos("");
                    } catch (err) {
                      setModoJobsCarrera(false);
                      setColaJobs([]);
                      toast.error(
                        err.response?.data?.error ||
                        err.message ||
                        "Error creando siguiente trabajo"
                      );
                    }

                    return;
                  }

                  if (modoJobsCarrera) {
                    setModoJobsCarrera(false);
                    setColaJobs([]);
                    setDocumentos("");
                    setTipoGrupoCargado(null);

                    toast.success("Proceso por jobs finalizado", {
                      icon: (
                        <CheckCircle
                          size={20}
                          className="text-emerald-500"
                        />
                      )
                    });
                  }

                  // Al finalizar la secuencia, habilita la carga.
                  setJobActual(null);
                }}
              />
            </div>
          </section>
        )}

        {/* ================================================
            VISTA CONSOLIDADA
        ================================================ */}

        {mostrarConsolidado && (
          <section className={`${CARD} overflow-hidden`}>
            <EncabezadoSeccion
              icon={Layers}
              title="Vista consolidada"
              description={`${datosConsolidado.pagination.total} registro(s) · Fotodetección, Excel y API`}
              action={
                <button
                  type="button"
                  onClick={() =>
                    cargarConsolidado(datosConsolidado.pagination.page)
                  }
                  className={OUTLINE}
                >
                  <RefreshCw
                    size={15}
                    className={cargandoConsolidado ? "animate-spin" : ""}
                  />
                  Recargar
                </button>
              }
            />

            <div className="space-y-4 p-4 md:p-5">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                    Origen
                  </label>
                  <select
                    name="origen"
                    value={filtrosConsolidado.origen}
                    onChange={handleFiltroConsolidado}
                    className={INPUT}
                  >
                    <option value="">Todos los orígenes</option>
                    {(datosConsolidado.origenes || []).map(o => (
                      <option key={o.origen} value={o.origen}>
                        {o.origen} ({o.total})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                    Estado
                  </label>
                  <select
                    name="estado"
                    value={filtrosConsolidado.estado}
                    onChange={handleFiltroConsolidado}
                    className={INPUT}
                  >
                    <option value="">Todos los estados</option>
                    <option value="PENDIENTE">Pendiente</option>
                    <option value="EN_PROCESO">En proceso</option>
                    <option value="ENCONTRADA">Encontrada</option>
                    <option value="SIN_INFORMACION">Sin información</option>
                    <option value="ERROR">Error</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                    Documento
                  </label>
                  <input
                    name="documento"
                    value={filtrosConsolidado.documento}
                    onChange={handleFiltroConsolidado}
                    placeholder="Número de documento"
                    className={INPUT}
                  />
                </div>

                <div>
                  <label className="mb-1.5 flex items-center gap-1 text-xs font-semibold text-slate-600">
                    <CalendarDays size={13} />
                    Fecha inicio
                  </label>
                  <input
                    type="date"
                    name="fecha_inicio"
                    value={filtrosConsolidado.fecha_inicio}
                    onChange={handleFiltroConsolidado}
                    className={INPUT}
                  />
                </div>

                <div>
                  <label className="mb-1.5 flex items-center gap-1 text-xs font-semibold text-slate-600">
                    <CalendarDays size={13} />
                    Fecha fin
                  </label>
                  <input
                    type="date"
                    name="fecha_fin"
                    value={filtrosConsolidado.fecha_fin}
                    onChange={handleFiltroConsolidado}
                    className={INPUT}
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => cargarConsolidado(1)}
                  disabled={cargandoConsolidado}
                  className={PRIMARY}
                >
                  {cargandoConsolidado ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Search size={16} />
                  )}
                  Aplicar filtros
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const vacios = { ...filtrosVacios };
                    setFiltrosConsolidado(vacios);
                    cargarConsolidado(1, vacios);
                  }}
                  className={OUTLINE}
                >
                  <X size={15} />
                  Limpiar filtros
                </button>
              </div>

              {cargandoConsolidado ? (
                <div className="flex h-32 items-center justify-center">
                  <Loader2
                    size={25}
                    className="animate-spin text-[#00ABE4]"
                  />
                </div>
              ) : (datosConsolidado.results || []).length === 0 ? (
                <div className="py-10 text-center">
                  <ListFilter
                    size={25}
                    className="mx-auto text-slate-300"
                  />
                  <p className="mt-2 text-sm text-slate-500">
                    No hay registros para los filtros seleccionados.
                  </p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full min-w-[920px]">
                      <thead className="bg-[#E9F1FA] text-slate-600">
                        <tr>
                          <th className={TH}>Origen</th>
                          <th className={TH}>Tipo</th>
                          <th className={TH}>Documento</th>
                          <th className={TH}>Nombre</th>
                          <th className={TH}>Dirección</th>
                          <th className={TH}>Estado</th>
                          <th className={TH}>Fecha consulta</th>
                        </tr>
                      </thead>

                      <tbody>
                        {(datosConsolidado.results || []).map(row => {
                          const est = estadoConsolidado(row);

                          return (
                            <tr
                              key={row.id_per_natural_dir}
                              className="border-t border-slate-100 hover:bg-slate-50"
                            >
                              <td className={TD}>
                                <EstadoBadge className="bg-slate-100 text-slate-600">
                                  {row.origen_registro || "—"}
                                </EstadoBadge>
                              </td>

                              <td className={TD}>
                                {row.tipo_documento || "—"}
                              </td>

                              <td className={`${TD} font-mono font-bold text-slate-800`}>
                                {row.numero_documento}
                              </td>

                              <td className={TD}>
                                {[row.nombres, row.apellidos]
                                  .filter(Boolean)
                                  .join(" ") || "—"}
                              </td>

                              <td className={`${TD} max-w-[230px] truncate`}>
                                {row.error_consulta_direccion ? (
                                  <span
                                    className="text-red-600"
                                    title={row.error_consulta_direccion}
                                  >
                                    {row.error_consulta_direccion}
                                  </span>
                                ) : (
                                  <span title={row.direccion || ""}>
                                    {row.direccion || "—"}
                                  </span>
                                )}
                              </td>

                              <td className={TD}>
                                <EstadoBadge className={est.class}>
                                  {est.label}
                                </EstadoBadge>
                              </td>

                              <td className={`${TD} whitespace-nowrap`}>
                                {row.fecha_consulta_direccion
                                  ? new Date(
                                      row.fecha_consulta_direccion
                                    ).toLocaleDateString("es-CO")
                                  : "—"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {datosConsolidado.pagination.totalPages > 1 && (
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        disabled={datosConsolidado.pagination.page <= 1}
                        onClick={() =>
                          cargarConsolidado(
                            datosConsolidado.pagination.page - 1
                          )
                        }
                        className={OUTLINE}
                      >
                        <ChevronLeft size={15} />
                        Anterior
                      </button>

                      <span className="px-2 text-xs text-slate-500">
                        {datosConsolidado.pagination.page} /{" "}
                        {datosConsolidado.pagination.totalPages}
                      </span>

                      <button
                        type="button"
                        disabled={
                          datosConsolidado.pagination.page >=
                          datosConsolidado.pagination.totalPages
                        }
                        onClick={() =>
                          cargarConsolidado(
                            datosConsolidado.pagination.page + 1
                          )
                        }
                        className={OUTLINE}
                      >
                        Siguiente
                        <ChevronRight size={15} />
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </section>
        )}

        {/* ================================================
            HISTORIAL DE DIRECCIONES
        ================================================ */}

        <section className={`${CARD} overflow-hidden`}>
          <EncabezadoSeccion
            icon={MapPin}
            title="Historial de direcciones"
            description={
              historialDirecciones.length > 0
                ? `${historialDirecciones.length} registro(s) disponibles`
                : "No hay datos cargados"
            }
            action={
              <>
                <button
                  type="button"
                  onClick={cargarHistorialDirecciones}
                  className={OUTLINE}
                >
                  <RefreshCw size={15} />
                  Recargar
                </button>

                <button
                  type="button"
                  onClick={exportarExcel}
                  disabled={historialDirecciones.length === 0}
                  className={SUCCESS}
                >
                  <Download size={15} />
                  Exportar Excel
                </button>
              </>
            }
          />
        </section>

      </div>
    </div>
  );
}
