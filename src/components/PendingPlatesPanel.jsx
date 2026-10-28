
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { motion as Motion } from "framer-motion";

import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Search,
  Loader2,
  Database,
  CheckSquare,
  Trash2,
  Play,
  Info,
  ClipboardList,
  Clock3,
  X,
} from "lucide-react";

import StatusBadge from "./StatusBadge";
import { listarPlacasPendientes } from "../services/vehicleQueryApi";

import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Navigation } from "swiper/modules";

import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";

// ========================================================
// CONFIGURACIÓN ORIGINAL
// ========================================================

const PAGE_SIZE = 10;
const QUERY_LIMIT = 100;

const DIAS_SEMANA = [
  "LU", "MA", "MI", "JU", "VI", "SA", "DO"
];

const MESES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

// ========================================================
// UTILIDADES DE FECHA
// ========================================================

function formatFechaColombia(fecha) {
  if (!fecha) return "N/D";

  const parsed = new Date(fecha);

  if (Number.isNaN(parsed.getTime())) {
    return "N/D";
  }

  return parsed.toLocaleString("es-CO", {
    timeZone: "America/Bogota",
  });
}

function getTodayColombia() {
  const partes = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const obtener = (tipo) =>
    partes.find((p) => p.type === tipo)?.value;

  return [
    obtener("year"),
    obtener("month"),
    obtener("day"),
  ].join("-");
}

function formatearFechaCorta(fecha) {
  if (!fecha) return "Seleccionar fecha";

  const [anio, mes, dia] = fecha.split("-");

  return `${dia}/${mes}/${anio}`;
}

function construirFecha(anio, mes, dia) {
  return [
    String(anio),
    String(mes + 1).padStart(2, "0"),
    String(dia).padStart(2, "0"),
  ].join("-");
}

// ========================================================
// CALENDARIO PERSONALIZADO
// SOLO PRESENTACIÓN DE FECHAS
// ========================================================

function CalendarInput({
  label,
  value,
  onChange,
  maxDate,
  minDate,
}) {
  const [abierto, setAbierto] = useState(false);

  const [mesVisible, setMesVisible] = useState(() => {
    const inicial = value || getTodayColombia();
    const [anio, mes] = inicial.split("-").map(Number);

    return {
      anio,
      mes: mes - 1,
    };
  });

  const contenedorRef = useRef(null);

  // Cerrar cuando se presiona fuera del calendario
  useEffect(() => {
    const cerrar = (event) => {
      if (
        contenedorRef.current &&
        !contenedorRef.current.contains(event.target)
      ) {
        setAbierto(false);
      }
    };

    const cerrarEscape = (event) => {
      if (event.key === "Escape") {
        setAbierto(false);
      }
    };

    document.addEventListener("mousedown", cerrar);
    document.addEventListener("keydown", cerrarEscape);

    return () => {
      document.removeEventListener("mousedown", cerrar);
      document.removeEventListener("keydown", cerrarEscape);
    };
  }, []);

  const abrirCalendario = () => {
    if (!abierto) {
      const inicial = value || getTodayColombia();
      const [anio, mes] = inicial.split("-").map(Number);

      setMesVisible({
        anio,
        mes: mes - 1,
      });
    }

    setAbierto(!abierto);
  };

  const cambiarMes = (direccion) => {
    setMesVisible((prev) => {
      const fecha = new Date(
        Date.UTC(prev.anio, prev.mes + direccion, 1)
      );

      return {
        anio: fecha.getUTCFullYear(),
        mes: fecha.getUTCMonth(),
      };
    });
  };

  const cambiarAnio = (direccion) => {
    setMesVisible((prev) => ({
      ...prev,
      anio: prev.anio + direccion,
    }));
  };

  const seleccionarFecha = (fecha) => {
    if (minDate && fecha < minDate) return;
    if (maxDate && fecha > maxDate) return;

    onChange(fecha);
    setAbierto(false);
  };

  const irHoy = () => {
    const hoy = getTodayColombia();

    if (
      (!minDate || hoy >= minDate) &&
      (!maxDate || hoy <= maxDate)
    ) {
      seleccionarFecha(hoy);
    }
  };

  // El calendario empieza los lunes
  const primerDia = new Date(
    Date.UTC(mesVisible.anio, mesVisible.mes, 1)
  );

  const desplazamiento =
    (primerDia.getUTCDay() + 6) % 7;

  const totalDias = new Date(
    Date.UTC(mesVisible.anio, mesVisible.mes + 1, 0)
  ).getUTCDate();

  const celdas = [];

  for (let i = 0; i < desplazamiento; i++) {
    celdas.push(null);
  }

  for (let dia = 1; dia <= totalDias; dia++) {
    celdas.push(dia);
  }

  const hoy = getTodayColombia();

  return (
    <div ref={contenedorRef} className="relative min-w-0">
      <label className="mb-2 flex items-center gap-2 text-xs font-bold text-slate-700">
        <CalendarDays
          size={15}
          className="text-[#00ABE4]"
        />
        {label}
      </label>

      {/* CAMPO DEL CALENDARIO */}

      <button
        type="button"
        onClick={abrirCalendario}
        aria-expanded={abierto}
        aria-haspopup="dialog"
        className={`
          flex h-12 w-full items-center justify-between
          rounded-xl border bg-white px-3.5
          text-sm text-slate-700
          transition-all duration-200
          ${
            abierto
              ? "border-[#00ABE4] ring-4 ring-sky-100"
              : "border-slate-200 hover:border-sky-300"
          }
        `}
      >
        <span className="flex items-center gap-2">
          <CalendarDays
            size={17}
            className="text-[#00ABE4]"
          />

          {formatearFechaCorta(value)}
        </span>

        <ChevronDown
          size={16}
          className={`text-slate-400 transition-transform ${
            abierto ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* CALENDARIO DESPLEGABLE */}

      {abierto && (
        <div
          role="dialog"
          aria-label={`Calendario de ${label}`}
          className="
            absolute left-0 top-full z-[100]
            mt-2 w-[292px] max-w-[calc(100vw-48px)]
            rounded-2xl border border-slate-200
            bg-white p-3 shadow-2xl
          "
        >
          {/* ENCABEZADO MES */}

          <div className="mb-3 flex items-center justify-between gap-1">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => cambiarAnio(-1)}
                aria-label="Año anterior"
                className="rounded-lg px-2 py-1 text-xs text-slate-500 hover:bg-slate-100"
              >
                -1
              </button>

              <h4 className="min-w-[126px] text-center text-sm font-bold capitalize text-slate-900">
                {MESES[mesVisible.mes]} {mesVisible.anio}
              </h4>

              <button
                type="button"
                onClick={() => cambiarAnio(1)}
                aria-label="Año siguiente"
                className="rounded-lg px-2 py-1 text-xs text-slate-500 hover:bg-slate-100"
              >
                +1
              </button>
            </div>

            <div className="flex items-center">
              <button
                type="button"
                onClick={() => cambiarMes(-1)}
                aria-label="Mes anterior"
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
              >
                <ChevronLeft size={16} />
              </button>

              <button
                type="button"
                onClick={() => cambiarMes(1)}
                aria-label="Mes siguiente"
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* NOMBRES DE LOS DÍAS */}

          <div className="mb-2 grid grid-cols-7 gap-1">
            {DIAS_SEMANA.map((dia) => (
              <div
                key={dia}
                className="py-1 text-center text-[10px] font-bold text-slate-400"
              >
                {dia}
              </div>
            ))}
          </div>

          {/* DÍAS DEL MES */}

          <div className="grid grid-cols-7 gap-1">
            {celdas.map((dia, index) => {
              if (dia === null) {
                return (
                  <div
                    key={`vacio-${index}`}
                    className="h-9"
                  />
                );
              }

              const fecha = construirFecha(
                mesVisible.anio,
                mesVisible.mes,
                dia
              );

              const seleccionado = fecha === value;
              const esHoy = fecha === hoy;

              const deshabilitado =
                (maxDate && fecha > maxDate) ||
                (minDate && fecha < minDate);

              return (
                <button
                  key={fecha}
                  type="button"
                  disabled={deshabilitado}
                  onClick={() => seleccionarFecha(fecha)}
                  aria-label={fecha}
                  aria-pressed={seleccionado}
                  className={`
                    flex h-9 items-center justify-center
                    rounded-lg text-xs font-semibold
                    transition-colors
                    disabled:cursor-not-allowed
                    disabled:text-slate-300

                    ${
                      seleccionado
                        ? "bg-[#00ABE4] text-white shadow-sm"
                        : esHoy
                        ? "bg-sky-50 text-[#0095C5]"
                        : "text-slate-700 hover:bg-sky-50 hover:text-[#0095C5]"
                    }
                  `}
                >
                  {dia}
                </button>
              );
            })}
          </div>

          {/* PIE DEL CALENDARIO */}

          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
            <button
              type="button"
              onClick={() => setAbierto(false)}
              className="rounded-lg px-3 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100"
            >
              Cerrar
            </button>

            <button
              type="button"
              onClick={irHoy}
              disabled={
                Boolean(
                  (maxDate && hoy > maxDate) ||
                  (minDate && hoy < minDate)
                )
              }
              className="
                rounded-lg bg-[#00ABE4]
                px-4 py-2 text-xs font-bold
                text-white hover:bg-[#0095C5]
                disabled:cursor-not-allowed
                disabled:opacity-40
              "
            >
              Hoy
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ========================================================
// COMPONENTE PRINCIPAL
// ========================================================

export default function PendingPlatesPanel({
  modulo = "consulta-placa",
  onSendToQuery,
  onAfterBatchCompleted,
}) {
  const today = getTodayColombia();

  // ESTADOS ORIGINALES

  const [fechaInicio, setFechaInicio] = useState(today);
  const [fechaFin, setFechaFin] = useState(today);
  const [estado, setEstado] = useState("pendientes");

  const [placas, setPlacas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [seleccionadas, setSeleccionadas] = useState([]);

  const esModuloDatosVehiculo =
    modulo === "datos-vehiculo";

  // ======================================================
  // CONSULTAR PLACAS
  // LÓGICA ORIGINAL
  // ======================================================

  const buscarPlacas = async (autoSelect = false) => {
    try {
      setLoading(true);

      const resp = await listarPlacasPendientes({
        fechaInicio,
        fechaFin,
        estado,
        modulo,
        limit: QUERY_LIMIT,
      });

      const data = resp.results || [];

      setPlacas(data);

      setSeleccionadas(
        autoSelect
          ? data.map((item) => item.placa)
          : []
      );

      toast.success(
        `Se cargaron ${data.length} placa(s). Máximo ${QUERY_LIMIT} por lote.`
      );
    } catch (error) {
      toast.error(
        error.response?.data?.error ||
          "Error cargando placas"
      );

      setSeleccionadas([]);
    } finally {
      setLoading(false);
    }
  };

  // ======================================================
  // REFRESCAR PENDIENTES
  // ======================================================

  const refrescarPendientes = async () => {
    await buscarPlacas(false);

    if (onAfterBatchCompleted) {
      onAfterBatchCompleted();
    }
  };

  // ======================================================
  // SELECCIÓN DE PLACAS
  // ======================================================

  const toggleSeleccion = (placa) => {
    setSeleccionadas((prev) =>
      prev.includes(placa)
        ? prev.filter((p) => p !== placa)
        : [...prev, placa]
    );
  };

  const seleccionarTodas = () => {
    setSeleccionadas(
      placas.map((item) => item.placa)
    );
  };

  const limpiarSeleccion = () => {
    setSeleccionadas([]);
  };

  // ======================================================
  // ENVIAR PLACAS A CONSULTA
  // ======================================================

  const enviarAConsulta = () => {
    if (seleccionadas.length === 0) {
      toast.error(
        "Debes seleccionar al menos una placa"
      );
      return;
    }

    if (seleccionadas.length > QUERY_LIMIT) {
      toast.error(
        `Solo puedes enviar máximo ${QUERY_LIMIT} placas por consulta`
      );
      return;
    }

    onSendToQuery({
      placas: seleccionadas,
      refrescarPendientes,
    });

    setSeleccionadas([]);
  };

  // ======================================================
  // PAGINACIÓN ORIGINAL
  // ======================================================

  const totalPaginas = Math.ceil(
    placas.length / PAGE_SIZE
  );

  const paginas = Array.from(
    { length: totalPaginas },
    (_, index) => {
      const start = index * PAGE_SIZE;
      const end = start + PAGE_SIZE;

      return placas.slice(start, end);
    }
  );

  // ======================================================
  // INTERFAZ
  // ======================================================

  return (
    <section
      className="
        relative
        space-y-4
        rounded-2xl
        border border-slate-200
        bg-white p-4
        shadow-sm md:p-5
      "
    >
      {/* ======================================
          ENCABEZADO Y FILTROS
      ====================================== */}

      <Motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50">
              <Search
                size={21}
                className="text-[#00ABE4]"
              />
            </div>

            <div>
              <h2 className="text-base font-bold text-slate-900 md:text-lg">
                {esModuloDatosVehiculo
                  ? "Buscar placas listas para datos vehículo"
                  : "Buscar placas pendientes por fecha"}
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                {esModuloDatosVehiculo
                  ? "Consulta las placas que tienen información del propietario y están listas para datos del vehículo."
                  : "Selecciona las fechas y el estado para consultar placas pendientes."}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1.5 self-start rounded-full bg-sky-50 px-3 py-2 text-[11px] font-semibold text-sky-700 sm:self-auto">
            <Info size={14} />
            Máximo {QUERY_LIMIT} placas por lote
          </div>
        </div>

        {/* FILTROS */}

        <div
          className={`grid grid-cols-1 items-end gap-3 sm:grid-cols-2 ${
            esModuloDatosVehiculo
              ? "lg:grid-cols-3"
              : "lg:grid-cols-4"
          }`}
        >
          <CalendarInput
            label="Fecha inicio"
            value={fechaInicio}
            onChange={setFechaInicio}
            maxDate={today}
          />

          <CalendarInput
            label="Fecha fin"
            value={fechaFin}
            onChange={setFechaFin}
            maxDate={today}
          />

          {!esModuloDatosVehiculo && (
            <div className="min-w-0">
              <label className="mb-2 flex items-center gap-2 text-xs font-bold text-slate-700">
                <ClipboardList
                  size={15}
                  className="text-[#00ABE4]"
                />
                Estado
              </label>

              <div className="relative">
                <select
                  value={estado}
                  onChange={(e) =>
                    setEstado(e.target.value)
                  }
                  className="
                    h-12 w-full
                    appearance-none rounded-xl
                    border border-slate-200
                    bg-white px-4 pr-10
                    text-sm text-slate-700
                    outline-none
                    transition-colors
                    hover:border-sky-300
                    focus:border-[#00ABE4]
                    focus:ring-4 focus:ring-sky-100
                  "
                >
                  <option value="pendientes">
                    Pendientes
                  </option>

                  <option value="consultadas">
                    Consultadas
                  </option>

                  <option value="todas">
                    Todas
                  </option>
                </select>

                <ChevronDown
                  size={17}
                  className="pointer-events-none absolute right-3 top-3.5 text-slate-400"
                />
              </div>
            </div>
          )}

          {/* BOTÓN BUSCAR */}

          <div>
            <button
              type="button"
              onClick={() => buscarPlacas(false)}
              disabled={loading}
              className="
                flex h-12 w-full
                items-center justify-center gap-2
                rounded-xl
                bg-[#00ABE4]
                px-4 text-sm font-bold
                text-white shadow-sm
                transition-all
                hover:bg-[#0095C5]
                hover:shadow-md
                disabled:cursor-not-allowed
                disabled:bg-slate-300
              "
            >
              {loading ? (
                <>
                  <Loader2
                    size={18}
                    className="animate-spin"
                  />
                  Buscando...
                </>
              ) : (
                <>
                  <Search size={18} />
                  Buscar lote
                </>
              )}
            </button>
          </div>
        </div>
      </Motion.div>

      {/* ======================================
          RESULTADOS DE BÚSQUEDA
      ====================================== */}

      {placas.length > 0 && (
        <>
          {/* BARRA DEL LOTE */}

          <Motion.div
            initial={{
              opacity: 0,
              y: 10,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.25,
            }}
            className="
              flex flex-col gap-3
              rounded-xl border
              border-sky-100
              bg-sky-50/70 p-3
              lg:flex-row
              lg:items-center
              lg:justify-between
            "
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
                <Database
                  size={20}
                  className="text-[#00ABE4]"
                />
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Lote actual: {placas.length} placa(s)
                </h3>

                <p className="mt-0.5 text-xs text-slate-500">
                  {seleccionadas.length} seleccionada(s).
                  Límite máximo: {QUERY_LIMIT}.
                </p>
              </div>
            </div>

            {/* ACCIONES DEL LOTE */}

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={seleccionarTodas}
                className="
                  flex items-center justify-center
                  gap-2 rounded-xl
                  border border-slate-200
                  bg-white px-3.5 py-2.5
                  text-xs font-semibold
                  text-slate-700
                  transition-colors
                  hover:border-[#00ABE4]
                  hover:text-[#0095C5]
                "
              >
                <CheckSquare size={16} />
                Seleccionar lote
              </button>

              <button
                type="button"
                onClick={limpiarSeleccion}
                className="
                  flex items-center justify-center
                  gap-2 rounded-xl
                  border border-slate-200
                  bg-white px-3.5 py-2.5
                  text-xs font-semibold
                  text-slate-600
                  transition-colors
                  hover:bg-slate-50
                "
              >
                <X size={16} />
                Limpiar
              </button>

              <button
                type="button"
                onClick={enviarAConsulta}
                className="
                  flex items-center justify-center
                  gap-2 rounded-xl
                  bg-[#00ABE4]
                  px-4 py-2.5
                  text-xs font-bold
                  text-white shadow-sm
                  transition-all
                  hover:bg-[#0095C5]
                "
              >
                <Play size={16} />

                {esModuloDatosVehiculo
                  ? "Consultar datos vehículo"
                  : "Consultar lote seleccionado"}
              </button>
            </div>
          </Motion.div>

          {/* ======================================
              TABLA DE PLACAS
          ====================================== */}

          <Motion.div
            initial={{
              opacity: 0,
              y: 10,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.25,
            }}
            className="
              rounded-2xl
              border border-slate-200
              bg-white p-3
              md:p-4
            "
          >
            <Swiper
              modules={[Pagination, Navigation]}
              pagination={{
                type: "progressbar",
                clickable: true,
              }}
              navigation
              spaceBetween={16}
              slidesPerView={1}
              className="
                pb-10
                [&_.swiper-pagination-progressbar-fill]:bg-[#00ABE4]
              "
            >
              {paginas.map((grupo, pageIndex) => (
                <SwiperSlide key={pageIndex}>
                  <div className="space-y-3">
                    {/* ENCABEZADO DE PÁGINA */}

                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Clock3
                          size={16}
                          className="text-[#00ABE4]"
                        />

                        <h3 className="text-sm font-bold text-slate-900">
                          Página {pageIndex + 1} de{" "}
                          {totalPaginas}
                        </h3>
                      </div>

                      <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                        {grupo.length} placa(s)
                      </span>
                    </div>

                    {/* TABLA */}

                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                      <table className="w-full min-w-[700px] text-xs">
                        <thead className="bg-[#E9F1FA] text-slate-600">
                          <tr>
                            <th className="w-[110px] px-3 py-3 text-left font-semibold">
                              Seleccionar
                            </th>

                            <th className="px-3 py-3 text-left font-semibold">
                              Placa
                            </th>

                            <th className="px-3 py-3 text-left font-semibold">
                              Estado
                            </th>

                            <th className="px-3 py-3 text-left font-semibold">
                              {esModuloDatosVehiculo
                                ? "Fecha propietario"
                                : "Fecha registro"}
                            </th>

                            <th className="px-3 py-3 text-left font-semibold">
                              {esModuloDatosVehiculo
                                ? "Datos vehículo"
                                : "Fecha consulta"}
                            </th>
                          </tr>
                        </thead>

                        <tbody>
                          {grupo.map((item) => {
                            const consultada =
                              item.estado_consulta === true;

                            const fechaPrincipal =
                              esModuloDatosVehiculo
                                ? item.fecha_consulta_propietario
                                : item.fecha_registro;

                            const seleccionada =
                              seleccionadas.includes(
                                item.placa
                              );

                            return (
                              <tr
                                key={item.id_consul_placa}
                                className={`
                                  border-t border-slate-100
                                  transition-colors

                                  ${
                                    seleccionada
                                      ? "bg-sky-50/60"
                                      : "hover:bg-slate-50"
                                  }
                                `}
                              >
                                {/* CHECKBOX */}

                                <td className="px-3 py-2.5">
                                  <input
                                    type="checkbox"
                                    checked={seleccionada}
                                    onChange={() =>
                                      toggleSeleccion(
                                        item.placa
                                      )
                                    }
                                    aria-label={`Seleccionar placa ${item.placa}`}
                                    className="
                                      h-4 w-4
                                      cursor-pointer
                                      rounded
                                      border-slate-300
                                      text-[#00ABE4]
                                      focus:ring-[#00ABE4]
                                    "
                                  />
                                </td>

                                {/* PLACA */}

                                <td className="px-3 py-2.5">
                                  <span className="font-bold text-slate-900">
                                    {item.placa}
                                  </span>
                                </td>

                                {/* ESTADO */}

                                <td className="px-3 py-2.5">
                                  <StatusBadge
                                    status={
                                      esModuloDatosVehiculo
                                        ? "info"
                                        : consultada
                                        ? "success"
                                        : "warning"
                                    }
                                  >
                                    {esModuloDatosVehiculo
                                      ? "Lista para datos"
                                      : consultada
                                      ? "Consultada"
                                      : "Pendiente"}
                                  </StatusBadge>
                                </td>

                                {/* FECHA PRINCIPAL */}

                                <td className="whitespace-nowrap px-3 py-2.5 text-slate-500">
                                  {formatFechaColombia(
                                    fechaPrincipal
                                  )}
                                </td>

                                {/* FECHA CONSULTA */}

                                <td className="whitespace-nowrap px-3 py-2.5 text-slate-500">
                                  {esModuloDatosVehiculo ? (
                                    <StatusBadge status="warning">
                                      Sin datos vehículo
                                    </StatusBadge>
                                  ) : consultada &&
                                    item.fecha_consulta ? (
                                    formatFechaColombia(
                                      item.fecha_consulta
                                    )
                                  ) : (
                                    <span className="text-slate-400">
                                      Sin consultar
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </Motion.div>
        </>
      )}
    </section>
  );
}
