
import { FileJson, X, CarFront, Braces } from "lucide-react";

export default function DetailModal({ open, item, onClose }) {
  if (!open || !item) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#061527]/70 p-3 backdrop-blur-[3px] sm:p-5">

      {/* MODAL */}

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="detail-modal-title"
        className="
          animate-modal-in flex w-full max-w-3xl
          max-h-[90dvh] flex-col overflow-hidden
          rounded-2xl border border-slate-200
          bg-white shadow-[0_24px_80px_rgba(0,0,0,0.25)]
          dark:border-slate-700 dark:bg-[#172539]
        "
      >

        {/* ==========================================
            ENCABEZADO
        ========================================== */}

        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-100 px-4 py-4 dark:border-slate-700 sm:px-5">

          <div className="flex min-w-0 items-center gap-3">

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-[#0095C5] dark:bg-sky-500/10 dark:text-sky-400">
              <FileJson size={22} />
            </div>

            <div className="min-w-0">

              <h2
                id="detail-modal-title"
                className="text-base font-bold text-slate-900 dark:text-slate-100 sm:text-lg"
              >
                Detalle de consulta
              </h2>

              <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                <CarFront size={14} />

                <span>Placa:</span>

                <span className="font-mono font-bold tracking-wide text-[#0095C5] dark:text-sky-400">
                  {item.placa}
                </span>
              </div>

            </div>
          </div>

          {/* CERRAR */}

          <button
            type="button"
            onClick={onClose}
            title="Cerrar detalle"
            aria-label="Cerrar detalle de consulta"
            className="
              flex h-10 w-10 shrink-0 items-center justify-center
              rounded-xl border border-slate-200
              bg-white text-slate-500
              transition-colors hover:bg-slate-100
              hover:text-slate-800
              dark:border-slate-700 dark:bg-[#111F32]
              dark:text-slate-400 dark:hover:bg-slate-700
              dark:hover:text-white
            "
          >
            <X size={19} />
          </button>
        </div>

        {/* ==========================================
            CUERPO DEL MODAL
        ========================================== */}

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5">

          <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">

            {/* ENCABEZADO DEL JSON */}

            <div className="flex items-center justify-between gap-3 border-b border-[#334155] bg-[#172539] px-4 py-2.5">

              <div className="flex items-center gap-2">
                <Braces size={16} className="text-sky-400" />

                <span className="text-xs font-semibold text-slate-200">
                  Respuesta de la consulta
                </span>
              </div>

              <span className="rounded-md border border-slate-600 bg-[#111F32] px-2 py-0.5 text-[10px] font-bold text-sky-300">
                JSON
              </span>

            </div>

            {/* DATOS ORIGINALES */}

            <pre
              className="
                max-h-[60dvh] overflow-auto
                bg-[#111F32] p-4
                font-mono text-[12px] leading-6
                text-[#E9F1FA]
                sm:p-5 sm:text-[13px]
              "
            >
              {JSON.stringify(item, null, 2)}
            </pre>

          </div>

        </div>

        {/* ==========================================
            PIE DEL MODAL
        ========================================== */}

        <div className="flex shrink-0 items-center justify-end border-t border-slate-100 bg-slate-50/70 px-4 py-3 dark:border-slate-700 dark:bg-[#111F32] sm:px-5">

          <button
            type="button"
            onClick={onClose}
            className="
              inline-flex min-h-10 items-center justify-center
              rounded-xl bg-[#00ABE4] px-5
              text-xs font-bold text-white
              transition-colors hover:bg-[#0095C5]
            "
          >
            Cerrar detalle
          </button>

        </div>

      </div>
    </div>
  );
}
