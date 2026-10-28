
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import toast from "react-hot-toast";
import ExcelJS from "exceljs";
import {
  Upload, CheckCircle2, AlertCircle, Loader2, Search,
  MapPin, Eye, X, Database, Download, Trash2,
  PlugZap, Send, CalendarDays, Layers3, RefreshCw,
  Info, IdCard, Check, ChevronDown, ChevronLeft,
  ChevronRight, FileSpreadsheet, ClipboardList, Clock3
} from "lucide-react";
import {
  validarArchivoExcel, guardarDocumentos, listarPendientes,
  listarResultados, listarPendientesApi, enviarAnioExterno,
  obtenerErroresEnvio, listarHistorial
} from "../services/ubicabilidadPersonasApi";
import { crearJob } from "../services/workerJobsApi";
import DocumentosSwiper from "../components/DocumentosSwiper";
import JobProgress from "../components/JobProgress";
import ConfirmModal from "../components/ConfirmModal";
import ErroresEnvioModal from "../components/ErroresEnvioModal";

// ======================================================
// CONFIGURACIÓN
// ======================================================

const POR_JOB = 90;
const POR_PAGINA = 10;
const ORIGENES = [
  "CARGADO_POR_EXCEL",
  "API_CONTRAVENCIONES",
  "API_TEST"
];

const CARD = "rounded-2xl border border-slate-200 bg-white shadow-sm";
const BTN = "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm";
const PRIMARY = `${BTN} bg-[#00ABE4] text-white hover:bg-[#0095C5]`;
const OUTLINE = `${BTN} border border-slate-200 bg-white text-slate-600 hover:bg-slate-50`;
const GREEN = `${BTN} bg-emerald-600 text-white hover:bg-emerald-700`;
const INPUT = "h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-[#00ABE4]";

const numero = v => Number(v || 0).toLocaleString("es-CO");
const separarDocs = v => String(v || "").split(/[\n,;]+/).map(s => s.trim()).filter(Boolean);
const errorApi = (e, fallback) => e?.response?.data?.error || e?.message || fallback;
const anioTexto = v => v === "" || v == null || !Number(v) ? "Sin año" : String(v);
const fechaCol = v => {
  if (!v) return "—";
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? "—" :
    d.toLocaleDateString("es-CO", { timeZone: "America/Bogota" });
};
const fechaArchivo = () => new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Bogota", year: "numeric", month: "2-digit", day: "2-digit"
}).format(new Date());

const estadoResultado = r => {
  if (r.error_consulta_direccion) return ["Error", "bg-red-50 text-red-700"];
  if (!r.direccion_consultada) return ["Pendiente", "bg-amber-50 text-amber-700"];
  if (r.direccion_encontrada) return ["Encontrada", "bg-emerald-50 text-emerald-700"];
  return ["Sin dirección", "bg-slate-100 text-slate-600"];
};

const normalizarGrupoApi = g => {
  const documentos = Array.isArray(g?.documentos) ? g.documentos : [];
  const enCola = Number(g?.enCola || 0);
  const porProcesar = Number(g?.porProcesar ?? documentos.length);
  return {
    ...g,
    origen: g?.origen || "",
    anio: g?.anio == null ? null : Number(g.anio),
    tipoDocumento: g?.tipoDocumento || "SIN_TIPO",
    documentos,
    enCola,
    porProcesar,
    total: Number(g?.total ?? porProcesar + enCola)
  };
};

// Acepta grupos o una lista plana si el servicio de BD utiliza
// alguna de esas dos estructuras.
const normalizarPendientesExcel = respuesta => {
  const data = respuesta?.data || respuesta || {};
  let grupos = [];

  if (Array.isArray(data.grupos)) {
    grupos = data.grupos.map(g => ({
      tipoDocumento: g.tipoDocumento || g.tipo || g.tipo_documento || "SIN_TIPO",
      documentos: (g.documentos || []).map(d =>
        typeof d === "object" && d !== null
          ? String(d.numeroDocumento ?? d.numero ?? d.numero_documento ?? d.documento ?? "")
          : String(d)
      ).filter(Boolean).slice(0, POR_JOB),
      total: Number(g.total ?? g.porProcesar ?? g.documentos?.length ?? 0)
    }));
  } else {
    const filas = Array.isArray(data.personas) ? data.personas :
      Array.isArray(data.documentos) ? data.documentos :
        Array.isArray(data.results) ? data.results : [];

    const mapa = new Map();

    filas.forEach(d => {
      const tipo = String(d.tipoDocumento ?? d.tipo ?? d.tipo_documento ?? "SIN_TIPO");
      const doc = String(d.numeroDocumento ?? d.numero ?? d.numero_documento ?? d.documento ?? "").trim();
      if (!doc) return;
      if (!mapa.has(tipo)) mapa.set(tipo, []);
      mapa.get(tipo).push(doc);
    });

    grupos = [...mapa.entries()].map(([tipoDocumento, documentos]) => ({
      tipoDocumento,
      documentos: documentos.slice(0, POR_JOB),
      total: documentos.length
    }));
  }

  return {
    grupos: grupos.filter(g => g.documentos.length),
    total: Number(data.total ?? grupos.reduce((n, g) => n + g.total, 0))
  };
};

// ======================================================
// COMPONENTES
// ======================================================

function Indicador({ titulo, valor, icono: Icon, color = "sky" }) {
  const tonos = {
    sky: "bg-sky-50 text-sky-600",
    green: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600"
  };

  return (
    <div className={`${CARD} flex items-center gap-3 p-4`}>
      <div className={`hidden h-11 w-11 shrink-0 items-center justify-center rounded-xl sm:flex ${tonos[color]}`}>
        <Icon size={20} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-slate-500">{titulo}</p>
        <p className="mt-1 truncate text-xl font-bold text-slate-900">{valor}</p>
      </div>
    </div>
  );
}

function Titulo({ icono: Icon, titulo, descripcion, derecha }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-sky-50 p-2.5 text-[#0095C5]">
          <Icon size={19} />
        </div>
        <div>
          <h2 className="text-sm font-bold text-slate-900">{titulo}</h2>
          {descripcion && <p className="mt-1 text-xs text-slate-500">{descripcion}</p>}
        </div>
      </div>
      {derecha}
    </div>
  );
}

function Paso({ n, titulo, descripcion, children }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-100 text-xs font-bold text-[#0095C5]">
          {n}
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-900">{titulo}</h3>
          <p className="mt-1 text-xs text-slate-500">{descripcion}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

function Vacio({ icono: Icon, mensaje }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
      <Icon size={27} className="mx-auto mb-3 text-slate-300" />
      <p className="text-sm text-slate-500">{mensaje}</p>
    </div>
  );
}

function Paginacion({ page, pages, total, cambiar }) {
  if (pages <= 1) return null;
  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
      <p className="text-xs text-slate-500">
        Mostrando {numero((page - 1) * POR_PAGINA + 1)} a{" "}
        {numero(Math.min(page * POR_PAGINA, total))} de {numero(total)}
      </p>
      <div className="flex items-center gap-2">
        <button type="button" className={`${OUTLINE} !px-3`}
          disabled={page <= 1} onClick={() => cambiar(page - 1)}>
          <ChevronLeft size={15} />
        </button>
        <span className="text-xs font-semibold text-slate-600">
          Página {page} de {pages}
        </span>
        <button type="button" className={`${OUTLINE} !px-3`}
          disabled={page >= pages} onClick={() => cambiar(page + 1)}>
          <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
}

// ======================================================
// COMPONENTE PRINCIPAL
// ======================================================

export default function UbicabilidadPersonas() {
  const fileInputRef = useRef(null);
  const procesandoRef = useRef(false);

  // Importación Excel
  const [archivo, setArchivo] = useState(null);
  const [validando, setValidando] = useState(false);
  const [validacion, setValidacion] = useState(null);

  // Pendientes Excel desde BD
  const [mostrarExcelBD, setMostrarExcelBD] = useState(false);
  const [cargandoExcelBD, setCargandoExcelBD] = useState(false);
  const [gruposExcel, setGruposExcel] = useState([]);
  const [totalExcel, setTotalExcel] = useState(0);
  const [grupoExcel, setGrupoExcel] = useState(null);
  const [documentosExcel, setDocumentosExcel] = useState("");

  // API
  const [mostrarApi, setMostrarApi] = useState(false);
  const [cargandoApi, setCargandoApi] = useState(false);
  const [aniosApi, setAniosApi] = useState([]);
  const [origenesApi, setOrigenesApi] = useState([]);
  const [gruposApi, setGruposApi] = useState([]);
  const [totalApi, setTotalApi] = useState(0);
  const [totalEnColaApi, setTotalEnColaApi] = useState(0);
  const [anioApi, setAnioApi] = useState("");
  const [origenApi, setOrigenApi] = useState("");
  const [mostrarCompletados, setMostrarCompletados] = useState(false);
  const [grupoApi, setGrupoApi] = useState(null);
  const [documentosApi, setDocumentosApi] = useState("");

  // Workers
  const [procesando, setProcesando] = useState(false);
  const [jobs, setJobs] = useState([]);

  // Envío externo
  const [confirmEnvio, setConfirmEnvio] = useState(null);
  const [anioEnviando, setAnioEnviando] = useState(null);

  // Errores de envío
  const [erroresAbiertos, setErroresAbiertos] = useState(false);
  const [erroresCargando, setErroresCargando] = useState(false);
  const [erroresLista, setErroresLista] = useState([]);
  const [erroresError, setErroresError] = useState(null);
  const [erroresContexto, setErroresContexto] = useState({
    anio: "", origen: "", etiqueta: ""
  });

  // Resultados
  const [resultados, setResultados] = useState([]);
  const [cargandoResultados, setCargandoResultados] = useState(false);
  const [pagina, setPagina] = useState({
    page: 1, total: 0, totalPages: 0
  });
  const [filtros, setFiltros] = useState({ documento: "", estado: "" });
  const [origenResultados, setOrigenResultados] = useState("");

  // Historial
  const [historial, setHistorial] = useState([]);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);
  const [origenHistorial, setOrigenHistorial] = useState("");

  const ocupado = procesando || validando;

  // ====================================================
  // CARGA EXCEL Y GUARDADO EN BD
  // ====================================================

  const seleccionarArchivo = e => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split(".").pop().toLowerCase();

    if (!["xlsx", "xls", "csv"].includes(ext)) {
      toast.error("Seleccione un archivo .xlsx, .xls o .csv");
      e.target.value = "";
      return;
    }
    setArchivo(file);
    setValidacion(null);
  };

  const limpiarArchivo = () => {
    setArchivo(null);
    setValidacion(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const validarEInsertar = async () => {
    if (!archivo || validando) return;
    try {
      setValidando(true);
      setValidacion(null);

      const formData = new FormData();
      formData.append("archivo", archivo);

      const resp = await validarArchivoExcel(formData);
      if (resp?.ok === false) throw new Error(resp.error || "Error validando archivo");

      const data = resp.data || {};
      const documentos = data.documentos || [];

      if (!documentos.length) {
        setValidacion(data);
        toast("No hay documentos válidos para insertar");
        return;
      }

      const guardado = await guardarDocumentos(
        documentos.map(d => ({ tipo: d.tipo, numero: d.numero }))
      );

      if (guardado?.ok === false) {
        throw new Error(guardado.error || "No se pudieron guardar los documentos");
      }

      setValidacion(data);
      toast.success(guardado.mensaje || "Documentos insertados en la base de datos");

      // Solo se insertan documentos. No se crean jobs.
      setGruposExcel([]);
      setTotalExcel(0);
      setGrupoExcel(null);
      setDocumentosExcel("");
    } catch (err) {
      toast.error(errorApi(err, "Error validando o insertando documentos"));
    } finally {
      setValidando(false);
    }
  };

  // ====================================================
  // DOCUMENTOS EXCEL PENDIENTES DESDE BD
  // ====================================================

  const cargarPendientesExcel = async () => {
    if (cargandoExcelBD || ocupado) return;
    try {
      setCargandoExcelBD(true);

      const resp = await listarPendientes(POR_JOB);
      if (resp?.ok === false) {
        throw new Error(resp.error || "Error consultando documentos pendientes");
      }

      const data = normalizarPendientesExcel(resp);
      setGruposExcel(data.grupos);
      setTotalExcel(data.total);
      setMostrarExcelBD(true);
      setGrupoExcel(null);
      setDocumentosExcel("");

      if (!data.grupos.length) toast("No hay documentos pendientes de Excel");
      else toast.success(`${data.grupos.length} grupo(s) de documentos disponibles`);
    } catch (err) {
      toast.error(errorApi(err, "Error cargando pendientes desde BD"));
    } finally {
      setCargandoExcelBD(false);
    }
  };

  const seleccionarGrupoExcel = grupo => {
    if (ocupado) return;
    const docs = grupo.documentos.slice(0, POR_JOB);
    if (!docs.length) return toast.error("No hay documentos en este grupo");

    setGrupoApi(null);
    setDocumentosApi("");
    setGrupoExcel(grupo);
    setDocumentosExcel(docs.join("\n"));
    toast.success(`${docs.length} documentos cargados para el lote`);
  };

  // ====================================================
  // SOLICITUDES API
  // ====================================================

  const cargarApi = async (
    origen = origenApi,
    anio = anioApi,
    limpiar = true
  ) => {
    try {
      setCargandoApi(true);
      const resp = await listarPendientesApi(5000, origen, anio);
      if (resp?.ok === false) throw new Error(resp.error || "Error cargando API");

      setAniosApi((resp.anios || []).filter(a => Number.isFinite(Number(a?.anio))));
      setOrigenesApi(resp.origenes || []);
      setGruposApi((resp.grupos || []).map(normalizarGrupoApi));
      setTotalApi(Number(resp.total || 0));
      setTotalEnColaApi(Number(resp.totalEnCola || 0));
      setMostrarApi(true);

      if (limpiar) {
        setGrupoApi(null);
        setDocumentosApi("");
      }
      if (!Array.isArray(resp.anios)) {
        toast.error("El backend no está devolviendo los años");
      }
    } catch (err) {
      toast.error(errorApi(err, "Error cargando solicitudes API"));
    } finally {
      setCargandoApi(false);
    }
  };

  const refrescarApi = async () => {
    try {
      const resp = await listarPendientesApi(5000, origenApi, anioApi);
      if (resp?.ok === false) return;
      setAniosApi((resp.anios || []).filter(a => Number.isFinite(Number(a?.anio))));
      setOrigenesApi(resp.origenes || []);
      setGruposApi((resp.grupos || []).map(normalizarGrupoApi));
      setTotalApi(Number(resp.total || 0));
      setTotalEnColaApi(Number(resp.totalEnCola || 0));
    } catch {
      // Una actualización fallida no interrumpe los jobs.
    }
  };

  const cambiarAnio = valor => {
    setAnioApi(valor);
    setOrigenApi("");
    cargarApi("", valor);
  };

  const cambiarOrigen = valor => {
    setOrigenApi(valor);
    cargarApi(valor, anioApi);
  };

  const seleccionarGrupoApi = grupo => {
    if (ocupado || grupo.porProcesar <= 0) return;
    const docs = grupo.documentos.slice(0, POR_JOB);
    if (!docs.length) return toast.error("No hay documentos disponibles");

    setGrupoExcel(null);
    setDocumentosExcel("");
    setGrupoApi(grupo);
    setDocumentosApi(docs.join("\n"));

    toast.success(`${docs.length} documentos API cargados`);
  };

  // ====================================================
  // CREACIÓN DE TRABAJOS
  // ====================================================

  const registrarJob = resp => {
    const ids = Array.isArray(resp?.jobs)
      ? resp.jobs.map(j => j.id_job).filter(Boolean)
      : resp?.job?.id_job ? [resp.job.id_job] : [];

    if (!ids.length) throw new Error("El servidor no devolvió un ID de trabajo");
    setJobs(prev => [...new Set([...prev, ...ids])]);
  };

  const crearTrabajo = async fuente => {
    if (procesandoRef.current) return;

    const grupo = fuente === "excel" ? grupoExcel : grupoApi;
    const texto = fuente === "excel" ? documentosExcel : documentosApi;

    if (!grupo) return toast.error("Seleccione un grupo de documentos");

    const tipoDocumento = grupo.tipoDocumento;
    const documentos = [...new Set(separarDocs(texto))];

    if (!tipoDocumento || !documentos.length) {
      return toast.error("No hay documentos válidos para procesar");
    }
    if (documentos.length > POR_JOB) {
      return toast.error(`Máximo ${POR_JOB} documentos por trabajo`);
    }

    // No permitir enviar documentos ajenos a los recuperados desde BD/API.
    const permitidos = new Set(grupo.documentos.map(String));
    if (documentos.some(d => !permitidos.has(d))) {
      return toast.error("El lote contiene documentos que no pertenecen al grupo cargado");
    }

    procesandoRef.current = true;

    try {
      setProcesando(true);

      const items = documentos.map(numeroDocumento => ({
        tipoDocumento,
        numeroDocumento
      }));

      const resp = await crearJob("ubicabilidad-personas", items);
      registrarJob(resp);

      toast.success(`Trabajo creado con ${items.length} documentos`);

      if (fuente === "excel") {
        setGrupoExcel(null);
        setDocumentosExcel("");
        // Tras encolar, actualizamos los pendientes.
        // El backend debe excluir documentos ya en cola.
        try {
          const pendientes = await listarPendientes(POR_JOB);
          if (pendientes?.ok !== false) {
            const info = normalizarPendientesExcel(pendientes);
            setGruposExcel(info.grupos);
            setTotalExcel(info.total);
          }
        } catch {
          toast("Trabajo creado. Actualice los pendientes para consultar el siguiente lote");
        }
      } else {
        setGrupoApi(null);
        setDocumentosApi("");
        await cargarApi(origenApi, anioApi, false);
      }
    } catch (err) {
      toast.error(errorApi(err, "Error creando trabajo"));
    } finally {
      setProcesando(false);
      procesandoRef.current = false;
    }
  };

  // ====================================================
  // RESULTADOS
  // ====================================================

  const cargarResultados = async (
    page = 1,
    origen = origenResultados,
    filtrosActuales = filtros
  ) => {
    try {
      setCargandoResultados(true);
      const resp = await listarResultados({
        page,
        limit: POR_PAGINA,
        documento: filtrosActuales.documento || undefined,
        estado: filtrosActuales.estado || undefined,
        origen: origen || undefined
      });

      if (resp?.ok === false) {
        throw new Error(resp.error || "Error cargando resultados");
      }

      setResultados(resp.data?.results || []);
      setPagina({
        page: Number(resp.data?.pagination?.page || page),
        total: Number(resp.data?.pagination?.total || 0),
        totalPages: Number(resp.data?.pagination?.totalPages || 0)
      });
    } catch (err) {
      toast.error(errorApi(err, "Error cargando resultados"));
    } finally {
      setCargandoResultados(false);
    }
  };

  // ====================================================
  // HISTORIAL
  // ====================================================

  const cargarHistorial = useCallback(async (origen = "") => {
    try {
      setCargandoHistorial(true);
      const resp = await listarHistorial(origen);
      if (resp?.ok === false) throw new Error(resp.error || "Error cargando historial");
      setHistorial(resp.results || []);
    } catch (err) {
      toast.error(errorApi(err, "Error cargando historial"));
    } finally {
      setCargandoHistorial(false);
    }
  }, []);

  useEffect(() => {
    cargarHistorial("");
  }, [cargarHistorial]);


  const exportarExcel = async () => {
    if (!historial.length) {
      toast.error("No hay registros para exportar");
      return;
    }

    const idToast = toast.loading("Generando Excel corporativo...");

    try {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = "AutoCore";
      workbook.lastModifiedBy = "AutoCore";
      workbook.title = "Historial de Ubicabilidad";
      workbook.subject = "Consultas de direcciones RUNT";
      workbook.created = new Date();

      const sheet = workbook.addWorksheet("Historial Ubicabilidad", {
        views: [{ state: "frozen", ySplit: 6 }],
        pageSetup: {
          paperSize: 9,
          orientation: "landscape",
          fitToPage: true,
          fitToWidth: 1,
          fitToHeight: 0
        }
      });

      const AZUL = "FF0095C5";
      const CIAN = "FF00ABE4";
      const BLANCO = "FFFFFFFF";
      const TEXTO = "FF1E293B";
      const GRIS = "FF64748B";
      const BORDE = "FFE2E8F0";
      const ALTERNA = "FFF0F7FC";
      const VERDE = "FF047857";
      const ROJO = "FFB91C1C";

      // ==================================================
      // COLUMNAS
      // ==================================================

      sheet.columns = [
        { key: "tipo_documento", width: 24 },
        { key: "numero_documento", width: 23 },
        { key: "nombres", width: 30 },
        { key: "apellidos", width: 30 },
        { key: "celular", width: 19 },
        { key: "correo", width: 37 },
        { key: "direccion", width: 48 },
        { key: "municipio", width: 34 },
        { key: "telefono", width: 20 },
        { key: "tipo_direccion", width: 24 },
        { key: "fecha", width: 24 }
      ];

      // ==================================================
      // ENCABEZADO CORPORATIVO
      // ==================================================

      sheet.mergeCells("A1:K2");

      const titulo = sheet.getCell("A1");
      titulo.value = "AUTOCORE  |  HISTORIAL DE UBICABILIDAD";
      titulo.font = {
        name: "Arial",
        size: 17,
        bold: true,
        color: { argb: BLANCO }
      };
      titulo.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: AZUL }
      };
      titulo.alignment = {
        vertical: "middle",
        horizontal: "left",
        indent: 1
      };

      sheet.getRow(1).height = 25;
      sheet.getRow(2).height = 25;

      sheet.mergeCells("A3:K3");
      const subtitulo = sheet.getCell("A3");
      subtitulo.value =
        "CENTRO DE OPERACIONES VEHICULARES  |  CONSULTAS DE DIRECCIONES RUNT";
      subtitulo.font = {
        name: "Arial",
        size: 10,
        color: { argb: GRIS },
        bold: true
      };
      subtitulo.alignment = {
        vertical: "middle",
        indent: 1
      };
      sheet.getRow(3).height = 25;

      // ==================================================
      // INFORMACIÓN DEL REPORTE
      // ==================================================

      const fechaGeneracion = new Date().toLocaleString("es-CO", {
        timeZone: "America/Bogota",
        dateStyle: "medium",
        timeStyle: "short"
      });

      const origen = origenHistorial || "Excel e integraciones API";

      sheet.mergeCells("A4:D4");
      sheet.mergeCells("E4:H4");
      sheet.mergeCells("I4:K4");

      [
        ["A4", `Registros: ${historial.length.toLocaleString("es-CO")}`],
        ["E4", `Origen: ${origen}`],
        ["I4", `Generado: ${fechaGeneracion}`]
      ].forEach(([celda, valor]) => {
        const c = sheet.getCell(celda);
        c.value = valor;
        c.font = {
          name: "Arial",
          size: 10,
          bold: true,
          color: { argb: TEXTO }
        };
        c.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFE9F1FA" }
        };
        c.alignment = {
          vertical: "middle",
          indent: 1,
          shrinkToFit: true
        };
      });

      sheet.getRow(4).height = 30;
      sheet.getRow(5).height = 9;

      // ==================================================
      // ENCABEZADOS DE LA TABLA
      // ==================================================

      const encabezados = [
        "TIPO DOCUMENTO",
        "NÚMERO DOCUMENTO",
        "NOMBRES",
        "APELLIDOS",
        "CELULAR",
        "CORREO ELECTRÓNICO",
        "DIRECCIÓN",
        "MUNICIPIO / DEPARTAMENTO",
        "TELÉFONO",
        "TIPO DIRECCIÓN",
        "FECHA CONSULTA"
      ];

      const filaHeader = sheet.getRow(6);
      filaHeader.values = encabezados;
      filaHeader.height = 32;

      filaHeader.eachCell({ includeEmpty: true }, celda => {
        celda.font = {
          name: "Arial",
          size: 10,
          bold: true,
          color: { argb: BLANCO }
        };

        celda.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: CIAN }
        };

        celda.alignment = {
          vertical: "middle",
          horizontal: "center",
          wrapText: true
        };

        celda.border = {
          bottom: {
            style: "medium",
            color: { argb: AZUL }
          }
        };
      });

      // ==================================================
      // REGISTROS DEL HISTORIAL
      // ==================================================

      historial.forEach((item, index) => {
        const fecha = item.fecha_consulta_direccion
          ? new Date(item.fecha_consulta_direccion)
          : null;

        const fila = sheet.addRow({
          tipo_documento: String(item.tipo_documento ?? ""),
          numero_documento: String(item.numero_documento ?? ""),
          nombres: String(item.nombres ?? ""),
          apellidos: String(item.apellidos ?? ""),
          celular: String(item.celular ?? ""),
          correo: String(item.correo ?? ""),
          direccion: String(item.direccion ?? ""),
          municipio: String(
            item.municipio_departamento ??
            item.municio_departamento ??
            ""
          ),
          telefono: String(item.telefono ?? ""),
          tipo_direccion: String(item.tipo_direccion ?? ""),
          fecha: fecha && !Number.isNaN(fecha.getTime())
            ? fecha
            : ""
        });

        fila.height = 25;

        fila.eachCell({ includeEmpty: true }, celda => {
          celda.font = {
            name: "Arial",
            size: 10,
            color: { argb: TEXTO }
          };

          celda.alignment = {
            vertical: "middle",
            horizontal: "left",
            shrinkToFit: true
          };

          if (index % 2 === 1) {
            celda.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: ALTERNA }
            };
          }

          celda.border = {
            bottom: {
              style: "hair",
              color: { argb: BORDE }
            }
          };
        });

        // Identificaciones y teléfonos siempre como texto.
        ["B", "E", "I"].forEach(col => {
          fila.getCell(col).numFmt = "@";
        });

        // La fecha queda como fecha real de Excel.
        const celdaFecha = fila.getCell("K");

        if (celdaFecha.value instanceof Date) {
          celdaFecha.numFmt = "dd/mm/yyyy hh:mm";
        }

        // Resaltar documentos que tengan dirección.
        const direccion = String(item.direccion || "").trim();

        if (direccion) {
          fila.getCell("G").font = {
            name: "Arial",
            size: 10,
            color: { argb: VERDE }
          };
        }

        if (item.error_consulta_direccion) {
          fila.getCell("G").font = {
            name: "Arial",
            size: 10,
            color: { argb: ROJO }
          };
        }
      });

      // ==================================================
      // FILTROS Y CONFIGURACIÓN DE IMPRESIÓN
      // ==================================================

      sheet.autoFilter = {
        from: { row: 6, column: 1 },
        to: { row: 6, column: 11 }
      };

      sheet.headerFooter.oddFooter =
        "&L AutoCore - Centro de Operaciones Vehiculares &RPágina &P de &N";

      sheet.pageMargins = {
        left: 0.25,
        right: 0.25,
        top: 0.5,
        bottom: 0.5,
        header: 0.2,
        footer: 0.2
      };

      // ==================================================
      // DESCARGAR ARCHIVO
      // ==================================================

      const buffer = await workbook.xlsx.writeBuffer();

      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      });

      const url = URL.createObjectURL(blob);
      const enlace = document.createElement("a");

      enlace.href = url;
      enlace.download = `AutoCore_Historial_Ubicabilidad_${fechaArchivo()}.xlsx`;

      document.body.appendChild(enlace);
      enlace.click();
      enlace.remove();

      setTimeout(() => URL.revokeObjectURL(url), 1000);

      toast.success(
        `Excel generado correctamente: ${historial.length.toLocaleString("es-CO")} registros`,
        { id: idToast }
      );
    } catch (error) {
      console.error("Error exportando historial:", error);
      toast.error("No se pudo generar el Excel", { id: idToast });
    }
  };


  // ====================================================
  // ENVÍO A CONTRAVENCIONES
  // ====================================================

  const enviarRespuestas = async () => {
    const destino = confirmEnvio;
    setConfirmEnvio(null);
    if (!destino || anioEnviando !== null) return;

    try {
      setAnioEnviando(destino.anio);
      const resp = await enviarAnioExterno(destino.anio, destino.origen);

      if (resp?.ok === false) throw new Error(resp.error || "Error de envío");

      if (Number(resp.exitosas) || Number(resp.yaExistian)) {
        toast.success(
          `${numero(resp.exitosas)} enviadas, ${numero(resp.yaExistian)} ya existentes`,
          { duration: 7000 }
        );
      }
      if (Number(resp.fallidas)) {
        toast.error(`${numero(resp.fallidas)} respuestas fallidas`);
      }
      if (Number(resp.noSoportadas)) {
        toast(`${numero(resp.noSoportadas)} tipos no soportados`);
      }
      if (resp.mensaje) toast(resp.mensaje);

      await refrescarApi();
    } catch (err) {
      toast.error(errorApi(err, "Error enviando a Contravenciones"));
    } finally {
      setAnioEnviando(null);
    }
  };

  const abrirErrores = async (anio = anioApi) => {
    setErroresAbiertos(true);
    setErroresCargando(true);
    setErroresLista([]);
    setErroresError(null);
    setErroresContexto({
      anio,
      origen: origenApi,
      etiqueta: anio === "" ? "Todos los años" : `Año ${anioTexto(anio)}`
    });

    try {
      const resp = await obtenerErroresEnvio(anio, origenApi);
      if (resp?.ok === false) throw new Error(resp.error || "Error consultando errores");
      setErroresLista(resp.errores || []);
    } catch (err) {
      setErroresError(errorApi(err, "Error cargando respuestas rechazadas"));
    } finally {
      setErroresCargando(false);
    }
  };

  const reintentarErrores = () => {
    const anio = erroresContexto.anio;
    if (anio === "" || anio == null) return;

    const item = aniosApi.find(a => String(a.anio) === String(anio));
    const conDireccion = Number(item?.conDireccion || 0);
    const enviadas = Number(item?.enviadas || 0);

    setErroresAbiertos(false);
    setConfirmEnvio({
      anio: item?.anio ?? Number(anio),
      origen: erroresContexto.origen,
      conDireccion,
      enviadas,
      porEnviar: Math.max(conDireccion - enviadas, 0)
    });
  };

  // ====================================================
  // RESUMEN POR AÑOS
  // ====================================================

  const totales = useMemo(() => aniosApi.reduce((acc, a) => ({
    conDireccion: acc.conDireccion + Number(a.conDireccion || 0),
    enviadas: acc.enviadas + Number(a.enviadas || 0),
    conError: acc.conError + Number(a.conError || 0),
    porProcesar: acc.porProcesar + Number(a.total || 0)
  }), {
    conDireccion: 0,
    enviadas: 0,
    conError: 0,
    porProcesar: 0
  }), [aniosApi]);

  const anioActivo = aniosApi.find(a => String(a.anio) === anioApi);
  const conDireccion = anioActivo
    ? Number(anioActivo.conDireccion || 0) : totales.conDireccion;
  const enviadas = anioActivo
    ? Number(anioActivo.enviadas || 0) : totales.enviadas;
  const conError = anioActivo
    ? Number(anioActivo.conError || 0) : totales.conError;
  const porEnviar = Math.max(conDireccion - enviadas, 0);

  const completado = a =>
    Number(a.total || 0) === 0 &&
    Number(a.conError || 0) === 0 &&
    Number(a.enviadas || 0) >= Number(a.conDireccion || 0);

  const aniosActivos = aniosApi.filter(a => !completado(a));
  const aniosCompletados = aniosApi.filter(completado);

  const tarjetaAnio = (a, terminado = false) => {
    const seleccionado = anioApi === String(a.anio);
    return (
      <button key={a.anio} type="button" disabled={cargandoApi}
        onClick={() => cambiarAnio(String(a.anio))}
        className={`relative rounded-xl border p-3 text-left transition-colors ${seleccionado ? "border-[#00ABE4] bg-sky-50 ring-2 ring-sky-100" :
            terminado ? "border-emerald-200 bg-emerald-50/50" :
              "border-slate-200 bg-white hover:border-sky-300"
          }`}>
        {seleccionado && <Check size={15} className="absolute right-3 top-3 text-[#0095C5]" />}
        <div className="flex items-center gap-2">
          {terminado
            ? <CheckCircle2 size={17} className="text-emerald-600" />
            : <CalendarDays size={17} className="text-[#0095C5]" />}
          <strong className="text-sm text-slate-900">{anioTexto(a.anio)}</strong>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          {numero(a.total)} por procesar
        </p>
        <p className="mt-1 text-[11px] text-emerald-700">
          {numero(a.enviadas)}/{numero(a.conDireccion)} enviadas
        </p>
        {Number(a.conError || 0) > 0 && (
          <p className="mt-1 text-[11px] text-red-600">
            {numero(a.conError)} con error
          </p>
        )}
      </button>
    );
  };

  // ====================================================
  // VISTA
  // ====================================================

  return (
    <div className="space-y-4">

      {/* ENCABEZADO */}

      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#00ABE4] to-[#0095C5] px-6 py-5 text-white shadow-lg md:px-8">
        <PlugZap size={110}
          className="pointer-events-none absolute right-6 top-1/2 hidden -translate-y-1/2 opacity-15 md:block" />
        <div className="relative z-10">
          <p className="flex items-center gap-2 text-xs font-semibold text-sky-100">
            <MapPin size={15} /> INTEGRACIONES
          </p>
          <h1 className="mt-2 text-2xl font-bold md:text-3xl">
            Ubicabilidad de personas
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-sky-50">
            Importación de documentos, consultas RUNT por lotes
            e integración con Contravenciones.
          </p>
        </div>
      </section>

      {/* INDICADORES */}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Indicador titulo="Solicitudes API" valor={numero(totalApi)}
          icono={PlugZap} />
        <Indicador titulo="En cola API" valor={numero(totalEnColaApi)}
          icono={Clock3} color="amber" />
        <Indicador titulo="Trabajos monitoreados" valor={numero(jobs.length)}
          icono={CheckCircle2} color="green" />
      </div>

      {/* FUENTES DE PROCESAMIENTO */}

      <section className={`${CARD} p-4 md:p-5`}>
        <Titulo icono={Layers3} titulo="Fuentes de procesamiento"
          descripcion="Seleccione documentos pendientes de Excel o solicitudes de integraciones API." />

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-sky-200 bg-sky-50/40 p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-white p-2.5 text-[#0095C5]">
                <Database size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Pendientes de Excel
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Documentos previamente importados en la base de datos.
                </p>
              </div>
            </div>

            <p className="mt-3 text-xs leading-relaxed text-slate-600">
              Consulta los documentos pendientes y prepara lotes
              de máximo {POR_JOB} por tipo de identificación.
            </p>

            <button type="button"
              disabled={cargandoExcelBD || ocupado}
              onClick={() => mostrarExcelBD
                ? (setMostrarExcelBD(false), setGrupoExcel(null), setDocumentosExcel(""))
                : cargarPendientesExcel()}
              className={`${PRIMARY} mt-4 w-full sm:w-auto`}>
              {cargandoExcelBD
                ? <Loader2 size={16} className="animate-spin" />
                : mostrarExcelBD ? <X size={16} /> : <Database size={16} />}
              {cargandoExcelBD ? "Consultando..." :
                mostrarExcelBD ? "Ocultar pendientes" : "Cargar pendientes de Excel"}
            </button>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-sky-50 p-2.5 text-[#0095C5]">
                <PlugZap size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Solicitudes API
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Integraciones externas de Contravenciones.
                </p>
              </div>
            </div>

            <p className="mt-3 text-xs leading-relaxed text-slate-600">
              Filtra por año, origen y tipo documental.
              Consulta y procesa solicitudes de servicios externos.
            </p>

            <button type="button" disabled={cargandoApi || ocupado}
              onClick={() => mostrarApi
                ? (setMostrarApi(false), setGrupoApi(null), setDocumentosApi(""))
                : cargarApi()}
              className={`${OUTLINE} mt-4 w-full sm:w-auto`}>
              {cargandoApi
                ? <Loader2 size={16} className="animate-spin" />
                : mostrarApi ? <X size={16} /> : <PlugZap size={16} />}
              {cargandoApi ? "Consultando..." :
                mostrarApi ? "Ocultar solicitudes" : "Ver solicitudes API"}
            </button>
          </div>
        </div>
      </section>

      {/* PENDIENTES DE EXCEL */}

      {mostrarExcelBD && (
        <section className={`${CARD} p-4 md:p-5`}>
          <Titulo icono={Database}
            titulo="Documentos pendientes de Excel"
            descripcion={`${numero(totalExcel)} documentos pendientes según la consulta a BD`}
            derecha={
              <button type="button" className={OUTLINE}
                disabled={cargandoExcelBD || ocupado}
                onClick={cargarPendientesExcel}>
                <RefreshCw size={15}
                  className={cargandoExcelBD ? "animate-spin" : ""} />
                Actualizar
              </button>
            }
          />

          {gruposExcel.length === 0 ? (
            <div className="mt-4">
              <Vacio icono={CheckCircle2}
                mensaje="No se encontraron documentos pendientes de Excel." />
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
              {gruposExcel.map(g => {
                const seleccionado = grupoExcel?.tipoDocumento === g.tipoDocumento;
                return (
                  <button key={g.tipoDocumento} type="button"
                    disabled={ocupado || !g.documentos.length}
                    onClick={() => seleccionarGrupoExcel(g)}
                    className={`flex items-center justify-between gap-3 rounded-xl border p-4 text-left ${seleccionado
                        ? "border-[#00ABE4] bg-sky-50 ring-2 ring-sky-100"
                        : "border-slate-200 bg-white hover:border-sky-300"
                      }`}>
                    <div className="flex items-center gap-3">
                      <IdCard size={21} className="text-[#0095C5]" />
                      <div>
                        <p className="text-sm font-bold text-slate-900">
                          {g.tipoDocumento}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {numero(g.total)} pendientes · {g.documentos.length} disponibles en el lote
                        </p>
                      </div>
                    </div>
                    <span className="rounded-lg bg-sky-50 px-3 py-2 text-xs font-semibold text-[#0095C5]">
                      {seleccionado ? "Seleccionado" : "Cargar"}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {grupoExcel && (
            <div className="mt-4 rounded-xl border border-sky-200 bg-sky-50/40 p-4">
              <Titulo icono={ClipboardList}
                titulo="Lote Excel listo para procesar"
                descripcion={`Tipo documental: ${grupoExcel.tipoDocumento}`}
                derecha={
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#0095C5]">
                    {separarDocs(documentosExcel).length}/{POR_JOB}
                  </span>
                }
              />

              <textarea rows={5} value={documentosExcel}
                disabled={ocupado}
                onChange={e => setDocumentosExcel(e.target.value)}
                className="mt-4 w-full resize-y rounded-xl border border-slate-200 p-3 font-mono text-xs outline-none focus:border-[#00ABE4]" />

              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" className={GREEN}
                  disabled={ocupado || !documentosExcel.trim()}
                  onClick={() => crearTrabajo("excel")}>
                  {procesando
                    ? <Loader2 size={15} className="animate-spin" />
                    : <CheckCircle2 size={15} />}
                  Crear lote de hasta 90
                </button>
                <button type="button" className={OUTLINE}
                  disabled={ocupado}
                  onClick={() => {
                    setGrupoExcel(null);
                    setDocumentosExcel("");
                  }}>
                  <X size={15} /> Cancelar
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {/* SOLICITUDES API */}

      {mostrarApi && (
        <section className={`${CARD} overflow-hidden`}>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4 md:p-5">
            <Titulo icono={PlugZap}
              titulo="Solicitudes API pendientes"
              descripcion={`${numero(totalApi)} solicitudes · ${numero(totalEnColaApi)} en cola`}
            />
            <div className="flex gap-2">
              <button type="button" className={OUTLINE}
                disabled={cargandoApi}
                onClick={() => cargarApi()}>
                <RefreshCw size={15}
                  className={cargandoApi ? "animate-spin" : ""} />
                Actualizar
              </button>
              <button type="button" className={OUTLINE}
                onClick={() => setMostrarApi(false)}>
                <X size={15} /> Cerrar
              </button>
            </div>
          </div>

          <div className="space-y-4 p-4 md:p-5">

            {/* AÑOS */}

            <Paso n="1" titulo="Año del comparendo"
              descripcion="Seleccione el año para filtrar las solicitudes.">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                <button type="button" disabled={cargandoApi}
                  onClick={() => cambiarAnio("")}
                  className={`rounded-xl border p-3 text-left ${anioApi === "" ? "border-[#00ABE4] bg-sky-50" :
                      "border-slate-200 bg-white"
                    }`}>
                  <Layers3 size={18} className="text-[#0095C5]" />
                  <p className="mt-2 text-sm font-bold">Todos</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {numero(totales.porProcesar)} pendientes
                  </p>
                </button>
                {aniosActivos.map(a => tarjetaAnio(a))}
              </div>

              {aniosCompletados.length > 0 && (
                <div className="mt-3">
                  <button type="button"
                    onClick={() => setMostrarCompletados(v => !v)}
                    className="flex w-full items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs font-semibold text-emerald-700">
                    <ChevronDown size={15}
                      className={mostrarCompletados ? "rotate-180" : ""} />
                    Completados ({aniosCompletados.length})
                  </button>
                  {mostrarCompletados && (
                    <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                      {aniosCompletados.map(a => tarjetaAnio(a, true))}
                    </div>
                  )}
                </div>
              )}
            </Paso>

            {/* ORIGEN Y ENVÍO */}

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
              <div className="xl:col-span-3">
                <Paso n="2" titulo="Servicio de origen"
                  descripcion="Filtre según la integración externa.">
                  <div className="flex flex-wrap gap-2">
                    <button type="button" disabled={cargandoApi}
                      onClick={() => cambiarOrigen("")}
                      className={`${BTN} ${origenApi === ""
                        ? "bg-[#00ABE4] text-white"
                        : "border border-slate-200 bg-white text-slate-600"}`}>
                      Todos
                    </button>

                    {origenesApi.map(o => (
                      <button type="button" key={o.origen}
                        disabled={cargandoApi}
                        onClick={() => cambiarOrigen(o.origen)}
                        className={`${BTN} ${origenApi === o.origen
                            ? "bg-[#00ABE4] text-white"
                            : "border border-slate-200 bg-white text-slate-600"
                          }`}>
                        <PlugZap size={14} />
                        {o.origen}
                        <span className="text-[10px]">{numero(o.total)}</span>
                      </button>
                    ))}
                  </div>
                </Paso>
              </div>

              <div className="xl:col-span-2">
                <div className="h-full rounded-xl border border-sky-200 bg-sky-50/60 p-4">
                  <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900">
                    <Send size={17} className="text-[#0095C5]" />
                    Respuestas a Contravenciones
                  </h3>
                  <p className="mt-2 text-xs text-slate-500">
                    Enviar las direcciones consultadas por año.
                  </p>

                  <div className="mt-4 grid grid-cols-3 gap-2">
                    {[
                      ["Por enviar", porEnviar, "text-slate-900"],
                      ["Enviadas", enviadas, "text-emerald-600"],
                      ["Con error", conError, "text-red-600"]
                    ].map(([label, valor, color], i) => (
                      <button key={label} type="button"
                        disabled={i !== 2}
                        onClick={() => abrirErrores()}
                        className="rounded-lg bg-white p-3 text-left disabled:cursor-default">
                        <p className={`text-lg font-bold ${color}`}>{numero(valor)}</p>
                        <p className="text-[10px] text-slate-500">{label}</p>
                      </button>
                    ))}
                  </div>

                  <button type="button" className={`${PRIMARY} mt-4 w-full`}
                    disabled={!anioActivo || anioEnviando !== null ||
                      cargandoApi || porEnviar === 0}
                    onClick={() => setConfirmEnvio({
                      anio: anioActivo.anio,
                      origen: origenApi,
                      conDireccion, enviadas, porEnviar
                    })}>
                    {anioEnviando !== null
                      ? <Loader2 size={15} className="animate-spin" />
                      : <Send size={15} />}
                    Enviar a Contravenciones
                  </button>
                  <p className="mt-2 text-center text-[11px] text-slate-500">
                    {anioActivo ? `Año ${anioTexto(anioActivo.anio)}` :
                      "Seleccione un año para habilitar el envío"}
                  </p>
                </div>
              </div>
            </div>

            {/* GRUPOS API */}

            <Paso n="3" titulo="Grupos de documentos"
              descripcion="Seleccione un grupo para preparar hasta 90 documentos.">
              {!gruposApi.length ? (
                <Vacio icono={IdCard}
                  mensaje="No hay grupos para los filtros seleccionados." />
              ) : (
                <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                  {gruposApi.map(g => {
                    const activo = grupoApi &&
                      grupoApi.origen === g.origen &&
                      grupoApi.anio === g.anio &&
                      grupoApi.tipoDocumento === g.tipoDocumento;

                    return (
                      <button type="button"
                        key={`${g.origen}-${g.anio}-${g.tipoDocumento}`}
                        disabled={ocupado || g.porProcesar <= 0}
                        onClick={() => seleccionarGrupoApi(g)}
                        className={`flex items-center justify-between gap-3 rounded-xl border p-3 text-left ${activo ? "border-[#00ABE4] bg-sky-50" :
                            "border-slate-200 bg-white hover:border-sky-300"
                          }`}>
                        <div className="flex items-center gap-3">
                          <IdCard size={21} className="text-[#0095C5]" />
                          <div>
                            <p className="text-[10px] font-semibold text-slate-500">
                              {g.origen} · {anioTexto(g.anio)}
                            </p>
                            <p className="mt-1 text-sm font-bold text-slate-900">
                              {g.tipoDocumento}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              {numero(g.porProcesar)} disponibles · {numero(g.enCola)} en cola
                            </p>
                          </div>
                        </div>
                        <Upload size={17} className="text-[#0095C5]" />
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
                <p className="text-xs text-slate-500">
                  Máximo {POR_JOB} documentos por trabajo.
                </p>
                <button type="button" disabled
                  title="Función deshabilitada"
                  className={`${BTN} cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-400 opacity-60`}>
                  <Trash2 size={14} /> Limpiar solicitudes API
                </button>
              </div>
            </Paso>
          </div>
        </section>
      )}

      {/* LOTE API SELECCIONADO */}

      {grupoApi && (
        <section className={`${CARD} border-sky-300 p-4 md:p-5`}>
          <Titulo icono={ClipboardList}
            titulo="Lote API listo para procesar"
            descripcion={`${grupoApi.origen} · ${anioTexto(grupoApi.anio)} · ${grupoApi.tipoDocumento}`}
            derecha={
              <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-[#0095C5]">
                {separarDocs(documentosApi).length}/{POR_JOB}
              </span>
            }
          />

          <textarea rows={5} value={documentosApi}
            disabled={ocupado}
            onChange={e => setDocumentosApi(e.target.value)}
            className="mt-4 w-full resize-y rounded-xl border border-slate-200 p-3 font-mono text-xs outline-none focus:border-[#00ABE4]" />

          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" className={GREEN}
              disabled={ocupado || !documentosApi.trim()}
              onClick={() => crearTrabajo("api")}>
              {procesando
                ? <Loader2 size={15} className="animate-spin" />
                : <CheckCircle2 size={15} />}
              Crear lote API
            </button>
            <button type="button" className={OUTLINE}
              disabled={ocupado}
              onClick={() => {
                setGrupoApi(null);
                setDocumentosApi("");
              }}>
              <X size={15} /> Cancelar
            </button>
          </div>
        </section>
      )}

      {/* IMPORTACIÓN EXCEL - SOLO INSERTAR */}

      <section className={`${CARD} p-4 md:p-5`}>
        <Titulo icono={FileSpreadsheet}
          titulo="Importar documentos Excel / CSV"
          descripcion="Valida los archivos e inserta los documentos en la base de datos."
        />

        <div className="mt-4 flex items-start gap-2 rounded-xl bg-sky-50 p-3">
          <Info size={16} className="mt-0.5 shrink-0 text-[#0095C5]" />
          <p className="text-xs leading-relaxed text-slate-600">
            La importación no inicia consultas RUNT. Después de insertar,
            utiliza <strong>Cargar pendientes de Excel</strong> para crear
            lotes de máximo {POR_JOB} documentos.
          </p>
        </div>

        <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv"
          onChange={seleccionarArchivo} className="hidden" />

        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" className={OUTLINE}
            disabled={ocupado}
            onClick={() => fileInputRef.current?.click()}>
            <Upload size={15} />
            <span className="max-w-[200px] truncate">
              {archivo ? archivo.name : "Seleccionar archivo"}
            </span>
          </button>

          <button type="button" className={PRIMARY}
            disabled={!archivo || ocupado}
            onClick={validarEInsertar}>
            {validando
              ? <Loader2 size={15} className="animate-spin" />
              : <Database size={15} />}
            {validando ? "Validando e insertando..." : "Validar e insertar"}
          </button>

          {archivo && (
            <button type="button" className={OUTLINE}
              disabled={ocupado} onClick={limpiarArchivo}>
              <X size={15} /> Limpiar
            </button>
          )}
        </div>

        <p className="mt-3 text-xs text-slate-500">
          Formatos permitidos: XLSX, XLS y CSV. Columnas:
          <strong> tipo_documento</strong> y <strong>documento</strong>.
        </p>

        {validacion && (
          <div className="mt-5 border-t border-slate-100 pt-4">
            <h3 className="mb-3 text-sm font-bold text-slate-900">
              Resultado de la validación e inserción
            </h3>

            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
              {[
                ["Total filas", validacion.total_filas, "bg-slate-50 text-slate-900"],
                ["Válidos", validacion.registros_validos, "bg-emerald-50 text-emerald-700"],
                ["Duplicados", validacion.registros_duplicados, "bg-amber-50 text-amber-700"],
                ["Errores", validacion.registros_error, "bg-red-50 text-red-700"]
              ].map(([titulo, valor, estilo]) => (
                <div key={titulo} className={`rounded-xl p-3 text-center ${estilo}`}>
                  <p className="text-xl font-bold">{numero(valor)}</p>
                  <p className="mt-1 text-xs">{titulo}</p>
                </div>
              ))}
            </div>

            {validacion.documentos?.length > 0 && (
              <div className="mt-4">
                <DocumentosSwiper documentos={validacion.documentos} />
              </div>
            )}
          </div>
        )}
      </section>

      {/* SEGUIMIENTO DE TRABAJOS */}

      {jobs.length > 0 && (
        <section className={`${CARD} space-y-3 p-4 md:p-5`}>
          <Titulo icono={Clock3}
            titulo={`Seguimiento de trabajos (${jobs.length})`}
            descripcion="Estado de procesamiento de las búsquedas."
          />

          {jobs.map(jobId => (
            <JobProgress key={jobId} jobId={jobId}
              onClose={() => {
                setJobs(prev => prev.filter(id => id !== jobId));
                cargarResultados(1);
              }}
              onComplete={() => {
                cargarResultados(1);
                cargarHistorial(origenHistorial);
                refrescarApi();
              }}
            />
          ))}
        </section>
      )}

      {/* RESULTADOS */}

      <section className={`${CARD} p-4 md:p-5`}>
        <Titulo icono={Eye}
          titulo="Resultados de ubicabilidad"
          descripcion={`${numero(pagina.total)} registros encontrados`}
          derecha={
            <button type="button" className={OUTLINE}
              disabled={cargandoResultados}
              onClick={() => cargarResultados(1)}>
              <RefreshCw size={15}
                className={cargandoResultados ? "animate-spin" : ""} />
              Consultar
            </button>
          }
        />

        <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-4">
          <input className={INPUT} type="text"
            placeholder="Número de documento"
            value={filtros.documento}
            onChange={e => setFiltros(v => ({ ...v, documento: e.target.value }))} />

          <select className={INPUT} value={origenResultados}
            onChange={e => {
              setOrigenResultados(e.target.value);
              cargarResultados(1, e.target.value);
            }}>
            <option value="">Este módulo</option>
            {ORIGENES.map(o => <option key={o} value={o}>{o}</option>)}
          </select>

          <select className={INPUT} value={filtros.estado}
            onChange={e => setFiltros(v => ({ ...v, estado: e.target.value }))}>
            <option value="">Todos los estados</option>
            <option value="CONSULTADA">Encontrada</option>
            <option value="SIN_DIRECCION">Sin dirección</option>
            <option value="PENDIENTE">Pendiente</option>
            <option value="ERROR">Error</option>
          </select>

          <button type="button" className={PRIMARY}
            onClick={() => cargarResultados(1)}>
            <Search size={15} /> Aplicar filtros
          </button>
        </div>

        {cargandoResultados ? (
          <div className="flex h-36 items-center justify-center">
            <Loader2 size={27} className="animate-spin text-[#00ABE4]" />
          </div>
        ) : !resultados.length ? (
          <div className="mt-4">
            <Vacio icono={Search}
              mensaje="No hay resultados para los filtros seleccionados." />
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[800px] text-xs">
              <thead className="bg-[#E9F1FA]">
                <tr>
                  {["Tipo", "Documento", "Nombres", "Dirección", "Estado", "Fecha"].map(h => (
                    <th key={h} className="px-3 py-3 text-left font-semibold text-slate-600">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {resultados.map((r, i) => {
                  const [estado, tono] = estadoResultado(r);
                  return (
                    <tr key={r.id_per_natural_dir || i}
                      className="border-b border-slate-100 hover:bg-sky-50/40">
                      <td className="px-3 py-3">{r.tipo_documento}</td>
                      <td className="px-3 py-3 font-mono font-bold text-slate-900">
                        {r.numero_documento}
                      </td>
                      <td className="px-3 py-3">
                        {[r.nombres, r.apellidos].filter(Boolean).join(" ") || "—"}
                      </td>
                      <td className="max-w-[220px] truncate px-3 py-3"
                        title={r.direccion || r.error_consulta_direccion || ""}>
                        {r.error_consulta_direccion ||
                          (r.direccion_encontrada ? r.direccion || "—" : "Sin dirección")}
                      </td>
                      <td className="px-3 py-3">
                        <span className={`rounded-full px-2.5 py-1 font-semibold ${tono}`}>
                          {estado}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-slate-500">
                        {fechaCol(r.fecha_consulta_direccion)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <Paginacion page={pagina.page}
          pages={pagina.totalPages} total={pagina.total}
          cambiar={p => cargarResultados(p)}
        />
      </section>

      {/* HISTORIAL */}

      <section className={`${CARD} p-4 md:p-5`}>
        <Titulo icono={ClipboardList}
          titulo="Historial de ubicabilidad"
          descripcion={`${numero(historial.length)} registros consultados`}
        />

        <div className="mt-4 flex flex-wrap gap-2">
          <select className={`${INPUT} w-full sm:w-auto`}
            value={origenHistorial}
            onChange={e => {
              setOrigenHistorial(e.target.value);
              cargarHistorial(e.target.value);
            }}>
            <option value="">Este módulo</option>
            {ORIGENES.map(o => <option key={o} value={o}>{o}</option>)}
          </select>

          <button type="button" className={OUTLINE}
            disabled={cargandoHistorial}
            onClick={() => cargarHistorial(origenHistorial)}>
            <RefreshCw size={15}
              className={cargandoHistorial ? "animate-spin" : ""} />
            Recargar
          </button>

          <button type="button" className={PRIMARY}
            disabled={!historial.length || cargandoHistorial}
            onClick={exportarExcel}>
            <Download size={15} /> Exportar Excel
          </button>
        </div>

        <div className="mt-3 flex items-start gap-2 rounded-xl bg-sky-50 p-3">
          <Info size={15} className="shrink-0 text-[#0095C5]" />
          <p className="text-xs text-slate-600">
            La exportación incluye los registros devueltos por el servicio
            de historial para el origen seleccionado.
          </p>
        </div>
      </section>

      {/* MODALES */}

      <ConfirmModal
        open={Boolean(confirmEnvio)}
        title="Enviar resultados a Contravenciones"
        message={confirmEnvio
          ? `Año ${anioTexto(confirmEnvio.anio)}: ${numero(confirmEnvio.conDireccion)} personas con dirección, ${numero(confirmEnvio.enviadas)} ya enviadas y ${numero(confirmEnvio.porEnviar)} por enviar. Se reenviarán también las respuestas enviadas anteriormente. ¿Desea continuar?`
          : ""}
        confirmText="Enviar resultados"
        onConfirm={enviarRespuestas}
        onCancel={() => setConfirmEnvio(null)}
      />

      <ErroresEnvioModal
        open={erroresAbiertos}
        titulo={`Respuestas con error · ${erroresContexto.etiqueta}`}
        subtitulo={`Origen: ${erroresContexto.origen || "Todos los servicios"} · Rechazadas por Contravenciones`}
        errores={erroresLista}
        cargando={erroresCargando}
        error={erroresError}
        etiquetaAnio={anioTexto}
        onCerrar={() => setErroresAbiertos(false)}
        onReintentar={erroresContexto.anio !== "" ? reintentarErrores : undefined}
      />
    </div>
  );
}
