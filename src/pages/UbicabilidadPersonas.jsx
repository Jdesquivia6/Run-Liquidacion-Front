import { useState, useRef } from "react";
import toast from "react-hot-toast";
import PageHeroHeader from "../components/PageHeroHeader";
import {
  validarArchivoExcel,
  obtenerDocumentosParaProcesar,
  listarResultados
} from "../services/ubicabilidadPersonasApi";
import { crearJob } from "../services/workerJobsApi";
import {
  Upload, FileText, CheckCircle2, AlertCircle,
  Loader2, Search, MapPin, Eye, X
} from "lucide-react";
import DocumentosSwiper from "../components/DocumentosSwiper";
import JobProgress from "../components/JobProgress";

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
    </div>
  );
}
