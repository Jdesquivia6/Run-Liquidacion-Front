import { useState } from "react";
import Header from "../components/Header";
import InputField from "../components/InputField";
import SelectField from "../components/FormSection";
import { consultarLiquidacionBatchSecuencial, consultarLiquidacionBatch, API_BASE } from "../services/liquidacionApi";
import { v4 as uuidv4 } from "uuid";
import {
  Loader2, FileText, CheckCircle2, AlertCircle,
  Plus, Trash2, ShoppingCart, Download
} from "lucide-react";
import toast from "react-hot-toast";

// ─────────────────────────────────────────────
// CONFIGURACIÓN
// ─────────────────────────────────────────────

const TRAMITES_DISPONIBLES = [
  { value: "TRÁMITE MATRÍCULA INICIAL", label: "MATRÍCULA INICIAL" },
  { value: "TRÁMITE INSCRIPCIÓN ALERTA", label: "INSCRIPCIÓN ALERTA" }
];

const CLASIFICACIONES_DISPONIBLES = [
  { value: "AUTOMOVIL", label: "AUTOMOVIL" },
  { value: "MEDIDAS CAUTELARES", label: "MEDIDAS CAUTELARES" },
  { value: "MOTO", label: "MOTO" },
  { value: "MOTOCARRO", label: "MOTOCARRO" }
];

const MAX_CARRITO = 50;

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

function formatBytes(bytes) {
  if (!bytes) return "N/A";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function labelTramite(value) {
  return TRAMITES_DISPONIBLES.find(t => t.value === value)?.label || value;
}

// ─────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────

export default function LiquidarRunt() {
  // ── Estado del formulario ──
  const [placaInput, setPlacaInput] = useState("");
  const [tramiteActual, setTramiteActual] = useState("");
  const [clasificacionActual, setClasificacionActual] = useState("");

  // ── Carrito: [{ id, placa, tramites: [{tramite, clasificacion}] }] ──
  const [carrito, setCarrito] = useState([]);

  // ── Estados de UI ──
  const [loading, setLoading] = useState(false);
  const [resultados, setResultados] = useState([]); // Array de resultados batch
  const [progreso, setProgreso] = useState({ actual: 0, total: 0 });

  // ── Ref para saber la última placa agregada ──
  const [ultimaPlaca, setUltimaPlaca] = useState("");

  // ── Agregar trámite al carrito ──
  const handleAgregarAlCarrito = () => {
    // Validaciones
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

    // Limite de carrito
    if (carrito.length >= MAX_CARRITO) {
      toast.error(`Máximo ${MAX_CARRITO} placas en el carrito`);
      return;
    }

    // Si es la misma placa que la última, agregar trámite al item existente
    if (placaUpper === ultimaPlaca && carrito.length > 0) {
      const ultimoItem = carrito[carrito.length - 1];

      // Validar misma clasificación (flujo RUNT)
      if (ultimoItem.tramites.length > 0 && ultimoItem.tramites[0].clasificacion !== clasificacionActual) {
        toast.error("Todos los trámites de una placa deben compartir la misma clasificación (flujo RUNT)");
        return;
      }

      // Validar duplicado
      const yaExiste = ultimoItem.tramites.some(t => t.tramite === tramiteActual);
      if (yaExiste) {
        toast.error("Ese trámite ya está agregado para esta placa");
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

      toast.success(`${labelTramite(tramiteActual)} agregado a ${placaUpper}`);
      setTramiteActual("");
      return;
    }

    // Placa diferente → nuevo item en el carrito
    // Verificar si la placa ya existe en el carrito
    const existe = carrito.some(item => item.placa === placaUpper);
    if (existe) {
      toast.error(`La placa ${placaUpper} ya está en el carrito. Para agregar más trámites, seleccione la misma placa sin cambiar.`);
      return;
    }

    setCarrito(prev => [...prev, {
      id: uuidv4(),
      placa: placaUpper,
      tramites: [{ tramite: tramiteActual, clasificacion: clasificacionActual }]
    }]);
    setUltimaPlaca(placaUpper);
    setTramiteActual("");
    toast.success(`${placaUpper} → ${labelTramite(tramiteActual)} agregado al carrito`);
  };

  // ── Eliminar item del carrito ──
  const handleEliminarItem = (id) => {
    setCarrito(prev => prev.filter(item => item.id !== id));
    if (ultimaPlaca === carrito.find(i => i.id === id)?.placa) {
      setUltimaPlaca("");
    }
  };

  // ── Limpiar todo el carrito ──
  const handleLimpiarCarrito = () => {
    setCarrito([]);
    setUltimaPlaca("");
    setResultados([]);
  };

  // ── Eliminar un trámite específico de un item ──
  const handleEliminarTramiteItem = (itemId, tramiteIndex) => {
    setCarrito(prev => prev.map(item => {
      if (item.id !== itemId) return item;
      const nuevosTramites = item.tramites.filter((_, i) => i !== tramiteIndex);
      if (nuevosTramites.length === 0) return null; // marcar para eliminar
      return { ...item, tramites: nuevosTramites };
    }).filter(Boolean));
  };

  // ── Validación del carrito ──
  const obtenerErrores = () => {
    const errores = [];
    if (carrito.length === 0) errores.push("Agregue al menos una placa al carrito");
    for (const item of carrito) {
      if (item.tramites.length === 0) errores.push(`La placa ${item.placa} no tiene trámites`);
    }
    return errores;
  };

  const errores = obtenerErrores();
  const puedeEnviar = errores.length === 0 && !loading;
  const totalTramites = carrito.reduce((sum, item) => sum + item.tramites.length, 0);

  // ── Generar Todo (secuencial: una placa a la vez con progreso en vivo) ──
  const handleGenerarTodo = async () => {
    if (!puedeEnviar) {
      errores.forEach(e => toast.error(e));
      return;
    }

    try {
      setLoading(true);
      setResultados([]);
      setProgreso({ actual: 0, total: carrito.length });

      const items = carrito.map(item => ({
        placa: item.placa,
        tramites: item.tramites,
        fechaLiquidacion: new Date().toISOString().split('T')[0]
      }));

      const resultadosArr = [];

      await consultarLiquidacionBatchSecuencial(items, {
        onResult: (data) => {
          const row = {
            index: data.index,
            placa: data.placa || '—',
            ok: data.ok || false,
            data: data.data || null,
            error: data.error || null,
            tramites: data.tramites || []
          };

          resultadosArr.push(row);
          setResultados([...resultadosArr]);
          setProgreso(prev => ({ ...prev, actual: resultadosArr.length }));

          // Abrir PDF ni bien sale
          if (row.ok && row.data?.descarga?.fileName) {
            abrirPDF(row.data.descarga.fileName);
          }
        },

        onComplete: (data) => {
          setProgreso({ actual: data.total, total: data.total });

          if (data.fallidos === 0) {
            toast.success(`${data.exitosos} liquidación(es) generada(s) exitosamente`);
          } else {
            toast.success(`${data.exitosos} exitosas, ${data.fallidos} fallidas`);
          }
        }
      });

    } catch (err) {
      const mensaje = err.response?.data?.error || err.message || "Error de conexión";
      toast.error(mensaje);
    } finally {
      setLoading(false);
      setProgreso({ actual: 0, total: 0 });
    }
  };

  const abrirPDF = (fileName) => {
    const url = `${API_BASE}/descargar/${fileName}`;
    window.open(url, '_blank');
  };

  // ── Contar tramites por placa para el resumen ──
  const resumenTramites = (tramites) => {
    return tramites.map(t => labelTramite(t.tramite)).join(', ');
  };

  // ── Render ──
  return (
    <div className="min-h-screen bg-[#E9F1FA]">
      <Header />

      <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-5 md:space-y-6">

        {/* ── TÍTULO ── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 md:p-6 animate-slide-up">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg md:text-xl font-bold text-[#1e293b]">
              Liquidaciones RUNT — Carga Masiva
            </h2>
            {carrito.length > 0 && (
              <span className="bg-[#00ABE4] text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1">
                <ShoppingCart size={14} />
                {carrito.length} placa(s)
              </span>
            )}
          </div>

          {/* Badge RNA */}
          <div className="mb-4 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-500 flex-shrink-0" />
            <span className="text-sm md:text-base text-blue-700 font-medium">
              Registro RNA — todas los trámites de una misma placa comparten clasificación
            </span>
          </div>

          {/* ── Agregar al carrito ── */}
          <div className="p-4 md:p-5 bg-[#F8FAFC] border border-slate-200 rounded-xl">
            <h3 className="text-sm md:text-base font-semibold text-[#1e293b] mb-3">
              Agregar placa y trámite
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-4">
              <InputField
                label="Placa *"
                name="placaInput"
                value={placaInput}
                onChange={(e) => {
                  setPlacaInput(e.target.value);
                  if (e.target.value.toUpperCase() !== ultimaPlaca) {
                    setUltimaPlaca("");
                  }
                }}
                placeholder="Ej: ABC123"
              />

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

              <div className="flex items-end">
                <button
                  onClick={handleAgregarAlCarrito}
                  disabled={carrito.length >= MAX_CARRITO}
                  className="w-full bg-[#00ABE4] hover:bg-[#0095C5] text-white px-4 py-3.5 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 text-sm md:text-base font-medium active:scale-95 disabled:bg-slate-300 disabled:cursor-not-allowed"
                >
                  <Plus className="w-5 h-5" />
                  Agregar
                </button>
              </div>
            </div>

            {/* Ayuda: cómo agregar más trámites a la misma placa */}
            <p className="text-xs text-[#64748b] mt-2">
              💡 Para agregar varios trámites a una misma placa, no cambie el campo de placa entre cada "Agregar".
              Para una placa nueva, simplemente escriba otra placa y agregue.
            </p>
          </div>
        </div>

        {/* ── CARRITO ── */}
        {carrito.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 md:p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base md:text-lg font-bold text-[#1e293b] flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-[#00ABE4]" />
                Carrito ({carrito.length} placa{carrito.length !== 1 ? 's' : ''} · {totalTramites} trámite{totalTramites !== 1 ? 's' : ''})
              </h3>
              <button
                onClick={handleLimpiarCarrito}
                className="text-sm text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-all"
              >
                Limpiar todo
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="py-3 px-3 text-left font-semibold text-[#64748b]">#</th>
                    <th className="py-3 px-3 text-left font-semibold text-[#64748b]">Placa</th>
                    <th className="py-3 px-3 text-left font-semibold text-[#64748b]">Trámites</th>
                    <th className="py-3 px-3 text-left font-semibold text-[#64748b]">Clasificación</th>
                    <th className="py-3 px-3 text-center font-semibold text-[#64748b]">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {carrito.map((item, i) => (
                    <tr key={item.id} className="border-b border-slate-100 hover:bg-[#F8FAFC]">
                      <td className="py-3 px-3 text-[#64748b]">{i + 1}</td>
                      <td className="py-3 px-3 font-mono font-bold text-[#1e293b]">{item.placa}</td>
                      <td className="py-3 px-3">
                        <div className="flex flex-wrap gap-1.5">
                          {item.tramites.map((t, ti) => (
                            <span
                              key={ti}
                              className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-full"
                            >
                              {labelTramite(t.tramite)}
                              <button
                                onClick={() => handleEliminarTramiteItem(item.id, ti)}
                                className="hover:text-red-500 transition-colors"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-[#64748b]">
                        {item.tramites[0]?.clasificacion || '—'}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => handleEliminarItem(item.id)}
                          className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          title="Eliminar placa"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Info tarifa automática */}
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <p className="text-xs md:text-sm text-amber-700">
                <strong>Tarifa automática:</strong> Se selecciona según trámite + clasificación.
                Para MEDIDAS CAUTELARES se mostrará un popup en el RUNT que debe aceptar manualmente.
                {' '}Máximo {MAX_CARRITO} placas por lote.
              </p>
            </div>
          </div>
        )}

        {/* ── Errores de validación ── */}
        {errores.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 md:p-5 animate-slide-up">
            <div className="flex items-start gap-2 mb-2">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <span className="text-sm md:text-base font-semibold text-red-700">
                Complete los campos obligatorios
              </span>
            </div>
            <ul className="text-sm md:text-base text-red-600 space-y-1 pl-7">
              {errores.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          </div>
        )}

        {/* ── Botón Generar Todo ── */}
        {carrito.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:justify-end gap-3 animate-slide-up">
            <button
              onClick={handleGenerarTodo}
              disabled={!puedeEnviar}
              className="w-full sm:w-auto bg-[#00ABE4] hover:bg-[#0095C5] text-white px-8 py-3.5 rounded-xl shadow-md transition-all duration-200 disabled:bg-slate-300 disabled:cursor-not-allowed hover:shadow-lg flex items-center justify-center gap-2 text-base md:text-lg active:scale-95"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Procesando {progreso.actual + 1 || ''} de {progreso.total || carrito.length}...
                </>
              ) : (
                <>
                  <FileText className="w-5 h-5" />
                  Generar Todo ({carrito.length} placa{carrito.length !== 1 ? 's' : ''})
                </>
              )}
            </button>
          </div>
        )}

        {/* ── Barra de progreso durante la generación ── */}
        {loading && carrito.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 animate-slide-up">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-[#64748b]">Procesando...</span>
              <span className="text-sm font-medium text-[#00ABE4]">{progreso.actual} / {progreso.total}</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-[#00ABE4] h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${progreso.total > 0 ? (progreso.actual / progreso.total) * 100 : 0}%` }}
              />
            </div>
          </div>
        )}

        {/* ── Resultados del batch ── */}
        {resultados.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 md:p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base md:text-lg font-bold text-[#1e293b]">
                Resultados
              </h3>
              <div className="flex items-center gap-3 text-sm">
                <span className="flex items-center gap-1 text-green-600">
                  <CheckCircle2 size={16} /> {resultados.filter(r => r.ok).length} exitosas
                </span>
                <span className="flex items-center gap-1 text-red-500">
                  <AlertCircle size={16} /> {resultados.filter(r => !r.ok).length} fallidas
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="py-3 px-3 text-left font-semibold text-[#64748b]">#</th>
                    <th className="py-3 px-3 text-left font-semibold text-[#64748b]">Placa</th>
                    <th className="py-3 px-3 text-left font-semibold text-[#64748b]">Trámites</th>
                    <th className="py-3 px-3 text-center font-semibold text-[#64748b]">Estado</th>
                    <th className="py-3 px-3 text-left font-semibold text-[#64748b]">Detalle</th>
                    <th className="py-3 px-3 text-center font-semibold text-[#64748b]">PDF</th>
                  </tr>
                </thead>
                <tbody>
                  {resultados.map((r, i) => (
                    <tr key={i} className="border-b border-slate-100 hover:bg-[#F8FAFC]">
                      <td className="py-3 px-3 text-[#64748b]">{i + 1}</td>
                      <td className="py-3 px-3 font-mono font-bold text-[#1e293b]">{r.placa}</td>
                      <td className="py-3 px-3 text-[#64748b]">{resumenTramites(r.tramites)}</td>
                      <td className="py-3 px-3 text-center">
                        {r.ok ? (
                          <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs px-2.5 py-1 rounded-full font-medium">
                            <CheckCircle2 size={12} /> Éxito
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 text-xs px-2.5 py-1 rounded-full font-medium">
                            <AlertCircle size={12} /> Error
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-xs text-[#64748b] max-w-[200px] truncate">
                        {r.ok ? 'Liquidación generada correctamente' : (r.error || 'Error desconocido')}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {r.ok && r.data?.descarga?.fileName ? (
                          <button
                            onClick={() => abrirPDF(r.data.descarga.fileName)}
                            className="p-2 text-[#00ABE4] hover:bg-blue-50 rounded-lg transition-all"
                            title="Abrir PDF"
                          >
                            <Download size={16} />
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

            {/* Mensaje final */}
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <p className="text-sm text-blue-700">
                {resultados.filter(r => r.ok).length === resultados.length
                  ? '✅ Todas las liquidaciones se generaron correctamente. Los PDFs se abrieron en nuevas pestañas.'
                  : `⚠️ ${resultados.filter(r => !r.ok).length} placa(s) fallaron. Revise los errores e intente de nuevo.`
                }
              </p>
            </div>
          </div>
        )}

        {/* ── Info de sesión (cuando está vacío) ── */}
        {carrito.length === 0 && resultados.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 md:p-10 text-center animate-slide-up">
            <ShoppingCart className="w-16 h-16 text-[#cbd5e1] mx-auto mb-4" />
            <h3 className="text-lg font-bold text-[#1e293b] mb-2">Carrito vacío</h3>
            <p className="text-[#64748b] max-w-md mx-auto">
              Agregue placas con sus trámites y al final genere todas las liquidaciones de una sola vez.
              Máximo {MAX_CARRITO} placas por lote.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
