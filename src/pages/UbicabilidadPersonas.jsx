import { useState, useRef, useEffect } from "react";
import toast from "react-hot-toast";
import PageHeroHeader from "../components/PageHeroHeader";
import * as XLSX from "xlsx";
import {
  validarArchivoExcel,
  guardarDocumentos,
  obtenerDocumentosParaProcesar,
  listarResultados,
  listarPendientes,
  listarHistorial,
  limpiarDocumentos,
  listarPendientesApi,
  limpiarDocumentosApi,
  enviarAnioExterno
} from "../services/ubicabilidadPersonasApi";
import { crearJob } from "../services/workerJobsApi";
import {
  Upload, FileText, CheckCircle2, AlertCircle,
  Loader2, Search, MapPin, Eye, X, Database, Download, Trash2, PlugZap, Send
} from "lucide-react";
import DocumentosSwiper from "../components/DocumentosSwiper";
import JobProgress from "../components/JobProgress";
import ConfirmModal from "../components/ConfirmModal";

const POR_JOB = 90;

export default function UbicabilidadPersonas() {
  const fileInputRef = useRef(null);

  const [archivo, setArchivo] = useState(null);
  const [validando, setValidando] = useState(false);
  const [resultadoValidacion, setResultadoValidacion] = useState(null);
  const [procesando, setProcesando] = useState(false);

  // Resultados paginados
  const [resultados, setResultados] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [cargandoResultados, setCargandoResultados] = useState(false);
  const [filtros, setFiltros] = useState({ documento: "", estado: "" });

  // Jobs activos para monitoreo
  const [jobsActivos, setJobsActivos] = useState([]);

  // Personas pendientes desde BD
  const [personasPendientes, setPersonasPendientes] = useState([]);
  const [gruposPendientes, setGruposPendientes] = useState([]);
  const [cargandoPendientes, setCargandoPendientes] = useState(false);
  const [mostrarPendientes, setMostrarPendientes] = useState(false);
  const [tipoDocumentoSeleccionado, setTipoDocumentoSeleccionado] = useState("");
  const [documentosCargados, setDocumentosCargados] = useState("");
  const [limitPendientes, setLimitPendientes] = useState(90);
  const [confirmLimpiarOpen, setConfirmLimpiarOpen] = useState(false);

  // ── Solicitudes API (servicios externos) — cola separada de fotodetección ──
  const [mostrarPendientesApi, setMostrarPendientesApi] = useState(false);
  const [cargandoPendientesApi, setCargandoPendientesApi] = useState(false);
  const [origenesApi, setOrigenesApi] = useState([]);
  const [aniosApi, setAniosApi] = useState([]);
  const [totalApi, setTotalApi] = useState(0);
  const [totalEnColaApi, setTotalEnColaApi] = useState(0);
  const [gruposApi, setGruposApi] = useState([]);
  const [anioSeleccionadoApi, setAnioSeleccionadoApi] = useState("");
  const [origenSeleccionadoApi, setOrigenSeleccionadoApi] = useState("");
  const [documentosApi, setDocumentosApi] = useState("");
  const [tipoDocumentoApi, setTipoDocumentoApi] = useState("");
  const [origenCargadoApi, setOrigenCargadoApi] = useState("");
  const [anioCargadoApi, setAnioCargadoApi] = useState(null);
  const [grupoCargadoApi, setGrupoCargadoApi] = useState(null);
  const [confirmLimpiarApiOpen, setConfirmLimpiarApiOpen] = useState(false);

  // Envío de resultados del scraping a CONTRAVENCIONES
  const [anioEnviandoApi, setAnioEnviandoApi] = useState(null);
  const [confirmEnvioAnioApi, setConfirmEnvioAnioApi] = useState(null);

  // Historial de consultados
  const [historial, setHistorial] = useState([]);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);

  useEffect(() => {
    cargarHistorial();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const ext = file.name.split(".").pop().toLowerCase();
    if (!["xlsx", "xls", "csv"].includes(ext)) {
      toast.error("Formato no permitido. Use .xlsx, .xls o .csv");
      return;
    }
    setArchivo(file);
    setResultadoValidacion(null);
  };

  const handleLimpiar = () => {
    setArchivo(null);
    setResultadoValidacion(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const cargarPersonasPendientes = async (limit = limitPendientes) => {
    try {
      setCargandoPendientes(true);
      // Las dos fuentes nunca se mezclan en el mismo textarea
      setDocumentosApi("");
      setMostrarPendientesApi(false);
      const resp = await listarPendientes(limit);
      if (resp.ok) {
        setPersonasPendientes(resp.personas || []);
        setGruposPendientes(resp.grupos || []);
        setMostrarPendientes(true);
        // Auto-cargar primer grupo
        if (resp.grupos?.length > 0) {
          const primerGrupo = resp.grupos[0];
          setDocumentosCargados(primerGrupo.documentos.join("\n"));
          setTipoDocumentoSeleccionado(primerGrupo.tipoDocumento);
        }
        toast.success(`${resp.total} pendiente(s). Se cargó el primer tipo.`);
      } else {
        toast.error(resp.error || "Error cargando pendientes");
      }
    } catch (err) {
      toast.error(err.response?.data?.error || "Error cargando pendientes");
    } finally {
      setCargandoPendientes(false);
    }
  };

  const handleLimpiarDocumentos = () => {
    setConfirmLimpiarOpen(true);
  };

  const handleConfirmLimpiar = async () => {
    setConfirmLimpiarOpen(false);
    try {
      const resp = await limpiarDocumentos();
      if (resp.ok) {
        toast.success(resp.mensaje, { duration: 6000 });
        setMostrarPendientes(false);
        setDocumentosCargados("");
        setPersonasPendientes([]);
        setGruposPendientes([]);
      } else {
        toast.error(resp.error || "Error limpiando documentos");
      }
    } catch (err) {
      toast.error(err.response?.data?.error || "Error limpiando documentos");
    }
  };

  const cargarGrupoEnTextarea = (grupo) => {
    setDocumentosCargados(grupo.documentos.join("\n"));
    setTipoDocumentoSeleccionado(grupo.tipoDocumento);
    setMostrarPendientes(false);
    toast.success(`${grupo.documentos.length} documento(s) del grupo "${grupo.tipoDocumento}" cargado(s)`);
  };

  /* ─────────────── Solicitudes API (servicios externos) ─────────────── */

  // Acepta tanto el formato nuevo (porProcesar/enCola/anio) como el viejo
  // (count, sin anio) para que un backend desactualizado no se vea roto.
  const normalizarGrupoApi = (grupo) => {
    const documentos = grupo?.documentos || [];
    const enCola = Number.isFinite(grupo?.enCola) ? grupo.enCola : 0;
    const porProcesar = Number.isFinite(grupo?.porProcesar)
      ? grupo.porProcesar
      : documentos.length;

    return {
      ...grupo,
      origen: grupo?.origen || "",
      tipoDocumento: grupo?.tipoDocumento || "SIN_TIPO",
      anio: Number.isFinite(grupo?.anio) ? grupo.anio : null,
      documentos,
      enCola,
      porProcesar,
      total: Number.isFinite(grupo?.total) ? grupo.total : porProcesar + enCola
    };
  };

  const cargarSolicitudesApi = async (origen = origenSeleccionadoApi, anio = anioSeleccionadoApi) => {
    try {
      setCargandoPendientesApi(true);
      // Las dos fuentes nunca se mezclan en el mismo textarea
      setDocumentosCargados("");
      setMostrarPendientes(false);
      const resp = await listarPendientesApi(5000, origen, anio);
      if (!resp.ok) {
        toast.error(resp.error || "Error cargando solicitudes API");
        return;
      }

      const anios = (resp.anios || []).filter((a) => Number.isFinite(a?.anio));
      const grupos = (resp.grupos || []).map(normalizarGrupoApi);

      setAniosApi(anios);
      setOrigenesApi(resp.origenes || []);
      setTotalApi(resp.total || 0);
      setTotalEnColaApi(resp.totalEnCola || 0);
      setGruposApi(grupos);
      setMostrarPendientesApi(true);

      // El backend viejo no devuelve "anios": avisamos en vez de dejar la
      // sección de años vacía sin explicación.
      if (!Array.isArray(resp.anios)) {
        toast.error(
          "El servidor no devuelve los años: el backend atendiendo el puerto no está corriendo el código nuevo. Reinícialo y recarga.",
          { duration: 8000 }
        );
      }

      // Recargar SOLO refresca los contadores: nunca abre la ventana de
      // creación por su cuenta. El lote se carga dando clic en una tarjeta
      // de grupo, así no se puede encolar otro trabajo sin querer.
      setDocumentosApi("");
      setTipoDocumentoApi("");
      setOrigenCargadoApi("");
      setAnioCargadoApi(null);
      setGrupoCargadoApi(null);

      const totalEnCola = resp.totalEnCola || 0;
      const porProcesar = Math.max((resp.total || 0) - totalEnCola, 0);
      toast.success(
        `${resp.total || 0} pendiente(s) · ${totalEnCola} en cola · ${porProcesar} por procesar`,
        { duration: 5000 }
      );
    } catch (err) {
      toast.error(err.response?.data?.error || "Error cargando solicitudes API");
    } finally {
      setCargandoPendientesApi(false);
    }
  };

  const etiquetaAnio = (anio) =>
    !Number.isFinite(anio) ? "Sin año" : anio === 0 ? "Sin año" : String(anio);

  // Solo refresca contadores; nunca toca el textarea cargado.
  const refrescarContadoresApi = async () => {
    try {
      const resp = await listarPendientesApi(5000, origenSeleccionadoApi, anioSeleccionadoApi);
      if (!resp.ok) return;
      setAniosApi((resp.anios || []).filter((a) => Number.isFinite(a?.anio)));
      setOrigenesApi(resp.origenes || []);
      setTotalApi(resp.total || 0);
      setTotalEnColaApi(resp.totalEnCola || 0);
      setGruposApi((resp.grupos || []).map(normalizarGrupoApi));
    } catch {
      // silencioso: el envío ya se reportó por toast
    }
  };

  const handleConfirmEnvioAnio = async () => {
    const destino = confirmEnvioAnioApi;
    setConfirmEnvioAnioApi(null);
    if (!destino) return;

    setAnioEnviandoApi(destino.anio);
    try {
      const resp = await enviarAnioExterno(destino.anio, origenSeleccionadoApi);

      if (resp.exitosas > 0 || resp.yaExistian > 0) {
        toast.success(
          `Año ${etiquetaAnio(destino.anio)}: ${resp.exitosas} enviada(s) · ` +
            `${resp.yaExistian} ya existían · ${resp.enviadas} en total`,
          { duration: 8000 }
        );
      }
      if (resp.fallidas > 0) {
        toast.error(`${resp.fallidas} no se pudieron enviar.`, { duration: 8000 });
      }
      if (resp.noSoportadas > 0) {
        toast(
          `${resp.noSoportadas} no se enviaron por tipo de documento no soportado ` +
            `(${Object.keys(resp.porTipoNoSoportado || {}).join(", ")}).`,
          { icon: "⚠️", duration: 9000 }
        );
      }
      if (resp.mensaje) toast(resp.mensaje);

      await refrescarContadoresApi();
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || "No se pudo enviar a contravenciones", {
        duration: 8000
      });
    } finally {
      setAnioEnviandoApi(null);
    }
  };

  const seleccionarGrupoApi = (grupo) => {
    const porProcesar = grupo.porProcesar ?? grupo.documentos?.length ?? 0;
    const lote = (grupo.documentos || []).slice(0, POR_JOB);

    setDocumentosApi(lote.join("\n"));
    setTipoDocumentoApi(grupo.tipoDocumento);
    setOrigenCargadoApi(grupo.origen);
    setAnioCargadoApi(grupo.anio);
    setGrupoCargadoApi(grupo);

    toast.success(
      porProcesar > POR_JOB
        ? `${lote.length} de ${porProcesar} documento(s) cargados (lote de ${POR_JOB}). Pulsa "Crear Job": la ventana se cierra sola y vuelves a la tarjeta para el siguiente lote.`
        : `${porProcesar} documento(s) cargados`
    );
  };

  const cambiarAnioApi = async (anio) => {
    setAnioSeleccionadoApi(anio);
    setOrigenSeleccionadoApi("");
    await cargarSolicitudesApi("", anio);
  };

  const cambiarOrigenApi = async (origen) => {
    setOrigenSeleccionadoApi(origen);
    await cargarSolicitudesApi(origen, anioSeleccionadoApi);
  };

  const handleCrearJobDesdeApi = async () => {
    const docs = documentosApi.split(/[\n,;]+/).map((d) => d.trim()).filter(Boolean);
    if (docs.length === 0) {
      toast.error("No hay documentos para procesar");
      return;
    }
    const lote = docs.slice(0, POR_JOB);
    if (docs.length > POR_JOB) {
      toast(`Se envían los primeros ${POR_JOB} de ${docs.length} documento(s)`, { duration: 5000 });
    }
    try {
      setProcesando(true);
      const items = lote.map((d) => ({
        tipoDocumento: tipoDocumentoApi,
        numeroDocumento: d
      }));
      const resp = await crearJob("ubicabilidad-personas", items);

      const nuevosJobs = [];
      const siguiente = `Da clic en una tarjeta para cargar el siguiente lote de ${POR_JOB}.`;
      if (resp.jobs && resp.jobs.length > 0) {
        nuevosJobs.push(...resp.jobs.map((j) => j.id_job));
        toast.success(
          `${resp.message || `Se crearon ${resp.jobs.length} trabajos`} ${siguiente}`,
          { duration: 7000 }
        );
      } else if (resp.job?.id_job) {
        nuevosJobs.push(resp.job.id_job);
        toast.success(
          `${resp.message || `Trabajo creado con ${items.length} documento(s)`} ${siguiente}`,
          { duration: 7000 }
        );
      }

      if (nuevosJobs.length > 0) {
        setJobsActivos((prev) => [...prev, ...nuevosJobs]);
        // La ventana se cierra de inmediato: si quedara abierta, un segundo
        // clic en "Crear Job" volvería a encolar el mismo lote.
        setDocumentosApi("");
        setTipoDocumentoApi("");
        setGrupoCargadoApi(null);
        // Recargar: los recién encolados dejan de aparecer como "por procesar"
        await cargarSolicitudesApi(origenSeleccionadoApi, anioSeleccionadoApi);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || "Error al crear trabajo");
    } finally {
      setProcesando(false);
    }
  };

  const handleConfirmLimpiarApi = async () => {
    setConfirmLimpiarApiOpen(false);
    try {
      const resp = await limpiarDocumentosApi(origenSeleccionadoApi, anioSeleccionadoApi);
      if (resp.ok) {
        toast.success(resp.mensaje, { duration: 6000 });
        setDocumentosApi("");
        await cargarSolicitudesApi(origenSeleccionadoApi, anioSeleccionadoApi);
      } else {
        toast.error(resp.error || "Error limpiando solicitudes API");
      }
    } catch (err) {
      toast.error(err.response?.data?.error || "Error limpiando solicitudes API");
    }
  };

  const handleCrearJobDesdeBD = async () => {
    const docs = documentosCargados.split(/[\n,;]+/).map(d => d.trim()).filter(Boolean);
    if (docs.length === 0) {
      toast.error("No hay documentos para procesar");
      return;
    }
    try {
      setProcesando(true);
      const items = docs.map(d => ({
        tipoDocumento: tipoDocumentoSeleccionado,
        numeroDocumento: d
      }));
      const resp = await crearJob("ubicabilidad-personas", items);

      const nuevosJobs = [];
      if (resp.jobs && resp.jobs.length > 0) {
        nuevosJobs.push(...resp.jobs.map(j => j.id_job));
        toast.success(resp.message || `Se crearon ${resp.jobs.length} trabajos`);
      } else if (resp.job?.id_job) {
        nuevosJobs.push(resp.job.id_job);
        toast.success(`Trabajo creado con ${items.length} documento(s)`);
      }

      if (nuevosJobs.length > 0) {
        setJobsActivos(prev => [...prev, ...nuevosJobs]);
        setDocumentosCargados("");
        setMostrarPendientes(false);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || "Error al crear trabajo");
    } finally {
      setProcesando(false);
    }
  };

  const handleValidar = async () => {
    if (!archivo) {
      toast.error("Seleccione un archivo primero");
      return;
    }
    try {
      setValidando(true);
      const formData = new FormData();
      formData.append("archivo", archivo);
      const resp = await validarArchivoExcel(formData);
      if (resp.ok) {
        setResultadoValidacion(resp.data);
        toast.success("Archivo validado correctamente");

        // Guardar documentos en BD automáticamente
        if (resp.data.documentos?.length > 0) {
          const docsParaGuardar = resp.data.documentos.map(d => ({
            tipo: d.tipo,
            numero: d.numero
          }));
          const guardarResp = await guardarDocumentos(docsParaGuardar);
          if (guardarResp.ok) {
            toast.success(`BD: ${guardarResp.mensaje}`, { duration: 8000 });
          } else {
            toast.error("Error guardando en BD: " + (guardarResp.error || "Desconocido"));
          }
        }
      } else {
        toast.error(resp.error);
      }
    } catch {
      toast.error("Error al validar el archivo");
    } finally {
      setValidando(false);
    }
  };

  const handleIniciarScraping = async () => {
    if (!resultadoValidacion?.documentos?.length) {
      toast.error("No hay documentos válidos para procesar");
      return;
    }
    try {
      setProcesando(true);
      const items = resultadoValidacion.documentos.map(d => ({
        tipoDocumento: d.tipo,
        numeroDocumento: d.numero
      }));
      const resp = await crearJob("ubicabilidad-personas", items);

      const nuevosJobs = [];
      if (resp.jobs && resp.jobs.length > 0) {
        nuevosJobs.push(...resp.jobs.map(j => j.id_job));
        toast.success(resp.message || `Se crearon ${resp.jobs.length} trabajos`);
      } else if (resp.job?.id_job) {
        nuevosJobs.push(resp.job.id_job);
        toast.success(`Trabajo creado con ${items.length} documento(s)`);
      }

      if (nuevosJobs.length > 0) {
        setJobsActivos(nuevosJobs);
        setArchivo(null);
        setResultadoValidacion(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    } catch (err) {
      toast.error(err.response?.data?.error || "Error al crear trabajo");
    } finally {
      setProcesando(false);
    }
  };

  const cargarResultados = async (page = 1) => {
    try {
      setCargandoResultados(true);
      const resp = await listarResultados({
        page,
        limit: pagination.limit,
        documento: filtros.documento || undefined,
        estado: filtros.estado || undefined
      });
      if (resp.ok) {
        setResultados(resp.data.results);
        setPagination(resp.data.pagination);
      }
    } catch {
      toast.error("Error cargando resultados");
    } finally {
      setCargandoResultados(false);
    }
  };

  const handleFiltroChange = (e) => {
    setFiltros({ ...filtros, [e.target.name]: e.target.value });
  };

  const aplicarFiltros = () => {
    cargarResultados(1);
  };

  const cargarHistorial = async () => {
    try {
      setCargandoHistorial(true);
      const resp = await listarHistorial();
      if (resp.ok) {
        setHistorial(resp.results || []);
      } else {
        toast.error(resp.error || "Error cargando historial");
      }
    } catch (err) {
      toast.error("Error cargando historial");
    } finally {
      setCargandoHistorial(false);
    }
  };

  const exportarExcel = () => {
    if (historial.length === 0) {
      toast.error("No hay datos para exportar");
      return;
    }
    const columnas = [
      "Tipo Documento", "Número Documento", "Nombres", "Apellidos",
      "Celular", "Correo", "Dirección", "Municipio / Departamento",
      "Teléfono", "Tipo Dirección", "Fecha Consulta"
    ];
    const filas = historial.map(item => [
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
        ? new Date(item.fecha_consulta_direccion).toLocaleString("es-CO", { timeZone: "America/Bogota" })
        : ""
    ]);
    const ws = XLSX.utils.aoa_to_sheet([columnas, ...filas]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Historial Ubicabilidad");
    ws["!cols"] = columnas.map(() => ({ wch: 22 }));
    XLSX.writeFile(wb, `historial_ubicabilidad_${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast.success(`Excel generado: ${historial.length} registro(s)`);
  };

  const estadoLabel = (row) => {
    if (!row.direccion_consultada) return { label: "Pendiente", class: "bg-amber-100 text-amber-700" };
    if (row.direccion_encontrada) return { label: "Encontrada", class: "bg-emerald-100 text-emerald-700" };
    return { label: "Error", class: "bg-red-100 text-red-700" };
  };

  return (
    <div className="space-y-5">
      <PageHeroHeader
        label="Ubicabilidad Personas"
        labelIcon={MapPin}
        title="Ubicabilidad Personas"
        description="Cargue documentos desde Excel o CSV para ejecutar el proceso de consulta y ubicación de direcciones."
        icon={MapPin}
      />

      {/* ── Documentos pendientes: BD (fotodetección/Excel) vs Servicios API ── */}
      {!mostrarPendientes && !mostrarPendientesApi && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 md:p-6">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                <Database size={20} className="text-amber-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[#1e293b]">Documentos pendientes</h3>
                <p className="text-xs text-[#64748b]">Dos fuentes independientes: base de datos y servicios API</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 md:ml-auto">
              <button
                onClick={() => cargarPersonasPendientes(limitPendientes)}
                disabled
                title="Desactivado: Ubicabilidad Personas trabaja solo con solicitudes API"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ backgroundColor: "#d97706" }}
              >
                {cargandoPendientes ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Cargando...</span>
                  </>
                ) : (
                  <>
                    <Database size={16} />
                    <span>Cargar desde BD</span>
                  </>
                )}
              </button>

              <button
                onClick={handleLimpiarDocumentos}
                disabled
                title="Desactivado: Ubicabilidad Personas trabaja solo con solicitudes API"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ backgroundColor: "#dc2626" }}
              >
                <Trash2 size={16} />
                <span>Limpiar</span>
              </button>

              <div className="hidden md:block w-px h-8 bg-slate-200" />

              <button
                onClick={() => cargarSolicitudesApi(origenSeleccionadoApi, anioSeleccionadoApi)}
                disabled={cargandoPendientesApi}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:shadow-lg disabled:opacity-60"
                style={{ backgroundColor: "#7c3aed" }}
              >
                {cargandoPendientesApi ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Cargando...</span>
                  </>
                ) : (
                  <>
                    <PlugZap size={16} />
                    <span>Cargar solicitudes API</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Panel de solicitudes API pendientes ── */}
      {mostrarPendientesApi && (
        <div className="rounded-2xl border-2 border-violet-300 shadow-md bg-gradient-to-br from-violet-50 via-white to-white p-5 md:p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="flex items-center gap-2 text-base font-bold text-[#4c1d95]">
                Solicitudes API pendientes
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#7c3aed] text-white">
                  {totalApi}
                </span>
              </h3>
              <p className="text-xs text-[#64748b] mt-1">
                {totalEnColaApi} en cola · {Math.max(totalApi - totalEnColaApi, 0)} por procesar · lotes de {POR_JOB}
              </p>
            </div>
            <button
              onClick={() => {
                setMostrarPendientesApi(false);
                setDocumentosApi("");
                setTipoDocumentoApi("");
                setOrigenCargadoApi("");
                setAnioCargadoApi(null);
                setGrupoCargadoApi(null);
              }}
              className="text-xs font-semibold text-[#64748b] hover:text-[#7c3aed] transition-colors"
            >
              Cerrar
            </button>
          </div>

          {/* 1) Año de los comparendos */}
          <p className="text-xs font-semibold text-[#1e293b] mb-0.5">
            1. Selecciona el año a consultar
          </p>
          <p className="text-[11px] text-[#64748b] mb-2">
            Año de los comparendos que motivan la solicitud
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-5">
            <button
              onClick={() => cambiarAnioApi("")}
              className={`p-4 rounded-xl border-2 transition-all text-left ${
                anioSeleccionadoApi === ""
                  ? "border-[#7c3aed] bg-violet-100 ring-2 ring-[#7c3aed]/30"
                  : "border-slate-200 bg-white hover:border-[#7c3aed] hover:bg-violet-50/60"
              }`}
            >
              <p className="text-lg font-bold text-[#1e293b]">Todos</p>
              <p className="text-xs text-[#64748b] mt-0.5">
                {totalApi.toLocaleString("es-CO")} pendiente(s)
              </p>
            </button>

            {aniosApi.map((a) => {
              const activo = anioSeleccionadoApi === String(a.anio);
              const enviando = anioEnviandoApi === a.anio;
              const conDireccion = a.conDireccion || 0;
              const enviadas = a.enviadas || 0;
              const porEnviar = Math.max(conDireccion - enviadas, 0);
              return (
                <div key={a.anio} className="flex flex-col gap-1.5">
                  <button
                    onClick={() => cambiarAnioApi(String(a.anio))}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                      activo
                        ? "border-[#7c3aed] bg-violet-100 ring-2 ring-[#7c3aed]/30"
                        : "border-slate-200 bg-white hover:border-[#7c3aed] hover:bg-violet-50/60"
                    }`}
                  >
                    <p className="text-lg font-bold text-[#7c3aed]">{etiquetaAnio(a.anio)}</p>
                    <p className="text-xs text-[#64748b] mt-0.5">
                      {a.total.toLocaleString("es-CO")} pendiente(s)
                    </p>
                    {conDireccion > 0 && (
                      <span
                        className={`mt-1.5 inline-block rounded-md px-1.5 py-0.5 text-[11px] font-bold ${
                          porEnviar > 0
                            ? "bg-amber-100 text-amber-700"
                            : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {enviadas}/{conDireccion} enviada(s)
                      </span>
                    )}
                  </button>

                  {conDireccion > 0 && (
                    <button
                      type="button"
                      disabled={enviando}
                      onClick={() =>
                        setConfirmEnvioAnioApi({ anio: a.anio, conDireccion, enviadas, porEnviar })
                      }
                      className="flex items-center justify-center gap-1.5 rounded-lg border border-[#7c3aed] bg-white px-2 py-1.5 text-[11px] font-bold text-[#7c3aed] transition-colors hover:bg-[#7c3aed] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {enviando ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Send className="h-3.5 w-3.5" />
                      )}
                      {enviando ? "Enviando…" : "Enviar a contravenciones"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          {aniosApi.length === 0 && (
            <p className="text-xs text-amber-600 -mt-2 mb-5">
              No hay años registrados. O las solicitudes llegaron sin <code>anio</code>, o
              el servidor aún corre el código viejo.
            </p>
          )}
          {aniosApi.some((a) => a.anio === 0) && aniosApi.length > 1 && (
            <p className="text-[11px] text-[#64748b] -mt-4 mb-5">
              <strong>«Sin año»</strong> son solicitudes que llegaron antes de que el
              servicio enviara el año. Si vuelves a enviar esas personas desde
              contravenciones con su <code>anio</code>, se actualizan solas y dejan de
              aparecer aquí.
            </p>
          )}

          {/* 2) Origen */}
          <p className="text-xs font-semibold text-[#1e293b] mb-2">2. Servicio que envió la solicitud</p>
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => cambiarOrigenApi("")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                origenSeleccionadoApi === ""
                  ? "bg-[#7c3aed] text-white border-[#7c3aed]"
                  : "bg-white text-[#64748b] border-slate-200 hover:border-[#7c3aed]"
              }`}
            >
              Todos
            </button>
            {origenesApi.map((o) => (
              <button
                key={o.origen}
                onClick={() => cambiarOrigenApi(o.origen)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                  origenSeleccionadoApi === o.origen
                    ? "bg-[#7c3aed] text-white border-[#7c3aed]"
                    : "bg-white text-[#64748b] border-slate-200 hover:border-[#7c3aed]"
                }`}
              >
                {o.origen} ({o.total})
              </button>
            ))}
          </div>

          {/* 3) Tipo de documento */}
          <p className="text-xs font-semibold text-[#1e293b] mb-2">3. Tipo de documento</p>
          {gruposApi.length === 0 ? (
            <p className="text-sm text-[#94a3b8] text-center py-4">
              No hay grupos para mostrar con los filtros actuales.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {gruposApi.map((grupo) => {
                const seleccionado =
                  grupoCargadoApi &&
                  grupoCargadoApi.origen === grupo.origen &&
                  grupoCargadoApi.anio === grupo.anio &&
                  grupoCargadoApi.tipoDocumento === grupo.tipoDocumento;

                const sinTrabajo = grupo.porProcesar === 0;

                return (
                  <button
                    key={`${grupo.origen}-${grupo.anio}-${grupo.tipoDocumento}`}
                    onClick={() => seleccionarGrupoApi(grupo)}
                    disabled={sinTrabajo}
                    className={`group flex items-center justify-between gap-3 p-4 rounded-xl border-2 transition-all text-left disabled:cursor-not-allowed disabled:opacity-50 ${
                      seleccionado
                        ? "border-[#7c3aed] bg-violet-100 ring-2 ring-[#7c3aed]/30"
                        : "border-slate-200 bg-white hover:border-[#7c3aed] hover:bg-violet-50/60 hover:shadow-sm"
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-[#7c3aed]">
                        {grupo.origen}
                        {grupo.anio != null ? ` · ${etiquetaAnio(grupo.anio)}` : ""}
                      </p>
                      <p className="text-sm font-bold text-[#1e293b] mt-0.5">
                        {grupo.tipoDocumento}
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5 mt-2">
                        {sinTrabajo ? (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-200 text-slate-600">
                            Todo en cola
                          </span>
                        ) : (
                          <>
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700">
                              {grupo.porProcesar} por procesar
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-500">
                              {grupo.enCola} en cola
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <span
                      className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors ${
                        sinTrabajo
                          ? "bg-slate-100 text-slate-400"
                          : "bg-[#7c3aed] text-white group-hover:bg-[#6d28d9]"
                      }`}
                    >
                      <Upload className="w-3.5 h-3.5" />
                      Cargar
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          <div className="flex items-center gap-3 mt-4">
            <button
              onClick={() => setConfirmLimpiarApiOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white transition-all hover:shadow-lg"
              style={{ backgroundColor: "#dc2626" }}
            >
              <Trash2 size={14} />
              Limpiar solicitudes API
            </button>
            <span className="text-xs text-[#94a3b8]">
              Solo se envían {POR_JOB} documentos por trabajo. Al crearlo, los contadores se actualizan solos.
            </span>
          </div>
        </div>
      )}

      {/* ── Panel de personas pendientes ── */}
      {mostrarPendientes && personasPendientes.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-[#1e293b]">
                Personas pendientes ({personasPendientes.length})
              </h3>
              <p className="text-xs text-[#64748b] mt-1">
                Selecciona un grupo para cargarlo en el formulario
              </p>
            </div>
            <button
              onClick={() => { setMostrarPendientes(false); setDocumentosCargados(""); }}
              className="text-xs text-[#64748b] hover:text-[#1e293b]"
            >
              Cerrar
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {gruposPendientes.map((grupo) => (
              <button
                key={grupo.tipoDocumento}
                onClick={() => cargarGrupoEnTextarea(grupo)}
                className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-[#00ABE4] hover:bg-blue-50/50 transition-colors text-left"
              >
                <div>
                  <p className="text-sm font-semibold text-[#1e293b]">{grupo.tipoDocumento}</p>
                  <p className="text-xs text-[#64748b]">{grupo.count} documento(s)</p>
                </div>
                <Upload className="w-4 h-4 text-[#00ABE4]" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Tarjeta de carga ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 md:p-6">
        <div className="flex items-center gap-2 mb-4">
          <Upload className="w-5 h-5 text-[#00ABE4]" />
          <h3 className="text-sm font-semibold text-[#1e293b]">Cargar archivo</h3>
        </div>

        <div className="flex flex-col md:flex-row md:items-end gap-3">
          <div className="flex-1">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full md:w-auto flex items-center gap-2 px-4 py-3 border-2 border-dashed border-slate-300 rounded-xl text-sm text-[#64748b] hover:border-[#00ABE4] hover:text-[#00ABE4] transition-colors"
            >
              <FileText className="w-4 h-4" />
              {archivo ? archivo.name : "Seleccionar archivo"}
            </button>
            <p className="text-xs text-[#94a3b8] mt-1.5">
              Formatos: .xlsx, .xls, .csv — Columnas requeridas: <strong>tipo_documento</strong>, <strong>documento</strong>
            </p>
          </div>

          <button
            onClick={handleValidar}
            disabled={!archivo || validando}
            className="flex items-center gap-2 px-5 py-3 bg-[#00ABE4] hover:bg-[#0095C5] text-white rounded-xl text-sm font-semibold disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
          >
            {validando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            {validando ? "Validando..." : "Validar archivo"}
          </button>

          <button
            onClick={handleIniciarScraping}
            disabled={!resultadoValidacion || resultadoValidacion.registros_validos === 0 || procesando}
            className="flex items-center gap-2 px-5 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-semibold disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
          >
            {procesando ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            {procesando ? "Creando trabajo..." : "Iniciar Busqueda"}
          </button>

          {resultadoValidacion && (
            <button
              onClick={handleLimpiar}
              className="flex items-center gap-2 px-5 py-3 bg-slate-100 hover:bg-slate-200 text-[#64748b] rounded-xl text-sm font-semibold transition-colors"
            >
              <X className="w-4 h-4" />
              Cancelar
            </button>
          )}
        </div>
      </div>

      {/* ── Formulario documentos desde BD ── */}
      {documentosCargados && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 md:p-6">
          <div className="flex items-center gap-2 mb-4">
            <Database className="w-5 h-5 text-[#d97706]" />
            <h3 className="text-sm font-semibold text-[#1e293b]">
              Documentos desde BD — {tipoDocumentoSeleccionado}
            </h3>
          </div>
          <textarea
            value={documentosCargados}
            onChange={(e) => setDocumentosCargados(e.target.value)}
            rows={6}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-mono focus:outline-none focus:border-[#00ABE4] resize-none"
            placeholder="Uno por línea, separados por coma o espacio"
          />
          <p className="text-xs text-[#64748b] mt-2">
            {documentosCargados.split(/[\n,;]+/).filter(d => d.trim()).length} documento(s) cargado(s)
          </p>
          <div className="flex items-center gap-3 mt-4">
            <button
              onClick={handleCrearJobDesdeBD}
              disabled={procesando || !documentosCargados.trim()}
              className="flex items-center gap-2 px-5 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-semibold disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
            >
              {procesando ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              {procesando ? "Creando trabajo..." : "Crear Job"}
            </button>
            <button
              onClick={() => { setDocumentosCargados(""); setMostrarPendientes(false); }}
              className="flex items-center gap-2 px-5 py-3 bg-slate-100 hover:bg-slate-200 text-[#64748b] rounded-xl text-sm font-semibold transition-colors"
            >
              <X className="w-4 h-4" />
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* ── Formulario documentos desde Servicios API ── */}
      {documentosApi && (
        <div className="bg-white rounded-2xl border-2 border-[#7c3aed] shadow-lg p-5 md:p-6">
          <div className="flex items-center justify-between gap-3 mb-4 p-3 rounded-xl bg-[#7c3aed] text-white">
            <div className="flex items-center gap-2 min-w-0">
              <PlugZap className="w-5 h-5 shrink-0" />
              <h3 className="text-sm font-bold truncate">
                Lote listo — {origenCargadoApi || "varios orígenes"}
                {anioCargadoApi != null ? ` · ${anioCargadoApi === 0 ? "sin año" : anioCargadoApi}` : ""}
                {tipoDocumentoApi ? ` · ${tipoDocumentoApi}` : ""}
              </h3>
            </div>
            {grupoCargadoApi?.porProcesar ? (
              <span className="shrink-0 px-2.5 py-1 rounded-lg bg-white/20 text-xs font-bold">
                {Math.min(POR_JOB, grupoCargadoApi.porProcesar)} de {grupoCargadoApi.porProcesar}
              </span>
            ) : null}
          </div>
          <textarea
            value={documentosApi}
            onChange={(e) => setDocumentosApi(e.target.value)}
            rows={6}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-mono focus:outline-none focus:border-[#7c3aed] resize-none"
            placeholder="Uno por línea, separados por coma o espacio"
          />
          <p className="text-xs text-[#64748b] mt-2">
            {documentosApi.split(/[\n,;]+/).filter(d => d.trim()).length} documento(s) cargado(s)
          </p>
          <div className="flex items-center gap-3 mt-4">
            <button
              onClick={handleCrearJobDesdeApi}
              disabled={procesando || !documentosApi.trim()}
              className="flex items-center gap-2 px-6 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-base font-bold shadow-md transition-colors disabled:bg-slate-300 disabled:shadow-none disabled:cursor-not-allowed"
            >
              {procesando ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
              {procesando ? "Creando trabajo..." : "Crear Job"}
            </button>
            <button
              onClick={() => {
                setDocumentosApi("");
                setMostrarPendientesApi(false);
                setTipoDocumentoApi("");
                setOrigenCargadoApi("");
                setAnioCargadoApi(null);
                setGrupoCargadoApi(null);
              }}
              className="flex items-center gap-2 px-5 py-3 bg-slate-100 hover:bg-slate-200 text-[#64748b] rounded-xl text-sm font-semibold transition-colors"
            >
              <X className="w-4 h-4" />
              Cancelar
            </button>
          </div>
          <p className="text-[11px] text-[#64748b] mt-3">
            Al crearlo la ventana se cierra sola. Da clic en la tarjeta del grupo
            para cargar el siguiente lote de {POR_JOB}.
          </p>
        </div>
      )}

      {/* ── Resumen de validación ── */}
      {resultadoValidacion && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <h4 className="text-xs font-semibold text-[#64748b] uppercase tracking-wide mb-3">
            Resumen de validación
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div className="bg-slate-50 rounded-xl p-3 text-center">
              <p className="text-xl font-bold text-[#1e293b]">{resultadoValidacion.total_filas}</p>
              <p className="text-xs text-[#64748b]">Total filas</p>
            </div>
            <div className="bg-emerald-50 rounded-xl p-3 text-center">
              <p className="text-xl font-bold text-emerald-700">{resultadoValidacion.registros_validos}</p>
              <p className="text-xs text-emerald-600">Válidos</p>
            </div>
            <div className="bg-amber-50 rounded-xl p-3 text-center">
              <p className="text-xl font-bold text-amber-700">{resultadoValidacion.registros_duplicados}</p>
              <p className="text-xs text-amber-600">Duplicados</p>
            </div>
            <div className="bg-red-50 rounded-xl p-3 text-center">
              <p className="text-xl font-bold text-red-700">{resultadoValidacion.registros_error}</p>
              <p className="text-xs text-red-600">Errores</p>
            </div>
          </div>

          {resultadoValidacion.documentos?.length > 0 && (
            <DocumentosSwiper documentos={resultadoValidacion.documentos} />
          )}
        </div>
      )}

      {/* ── Progreso de trabajos ── */}
      {jobsActivos.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Loader2 className="w-5 h-5 text-[#00ABE4] animate-spin" />
            <h3 className="text-sm font-semibold text-[#1e293b]">
              Progreso de trabajos ({jobsActivos.length})
            </h3>
          </div>
          {jobsActivos.map((jobId) => (
            <JobProgress
              key={jobId}
              jobId={jobId}
              onClose={() => {
                setJobsActivos((prev) => prev.filter((id) => id !== jobId));
                cargarResultados(1);
              }}
              onComplete={() => {
                cargarResultados(1);
              }}
            />
          ))}
        </div>
      )}

      {/* ── Resultados ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-[#00ABE4]" />
            <h3 className="text-sm font-semibold text-[#1e293b]">Resultados</h3>
            <span className="text-xs text-[#64748b]">({pagination.total} total)</span>
          </div>
          <button
            onClick={() => cargarResultados(1)}
            className="text-xs text-[#00ABE4] hover:text-[#0095C5] font-medium"
          >
            Actualizar
          </button>
        </div>

        {/* Filtros */}
        <div className="flex flex-col md:flex-row gap-2 mb-4">
          <input
            name="documento"
            value={filtros.documento}
            onChange={handleFiltroChange}
            placeholder="Filtrar por documento..."
            className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-[#00ABE4]"
          />
          <select
            name="estado"
            value={filtros.estado}
            onChange={handleFiltroChange}
            className="px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-[#00ABE4]"
          >
            <option value="">Todos los estados</option>
            <option value="CONSULTADA">Encontrada</option>
            <option value="PENDIENTE">Pendiente</option>
            <option value="ERROR">Error</option>
          </select>
          <button
            onClick={aplicarFiltros}
            className="px-4 py-2 bg-[#00ABE4] text-white rounded-lg text-xs font-semibold hover:bg-[#0095C5]"
          >
            Aplicar
          </button>
        </div>

        {cargandoResultados ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="w-6 h-6 text-[#00ABE4] animate-spin" />
          </div>
        ) : resultados.length === 0 ? (
          <p className="text-sm text-[#94a3b8] text-center py-8">
            No hay resultados. Cargue un archivo e inicie el scraping.
          </p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="py-2.5 px-3 text-left text-[#94a3b8] font-semibold">Tipo</th>
                    <th className="py-2.5 px-3 text-left text-[#94a3b8] font-semibold">Documento</th>
                    <th className="py-2.5 px-3 text-left text-[#94a3b8] font-semibold">Nombres</th>
                    <th className="py-2.5 px-3 text-left text-[#94a3b8] font-semibold">Dirección</th>
                    <th className="py-2.5 px-3 text-left text-[#94a3b8] font-semibold">Estado</th>
                    <th className="py-2.5 px-3 text-left text-[#94a3b8] font-semibold">Fecha consulta</th>
                  </tr>
                </thead>
                <tbody>
                  {resultados.map((row) => {
                    const est = estadoLabel(row);
                    return (
                      <tr key={row.id_per_natural_dir} className="border-b border-slate-50 hover:bg-slate-50/60">
                        <td className="py-2.5 px-3 text-[#64748b]">{row.tipo_documento}</td>
                        <td className="py-2.5 px-3 font-mono font-semibold text-[#1e293b]">{row.numero_documento}</td>
                        <td className="py-2.5 px-3 text-[#1e293b]">
                          {[row.nombres, row.apellidos].filter(Boolean).join(" ") || "—"}
                        </td>
                        <td className="py-2.5 px-3 text-[#64748b] max-w-[200px] truncate">
                          {row.error_consulta_direccion ? (
                            <span className="text-red-500">{row.error_consulta_direccion}</span>
                          ) : row.direccion_encontrada ? (
                            row.fk_direcciones || "—"
                          ) : "—"}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${est.class}`}>
                            {est.label}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-[#94a3b8]">
                          {row.fecha_consulta_direccion
                            ? new Date(row.fecha_consulta_direccion).toLocaleDateString("es-CO")
                            : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-4">
                <button
                  disabled={pagination.page <= 1}
                  onClick={() => cargarResultados(pagination.page - 1)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs disabled:opacity-40 hover:bg-slate-50"
                >
                  Anterior
                </button>
                <span className="text-xs text-[#64748b]">
                  {pagination.page} / {pagination.totalPages}
                </span>
                <button
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => cargarResultados(pagination.page + 1)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs disabled:opacity-40 hover:bg-slate-50"
                >
                  Siguiente
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Historial de consultados ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-[#1e293b]">
              Historial de ubicabilidad
            </h3>
            <p className="text-xs text-[#64748b] mt-1">
              {historial.length > 0
                ? `${historial.length} registro(s) consultados`
                : "No hay datos cargados"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={cargarHistorial}
              disabled={cargandoHistorial}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-xs text-[#64748b] hover:bg-slate-50 disabled:opacity-60"
            >
              {cargandoHistorial ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Upload size={14} />
              )}
              Recargar
            </button>
            <button
              onClick={exportarExcel}
              disabled={historial.length === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all hover:shadow-lg disabled:opacity-60"
              style={{ backgroundColor: "#00ABE4" }}
            >
              <Download size={14} />
              Exportar Excel
            </button>
          </div>
        </div>
      </div>

      <ConfirmModal
        open={confirmLimpiarOpen}
        title="Limpiar documentos"
        message="¿Estás seguro de eliminar todos los documentos pendientes cargados desde Excel? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        onConfirm={handleConfirmLimpiar}
        onCancel={() => setConfirmLimpiarOpen(false)}
      />

      <ConfirmModal
        open={confirmLimpiarApiOpen}
        title="Limpiar solicitudes API"
        message={`¿Eliminar ${
          origenSeleccionadoApi
            ? `las solicitudes pendientes de "${origenSeleccionadoApi}"`
            : "TODAS las solicitudes API pendientes"
        }? Solo se borran registros aún no consultados. Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        onConfirm={handleConfirmLimpiarApi}
        onCancel={() => setConfirmLimpiarApiOpen(false)}
      />

      <ConfirmModal
        open={!!confirmEnvioAnioApi}
        title="Enviar a contravenciones"
        message={
          confirmEnvioAnioApi
            ? `Se enviarán al servicio de enriquecimiento de Contravenciones las ` +
              `${confirmEnvioAnioApi.conDireccion.toLocaleString("es-CO")} persona(s) del año ` +
              `${etiquetaAnio(confirmEnvioAnioApi.anio)} que ya tienen dirección ` +
              `(${confirmEnvioAnioApi.enviadas.toLocaleString("es-CO")} ya enviada(s), ` +
              `${confirmEnvioAnioApi.porEnviar.toLocaleString("es-CO")} por enviar). ` +
              `Se reenvían también las ya enviadas, por si cambió su dirección.`
            : ""
        }
        confirmText="Enviar"
        onConfirm={handleConfirmEnvioAnio}
        onCancel={() => setConfirmEnvioAnioApi(null)}
      />
    </div>
  );
}
