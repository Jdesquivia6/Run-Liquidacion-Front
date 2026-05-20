import { useState } from "react";
import toast from "react-hot-toast";
import StatusBadge from "./StatusBadge";
import { listarPlacasPendientes } from "../services/vehicleQueryApi";
import { motion as Motion } from "framer-motion";

import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Navigation } from "swiper/modules";

import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";

const PAGE_SIZE = 20;
const QUERY_LIMIT = 100;

function formatFechaColombia(fecha) {
  if (!fecha) return "N/D";
  const parsed = new Date(fecha);
  if (Number.isNaN(parsed.getTime())) return "N/D";
  return parsed.toLocaleString("es-CO", { timeZone: "America/Bogota" });
}

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
    <section className="bg-white rounded-3xl border border-[#e2e8f0] shadow-sm p-4 md:p-6 space-y-5">
      <Motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <div>
          <h2 className="text-xl font-bold text-[#1e293b]">
            {esModuloDatosVehiculo
              ? "Buscar placas listas para datos vehículo"
              : "Buscar placas pendientes por fecha"}
          </h2>

          <p className="text-sm text-[#64748b] mt-1">
            {esModuloDatosVehiculo
              ? "El sistema traerá placas que ya existen en propietario, SOAT y tecnomecánica, pero que aún no tienen datos del vehículo guardados."
              : "El sistema traerá máximo 100 placas pendientes por lote. Cuando finalice la consulta, podrás volver a cargar las siguientes pendientes del mismo rango."}
          </p>
        </div>
      </Motion.div>

      <Motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.1 }}
        className={`grid grid-cols-1 ${
          esModuloDatosVehiculo ? "md:grid-cols-3" : "md:grid-cols-4"
        } gap-4`}
      >
        <div>
          <label className="text-sm font-semibold text-[#1e293b]">
            Fecha inicio
          </label>
          <input
            type="date"
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
            className="mt-2 w-full rounded-2xl border border-[#cbd5e1] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#00ABE4] focus:border-[#00ABE4] transition-colors"
          />
        </div>

        <div>
          <label className="text-sm font-semibold text-[#1e293b]">
            Fecha fin
          </label>
          <input
            type="date"
            value={fechaFin}
            onChange={(e) => setFechaFin(e.target.value)}
            className="mt-2 w-full rounded-2xl border border-[#cbd5e1] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#00ABE4] focus:border-[#00ABE4] transition-colors"
          />
        </div>

        {!esModuloDatosVehiculo && (
          <div>
            <label className="text-sm font-semibold text-[#1e293b]">
              Estado
            </label>
            <select
              value={estado}
              onChange={(e) => setEstado(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-[#cbd5e1] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#00ABE4] focus:border-[#00ABE4] bg-white transition-colors"
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
            className="w-full bg-[#00ABE4] hover:bg-[#0095c7] disabled:bg-[#cbd5e1] text-white rounded-2xl px-5 py-3 font-semibold transition-colors"
          >
            {loading ? "Buscando..." : "Buscar lote"}
          </button>
        </div>
      </Motion.div>

      {placas.length > 0 && (
        <>
          <Motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: 0.2 }}
            className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3 bg-[#F8FAFC] rounded-2xl p-4"
          >
            <div>
              <p className="text-sm font-semibold text-[#1e293b]">
                Lote actual: {placas.length} placa(s)
              </p>
              <p className="text-xs text-[#64748b]">
                {seleccionadas.length} seleccionada(s). Límite máximo por consulta: {QUERY_LIMIT}.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={seleccionarTodas}
                className="px-4 py-2 rounded-xl bg-white border border-[#e2e8f0] text-[#1e293b] text-sm hover:bg-[#F8FAFC] transition-colors"
              >
                Seleccionar lote
              </button>

              <button
                onClick={limpiarSeleccion}
                className="px-4 py-2 rounded-xl bg-white border border-[#e2e8f0] text-[#1e293b] text-sm hover:bg-[#F8FAFC] transition-colors"
              >
                Limpiar
              </button>

              <button
                onClick={enviarAConsulta}
                className="px-4 py-2 rounded-xl bg-[#00ABE4] text-white text-sm hover:bg-[#0095c7] transition-colors"
              >
                {esModuloDatosVehiculo
                  ? "Consultar datos vehículo"
                  : "Consultar lote seleccionado"}
              </button>
            </div>
          </Motion.div>

          <Motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: 0.3 }}
            className="rounded-3xl border border-[#e2e8f0] p-4 bg-white"
          >
            <Swiper
              modules={[Pagination, Navigation]}
              pagination={{ 
                type: "progressbar",
                clickable: true
              }}
              navigation
              spaceBetween={16}
              slidesPerView={1}
              className="pb-10 [&_.swiper-pagination-progressbar-fill]:bg-[#00ABE4]"
            >
              {paginas.map((grupo, pageIndex) => (
                <SwiperSlide key={pageIndex}>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <h3 className="text-sm font-bold text-[#1e293b]">
                        Página {pageIndex + 1} de {totalPaginas}
                      </h3>

                      <span className="text-xs text-[#64748b]">
                        {grupo.length} placa(s)
                      </span>
                    </div>

                    <div className="overflow-x-auto rounded-2xl border border-[#e2e8f0]">
                      <table className="w-full text-sm">
                        <thead className="bg-[#F8FAFC] text-[#64748b]">
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
                                className="border-t border-[#e2e8f0] hover:bg-[#F8FAFC] transition-colors"
                              >
                                <td className="p-3">
                                  <input
                                    type="checkbox"
                                    checked={seleccionadas.includes(item.placa)}
                                    onChange={() => toggleSeleccion(item.placa)}
                                    className="w-4 h-4 rounded border-[#cbd5e1] text-[#00ABE4] focus:ring-[#00ABE4]"
                                  />
                                </td>

                                <td className="p-3 font-bold text-[#1e293b]">
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

                                <td className="p-3 text-[#64748b]">
                                  {formatFechaColombia(fechaPrincipal)}
                                </td>

                                <td className="p-3 text-[#64748b]">
                                  {esModuloDatosVehiculo ? (
                                    <StatusBadge status="warning">
                                      Sin datos vehículo
                                    </StatusBadge>
                                  ) : consultada && item.fecha_consulta ? (
                                    formatFechaColombia(item.fecha_consulta)
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
          </Motion.div>
        </>
      )}
    </section>
  );
}
