
import {
  CarFront, UserRound, AlertTriangle,
  Eye, FileText, ArrowUpRight
} from "lucide-react";
import { motion as Motion, useReducedMotion } from "framer-motion";
import StatusBadge from "./StatusBadge";

export default function QueryCard({ item, onViewDetail }) {
  const reduceMotion = useReducedMotion();

  const status = item.ok ? "success" : "error";
  const label = item.ok
    ? "Consultada exitosamente"
    : "Sin información encontrada";

  const vehiculo = item.datos_vehiculo;
  const propietario = item.propietario;

  const datosVehiculo = vehiculo
    ? [
        ["Marca", vehiculo.marca],
        ["Línea", vehiculo.linea],
        ["Modelo", vehiculo.modelo],
        ["Servicio", vehiculo.servicio]
      ]
    : [];

  return (
    <Motion.article
      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="
        group flex h-full min-w-0 flex-col overflow-hidden
        rounded-2xl border border-slate-200 bg-white
        shadow-sm transition-[border-color,box-shadow] duration-200
        hover:border-sky-200 hover:shadow-md
        dark:border-slate-700 dark:bg-[#172539]
        dark:hover:border-slate-600
      "
    >

      {/* ==========================================
          PLACA Y ESTADO
      ========================================== */}

      <div className="border-b border-slate-100 px-4 py-4 dark:border-slate-700">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-[#0095C5] dark:bg-sky-400/10 dark:text-sky-400">
            <CarFront size={22} />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
              Placa del vehículo
            </p>

            <h3 className="mt-0.5 break-words text-[23px] font-extrabold leading-tight tracking-wide text-slate-900 dark:text-slate-100">
              {item.placa}
            </h3>
          </div>
        </div>

        <div className="mt-3">
          <StatusBadge status={status}>
            {label}
          </StatusBadge>
        </div>
      </div>

      {/* ==========================================
          CONTENIDO
      ========================================== */}

      <div className="flex flex-1 flex-col gap-3 px-4 py-4">

        {/* ERROR DE CONSULTA */}

        {item.error && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-xl border border-red-100 bg-red-50 p-3 dark:border-red-500/20 dark:bg-red-500/10"
          >
            <AlertTriangle
              size={17}
              className="mt-0.5 shrink-0 text-red-600 dark:text-red-400"
            />

            <p className="min-w-0 break-words text-xs leading-5 text-red-700 dark:text-red-300">
              {item.error}
            </p>
          </div>
        )}

        {/* DATOS DEL PROPIETARIO */}

        {propietario && (
          <section className="rounded-xl border border-slate-100 bg-slate-50/80 p-3 dark:border-slate-700 dark:bg-[#111F32]">
            <div className="mb-2 flex items-center gap-2">
              <UserRound
                size={16}
                className="shrink-0 text-[#0095C5] dark:text-sky-400"
              />

              <p className="text-[11px] font-bold text-slate-700 dark:text-slate-200">
                Propietario
              </p>
            </div>

            <p
              className="break-words text-[13px] font-semibold leading-5 text-slate-800 dark:text-slate-100"
              title={propietario.nombre_completo || undefined}
            >
              {propietario.nombre_completo || "No disponible"}
            </p>

            <div className="mt-1.5 flex min-w-0 items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
              <FileText size={13} className="shrink-0" />

              <span className="min-w-0 break-words">
                {propietario.tipo_documento}{" "}
                {propietario.numero_documento}
              </span>
            </div>
          </section>
        )}

        {/* INFORMACIÓN DEL VEHÍCULO */}

        {vehiculo && (
          <section>
            <div className="mb-2 flex items-center gap-2">
              <CarFront
                size={15}
                className="text-[#0095C5] dark:text-sky-400"
              />

              <p className="text-[11px] font-bold text-slate-700 dark:text-slate-200">
                Información del vehículo
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {datosVehiculo.map(([titulo, valor]) => (
                <div
                  key={titulo}
                  className="min-w-0 rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2.5 dark:border-slate-700 dark:bg-[#111F32]"
                >
                  <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
                    {titulo}
                  </p>

                  <p
                    className="mt-1 break-words text-xs font-bold leading-5 text-slate-800 dark:text-slate-100"
                    title={
                      typeof valor === "string"
                        ? valor
                        : undefined
                    }
                  >
                    {valor || "N/D"}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ESPACIADOR PARA ALINEAR BOTONES */}

        <div className="flex-1" />
      </div>

      {/* ==========================================
          BOTÓN DE DETALLE
      ========================================== */}

      <div className="border-t border-slate-100 px-4 py-3 dark:border-slate-700">
        <button
          type="button"
          onClick={() => onViewDetail(item)}
          className="
            flex min-h-11 w-full touch-manipulation
            items-center justify-center gap-2
            rounded-xl bg-[#00ABE4] px-4
            text-xs font-bold text-white
            shadow-sm transition-colors
            hover:bg-[#0095C5]
          "
        >
          <Eye size={17} />

          <span>Ver detalle</span>

          <ArrowUpRight size={15} />
        </button>
      </div>
    </Motion.article>
  );
}
