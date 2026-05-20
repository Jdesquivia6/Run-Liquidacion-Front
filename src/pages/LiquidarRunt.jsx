import { useMemo, useState } from "react";
import Header from "../components/Header";
import InputField from "../components/InputField";
import SelectField from "../components/FormSection";
import TramitesTable from "../components/TramitesTable";
import { consultarLiquidacion } from "../services/liquidacionApi";
import { crearJob } from "../services/workerJobsApi";
import JobProgress from "../components/JobProgress";
import { Loader2, Briefcase } from "lucide-react";
import toast from "react-hot-toast";

const registrosOptions = [
  { value: "RNA", label: "RNA" },
  { value: "RNC", label: "RNC" },
  { value: "RNET", label: "RNET" },
  { value: "RNMA", label: "RNMA" },
  { value: "RNPNJ", label: "RNPNJ" },
  { value: "RNRS", label: "RNRS" }
];

const tipoDocumentoOptions = [
  { value: "CC", label: "CC" },
  { value: "CE", label: "CE" },
  { value: "NIT", label: "NIT" },
  { value: "TI", label: "TI" },
  { value: "PASAPORTE", label: "Pasaporte" }
];

// Mock inicial para pruebas hasta trámite
const tramitesMock = [
  { value: "TRASPASO", label: "Traspaso" },
  { value: "MATRICULA", label: "Matrícula" },
  { value: "LICENCIA", label: "Licencia" }
];

const clasificacionMock = [
  { value: "REMOLQUE Y SEMIRREMOLQUE", label: "Remolque y Semirremolque" },
  { value: "PERSONA NATURAL", label: "Persona Natural" }
];

const tarifasMock = [
  { value: "TARIFA_1", label: "Tarifa 1" },
  { value: "TARIFA_2", label: "Tarifa 2" }
];

// Obtener fecha actual en Colombia
function getFechaColombia() {
  return new Date().toLocaleDateString("es-CO", { timeZone: "America/Bogota" }).split('/').reverse().join('-');
}

export default function LiquidarRunt() {
  const [form, setForm] = useState({
    organismoTransito: "SECRETARÍA DE TRÁNSITO DE SABANAGRANDE",
    fechaLiquidacion: getFechaColombia(),
    tipoDocumentoSolicitante: "NIT",
    numeroDocumentoSolicitante: "901769233",
    nombreSolicitante: "",

    registro: "",
    placa: "",
    tipoDocumento: "",
    numeroDocumento: "",
    tramite: "",
    clasificacion: "",
    tarifa: ""
  });

  const [tramitesAgregados, setTramitesAgregados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingJob, setLoadingJob] = useState(false);
  const [jobActual, setJobActual] = useState(null);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  const mostrarCampoPlaca = useMemo(() => {
    return ["RNA", "RNMA", "RNRS"].includes(form.registro);
  }, [form.registro]);

  const mostrarCamposDocumento = useMemo(() => {
    return ["RNC", "RNPNJ"].includes(form.registro);
  }, [form.registro]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRegistroChange = (e) => {
    const { value } = e.target;

    setForm((prev) => ({
      ...prev,
      registro: value,
      placa: "",
      tipoDocumento: "",
      numeroDocumento: "",
      tramite: "",
      clasificacion: "",
      tarifa: ""
    }));
  };

  const agregarTramite = () => {
    if (!form.tramite) {
      setError("Debes seleccionar un trámite");
      return;
    }

    const nuevo = {
      id: tramitesAgregados.length + 1,
      nombre: form.tramite,
      tarifa: form.tarifa || "Pendiente"
    };

    setTramitesAgregados((prev) => [...prev, nuevo]);
    setError("");
  };

  const eliminarTramite = (index) => {
    setTramitesAgregados((prev) => prev.filter((_, i) => i !== index));
  };

  const handleGenerar = async () => {
    try {
      setLoading(true);
      setError("");
      setMensaje("");

      const payload = {
        registro: form.registro,
        placa: form.placa,
        tipoDocumento: form.tipoDocumento,
        numeroDocumento: form.numeroDocumento,
        tramite: form.tramite,
        clasificacion: form.clasificacion,
        tarifa: form.tarifa
      };

      const resp = await consultarLiquidacion(payload);

      if (resp.ok) {
        setMensaje("Liquidación ejecutada correctamente");
      } else {
        setError(resp.error || "Ocurrió un error");
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  const handleCrearTrabajo = async () => {
    if (!form.registro || !form.tramite) {
      toast.error("Debe seleccionar registro y trámite");
      return;
    }

    try {
      setLoadingJob(true);
      
      const items = [{
        registro: form.registro,
        placa: form.placa || null,
        tipoDocumento: form.tipoDocumento || null,
        numeroDocumento: form.numeroDocumento || null,
        tramite: form.tramite,
        clasificacion: form.clasificacion || null,
        tarifa: form.tarifa || null
      }];
      
      const resp = await crearJob("liquidaciones", items);
      
      if (resp.job?.id_job) {
        setJobActual(resp.job.id_job);
        toast.success("Trabajo creado");
      }
    } catch (err) {
      toast.error(err.response?.data?.error || "Error al crear trabajo");
    } finally {
      setLoadingJob(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#E9F1FA]">
      <Header />

      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Información Básica */}
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

            <InputField
              label="Tipo documento"
              name="tipoDocumentoSolicitante"
              value={form.tipoDocumentoSolicitante}
              onChange={handleChange}
              readOnly
            />

            <InputField
              label="Número documento"
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
              placeholder="Se cargará automáticamente desde el backend"
            />
          </div>
        </div>

        {/* Trámites a liquidar */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 animate-slide-up" style={{ animationDelay: "0.1s" }}>
          <h2 className="text-xl font-bold text-[#1e293b] mb-6">
            Trámites a liquidar
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SelectField
              label="Registro"
              name="registro"
              value={form.registro}
              onChange={handleRegistroChange}
              options={registrosOptions}
            />

            {mostrarCampoPlaca && (
              <InputField
                label="Número de placa"
                name="placa"
                value={form.placa}
                onChange={handleChange}
              />
            )}

            {mostrarCamposDocumento && (
              <>
                <SelectField
                  label="Tipo documento"
                  name="tipoDocumento"
                  value={form.tipoDocumento}
                  onChange={handleChange}
                  options={tipoDocumentoOptions}
                />

                <InputField
                  label="Número documento"
                  name="numeroDocumento"
                  value={form.numeroDocumento}
                  onChange={handleChange}
                />
              </>
            )}

            <SelectField
              label="Trámite"
              name="tramite"
              value={form.tramite}
              onChange={handleChange}
              options={tramitesMock}
            />

            <SelectField
              label="Clasificación"
              name="clasificacion"
              value={form.clasificacion}
              onChange={handleChange}
              options={clasificacionMock}
            />

            <SelectField
              label="Tarifa a aplicar"
              name="tarifa"
              value={form.tarifa}
              onChange={handleChange}
              options={tarifasMock}
            />
          </div>

          <div className="mt-6">
            <button
              onClick={agregarTramite}
              className="bg-[#334155] hover:bg-slate-700 text-white px-5 py-2.5 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
            >
              Agregar trámite
            </button>
          </div>
        </div>

        {/* Tabla de trámites */}
        <div className="animate-slide-up" style={{ animationDelay: "0.2s" }}>
          <TramitesTable
            tramites={tramitesAgregados}
            onRemove={eliminarTramite}
          />
        </div>

        {/* Mensaje de error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl animate-slide-up">
            {error}
          </div>
        )}

        {/* Mensaje de éxito */}
        {mensaje && (
          <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-xl animate-slide-up">
            {mensaje}
          </div>
        )}

        {/* Botón Generar */}
        <div className="flex justify-end gap-3 animate-slide-up" style={{ animationDelay: "0.3s" }}>
          <button
            onClick={handleCrearTrabajo}
            disabled={loadingJob}
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-xl shadow-md transition-all duration-200 disabled:bg-slate-300 disabled:cursor-not-allowed hover:shadow-lg flex items-center gap-2"
          >
            {loadingJob ? <Loader2 className="w-5 h-5 animate-spin" /> : <Briefcase className="w-5 h-5" />}
            Crear trabajo
          </button>
          
          <button
            onClick={handleGenerar}
            disabled={loading}
            className="bg-[#00ABE4] hover:bg-[#0095C5] text-white px-6 py-3 rounded-xl shadow-md transition-all duration-200 disabled:bg-slate-300 disabled:cursor-not-allowed hover:shadow-lg"
          >
            {loading ? "Procesando..." : "Generar"}
          </button>
        </div>

        {/* Progreso del trabajo */}
        {jobActual && (
          <div className="animate-slide-up">
            <JobProgress 
              jobId={jobActual} 
              onClose={() => {
                setJobActual(null);
              }}
              onComplete={() => {}}
            />
          </div>
        )}
      </div>
    </div>
  );
}
