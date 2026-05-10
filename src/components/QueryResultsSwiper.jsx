import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Navigation } from "swiper/modules";
import QueryCard from "./QueryCard";
import { motion as Motion } from "framer-motion";

import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";

export default function QueryResultsSwiper({ resultados = [], onViewDetail }) {
  if (!resultados.length) return null;

  return (
    <section className="space-y-4">
      <Motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="flex items-center justify-between"
      >
        <div>
          <h3 className="text-sm font-semibold text-[#1e293b]">
            Resultados del lote
          </h3>
          <p className="text-xs text-[#64748b]">
            Mostrando {resultados.length} consulta(s) en carrusel paginado
          </p>
        </div>
      </Motion.div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-4">
        <Swiper
          modules={[Pagination, Navigation]}
          pagination={{
            type: "progressbar"
          }}
          navigation
          spaceBetween={16}
          slidesPerView={1}
          breakpoints={{
            640: {
              slidesPerView: 1
            },
            768: {
              slidesPerView: 2
            },
            1280: {
              slidesPerView: 3
            },
            1536: {
              slidesPerView: 4
            }
          }}
          className="pb-10 [&_.swiper-button-next]:!text-[#00ABE4] [&_.swiper-button-prev]:!text-[#00ABE4] [&_.swiper-pagination-progressbar-fill]:!bg-[#00ABE4]"
        >
          {resultados.map((item, index) => (
            <SwiperSlide key={`${item.placa}-${index}`} className="py-8">
              <QueryCard item={item} onViewDetail={onViewDetail} />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
}