
import { useCallback, useEffect, useMemo, useState } from "react";
import ExcelJS from "exceljs";
import {
  Download, RefreshCw, CalendarDays, Clock3, TrendingUp,
  CheckCircle2, AlertCircle, Search, CarFront, MapPin,
  LayoutDashboard, ChevronRight, ChevronLeft, Database,
  BarChart3, FileText, Info, Filter, Activity, Loader2
} from "lucide-react";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer
} from "recharts";
import toast from "react-hot-toast";
import {
  obtenerDashboard,
  exportarDashboardExcel
} from "../services/vehicleQueryApi";

// ======================================================
// CONFIGURACIÓN AUTOCORE
// ======================================================

const C = {
  primary: "#00ABE4",
  dark: "#0095C5",
  bg: "#E9F1FA",
  green: "#059669",
  blue: "#2563EB",
  amber: "#D97706",
  red: "#DC2626",
  violet: "#7C3AED"
};

const CARD = "rounded-2xl border border-slate-200 bg-white shadow-sm";
const BTN = "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm";
const numero = v => Number(v || 0).toLocaleString("es-CO");

const fechaISO = (date = new Date()) => {
  const partes = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Bogota",
    year: "numeric", month: "2-digit", day: "2-digit"
  }).formatToParts(date);
  const get = k => partes.find(p => p.type === k)?.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
};

const fechaHace30Dias = () => {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return fechaISO(d);
};

const formatearFecha = v => {
  if (!v) return "—";
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? "—" :
    d.toLocaleString("es-CO", {
      timeZone: "America/Bogota",
      dateStyle: "short", timeStyle: "short"
    });
};

const seguroExcel = v => {
  if (v === null || v === undefined) return "";
  const s = String(v);
  return /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
};

const calcularEstadisticas = (r = {}) => {
  const placas = {
    total: Number(r.total_placas || 0),
    exitosas: Number(r.consultas_exitosas || 0),
    pendientes: Number(r.pendientes_placas || 0),
    errores: 0
  };

  const vehiculos = {
    total: Number(r.datos_vehiculo_total || 0),
    exitosas: Number(r.datos_vehiculo_exitosos || 0),
    errores: Number(r.datos_vehiculo_fallidos || 0)
  };

  vehiculos.pendientes = Math.max(
    0, vehiculos.total - vehiculos.exitosas - vehiculos.errores
  );

  const ubicabilidad = {
    total: Number(r.total_ubicabilidad || 0),
    exitosas: Number(r.ubica_encontradas || 0),
    pendientes: Number(r.ubica_pendientes || 0),
    errores: Number(r.ubica_no_encontradas || 0)
  };

  const modulos = [placas, vehiculos, ubicabilidad];
  const sumar = campo => modulos.reduce((n, m) => n + m[campo], 0);
  const total = sumar("total");
  const exitosas = sumar("exitosas");

  return {
    placas, vehiculos, ubicabilidad, total, exitosas,
    pendientes: sumar("pendientes"),
    errores: sumar("errores"),
    porcentaje: total ? Math.min(100, exitosas / total * 100) : 0
  };
};

// ======================================================
// COMPONENTES
// ======================================================

function Indicador({ titulo, valor, icono: Icon, color = "sky" }) {
  const tonos = {
    sky: "bg-sky-50 text-sky-600",
    green: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    red: "bg-red-50 text-red-600",
    violet: "bg-violet-50 text-violet-600"
  };

  return (
    <div className={`${CARD} p-4`}>
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${tonos[color]}`}>
        <Icon size={20} />
      </div>
      <p className="mt-3 text-2xl font-bold text-slate-900">{valor}</p>
      <p className="mt-1 text-xs font-medium text-slate-500">{titulo}</p>
    </div>
  );
}

function MiniIndicador({ label, valor, color = "slate" }) {
  const tonos = {
    slate: "bg-[#E9F1FA] text-slate-800",
    green: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    red: "bg-red-50 text-red-700"
  };

  return (
    <div className={`min-w-0 rounded-lg p-2 text-center ${tonos[color]}`}>
      <p className="text-lg font-bold">{numero(valor)}</p>
      <p className="mt-1 text-[10px]">{label}</p>
    </div>
  );
}

function ModuloOperativo({ titulo, descripcion, icono: Icon, datos, color }) {
  return (
    <div className="rounded-xl border border-slate-200 p-3 transition-colors hover:border-sky-200">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="flex min-w-0 items-center gap-3 lg:w-[40%]">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${color}`}>
            <Icon size={19} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-900">{titulo}</p>
            <p className="text-[11px] text-slate-500">{descripcion}</p>
          </div>
        </div>
        <div className="grid flex-1 grid-cols-4 gap-1.5">
          <MiniIndicador label="Total" valor={datos.total} />
          <MiniIndicador label="OK" valor={datos.exitosas} color="green" />
          <MiniIndicador label="Pend." valor={datos.pendientes} color="amber" />
          <MiniIndicador label="Sin result." valor={datos.errores} color="red" />
        </div>
      </div>
    </div>
  );
}

function EstadoConsulta({ estado }) {
  const estilos = {
    exitosa: ["bg-emerald-50 text-emerald-700", CheckCircle2],
    pendiente: ["bg-amber-50 text-amber-700", Clock3],
    error: ["bg-red-50 text-red-700", AlertCircle]
  };
  const [clase, Icon] = estilos[estado] || estilos.pendiente;

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold ${clase}`}>
      <Icon size={12} />
      {estado === "exitosa" ? "Exitosa" :
       estado === "error" ? "Error" : "Pendiente"}
    </span>
  );
}

// ======================================================
// EXCEL CORPORATIVO - EXCELJS
// ======================================================

async function generarInformeDashboard(respuesta, params) {
  const stats = calcularEstadisticas(respuesta.resumen || {});
  const ultimas = respuesta.ultimasPlacas || [];
  const errores = respuesta.errores || [];

  const wb = new ExcelJS.Workbook();
  wb.creator = "AutoCore";
  wb.title = "Centro de Inteligencia Vehicular";
  wb.subject = "Informe gerencial del Dashboard";
  wb.created = new Date();

  const E = {
    azul: "FF0095C5",
    cyan: "FF00ABE4",
    blanco: "FFFFFFFF",
    fondo: "FFE9F1FA",
    alterno: "FFF2F8FC",
    texto: "FF1E293B",
    gris: "FF64748B",
    borde: "FFE2E8F0",
    verde: "FF047857",
    verdeBg: "FFD1FAE5",
    rojo: "FFB91C1C",
    rojoBg: "FFFEE2E2",
    amber: "FFB45309",
    amberBg: "FFFEF3C7"
  };

  const relleno = (celda, color) => {
    celda.fill = {
      type: "pattern", pattern: "solid",
      fgColor: { argb: color }
    };
  };

  const periodo = params.fechaInicio && params.fechaFin
    ? `${params.fechaInicio} al ${params.fechaFin}`
    : "Histórico general sin filtro";

  const crearHoja = (nombre, titulo, columnas) => {
    const ws = wb.addWorksheet(nombre, {
      views: [{ state: "frozen", ySplit: 6 }]
    });

    ws.columns = columnas.map(([label, width]) => ({ width }));
    const ultima = ws.getColumn(columnas.length).letter;

    ws.mergeCells(`A1:${ultima}2`);
    const c1 = ws.getCell("A1");
    c1.value = `AUTOCORE  |  ${titulo.toUpperCase()}`;
    c1.font = {
      name: "Aptos Display", size: 17,
      bold: true, color: { argb: E.blanco }
    };
    relleno(c1, E.azul);
    c1.alignment = { vertical: "middle", indent: 1 };
    ws.getRow(1).height = 24;
    ws.getRow(2).height = 24;

    ws.mergeCells(`A3:${ultima}3`);
    const c3 = ws.getCell("A3");
    c3.value = `PERÍODO: ${periodo}`;
    c3.font = { name: "Aptos", bold: true, size: 10, color: { argb: E.texto } };
    relleno(c3, E.fondo);
    c3.alignment = { vertical: "middle", indent: 1 };
    ws.getRow(3).height = 26;

    ws.mergeCells(`A4:${ultima}4`);
    const c4 = ws.getCell("A4");
    c4.value = `Generado: ${formatearFecha(new Date())}  |  Fuente: AutoCore Dashboard`;
    c4.font = { name: "Aptos", size: 10, color: { argb: E.gris } };
    c4.alignment = { vertical: "middle", indent: 1 };
    ws.getRow(4).height = 24;
    ws.getRow(5).height = 10;

    const headers = ws.getRow(6);
    headers.values = [undefined, ...columnas.map(([label]) => label)];
    headers.height = 31;
    headers.eachCell(celda => {
      relleno(celda, E.cyan);
      celda.font = { name: "Aptos", size: 10, bold: true, color: { argb: E.blanco } };
      celda.alignment = { vertical: "middle", wrapText: true };
      celda.border = { bottom: { style: "medium", color: { argb: E.azul } } };
    });

    return ws;
  };

  const agregarFila = (ws, valores, i, estadoCols = {}) => {
    const row = ws.addRow(valores.map(v =>
      typeof v === "number" ? v : seguroExcel(v)
    ));
    row.height = 24;

    row.eachCell({ includeEmpty: true }, (celda, n) => {
      relleno(celda, i % 2 === 0 ? E.blanco : E.alterno);
      celda.font = { name: "Aptos", size: 10, color: { argb: E.texto } };
      celda.alignment = { vertical: "middle" };
      celda.border = { bottom: { style: "hair", color: { argb: E.borde } } };

      const estado = estadoCols[n];
      if (estado) {
        const fondo = estado === "ok" ? E.verdeBg :
                      estado === "error" ? E.rojoBg : E.amberBg;
        const color = estado === "ok" ? E.verde :
                      estado === "error" ? E.rojo : E.amber;
        relleno(celda, fondo);
        celda.font = { name: "Aptos", size: 10, bold: true, color: { argb: color } };
      }
    });

    return row;
  };

  const cerrarTabla = (ws, cantidad, columnas) => {
    if (cantidad > 0) {
      ws.autoFilter = {
        from: "A6",
        to: `${ws.getColumn(columnas).letter}${6 + cantidad}`
      };
    }
    ws.pageSetup = {
      orientation: "landscape",
      fitToPage: true,
      fitToWidth: 1,
      paperSize: 9
    };
  };

  // HOJA 1 - RESUMEN EJECUTIVO

  const resumen = crearHoja("Resumen", "Resumen Ejecutivo", [
    ["Indicador", 38], ["Valor", 22], ["Descripción", 68]
  ]);

  const datosResumen = [
    ["Total general", stats.total, "Operaciones de placas, vehículos y ubicabilidad"],
    ["Exitosas", stats.exitosas, "Consultas exitosas registradas"],
    ["Pendientes", stats.pendientes, "Operaciones pendientes de consulta"],
    ["Sin resultado / errores", stats.errores, "Errores y direcciones no encontradas"],
    ["Tasa de éxito", `${stats.porcentaje.toFixed(1)}%`, "Porcentaje de operaciones exitosas"]
  ];

  datosResumen.forEach((f, i) => {
    const estado = i === 1 ? { 2: "ok" } :
                   i === 2 ? { 2: "pendiente" } :
                   i === 3 ? { 2: "error" } : {};
    agregarFila(resumen, f, i, estado);
  });
  cerrarTabla(resumen, datosResumen.length, 3);

  // HOJA 2 - MÓDULOS

  const modulos = crearHoja("Módulos", "Módulos Operativos", [
    ["Módulo", 33], ["Total", 17], ["Exitosas", 17],
    ["Pendientes", 19], ["Errores / No encontradas", 29],
    ["Tasa de éxito", 19]
  ]);

  [
    ["Consulta de Placas", stats.placas],
    ["Datos del Vehículo", stats.vehiculos],
    ["Ubicabilidad Personas", stats.ubicabilidad]
  ].forEach(([nombre, m], i) => {
    const tasa = m.total ? `${(m.exitosas / m.total * 100).toFixed(1)}%` : "0.0%";
    agregarFila(
      modulos,
      [nombre, m.total, m.exitosas, m.pendientes, m.errores, tasa],
      i,
      { 3: "ok", 4: "pendiente", 5: "error" }
    );
  });
  cerrarTabla(modulos, 3, 6);

  // HOJA 3 - CONSULTAS RECIENTES

  const consultas = crearHoja("Consultas", "Últimas Consultas", [
    ["Placa", 19], ["Estado", 18], ["Detalle", 55], ["Fecha", 26]
  ]);

  ultimas.forEach((r, i) => {
    const estado = r.estado_consulta === true ? "Exitosa" :
                   r.error_consulta ? "Error" : "Pendiente";
    const detalle = r.error_consulta ||
      (r.estado_datos_vehiculo === true ? "Datos vehículo OK" :
       r.estado_consulta === true ? "Consulta completada" : "Sin resultado");

    agregarFila(consultas, [
      r.placa, estado, detalle,
      formatearFecha(r.fecha_consulta_datos_vehiculo || r.fecha_consulta)
    ], i, { 2: estado === "Exitosa" ? "ok" :
                 estado === "Error" ? "error" : "pendiente" });
  });
  cerrarTabla(consultas, ultimas.length, 4);

  // HOJA 4 - ERRORES

  const hojaErrores = crearHoja("Errores", "Alertas y Errores", [
    ["Placa", 19], ["Descripción del error", 76], ["Fecha", 26]
  ]);

  errores.forEach((r, i) => {
    agregarFila(hojaErrores, [
      r.placa,
      r.error_consulta || "Error no especificado",
      formatearFecha(r.fecha_consulta)
    ], i, { 2: "error" });
  });
  cerrarTabla(hojaErrores, errores.length, 3);

  // DESCARGA

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `AutoCore_Dashboard_${fechaISO()}.xlsx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ======================================================
// DASHBOARD
// ======================================================

export default function Dashboard() {
  const [modoFiltrado, setModoFiltrado] = useState(false);
  const [fechaInicio, setFechaInicio] = useState(fechaHace30Dias);
  const [fechaFin, setFechaFin] = useState(fechaISO);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportandoInforme, setExportandoInforme] = useState(false);
  const [dashboard, setDashboard] = useState({
    resumen: {}, ultimasPlacas: [], errores: []
  });
  const [paginaConsultas, setPaginaConsultas] = useState(1);
  const [paginaErrores, setPaginaErrores] = useState(1);
  const [actualizadoEn, setActualizadoEn] = useState(null);

  const rangoValido = !modoFiltrado ||
    (Boolean(fechaInicio) && Boolean(fechaFin) &&
     fechaInicio <= fechaFin && fechaFin <= fechaISO());

  const cargarDashboard = useCallback(async () => {
    if (!rangoValido) return;
    try {
      setLoading(true);
      const params = modoFiltrado ? { fechaInicio, fechaFin } : {};
      const data = await obtenerDashboard(params);
      if (data?.ok === false) throw new Error(data.error || "Error consultando dashboard");
      setDashboard({
        resumen: data?.resumen || {},
        ultimasPlacas: data?.ultimasPlacas || [],
        errores: data?.errores || []
      });
      setPaginaConsultas(1);
      setPaginaErrores(1);
      setActualizadoEn(new Date());
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.error || err.message || "Error de conexión");
    } finally {
      setLoading(false);
    }
  }, [modoFiltrado, fechaInicio, fechaFin, rangoValido]);

  useEffect(() => {
    cargarDashboard();
  }, [cargarDashboard]);

  const estadisticas = useMemo(
    () => calcularEstadisticas(dashboard.resumen),
    [dashboard.resumen]
  );

  const distribucion = [
    { name: "Placas OK", value: estadisticas.placas.exitosas, color: C.green },
    { name: "Vehículos OK", value: estadisticas.vehiculos.exitosas, color: C.blue },
    { name: "Ubicabilidad OK", value: estadisticas.ubicabilidad.exitosas, color: "#10B981" },
    { name: "Pendientes", value: estadisticas.pendientes, color: C.amber },
    { name: "Sin resultado / errores", value: estadisticas.errores, color: C.red }
  ];

  const exportarOriginal = async () => {
    if (!rangoValido) return toast.error("Selecciona fechas válidas");
    try {
      setExporting(true);
      await exportarDashboardExcel(
        modoFiltrado ? { fechaInicio, fechaFin } : {}
      );
      toast.success("Exportación iniciada");
    } catch (err) {
      toast.error(err?.response?.data?.error || err.message || "Error al exportar");
    } finally {
      setExporting(false);
    }
  };

  const exportarGerencial = async () => {
    if (!rangoValido) return toast.error("Selecciona fechas válidas");
    try {
      setExportandoInforme(true);
      const params = modoFiltrado ? { fechaInicio, fechaFin } : {};
      const data = await obtenerDashboard(params);
      if (data?.ok === false) throw new Error(data.error || "Error consultando dashboard");
      await generarInformeDashboard(data, params);
      toast.success("Informe gerencial generado correctamente");
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Error generando informe gerencial");
    } finally {
      setExportandoInforme(false);
    }
  };

  const porPagina = 5;
  const ultimas = dashboard.ultimasPlacas || [];
  const errores = dashboard.errores || [];
  const paginasConsultas = Math.max(1, Math.ceil(ultimas.length / porPagina));
  const paginasErrores = Math.max(1, Math.ceil(errores.length / porPagina));
  const consultasPagina = ultimas.slice((paginaConsultas - 1) * porPagina, paginaConsultas * porPagina);
  const erroresPagina = errores.slice((paginaErrores - 1) * porPagina, paginaErrores * porPagina);

  return (
    <div className="min-h-screen bg-[#E9F1FA] px-4 pb-6 pt-2 md:px-6">
      <div className="mx-auto max-w-[1600px] space-y-4">

        {/* ENCABEZADO */}

        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#00ABE4] to-[#0095C5] px-6 py-5 text-white shadow-lg md:px-8">
          <TrendingUp size={105} className="absolute right-5 top-4 opacity-15" />
          <div className="relative z-10">
            <p className="flex items-center gap-2 text-xs font-semibold text-sky-100">
              <Clock3 size={15} />
              {modoFiltrado ? "PERÍODO SELECCIONADO" : "TODOS LOS DATOS HISTÓRICOS"}
            </p>
            <h1 className="mt-2 text-2xl font-bold md:text-3xl">
              Centro de inteligencia vehicular
            </h1>
            <p className="mt-2 text-sm text-sky-50">
              Indicadores, rendimiento, errores y trazabilidad de las consultas.
            </p>
          </div>
        </section>

        {/* CONTROLES */}

        <section className={`${CARD} p-4`}>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setModoFiltrado(v => !v)}
                aria-pressed={modoFiltrado}
                className={`flex items-center gap-3 rounded-xl border px-4 py-2.5 text-left ${
                  modoFiltrado ? "border-sky-400 bg-sky-50" :
                    "border-slate-200 bg-white hover:border-sky-300"
                }`}
              >
                <CalendarDays size={19} className="text-[#00ABE4]" />
                <div>
                  <p className="text-sm font-bold text-slate-900">
                    {modoFiltrado ? "Modo filtrado" : "Modo global"}
                  </p>
                  <p className="text-xs text-slate-500">
                    {modoFiltrado ? "Período seleccionado" : "Sin filtro de fechas"}
                  </p>
                </div>
                <Filter size={15} className="text-slate-400" />
              </button>

              {modoFiltrado && (
                <div className="flex flex-wrap gap-2">
                  <div>
                    <label className="mb-1 block text-xs text-slate-500">Fecha inicio</label>
                    <input
                      type="date"
                      value={fechaInicio}
                      max={fechaFin || fechaISO()}
                      onChange={e => setFechaInicio(e.target.value)}
                      className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#00ABE4]"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-slate-500">Fecha fin</label>
                    <input
                      type="date"
                      value={fechaFin}
                      min={fechaInicio}
                      max={fechaISO()}
                      onChange={e => setFechaFin(e.target.value)}
                      className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#00ABE4]"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={cargarDashboard}
                disabled={loading || !rangoValido}
                className={`${BTN} bg-[#00ABE4] text-white hover:bg-[#0095C5]`}
              >
                <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                {loading ? "Actualizando..." : "Actualizar"}
              </button>

              <button
                type="button"
                onClick={exportarOriginal}
                disabled={exporting || !rangoValido}
                className={`${BTN} border border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50`}
              >
                {exporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                {exporting ? "Exportando..." : "Excel original"}
              </button>

              <button
                type="button"
                onClick={exportarGerencial}
                disabled={exportandoInforme || !rangoValido}
                className={`${BTN} bg-emerald-600 text-white hover:bg-emerald-700`}
              >
                {exportandoInforme ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
                {exportandoInforme ? "Generando..." : "Informe gerencial"}
              </button>
            </div>
          </div>

          {!rangoValido && (
            <p className="mt-3 text-xs font-semibold text-red-600">
              Selecciona un rango de fechas válido.
            </p>
          )}
        </section>

        {/* INDICADORES */}

        <section className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
          <Indicador titulo="Total general" valor={numero(estadisticas.total)} icono={BarChart3} color="sky" />
          <Indicador titulo="Exitosas" valor={numero(estadisticas.exitosas)} icono={CheckCircle2} color="green" />
          <Indicador titulo="Pendientes" valor={numero(estadisticas.pendientes)} icono={Clock3} color="amber" />
          <Indicador titulo="Sin resultado / errores" valor={numero(estadisticas.errores)} icono={AlertCircle} color="red" />
          <Indicador titulo="Tasa de éxito" valor={`${estadisticas.porcentaje.toFixed(1)}%`} icono={TrendingUp} color="violet" />
        </section>

        {/* MÓDULOS Y GRÁFICO */}

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <div className={`${CARD} p-4 md:p-5`}>
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-xl bg-sky-50 p-2.5 text-[#00ABE4]">
                <LayoutDashboard size={20} />
              </div>
              <div>
                <h2 className="font-bold text-slate-900">Módulos operativos</h2>
                <p className="text-xs text-slate-500">Estado de las consultas del sistema.</p>
              </div>
            </div>

            <div className="space-y-2.5">
              <ModuloOperativo
                titulo="Consulta de Placas"
                descripcion="Consultas de placas vehiculares."
                icono={Search}
                color="bg-sky-50 text-sky-600"
                datos={estadisticas.placas}
              />
              <ModuloOperativo
                titulo="Datos del Vehículo"
                descripcion="Información general de vehículos."
                icono={CarFront}
                color="bg-emerald-50 text-emerald-600"
                datos={estadisticas.vehiculos}
              />
              <ModuloOperativo
                titulo="Ubicabilidad Personas"
                descripcion="Consulta y ubicación de direcciones."
                icono={MapPin}
                color="bg-violet-50 text-violet-600"
                datos={estadisticas.ubicabilidad}
              />
            </div>
          </div>

          <div className={`${CARD} p-4 md:p-5`}>
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-xl bg-sky-50 p-2.5 text-[#00ABE4]">
                <Activity size={20} />
              </div>
              <div>
                <h2 className="font-bold text-slate-900">Distribución general</h2>
                <p className="text-xs text-slate-500">Operaciones por resultado.</p>
              </div>
            </div>

            <div className="flex flex-col items-center gap-4 md:flex-row">
              <div className="relative h-[225px] w-full md:w-[49%]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={distribucion.filter(d => d.value > 0)}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={66}
                      outerRadius={93}
                      paddingAngle={2}
                      startAngle={90}
                      endAngle={-270}
                    >
                      {distribucion.filter(d => d.value > 0).map(d => (
                        <Cell key={d.name} fill={d.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={v => numero(v)} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-3xl font-bold text-slate-900">{numero(estadisticas.total)}</p>
                  <p className="text-xs text-slate-500">Operaciones</p>
                </div>
              </div>

              <div className="w-full flex-1 space-y-3">
                {distribucion.map(d => (
                  <div key={d.name} className="flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: d.color }} />
                      <span className="text-slate-600">{d.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <strong>{numero(d.value)}</strong>
                      <span className="w-10 text-right text-slate-400">
                        {estadisticas.total ? `${Math.round(d.value / estadisticas.total * 100)}%` : "0%"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <p className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3 text-[11px] text-slate-500">
              <Info size={14} className="text-[#00ABE4]" />
              Resumen de los tres módulos operativos.
            </p>
          </div>
        </section>

        {/* CONSULTAS Y ERRORES */}

        <section className="grid grid-cols-1 items-start gap-4 xl:grid-cols-2">
          <div className={`${CARD} overflow-hidden`}>
            <div className="flex items-center justify-between p-4 md:px-5">
              <div className="flex items-center gap-2">
                <Clock3 size={19} className="text-[#00ABE4]" />
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Últimas consultas</h2>
                  <p className="text-[11px] text-slate-500">Consultas de placas recientes.</p>
                </div>
              </div>
              <span className="rounded-full bg-[#E9F1FA] px-3 py-1 text-xs">
                {ultimas.length} registros
              </span>
            </div>

            <div className="overflow-x-auto px-4 md:px-5">
              <table className="w-full min-w-[460px] text-xs">
                <thead className="bg-[#E9F1FA] text-slate-500">
                  <tr>
                    {["Placa", "Estado", "Detalle", "Fecha"].map(h => (
                      <th key={h} className="px-3 py-3 text-left">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {consultasPagina.map((r, i) => {
                    const estado = r.estado_consulta === true ? "exitosa" :
                                   r.error_consulta ? "error" : "pendiente";
                    const detalle = r.error_consulta ||
                      (r.estado_datos_vehiculo === true ? "Datos vehículo OK" :
                       r.estado_consulta === true ? "Consulta completada" : "Sin resultado");

                    return (
                      <tr key={`${r.placa}-${i}`} className="border-b border-slate-100">
                        <td className="px-3 py-3 font-bold text-slate-900">{r.placa || "—"}</td>
                        <td className="px-3 py-3"><EstadoConsulta estado={estado} /></td>
                        <td className="max-w-[170px] truncate px-3 py-3 text-slate-500" title={detalle}>
                          {detalle}
                        </td>
                        <td className="whitespace-nowrap px-3 py-3 text-slate-500">
                          {formatearFecha(r.fecha_consulta_datos_vehiculo || r.fecha_consulta)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {!consultasPagina.length && (
                <p className="py-10 text-center text-sm text-slate-400">Sin consultas registradas.</p>
              )}
            </div>

            {paginasConsultas > 1 && (
              <div className="flex items-center justify-between p-4">
                <span className="text-xs text-slate-500">
                  Página {paginaConsultas} de {paginasConsultas}
                </span>
                <div className="flex gap-2">
                  <button type="button" aria-label="Anterior"
                    disabled={paginaConsultas === 1}
                    onClick={() => setPaginaConsultas(p => p - 1)}
                    className="rounded-lg border border-slate-200 p-2 disabled:opacity-40">
                    <ChevronLeft size={15} />
                  </button>
                  <button type="button" aria-label="Siguiente"
                    disabled={paginaConsultas === paginasConsultas}
                    onClick={() => setPaginaConsultas(p => p + 1)}
                    className="rounded-lg border border-slate-200 p-2 disabled:opacity-40">
                    <ChevronRight size={15} />
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className={`${CARD} overflow-hidden`}>
            <div className="flex items-center justify-between p-4 md:px-5">
              <div className="flex items-center gap-2">
                <AlertCircle size={19} className="text-red-500" />
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Alertas y errores recientes</h2>
                  <p className="text-[11px] text-slate-500">Errores de datos del vehículo.</p>
                </div>
              </div>
              <span className="rounded-full bg-red-50 px-3 py-1 text-xs text-red-600">
                {errores.length}
              </span>
            </div>

            {!erroresPagina.length ? (
              <div className="flex flex-col items-center py-10">
                <CheckCircle2 size={28} className="text-emerald-500" />
                <p className="mt-3 text-sm font-semibold text-slate-700">Sin errores registrados</p>
                <p className="mt-1 text-xs text-slate-400">No hay errores para el período.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 px-4 md:px-5">
                {erroresPagina.map((r, i) => (
                  <div key={`${r.placa}-${i}`} className="flex gap-3 py-3">
                    <div className="mt-0.5 rounded-full bg-red-50 p-2 text-red-500">
                      <AlertCircle size={15} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900">
                        Error en consulta de {r.placa || "vehículo"}
                      </p>
                      <p className="mt-1 break-words text-xs text-slate-500">
                        {r.error_consulta || "Error no especificado"}
                      </p>
                      <p className="mt-1 text-[11px] text-slate-400">
                        {formatearFecha(r.fecha_consulta)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {paginasErrores > 1 && (
              <div className="flex items-center justify-between border-t border-slate-100 p-4">
                <span className="text-xs text-slate-500">
                  Página {paginaErrores} de {paginasErrores}
                </span>
                <div className="flex gap-2">
                  <button type="button" aria-label="Errores anteriores"
                    disabled={paginaErrores === 1}
                    onClick={() => setPaginaErrores(p => p - 1)}
                    className="rounded-lg border border-slate-200 p-2 disabled:opacity-40">
                    <ChevronLeft size={15} />
                  </button>
                  <button type="button" aria-label="Errores siguientes"
                    disabled={paginaErrores === paginasErrores}
                    onClick={() => setPaginaErrores(p => p + 1)}
                    className="rounded-lg border border-slate-200 p-2 disabled:opacity-40">
                    <ChevronRight size={15} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* PIE */}

        <div className="flex flex-wrap items-center justify-between gap-2 py-2 text-[11px] text-slate-500">
          <span className="flex items-center gap-2">
            <Database size={13} /> Datos obtenidos desde AutoCore
          </span>
          {actualizadoEn && (
            <span>Actualizado: {formatearFecha(actualizadoEn)}</span>
          )}
        </div>
      </div>
    </div>
  );
}
