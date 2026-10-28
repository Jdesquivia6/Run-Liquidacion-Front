
import { useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Navigation } from "swiper/modules";
import {
  FileText, ChevronLeft, ChevronRight,
  Files, Hash
} from "lucide-react";

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

export default function DocumentosSwiper({
  documentos = []
}) {
  const [swiper, setSwiper] = useState(null);
  const [paginaActual, setPaginaActual] = useState(0);

  if (!documentos.length) return null;

  const pages = groupByPage(documentos, PAGE_SIZE);
  const totalPaginas = pages.length;

  const pagina = Math.min(paginaActual, totalPaginas - 1);
  const desde = pagina * PAGE_SIZE + 1;
  const hasta = Math.min((pagina + 1) * PAGE_SIZE, documentos.length);

  return (
    <div className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-[#172539]">

      {/* ENCABEZADO */}

      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 dark:border-slate-700">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-[#0095C5] dark:bg-sky-500/10 dark:text-sky-400">
            <Files size={18} />
          </div>

          <div>
            <h3 className="text-[13px] font-bold text-slate-800 dark:text-slate-100">
              Documentos
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {documentos.length} registros encontrados
            </p>
          </div>
        </div>

        {/* NAVEGACIÓN */}

        <div className="flex items-center gap-1.5">
          <span className="mr-1 text-[11px] font-semibold tabular-nums text-slate-500 dark:text-slate-400">
            {pagina + 1} / {totalPaginas}
          </span>

          <button
            type="button"
            onClick={() => swiper?.slidePrev()}
            disabled={pagina === 0}
            aria-label="Página anterior de documentos"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-colors hover:border-sky-300 hover:text-[#0095C5] disabled:cursor-not-allowed disabled:opacity-35 dark:border-slate-700 dark:bg-[#111F32] dark:text-slate-300"
          >
            <ChevronLeft size={18} />
          </button>

          <button
            type="button"
            onClick={() => swiper?.slideNext()}
            disabled={pagina === totalPaginas - 1}
            aria-label="Página siguiente de documentos"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-colors hover:border-sky-300 hover:text-[#0095C5] disabled:cursor-not-allowed disabled:opacity-35 dark:border-slate-700 dark:bg-[#111F32] dark:text-slate-300"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* CARRUSEL */}

      <div className="min-w-0 p-3 sm:p-4">
        <Swiper
          modules={[Pagination, Navigation]}
          onSwiper={setSwiper}
          onSlideChange={s => setPaginaActual(s.activeIndex)}
          pagination={false}
          navigation={false}
          spaceBetween={12}
          slidesPerView={1}
          watchOverflow
          className="min-w-0"
        >
          {pages.map((page, pageIndex) => (
            <SwiperSlide key={pageIndex}>
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                <table className="w-full min-w-[380px] border-collapse text-left">

                  <thead className="bg-slate-50 dark:bg-[#111F32]">
                    <tr>
                      <th className="w-14 px-3 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        #
                      </th>

                      <th className="px-3 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Tipo documento
                      </th>

                      <th className="px-3 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Número documento
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {page.map((doc, i) => {
                      const globalIndex = pageIndex * PAGE_SIZE + i + 1;

                      return (
                        <tr
                          key={i}
                          className="transition-colors hover:bg-sky-50/40 dark:hover:bg-[#20334A]"
                        >
                          <td className="px-3 py-2.5">
                            <span className="inline-flex min-w-7 items-center justify-center rounded-lg bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-500 dark:bg-slate-700 dark:text-slate-300">
                              {globalIndex}
                            </span>
                          </td>

                          <td className="px-3 py-2.5">
                            <div className="flex items-center gap-2">
                              <FileText
                                size={15}
                                className="shrink-0 text-[#0095C5] dark:text-sky-400"
                              />

                              <span className="text-xs font-medium text-slate-700 dark:text-slate-200">
                                {doc.tipo}
                              </span>
                            </div>
                          </td>

                          <td className="px-3 py-2.5">
                            <span className="inline-flex items-center gap-1.5 break-all font-mono text-xs font-semibold text-slate-800 dark:text-slate-100">
                              <Hash
                                size={13}
                                className="shrink-0 text-slate-400"
                              />
                              {doc.numero}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* CONTADOR ORIGINAL POR PÁGINA */}

              <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                <FileText size={13} className="text-[#0095C5]" />

                <span>
                  Página {pageIndex + 1} de {totalPaginas}
                  {" — "}
                  Registros {pageIndex * PAGE_SIZE + 1}–
                  {Math.min((pageIndex + 1) * PAGE_SIZE, documentos.length)}
                  {" "}de {documentos.length}
                </span>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      {/* PROGRESO DE PAGINACIÓN */}

      <div className="border-t border-slate-100 px-4 py-3 dark:border-slate-700">
        <div className="mb-2 flex items-center justify-between text-[11px]">
          <span className="text-slate-500 dark:text-slate-400">
            Mostrando {desde}–{hasta} de {documentos.length}
          </span>

          <span className="font-bold tabular-nums text-[#0095C5] dark:text-sky-400">
            {Math.round(((pagina + 1) / totalPaginas) * 100)}%
          </span>
        </div>

        <div
          role="progressbar"
          aria-label="Progreso de navegación de documentos"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(((pagina + 1) / totalPaginas) * 100)}
          className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700"
        >
          <div
            className="h-full rounded-full bg-[#00ABE4] transition-[width] duration-300"
            style={{
              width: `${((pagina + 1) / totalPaginas) * 100}%`
            }}
          />
        </div>
      </div>
    </div>
  );
}
