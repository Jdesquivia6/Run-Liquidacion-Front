import { ChevronLeft, ChevronRight } from "lucide-react";

const ITEMS_PER_PAGE = 15;

export default function Pagination({ currentPage, totalItems, onPageChange }) {
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  if (totalPages <= 1) return null;

  const from = (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const to = Math.min(currentPage * ITEMS_PER_PAGE, totalItems);

  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || Math.abs(i - currentPage) <= 1) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== -1) {
      pages.push(-1);
    }
  }

  const btnBase = "px-3 py-1.5 rounded-lg text-xs font-medium transition-all";
  const btnActive = "bg-[#00ABE4] text-white shadow-sm";
  const btnInactive = "text-[#64748b] hover:bg-slate-100";
  const btnDisabled = "text-[#cbd5e1] cursor-not-allowed";

  return (
    <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-4">
      <span className="text-xs text-[#64748b]">
        Mostrando {from}-{to} de {totalItems} item{totalItems !== 1 ? "s" : ""}
      </span>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`${btnBase} ${currentPage === 1 ? btnDisabled : btnInactive}`}
        >
          <ChevronLeft size={14} />
        </button>

        {pages.map((p, i) =>
          p === -1 ? (
            <span key={`ellipsis-${i}`} className="px-1 text-xs text-[#94a3b8]">...</span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`${btnBase} ${p === currentPage ? btnActive : btnInactive}`}
            >
              {p}
            </button>
          )
        )}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`${btnBase} ${currentPage === totalPages ? btnDisabled : btnInactive}`}
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
