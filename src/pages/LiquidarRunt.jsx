
import { useState, useEffect, useRef, useCallback } from "react";
import Header from "../components/Header";
import InputField from "../components/InputField";
import SelectField from "../components/FormSection";
import { API_BASE } from "../services/liquidacionApi";
import { crearJob, obtenerDetalleJob } from "../services/workerJobsApi";
import JobProgress from "../components/JobProgress";
import Swal from "sweetalert2";
import { v4 as uuidv4 } from "uuid";
import toast from "react-hot-toast";
import {
  Loader2, FileText, CheckCircle2, AlertCircle, Plus,
  Trash2, ShoppingCart, Download, ReceiptText, Package,
  AlertTriangle, Printer, Volume2, VolumeX, Lightbulb,
  ChevronLeft, ChevronRight, ClipboardCheck, X
} from "lucide-react";
import sonidoLiquidacion from "../assets/sonidoLiquidacion.mp3";

// ======================================================
// CONFIGURACIÓN
// ======================================================

const TRAMITES = [
  { value: "TRÁMITE MATRÍCULA INICIAL", label: "MATRÍCULA INICIAL" },
  { value: "TRÁMITE INSCRIPCIÓN ALERTA", label: "PIGNORADO" }
];

const CLASIFICACIONES = [
  { value: "AUTOMOVIL", label: "AUTOMOVIL" },
  { value: "MEDIDAS CAUTELARES", label: "MEDIDAS CAUTELARES" },
  { value: "MOTO", label: "MOTO" },
  { value: "MOTOCARRO", label: "MOTOCARRO" }
];

const MAX_CARRITO = 40;
const POR_PAGINA = 10;

const CARD = "rounded-2xl border border-slate-200 bg-white shadow-sm";
const BTN = "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-50";
const PRIMARY = `${BTN} bg-[#00ABE4] text-white hover:bg-[#0095C5]`;
const OUTLINE = `${BTN} border border-slate-200 bg-white text-slate-600 hover:bg-slate-50`;

const labelTramite = valor =>
  TRAMITES.find(t => t.value === valor)?.label || valor;

const escapeHtml = valor => String(valor ?? "").replace(
  /[&<>"']/g,
  c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;",
    '"': "&quot;", "'": "&#39;"
  })[c]
);

const fechaHoy = () => new Date().toISOString().slice(0, 10);

// ======================================================
// PAGINACIÓN COMPACTA
// ======================================================

function Paginacion({ pagina, total, cambiar }) {
  const paginas = Math.max(1, Math.ceil(total / POR_PAGINA));
  if (total <= POR_PAGINA) return null;

  const inicio = (pagina - 1) * POR_PAGINA + 1;
  const fin = Math.min(pagina * POR_PAGINA, total);

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
      <p className="text-xs text-slate-500">
        Mostrando <strong>{inicio} a {fin}</strong> de {total}
      </p>
      <div className="flex items-center gap-2">
        <button type="button" aria-label="Página anterior"
          disabled={pagina <= 1}
          onClick={() => cambiar(p => Math.max(1, p - 1))}
          className={`${OUTLINE} !px-3 disabled:opacity-40`}>
          <ChevronLeft size={15} />
        </button>
        <span className="text-xs font-semibold text-slate-600">
          Página {pagina} de {paginas}
        </span>
        <button type="button" aria-label="Página siguiente"
          disabled={pagina >= paginas}
          onClick={() => cambiar(p => Math.min(paginas, p + 1))}
          className={`${OUTLINE} !px-3 disabled:opacity-40`}>
          <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
}

// ======================================================
// ENCABEZADO
// ======================================================

function PageHeader({ totalPlacas, totalTramites }) {
  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#00ABE4] to-[#0095C5] px-6 py-5 text-white shadow-lg md:px-8">
      <ReceiptText size={110}
        className="pointer-events-none absolute right-6 top-1/2 hidden -translate-y-1/2 opacity-15 md:block" />

      <div className="relative z-10">
        <p className="flex items-center gap-2 text-xs font-semibold tracking-wide text-sky-100">
          <FileText size={15} /> LIQUIDACIONES RUNT
        </p>

        <h1 className="mt-2 text-2xl font-bold tracking-tight md:text-3xl">
          Liquidar valores RUNT
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-sky-50">
          Agregue placas, seleccione trámites y genere liquidaciones
          masivas de forma automática.
        </p>

        {totalPlacas > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1.5 text-xs font-semibold">
              <ShoppingCart size={13} />
              {totalPlacas} placa{totalPlacas !== 1 ? "s" : ""}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1.5 text-xs font-semibold">
              <FileText size={13} />
              {totalTramites} trámite{totalTramites !== 1 ? "s" : ""}
            </span>
          </div>
        )}
      </div>
    </section>
  );
}

// ======================================================
// FORMULARIO
// ======================================================

function Formulario({
  placa, setPlaca, tramite, setTramite,
  clasificacion, setClasificacion,
  agregar, limpiar, disabled
}) {
  return (
    <section className={`${CARD} p-4 md:p-5`}>
      <div className="mb-4">
        <h2 className="text-sm font-bold text-slate-900">
          Agregar placa y trámite
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Seleccione la placa, el trámite y la clasificación correspondiente.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <InputField
          label="Placa *"
          name="placaInput"
          value={placa}
          onChange={e => setPlaca(e.target.value)}
          placeholder="Ej: ABC123"
        />
        <SelectField
          label="Trámite *"
          name="tramiteActual"
          value={tramite}
          onChange={e => setTramite(e.target.value)}
          options={TRAMITES}
        />
        <SelectField
          label="Clasificación *"
          name="clasificacionActual"
          value={clasificacion}
          onChange={e => setClasificacion(e.target.value)}
          options={CLASIFICACIONES}
        />

        <div className="flex items-end gap-2">
          <button type="button" onClick={agregar} disabled={disabled}
            className={`${PRIMARY} min-h-[46px] flex-1`}>
            <Plus size={17} /> Agregar
          </button>
          <button type="button" onClick={limpiar}
            disabled={disabled} title="Limpiar campos"
            className={`${BTN} min-h-[46px] border border-red-200 bg-red-50 text-red-600 hover:bg-red-100`}>
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="mt-4 flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
        <Lightbulb size={16} className="mt-0.5 shrink-0 text-amber-500" />
        <p className="text-xs leading-relaxed text-slate-600">
          Para agregar varios trámites a una misma placa, mantenga la placa
          y seleccione otro trámite. Para una nueva, escriba otra placa.
        </p>
      </div>
    </section>
  );
}

// ======================================================
// AVISO DE TARIFAS
// ======================================================

function AvisoTarifas() {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
      <AlertTriangle size={17} className="mt-0.5 shrink-0 text-amber-600" />
      <div>
        <p className="text-xs font-bold text-amber-800">
          Información importante sobre liquidaciones
        </p>
        <p className="mt-1 text-xs leading-relaxed text-amber-700">
          La tarifa se selecciona automáticamente según el trámite y la
          clasificación. Para MEDIDAS CAUTELARES, deberá aceptar manualmente
          el mensaje que muestra RUNT. Máximo 40 placas por lote.
        </p>
      </div>
    </div>
  );
}

// ======================================================
// CARRITO
// ======================================================

function Carrito({
  items, totalTramites, eliminar, eliminarTramite,
  limpiar, disabled
}) {
  const [pagina, setPagina] = useState(1);
  const totalPaginas = Math.max(1, Math.ceil(items.length / POR_PAGINA));

  useEffect(() => {
    setPagina(p => Math.min(p, totalPaginas));
  }, [totalPaginas]);

  if (!items.length) return null;

  const visibles = items.slice(
    (pagina - 1) * POR_PAGINA,
    pagina * POR_PAGINA
  );

  return (
    <section className={`${CARD} p-4 md:p-5`}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <ShoppingCart size={17} className="text-[#00ABE4]" />
            Carrito de liquidaciones
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            {items.length} placas · {totalTramites} trámites
          </p>
        </div>

        <button type="button" disabled={disabled}
          onClick={limpiar}
          className={`${BTN} bg-red-50 text-red-600 hover:bg-red-100`}>
          <Trash2 size={14} /> Limpiar todo
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead className="bg-[#E9F1FA]">
            <tr>
              {["#", "Placa", "Trámites", "Clasificación", "Acción"].map(h => (
                <th key={h} className="px-3 py-3 text-left text-xs font-semibold text-slate-600">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibles.map((item, i) => (
              <tr key={item.id}
                className="border-b border-slate-100 hover:bg-sky-50/40">
                <td className="px-3 py-3 text-xs text-slate-400">
                  {(pagina - 1) * POR_PAGINA + i + 1}
                </td>
                <td className="px-3 py-3 font-mono font-bold text-slate-900">
                  {item.placa}
                </td>
                <td className="px-3 py-3">
                  <div className="flex flex-wrap gap-1.5">
                    {item.tramites.map((t, j) => (
                      <span key={j}
                        className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs text-blue-700">
                        {labelTramite(t.tramite)}
                        <button type="button" disabled={disabled}
                          title="Eliminar trámite"
                          aria-label={`Eliminar ${labelTramite(t.tramite)}`}
                          onClick={() => eliminarTramite(item.id, j)}
                          className="ml-1 rounded p-0.5 hover:bg-red-50 hover:text-red-600">
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-3 py-3 text-xs text-slate-600">
                  {item.tramites[0]?.clasificacion || "—"}
                </td>
                <td className="px-3 py-3">
                  <button type="button" disabled={disabled}
                    title="Eliminar placa"
                    onClick={() => eliminar(item.id)}
                    className="rounded-lg p-2 text-red-500 hover:bg-red-50">
                    <Trash2 size={15} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Paginacion pagina={pagina} total={items.length} cambiar={setPagina} />
    </section>
  );
}

// ======================================================
// CARRITO VACÍO
// ======================================================

function CarritoVacio() {
  return (
    <section className={`${CARD} p-10 text-center md:p-12`}>
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
        <ShoppingCart size={30} className="text-slate-300" />
      </div>
      <h3 className="text-base font-bold text-slate-900">
        Carrito vacío
      </h3>
      <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">
        Agregue placas con sus trámites para generar liquidaciones RUNT en lote.
        Máximo 40 placas por generación.
      </p>
    </section>
  );
}

// ======================================================
// RESUMEN DE LOTE
// ======================================================

function ResumenLote({
  placas, tramites, loading, progreso,
  generar, puedeEnviar, errores, attempted
}) {
  const porcentaje = Math.min(placas / MAX_CARRITO * 100, 100);
  const estado = loading
    ? "Procesando"
    : placas === 0 ? "Sin datos" : "Listo para generar";

  return (
    <section className={`${CARD} p-4 md:p-5`}>
      <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-900">
        <Package size={17} className="text-[#00ABE4]" />
        Resumen del lote
      </h3>

      <div className="space-y-3">
        {[
          ["Total placas", placas],
          ["Total trámites", tramites],
          ["Máximo permitido", `${MAX_CARRITO} placas`]
        ].map(([label, valor]) => (
          <div key={label} className="flex items-center justify-between text-sm">
            <span className="text-slate-500">{label}</span>
            <strong className="text-slate-800">{valor}</strong>
          </div>
        ))}

        <div className="pt-2">
          <div className="mb-2 flex justify-between text-xs">
            <span className="text-slate-500">Uso del lote</span>
            <span className="font-semibold text-slate-700">
              {placas}/{MAX_CARRITO}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-gradient-to-r from-[#00ABE4] to-[#0095C5] transition-all"
              style={{ width: `${porcentaje}%` }} />
          </div>
        </div>

        <div className="flex justify-between border-t border-slate-100 pt-3 text-xs">
          <span className="text-slate-500">Estado</span>
          <span className={`font-semibold ${
            loading ? "text-amber-600" :
            placas ? "text-emerald-600" : "text-slate-400"
          }`}>
            {estado}
          </span>
        </div>

        {loading && progreso.total > 0 && (
          <div>
            <div className="mb-2 flex justify-between text-xs text-slate-600">
              <span>Procesando</span>
              <strong>{progreso.actual}/{progreso.total}</strong>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full bg-[#00ABE4] transition-all"
                style={{
                  width: `${Math.min(100, progreso.actual / progreso.total * 100)}%`
                }} />
            </div>
          </div>
        )}
      </div>

      {attempted && errores.length > 0 && (
        <div className="mt-4 rounded-xl border border-red-100 bg-red-50 p-3">
          {errores.map((e, i) => (
            <p key={i} className="flex gap-2 text-xs text-red-700">
              <AlertCircle size={14} className="shrink-0" /> {e}
            </p>
          ))}
        </div>
      )}

      <button type="button" disabled={!puedeEnviar}
        onClick={generar}
        className={`${PRIMARY} mt-5 min-h-[46px] w-full`}>
        {loading ? (
          <><Loader2 size={17} className="animate-spin" /> Procesando...</>
        ) : (
          <><ClipboardCheck size={17} /> Generar todo</>
        )}
      </button>

      {placas > 0 && !loading && (
        <p className="mt-2 text-center text-xs text-slate-400">
          Se procesarán las liquidaciones incluidas en el carrito.
        </p>
      )}
    </section>
  );
}

// ======================================================
// RESULTADOS
// ======================================================

function TablaResultados({ resultados, abrirPDF, imprimirTodos }) {
  const [pagina, setPagina] = useState(1);
  const totalPaginas = Math.max(1, Math.ceil(resultados.length / POR_PAGINA));

  useEffect(() => {
    setPagina(p => Math.min(p, totalPaginas));
  }, [totalPaginas]);

  if (!resultados.length) return null;

  const visibles = resultados.slice(
    (pagina - 1) * POR_PAGINA,
    pagina * POR_PAGINA
  );

  const exitosas = resultados.filter(r => r.ok).length;
  const fallidas = resultados.length - exitosas;
  const imprimibles = resultados.filter(
    r => r.ok && r.data?.descarga?.fileName
  ).length;

  return (
    <section className={`${CARD} p-4 md:p-5`}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-slate-900">
            Resultados de liquidaciones
          </h2>
          <div className="mt-2 flex flex-wrap gap-3 text-xs">
            <span className="flex items-center gap-1 font-semibold text-emerald-600">
              <CheckCircle2 size={14} /> {exitosas} exitosas
            </span>
            <span className="flex items-center gap-1 font-semibold text-red-600">
              <AlertCircle size={14} /> {fallidas} fallidas
            </span>
          </div>
        </div>

        {imprimibles > 0 && (
          <button type="button" onClick={imprimirTodos}
            className={`${BTN} bg-sky-50 text-[#0095C5] hover:bg-sky-100`}>
            <Printer size={15} />
            Imprimir todos
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[650px] text-sm">
          <thead className="bg-[#E9F1FA]">
            <tr>
              {["#", "Placa", "Trámites", "Estado", "Detalle", "PDF"].map(h => (
                <th key={h} className="px-3 py-3 text-left text-xs font-semibold text-slate-600">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibles.map((r, i) => (
              <tr key={`${r.placa}-${i}`}
                className="border-b border-slate-100 hover:bg-sky-50/40">
                <td className="px-3 py-3 text-xs text-slate-400">
                  {(pagina - 1) * POR_PAGINA + i + 1}
                </td>
                <td className="px-3 py-3 font-mono font-bold text-slate-900">
                  {r.placa}
                </td>
                <td className="px-3 py-3 text-xs text-slate-600">
                  {(r.tramites || [])
                    .map(t => labelTramite(t.tramite))
                    .join(", ")}
                </td>
                <td className="px-3 py-3">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${
                    r.ok
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-red-50 text-red-700"
                  }`}>
                    {r.ok ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
                    {r.ok ? "Éxito" : "Error"}
                  </span>
                </td>
                <td className="max-w-[230px] px-3 py-3 text-xs text-slate-600">
                  <span className="block truncate"
                    title={r.ok ? "Liquidación generada" : r.error || ""}>
                    {r.ok
                      ? "Liquidación generada correctamente"
                      : r.error || "Error desconocido"}
                  </span>
                </td>
                <td className="px-3 py-3">
                  {r.ok && r.data?.descarga?.fileName ? (
                    <button type="button" title="Abrir PDF"
                      onClick={() => abrirPDF(r.data.descarga.fileName)}
                      className="rounded-lg p-2 text-[#0095C5] hover:bg-sky-50">
                      <Download size={16} />
                    </button>
                  ) : (
                    <span className="text-slate-300">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Paginacion
        pagina={pagina}
        total={resultados.length}
        cambiar={setPagina}
      />

      <div className={`mt-4 flex items-start gap-2 rounded-xl border p-3 ${
        fallidas
          ? "border-amber-200 bg-amber-50"
          : "border-emerald-200 bg-emerald-50"
      }`}>
        {fallidas
          ? <AlertTriangle size={16} className="shrink-0 text-amber-600" />
          : <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />}
        <p className={`text-xs ${
          fallidas ? "text-amber-800" : "text-emerald-800"
        }`}>
          {fallidas
            ? `${fallidas} placa(s) presentaron errores. Revise los detalles antes de intentar nuevamente.`
            : `Se generaron ${exitosas} liquidaciones correctamente. Puede abrir o imprimir los PDF disponibles.`}
        </p>
      </div>
    </section>
  );
}

// ======================================================
// CONFIRMACIÓN DE GENERAR TODO
// ======================================================

async function confirmarLote(carrito, totalTramites) {
  const resumen = carrito.map(item => {
    const tramites = (item.tramites || [])
      .map(t => `${labelTramite(t.tramite)} (${t.clasificacion})`)
      .join(", ");

    return `
      <div style="display:flex;justify-content:space-between;gap:12px;
        padding:10px 12px;border-bottom:1px solid #e2e8f0;text-align:left">
        <strong style="font-size:12px;color:#0f172a;white-space:nowrap">
          ${escapeHtml(item.placa)}
        </strong>
        <span style="font-size:12px;color:#64748b;text-align:right">
          ${escapeHtml(tramites)}
        </span>
      </div>`;
  }).join("");

  const resultado = await Swal.fire({
    title: "Confirmar liquidaciones",
    icon: "info",
    html: `
      <div style="font-family:Inter,Arial,sans-serif">
        <p style="font-size:13px;color:#64748b;margin-bottom:16px">
          Verifique las placas, los trámites y sus clasificaciones
          antes de generar el lote.
        </p>

        <div style="display:grid;grid-template-columns:1fr 1fr;
          gap:10px;margin-bottom:16px">
          <div style="background:#E9F1FA;padding:14px;border-radius:12px">
            <div style="font-size:12px;color:#64748b">Placas</div>
            <strong style="font-size:24px;color:#0095C5">
              ${carrito.length}
            </strong>
          </div>
          <div style="background:#E9F1FA;padding:14px;border-radius:12px">
            <div style="font-size:12px;color:#64748b">Trámites</div>
            <strong style="font-size:24px;color:#0095C5">
              ${totalTramites}
            </strong>
          </div>
        </div>

        <div style="max-height:240px;overflow:auto;border:1px solid #e2e8f0;
          border-radius:12px">
          ${resumen}
        </div>

        <div style="margin-top:14px;padding:12px;background:#fffbeb;
          border:1px solid #fde68a;border-radius:10px;text-align:left;
          font-size:12px;color:#92400e">
          Compruebe que cada trámite y clasificación correspondan al vehículo.
          Para MEDIDAS CAUTELARES puede requerirse confirmación manual en RUNT.
        </div>
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: "Confirmar y generar",
    cancelButtonText: "Cancelar",
    confirmButtonColor: "#0095C5",
    cancelButtonColor: "#64748b",
    reverseButtons: true,
    width: 580,
    customClass: {
      popup: "rounded-2xl",
      confirmButton: "rounded-xl",
      cancelButton: "rounded-xl"
    }
  });

  return resultado.isConfirmed;
}

// ======================================================
// COMPONENTE PRINCIPAL
// ======================================================

export default function LiquidarRunt() {
  const [placaInput, setPlacaInput] = useState("");
  const [tramiteActual, setTramiteActual] = useState("");
  const [clasificacionActual, setClasificacionActual] = useState("");
  const [carrito, setCarrito] = useState([]);
  const [loading, setLoading] = useState(false);
  const [resultados, setResultados] = useState([]);
  const [progreso, setProgreso] = useState({ actual: 0, total: 0 });
  const [ultimaPlaca, setUltimaPlaca] = useState("");
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const [jobActual, setJobActual] = useState(null);
  const [alarmaActiva, setAlarmaActiva] = useState(false);

  const audioRef = useRef(null);
  const finalizadoRef = useRef(null);
  const enviandoRef = useRef(false);

  const totalTramites = carrito.reduce(
    (sum, item) => sum + item.tramites.length, 0
  );

  const ocupado = loading || Boolean(jobActual);

  // --------------------------------------------------
  // AUDIO
  // --------------------------------------------------

  useEffect(() => {
    const audio = new Audio(sonidoLiquidacion);
    audio.loop = true;
    audioRef.current = audio;

    return () => {
      audio.pause();
      audio.currentTime = 0;
      audioRef.current = null;
    };
  }, []);

  const detenerAlarma = useCallback(() => {
    setAlarmaActiva(false);
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
  }, []);

  const iniciarAlarma = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    setAlarmaActiva(true);
    audio.currentTime = 0;
    audio.play().catch(() => {
      // El navegador puede bloquear reproducción automática.
      setAlarmaActiva(false);
    });
  }, []);

  // --------------------------------------------------
  // AGREGAR PLACAS Y TRÁMITES
  // --------------------------------------------------

  const handleAgregar = () => {
    if (ocupado) return;

    const placa = placaInput.trim().toUpperCase();

    if (!placa) return toast.error("Ingrese una placa");
    if (!tramiteActual) return toast.error("Seleccione un trámite");
    if (!clasificacionActual) return toast.error("Seleccione una clasificación");

    const existente = carrito.find(item => item.placa === placa);

    // Permite añadir trámites incluso cuando hay 40 placas.
    if (existente) {
      const clasificacionExistente =
        existente.tramites[0]?.clasificacion;

      if (clasificacionExistente !== clasificacionActual) {
        return toast.error(
          "Todos los trámites de una placa deben compartir la clasificación"
        );
      }

      if (existente.tramites.some(t => t.tramite === tramiteActual)) {
        return toast.error("Este trámite ya está agregado a la placa");
      }

      setCarrito(prev => prev.map(item =>
        item.id === existente.id
          ? {
              ...item,
              tramites: [
                ...item.tramites,
                { tramite: tramiteActual, clasificacion: clasificacionActual }
              ]
            }
          : item
      ));

      setUltimaPlaca(placa);
      setTramiteActual("");
      setResultados([]);
      detenerAlarma();

      toast.success(`${labelTramite(tramiteActual)} agregado a ${placa}`);
      return;
    }

    if (carrito.length >= MAX_CARRITO) {
      return toast.error(`Máximo ${MAX_CARRITO} placas por lote`);
    }

    setCarrito(prev => [
      ...prev,
      {
        id: uuidv4(),
        placa,
        tramites: [{
          tramite: tramiteActual,
          clasificacion: clasificacionActual
        }]
      }
    ]);

    setUltimaPlaca(placa);
    setTramiteActual("");
    setResultados([]);
    detenerAlarma();
    toast.success(`${placa} agregado al carrito`);
  };

  const handleEliminarItem = id => {
    if (ocupado) return;
    setCarrito(prev => prev.filter(item => item.id !== id));
    setResultados([]);
    detenerAlarma();

    if (carrito.find(item => item.id === id)?.placa === ultimaPlaca) {
      setUltimaPlaca("");
    }
  };

  const handleEliminarTramite = (id, index) => {
    if (ocupado) return;

    setCarrito(prev => prev
      .map(item => {
        if (item.id !== id) return item;
        const tramites = item.tramites.filter((_, i) => i !== index);
        return tramites.length ? { ...item, tramites } : null;
      })
      .filter(Boolean)
    );

    setResultados([]);
    detenerAlarma();
  };

  const limpiarFormulario = () => {
    if (ocupado) return;
    setPlacaInput("");
    setTramiteActual("");
    setClasificacionActual("");
    setUltimaPlaca("");
  };

  const limpiarCarrito = () => {
    if (ocupado) return;
    setCarrito([]);
    setResultados([]);
    setAttemptedSubmit(false);
    limpiarFormulario();
    detenerAlarma();
  };

  const errores = [];
  if (carrito.length === 0) {
    errores.push("Agregue al menos una placa al carrito");
  }
  carrito.forEach(item => {
    if (!item.tramites.length) {
      errores.push(`La placa ${item.placa} no tiene trámites`);
    }
  });

  const puedeEnviar = !ocupado && errores.length === 0;

  // --------------------------------------------------
  // IMPRESIÓN
  // --------------------------------------------------

  const abrirPDF = fileName => {
    if (!fileName) return;
    const url = `${API_BASE}/descargar/${encodeURIComponent(fileName)}`;
    const ventana = window.open(url, "_blank", "noopener,noreferrer");

    if (!ventana) {
      toast.error("El navegador puede haber bloqueado la apertura del PDF");
    }
  };

  const handleImprimirTodos = () => {
    const exitosos = resultados.filter(
      r => r.ok && r.data?.descarga?.fileName
    );

    if (!exitosos.length) {
      return toast.error("No hay liquidaciones exitosas para imprimir");
    }

    detenerAlarma();

    const nombres = exitosos.map(r => r.data.descarga.fileName);
    const files = encodeURIComponent(nombres.join(","));

    // Se conserva el servicio local de impresión utilizado actualmente.
    const url =
      `http://localhost:3000/api/liquidacion/imprimir-pdfs?files=${files}`;

    const ventana = window.open(url, "_blank");

    if (ventana) {
      toast("Se solicitó la apertura de la ventana de impresión");
    } else {
      toast.error("El navegador bloqueó la ventana de impresión");
    }
  };

  // --------------------------------------------------
  // GENERAR TODO
  // --------------------------------------------------

  const handleGenerarTodo = async () => {
    if (enviandoRef.current || ocupado) return;

    setAttemptedSubmit(true);

    if (!puedeEnviar) {
      errores.forEach(e => toast.error(e));
      return;
    }

    const confirmado = await confirmarLote(carrito, totalTramites);
    if (!confirmado || enviandoRef.current) return;

    enviandoRef.current = true;

    try {
      setLoading(true);
      setResultados([]);
      detenerAlarma();
      finalizadoRef.current = null;
      setProgreso({ actual: 0, total: carrito.length });

      const items = carrito.map(item => ({
        placa: item.placa,
        tramites: item.tramites,
        fechaLiquidacion: fechaHoy()
      }));

      const resp = await crearJob("liquidaciones", items);

      const id = resp.job?.id_job || resp.jobs?.[0]?.id_job;

      if (!id) throw new Error("No se recibió el ID del trabajo");

      setJobActual(id);
      toast.success(`Trabajo creado para ${items.length} placas`);
    } catch (err) {
      toast.error(
        err.response?.data?.error ||
        err.message ||
        "Error creando el lote de liquidaciones"
      );
    } finally {
      setLoading(false);
      enviandoRef.current = false;
    }
  };

  // --------------------------------------------------
  // RESULTADOS DEL WORKER
  // --------------------------------------------------

  const procesarJobCompletado = async jobId => {
    if (finalizadoRef.current === jobId) return;
    finalizadoRef.current = jobId;

    try {
      setLoading(true);

      const detalle = await obtenerDetalleJob(jobId);
      const items = detalle.items || [];

      const nuevosResultados = items.map((item, index) => ({
        index,
        placa: item.payload?.placa || "—",
        ok: item.estado === "exitoso",
        data: item.resultado?.data || item.resultado || null,
        error: item.error || item.resultado?.error || null,
        tramites: item.payload?.tramites || []
      }));

      setResultados(nuevosResultados);
      setProgreso({ actual: items.length, total: items.length });
      setJobActual(null);

      const exitosas = nuevosResultados.filter(r => r.ok).length;
      const fallidas = nuevosResultados.length - exitosas;

      if (fallidas) {
        toast(`${exitosas} exitosas y ${fallidas} fallidas`);
      } else {
        toast.success(`${exitosas} liquidaciones generadas correctamente`);
      }

      if (nuevosResultados.length) iniciarAlarma();
    } catch (err) {
      finalizadoRef.current = null;
      console.error("Error cargando resultados:", err);
      toast.error("No fue posible cargar los resultados del trabajo");
    } finally {
      setLoading(false);
    }
  };

  const cerrarJob = () => {
    // El trabajo no se cancela en el servidor; únicamente se cierra la vista.
    setJobActual(null);
  };

  // --------------------------------------------------
  // INTERFAZ
  // --------------------------------------------------

  return (
    <div className="min-h-screen bg-[#E9F1FA]">
      <Header />

      <div className="mx-auto max-w-6xl space-y-4 px-4 pb-6 pt-2 md:px-6">
        <PageHeader
          totalPlacas={carrito.length}
          totalTramites={totalTramites}
        />

        <Formulario
          placa={placaInput}
          setPlaca={setPlacaInput}
          tramite={tramiteActual}
          setTramite={setTramiteActual}
          clasificacion={clasificacionActual}
          setClasificacion={setClasificacionActual}
          agregar={handleAgregar}
          limpiar={limpiarFormulario}
          disabled={ocupado}
        />

        <AvisoTarifas />

        {carrito.length ? (
          <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-3">
            <div className="space-y-4 lg:col-span-2">
              <Carrito
                items={carrito}
                totalTramites={totalTramites}
                eliminar={handleEliminarItem}
                eliminarTramite={handleEliminarTramite}
                limpiar={limpiarCarrito}
                disabled={ocupado}
              />

              {jobActual && (
                <JobProgress
                  jobId={jobActual}
                  onClose={cerrarJob}
                  onComplete={() => procesarJobCompletado(jobActual)}
                />
              )}

              {alarmaActiva && (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4">
                  <div className="flex items-center gap-3">
                    <Volume2 size={22} className="text-amber-600" />
                    <div>
                      <p className="text-sm font-bold text-amber-900">
                        Proceso finalizado
                      </p>
                      <p className="mt-0.5 text-xs text-amber-700">
                        Revise los resultados y los PDF disponibles.
                      </p>
                    </div>
                  </div>
                  <button type="button" onClick={detenerAlarma}
                    className={`${BTN} bg-amber-600 text-white hover:bg-amber-700`}>
                    <VolumeX size={15} />
                    Silenciar alarma
                  </button>
                </div>
              )}

              <TablaResultados
                resultados={resultados}
                abrirPDF={abrirPDF}
                imprimirTodos={handleImprimirTodos}
              />
            </div>

            <ResumenLote
              placas={carrito.length}
              tramites={totalTramites}
              loading={ocupado}
              progreso={progreso}
              generar={handleGenerarTodo}
              puedeEnviar={puedeEnviar}
              errores={errores}
              attempted={attemptedSubmit}
            />
          </div>
        ) : (
          <CarritoVacio />
        )}
      </div>
    </div>
  );
}
