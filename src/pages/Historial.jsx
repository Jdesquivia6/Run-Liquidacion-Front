
import { useCallback, useEffect, useRef, useState } from "react";
import { API_BASE } from "../config";
import ExcelJS from "exceljs";
import toast from "react-hot-toast";
import {
  Clock3, Search, CarFront, MapPin, FileText, TrendingUp,
  CheckCircle2, XCircle, AlertCircle, RefreshCw, Download,
  CalendarDays, ChevronLeft, ChevronRight, Eye, X,
  Database, Loader2, FilterX, UserRound, ListChecks, Info
} from "lucide-react";

// ======================================================
// ESTILOS Y CONFIGURACIÓN
// ======================================================

const MODULOS = [
  { id: "todos", label: "Todos", icon: Database },
  { id: "consulta-placa", label: "Consulta placa", icon: FileText },
  { id: "datos-vehiculo", label: "Datos vehículo", icon: CarFront },
  { id: "personas-direcciones", label: "Direcciones", icon: MapPin },
  { id: "liquidacion", label: "Liquidaciones", icon: TrendingUp }
];

const LABELS = {
  "consulta-placa": "Consulta placa",
  "datos-vehiculo": "Datos vehículo",
  "personas-direcciones": "Direcciones",
  liquidacion: "Liquidaciones"
};

const TONES = {
  "consulta-placa": "bg-blue-50 text-blue-700",
  "datos-vehiculo": "bg-emerald-50 text-emerald-700",
  "personas-direcciones": "bg-amber-50 text-amber-700",
  liquidacion: "bg-violet-50 text-violet-700"
};

const CARD = "rounded-2xl border border-slate-200 bg-white shadow-sm";
const BTN = "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm";
const PRIMARY = `${BTN} bg-[#00ABE4] text-white hover:bg-[#0095C5]`;
const OUTLINE = `${BTN} border border-slate-200 bg-white text-slate-600 hover:bg-slate-50`;
const INPUT = "h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-[#00ABE4] focus:ring-2 focus:ring-sky-100";
const TH = "whitespace-nowrap px-4 py-3 text-left text-xs font-semibold text-slate-600";
const TD = "px-4 py-3 text-xs text-slate-600";
const EXPORT_BATCH = 1000;

// ======================================================
// UTILIDADES
// ======================================================

const str = v => v === null || v === undefined || v === ""
  ? "—" : String(v);

const excelTexto = v => {
  const s = v === null || v === undefined ? "" : String(v);
  return /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
};

function fechaColombia(f) {
  if (!f) return "—";
  const d = new Date(f);
  return Number.isNaN(d.getTime()) ? "—" :
    d.toLocaleString("es-CO", { timeZone: "America/Bogota" });
}

function hoyColombia() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Bogota",
    year: "numeric", month: "2-digit", day: "2-digit"
  }).formatToParts(new Date());
  const get = k => parts.find(x => x.type === k)?.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}

function ModuloBadge({ modulo }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${TONES[modulo] || "bg-slate-100 text-slate-600"}`}>
      {LABELS[modulo] || str(modulo)}
    </span>
  );
}

function EstadoBadge({ estado }) {
  const ok = estado === true;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
      ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
    }`}>
      {ok ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
      {ok ? "Exitosa" : "Fallida"}
    </span>
  );
}

function Indicador({ icon: Icon, label, value, color }) {
  const tones = {
    blue: "bg-sky-50 text-[#0095C5]",
    green: "bg-emerald-50 text-emerald-600",
    red: "bg-red-50 text-red-600"
  };
  return (
    <div className={`${CARD} flex items-center gap-3 p-4`}>
      <div className={`hidden h-11 w-11 shrink-0 items-center justify-center rounded-xl sm:flex ${tones[color]}`}>
        <Icon size={21} />
      </div>
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-xl font-bold text-slate-900 md:text-2xl">
          {Number(value || 0).toLocaleString("es-CO")}
        </p>
      </div>
    </div>
  );
}

function Campo({ label, value }) {
  return (
    <div className="min-w-0 rounded-xl bg-slate-50 p-3">
      <p className="text-[11px] font-medium text-slate-500">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-slate-800">
        {str(value)}
      </p>
    </div>
  );
}

// ======================================================
// MODAL DE DETALLE
// ======================================================

function ModalDetalle({ item, onClose }) {
  useEffect(() => {
    if (!item) return;
    const fn = e => e.key === "Escape" && onClose();
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [item, onClose]);

  if (!item) return null;

  const placa = item.modulo === "consulta-placa";
  const vehiculo = item.modulo === "datos-vehiculo";
  const direccion = item.modulo === "personas-direcciones";
  const liquidacion = item.modulo === "liquidacion";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-sm"
      onMouseDown={e => e.target === e.currentTarget && onClose()}
    >
      <div role="dialog" aria-modal="true" aria-label="Detalle de consulta"
        className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">

        <div className="flex items-center justify-between gap-3 border-b border-slate-100 p-4 md:p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-sky-50 p-3 text-[#00ABE4]">
              <FileText size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Detalle de consulta</h3>
              <p className="text-xs text-slate-500">{fechaColombia(item.fecha)}</p>
            </div>
          </div>
          <button type="button" aria-label="Cerrar" onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
            <X size={19} />
          </button>
        </div>

        <div className="space-y-5 overflow-y-auto p-4 md:p-5">
          <div className="flex gap-2">
            <ModuloBadge modulo={item.modulo} />
            <EstadoBadge estado={item.estado} />
          </div>

          <div>
            <h4 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900">
              <Info size={16} className="text-[#00ABE4]" />
              Información general
            </h4>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Campo label="Placa / Documento" value={item.placa_documento} />
              <Campo label="Fecha" value={fechaColombia(item.fecha)} />
              <Campo label="Módulo" value={LABELS[item.modulo]} />
              <Campo label="Estado" value={item.estado === true ? "Exitosa" : "Fallida"} />
            </div>
          </div>

          {placa && (
            <div>
              <h4 className="mb-3 flex items-center gap-2 text-sm font-bold">
                <UserRound size={16} className="text-[#00ABE4]" />
                Información del propietario
              </h4>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Campo label="Propietario(s)" value={item.propietario} />
                <Campo label="Tipo identificación" value={item.tipo_documento_propietario} />
                <Campo label="Documento(s)" value={item.numero_documento_propietario} />
              </div>
              {!item.propietario && (
                <p className="mt-3 rounded-xl bg-amber-50 p-3 text-xs text-amber-700">
                  Esta consulta no tiene propietario relacionado en la base de datos.
                </p>
              )}
            </div>
          )}

          {vehiculo && (
            <div>
              <h4 className="mb-3 flex items-center gap-2 text-sm font-bold">
                <CarFront size={16} className="text-[#00ABE4]" />
                Características del vehículo
              </h4>
              <div className="grid grid-cols-2 gap-3">
                {[
                  ["Clase", item.clase], ["Marca", item.marca],
                  ["Línea", item.linea], ["Modelo", item.modelo],
                  ["Color", item.color], ["Servicio", item.servicio]
                ].map(([label, value]) => (
                  <Campo key={label} label={label} value={value} />
                ))}
              </div>
            </div>
          )}

          {direccion && (
            <div>
              <h4 className="mb-3 flex items-center gap-2 text-sm font-bold">
                <MapPin size={16} className="text-[#00ABE4]" />
                Persona y dirección RUNT
              </h4>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Campo label="Nombres" value={item.nombres} />
                <Campo label="Apellidos" value={item.apellidos} />
                <Campo label="Documento" value={item.numero_documento_propietario} />
                <Campo label="Celular" value={item.celular} />
                <Campo label="Correo" value={item.correo} />
                <Campo label="Tipo de dirección" value={item.tipo_direccion} />
                <div className="sm:col-span-2">
                  <Campo label="Dirección encontrada" value={item.direccion} />
                </div>
                <Campo label="Municipio / Departamento" value={item.municipio_departamento} />
                <Campo label="Teléfono dirección" value={item.telefono_direccion} />
              </div>
            </div>
          )}

          {liquidacion && (
            <div>
              <h4 className="mb-3 flex items-center gap-2 text-sm font-bold">
                <ListChecks size={16} className="text-[#00ABE4]" />
                Trámites liquidados
              </h4>
              <p className="whitespace-pre-wrap break-words rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
                {str(item.tramites)}
              </p>
            </div>
          )}

          {item.detalle && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
              <p className="mb-1 flex items-center gap-2 text-xs font-bold text-amber-800">
                <AlertCircle size={15} /> Información adicional
              </p>
              <p className="whitespace-pre-wrap break-words text-sm text-amber-800">
                {item.detalle}
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end border-t border-slate-100 p-4">
          <button type="button" className={PRIMARY} onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  );
}

// ======================================================
// EXPORTACIÓN EXCEL CON DISEÑO CORPORATIVO
// ======================================================

async function crearExcel(registros, filtros) {
  const wb = new ExcelJS.Workbook();
  wb.creator = "AutoCore";
  wb.subject = "Historial unificado";
  wb.created = new Date();

  const ws = wb.addWorksheet("Historial", {
    views: [{ state: "frozen", xSplit: 2, ySplit: 6 }]
  });

  const columnas = [
    ["Fecha", 23], ["Placa / Documento", 22],
    ["Módulo", 21], ["Estado", 14], ["Detalle", 40],
    ["Propietario(s)", 37], ["Tipo documento", 25],
    ["Número documento", 25], ["Nombres", 27],
    ["Apellidos", 27], ["Dirección", 50],
    ["Municipio / Departamento", 37],
    ["Teléfono dirección", 22], ["Tipo dirección", 21],
    ["Celular", 20], ["Correo", 35],
    ["Clase", 17], ["Marca", 20], ["Línea", 20],
    ["Modelo", 13], ["Color", 18], ["Servicio", 20],
    ["Trámites", 40]
  ];

  ws.columns = columnas.map(([, width]) => ({ width }));
  const ultima = ws.getColumn(columnas.length).letter;

  // Título
  ws.mergeCells(`A1:${ultima}2`);
  const titulo = ws.getCell("A1");
  titulo.value = "AUTOCORE  |  HISTORIAL DE CONSULTAS";
  titulo.font = {
    name: "Aptos Display", size: 18,
    bold: true, color: { argb: "FFFFFFFF" }
  };
  titulo.fill = {
    type: "pattern", pattern: "solid",
    fgColor: { argb: "FF0095C5" }
  };
  titulo.alignment = { vertical: "middle", indent: 1 };
  ws.getRow(1).height = 24;
  ws.getRow(2).height = 24;

  // Filtros
  ws.mergeCells(`A3:${ultima}3`);
  const subtitulo = ws.getCell("A3");
  subtitulo.value =
    `Módulo: ${LABELS[filtros.modulo] || "Todos"}    |    ` +
    `Desde: ${filtros.inicio || "Sin filtro"}    |    ` +
    `Hasta: ${filtros.fin || "Sin filtro"}`;
  subtitulo.font = { name: "Aptos", size: 11, color: { argb: "FF475569" } };
  subtitulo.fill = {
    type: "pattern", pattern: "solid",
    fgColor: { argb: "FFE9F1FA" }
  };
  subtitulo.alignment = { vertical: "middle", indent: 1 };
  ws.getRow(3).height = 28;

  // Indicadores
  const ok = registros.filter(r => r.estado === true).length;
  ws.mergeCells(`A4:${ultima}4`);
  const resumen = ws.getCell("A4");
  resumen.value =
    `REGISTROS: ${registros.length}       ` +
    `EXITOSAS: ${ok}       FALLIDAS: ${registros.length - ok}`;
  resumen.font = {
    name: "Aptos", size: 11, bold: true,
    color: { argb: "FF0F172A" }
  };
  resumen.alignment = { vertical: "middle", indent: 1 };
  ws.getRow(4).height = 28;
  ws.getRow(5).height = 10;

  // Cabecera real en fila 6
  const headers = ws.getRow(6);
  headers.values = [undefined, ...columnas.map(([nombre]) => nombre)];
  headers.height = 32;

  headers.eachCell(cell => {
    cell.font = {
      name: "Aptos", size: 10, bold: true,
      color: { argb: "FFFFFFFF" }
    };
    cell.fill = {
      type: "pattern", pattern: "solid",
      fgColor: { argb: "FF00ABE4" }
    };
    cell.alignment = { vertical: "middle", horizontal: "left" };
    cell.border = {
      bottom: { style: "medium", color: { argb: "FF0095C5" } }
    };
  });

  // Registros
  registros.forEach((r, i) => {
    const valores = [
      fechaColombia(r.fecha),
      r.placa_documento,
      LABELS[r.modulo] || r.modulo,
      r.estado === true ? "Exitosa" : "Fallida",
      r.detalle || (r.estado === true ? "Consulta exitosa" : "Sin detalle"),
      r.propietario,
      r.tipo_documento_propietario,
      r.numero_documento_propietario,
      r.nombres,
      r.apellidos,
      r.direccion,
      r.municipio_departamento,
      r.telefono_direccion,
      r.tipo_direccion,
      r.celular,
      r.correo,
      r.clase,
      r.marca,
      r.linea,
      r.modelo,
      r.color,
      r.servicio,
      r.tramites
    ];

    const row = ws.addRow(valores.map(excelTexto));
    row.height = 23;

    row.eachCell({ includeEmpty: true }, cell => {
      cell.font = {
        name: "Aptos", size: 10,
        color: { argb: "FF334155" }
      };
      cell.fill = {
        type: "pattern", pattern: "solid",
        fgColor: { argb: i % 2 ? "FFF2F8FC" : "FFFFFFFF" }
      };
      cell.alignment = { vertical: "middle" };
      cell.border = {
        bottom: { style: "hair", color: { argb: "FFE2E8F0" } }
      };
      cell.numFmt = "@";
    });

    // Placa / documento
    row.getCell(2).font = {
      name: "Aptos", size: 10, bold: true,
      color: { argb: "FF0F172A" }
    };

    // Estado
    row.getCell(4).font = {
      name: "Aptos", size: 10, bold: true,
      color: { argb: r.estado === true ? "FF047857" : "FFB91C1C" }
    };
    row.getCell(4).fill = {
      type: "pattern", pattern: "solid",
      fgColor: { argb: r.estado === true ? "FFD1FAE5" : "FFFEE2E2" }
    };

    // Propietario y dirección
    [6, 11, 12].forEach(c => {
      row.getCell(c).font = {
        name: "Aptos", size: 10,
        color: { argb: "FF075985" }
      };
    });
  });

  ws.autoFilter = {
    from: "A6",
    to: `${ultima}${6 + registros.length}`
  };

  ws.pageSetup = {
    orientation: "landscape",
    fitToPage: true,
    fitToWidth: 1,
    paperSize: 9
  };

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download =
    `AutoCore_Historial_${filtros.modulo}_${hoyColombia()}.xlsx`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ======================================================
// COMPONENTE PRINCIPAL
// ======================================================

export default function Historial() {
  const [registros, setRegistros] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [modulo, setModulo] = useState("todos");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [pagina, setPagina] = useState(1);
  const [limite, setLimite] = useState(10);
  const [detalle, setDetalle] = useState(null);
  const [refresco, setRefresco] = useState(0);
  const [meta, setMeta] = useState({
    total: 0, totalExitosas: 0,
    totalFallidas: 0, totalPaginas: 0
  });

  const hoy = hoyColombia();
  const requestId = useRef(0);

  const crearParams = useCallback((pag, lim) => {
    const p = new URLSearchParams();
    if (modulo !== "todos") p.set("modulo", modulo);
    if (fechaInicio) p.set("fechaInicio", fechaInicio);
    if (fechaFin) p.set("fechaFin", fechaFin);
    p.set("pagina", String(pag));
    p.set("limite", String(lim));
    return p;
  }, [modulo, fechaInicio, fechaFin]);

  // Consulta con cancelación para evitar respuestas cruzadas.
  useEffect(() => {
    const controller = new AbortController();
    const id = ++requestId.current;

    const cargar = async () => {
      setLoading(true);
      try {
        const params = crearParams(pagina, limite);
        const response = await fetch(
          `${API_BASE}/historial?${params.toString()}`,
          { signal: controller.signal }
        );
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Error cargando historial");
        if (controller.signal.aborted || requestId.current !== id) return;

        setRegistros(data.results || []);
        setMeta({
          total: Number(data.total || 0),
          totalExitosas: Number(data.totalExitosas || 0),
          totalFallidas: Number(data.totalFallidas || 0),
          totalPaginas: Number(data.totalPaginas || 0)
        });
      } catch (err) {
        if (err.name === "AbortError") return;
        toast.error(err.message);
        setRegistros([]);
        setMeta({
          total: 0, totalExitosas: 0,
          totalFallidas: 0, totalPaginas: 0
        });
      } finally {
        if (!controller.signal.aborted && requestId.current === id) {
          setLoading(false);
        }
      }
    };

    cargar();
    return () => controller.abort();
  }, [crearParams, pagina, limite, refresco]);

  const exportarExcel = async () => {
    if (exportando || meta.total === 0) return;

    setExportando(true);

    try {
      const todos = [];
      let pag = 1;
      let totalEsperado = meta.total;

      // Exportar en bloques utilizando la paginación real.
      while (todos.length < totalEsperado) {
        const params = crearParams(pag, EXPORT_BATCH);
        const response = await fetch(
          `${API_BASE}/historial?${params.toString()}`
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Error descargando registros");
        }

        const bloque = data.results || [];
        if (!bloque.length) break;

        todos.push(...bloque);
        totalEsperado = Number(data.total || todos.length);
        pag++;
      }

      if (!todos.length) {
        toast.error("No hay datos para exportar");
        return;
      }

      await crearExcel(todos, {
        modulo,
        inicio: fechaInicio,
        fin: fechaFin
      });

      toast.success(`Excel generado: ${todos.length} registro(s)`);

      if (todos.length < totalEsperado) {
        toast(`Se exportaron ${todos.length} de ${totalEsperado} registros.`);
      }
    } catch (err) {
      toast.error(`Error al exportar Excel: ${err.message}`);
    } finally {
      setExportando(false);
    }
  };

  const totalPaginas = Math.max(1, meta.totalPaginas);
  const inicio = meta.total ? (pagina - 1) * limite + 1 : 0;
  const fin = Math.min(pagina * limite, meta.total);

  return (
    <div className="min-h-screen bg-[#E9F1FA] px-4 pb-6 pt-2 md:px-6">
      <div className="mx-auto max-w-[1600px] space-y-4">

        {/* ENCABEZADO */}

        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#00ABE4] to-[#0095C5] px-6 py-5 text-white shadow-lg md:px-8">
          <Clock3 size={110}
            className="absolute right-6 top-1/2 hidden -translate-y-1/2 opacity-15 md:block" />
          <div className="relative z-10 max-w-3xl">
            <p className="flex items-center gap-2 text-xs font-semibold text-sky-100">
              <Clock3 size={15} /> HISTORIAL GENERAL
            </p>
            <h1 className="mt-2 text-2xl font-bold md:text-3xl">
              Registro de Consultas
            </h1>
            <p className="mt-2 text-sm text-sky-50">
              Historial de placas, vehículos, direcciones RUNT y
              liquidaciones. Consulta detalles y exporta informes.
            </p>
          </div>
        </section>

        {/* INDICADORES */}

        <div className="grid grid-cols-3 gap-3">
          <Indicador icon={Database} label="Total registros"
            value={meta.total} color="blue" />
          <Indicador icon={CheckCircle2} label="Exitosas"
            value={meta.totalExitosas} color="green" />
          <Indicador icon={XCircle} label="Fallidas"
            value={meta.totalFallidas} color="red" />
        </div>

        {/* FILTROS */}

        <section className={`${CARD} overflow-hidden`}>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4 md:px-5">
            <div>
              <h2 className="font-bold text-slate-900">Filtros del historial</h2>
              <p className="text-xs text-slate-500">
                Consulta por módulo o fechas.
              </p>
            </div>
            <button type="button" disabled={exportando || !meta.total}
              onClick={exportarExcel}
              className={`${BTN} bg-emerald-600 text-white hover:bg-emerald-700`}>
              {exportando
                ? <Loader2 size={16} className="animate-spin" />
                : <Download size={16} />}
              {exportando ? "Generando Excel..." : "Exportar Excel"}
            </button>
          </div>

          <div className="space-y-4 p-4 md:p-5">
            <div className="flex flex-wrap gap-2">
              {MODULOS.map(m => {
                const Icon = m.icon;
                const activo = modulo === m.id;
                return (
                  <button type="button" key={m.id}
                    onClick={() => { setModulo(m.id); setPagina(1); }}
                    className={`inline-flex h-10 items-center gap-2 rounded-xl px-3 text-xs font-semibold transition-all ${
                      activo
                        ? "bg-[#00ABE4] text-white shadow-sm"
                        : "border border-slate-200 bg-white text-slate-600 hover:bg-sky-50"
                    }`}>
                    <Icon size={15} /> {m.label}
                  </button>
                );
              })}
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:w-[440px]">
                <div>
                  <label className="mb-2 flex items-center gap-2 text-xs font-semibold text-slate-600">
                    <CalendarDays size={15} /> Fecha inicio
                  </label>
                  <input type="date" value={fechaInicio} max={hoy}
                    className={INPUT}
                    onChange={e => {
                      setFechaInicio(e.target.value);
                      setPagina(1);
                    }} />
                </div>
                <div>
                  <label className="mb-2 flex items-center gap-2 text-xs font-semibold text-slate-600">
                    <CalendarDays size={15} /> Fecha fin
                  </label>
                  <input type="date" value={fechaFin} max={hoy}
                    className={INPUT}
                    onChange={e => {
                      setFechaFin(e.target.value);
                      setPagina(1);
                    }} />
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {(fechaInicio || fechaFin) && (
                  <button type="button" className={OUTLINE}
                    onClick={() => {
                      setFechaInicio("");
                      setFechaFin("");
                      setPagina(1);
                    }}>
                    <FilterX size={15} /> Limpiar fechas
                  </button>
                )}
                <button type="button" className={PRIMARY}
                  disabled={loading}
                  onClick={() => setRefresco(n => n + 1)}>
                  <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
                  Actualizar
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* TABLA */}

        <section className={`${CARD} overflow-hidden`}>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4 md:px-5">
            <div>
              <h2 className="font-bold text-slate-900">
                Listado de consultas
              </h2>
              <p className="text-xs text-slate-500">
                {meta.total.toLocaleString("es-CO")} registros encontrados
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Mostrar</span>
              <select value={limite} className="h-10 rounded-xl border border-slate-200 px-3 text-xs"
                onChange={e => {
                  setLimite(Number(e.target.value));
                  setPagina(1);
                }}>
                {[10, 15, 25, 50, 100].map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
              <span className="text-xs text-slate-500">por página</span>
            </div>
          </div>

          {loading ? (
            <div className="flex h-52 flex-col items-center justify-center gap-3">
              <Loader2 size={28} className="animate-spin text-[#00ABE4]" />
              <p className="text-sm text-slate-500">Cargando historial...</p>
            </div>
          ) : registros.length === 0 ? (
            <div className="flex h-52 flex-col items-center justify-center gap-2">
              <Database size={35} className="text-slate-300" />
              <p className="text-sm text-slate-500">
                No se encontraron registros.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[960px]">
                <thead className="bg-[#E9F1FA]">
                  <tr>
                    {["Fecha", "Placa / Documento", "Módulo", "Estado",
                      "Información", "Acción"].map(h => (
                      <th key={h} className={TH}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {registros.map((r, i) => {
                    const info = r.modulo === "personas-direcciones"
                      ? r.direccion || "Sin dirección registrada"
                      : r.modulo === "consulta-placa"
                        ? r.propietario || "Sin propietario registrado"
                        : r.detalle ||
                          (r.estado === true ? "Consulta exitosa" : "Sin detalle");

                    return (
                      <tr key={`${r.modulo}-${r.placa_documento}-${i}`}
                        className="border-t border-slate-100 hover:bg-sky-50/40">
                        <td className={`${TD} whitespace-nowrap`}>
                          {fechaColombia(r.fecha)}
                        </td>
                        <td className={`${TD} font-mono font-bold text-slate-900`}>
                          {str(r.placa_documento)}
                        </td>
                        <td className={TD}>
                          <ModuloBadge modulo={r.modulo} />
                        </td>
                        <td className={TD}>
                          <EstadoBadge estado={r.estado} />
                        </td>
                        <td className={`${TD} max-w-[270px]`}>
                          <span className="block truncate" title={info}>
                            {info}
                          </span>
                        </td>
                        <td className={TD}>
                          <button type="button"
                            onClick={() => setDetalle(r)}
                            className="inline-flex h-9 items-center gap-2 rounded-lg bg-sky-50 px-3 text-xs font-semibold text-[#0095C5] hover:bg-sky-100">
                            <Eye size={15} /> Ver detalle
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* PAGINACIÓN */}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 p-4">
            <p className="text-xs text-slate-500">
              Mostrando {inicio} a {fin} de {meta.total.toLocaleString("es-CO")}
            </p>

            <div className="flex items-center gap-2">
              <button type="button" className={OUTLINE}
                disabled={pagina <= 1 || loading}
                onClick={() => setPagina(p => Math.max(1, p - 1))}>
                <ChevronLeft size={15} />
              </button>
              <span className="text-xs font-semibold text-slate-600">
                Página {pagina} de {totalPaginas}
              </span>
              <button type="button" className={OUTLINE}
                disabled={pagina >= totalPaginas || loading}
                onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))}>
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        </section>

        <ModalDetalle
          item={detalle}
          onClose={() => setDetalle(null)}
        />
      </div>
    </div>
  );
}
