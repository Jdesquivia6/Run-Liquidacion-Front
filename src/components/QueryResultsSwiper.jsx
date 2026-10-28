
import { useRef, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Navigation } from "swiper/modules";
import { motion as Motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight, Layers3, CarFront } from "lucide-react";
import QueryCard from "./QueryCard";

import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";

export default function QueryResultsSwiper({
  resultados = [],
  onViewDetail
}) {
  const swiperRef = useRef(null);
  const reduceMotion = useReducedMotion();

  const [activeIndex, setActiveIndex] = useState(0);
  const [visibleSlides, setVisibleSlides] = useState(1);

  const total = resultados.length;

  if (!total) return null;

  const ultimaPosicion = Math.max(0, total - visibleSlides);
  const progreso = total <= visibleSlides
    ? 100
    : Math.min(100, ((activeIndex + visibleSlides) / total) * 100);

  const anteriorDisponible = activeIndex > 0;
  const siguienteDisponible = activeIndex < ultimaPosicion;

  const actualizarSwiper = swiper => {
    if (!swiper || swiper.destroyed) return;

    setActiveIndex(swiper.activeIndex);
    setVisibleSlides(
      Math.max(1, Math.ceil(Number(swiper.params.slidesPerView) || 1))
    );
  };

  return (
    <section className="min-w-0 space-y-3">

      {/* ==========================================
          ENCABEZADO Y CONTROLES
      ========================================== */}

      <Motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="flex flex-wrap items-center justify-between gap-3"
      >
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-[#0095C5] dark:bg-sky-400/10 dark:text-sky-400">
            <Layers3 size={20} />
          </div>

          <div className="min-w-0">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 sm:text-base">
              Resultados del lote
            </h3>

            <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
              {total} {total === 1 ? "consulta registrada" : "consultas registradas"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* CONTADOR */}

          <span className="mr-1 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-[11px] font-bold tabular-nums text-slate-600 dark:border-slate-700 dark:bg-[#172539] dark:text-slate-300">
            {Math.min(activeIndex + 1, total)}–{Math.min(activeIndex + visibleSlides, total)}
            <span className="mx-1 text-slate-400">/</span>
            {total}
          </span>

          {/* FLECHA ANTERIOR */}

          <button
            type="button"
            onClick={() => swiperRef.current?.slidePrev()}
            disabled={!anteriorDisponible}
            aria-label="Ver resultados anteriores"
            title="Anterior"
            className="flex h-10 w-10 shrink-0 touch-manipulation items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-colors hover:border-sky-300 hover:text-[#0095C5] disabled:cursor-not-allowed disabled:opacity-35 dark:border-slate-700 dark:bg-[#172539] dark:text-slate-200 dark:hover:text-sky-400"
          >
            <ChevronLeft size={19} />
          </button>

          {/* FLECHA SIGUIENTE */}

          <button
            type="button"
            onClick={() => swiperRef.current?.slideNext()}
            disabled={!siguienteDisponible}
            aria-label="Ver resultados siguientes"
            title="Siguiente"
            className="flex h-10 w-10 shrink-0 touch-manipulation items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-colors hover:border-sky-300 hover:text-[#0095C5] disabled:cursor-not-allowed disabled:opacity-35 dark:border-slate-700 dark:bg-[#172539] dark:text-slate-200 dark:hover:text-sky-400"
          >
            <ChevronRight size={19} />
          </button>
        </div>
      </Motion.div>

      {/* ==========================================
          CARRUSEL DE RESULTADOS
      ========================================== */}

      <div className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-[#172539] sm:p-4">

        <Swiper
          modules={[Pagination, Navigation]}
          onSwiper={swiper => {
            swiperRef.current = swiper;
            actualizarSwiper(swiper);
          }}
          onSlideChange={actualizarSwiper}
          onBreakpoint={actualizarSwiper}
          onResize={actualizarSwiper}
          pagination={false}
          navigation={false}
          spaceBetween={12}
          slidesPerView={1}
          watchOverflow
          breakpoints={{
            640: { slidesPerView: 1 },
            768: { slidesPerView: 2 },
            1280: { slidesPerView: 3 },
            1536: { slidesPerView: 4 }
          }}
          className="[&_.swiper-wrapper]:items-stretch"
        >
          {resultados.map((item, index) => (
            <SwiperSlide
              key={`${item.placa}-${index}`}
              className="!h-auto py-1"
            >
              <div className="h-full min-w-0">
                <QueryCard
                  item={item}
                  onViewDetail={onViewDetail}
                />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>

        {/* ==========================================
            PROGRESO INFERIOR
        ========================================== */}

        <div className="mt-4 border-t border-slate-100 pt-3 dark:border-slate-700">
          <div className="mb-2 flex items-center justify-between gap-3">
            <span className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
              <CarFront size={14} className="text-[#0095C5] dark:text-sky-400" />
              Navegación de resultados
            </span>

            <span className="text-[11px] font-semibold tabular-nums text-slate-600 dark:text-slate-300">
              {Math.round(progreso)}%
            </span>
          </div>

          <div
            role="progressbar"
            aria-label="Progreso de navegación del lote"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progreso)}
            className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700"
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#00ABE4] to-[#0095C5] transition-[width] duration-300"
              style={{ width: `${progreso}%` }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
