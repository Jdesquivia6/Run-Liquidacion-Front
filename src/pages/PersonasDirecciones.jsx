import { useEffect, useState } from "react";
import { MapPin, Users, Search, Loader2, CheckCircle, XCircle, AlertCircle, RefreshCw, Upload, Briefcase } from "lucide-react";
import toast from "react-hot-toast";
import { crearJob } from "../services/workerJobsApi";
import JobProgress from "../components/JobProgress";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";

const COLORS = {
  pageBg: "#E9F1FA",
  cardBg: "#FFFFFF",
  heroGradient: "linear-gradient(135deg, #00ABE4 0%, #0095C5 100%)",
  primary: "#00ABE4",
  textPrimary: "#1e293b",
  textSecondary: "#64748b",
  success: "#059669",
  error: "#dc2626",
  warning: "#d97706",
  border: "#e2e8f0"
};

const tipoDocumentoOptions = [
  "C.C. Cédula Ciudadanía",
  "C.E. Cédula Extranjería",
  "NIT",
  "Pasaporte"
];

export default function PersonasDirecciones() {
  const [documentos, setDocumentos] = useState("");
  const [tipoDocumentoManual, setTipoDocumentoManual] = useState("C.C. Cédula Ciudadanía");
  const [loading, setLoading] = useState(false);
  const [loadingJob, setLoadingJob] = useState(false);
  const [modoJobsCarrera, setModoJobsCarrera] = useState(false);
  const [colaJobs, setColaJobs] = useState([]);
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState("");
  const [tipoGrupoCargado, setTipoGrupoCargado] = useState(null);
  const [jobActual, setJobActual] = useState(null);
  const [historialDirecciones, setHistorialDirecciones] = useState([]);
  
  // Personas pendientes desde el backend
  const [personasPendientes, setPersonasPendientes] = useState([]);
  const [gruposPendientes, setGruposPendientes] = useState([]);
  const [cargandoPendientes, setCargandoPendientes] = useState(false);
  const [mostrarPendientes, setMostrarPendientes] = useState(false);
  const [limitPendientes, setLimitPendientes] = useState(100);
  const [grupoDetalleAbierto, setGrupoDetalleAbierto] = useState(null);
  const [paginaDetalle, setPaginaDetalle] = useState(1);
  const ITEMS_POR_PAGINA = 12;

  // Cargar personas pendientes desde el backend
  const cargarPersonasPendientes = async (limit = limitPendientes) => {
    try {
      setCargandoPendientes(true);
      
      const response = await fetch(`http://84.247.165.214:3000/api/personas/direcciones/personas-pendientes-direcciones?limit=${limit}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error cargando personas pendientes");
      }

      setPersonasPendientes(data.personas || []);
      setGruposPendientes(data.grupos || []);
      setMostrarPendientes(true);

      // Cargar automáticamente SOLO el primer grupo por tipo (sin mezclar)
      if (data.grupos?.length > 0) {
        const primerGrupo = data.grupos[0];
        const docsPrimerGrupo = primerGrupo.documentos || [];
        setDocumentos(docsPrimerGrupo.join("\n"));

        if (primerGrupo.tipoDocumento) {
          setTipoDocumentoManual(primerGrupo.tipoDocumento);
          setTipoGrupoCargado(primerGrupo.tipoDocumento);
        }
      } else {
        setDocumentos("");
        setTipoGrupoCargado(null);
      }
      
      toast.success(`${data.total} pendiente(s). Se cargó el primer tipo para no mezclar documentos.`);
      return data;

    } catch (err) {
      toast.error(err.message);
      setError(err.message);
      return null;
    } finally {
      setCargandoPendientes(false);
    }
  };

  const cargarHistorialDirecciones = async () => {
    try {
      const response = await fetch("http://84.247.165.214:3000/api/personas/direcciones/historial-direcciones?limit=100");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error cargando historial de direcciones");
      }

      setHistorialDirecciones(data.results || []);
    } catch (err) {
      console.error("Error cargando historial direcciones:", err.message);
    }
  };

  // Cargar documentos de un grupo específico por tipo (sin mezclar)
  const cargarGrupoEnTextarea = (grupo) => {
    const docs = grupo.documentos || [];
    setDocumentos(docs.join("\n"));
    if (grupo.tipoDocumento) {
      setTipoDocumentoManual(grupo.tipoDocumento);
      setTipoGrupoCargado(grupo.tipoDocumento);
    }
    setMostrarPendientes(false);
    toast.success(`${docs.length} documento(s) del grupo "${grupo.tipoDocumento}" cargado(s)`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Cargar un grupo específico
  const seleccionarGrupo = (grupo) => {
    cargarGrupoEnTextarea(grupo);
  };

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

  // Ejecutar una consulta de un solo grupo y avanzar al siguiente
  const handleConsultarUnGrupo = async () => {
    if (documentosArray.length === 0) {
      toast.error("No hay documentos para consultar");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setResultado(null);

      const response = await fetch("http://84.247.165.214:3000/api/personas/direcciones/consultar-direcciones-pn-batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipoDocumento: tipoDocumentoManual,
          documentos: documentosArray
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error en la consulta");
      }

      setResultado(data);
      toast.success(`Procesados ${data.processed}/${data.requested} documentos`);

      // Limpiar textarea
      setDocumentos("");

      // SIEMPRE avanzar al siguiente grupo (tanto en modo auto como manual)
      if (tipoGrupoCargado) {
        const idxActual = gruposPendientes.findIndex(
          (g) => g.tipoDocumento === tipoGrupoCargado
        );

        const siguienteGrupo =
          idxActual >= 0
            ? gruposPendientes.slice(idxActual + 1).find((g) => (g.documentos || []).length > 0)
            : null;

        if (siguienteGrupo) {
          const docsSiguiente = siguienteGrupo.documentos || [];
          setDocumentos(docsSiguiente.join("\n"));
          setTipoDocumentoManual(siguienteGrupo.tipoDocumento || tipoDocumentoManual);
          setTipoGrupoCargado(siguienteGrupo.tipoDocumento || null);
          toast.success(`Siguiente grupo: ${siguienteGrupo.tipoDocumento} (${docsSiguiente.length})`);
        } else {
          setTipoGrupoCargado(null);
          toast.success("✅ Todos los grupos han sido procesados");
        }
      }

    } catch (err) {
      toast.error(err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const crearTrabajoConDocumentos = async (tipoDocumento, docs) => {
    const items = docs.map((doc) => ({
      tipoDocumento,
      numeroDocumento: String(doc || "").trim()
    })).filter((item) => item.numeroDocumento);

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
          (g) => g.tipoDocumento === tipoGrupoCargado
        );

        const cola = idxActual >= 0
          ? gruposPendientes
              .slice(idxActual + 1)
              .filter((g) => (g.documentos || []).length > 0)
              .map((g) => ({ tipoDocumento: g.tipoDocumento, documentos: g.documentos || [] }))
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

  const grupos = gruposPendientes.map((grupo) => ({
    ...grupo,
    count: (grupo.documentos || []).length,
    personas: grupo.personas || []
  }));

  const grupoActivo = grupos.find((g) => g.tipoDocumento === grupoDetalleAbierto) || null;
  const totalPaginasDetalle = grupoActivo
    ? Math.max(1, Math.ceil(grupoActivo.personas.length / ITEMS_POR_PAGINA))
    : 1;
  const personasPaginaDetalle = grupoActivo
    ? grupoActivo.personas.slice((paginaDetalle - 1) * ITEMS_POR_PAGINA, paginaDetalle * ITEMS_POR_PAGINA)
    : [];

  const HIST_ITEMS_PER_SLIDE = 10;
  const historialSlides = [];

  for (let i = 0; i < historialDirecciones.length; i += HIST_ITEMS_PER_SLIDE) {
    historialSlides.push(historialDirecciones.slice(i, i + HIST_ITEMS_PER_SLIDE));
  }

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8" style={{ backgroundColor: COLORS.pageBg }}>
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* HERO SECTION */}
        <section
          className="relative overflow-hidden rounded-3xl p-6 md:p-8 text-white shadow-2xl"
          style={{ background: COLORS.heroGradient }}
        >
          <div className="absolute top-4 right-4 opacity-20">
            <MapPin size={100} />
          </div>

          <div className="relative z-10">
            <p className="text-blue-100 text-sm font-medium flex items-center gap-2">
              <Users size={16} />
              Personas - Direcciones
            </p>

            <h2 className="text-3xl md:text-4xl font-bold mt-2">
              Consulta de Direcciones RUNT
            </h2>

            <p className="text-blue-100 mt-3 max-w-3xl">
              Consulta direcciones de personas naturales en lote desde el RUNT.
              Carga personas pendientes desde el sistema o ingresa documentos manualmente.
            </p>
          </div>
        </section>

        {/* PANEL DE PERSONAS PENDIENTES */}
        {mostrarPendientes && personasPendientes.length > 0 && (
          <section
            className="rounded-3xl p-4 md:p-6 shadow-sm"
            style={{
              backgroundColor: COLORS.cardBg,
              boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)"
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold" style={{ color: COLORS.textPrimary }}>
                  Personas Pendientes de Consultar
                </h3>
                <p className="text-sm" style={{ color: COLORS.textSecondary }}>
                  {personasPendientes.length} persona(s) sin dirección consultada
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                <select
                  value={limitPendientes}
                  onChange={(e) => setLimitPendientes(Number(e.target.value))}
                  className="px-3 py-2 rounded-xl border text-sm"
                  style={{ borderColor: COLORS.border }}
                >
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={200}>200</option>
                  <option value={500}>500</option>
                </select>
                
                <button
                  onClick={() => cargarPersonasPendientes(limitPendientes)}
                  disabled={cargandoPendientes}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border text-sm transition-all"
                  style={{ borderColor: COLORS.border }}
                >
                  <RefreshCw size={16} className={cargandoPendientes ? "animate-spin" : ""} />
                  Recargar
                </button>
                
                <button
                  onClick={() => setMostrarPendientes(false)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#E9F1FA] text-sm transition-all"
                >
                  Cerrar
                </button>
              </div>
            </div>

            {/* Botón seleccionar todas */}
            <div className="mb-4 flex items-center gap-4">
              <button
                onClick={() => {
                  if (!grupos.length) {
                    toast.error("No hay grupos para cargar");
                    return;
                  }
                  cargarGrupoEnTextarea(grupos[0]);
                }}
                className="flex items-center gap-2 px-5 py-3 rounded-2xl font-semibold text-white transition-all hover:shadow-lg"
                style={{ backgroundColor: COLORS.primary }}
              >
                <CheckCircle size={18} />
                Cargar primer grupo ({grupos[0]?.tipoDocumento || "sin tipo"})
              </button>
            </div>

            {/* Grupos por tipo de documento (compacto) */}
            <div className="space-y-4">
              {grupos.map((grupo, idx) => (
                <div key={idx} className="rounded-xl border p-4" style={{ borderColor: COLORS.border }}>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h4 className="font-semibold" style={{ color: COLORS.textPrimary }}>
                        {grupo.tipoDocumento}
                      </h4>
                      <p className="text-xs" style={{ color: COLORS.textSecondary }}>
                        {grupo.count} documento(s)
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleDetalleGrupo(grupo)}
                        className="px-3 py-2 rounded-xl text-xs font-medium border"
                        style={{ borderColor: COLORS.border, color: COLORS.textSecondary }}
                      >
                        {grupoDetalleAbierto === grupo.tipoDocumento ? "Ocultar detalle" : "Ver detalle"}
                      </button>

                      <button
                        onClick={() => seleccionarGrupo(grupo)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all hover:shadow-md"
                        style={{ backgroundColor: COLORS.pageBg, color: COLORS.primary }}
                      >
                        <CheckCircle size={14} />
                        Cargar ({grupo.count})
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Detalle paginado (solo un grupo abierto) */}
            {grupoActivo && (
              <div className="mt-5 rounded-xl border p-4" style={{ borderColor: COLORS.border }}>
                <div className="flex items-center justify-between mb-3">
                  <h5 className="font-semibold" style={{ color: COLORS.textPrimary }}>
                    Detalle: {grupoActivo.tipoDocumento}
                  </h5>
                  <p className="text-xs" style={{ color: COLORS.textSecondary }}>
                    Página {paginaDetalle} de {totalPaginasDetalle}
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead style={{ backgroundColor: COLORS.pageBg }}>
                      <tr>
                        <th className="py-2 px-3 text-left">Documento</th>
                        <th className="py-2 px-3 text-left">Nombre</th>
                        <th className="py-2 px-3 text-left">Placa</th>
                      </tr>
                    </thead>
                    <tbody>
                      {personasPaginaDetalle.map((persona, i) => (
                        <tr key={i} className="border-t" style={{ borderColor: COLORS.border }}>
                          <td className="py-2 px-3 font-mono" style={{ color: COLORS.textPrimary }}>
                            {persona.numero_documento}
                          </td>
                          <td className="py-2 px-3" style={{ color: COLORS.textSecondary }}>
                            {persona.nombres || ""} {persona.apellidos || ""}
                          </td>
                          <td className="py-2 px-3" style={{ color: COLORS.primary }}>
                            {persona.placa || "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-end gap-2 mt-3">
                  <button
                    onClick={() => setPaginaDetalle((p) => Math.max(1, p - 1))}
                    disabled={paginaDetalle === 1}
                    className="px-3 py-1.5 rounded-lg text-xs border disabled:opacity-50"
                    style={{ borderColor: COLORS.border }}
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => setPaginaDetalle((p) => Math.min(totalPaginasDetalle, p + 1))}
                    disabled={paginaDetalle === totalPaginasDetalle}
                    className="px-3 py-1.5 rounded-lg text-xs border disabled:opacity-50"
                    style={{ borderColor: COLORS.border }}
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </section>
        )}

        {/* FORMULARIO */}
        <section
          className="rounded-3xl p-4 md:p-6 shadow-sm"
          style={{
            backgroundColor: COLORS.cardBg,
            boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)"
          }}
        >
          {/* Botón cargar pendientes */}
          {!mostrarPendientes && (
            <div className="mb-6 flex items-center gap-4">
              <button
                onClick={() => cargarPersonasPendientes(limitPendientes)}
                disabled={cargandoPendientes}
                className="flex items-center gap-2 px-5 py-3 rounded-2xl font-semibold text-white transition-all hover:shadow-lg disabled:opacity-60"
                style={{ backgroundColor: COLORS.warning }}
              >
                {cargandoPendientes ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Cargando...</span>
                  </>
                ) : (
                  <>
                    <Upload size={18} />
                    <span>Cargar Pendientes desde BD</span>
                  </>
                )}
              </button>

              <span className="text-sm" style={{ color: COLORS.textSecondary }}>
                Carga pendientes y los pone en el textarea automáticamente
              </span>
            </div>
          )}

          <div className="mb-4">
            <label className="text-sm font-semibold block mb-2" style={{ color: COLORS.textPrimary }}>
              Tipo de documento manual (si no viene de pendientes)
            </label>
            <select
              value={tipoDocumentoManual}
              onChange={(e) => setTipoDocumentoManual(e.target.value)}
              className="w-full md:w-[360px] mb-4 rounded-2xl border px-4 py-3 text-sm focus:outline-none focus:ring-2"
              style={{
                borderColor: COLORS.border,
                color: COLORS.textPrimary,
                "--tw-ring-color": COLORS.primary
              }}
            >
              {tipoDocumentoOptions.map((tipo) => (
                <option key={tipo} value={tipo}>{tipo}</option>
              ))}
            </select>

            <label className="text-sm font-semibold block mb-2" style={{ color: COLORS.textPrimary }}>
              Números de Documento
              <span className="text-xs font-normal ml-2" style={{ color: COLORS.textSecondary }}>
                (uno por línea, separados por coma o espacio)
              </span>
            </label>
            <textarea
              value={documentos}
              onChange={(e) => {
                setDocumentos(e.target.value);
                // Si el usuario edita manualmente, se considera flujo individual
                setTipoGrupoCargado(null);
              }}
              placeholder={`Ingrese los números de documento:\nEjemplo:\n12345678\n87654321\n11223344`}
              className="w-full h-40 rounded-2xl border px-4 py-3 text-sm focus:outline-none focus:ring-2 resize-none"
              style={{ 
                borderColor: COLORS.border, 
                color: COLORS.textPrimary,
                "--tw-ring-color": COLORS.primary
              }}
            />
            <p className="text-xs mt-1" style={{ color: COLORS.textSecondary }}>
              {documentosArray.length} documento(s) ingresado(s)
            </p>
          </div>

          {/* Botones */}
          <div className="flex flex-wrap gap-3 mt-6">
            <button
              onClick={handleCrearTrabajo}
              disabled={loadingJob || documentosArray.length === 0}
              className="flex items-center gap-2 h-12 px-6 rounded-2xl font-semibold text-white transition-all hover:shadow-lg disabled:opacity-60"
              style={{ backgroundColor: loadingJob ? COLORS.textSecondary : "#10b981" }}
            >
              {loadingJob ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Creando...</span>
                </>
              ) : (
                <>
                  <Briefcase size={18} />
                  <span>Crear trabajo</span>
                </>
              )}
            </button>

            <button
              onClick={handleConsultarUnGrupo}
              disabled={loading || documentosArray.length === 0}
              className="flex items-center gap-2 h-12 px-6 rounded-2xl font-semibold text-white transition-all hover:shadow-lg disabled:opacity-60"
              style={{ backgroundColor: loading ? COLORS.textSecondary : COLORS.primary }}
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Consultando...</span>
                </>
              ) : (
                <>
                  <Search size={18} />
                  <span>Consultar ({documentosArray.length})</span>
                </>
              )}
            </button>

            <button
              onClick={handleLimpiar}
              disabled={loading}
              className="flex items-center gap-2 h-12 px-6 rounded-2xl font-semibold border-2 transition-all hover:shadow-lg disabled:opacity-60"
              style={{ 
                borderColor: COLORS.border, 
                color: COLORS.textSecondary,
                backgroundColor: "transparent"
              }}
            >
              <RefreshCw size={18} />
              <span>Limpiar</span>
            </button>

            {resultado && (
              <button
                onClick={() => {
                  setDocumentos("");
                  setResultado(null);
                  cargarPersonasPendientes();
                }}
                className="flex items-center gap-2 h-12 px-6 rounded-2xl font-semibold border-2 transition-all hover:shadow-lg"
                style={{ 
                  borderColor: COLORS.success, 
                  color: COLORS.success,
                  backgroundColor: "transparent"
                }}
              >
                <RefreshCw size={18} />
                <span>Actualizar Pendientes</span>
              </button>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="mt-4 p-4 rounded-xl bg-red-50 border border-red-200 flex items-center gap-3">
              <AlertCircle size={20} className="text-red-500 shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
        </section>

        {/* RESULTADOS */}
        {resultado && (
          <>
            {/* Resumen */}
            <section className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="rounded-3xl p-5 shadow-sm" style={{ backgroundColor: COLORS.cardBg, boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)" }}>
                <div className="flex items-center gap-2 mb-2">
                  <Users size={18} style={{ color: COLORS.primary }} />
                  <span className="text-xs font-medium" style={{ color: COLORS.textSecondary }}>Solicitados</span>
                </div>
                <p className="text-2xl font-bold" style={{ color: COLORS.textPrimary }}>{resultado.requested}</p>
              </div>

              <div className="rounded-3xl p-5 shadow-sm" style={{ backgroundColor: COLORS.cardBg, boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)" }}>
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle size={18} style={{ color: COLORS.success }} />
                  <span className="text-xs font-medium" style={{ color: COLORS.textSecondary }}>Exitosas</span>
                </div>
                <p className="text-2xl font-bold" style={{ color: COLORS.success }}>{resultado.exitosas}</p>
              </div>

              <div className="rounded-3xl p-5 shadow-sm" style={{ backgroundColor: COLORS.cardBg, boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)" }}>
                <div className="flex items-center gap-2 mb-2">
                  <XCircle size={18} style={{ color: COLORS.error }} />
                  <span className="text-xs font-medium" style={{ color: COLORS.textSecondary }}>Fallidas</span>
                </div>
                <p className="text-2xl font-bold" style={{ color: COLORS.error }}>{resultado.fallidas}</p>
              </div>

              <div className="rounded-3xl p-5 shadow-sm" style={{ backgroundColor: COLORS.cardBg, boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)" }}>
                <div className="flex items-center gap-2 mb-2">
                  <MapPin size={18} style={{ color: COLORS.warning }} />
                  <span className="text-xs font-medium" style={{ color: COLORS.textSecondary }}>Guardadas</span>
                </div>
                <p className="text-2xl font-bold" style={{ color: COLORS.warning }}>{resultado.guardadas}</p>
              </div>

              <div className="rounded-3xl p-5 shadow-sm" style={{ backgroundColor: COLORS.cardBg, boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)" }}>
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle size={18} style={{ color: COLORS.textSecondary }} />
                  <span className="text-xs font-medium" style={{ color: COLORS.textSecondary }}>Sin Datos</span>
                </div>
                <p className="text-2xl font-bold" style={{ color: COLORS.textSecondary }}>{resultado.sinDatos}</p>
              </div>
            </section>

            {/* Detalle de resultados */}
            <section
              className="rounded-3xl p-6 shadow-sm"
              style={{
                backgroundColor: COLORS.cardBg,
                boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)"
              }}
            >
              <h3 className="text-lg font-bold mb-4" style={{ color: COLORS.textPrimary }}>
                Detalle de Resultados
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ backgroundColor: COLORS.pageBg }}>
                      <th className="py-3 px-4 text-left font-semibold" style={{ color: COLORS.textSecondary }}>Documento</th>
                      <th className="py-3 px-4 text-left font-semibold" style={{ color: COLORS.textSecondary }}>Estado</th>
                      <th className="py-3 px-4 text-left font-semibold" style={{ color: COLORS.textSecondary }}>Direcciones</th>
                      <th className="py-3 px-4 text-left font-semibold" style={{ color: COLORS.textSecondary }}>BD</th>
                      <th className="py-3 px-4 text-left font-semibold" style={{ color: COLORS.textSecondary }}>Detalle</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resultado.results.map((item, index) => (
                      <tr key={index} className="border-t" style={{ borderColor: COLORS.border }}>
                        <td className="py-3 px-4 font-mono font-bold" style={{ color: COLORS.textPrimary }}>
                          {item.documento || item.documentoOriginal || `Item ${index + 1}`}
                        </td>
                        <td className="py-3 px-4">
                          {item.ok ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                              <CheckCircle size={12} /> OK
                            </span>
                          ) : item.sessionExpired ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                              Sesión vencida
                            </span>
                          ) : item.noData ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                              <AlertCircle size={12} /> Sin datos
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                              <XCircle size={12} /> Error
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center" style={{ color: COLORS.textSecondary }}>
                          {item.totalDirecciones || 0}
                        </td>
                        <td className="py-3 px-4">
                          {item.db?.saved ? (
                            <span className="inline-flex items-center gap-1 text-xs text-green-600">
                              <CheckCircle size={12} /> Guardada
                            </span>
                          ) : item.db?.saved === false ? (
                            <span className="inline-flex items-center gap-1 text-xs text-yellow-600">
                              {item.db?.reason || "No guardada"}
                            </span>
                          ) : (
                            <span className="text-xs" style={{ color: COLORS.textSecondary }}>—</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-xs truncate max-w-xs" style={{ color: COLORS.textSecondary }}>
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

        {/* Progreso del trabajo */}
        {jobActual && (
          <div style={{ animation: "fadeInUp 0.4s ease-out" }}>
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
                  setTipoDocumentoManual(siguiente.tipoDocumento || tipoDocumentoManual);
                  setTipoGrupoCargado(siguiente.tipoDocumento || null);
                  setDocumentos((siguiente.documentos || []).join("\n"));

                  try {
                    await crearTrabajoConDocumentos(siguiente.tipoDocumento, siguiente.documentos || []);
                    setDocumentos("");
                  } catch (err) {
                    setModoJobsCarrera(false);
                    setColaJobs([]);
                    toast.error(err.response?.data?.error || err.message || "Error creando siguiente trabajo");
                  }

                  return;
                }

                if (modoJobsCarrera) {
                  setModoJobsCarrera(false);
                  setColaJobs([]);
                  setDocumentos("");
                  setTipoGrupoCargado(null);
                  toast.success("✅ Proceso por jobs finalizado");
                }
              }}
            />
          </div>
        )}

        {/* Historial direcciones */}
        <section
          className="rounded-3xl p-6 shadow-sm"
          style={{
            backgroundColor: COLORS.cardBg,
            boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)"
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold" style={{ color: COLORS.textPrimary }}>
              Historial direcciones
            </h3>

            <button
              onClick={cargarHistorialDirecciones}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border text-sm"
              style={{ borderColor: COLORS.border, color: COLORS.textSecondary }}
            >
              <RefreshCw size={14} />
              Recargar
            </button>
          </div>

          {historialDirecciones.length === 0 ? (
            <p className="text-sm" style={{ color: COLORS.textSecondary }}>
              No hay historial de direcciones todavía.
            </p>
          ) : (
            <Swiper
              modules={[Pagination, Navigation]}
              pagination={{ clickable: true }}
              navigation
              spaceBetween={20}
              slidesPerView={1}
              className="pb-10"
            >
              {historialSlides.map((slideItems, slideIndex) => (
                <SwiperSlide key={`hist-slide-${slideIndex}`}>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr style={{ backgroundColor: COLORS.pageBg }}>
                          <th className="py-3 px-3 text-left font-semibold" style={{ color: COLORS.textSecondary }}>Tipo Doc</th>
                          <th className="py-3 px-3 text-left font-semibold" style={{ color: COLORS.textSecondary }}>Documento</th>
                          <th className="py-3 px-3 text-left font-semibold" style={{ color: COLORS.textSecondary }}>Nombres / Apellidos</th>
                          <th className="py-3 px-3 text-left font-semibold" style={{ color: COLORS.textSecondary }}>Celular / Correo</th>
                          <th className="py-3 px-3 text-left font-semibold" style={{ color: COLORS.textSecondary }}>Dirección</th>
                          <th className="py-3 px-3 text-left font-semibold" style={{ color: COLORS.textSecondary }}>Municipio</th>
                          <th className="py-3 px-3 text-left font-semibold" style={{ color: COLORS.textSecondary }}>Teléfono</th>
                          <th className="py-3 px-3 text-left font-semibold" style={{ color: COLORS.textSecondary }}>Tipo Dir</th>
                          <th className="py-3 px-3 text-left font-semibold" style={{ color: COLORS.textSecondary }}>Fecha consulta</th>
                        </tr>
                      </thead>
                      <tbody>
                        {slideItems.map((item, index) => (
                          <tr key={`${item.numero_documento}-${slideIndex}-${index}`} className="border-t" style={{ borderColor: COLORS.border }}>
                            <td className="py-3 px-3" style={{ color: COLORS.textSecondary }}>{item.tipo_documento || "—"}</td>
                            <td className="py-3 px-3 font-mono font-semibold" style={{ color: COLORS.textPrimary }}>{item.numero_documento || "—"}</td>
                            <td className="py-3 px-3" style={{ color: COLORS.textSecondary }}>{`${item.nombres || ""} ${item.apellidos || ""}`.trim() || "—"}</td>
                            <td className="py-3 px-3" style={{ color: COLORS.textSecondary }}>
                              <div>{item.celular || "—"}</div>
                              <div className="text-xs">{item.correo || "—"}</div>
                            </td>
                            <td className="py-3 px-3" style={{ color: COLORS.textSecondary }}>{item.direccion || "—"}</td>
                            <td className="py-3 px-3" style={{ color: COLORS.textSecondary }}>{item.municio_departamento || "—"}</td>
                            <td className="py-3 px-3" style={{ color: COLORS.textSecondary }}>{item.telefono || "—"}</td>
                            <td className="py-3 px-3" style={{ color: COLORS.textSecondary }}>{item.tipo_direccion || "—"}</td>
                            <td className="py-3 px-3" style={{ color: COLORS.textSecondary }}>
                              {item.fecha_consulta_direccion
                                ? new Date(item.fecha_consulta_direccion).toLocaleString("es-CO", { timeZone: "America/Bogota" })
                                : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          )}
        </section>

      </div>
    </div>
  );
}
