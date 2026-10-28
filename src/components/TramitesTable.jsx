
import {
  Trash2,
  ClipboardList,
  FileText,
  Hash,
  ReceiptText,
  Inbox
} from "lucide-react";

export default function TramitesTable({
  tramites = [],
  onRemove
}) {
  const hayTramites = tramites.length > 0;

  return (
    <div className="w-full min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-[#172539]">

      {/* ==========================================
          ENCABEZADO
      ========================================== */}

      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-4 dark:border-slate-700 sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-[#0095C5] dark:bg-sky-400/10 dark:text-sky-400">
            <ClipboardList size={20} />
          </div>

          <div className="min-w-0">
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 sm:text-base">
              Trámites agregados
            </h2>

            <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
              Gestiona los trámites incluidos en la liquidación.
            </p>
          </div>
        </div>

        <span className="inline-flex items-center gap-1.5 rounded-lg border border-sky-100 bg-sky-50 px-3 py-1.5 text-xs font-bold text-[#0095C5] dark:border-sky-400/20 dark:bg-sky-400/10 dark:text-sky-300">
          <FileText size={14} />
          {tramites.length} {tramites.length === 1 ? "trámite" : "trámites"}
        </span>
      </div>

      {/* ==========================================
          ESTADO VACÍO
      ========================================== */}

      {!hayTramites ? (
        <div className="flex flex-col items-center justify-center px-5 py-10 text-center sm:py-12">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-slate-400 dark:border-slate-700 dark:bg-[#111F32] dark:text-slate-500">
            <Inbox size={26} strokeWidth={1.5} />
          </div>

          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            No hay trámites agregados
          </p>

          <p className="mt-1 max-w-[290px] text-xs leading-5 text-slate-400 dark:text-slate-500">
            Los trámites que selecciones aparecerán aquí para su revisión.
          </p>
        </div>
      ) : (
        <>

          {/* ==========================================
              TABLA DESKTOP / TABLET
          ========================================== */}

          <div className="hidden w-full overflow-x-auto md:block">
            <table className="w-full table-auto border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80 dark:border-slate-700 dark:bg-[#111F32]">
                  <th className="w-20 px-5 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    ID
                  </th>

                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Nombre del trámite
                  </th>

                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Tarifa
                  </th>

                  <th className="w-28 px-5 py-3 text-right text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Acción
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {tramites.map((item, index) => (
                  <tr
                    key={index}
                    className="transition-colors hover:bg-sky-50/40 dark:hover:bg-[#20334A]"
                  >
                    <td className="px-5 py-3">
                      <span className="inline-flex min-w-9 items-center justify-center rounded-lg bg-slate-100 px-2 py-1.5 text-xs font-bold text-slate-600 dark:bg-slate-700 dark:text-slate-200">
                        {item.id || index + 1}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <FileText
                          size={16}
                          className="shrink-0 text-[#00ABE4]"
                        />

                        <span className="text-[13px] font-semibold text-slate-800 dark:text-slate-100">
                          {item.nombre}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <span className="text-[13px] font-bold tabular-nums text-slate-700 dark:text-slate-200">
                        {item.tarifa}
                      </span>
                    </td>

                    <td className="px-5 py-2.5 text-right">
                      <button
                        type="button"
                        onClick={() => onRemove(index)}
                        aria-label={`Eliminar trámite ${item.nombre}`}
                        title="Eliminar trámite"
                        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-red-100 bg-red-50 px-3 text-xs font-semibold text-red-600 transition-colors hover:border-red-200 hover:bg-red-600 hover:text-white dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-600 dark:hover:text-white"
                      >
                        <Trash2 size={16} />
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ==========================================
              TARJETAS MOBILE
          ========================================== */}

          <div className="divide-y divide-slate-100 dark:divide-slate-700 md:hidden">
            {tramites.map((item, index) => (
              <div
                key={index}
                className="space-y-3 px-4 py-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-[#0095C5] dark:bg-sky-400/10 dark:text-sky-400">
                      <FileText size={19} />
                    </div>

                    <div className="min-w-0">
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                        <Hash size={12} />
                        {item.id || index + 1}
                      </span>

                      <p className="mt-1 break-words text-sm font-bold leading-5 text-slate-800 dark:text-slate-100">
                        {item.nombre}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onRemove(index)}
                    aria-label={`Eliminar trámite ${item.nombre}`}
                    title="Eliminar trámite"
                    className="flex h-11 w-11 shrink-0 touch-manipulation items-center justify-center rounded-xl border border-red-100 bg-red-50 text-red-600 transition-colors hover:bg-red-600 hover:text-white dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

                <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2.5 dark:bg-[#111F32]">
                  <span className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                    <ReceiptText size={15} />
                    Tarifa
                  </span>

                  <span className="text-sm font-bold tabular-nums text-slate-800 dark:text-slate-100">
                    {item.tarifa}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* ==========================================
              FOOTER
          ========================================== */}

          <div className="flex items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/50 px-4 py-3 dark:border-slate-700 dark:bg-[#111F32] sm:px-5">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Total de trámites
            </span>

            <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
              {tramites.length}
            </span>
          </div>
        </>
      )}
    </div>
  );
}
