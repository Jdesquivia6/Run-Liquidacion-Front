
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import Swal from "sweetalert2";
import {
  Printer, Save, TestTube, Plus, Trash2, ScanSearch,
  CheckCircle2, RefreshCw, Loader2, Settings2, AlertTriangle,
  Wifi, Search, X, CircleCheck, Info
} from "lucide-react";

import {
  obtenerConfigImpresora,
  guardarConfigImpresora,
  listarImpresoras,
  listarImpresorasDisponibles,
  agregarImpresora,
  eliminarImpresora,
  activarImpresora
} from "../services/configApi";

import { API_BASE } from "../services/liquidacionApi";

// ======================================================
// CONFIGURACIÓN Y ESTILOS
// ======================================================

const CARD = "rounded-2xl border border-slate-200 bg-white shadow-sm";

const BTN = "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm";

const PRIMARY = `${BTN} bg-[#00ABE4] text-white hover:bg-[#0095C5]`;
const OUTLINE = `${BTN} border border-slate-200 bg-white text-slate-600 hover:bg-slate-50`;

const INPUT = "h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-[#00ABE4] focus:ring-2 focus:ring-sky-100";

const normalizar = valor => String(valor || "").trim().toLocaleLowerCase("es-CO");

const errorApi = (error, mensaje) =>
  error?.response?.data?.error || error?.message || mensaje;

const respuestaFallida = (resp, mensaje) => {
  if (resp?.ok === false) {
    throw new Error(resp.error || resp.message || mensaje);
  }
  return resp;
};

// ======================================================
// INDICADORES
// ======================================================

function Indicador({ titulo, valor, icono: Icon, tipo = "blue" }) {
  const colores = {
    blue: "bg-sky-50 text-[#0095C5]",
    green: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600"
  };

  return (
    <div className={`${CARD} flex min-w-0 items-center gap-3 p-4`}>
      <div className={`hidden h-11 w-11 shrink-0 items-center justify-center rounded-xl sm:flex ${colores[tipo]}`}>
        <Icon size={21} />
      </div>

      <div className="min-w-0">
        <p className="text-xs text-slate-500">{titulo}</p>
        <p className="mt-1 truncate text-base font-bold text-slate-900 md:text-lg" title={String(valor)}>
          {valor}
        </p>
      </div>
    </div>
  );
}

// ======================================================
// VISTA PRINCIPAL
// ======================================================

export default function ConfiguracionImpresora() {
  const [printerName, setPrinterName] = useState("");
  const [autoPrint, setAutoPrint] = useState(false);
  const [autoPrintGuardado, setAutoPrintGuardado] = useState(false);

  const [impresoras, setImpresoras] = useState([]);
  const [activa, setActiva] = useState("");
  const [selectedPrinterId, setSelectedPrinterId] = useState("");

  const [nuevaImpresora, setNuevaImpresora] = useState("");
  const [disponibles, setDisponibles] = useState([]);
  const [mostrarDisponibles, setMostrarDisponibles] = useState(false);
  const [busqueda, setBusqueda] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [detectando, setDetectando] = useState(false);
  const [agregando, setAgregando] = useState(false);
  const [eliminandoId, setEliminandoId] = useState(null);

  const ocupado = saving || testing || detectando || agregando || eliminandoId !== null;

  // --------------------------------------------------
  // CARGAR CONFIGURACIÓN
  // --------------------------------------------------

  const cargarTodo = useCallback(async () => {
    try {
      setLoading(true);

      const [configResp, listaResp] = await Promise.all([
        obtenerConfigImpresora(),
        listarImpresoras()
      ]);

      respuestaFallida(configResp, "Error consultando configuración");
      respuestaFallida(listaResp, "Error consultando impresoras");

      const config = configResp?.data || {};
      const lista = listaResp?.data || {};

      const registradas = Array.isArray(lista.impresoras)
        ? lista.impresoras
        : [];

      const nombreActivo = lista.activa || config.printer_name || "";

      setPrinterName(config.printer_name || "");
      setAutoPrint(Boolean(config.auto_print));
      setAutoPrintGuardado(Boolean(config.auto_print));
      setImpresoras(registradas);
      setActiva(nombreActivo);

      const seleccionada = registradas.find(
        p => p.nombre === nombreActivo
      );

      setSelectedPrinterId(
        seleccionada ? String(seleccionada.id) : ""
      );
    } catch (error) {
      console.error("Error cargando configuración:", error);
      toast.error(errorApi(error, "Error cargando configuración"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarTodo();
  }, [cargarTodo]);

  const recargarLista = async () => {
    const resp = await listarImpresoras();
    respuestaFallida(resp, "No se pudieron cargar las impresoras");

    const lista = Array.isArray(resp?.data?.impresoras)
      ? resp.data.impresoras
      : [];

    const activaActual = resp?.data?.activa || "";

    setImpresoras(lista);
    setActiva(activaActual);

    setSelectedPrinterId(actual => {
      if (actual && lista.some(p => String(p.id) === actual)) {
        return actual;
      }

      const seleccionada = lista.find(
        p => p.nombre === activaActual
      );

      return seleccionada ? String(seleccionada.id) : "";
    });

    return lista;
  };

  // --------------------------------------------------
  // ESTADÍSTICAS Y FILTROS
  // --------------------------------------------------

  const seleccionada = useMemo(
    () => impresoras.find(
      p => String(p.id) === selectedPrinterId
    ),
    [impresoras, selectedPrinterId]
  );

  const impresorasFiltradas = useMemo(() => {
    const texto = normalizar(busqueda);

    return impresoras.filter(p =>
      normalizar(p.nombre).includes(texto)
    );
  }, [impresoras, busqueda]);

  const hayCambios = Boolean(
    autoPrint !== autoPrintGuardado ||
    (seleccionada && seleccionada.nombre !== activa)
  );

  // --------------------------------------------------
  // GUARDAR
  // --------------------------------------------------

  const handleGuardar = async () => {
    if (ocupado) return;

    const nombreFinal = seleccionada?.nombre || printerName;

    if (!nombreFinal) {
      toast.error("Seleccione una impresora antes de guardar");
      return;
    }

    try {
      setSaving(true);

      // Mantiene los dos servicios del flujo original.
      if (seleccionada) {
        const respActivacion = await activarImpresora(
          seleccionada.id
        );

        respuestaFallida(
          respActivacion,
          "No se pudo activar la impresora"
        );
      }

      const respGuardar = await guardarConfigImpresora({
        printer_name: nombreFinal,
        auto_print: autoPrint
      });

      respuestaFallida(
        respGuardar,
        "No se pudo guardar la configuración"
      );

      setPrinterName(nombreFinal);
      setActiva(nombreFinal);
      setAutoPrintGuardado(autoPrint);

      await recargarLista();

      toast.success("Configuración guardada correctamente");
    } catch (error) {
      console.error("Error guardando impresora:", error);

      toast.error(
        errorApi(error, "Error guardando configuración")
      );
    } finally {
      setSaving(false);
    }
  };

  // --------------------------------------------------
  // PRUEBA DEL SERVICIO DE IMPRESIÓN
  // --------------------------------------------------

  const handleProbarImpresion = async () => {
    if (ocupado) return;

    if (!activa && !printerName) {
      toast.error("Configure primero una impresora");
      return;
    }

    try {
      setTesting(true);

      const resp = await fetch(`${API_BASE}/imprimir-pdfs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          fileNames: []
        })
      });

      let data = {};

      try {
        data = await resp.json();
      } catch {
        // Algunos servidores no devuelven JSON.
      }

      if (!resp.ok || data.ok === false || Number(data.fallidas || 0) > 0) {
        throw new Error(
          data.errores?.[0] ||
          data.error ||
          `Error del servicio (${resp.status})`
        );
      }

      toast.success(
        "Servicio de impresión respondió correctamente. No se imprimió una hoja de prueba."
      );
    } catch (error) {
      console.error("Error probando impresión:", error);

      toast.error(
        error.message || "No se pudo conectar al servicio de impresión"
      );
    } finally {
      setTesting(false);
    }
  };

  // --------------------------------------------------
  // AGREGAR IMPRESORA MANUAL
  // --------------------------------------------------

  const handleAgregarManual = async () => {
    if (ocupado) return;

    const nombre = nuevaImpresora.trim();

    if (!nombre) {
      toast.error("Escriba el nombre de la impresora");
      return;
    }

    if (impresoras.some(
      p => normalizar(p.nombre) === normalizar(nombre)
    )) {
      toast.error("Esta impresora ya está registrada");
      return;
    }

    try {
      setAgregando(true);

      const resp = await agregarImpresora(nombre);

      respuestaFallida(
        resp,
        "No se pudo agregar la impresora"
      );

      setNuevaImpresora("");
      await recargarLista();

      toast.success(`Impresora "${nombre}" agregada correctamente`);
    } catch (error) {
      console.error("Error agregando impresora:", error);

      toast.error(
        errorApi(error, "Error agregando impresora")
      );
    } finally {
      setAgregando(false);
    }
  };

  // --------------------------------------------------
  // AGREGAR IMPRESORA DETECTADA
  // --------------------------------------------------

  const handleAgregarDisponible = async nombre => {
    if (ocupado) return;

    if (impresoras.some(
      p => normalizar(p.nombre) === normalizar(nombre)
    )) {
      toast.error("La impresora ya está registrada");
      return;
    }

    try {
      setAgregando(true);

      const resp = await agregarImpresora(nombre);

      respuestaFallida(
        resp,
        "No se pudo registrar la impresora"
      );

      const actualizadas = await recargarLista();

      setDisponibles(prev => prev.filter(
        n => normalizar(n) !== normalizar(nombre) &&
          !actualizadas.some(
            p => normalizar(p.nombre) === normalizar(n)
          )
      ));

      toast.success(`Impresora "${nombre}" agregada`);
    } catch (error) {
      console.error("Error registrando impresora:", error);

      toast.error(
        errorApi(error, "Error registrando impresora")
      );
    } finally {
      setAgregando(false);
    }
  };

  // --------------------------------------------------
  // DETECTAR IMPRESORAS DE WINDOWS
  // --------------------------------------------------

  const handleDetectar = async () => {
    if (ocupado) return;

    try {
      setDetectando(true);

      const resp = await listarImpresorasDisponibles();

      respuestaFallida(
        resp,
        "No se pudieron detectar impresoras"
      );

      const detectadas = Array.isArray(resp?.data)
        ? resp.data
        : [];

      const registradas = new Set(
        impresoras.map(p => normalizar(p.nombre))
      );

      const nuevas = [
        ...new Set(
          detectadas
            .filter(n => typeof n === "string" && n.trim())
            .filter(n => !registradas.has(normalizar(n)))
        )
      ];

      setDisponibles(nuevas);
      setMostrarDisponibles(true);

      if (!nuevas.length) {
        toast(
          "No hay impresoras nuevas para registrar"
        );
      }
    } catch (error) {
      console.error("Error detectando impresoras:", error);

      toast.error(
        errorApi(error, "No se pudieron detectar impresoras")
      );
    } finally {
      setDetectando(false);
    }
  };

  // --------------------------------------------------
  // ELIMINAR CON CONFIRMACIÓN
  // --------------------------------------------------

  const handleEliminar = async impresora => {
    if (ocupado) return;

    const esActiva = impresora.nombre === activa;

    const confirmar = await Swal.fire({
      title: "Eliminar impresora",
      text: esActiva
        ? `La impresora "${impresora.nombre}" está activa. Si la elimina, deberá configurar otra impresora para continuar imprimiendo.`
        : `¿Desea eliminar la impresora "${impresora.nombre}" de la lista de registradas?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Eliminar impresora",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#DC2626",
      cancelButtonColor: "#64748B",
      reverseButtons: true,
      customClass: {
        popup: "rounded-2xl",
        confirmButton: "rounded-xl",
        cancelButton: "rounded-xl"
      }
    });

    if (!confirmar.isConfirmed) return;

    try {
      setEliminandoId(impresora.id);

      const resp = await eliminarImpresora(impresora.id);

      respuestaFallida(
        resp,
        "No se pudo eliminar la impresora"
      );

      if (esActiva) {
        setActiva("");
        setPrinterName("");
        setSelectedPrinterId("");
      } else if (String(impresora.id) === selectedPrinterId) {
        setSelectedPrinterId("");
      }

      await recargarLista();

      toast.success(
        `Impresora "${impresora.nombre}" eliminada`
      );
    } catch (error) {
      console.error("Error eliminando impresora:", error);

      toast.error(
        errorApi(error, "Error eliminando impresora")
      );
    } finally {
      setEliminandoId(null);
    }
  };

  // ====================================================
  // CARGANDO
  // ====================================================

  if (loading) {
    return (
      <div className="flex min-h-[350px] flex-col items-center justify-center gap-3">
        <Loader2
          size={30}
          className="animate-spin text-[#00ABE4]"
        />
        <p className="text-sm text-slate-500">
          Cargando configuración de impresoras...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#E9F1FA] px-4 pb-6 pt-2 md:px-6">
      <div className="mx-auto max-w-5xl space-y-4">

        {/* ENCABEZADO */}

        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#00ABE4] to-[#0095C5] px-6 py-5 text-white shadow-lg md:px-8">
          <Printer
            size={110}
            className="pointer-events-none absolute right-6 top-1/2 hidden -translate-y-1/2 opacity-15 md:block"
          />

          <div className="relative z-10">
            <p className="flex items-center gap-2 text-xs font-semibold tracking-wide text-sky-100">
              <Settings2 size={15} />
              CONFIGURACIÓN
            </p>

            <h1 className="mt-2 text-2xl font-bold tracking-tight md:text-3xl">
              Configuración de impresoras
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-sky-50">
              Administra tus impresoras y configura la impresión
              de liquidaciones RUNT.
            </p>
          </div>
        </section>

        {/* INDICADORES */}

        <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Indicador
            titulo="Impresoras registradas"
            valor={impresoras.length}
            icono={Printer}
            tipo="blue"
          />

          <Indicador
            titulo="Impresora activa"
            valor={activa || "Sin configurar"}
            icono={CheckCircle2}
            tipo="green"
          />

          <Indicador
            titulo="Autoimpresión"
            valor={autoPrintGuardado ? "Activada" : "Desactivada"}
            icono={Wifi}
            tipo="amber"
          />
        </section>

        {/* CONFIGURACIÓN PRINCIPAL */}

        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-3">

          <div className="space-y-4 lg:col-span-2">

            {/* SELECCIONAR IMPRESORA */}

            <section className={`${CARD} p-4 md:p-5`}>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
                    <Printer size={17} className="text-[#00ABE4]" />
                    Seleccionar impresora
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    Seleccione la impresora que utilizará AutoCore.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={cargarTodo}
                  disabled={ocupado}
                  className={OUTLINE}
                >
                  <RefreshCw size={15} />
                  Actualizar
                </button>
              </div>

              <label className="mb-2 block text-xs font-semibold text-slate-600">
                Impresora predeterminada
              </label>

              <select
                value={selectedPrinterId}
                disabled={ocupado || !impresoras.length}
                onChange={e =>
                  setSelectedPrinterId(e.target.value)
                }
                className={INPUT}
              >
                <option value="">
                  Seleccione una impresora
                </option>

                {impresoras.map(p => (
                  <option
                    key={p.id}
                    value={String(p.id)}
                  >
                    {p.nombre}
                    {p.nombre === activa ? " (Activa)" : ""}
                  </option>
                ))}
              </select>

              <div className="mt-3 flex items-start gap-2 rounded-xl bg-sky-50 p-3">
                <Info
                  size={16}
                  className="mt-0.5 shrink-0 text-[#0095C5]"
                />

                <p className="text-xs leading-relaxed text-slate-600">
                  Seleccione una impresora y guarde los cambios para
                  establecerla como activa.
                </p>
              </div>
            </section>

            {/* IMPRESORAS REGISTRADAS */}

            <section className={`${CARD} p-4 md:p-5`}>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    Impresoras registradas
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    {impresoras.length} impresoras en AutoCore
                  </p>
                </div>

                <div className="relative w-full sm:w-56">
                  <Search
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    type="text"
                    value={busqueda}
                    onChange={e => setBusqueda(e.target.value)}
                    placeholder="Buscar impresora..."
                    className={`${INPUT} !h-10 pl-9 pr-9 text-xs`}
                  />

                  {busqueda && (
                    <button
                      type="button"
                      onClick={() => setBusqueda("")}
                      aria-label="Limpiar búsqueda"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>

              {!impresorasFiltradas.length ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
                  <Printer
                    size={28}
                    className="mx-auto mb-3 text-slate-300"
                  />

                  <p className="text-sm font-medium text-slate-600">
                    {impresoras.length
                      ? "No se encontraron impresoras"
                      : "No hay impresoras registradas"}
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    {impresoras.length
                      ? "Intente con otro nombre"
                      : "Agregue una manualmente o detecte las de Windows"}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {impresorasFiltradas.map(p => {
                    const esActiva = p.nombre === activa;
                    const esSeleccionada =
                      String(p.id) === selectedPrinterId;

                    return (
                      <div
                        key={p.id}
                        className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3 transition-colors ${
                          esSeleccionada
                            ? "border-sky-200 bg-sky-50/50"
                            : "border-slate-200 bg-white hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                            esActiva
                              ? "bg-emerald-50 text-emerald-600"
                              : "bg-slate-100 text-slate-500"
                          }`}>
                            <Printer size={19} />
                          </div>

                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-900">
                              {p.nombre}
                            </p>

                            <div className="mt-1 flex flex-wrap gap-1.5">
                              {esActiva && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                                  <CircleCheck size={11} />
                                  Activa
                                </span>
                              )}

                              {esSeleccionada && !esActiva && (
                                <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-semibold text-[#0095C5]">
                                  Seleccionada
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          disabled={ocupado}
                          title={`Eliminar ${p.nombre}`}
                          onClick={() => handleEliminar(p)}
                          className="rounded-lg bg-red-50 p-2 text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50"
                        >
                          {eliminandoId === p.id ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <Trash2 size={16} />
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* AGREGAR MANUAL Y DETECTAR */}

            <section className={`${CARD} p-4 md:p-5`}>
              <div className="mb-4">
                <h2 className="text-sm font-bold text-slate-900">
                  Agregar impresoras
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Registre una impresora manualmente o detecte las
                  instaladas en Windows.
                </p>
              </div>

              <label className="mb-2 block text-xs font-semibold text-slate-600">
                Nombre de la impresora
              </label>

              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  type="text"
                  value={nuevaImpresora}
                  disabled={ocupado}
                  onChange={e =>
                    setNuevaImpresora(e.target.value)
                  }
                  onKeyDown={e => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAgregarManual();
                    }
                  }}
                  placeholder="Nombre exacto en Windows"
                  className={INPUT}
                />

                <button
                  type="button"
                  onClick={handleAgregarManual}
                  disabled={ocupado || !nuevaImpresora.trim()}
                  className={PRIMARY}
                >
                  {agregando ? (
                    <Loader2
                      size={16}
                      className="animate-spin"
                    />
                  ) : (
                    <Plus size={16} />
                  )}

                  Agregar
                </button>
              </div>

              <div className="mt-4 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={handleDetectar}
                  disabled={ocupado}
                  className={OUTLINE}
                >
                  {detectando ? (
                    <Loader2
                      size={16}
                      className="animate-spin"
                    />
                  ) : (
                    <ScanSearch size={16} />
                  )}

                  {detectando
                    ? "Detectando..."
                    : "Detectar impresoras de Windows"}
                </button>

                {mostrarDisponibles && (
                  <div className="mt-4">
                    <p className="mb-2 text-xs font-semibold text-slate-600">
                      Impresoras disponibles ({disponibles.length})
                    </p>

                    {disponibles.length ? (
                      <div className="flex flex-wrap gap-2">
                        {disponibles.map(nombre => (
                          <button
                            key={nombre}
                            type="button"
                            disabled={ocupado}
                            onClick={() =>
                              handleAgregarDisponible(nombre)
                            }
                            className="inline-flex items-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-semibold text-[#0095C5] hover:bg-sky-100 disabled:opacity-50"
                          >
                            <Plus size={14} />
                            {nombre}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="rounded-xl bg-slate-50 p-3 text-xs text-slate-500">
                        No hay impresoras nuevas para registrar.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* PANEL LATERAL */}

          <div className="space-y-4">
            <section className={`${CARD} p-4 md:p-5`}>
              <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <Settings2
                  size={17}
                  className="text-[#00ABE4]"
                />
                Opciones de impresión
              </h2>

              <div className="mt-5 flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900">
                    Impresión automática
                  </p>

                  <p className="mt-1 text-xs leading-relaxed text-slate-500">
                    Imprimir automáticamente cuando finalice
                    cada lote de liquidaciones.
                  </p>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={autoPrint}
                  aria-label="Impresión automática"
                  disabled={ocupado}
                  onClick={() =>
                    setAutoPrint(valor => !valor)
                  }
                  className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full p-1 transition-colors disabled:opacity-50 ${
                    autoPrint
                      ? "bg-[#00ABE4]"
                      : "bg-slate-300"
                  }`}
                >
                  <span className={`h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                    autoPrint
                      ? "translate-x-5"
                      : "translate-x-0"
                  }`} />
                </button>
              </div>

              <div className="mt-4 space-y-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={handleGuardar}
                  disabled={ocupado || (!seleccionada && !printerName)}
                  className={`${PRIMARY} w-full`}
                >
                  {saving ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Save size={16} />
                  )}

                  {saving
                    ? "Guardando..."
                    : "Guardar configuración"}
                </button>

                <button
                  type="button"
                  onClick={handleProbarImpresion}
                  disabled={ocupado || (!activa && !printerName)}
                  className={`${OUTLINE} w-full`}
                >
                  {testing ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <TestTube size={16} />
                  )}

                  {testing
                    ? "Verificando..."
                    : "Verificar servicio"}
                </button>
              </div>

              {hayCambios && (
                <p className="mt-3 flex items-center gap-2 text-xs font-medium text-amber-700">
                  <AlertTriangle size={14} />
                  Hay cambios pendientes por guardar.
                </p>
              )}
            </section>

            {/* AVISO */}

            <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <AlertTriangle
                size={18}
                className="mt-0.5 shrink-0 text-amber-600"
              />

              <div>
                <p className="text-xs font-bold text-amber-800">
                  Información de impresión
                </p>

                <p className="mt-2 text-xs leading-relaxed text-amber-700">
                  AutoCore puede trabajar con impresoras locales
                  USB y de red, siempre que sean accesibles desde
                  el servicio de impresión configurado.
                </p>

                <p className="mt-2 text-xs leading-relaxed text-amber-700">
                  Registre cada impresora una sola vez.
                  La detección de Windows corresponde al equipo
                  donde se ejecuta el servicio de impresión.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
