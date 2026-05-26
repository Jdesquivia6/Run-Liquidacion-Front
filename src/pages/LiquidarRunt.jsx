import { useState } from "react";
import Header from "../components/Header";
import InputField from "../components/InputField";
import SelectField from "../components/FormSection";
import { consultarLiquidacion, API_BASE } from "../services/liquidacionApi";
import { Loader2, FileText, CheckCircle2, AlertCircle, Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

// ─────────────────────────────────────────────
// CONFIGURACIÓN — SOLO RNA
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

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

function getFechaColombia() {
  return new Date().toLocaleDateString("es-CO", { timeZone: "America/Bogota" })
    .split('/').reverse().join('-');
}

function formatBytes(bytes) {
  if (!bytes) return "N/A";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

// ─────────────────────────────────────────────
// COMPONENTE: Resultado de liquidación
// ─────────────────────────────────────────────

function LiquidacionResult({ result }) {
  if (!result) return null;

  const { ok, data, error } = result;

  if (!ok) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-5 animate-slide-up">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-red-700 mb-1">Liquidación fallida</h3>
            <p className="text-red-600 text-sm">{error || "Error desconocido"}</p>
          </div>
        </div>
      </div>
    );
  }

  const descarga = data?.descarga;
  const tramitesTabla = data?.tramitesTabla || [];
  const tramitesEnviados = data?.tramites || [];

  return (
    <div className="space-y-4 animate-slide-up">
      {/* Éxito */}
      <div className="bg-green-50 border border-green-200 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-green-700 mb-1">Liquidación generada correctamente</h3>
            <p className="text-green-600 text-sm">PDF abierto en una nueva pestaña — puede imprimirlo directamente</p>
          </div>
        </div>
      </div>

      {/* Info del PDF */}
      {descarga && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <h3 className="font-semibold text-[#1e293b] mb-3 flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#00ABE4]" />
            PDF generado
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-[#64748b]">Archivo: </span>
              <span className="text-[#1e293b] font-medium">{descarga.fileName}</span>
            </div>
            <div>
              <span className="text-[#64748b]">Tamaño: </span>
              <span className="text-[#1e293b]">{formatBytes(descarga.tamanoBytes)}</span>
            </div>
            {descarga.liquidacionId && (
              <div>
                <span className="text-[#64748b]">Liquidación Nro: </span>
                <span className="text-[#1e293b] font-medium">{descarga.liquidacionId}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Resumen */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <h3 className="font-semibold text-[#1e293b] mb-3">Resumen de la liquidación</h3>

        <div className="grid grid-cols-2 gap-y-2 text-sm">
          <span className="text-[#64748b]">Registro:</span>
          <span className="text-[#1e293b] font-medium">RNA</span>

          {data?.placa && (
            <>
              <span className="text-[#64748b]">Placa:</span>
              <span className="text-[#1e293b] font-medium">{data.placa}</span>
            </>
          )}

          <span className="text-[#64748b]">Trámites:</span>
          <span className="text-[#1e293b] font-medium">
            {tramitesEnviados.length > 0
              ? tramitesEnviados.map(t => t.tramite?.replace('TRÁMITE ', '')).join(', ')
              : '—'}
          </span>

          <span className="text-[#64748b]">Clasificación:</span>
          <span className="text-[#1e293b] font-medium">
            {tramitesEnviados.length > 0 ? tramitesEnviados[0].clasificacion : '—'}
          </span>
        </div>
      </div>

      {/* Tabla de trámites liquidados (desde RUNT) */}
      {tramitesTabla.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <h3 className="font-semibold text-[#1e293b] mb-3">Trámites liquidados ({tramitesTabla.length})</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="py-2 pr-4 text-[#64748b] font-medium">#</th>
                  <th className="py-2 pr-4 text-[#64748b] font-medium">Nombre</th>
                  <th className="py-2 text-[#64748b] font-medium">Tarifa</th>
                </tr>
              </thead>
              <tbody>
                {tramitesTabla.map((t, i) => (
                  <tr key={i} className="border-b border-slate-50 hover:bg-[#F8FAFC]">
                    <td className="py-2 pr-4 text-[#1e293b]">{t.id || i + 1}</td>
                    <td className="py-2 pr-4 text-[#1e293b]">{t.nombre}</td>
                    <td className="py-2 text-[#64748b]">{t.tarifa || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Solicitante */}
      {data?.nombreSolicitante && (
        <div className="bg-[#E9F1FA] rounded-2xl p-4 text-sm">
          <span className="text-[#64748b]">Solicitante: </span>
          <span className="text-[#1e293b] font-medium">
            {data.nombreSolicitante} ({data.tipoDocumentoSolicitante} {data.numeroDocumentoSolicitante})
          </span>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────

export default function LiquidarRunt() {
  // ── Estado del formulario ──
  const [form, setForm] = useState({
    organismoTransito: "SECRETARÍA DE TRÁNSITO DE SABANAGRANDE",
    fechaLiquidacion: getFechaColombia(),
    tipoDocumentoSolicitante: "NIT",
    numeroDocumentoSolicitante: "901769233",
    nombreSolicitante: "",
    registro: "RNA", // Fijo
    placa: ""
  });

  // ── Estado para multi-trámite ──
  const [tramiteActual, setTramiteActual] = useState("");
  const [clasificacionActual, setClasificacionActual] = useState("");
  const [tramitesList, setTramitesList] = useState([]);

  // ── Estados de UI ──
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState(null);

  // ── Manejadores de cambio ──
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // ── Agregar trámite a la lista ──
  const handleAgregarTramite = () => {
    if (!tramiteActual.trim()) {
      toast.error("Seleccione un trámite");
      return;
    }
    if (!clasificacionActual.trim()) {
      toast.error("Seleccione una clasificación");
      return;
    }

    // Verificar duplicados
    const yaExiste = tramitesList.some(
      t => t.tramite === tramiteActual && t.clasificacion === clasificacionActual
    );
    if (yaExiste) {
      toast.error("Este trámite ya está agregado");
      return;
    }

    // Verificar que todas las clasificaciones sean iguales (flujo RUNT)
    if (tramitesList.length > 0 && tramitesList[0].clasificacion !== clasificacionActual) {
      toast.error("Todos los trámites deben compartir la misma clasificación (flujo RUNT)");
      return;
    }

    setTramitesList(prev => [...prev, {
      tramite: tramiteActual,
      clasificacion: clasificacionActual
    }]);

    // Mantener la clasificación para el siguiente trámite (flujo RUNT)
    // Limpiar solo el trámite para seleccionar el siguiente
    setTramiteActual("");
    toast.success(`Agregado: ${TRAMITES_DISPONIBLES.find(t => t.value === tramiteActual)?.label || tramiteActual}`);
  };

  // ── Eliminar trámite de la lista ──
  const handleEliminarTramite = (index) => {
    setTramitesList(prev => prev.filter((_, i) => i !== index));
  };

  // ── Validación ──
  const obtenerErrores = () => {
    const errores = [];
    if (!form.placa.trim()) errores.push("La placa es obligatoria");
    if (tramitesList.length === 0) errores.push("Agregue al menos un trámite");
    return errores;
  };

  const errores = obtenerErrores();
  const puedeEnviar = errores.length === 0;

  // ── Generar liquidación → muestra PDF directo en el navegador ──
  const handleGenerar = async () => {
    if (!puedeEnviar) {
      errores.forEach((e) => toast.error(e));
      return;
    }

    try {
      setLoading(true);
      setResultado(null);

      const payload = {
        placa: form.placa,
        tramites: tramitesList
      };

      const resp = await consultarLiquidacion(payload);

      if (resp.ok) {
        setResultado({ ok: true, data: resp.data, error: null });
        toast.success("Liquidación generada exitosamente");

        // Abrir PDF directo en el navegador para imprimir
        if (resp.data?.descarga?.fileName) {
          abrirPDF(resp.data.descarga.fileName);
        }

        // Resetear formulario automáticamente
        resetForm();
      } else {
        setResultado({ ok: false, data: null, error: resp.error || "Ocurrió un error" });
      }
    } catch (err) {
      const mensajeError =
        err.response?.data?.error ||
        err.message ||
        "Error de conexión con el servidor";
      setResultado({ ok: false, data: null, error: mensajeError });
    } finally {
      setLoading(false);
    }
  };

  // ── Abrir PDF en el navegador + resetear formulario ──
  const abrirPDF = (fileName) => {
    const url = `${API_BASE}/descargar/${fileName}`;
    window.open(url, '_blank');
  };

  const resetForm = () => {
    setTramitesList([]);
    setTramiteActual("");
    setClasificacionActual("");
    setResultado(null);
  };

  return (
    <div className="min-h-screen bg-[#E9F1FA]">
      <Header />

      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* ── Información Básica ── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 animate-slide-up">
          <h2 className="text-xl font-bold text-[#1e293b] mb-6">
            Información Básica
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
              label="Organismo de Tránsito"
              name="organismoTransito"
              value={form.organismoTransito}
              onChange={handleChange}
              readOnly
            />

            <InputField
              label="Fecha liquidación"
              name="fechaLiquidacion"
              type="date"
              value={form.fechaLiquidacion}
              onChange={handleChange}
            />

            <SelectField
              label="Tipo documento solicitante"
              name="tipoDocumentoSolicitante"
              value={form.tipoDocumentoSolicitante}
              onChange={handleChange}
              options={[{ value: "NIT", label: "NIT" }]}
              disabled
            />

            <InputField
              label="Número documento solicitante"
              name="numeroDocumentoSolicitante"
              value={form.numeroDocumentoSolicitante}
              onChange={handleChange}
              readOnly
            />

            <InputField
              label="Nombre solicitante"
              name="nombreSolicitante"
              value={form.nombreSolicitante}
              onChange={handleChange}
              className="md:col-span-2"
              readOnly
              placeholder="Se cargará automáticamente desde el scraper"
            />
          </div>
        </div>

        {/* ── Datos de la liquidación ── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 animate-slide-up" style={{ animationDelay: "0.1s" }}>
          <h2 className="text-xl font-bold text-[#1e293b] mb-6">
            Trámites a liquidar (RNA)
          </h2>

          {/* Badge RNA */}
          <div className="mb-4 bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5 flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-500 flex-shrink-0" />
            <span className="text-sm text-blue-700 font-medium">
              Registro RNA — todos los trámites comparten la misma clasificación
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Placa */}
            <InputField
              label="Número de placa *"
              name="placa"
              value={form.placa}
              onChange={handleChange}
              placeholder="Ej: ABC123"
            />
          </div>

          {/* ── Agregar trámite ── */}
          <div className="mt-4 p-4 bg-[#F8FAFC] border border-slate-200 rounded-xl">
            <h3 className="text-sm font-semibold text-[#1e293b] mb-3">Agregar trámite</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <SelectField
                label="Trámite"
                name="tramiteActual"
                value={tramiteActual}
                onChange={(e) => setTramiteActual(e.target.value)}
                options={[
                  
                  ...TRAMITES_DISPONIBLES
                ]}
              />

              <SelectField
                label="Clasificación"
                name="clasificacionActual"
                value={clasificacionActual}
                onChange={(e) => setClasificacionActual(e.target.value)}
                options={[
                  
                  ...CLASIFICACIONES_DISPONIBLES
                ]}
              />

              <div className="flex items-end">
                <button
                  onClick={handleAgregarTramite}
                  className="w-full bg-[#00ABE4] hover:bg-[#0095C5] text-white px-4 py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 text-sm font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Agregar
                </button>
              </div>
            </div>
          </div>

          {/* ── Lista de trámites agregados ── */}
          {tramitesList.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-semibold text-[#1e293b] mb-2">
                Trámites seleccionados ({tramitesList.length})
              </h3>
              <div className="space-y-2">
                {tramitesList.map((t, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between bg-white border border-slate-200 rounded-xl px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-[#00ABE4] text-white text-xs font-bold flex items-center justify-center">
                        {i + 1}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-[#1e293b]">
                          {TRAMITES_DISPONIBLES.find(td => td.value === t.tramite)?.label || t.tramite}
                        </p>
                        <p className="text-xs text-[#64748b]">{t.clasificacion}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleEliminarTramite(i)}
                      className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      title="Eliminar trámite"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Información de tarifa automática */}
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl">
            <p className="text-xs text-amber-700">
              <strong>Tarifa automática:</strong> Se selecciona según la combinación trámite + clasificación.
              Para MEDIDAS CAUTELARES se mostrará un popup de confirmación en el RUNT.
              {tramitesList.length > 0 && (
                <> <strong>Clasificación única:</strong> {tramitesList[0].clasificacion}.</>
              )}
            </p>
          </div>
        </div>

        {/* ── Errores de validación ── */}
        {!puedeEnviar && errores.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 animate-slide-up">
            <div className="flex items-start gap-2 mb-2">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <span className="text-sm font-semibold text-red-700">
                Complete los campos obligatorios
              </span>
            </div>
            <ul className="text-sm text-red-600 space-y-0.5 pl-7">
              {errores.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          </div>
        )}

        {/* ── Resultado ── */}
        {resultado && <LiquidacionResult result={resultado} />}

        {/* ── Botones ── */}
        <div className="flex justify-end animate-slide-up" style={{ animationDelay: "0.3s" }}>
          <button
            onClick={handleGenerar}
            disabled={loading || !puedeEnviar}
            className="bg-[#00ABE4] hover:bg-[#0095C5] text-white px-8 py-3 rounded-xl shadow-md transition-all duration-200 disabled:bg-slate-300 disabled:cursor-not-allowed hover:shadow-lg flex items-center gap-2 text-base"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Procesando liquidación...
              </>
            ) : (
              <>
                <FileText className="w-5 h-5" />
                Generar
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
