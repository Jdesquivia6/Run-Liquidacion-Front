import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Navigation } from "swiper/modules";
import { FileText } from "lucide-react";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";

const PAGE_SIZE = 10;

function groupByPage(documentos, pageSize) {
  const groups = [];
  for (let i = 0; i < documentos.length; i += pageSize) {
    groups.push(documentos.slice(i, i + pageSize));
  }
  return groups;
}

export default function DocumentosSwiper({ documentos = [] }) {
  if (!documentos.length) return null;

  const pages = groupByPage(documentos, PAGE_SIZE);

  return (
    <div className="bg-slate-50 rounded-xl p-4">
      <Swiper
        modules={[Pagination, Navigation]}
        pagination={{ type: "progressbar" }}
        navigation
        spaceBetween={12}
        slidesPerView={1}
        className="[&_.swiper-button-next]:!text-[#00ABE4] [&_.swiper-button-prev]:!text-[#00ABE4] [&_.swiper-pagination-progressbar-fill]:!bg-[#00ABE4]"
      >
        {pages.map((page, pageIndex) => (
          <SwiperSlide key={pageIndex}>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="py-2 px-2 text-left text-[#64748b] font-semibold w-8">#</th>
                  <th className="py-2 px-2 text-left text-[#64748b] font-semibold">Tipo documento</th>
                  <th className="py-2 px-2 text-left text-[#64748b] font-semibold">Número documento</th>
                </tr>
              </thead>
              <tbody>
                {page.map((doc, i) => {
                  const globalIndex = pageIndex * PAGE_SIZE + i + 1;
                  return (
                    <tr key={i} className="border-t border-slate-100">
                      <td className="py-2 px-2 text-[#94a3b8]">{globalIndex}</td>
                      <td className="py-2 px-2 font-medium text-[#1e293b]">{doc.tipo}</td>
                      <td className="py-2 px-2 font-mono text-[#1e293b]">{doc.numero}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="flex items-center gap-1 mt-2 text-xs text-[#94a3b8]">
              <FileText className="w-3 h-3" />
              <span>Página {pageIndex + 1} de {pages.length} — Registros {pageIndex * PAGE_SIZE + 1}–{Math.min((pageIndex + 1) * PAGE_SIZE, documentos.length)} de {documentos.length}</span>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
