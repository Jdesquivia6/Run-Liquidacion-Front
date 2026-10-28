
import { ChevronLeft, ChevronRight } from "lucide-react";

const ITEMS_PER_PAGE = 15;

const BTN =
  "inline-flex h-10 min-w-10 shrink-0 touch-manipulation items-center justify-center rounded-xl border text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00ABE4]/40";

const ACTIVE =
  "border-[#00ABE4] bg-[#00ABE4] text-white shadow-sm shadow-sky-500/20";

const INACTIVE =
  "border-transparent bg-white text-slate-600 hover:border-sky-200 hover:bg-sky-50 hover:text-[#0095C5] dark:bg-[#172539] dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-[#20334A]";

const DISABLED =
  "cursor-not-allowed border-transparent bg-slate-50 text-slate-300 dark:bg-[#111F32] dark:text-slate-600";

export default function Pagination({
  currentPage,
  totalItems,
  onPageChange
}) {
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  if (totalPages <= 1) return null;

  const from = (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const to = Math.min(currentPage * ITEMS_PER_PAGE, totalItems);

  // Conserva la paginación original con puntos suspensivos.
  const pages = [];

  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 ||
      i === totalPages ||
      Math.abs(i - currentPage) <= 1
    ) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== -1) {
      pages.push(-1);
    }
  }

  return (
    <nav
      aria-label="Paginación de resultados"
      className="
        mt-4 flex w-full min-w-0 flex-col
        gap-3 border-t border-slate-100 pt-4
        dark:border-slate-700
        sm:flex-row sm:items-center sm:justify-between
      "
    >
      {/* ==========================================
          INFORMACIÓN DE REGISTROS
      ========================================== */}

      <div className="flex min-w-0 flex-wrap items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
        <span>Mostrando</span>

        <span className="font-bold tabular-nums text-slate-800 dark:text-slate-100">
          {from}–{to}
        </span>

        <span>de</span>

        <span className="font-bold tabular-nums text-slate-800 dark:text-slate-100">
          {totalItems}
        </span>

        <span>
          {totalItems === 1 ? "registro" : "registros"}
        </span>
      </div>

      {/* ==========================================
          CONTROLES DE PAGINACIÓN
      ========================================== */}

      <div className="flex min-w-0 items-center gap-1.5 self-start sm:self-auto">

        {/* ANTERIOR */}

        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Página anterior"
          title="Anterior"
          className={`${BTN} ${
            currentPage === 1 ? DISABLED : INACTIVE
          }`}
        >
          <ChevronLeft size={18} />
        </button>

        {/* PÁGINAS */}

        <div className="flex min-w-0 items-center gap-1">
          {pages.map((page, index) =>
            page === -1 ? (
              <span
                key={`ellipsis-${index}`}
                aria-hidden="true"
                className="flex h-10 min-w-5 items-center justify-center text-xs font-semibold text-slate-400 dark:text-slate-500"
              >
                ...
              </span>
            ) : (
              <button
                key={page}
                type="button"
                onClick={() => onPageChange(page)}
                aria-label={`Ir a la página ${page}`}
                aria-current={
                  page === currentPage ? "page" : undefined
                }
                className={`${BTN} ${
                  page === currentPage ? ACTIVE : INACTIVE
                }`}
              >
                {page}
              </button>
            )
          )}
        </div>

        {/* SIGUIENTE */}

        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label="Página siguiente"
          title="Siguiente"
          className={`${BTN} ${
            currentPage === totalPages ? DISABLED : INACTIVE
          }`}
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </nav>
  );
}
