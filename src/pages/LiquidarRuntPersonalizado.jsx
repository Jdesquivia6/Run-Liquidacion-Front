import { useState, useEffect, useRef } from "react";
import Header from "../components/Header";
import InputField from "../components/InputField";
import SelectField from "../components/FormSection";
import { API_BASE } from "../services/liquidacionApi";
import { crearJob, obtenerDetalleJob } from "../services/workerJobsApi";
import Swal from "sweetalert2";
import axios from "axios";
import JobProgress from "../components/JobProgress";
import Pagination from "../components/Pagination";
import { v4 as uuidv4 } from "uuid";
import {
  Loader2, FileText, CheckCircle2, AlertCircle,
  Plus, Trash2, ShoppingCart, Download, ReceiptText,
  Package, AlertTriangle, CircleCheck, Printer,
  Volume2, VolumeX, User, Hash
} from "lucide-react";
import toast from "react-hot-toast";
import sonidoLiquidacion from "../assets/sonidoLiquidacion.mp3";

const TIPOS_DOCUMENTO = [
  { value: "CÉDULA DE CIUDADANÍA", label: "Cédula de Ciudadanía" },
  { value: "CÉDULA DE EXTRANJERÍA", label: "Cédula de Extranjería" },
  { value: "NIT", label: "NIT" },
  { value: "PASAPORTE", label: "Pasaporte" },
  { value: "TARJETA DE IDENTIDAD", label: "Tarjeta de Identidad" }
];

const TRAMITES_DISPONIBLES = [
  { value: "TRÁMITE MATRÍCULA INICIAL", label: "MATRÍCULA INICIAL" },
  { value: "TRÁMITE INSCRIPCIÓN ALERTA", label: "PIGNORADO" }
];

const CLASIFICACIONES_DISPONIBLES = [
  { value: "AUTOMOVIL", label: "AUTOMOVIL" },
  { value: "MEDIDAS CAUTELARES", label: "MEDIDAS CAUTELARES" },
  { value: "MOTO", label: "MOTO" },
  { value: "MOTOCARRO", label: "MOTOCARRO" }
];

const MAX_CARRITO = 40;

function labelTramite(value) {
  return TRAMITES_DISPONIBLES.find(t => t.value === value)?.label || value;
}

function labelTipoDoc(value) {
  return TIPOS_DOCUMENTO.find(t => t.value === value)?.label || value;
}

function formatBytes(bytes) {
  if (!bytes) return "N/A";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function PageHeader({ totalItems, totalTramites }) {
  return (
    <div className="bg-gradient-to-br from-[#00ABE4] to-[#0095C5] rounded-[28px] shadow-lg shadow-[#00ABE4]/20 p-6 md:p-8 relative overflow-hidden">
      <div className="absolute right-4 bottom-3 opacity-10 select-none pointer-events-none hidden md:block">
        <ReceiptText className="w-40 h-40" />
      </div>
      <div className="absolute right-6 top-6 opacity-10 select-none pointer-events-none md:hidden">
        <ReceiptText className="w-20 h-20" />
      </div>
      <div className="relative z-10">
        <div className="flex items-center gap-1.5 mb-3">
          <FileText className="w-3.5 h-3.5 text-white/80" />
          <span className="text-xs font-medium text-white/80 uppercase tracking-wider">
            Liquidaciones Personalizadas RUNT
          </span>
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-white leading-tight">
          Liquidar valores RUNT
        </h2>
        <p className="mt-2 text-sm md:text-base text-white/80 max-w-xl leading-relaxed">
          Agregue tipo documento, número, placas, seleccione trámites y genere liquidaciones masivas con solicitante personalizado.
        </p>
        {totalItems > 0 && (
          <div className="flex items-center gap-2 mt-4 flex-wrap">
            <span className="bg-white/20 backdrop-blur text-white text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5">
              <ShoppingCart size={12} />
              {totalItems} item{totalItems !== 1 ? "s" : ""}
            </span>
            <span className="bg-white/20 backdrop-blur text-white text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5">
              <FileText size={12} />
              {totalTramites} trámite{totalTramites !== 1 ? "s" : ""}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function AlertBanner({ message }) {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-2">
      <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
      <p className="text-xs text-amber-700 leading-relaxed">{message}</p>
    </div>
  );
}

function HelpText({ children }) {
  return (
    <div className="mt-3 px-3 py-2.5 bg-slate-100 border border-slate-200 rounded-xl">
      <p className="text-xs text-[#64748b] leading-relaxed">{children}</p>
    </div>
  );
}

function AddPlateCard({
  tipoDocInput, setTipoDocInput,
  numDocInput, setNumDocInput,
  placaInput, setPlacaInput,
  tramiteActual, setTramiteActual,
  clasificacionActual, setClasificacionActual,
  onAgregar,
  onBorrarCampos,
  disabled
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <div className="mb-1">
        <h3 className="text-sm font-semibold text-[#1e293b]">
          Agregar liquidación personalizada
        </h3>
        <p className="text-xs text-[#64748b] mt-0.5">
          Seleccione tipo documento, ingrese número, placa, trámite y clasificación.
        </p>
      </div>

      <div className="space-y-4 mt-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SelectField
            label="Tipo documento *"
            name="tipoDocInput"
            value={tipoDocInput}
            onChange={(e) => setTipoDocInput(e.target.value)}
            options={TIPOS_DOCUMENTO}
          />

          <InputField
            label="Número documento *"
            name="numDocInput"
            value={numDocInput}
            onChange={(e) => setNumDocInput(e.target.value)}
            placeholder="Ej: 1234567890"
          />

          <InputField
            label="Placa *"
            name="placaInput"
            value={placaInput}
            onChange={(e) => setPlacaInput(e.target.value)}
            placeholder="Ej: ABC123"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SelectField
            label="Trámite *"
            name="tramiteActual"
            value={tramiteActual}
            onChange={(e) => setTramiteActual(e.target.value)}
            options={TRAMITES_DISPONIBLES}
          />

          <SelectField
            label="Clasificación *"
            name="clasificacionActual"
            value={clasificacionActual}
            onChange={(e) => setClasificacionActual(e.target.value)}
            options={CLASIFICACIONES_DISPONIBLES}
          />

          <div className="flex items-end gap-2">
            <button
              onClick={onAgregar}
              disabled={disabled}
              className="flex-1 bg-[#00ABE4] hover:bg-[#0095C5] text-white px-4 py-3.5 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 text-sm font-medium active:scale-95 disabled:bg-slate-300 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" />
              Agregar
            </button>
            <button
              type="button"
              onClick={onBorrarCampos}
              className="px-4 py-3.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 text-sm font-medium active:scale-95"
              title="Borrar campos"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <HelpText>
        💡 Una liquidación se identifica por tipo doc + número doc + placa.
        Para agregar varios trámites a una misma combinación, no cambie los campos de documento ni placa entre cada "Agregar".
      </HelpText>
    </div>
  );
}

function CartTable({ items, totalTramites, onEliminarItem, onEliminarTramite, onLimpiarTodo }) {
  if (items.length === 0) return null;

  const [page, setPage] = useState(1);
  const itemsPerPage = 15;
  const totalPages = Math.ceil(items.length / itemsPerPage);
  useEffect(() => { if (page > totalPages) setPage(1); }, [items.length]);
  const paginatedItems = items.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-[#1e293b] flex items-center gap-2">
          <ShoppingCart className="w-4 h-4 text-[#00ABE4]" />
          Carrito de liquidaciones
          <span className="text-xs text-[#64748b] font-normal">
            · {items.length} item{items.length !== 1 ? "s" : ""} · {totalTramites} trámite{totalTramites !== 1 ? "s" : ""}
          </span>
        </h3>
        <button
          onClick={onLimpiarTodo}
          className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-all"
        >
          Limpiar todo
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="py-2.5 px-3 text-left text-xs font-semibold text-[#94a3b8]">#</th>
              <th className="py-2.5 px-3 text-left text-xs font-semibold text-[#94a3b8]">Documento</th>
              <th className="py-2.5 px-3 text-left text-xs font-semibold text-[#94a3b8]">Número</th>
              <th className="py-2.5 px-3 text-left text-xs font-semibold text-[#94a3b8]">Placa</th>
              <th className="py-2.5 px-3 text-left text-xs font-semibold text-[#94a3b8]">Trámites</th>
              <th className="py-2.5 px-3 text-left text-xs font-semibold text-[#94a3b8]">Clasificación</th>
              <th className="py-2.5 px-3 text-center text-xs font-semibold text-[#94a3b8]">Acción</th>
            </tr>
          </thead>
          <tbody>
            {paginatedItems.map((item, i) => (
              <tr
                key={item.id}
                className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors"
              >
                <td className="py-3 px-3 text-[#94a3b8] text-xs">{(page - 1) * itemsPerPage + i + 1}</td>
                <td className="py-3 px-3">
                  <span className="text-xs text-[#64748b]">{labelTipoDoc(item.tipoDocumento)}</span>
                </td>
                <td className="py-3 px-3">
                  <span className="font-mono font-bold text-[#1e293b] text-sm">{item.numeroDocumento}</span>
                </td>
                <td className="py-3 px-3">
                  <span className="font-mono font-bold text-[#1e293b] text-sm">{item.placa}</span>
                </td>
                <td className="py-3 px-3">
                  <div className="flex flex-wrap gap-1.5">
                    {item.tramites.map((t, ti) => (
                      <span
                        key={ti}
                        className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-full"
                      >
                        {labelTramite(t.tramite)}
                        <button
                          onClick={() => onEliminarTramite(item.id, ti)}
                          className="hover:text-red-500 transition-colors font-bold ml-0.5"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </td>
                <td className="py-3 px-3">
                  <span className="text-xs text-[#64748b]">
                    {item.tramites[0]?.clasificacion || "—"}
                  </span>
                </td>
                <td className="py-3 px-3 text-center">
                  <button
                    onClick={() => onEliminarItem(item.id)}
                    className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                    title="Eliminar item"
                  >
                    <Trash2 size={15} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination currentPage={page} totalItems={items.length} onPageChange={setPage} />
    </div>
  );
}

function EmptyCart() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 md:p-12 text-center">
      <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
        <ShoppingCart className="w-8 h-8 text-slate-300" />
      </div>
      <h3 className="text-base font-bold text-[#1e293b] mb-1">Carrito vacío</h3>
      <p className="text-sm text-[#64748b] max-w-sm mx-auto leading-relaxed">
        Agregue tipo documento, número, placas y trámites para generar liquidaciones RUNT personalizadas en lote.
        Máximo {MAX_CARRITO} items por generación.
      </p>
    </div>
  );
}

function BatchSummary({
  totalItems,
  totalTramites,
  loading,
  progreso,
  onGenerar,
  puedeEnviar,
  attemptedSubmit,
  errores
}) {
  const porcentaje = Math.min((totalItems / MAX_CARRITO) * 100, 100);
  const estado = loading ? "Procesando" : totalItems === 0 ? "Sin datos" : "Listo para generar";

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <h3 className="text-sm font-semibold text-[#1e293b] mb-4 flex items-center gap-2">
        <Package className="w-4 h-4 text-[#00ABE4]" />
        Resumen del lote
      </h3>

      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-[#64748b]">Total items</span>
          <span className="font-semibold text-[#1e293b]">{totalItems}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-[#64748b]">Total trámites</span>
          <span className="font-semibold text-[#1e293b]">{totalTramites}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-[#64748b]">Máximo permitido</span>
          <span className="font-medium text-[#64748b]">{MAX_CARRITO} items</span>
        </div>

        <div className="pt-1">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-[#94a3b8]">Uso del lote</span>
            <span className="text-[#64748b] font-medium">{totalItems}/{MAX_CARRITO}</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-[#00ABE4] to-[#0095C5]"
              style={{ width: `${porcentaje}%` }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between text-xs pt-1">
          <span className="text-[#64748b]">Estado</span>
          <span className={`font-medium ${loading ? "text-amber-600" : totalItems === 0 ? "text-[#94a3b8]" : "text-emerald-600"}`}>
            {estado}
          </span>
        </div>
      </div>

      {loading && (
        <div className="mt-4 pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-[#64748b] font-medium">Procesando</span>
            <span className="text-[#00ABE4] font-semibold">{progreso.actual} / {progreso.total}</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-[#00ABE4] transition-all duration-300"
              style={{ width: `${progreso.total > 0 ? (progreso.actual / progreso.total) * 100 : 0}%` }}
            />
          </div>
        </div>
      )}

      {attemptedSubmit && errores.length > 0 && (
        <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-xl">
          <div className="flex items-start gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-red-600 space-y-0.5">
              {errores.map((e, i) => (
                <p key={i}>{e}</p>
              ))}
            </div>
          </div>
        </div>
      )}

      <button
        onClick={onGenerar}
        disabled={!puedeEnviar || totalItems === 0}
        className="mt-5 w-full bg-[#00ABE4] hover:bg-[#0095C5] text-white px-4 py-3.5 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 text-sm font-semibold active:scale-95 disabled:bg-slate-300 disabled:cursor-not-allowed disabled:hover:scale-100"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Procesando...
          </>
        ) : (
          <>
            <FileText className="w-4 h-4" />
            Generar Todo
          </>
        )}
      </button>

      {totalItems > 0 && !loading && (
        <p className="text-xs text-[#94a3b8] text-center mt-2.5">
          Se generarán todas las liquidaciones agregadas al carrito.
        </p>
      )}
    </div>
  );
}

function ResultsTable({ resultados, onAbrirPDF, onImprimirTodos }) {
  if (resultados.length === 0) return null;

  const [page, setPage] = useState(1);
  const itemsPerPage = 15;
  const totalPages = Math.ceil(resultados.length / itemsPerPage);
  useEffect(() => { if (page > totalPages) setPage(1); }, [resultados.length]);
  const paginatedItems = resultados.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const exitosas = resultados.filter(r => r.ok).length;
  const fallidas = resultados.filter(r => !r.ok).length;
  const todasExitosas = fallidas === 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-[#1e293b]">Resultados</h3>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1 text-emerald-600 font-medium">
              <CircleCheck size={14} />
              {exitosas} exitosa{exitosas !== 1 ? "s" : ""}
            </span>
            <span className="flex items-center gap-1 text-red-500 font-medium">
              <AlertCircle size={14} />
              {fallidas} fallida{fallidas !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        {exitosas > 0 && (
          <button
            onClick={onImprimirTodos}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#00ABE4]/10 hover:bg-[#00ABE4]/20 text-[#00ABE4] rounded-lg text-xs font-semibold transition-all duration-200"
            title="Imprimir todos los PDFs"
          >
            <Printer size={14} />
            <span>Imprimir todos</span>
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="py-2.5 px-3 text-left text-xs font-semibold text-[#94a3b8]">#</th>
              <th className="py-2.5 px-3 text-left text-xs font-semibold text-[#94a3b8]">Documento</th>
              <th className="py-2.5 px-3 text-left text-xs font-semibold text-[#94a3b8]">Número</th>
              <th className="py-2.5 px-3 text-left text-xs font-semibold text-[#94a3b8]">Nombre</th>
              <th className="py-2.5 px-3 text-left text-xs font-semibold text-[#94a3b8]">Placa</th>
              <th className="py-2.5 px-3 text-center text-xs font-semibold text-[#94a3b8]">Estado</th>
              <th className="py-2.5 px-3 text-left text-xs font-semibold text-[#94a3b8]">Detalle</th>
              <th className="py-2.5 px-3 text-center text-xs font-semibold text-[#94a3b8]">PDF</th>
            </tr>
          </thead>
          <tbody>
            {paginatedItems.map((r, i) => (
              <tr
                key={i}
                className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors"
              >
                <td className="py-3 px-3 text-[#94a3b8] text-xs">{(page - 1) * itemsPerPage + i + 1}</td>
                <td className="py-3 px-3 text-xs text-[#64748b]">
                  {r.tipoDocumento ? labelTipoDoc(r.tipoDocumento) : "—"}
                </td>
                <td className="py-3 px-3">
                  <span className="font-mono font-bold text-[#1e293b] text-sm">{r.numeroDocumento || "—"}</span>
                </td>
                <td className="py-3 px-3 text-xs text-[#64748b] max-w-[150px] truncate">
                  {r.nombreSolicitante || "—"}
                </td>
                <td className="py-3 px-3">
                  <span className="font-mono font-bold text-[#1e293b] text-sm">{r.placa}</span>
                </td>
                <td className="py-3 px-3 text-center">
                  {r.ok ? (
                    <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-xs px-2.5 py-1 rounded-full font-medium">
                      <CheckCircle2 size={11} />
                      Éxito
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 bg-red-50 text-red-700 text-xs px-2.5 py-1 rounded-full font-medium">
                      <AlertCircle size={11} />
                      Error
                    </span>
                  )}
                </td>
                <td className="py-3 px-3 text-xs text-[#64748b] max-w-[180px] truncate">
                  {r.ok ? "Liquidación generada correctamente" : (r.error || "Error desconocido")}
                </td>
                <td className="py-3 px-3 text-center">
                  {r.ok && r.data?.descarga?.fileName ? (
                    <button
                      onClick={() => onAbrirPDF(r.data.descarga.fileName)}
                      className="p-1.5 text-[#00ABE4] hover:bg-blue-50 rounded-lg transition-all"
                      title="Abrir PDF"
                    >
                      <Download size={15} />
                    </button>
                  ) : (
                    <span className="text-[#cbd5e1]">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination currentPage={page} totalItems={resultados.length} onPageChange={setPage} />

      <div className="mt-4 p-3.5 bg-blue-50 border border-blue-100 rounded-xl">
        <p className="text-xs text-blue-700 leading-relaxed">
          {todasExitosas
            ? "✅ Todas las liquidaciones se generaron correctamente. Los PDFs se abrieron en nuevas pestañas."
            : `⚠️ ${fallidas} item(s) fallaron. Revise los errores e intente de nuevo.`}
        </p>
      </div>
    </div>
  );
}

export default function LiquidarRuntPersonalizado() {
  const [tipoDocInput, setTipoDocInput] = useState("");
  const [numDocInput, setNumDocInput] = useState("");
  const [placaInput, setPlacaInput] = useState("");
  const [tramiteActual, setTramiteActual] = useState("");
  const [clasificacionActual, setClasificacionActual] = useState("");
  const [carrito, setCarrito] = useState([]);
  const [loading, setLoading] = useState(false);
  const [resultados, setResultados] = useState([]);
  const [progreso, setProgreso] = useState({ actual: 0, total: 0 });
  const [ultimoKey, setUltimoKey] = useState("");
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const [jobActual, setJobActual] = useState(null);
  const [alarmaActiva, setAlarmaActiva] = useState(false);

  const audioRef = useRef(new Audio(sonidoLiquidacion));
  audioRef.current.loop = true;

  const totalTramites = carrito.reduce((sum, item) => sum + item.tramites.length, 0);

  const iniciarAlarma = () => {
    setAlarmaActiva(true);
    audioRef.current.currentTime = 0;
    audioRef.current.play().catch(err => {
      console.warn("No se pudo reproducir la alarma:", err);
    });
  };

  const detenerAlarma = () => {
    setAlarmaActiva(false);
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
  };

  useEffect(() => {
    const hayResultados = resultados.length > 0;
    const terminado = !loading && !jobActual && hayResultados;

    if (terminado) {
      iniciarAlarma();
    } else {
      detenerAlarma();
    }
  }, [loading, jobActual, resultados.length]);

  const generarKey = (tipoDoc, numDoc, placa) => `${tipoDoc}|${numDoc}|${placa}`;

  const handleAgregarAlCarrito = () => {
    if (!tipoDocInput.trim()) {
      toast.error("Seleccione un tipo de documento");
      return;
    }
    if (!numDocInput.trim()) {
      toast.error("Ingrese el número de documento");
      return;
    }
    if (!placaInput.trim()) {
      toast.error("Ingrese una placa");
      return;
    }
    if (!tramiteActual.trim()) {
      toast.error("Seleccione un trámite");
      return;
    }
    if (!clasificacionActual.trim()) {
      toast.error("Seleccione una clasificación");
      return;
    }

    const placaUpper = placaInput.trim().toUpperCase();
    const numDocTrim = numDocInput.trim();
    const currentKey = generarKey(tipoDocInput, numDocTrim, placaUpper);

    if (carrito.length >= MAX_CARRITO) {
      toast.error(`Máximo ${MAX_CARRITO} items en el carrito`);
      return;
    }

    if (currentKey === ultimoKey && carrito.length > 0) {
      const ultimoItem = carrito[carrito.length - 1];

      if (ultimoItem.tramites.length > 0 && ultimoItem.tramites[0].clasificacion !== clasificacionActual) {
        toast.error("Todos los trámites de un item deben compartir la misma clasificación (flujo RUNT)");
        return;
      }

      const yaExiste = ultimoItem.tramites.some(t => t.tramite === tramiteActual);
      if (yaExiste) {
        toast.error("Ese trámite ya está agregado para este item");
        return;
      }

      setCarrito(prev => {
        const nuevo = [...prev];
        nuevo[nuevo.length - 1] = {
          ...ultimoItem,
          tramites: [...ultimoItem.tramites, { tramite: tramiteActual, clasificacion: clasificacionActual }]
        };
        return nuevo;
      });

      toast.success(`${labelTramite(tramiteActual)} agregado al item`);
      setTramiteActual("");
      return;
    }

    const existe = carrito.some(item =>
      item.tipoDocumento === tipoDocInput &&
      item.numeroDocumento === numDocTrim &&
      item.placa === placaUpper
    );
    if (existe) {
      toast.error("Esa combinación de documento + placa ya está en el carrito. Para agregar más trámites, use los mismos campos.");
      return;
    }

    setCarrito(prev => [...prev, {
      id: uuidv4(),
      tipoDocumento: tipoDocInput,
      numeroDocumento: numDocTrim,
      placa: placaUpper,
      tramites: [{ tramite: tramiteActual, clasificacion: clasificacionActual }]
    }]);
    setUltimoKey(currentKey);
    setTramiteActual("");
    toast.success(`Item agregado al carrito`);
  };

  const handleEliminarItem = (id) => {
    setCarrito(prev => prev.filter(item => item.id !== id));
    if (ultimoKey === carrito.find(i => i.id === id)?.id) {
      setUltimoKey("");
    }
  };

  const handleLimpiarFormulario = () => {
    setTipoDocInput("");
    setNumDocInput("");
    setPlacaInput("");
    setTramiteActual("");
    setClasificacionActual("");
    setUltimoKey("");
    detenerAlarma();
  };

  const handleLimpiarCarrito = () => {
    setCarrito([]);
    setResultados([]);
    setAttemptedSubmit(false);
    handleLimpiarFormulario();
  };

  const handleEliminarTramiteItem = (itemId, tramiteIndex) => {
    setCarrito(prev => prev.map(item => {
      if (item.id !== itemId) return item;
      const nuevosTramites = item.tramites.filter((_, i) => i !== tramiteIndex);
      if (nuevosTramites.length === 0) return null;
      return { ...item, tramites: nuevosTramites };
    }).filter(Boolean));
  };

  const obtenerErrores = () => {
    const errores = [];
    if (carrito.length === 0) errores.push("Agregue al menos un item al carrito");
    for (const item of carrito) {
      if (!item.tipoDocumento) errores.push(`Item tiene tipo de documento vacío`);
      if (!item.numeroDocumento) errores.push(`Item tiene número de documento vacío`);
      if (item.tramites.length === 0) errores.push(`Item sin trámites`);
    }
    return errores;
  };

  const errores = obtenerErrores();
  const puedeEnviar = errores.length === 0 && !loading;

  const abrirPDF = (fileName) => {
    const url = `${API_BASE}/descargar/${fileName}`;
    window.open(url, "_blank");
  };

  const handleImprimirTodos = () => {
    const exitosos = resultados.filter(r => r.ok && r.data?.descarga?.fileName);
    if (exitosos.length === 0) {
      toast.error("No hay liquidaciones exitosas para imprimir");
      return;
    }

    detenerAlarma();

    const fileNames = exitosos.map(r => r.data.descarga.fileName);
    const filesParam = encodeURIComponent(fileNames.join(','));
    const url = `http://localhost:3000/api/liquidacion/imprimir-pdfs?files=${filesParam}`;

    window.open(url, "_blank");
    toast.info("Se abrió la ventana de impresión local");
  };

  const handleGenerarTodo = async () => {
    setAttemptedSubmit(true);
    if (!puedeEnviar) {
      errores.forEach(e => toast.error(e));
      return;
    }

    const { isConfirmed } = await Swal.fire({
      title: "¿Confirmar envío?",
      html: `Revise su liquidacion (Numero de documento y Placa). Debe estar inscrito en el RUNT.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, enviar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#d33",
    });
    if (!isConfirmed) return;

    try {
      setLoading(true);
      setResultados([]);
      setProgreso({ actual: 0, total: carrito.length });

      const items = carrito.map(item => ({
        tipoDocumento: item.tipoDocumento,
        numeroDocumento: item.numeroDocumento,
        placa: item.placa,
        tramites: item.tramites,
        fechaLiquidacion: new Date().toISOString().split("T")[0]
      }));

      const resp = await crearJob("liquidaciones_personalizadas", items);

      if (resp.job?.id_job) {
        setJobActual(resp.job.id_job);
        toast.success(`Trabajo creado con ${items.length} liquidación(es)`);
      } else if (resp.jobs?.length > 0) {
        setJobActual(resp.jobs[0].id_job);
        toast.success(`Trabajo creado con ${items.length} liquidación(es)`);
      } else {
        throw new Error("No se recibió ID del trabajo");
      }
    } catch (err) {
      const mensaje = err.response?.data?.error || err.message || "Error de conexión";
      toast.error(mensaje);
    } finally {
      setLoading(false);
    }
  };

  const procesarJobCompletado = async (jobId) => {
    try {
      const detalle = await obtenerDetalleJob(jobId);
      const items = detalle.items || [];

      const resultadosArr = items.map((item, index) => ({
        index,
        tipoDocumento: item.payload?.tipoDocumento || "—",
        numeroDocumento: item.payload?.numeroDocumento || "—",
        nombreSolicitante: item.resultado?.data?.nombreSolicitante || item.resultado?.nombreSolicitante || null,
        placa: item.payload?.placa || "—",
        ok: item.estado === "exitoso",
        data: item.resultado?.data || item.resultado || null,
        error: item.error || item.resultado?.error || null,
        tramites: item.payload?.tramites || []
      }));

      setResultados(resultadosArr);
      setProgreso({ actual: items.length, total: items.length });

      const exitosos = resultadosArr.filter(r => r.ok);
      const fallidos = resultadosArr.filter(r => !r.ok);

      if (fallidos.length === 0) {
        toast.success(`${exitosos.length} liquidación(es) generada(s) exitosamente`);
      } else {
        toast.success(`${exitosos.length} exitosas, ${fallidos.length} fallidas`);
      }
    } catch (err) {
      toast.error("Error cargando resultados del trabajo");
      console.error(err);
    } finally {
      setJobActual(null);
      setLoading(false);
      setProgreso({ actual: 0, total: 0 });
    }
  };

  const tieneItems = carrito.length > 0;
  const TARIFA_ALERT = (
    "Tarifa automática: Se selecciona según trámite + clasificación. "
    + "Para MEDIDAS CAUTELARES se mostrará un popup en el RUNT que debe aceptar manualmente. "
    + `Máximo ${MAX_CARRITO} items por lote.`
  );

  return (
    <div className="min-h-screen bg-[#E9F1FA]">
      <Header />

      <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-4 md:space-y-5">

        <PageHeader totalItems={carrito.length} totalTramites={totalTramites} />

        {tieneItems && <AlertBanner message={TARIFA_ALERT} />}

        <AddPlateCard
          tipoDocInput={tipoDocInput}
          setTipoDocInput={setTipoDocInput}
          numDocInput={numDocInput}
          setNumDocInput={setNumDocInput}
          placaInput={placaInput}
          setPlacaInput={setPlacaInput}
          tramiteActual={tramiteActual}
          setTramiteActual={setTramiteActual}
          clasificacionActual={clasificacionActual}
          setClasificacionActual={setClasificacionActual}
          onAgregar={handleAgregarAlCarrito}
          onBorrarCampos={handleLimpiarFormulario}
          disabled={carrito.length >= MAX_CARRITO || loading}
        />

        {tieneItems ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-5">
            <div className="lg:col-span-2 space-y-4 md:space-y-5">
              <CartTable
                items={carrito}
                totalTramites={totalTramites}
                onEliminarItem={handleEliminarItem}
                onEliminarTramite={handleEliminarTramiteItem}
                onLimpiarTodo={handleLimpiarCarrito}
              />

              {jobActual && (
                <JobProgress
                  jobId={jobActual}
                  onClose={() => setJobActual(null)}
                  onComplete={() => procesarJobCompletado(jobActual)}
                />
              )}

              {alarmaActiva && (
                <div className="bg-amber-100 border-2 border-amber-400 rounded-2xl p-4 flex items-center justify-between animate-pulse">
                  <div className="flex items-center gap-3">
                    <Volume2 className="w-6 h-6 text-amber-600" />
                    <div>
                      <p className="text-sm font-bold text-amber-800">¡Proceso finalizado!</p>
                      <p className="text-xs text-amber-700">Las liquidaciones están listas para imprimir.</p>
                    </div>
                  </div>
                  <button
                    onClick={detenerAlarma}
                    className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold transition-all"
                  >
                    <VolumeX size={14} />
                    Silenciar alarma
                  </button>
                </div>
              )}

              <ResultsTable
                resultados={resultados}
                onAbrirPDF={abrirPDF}
                onImprimirTodos={handleImprimirTodos}
              />
            </div>

            <div className="space-y-4 md:space-y-5">
              <BatchSummary
                totalItems={carrito.length}
                totalTramites={totalTramites}
                loading={loading}
                progreso={progreso}
                onGenerar={handleGenerarTodo}
                puedeEnviar={puedeEnviar}
                attemptedSubmit={attemptedSubmit}
                errores={errores}
              />

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <AlertBanner message={TARIFA_ALERT} />
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4 md:space-y-5">
            <EmptyCart />
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <AlertBanner message={TARIFA_ALERT} />
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
