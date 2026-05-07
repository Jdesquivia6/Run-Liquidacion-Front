import { useEffect, useState } from "react";
import { consultarDatosVehiculoBatch, 
  listarHistorialVehiculos 
} from "../services/vehicleQueryApi";
import PendingPlatesPanel from "../components/PendingPlatesPanel";
import DetailModal from "../components/DetailModal";
import QueryHistoryTable from "../components/QueryHistoryTable";
import toast from "react-hot-toast";
import QueryResultsSwiper from "../components/QueryResultsSwiper";

export default function DatosVehiculo() {
  const [placas, setPlacas] = useState("");
  const [loading, setLoading] = useState(false);
  const [resultados, setResultados] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [error, setError] = useState("");
  const [detalle, setDetalle] = useState(null);
  const [refrescarPendientesActual, setRefrescarPendientesActual] = useState(null);

  const procesarPlacas = () => {
    return placas
      .split(/[\n,; ]+/)
      .map((p) => p.trim().toUpperCase())
      .filter(Boolean);
  };

  const cargarHistorial = async () => {
    try {
      const resp = await listarHistorialVehiculos("datos-vehiculo", 100);

      const data = (resp.results || []).map((item) => ({
        ok: true,
        placa: item.placa,
        message: "Datos del vehículo almacenados en base de datos",
        fecha: item.fecha_consulta,
        datos_vehiculo: {
          clase: item.clase,
          marca: item.marca,
          linea: item.linea,
          servicio: item.servicio,
          color: item.color,
          modelo: item.modelo
        },
        data: item.data
      }));

      setHistorial(data);
    }   catch (error) {
          console.error("Error cargando historial:", error.message);
      }
  };

  const cargarPlacasSeleccionadas = ({ placas: placasSeleccionadas, refrescarPendientes }) => {
    setPlacas(placasSeleccionadas.join("\n"));
    setRefrescarPendientesActual(() => refrescarPendientes);

    toast.success(
      `${placasSeleccionadas.length} placa(s) cargadas para consultar`
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };

  useEffect(() => {
    cargarHistorial();
  }, []);

  const handleConsultar = async () => {
    try {
      setLoading(true);
      setError("");

      const placasArray = procesarPlacas();

      if (placasArray.length === 0) {
        setError("Debe ingresar al menos una placa");
        return;
      }

      const resp = await consultarDatosVehiculoBatch(placasArray);
      const results = resp.results || [];

      setResultados(results);

      const exitosas = results.filter((r) => r.ok).length;
      const fallidas = results.filter((r) => !r.ok).length;

      toast.success(`Datos consultados: ${exitosas} exitosas, ${fallidas} fallidas`);

      await cargarHistorial();

      if (refrescarPendientesActual) {
        await refrescarPendientesActual();
      }
    } catch (err) {
      toast.error("Error consultando datos del vehículo");
      setError(err.response?.data?.error || err.message || "Error en la consulta");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">

      <PendingPlatesPanel
        modulo="datos-vehiculo"
        onSendToQuery={cargarPlacasSeleccionadas}
      />

      <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 md:p-6">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-bold text-slate-800">
              Datos del vehículo
            </h2>

            <p className="text-sm text-slate-500 mt-2">
              Consulta marca, línea, modelo, clase, servicio, color y datos básicos del vehículo.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full xl:w-auto">
            <div className="bg-blue-50 rounded-2xl p-4">
              <p className="text-xs text-blue-600">Total</p>
              <p className="text-2xl font-bold text-blue-700">{resultados.length}</p>
            </div>

            <div className="bg-emerald-50 rounded-2xl p-4">
              <p className="text-xs text-emerald-600">Exitosas</p>
              <p className="text-2xl font-bold text-emerald-700">
                {resultados.filter((r) => r.ok).length}
              </p>
            </div>

            <div className="bg-red-50 rounded-2xl p-4">
              <p className="text-xs text-red-600">Fallidas</p>
              <p className="text-2xl font-bold text-red-700">
                {resultados.filter((r) => !r.ok).length}
              </p>
            </div>

            <div className="bg-amber-50 rounded-2xl p-4">
              <p className="text-xs text-amber-600">Proceso</p>
              <p className="text-2xl font-bold text-amber-700">
                {loading ? "..." : "0"}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 xl:grid-cols-[1fr_auto] gap-4 items-end">
          <div>
            <label className="text-sm font-semibold text-slate-700">
              Placas a consultar
            </label>

            <textarea
              value={placas}
              onChange={(e) => setPlacas(e.target.value)}
              placeholder="Ejemplo: ABC123, EUP243, QHD596"
              className="
                mt-2 w-full min-h-32 rounded-2xl border border-slate-300
                px-4 py-3 text-sm resize-none
                focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500
              "
            />
          </div>

          <button
            onClick={handleConsultar}
            disabled={loading}
            className="
              w-full xl:w-60 h-12
              bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300
              text-white px-6 py-3 rounded-2xl shadow transition font-semibold
            "
          >
            {loading ? "Consultando..." : "Consultar datos"}
          </button>
        </div>

        {error && (
          <div className="mt-4 bg-red-50 text-red-700 rounded-2xl px-4 py-3 text-sm border border-red-100">
            {error}
          </div>
        )}
      </section>

      {loading && (
        <div className="bg-emerald-50 text-emerald-700 rounded-2xl p-5 border border-emerald-100 animate-pulse">
          Consultando datos del vehículo...
        </div>
      )}

      <QueryResultsSwiper
        resultados={resultados}
        onViewDetail={setDetalle}
      />

      <QueryHistoryTable data={historial} onViewDetail={setDetalle} />

      <DetailModal
        open={!!detalle}
        item={detalle}
        onClose={() => setDetalle(null)}
      />
    </div>
  );
}