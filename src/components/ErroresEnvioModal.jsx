
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle, X, RotateCcw, Loader2,
  Inbox, FileWarning, FileText
} from "lucide-react";

const TH =
  "whitespace-nowrap px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400";

const TD =
  "px-4 py-3 text-[12px] text-slate-700 dark:text-slate-300";

export default function ErroresEnvioModal({
  open,
  titulo,
  subtitulo,
  errores = [],
  cargando = false,
  error = null,
  etiquetaAnio = a => String(a),
  onCerrar,
  onReintentar = null
}) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5">

          {/* FONDO */}

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[#061527]/65 backdrop-blur-[3px]"
            onClick={onCerrar}
          />

          {/* MODAL */}

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="errores-envio-titulo"
            initial={{ opacity: 0, scale: 0.97, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 10 }}
            transition={{ duration: 0.2 }}
            className="
              relative flex max-h-[90dvh] w-full max-w-5xl
              flex-col overflow-hidden rounded-2xl
              border border-slate-200 bg-white
              shadow-[0_24px_80px_rgba(0,0,0,.25)]
              dark:border-slate-700 dark:bg-[#172539]
            "
          >

            {/* ======================================
                ENCABEZADO
            ====================================== */}

            <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 dark:border-slate-700 sm:px-6">

              <div className="flex min-w-0 items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400">
                  <AlertTriangle size={22} />
                </div>

                <div className="min-w-0">
                  <h3
                    id="errores-envio-titulo"
                    className="text-base font-extrabold text-slate-900 dark:text-slate-100 sm:text-lg"
                  >
                    {titulo || "Respuestas con error"}
                  </h3>

                  {subtitulo && (
                    <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                      {subtitulo}
                    </p>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={onCerrar}
                aria-label="Cerrar modal"
                title="Cerrar"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-[#111F32] dark:text-slate-300 dark:hover:bg-slate-700"
              >
                <X size={19} />
              </button>
            </div>

            {/* ======================================
                CUERPO
            ====================================== */}

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5">

              {/* CARGANDO */}

              {cargando ? (
                <div className="flex min-h-56 flex-col items-center justify-center gap-3 text-center">
                  <Loader2
                    size={28}
                    className="animate-spin text-[#00ABE4]"
                  />

                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    Cargando respuestas con error...
                  </p>
                </div>

              ) : error ? (

                /* ERROR DE CARGA */

                <div
                  role="alert"
                  className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-500/20 dark:bg-red-500/10"
                >
                  <AlertTriangle
                    size={19}
                    className="shrink-0 text-red-600 dark:text-red-400"
                  />

                  <p className="break-words text-sm leading-6 text-red-700 dark:text-red-300">
                    {error}
                  </p>
                </div>

              ) : errores.length === 0 ? (

                /* SIN ERRORES */

                <div className="flex min-h-56 flex-col items-center justify-center px-4 text-center">
                  <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 dark:bg-[#111F32] dark:text-slate-500">
                    <Inbox size={27} />
                  </div>

                  <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    No hay respuestas con error
                  </p>

                  <p className="mt-2 max-w-sm text-xs leading-5 text-slate-500 dark:text-slate-400">
                    Ninguna respuesta de este filtro fue rechazada por Contravenciones.
                  </p>
                </div>

              ) : (
                <>
                  {/* RESUMEN */}

                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-100 bg-red-50/70 px-4 py-3 dark:border-red-500/20 dark:bg-red-500/10">
                    <div className="flex min-w-0 items-start gap-2.5">
                      <FileWarning
                        size={18}
                        className="mt-0.5 shrink-0 text-red-600 dark:text-red-400"
                      />

                      <p className="text-xs leading-5 text-slate-600 dark:text-slate-300">
                        <span className="font-bold text-red-700 dark:text-red-400">
                          {errores.length} respuesta(s) rechazada(s).
                        </span>{" "}
                        Quedan pendientes de reenvío: vuelve al año y pulsa
                        «Enviar a Contravenciones».
                      </p>
                    </div>
                  </div>

                  {/* TABLA */}

                  <div className="w-full overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                    <table className="w-full min-w-[820px] border-collapse text-left">

                      <thead className="bg-slate-50 dark:bg-[#111F32]">
                        <tr>
                          <th className={TH}>Documento</th>
                          <th className={TH}>Tipo</th>
                          <th className={TH}>Año</th>
                          <th className={TH}>Intentos</th>
                          <th className={TH}>Último intento</th>
                          <th className={TH}>Motivo del rechazo</th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {errores.map((e, i) => (
                          <tr
                            key={`${e.numeroDocumento}-${e.anio}-${i}`}
                            className="align-top transition-colors hover:bg-slate-50/70 dark:hover:bg-[#20334A]"
                          >

                            {/* DOCUMENTO */}

                            <td className={TH === TD ? TD : `${TD} font-mono font-bold text-slate-900 dark:text-slate-100`}>
                              {e.numeroDocumento}
                            </td>

                            {/* TIPO */}

                            <td className={TD}>
                              {e.tipoDocumento || "—"}
                            </td>

                            {/* AÑO */}

                            <td className={`${TD} font-semibold`}>
                              {etiquetaAnio(e.anio)}
                            </td>

                            {/* INTENTOS */}

                            <td className={TD}>
                              <span className="inline-flex min-w-7 items-center justify-center rounded-lg border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] font-bold text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400">
                                {e.intentos}
                              </span>
                            </td>

                            {/* ÚLTIMO INTENTO */}

                            <td className={`${TD} whitespace-nowrap text-slate-500 dark:text-slate-400`}>
                              {e.ultimoIntento || "—"}
                            </td>

                            {/* MOTIVO */}

                            <td className={`${TD} min-w-[220px]`}>
                              <div className="flex items-start gap-2">
                                <AlertTriangle
                                  size={14}
                                  className="mt-0.5 shrink-0 text-red-500"
                                />

                                <span className="break-words leading-5 text-red-700 dark:text-red-300">
                                  {e.motivo}
                                </span>
                              </div>
                            </td>

                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>

            {/* ======================================
                PIE DE ACCIONES
            ====================================== */}

            <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/70 px-5 py-4 dark:border-slate-700 dark:bg-[#111F32] sm:px-6">

              <div className="hidden items-center gap-2 text-[11px] text-slate-400 dark:text-slate-500 sm:flex">
                <FileText size={14} />
                Gestión de respuestas
              </div>

              <div className="flex w-full flex-wrap items-center justify-end gap-2.5 sm:w-auto">

                <button
                  type="button"
                  onClick={onCerrar}
                  className="flex min-h-11 flex-1 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-[#172539] dark:text-slate-300 dark:hover:bg-slate-700 sm:flex-none"
                >
                  Cerrar
                </button>

                {onReintentar && (
                  <button
                    type="button"
                    onClick={onReintentar}
                    disabled={cargando}
                    className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[#00ABE4] px-5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-[#0095C5] disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
                  >
                    <RotateCcw size={16} />
                    Reintentar envío
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
