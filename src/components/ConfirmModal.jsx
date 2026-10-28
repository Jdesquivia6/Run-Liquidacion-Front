
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X, Loader2 } from "lucide-react";

export default function ConfirmModal({
  open,
  title,
  message,
  confirmText = "Eliminar",
  onConfirm,
  onCancel,
  loading = false
}) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">

          {/* FONDO ORIGINAL */}

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[#061527]/65 backdrop-blur-[3px]"
            onClick={onCancel}
          />

          {/* MODAL */}

          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-modal-title"
            aria-describedby="confirm-modal-message"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            className="
              relative w-full max-w-[430px]
              overflow-hidden rounded-2xl
              border border-slate-200 bg-white
              shadow-[0_24px_70px_rgba(0,0,0,0.25)]
              dark:border-slate-700 dark:bg-[#172539]
            "
          >

            {/* ==========================================
                ENCABEZADO
            ========================================== */}

            <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-700">

              <div className="flex min-w-0 items-center gap-3">

                {/* ÍCONO DE ALERTA */}

                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-red-100 bg-red-50 text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
                  <AlertTriangle size={22} strokeWidth={1.9} />
                </div>

                {/* TÍTULO */}

                <div className="min-w-0">
                  <p className="mb-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400 dark:text-slate-500">
                    Confirmación requerida
                  </p>

                  <h3
                    id="confirm-modal-title"
                    className="break-words text-[16px] font-bold leading-5 text-slate-900 dark:text-slate-100"
                  >
                    {title}
                  </h3>
                </div>
              </div>

              {/* CERRAR */}

              <button
                type="button"
                onClick={onCancel}
                aria-label="Cerrar confirmación"
                title="Cerrar"
                className="
                  flex h-9 w-9 shrink-0 items-center justify-center
                  rounded-xl text-slate-400 transition-colors
                  hover:bg-slate-100 hover:text-slate-700
                  dark:text-slate-400 dark:hover:bg-slate-700
                  dark:hover:text-slate-100
                "
              >
                <X size={19} />
              </button>
            </div>

            {/* ==========================================
                MENSAJE
            ========================================== */}

            <div className="px-5 py-5">
              <p
                id="confirm-modal-message"
                className="break-words text-[13px] leading-6 text-slate-600 dark:text-slate-300"
              >
                {message}
              </p>
            </div>

            {/* ==========================================
                BOTONES
            ========================================== */}

            <div className="flex flex-wrap items-center justify-end gap-2.5 border-t border-slate-100 bg-slate-50/70 px-5 py-4 dark:border-slate-700 dark:bg-[#111F32]">

              {/* CANCELAR */}

              <button
                type="button"
                onClick={onCancel}
                disabled={loading}
                className="
                  inline-flex min-h-11 flex-1 items-center justify-center
                  rounded-xl border border-slate-200
                  bg-white px-4 text-xs font-semibold
                  text-slate-600 transition-colors
                  hover:bg-slate-100
                  disabled:cursor-not-allowed disabled:opacity-50
                  dark:border-slate-700 dark:bg-[#172539]
                  dark:text-slate-300 dark:hover:bg-slate-700
                  sm:flex-none
                "
              >
                Cancelar
              </button>

              {/* CONFIRMAR */}

              <button
                type="button"
                onClick={onConfirm}
                disabled={loading}
                className="
                  inline-flex min-h-11 flex-1 items-center justify-center
                  gap-2 rounded-xl bg-red-600
                  px-5 text-xs font-bold text-white
                  shadow-sm transition-colors
                  hover:bg-red-700
                  disabled:cursor-not-allowed disabled:opacity-50
                  sm:flex-none
                "
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Eliminando...
                  </>
                ) : (
                  confirmText
                )}
              </button>
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
