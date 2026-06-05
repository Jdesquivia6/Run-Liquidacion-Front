import { useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import StatusBadge from "./StatusBadge";

const PAGE_SIZE = 15;

function formatFechaColombia(fecha) {
  if (!fecha) return "—";
  const parsed = new Date(fecha);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleString("es-CO", { timeZone: "America/Bogota" });
}

export default function QueryHistoryTable({ data = [], onViewDetail }) {
  const totalPaginas = Math.ceil(data.length / PAGE_SIZE);
  const paginas = Array.from({ length: totalPaginas }, (_, i) =>
    data.slice(i * PAGE_SIZE, (i + 1) * PAGE_SIZE)
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
      <h2 className="text-lg font-bold text-[#1e293b] mb-4">
        Historial de consultas
      </h2>

      {data.length === 0 ? (
        <p className="py-8 text-center text-[#64748b]">
          No hay consultas registradas
        </p>
      ) : (
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
                    {grupo.length} registro(s)
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead>
                      <tr className="border-b text-[#64748b]">
                        <th className="py-3">Placa</th>
                        <th>Estado</th>
                        <th>Resultado</th>
                        <th>Fecha</th>
                        <th>Detalle</th>
                      </tr>
                    </thead>

                    <tbody>
                      {grupo.map((item, index) => (
                        <tr key={index} className="border-b hover:bg-[#F8FAFC]">
                          <td className="py-3 font-bold text-[#1e293b]">
                            {item.placa}
                          </td>
                          <td>
                            <StatusBadge
                              status={item.ok ? "success" : "error"}
                            >
                              {item.ok ? "Exitosa" : "Fallida"}
                            </StatusBadge>
                          </td>
                          <td className="text-[#64748b]">
                            {item.message || item.error || "Sin detalle"}
                          </td>
                          <td className="text-[#64748b]">
                            {formatFechaColombia(item.fecha)}
                          </td>
                          <td>
                            <button
                              onClick={() => onViewDetail(item)}
                              className="text-[#00ABE4] hover:text-[#0095C5] font-medium"
                            >
                              Ver detalle
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      )}
    </div>
  );
}
