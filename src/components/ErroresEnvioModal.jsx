import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X, RotateCcw, Loader2, Inbox } from "lucide-react";

/**
 * Detalle de las respuestas que CONTRAVENCIONES rechazó.
 * Abre desde el contador "Con error" y conserva el reenvío del año
 * reutilizando el mismo modal de confirmación que el botón principal.
 */
export default function ErroresEnvioModal({
  open,
  titulo,
  subtitulo,
  errores = [],
  cargando = false,
  error = null,
  etiquetaAnio = (a) => String(a),
  onCerrar,
  onReintentar = null
}) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onCerrar}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            className="relative mx-4 flex max-h-[85vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 p-5">
              <div className="flex min-w-0 items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50">
                  <AlertTriangle size={20} className="text-red-500" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-[#1e293b]">
                    {titulo || "Respuestas con error"}
                  </h3>
                  {subtitulo && (
                    <p className="mt-0.5 text-xs text-[#64748b]">{subtitulo}</p>
                  )}
                </div>
              </div>
              <button
                onClick={onCerrar}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors hover:bg-slate-100"
              >
                <X size={18} className="text-[#64748b]" />
              </button>
            </div>

            {/* Body */}
            <div className="min-h-0 flex-1 overflow-auto p-5">
              {cargando ? (
                <div className="flex flex-col items-center justify-center gap-3 py-14 text-sm text-[#64748b]">
                  <Loader2 size={24} className="animate-spin text-[#7C3AED]" />
                  Cargando respuestas con error...
                </div>
              ) : error ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              ) : errores.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 py-14 text-center">
                  <Inbox size={32} className="text-slate-300" />
                  <p className="text-sm font-semibold text-[#1e293b]">
                    No hay respuestas con error
                  </p>
                  <p className="max-w-sm text-xs text-[#64748b]">
                    Ninguna respuesta de este filtro fue rechazada por Contravenciones.
                  </p>
                </div>
              ) : (
                <>
                  <p className="mb-3 text-xs text-[#64748b]">
                    {errores.length} respuesta(s) rechazada(s). Quedan pendientes de
                    reenvío: vuelve al año y pulsa «Enviar a Contravenciones».
                  </p>
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full min-w-[820px] border-collapse text-left text-sm">
                      <thead>
                        <tr className="bg-slate-50 text-[11px] uppercase tracking-wide text-[#64748b]">
                          <th className="px-3 py-2.5 font-semibold">Documento</th>
                          <th className="px-3 py-2.5 font-semibold">Tipo</th>
                          <th className="px-3 py-2.5 font-semibold">Año</th>
                          <th className="px-3 py-2.5 font-semibold">Intentos</th>
                          <th className="px-3 py-2.5 font-semibold">Último intento</th>
                          <th className="px-3 py-2.5 font-semibold">Motivo del rechazo</th>
                        </tr>
                      </thead>
                      <tbody>
                        {errores.map((e, i) => (
                          <tr
                            key={`${e.numeroDocumento}-${e.anio}-${i}`}
                            className="border-t border-slate-100 align-top hover:bg-slate-50/60"
                          >
                            <td className="px-3 py-2.5 font-mono text-[13px] font-semibold text-[#1e293b]">
                              {e.numeroDocumento}
                            </td>
                            <td className="px-3 py-2.5 text-[13px] text-[#1e293b]">
                              {e.tipoDocumento || "—"}
                            </td>
                            <td className="px-3 py-2.5 text-[13px] text-[#1e293b]">
                              {etiquetaAnio(e.anio)}
                            </td>
                            <td className="px-3 py-2.5">
                              <span className="inline-block rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-700">
                                {e.intentos}
                              </span>
                            </td>
                            <td className="whitespace-nowrap px-3 py-2.5 text-[12px] text-[#64748b]">
                              {e.ultimoIntento || "—"}
                            </td>
                            <td className="px-3 py-2.5 text-[12px] leading-snug text-red-700">
                              {e.motivo}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-100 bg-slate-50 p-5">
              <button
                onClick={onCerrar}
                className="rounded-xl px-5 py-2.5 text-sm font-medium text-[#64748b] transition-colors hover:bg-slate-200"
              >
                Cerrar
              </button>
              {onReintentar && (
                <button
                  onClick={onReintentar}
                  disabled={cargando}
                  className="flex items-center gap-2 rounded-xl bg-[#7C3AED] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_24px_-8px_rgba(124,58,237,0.35)] transition-colors hover:bg-[#6D28D9] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
                >
                  <RotateCcw size={15} />
                  Reintentar envío
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
