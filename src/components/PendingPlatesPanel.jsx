import { useState } from "react";
import toast from "react-hot-toast";
import StatusBadge from "./StatusBadge";
import { listarPlacasPendientes } from "../services/vehicleQueryApi";

import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Navigation } from "swiper/modules";

import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";

const PAGE_SIZE = 20;
const QUERY_LIMIT = 100;

export default function PendingPlatesPanel({
  modulo = "consulta-placa",
  onSendToQuery,
  onAfterBatchCompleted
}) {
  const today = new Date().toISOString().slice(0, 10);

  const [fechaInicio, setFechaInicio] = useState(today);
  const [fechaFin, setFechaFin] = useState(today);
  const [estado, setEstado] = useState("pendientes");
  const [placas, setPlacas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [seleccionadas, setSeleccionadas] = useState([]);

  const esModuloDatosVehiculo = modulo === "datos-vehiculo";

  const buscarPlacas = async () => {
    try {
      setLoading(true);

      const resp = await listarPlacasPendientes({
        fechaInicio,
        fechaFin,
        estado,
        modulo,
        limit: QUERY_LIMIT
      });

      const data = resp.results || [];

      setPlacas(data);
      setSeleccionadas(data.map((item) => item.placa));

      toast.success(
        `Se cargaron ${data.length} placa(s). Máximo ${QUERY_LIMIT} por lote.`
      );
    } catch (error) {
      toast.error(error.response?.data?.error || "Error cargando placas");
    } finally {
      setLoading(false);
    }
  };

  const refrescarPendientes = async () => {
    await buscarPlacas();

    if (onAfterBatchCompleted) {
      onAfterBatchCompleted();
    }
  };

  const toggleSeleccion = (placa) => {
    setSeleccionadas((prev) =>
      prev.includes(placa)
        ? prev.filter((p) => p !== placa)
        : [...prev, placa]
    );
  };

  const seleccionarTodas = () => {
    setSeleccionadas(placas.map((item) => item.placa));
  };

  const limpiarSeleccion = () => {
    setSeleccionadas([]);
  };

  const enviarAConsulta = () => {
    if (seleccionadas.length === 0) {
      toast.error("Debes seleccionar al menos una placa");
      return;
    }

    if (seleccionadas.length > QUERY_LIMIT) {
      toast.error(`Solo puedes enviar máximo ${QUERY_LIMIT} placas por consulta`);
      return;
    }

    onSendToQuery({
      placas: seleccionadas,
      refrescarPendientes
    });
  };

  const totalPaginas = Math.ceil(placas.length / PAGE_SIZE);

  const paginas = Array.from({ length: totalPaginas }, (_, index) => {
    const start = index * PAGE_SIZE;
    const end = start + PAGE_SIZE;

    return placas.slice(start, end);
  });

  return (
    <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 md:p-6 space-y-5">
      <div>
        <h2 className="text-xl font-bold text-slate-800">
          {esModuloDatosVehiculo
            ? "Buscar placas listas para datos vehículo"
            : "Buscar placas pendientes por fecha"}
        </h2>

        <p className="text-sm text-slate-500 mt-1">
          {esModuloDatosVehiculo
            ? "El sistema traerá placas que ya existen en propietario, SOAT y tecnomecánica, pero que aún no tienen datos del vehículo guardados."
            : "El sistema traerá máximo 100 placas pendientes por lote. Cuando finalice la consulta, podrás volver a cargar las siguientes pendientes del mismo rango."}
        </p>
      </div>

      <div
        className={`grid grid-cols-1 ${
          esModuloDatosVehiculo ? "md:grid-cols-3" : "md:grid-cols-4"
        } gap-4`}
      >
        <div>
          <label className="text-sm font-semibold text-slate-700">
            Fecha inicio
          </label>
          <input
            type="date"
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
            className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="text-sm font-semibold text-slate-700">
            Fecha fin
          </label>
          <input
            type="date"
            value={fechaFin}
            onChange={(e) => setFechaFin(e.target.value)}
            className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {!esModuloDatosVehiculo && (
          <div>
            <label className="text-sm font-semibold text-slate-700">
              Estado
            </label>
            <select
              value={estado}
              onChange={(e) => setEstado(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="pendientes">Pendientes</option>
              <option value="consultadas">Consultadas</option>
              <option value="todas">Todas</option>
            </select>
          </div>
        )}

        <div className="flex items-end">
          <button
            onClick={buscarPlacas}
            disabled={loading}
            className="w-full bg-slate-900 hover:bg-blue-700 disabled:bg-slate-400 text-white rounded-2xl px-5 py-3 font-semibold transition"
          >
            {loading ? "Buscando..." : "Buscar lote"}
          </button>
        </div>
      </div>

      {placas.length > 0 && (
        <>
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3 bg-slate-50 rounded-2xl p-4">
            <div>
              <p className="text-sm font-semibold text-slate-700">
                Lote actual: {placas.length} placa(s)
              </p>
              <p className="text-xs text-slate-500">
                {seleccionadas.length} seleccionada(s). Límite máximo por consulta: {QUERY_LIMIT}.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={seleccionarTodas}
                className="px-4 py-2 rounded-xl bg-white border text-sm hover:bg-slate-100"
              >
                Seleccionar lote
              </button>

              <button
                onClick={limpiarSeleccion}
                className="px-4 py-2 rounded-xl bg-white border text-sm hover:bg-slate-100"
              >
                Limpiar
              </button>

              <button
                onClick={enviarAConsulta}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm hover:bg-blue-700"
              >
                {esModuloDatosVehiculo
                  ? "Consultar datos vehículo"
                  : "Consultar lote seleccionado"}
              </button>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 p-4 bg-white">
            <Swiper
              modules={[Pagination, Navigation]}
              pagination={{ type: "progressbar" }}
              navigation
              spaceBetween={16}
              slidesPerView={1}
              className="pb-10"
            >
              {paginas.map((grupo, pageIndex) => (
                <SwiperSlide key={pageIndex}>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <h3 className="text-sm font-bold text-slate-700">
                        Página {pageIndex + 1} de {totalPaginas}
                      </h3>

                      <span className="text-xs text-slate-500">
                        {grupo.length} placa(s)
                      </span>
                    </div>

                    <div className="overflow-x-auto rounded-2xl border border-slate-200">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50 text-slate-500">
                          <tr>
                            <th className="p-3 text-left">Seleccionar</th>
                            <th className="p-3 text-left">Placa</th>
                            <th className="p-3 text-left">Estado</th>
                            <th className="p-3 text-left">
                              {esModuloDatosVehiculo
                                ? "Fecha propietario"
                                : "Fecha registro"}
                            </th>
                            <th className="p-3 text-left">
                              {esModuloDatosVehiculo
                                ? "Datos vehículo"
                                : "Fecha consulta"}
                            </th>
                          </tr>
                        </thead>

                        <tbody>
                          {grupo.map((item) => {
                            const consultada = item.estado_consulta === true;

                            const fechaPrincipal = esModuloDatosVehiculo
                              ? item.fecha_consulta_propietario
                              : item.fecha_registro;

                            return (
                              <tr
                                key={item.id_consul_placa}
                                className="border-t hover:bg-slate-50"
                              >
                                <td className="p-3">
                                  <input
                                    type="checkbox"
                                    checked={seleccionadas.includes(item.placa)}
                                    onChange={() => toggleSeleccion(item.placa)}
                                  />
                                </td>

                                <td className="p-3 font-bold text-slate-800">
                                  {item.placa}
                                </td>

                                <td className="p-3">
                                  <StatusBadge
                                    status={
                                      esModuloDatosVehiculo
                                        ? "info"
                                        : consultada
                                          ? "success"
                                          : "warning"
                                    }
                                  >
                                    {esModuloDatosVehiculo
                                      ? "Lista para datos"
                                      : consultada
                                        ? "Consultada"
                                        : "Pendiente"}
                                  </StatusBadge>
                                </td>

                                <td className="p-3 text-slate-500">
                                  {fechaPrincipal
                                    ? new Date(fechaPrincipal).toLocaleString()
                                    : "N/D"}
                                </td>

                                <td className="p-3 text-slate-500">
                                  {esModuloDatosVehiculo ? (
                                    <StatusBadge status="warning">
                                      Sin datos vehículo
                                    </StatusBadge>
                                  ) : consultada && item.fecha_consulta ? (
                                    new Date(item.fecha_consulta).toLocaleString()
                                  ) : (
                                    "Sin consultar"
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </>
      )}
    </section>
  );
}